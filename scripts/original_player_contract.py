#!/usr/bin/env python3
"""Gate the original Al-Basri player contract without inventing behavior.

The preserved archive is the behavioral baseline. Both original player files may contain
technical occurrences of the word "download", but they did not expose a player-level
download affordance, download query flag, download attribute, download_options contract,
or Content-Disposition handling. Keep that distinction explicit so future work does not
mistake a text match for an original product feature.
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

    # The original player receives media context, but download selection belongs to the
    # cinema/details flow rather than Player.html / bsr-Player.html itself.
    forbidden_player_download_features = (
        "has_arabic_download_label",
        "has_download_attribute",
        "has_download_query_flag",
        "has_download_options",
        "has_content_disposition",
    )
    for basename, player in report["players"].items():
        for feature in forbidden_player_download_features:
            assert player[feature] is False, f"original {basename} unexpectedly gained {feature}"
        assert player["has_url_param"] is True, f"original {basename} must accept media URL context"
        assert player["has_title_param"] is True, f"original {basename} must accept title context"
        assert player["has_live_param"] is True, f"original {basename} must accept live context"

    # Preserve the project-boundary invariant while inspecting the baseline.
    serialized = json.dumps(report, ensure_ascii=False).lower()
    forbidden_project_markers = ("theeb_service_token", "theeb engine", "theeb1230-dot/akwam-indexer")
    assert not any(marker in serialized for marker in forbidden_project_markers)

    print("PASS original Basri players have no player-level download UI/contract")


if __name__ == "__main__":
    main()
