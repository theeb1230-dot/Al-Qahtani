#!/usr/bin/env python3
"""Al-Qahtani zero-cost AI reviewer.

Deterministic checks are authoritative. AI review is advisory and may only
approve when deterministic gates are green. Gemini Free Tier is preferred;
OpenRouter's free router is the only network fallback. No paid model fallback.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "REVIEW_REPORT.md"
STATE = ROOT / "PROJECT_STATE.md"
MAX_DIFF_CHARS = int(os.getenv("AGENT_MAX_DIFF_CHARS", "50000"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

PROTECTED_PATTERNS = {
    "secret_in_diff": re.compile(r"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}"),
    "provider_url_in_flutter": re.compile(r"(?i)^\+.*https?://", re.MULTILINE),
}


def run(*args: str, check: bool = True) -> str:
    p = subprocess.run(args, cwd=ROOT, text=True, capture_output=True)
    if check and p.returncode:
        raise RuntimeError(f"{' '.join(args)} failed: {p.stderr.strip()}")
    return p.stdout.strip()


def event_name() -> str:
    return os.getenv("GITHUB_EVENT_NAME", "local")


def resolve_diff() -> tuple[str, str]:
    event_path = os.getenv("GITHUB_EVENT_PATH")
    payload: dict[str, Any] = {}
    if event_path and Path(event_path).exists():
        try:
            payload = json.loads(Path(event_path).read_text(encoding="utf-8"))
        except Exception:
            payload = {}
    if event_name() == "pull_request":
        base = payload.get("pull_request", {}).get("base", {}).get("sha")
        head = payload.get("pull_request", {}).get("head", {}).get("sha")
        if base and head:
            return f"{base}...{head}", run("git", "diff", "--no-ext-diff", "--unified=3", f"{base}...{head}")
    before = payload.get("before")
    after = payload.get("after") or os.getenv("GITHUB_SHA")
    zero = "0" * 40
    if before and after and before != zero:
        return f"{before}..{after}", run("git", "diff", "--no-ext-diff", "--unified=3", before, after)
    if run("git", "rev-list", "--count", "HEAD") != "1":
        return "HEAD^..HEAD", run("git", "diff", "--no-ext-diff", "--unified=3", "HEAD^", "HEAD")
    return "initial commit", run("git", "show", "--format=", "--no-ext-diff", "--unified=3", "HEAD")


def changed_files(diff_range: str) -> list[str]:
    if "..." in diff_range or ".." in diff_range:
        return [x for x in run("git", "diff", "--name-only", diff_range).splitlines() if x]
    return [x for x in run("git", "show", "--format=", "--name-only", "HEAD").splitlines() if x]


def deterministic_review(diff: str, files: list[str]) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    if not diff.strip(): findings.append({"severity":"INFO","code":"EMPTY_DIFF","message":"No reviewable source delta found."})
    if PROTECTED_PATTERNS["secret_in_diff"].search(diff): findings.append({"severity":"BLOCKER","code":"POSSIBLE_SECRET","message":"Possible credential literal added in diff. Secrets must remain in GitHub Secrets."})
    flutter_added = "\n".join(line for line in diff.splitlines() if line.startswith("+") and not line.startswith("+++"))
    if any(f.startswith("flutter_app/") for f in files) and re.search(r"https?://", flutter_added): findings.append({"severity":"HIGH","code":"FLUTTER_DIRECT_URL","message":"A URL was added to Flutter code/config. Verify no provider/session URL or server secret leaks into clients."})
    if any(f.startswith("flutter_app/lib/") for f in files) and not any(f.startswith("flutter_app/test/") for f in files): findings.append({"severity":"MEDIUM","code":"NO_FLUTTER_TEST_DELTA","message":"Flutter production code changed without a Flutter test change. Justify or add regression coverage."})
    if any(f.startswith("server/") for f in files) and not any(f.startswith("scripts/") and ("test" in f or "smoke" in f) for f in files): findings.append({"severity":"MEDIUM","code":"NO_SERVER_TEST_DELTA","message":"Server code changed without a script test/smoke delta. Existing tests may cover it, but verify explicitly."})
    if any(f.startswith("flutter_app/") for f in files): findings.append({"severity":"INFO","code":"PLATFORM_SCOPE","message":"Flutter delta requires Android mobile, Android TV/remote, iOS and Web regression consideration."})
    if not (ROOT / "tizen").exists() and not (ROOT / "flutter_app" / "tizen").exists(): findings.append({"severity":"INFO","code":"SAMSUNG_TIZEN_NOT_CONFIGURED","message":"No Samsung/Tizen project is present. Do not claim Samsung TV build verification; current TV target is Android TV."})
    return findings


def post_json(url: str, headers: dict[str,str], body: dict[str,Any], timeout: int=90) -> dict[str,Any]:
    req=urllib.request.Request(url,data=json.dumps(body).encode(),headers={"Content-Type":"application/json",**headers},method="POST")
    with urllib.request.urlopen(req,timeout=timeout) as r: return json.loads(r.read().decode())


def prompt_for(diff: str, files: list[str], deterministic: list[dict[str,str]]) -> str:
    state=STATE.read_text(encoding="utf-8")[:12000] if STATE.exists() else "PROJECT_STATE.md missing"
    safe_diff=diff[:MAX_DIFF_CHARS]
    return f"""Independent verifier for Al-Qahtani TV. Review only supplied evidence. No hidden reasoning or preamble. Keep response under 700 words.
Return EXACTLY these headings and one verdict token:
## AI Verdict
[APPROVED] or [CHANGES_REQUIRED] or [NEEDS_HUMAN_OR_DEVICE_EVIDENCE]
## Blocking Findings
## Non-blocking Findings
## Platform Matrix
## Required Next Actions
Never invent tests/device evidence. Physical-device claims cannot be approved by CI. Samsung/Tizen is not configured. APPROVED only if no BLOCKER/HIGH finding exists and this delta is CI-verifiable.
FILES:{json.dumps(files,ensure_ascii=False)}
FINDINGS:{json.dumps(deterministic,ensure_ascii=False)}
STATE:{state}
DIFF:\n```diff\n{safe_diff}\n```"""


def gemini_review(prompt: str) -> tuple[str,str]:
    key=os.getenv("GEMINI_API_KEY","").strip()
    if not key: raise RuntimeError("GEMINI_API_KEY unavailable")
    models=[]
    for model in (GEMINI_MODEL,"gemini-2.5-flash-lite","gemini-2.0-flash"):
        if model and model not in models: models.append(model)
    errors=[]
    for model in models:
        try:
            url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            obj=post_json(url,{}, {"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"temperature":0.1,"maxOutputTokens":1800}})
            text="\n".join(p.get("text","") for c in obj.get("candidates",[]) for p in c.get("content",{}).get("parts",[]) if p.get("text"))
            if text.strip(): return f"Gemini/{model}",validate_review_text(text)
            errors.append(f"{model}: empty")
        except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError,RuntimeError) as exc:
            errors.append(f"{model}: {type(exc).__name__}: {exc}")
    raise RuntimeError("; ".join(errors))


def validate_review_text(text: str) -> str:
    required=("## AI Verdict","## Blocking Findings","## Non-blocking Findings","## Platform Matrix","## Required Next Actions")
    if not all(h in text for h in required): raise RuntimeError("Reviewer output is malformed or truncated")
    verdict_section=text.split("## AI Verdict",1)[1].split("##",1)[0]
    verdicts=[v for v in ("[APPROVED]","[CHANGES_REQUIRED]","[NEEDS_HUMAN_OR_DEVICE_EVIDENCE]") if v in verdict_section]
    if len(verdicts)!=1: raise RuntimeError("Reviewer output must contain exactly one verdict in AI Verdict section")
    return text.strip()


def openrouter_review(prompt: str) -> tuple[str,str]:
    key=os.getenv("OPENROUTER_API_KEY","").strip()
    if not key: raise RuntimeError("OPENROUTER_API_KEY unavailable")
    headers={"Authorization":f"Bearer {key}","HTTP-Referer":"https://github.com/theeb1230-dot/Al-Qahtani","X-Title":"Al-Qahtani CI Reviewer"}
    variants=[
      {"model":OPENROUTER_MODEL,"temperature":0.1,"max_tokens":1800,"messages":[{"role":"user","content":prompt}]},
      {"model":OPENROUTER_MODEL,"temperature":0.1,"max_tokens":2400,"messages":[{"role":"system","content":"Return only the requested Markdown headings and verdict. No reasoning preamble."},{"role":"user","content":prompt}]},
    ]
    errors=[]
    for payload in variants:
        try:
            obj=post_json("https://openrouter.ai/api/v1/chat/completions",headers,payload)
            text=obj.get("choices",[{}])[0].get("message",{}).get("content","")
            if not isinstance(text,str) or not text.strip(): raise RuntimeError("OpenRouter returned no review text")
            return f"OpenRouter/{OPENROUTER_MODEL}",validate_review_text(text)
        except (RuntimeError,urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as exc: errors.append(f"{type(exc).__name__}: {exc}")
    raise RuntimeError("; ".join(errors))


def get_ai_review(prompt: str) -> tuple[str,str,list[str]]:
    errors=[]
    for fn in (gemini_review,openrouter_review):
        try:
            provider,text=fn(prompt); return provider,validate_review_text(text),errors
        except (RuntimeError,urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as exc: errors.append(f"{fn.__name__}: {type(exc).__name__}: {exc}")
    fallback="## AI Verdict\n[NEEDS_HUMAN_OR_DEVICE_EVIDENCE]\n\n## Blocking Findings\nAI review unavailable or malformed; deterministic CI remains authoritative but cannot self-approve.\n\n## Non-blocking Findings\nNone.\n\n## Platform Matrix\nUse CI build/test evidence.\n\n## Required Next Actions\nRestore a valid free-tier reviewer response or review manually."
    return "none",fallback,errors


def severity_blocks(findings:list[dict[str,str]])->bool: return any(x["severity"] in {"BLOCKER","HIGH"} for x in findings)


def main()->int:
    diff_range,diff=resolve_diff(); files=changed_files(diff_range); deterministic=deterministic_review(diff,files)
    provider,ai_text,provider_errors=get_ai_review(prompt_for(diff,files,deterministic))
    verdict_section=ai_text.split("## AI Verdict",1)[1].split("##",1)[0] if "## AI Verdict" in ai_text else ""
    final="[APPROVED]" if "[APPROVED]" in verdict_section and not severity_blocks(deterministic) else "[CHANGES_REQUIRED]"
    if provider=="none": final="[NEEDS_HUMAN_OR_DEVICE_EVIDENCE]"
    rows="\n".join(f"- **{x['severity']} / {x['code']}**: {x['message']}" for x in deterministic) or "- None"
    errors="\n".join(f"- {e}" for e in provider_errors) or "- None"
    report=f"""# Automated Review Report

> Generated by `.github/scripts/agent_reviewer.py`. Do not treat AI prose as stronger evidence than CI or physical-device evidence.

## Final Gate
**{final}**

- Generated: `{datetime.now(timezone.utc).isoformat()}`
- Event: `{event_name()}`
- SHA: `{os.getenv('GITHUB_SHA',run('git','rev-parse','HEAD'))}`
- Diff range: `{diff_range}`
- Changed files: `{len(files)}`
- AI provider: `{provider}`

## Changed Files
{chr(10).join(f'- `{f}`' for f in files) or '- None'}

## Deterministic Findings
{rows}

## Reviewer Fallback Log
{errors}

## Independent AI Review
{ai_text}

## Approval Contract
`[APPROVED]` means deterministic gates are green and the independent reviewer found no CI-verifiable blocker. It never means physical-device verification. Samsung TV/Tizen cannot be claimed until an actual Tizen target and build gate exists.
"""
    REPORT.write_text(report,encoding="utf-8"); print(report); return 0 if final=="[APPROVED]" else 2

if __name__=="__main__": sys.exit(main())
