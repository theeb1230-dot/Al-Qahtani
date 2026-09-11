#!/usr/bin/env python3
from __future__ import annotations

import html
import re
import sys
import zipfile
from pathlib import Path

ARCHIVE = Path("albasritv.github.io-main.zip")
MEMBER = "albasritv.github.io-main/albasri-cinema.html"


def fail(message: str) -> None:
    print(f"FAIL {message}", file=sys.stderr)
    raise SystemExit(1)


def context(text: str, start: int, radius: int = 900) -> str:
    return text[max(0, start - radius): min(len(text), start + radius)]


def extract_function(text: str, name: str) -> str:
    match = re.search(rf"(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{", text)
    if not match:
        return ""
    brace = text.find("{", match.start())
    depth = 0
    quote = ""
    escaped = False
    i = brace
    while i < len(text):
        ch = text[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = ""
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[match.start(): i + 1]
        i += 1
    return ""


if not ARCHIVE.is_file():
    fail(f"missing baseline archive: {ARCHIVE}")

with zipfile.ZipFile(ARCHIVE) as zf:
    try:
        source = zf.read(MEMBER).decode("utf-8", "ignore")
    except KeyError:
        fail(f"missing archive member: {MEMBER}")

if "fa-download" not in source or "تحميل" not in source:
    fail("original cinema page no longer exposes the download choice")

function_names: list[str] = []
for match in re.finditer(r"(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{", source):
    name = match.group(1)
    snippet = source[match.start(): min(len(source), match.start() + 5000)]
    if re.search(r"download|تحميل", snippet, re.I):
        function_names.append(name)

handlers: list[str] = []
for match in re.finditer(r"<button\b[^>]*>[^<]*(?:<[^>]+>[^<]*</[^>]+>\s*)*[^<]*تحميل[^<]*</button>", source, re.I | re.S):
    tag = match.group(0)
    onclick = re.search(r"onclick\s*=\s*[\"']([^\"']+)[\"']", tag, re.I)
    if onclick:
        handlers.append(html.unescape(onclick.group(1)).strip())

download_shapes = sorted(set(re.findall(r"https://akwam\.ss/download/[^\"'<>\s]+", source, re.I)))

print("ORIGINAL_DOWNLOAD_CONTRACT")
print("download_button=true")
print("download_handlers=", handlers)
print("download_functions=", sorted(set(function_names)))
print("download_url_samples=", download_shapes[:5])

for name in ["prepareEpisodeChoice", "downloadChosenEpisode", "startDownload", "setupPlayer", "getDetails"]:
    body = extract_function(source, name)
    print(f"\n=== ORIGINAL FUNCTION {name} ===")
    print(body if body else "NOT FOUND")

needles = ["fa-download", "تحميل", "download"]
printed: set[int] = set()
for needle in needles:
    for match in list(re.finditer(re.escape(needle), source, re.I))[:6]:
        bucket = match.start() // 500
        if bucket in printed:
            continue
        printed.add(bucket)
        print(f"\n=== ORIGINAL DOWNLOAD CONTEXT {needle}@{match.start()} ===")
        print(context(source, match.start()))

if not handlers and not function_names:
    fail("could not identify the original download action handler")

for required in ("prepareEpisodeChoice", "downloadChosenEpisode", "startDownload"):
    if not extract_function(source, required):
        fail(f"missing original download function: {required}")

print("PASS original Basri download UI/action contract is recoverable")
