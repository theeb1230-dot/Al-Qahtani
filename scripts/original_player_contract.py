#!/usr/bin/env python3
"""Inspect the original Al-Basri archive player contract without inventing behavior.

This script is intentionally evidence-only: it reports whether the original Player.html
or bsr-Player.html exposed download affordances or download-specific parameters. Product
code should only change after this evidence is reviewed.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from zipfile import ZipFile

ARCHIVE = Path("albasritv.github.io-main.zip")
TARGETS = ("Player.html", "bsr-Player.html")


def read_unique_member(zf: ZipFile, basename: str) -> tuple[str, str]:
    matches = [name for name in zf.namelist() if name.rstrip("/").endswith("/" + basename) or name == basename]
    if len(matches) != 1:
        raise AssertionError(f"expected exactly one {basename} in original archive, found {matches}")
    name = matches[0]
    return name, zf.read(name).decode("utf-8", errors="replace")


def evidence(text: str) -> dict[str, object]:
    lowered = text.lower()
    return {
        "bytes": len(text.encode("utf-8")),
        "has_arabic_download_label": "تحميل" in text,
        "has_download_word": "download" in lowered,
        "has_download_attribute": bool(re.search(r"\sdownload(?:\s|=|>)", text, flags=re.I)),
        "has_download_query_flag": bool(re.search(r"(?:[?&]|searchParams\W+).*download", text, flags=re.I)),
        "has_download_options": "download_options" in text,
        "has_content_disposition": "content-disposition" in lowered,
        "has_url_param": bool(re.search(r"(?:URLSearchParams|get\s*\(\s*['\"]url['\"])", text, flags=re.I)),
        "has_title_param": bool(re.search(r"(?:URLSearchParams|get\s*\(\s*['\"]title['\"])", text, flags=re.I)),
        "has_live_param": bool(re.search(r"(?:URLSearchParams|get\s*\(\s*['\"]live['\"])", text, flags=re.I)),
        "uses_video_tag": "<video" in lowered,
        "uses_iframe": "<iframe" in lowered,
        "mentions_intent": "intent:" in lowered or "com.albasri" in lowered,
    }


def main() -> None:
    if not ARCHIVE.is_file():
        raise SystemExit(f"missing baseline archive: {ARCHIVE}")

    report: dict[str, object] = {"archive": str(ARCHIVE), "players": {}}
    with ZipFile(ARCHIVE) as zf:
        for basename in TARGETS:
            member, text = read_unique_member(zf, basename)
            report["players"][basename] = {"member": member, **evidence(text)}

    print("ORIGINAL_PLAYER_CONTRACT=" + json.dumps(report, ensure_ascii=False, sort_keys=True))

    # Preserve the project-boundary invariant while inspecting the baseline.
    serialized = json.dumps(report, ensure_ascii=False).lower()
    forbidden_project_markers = ("theeb_service_token", "theeb engine", "theeb1230-dot/akwam-indexer")
    assert not any(marker in serialized for marker in forbidden_project_markers)


if __name__ == "__main__":
    main()
