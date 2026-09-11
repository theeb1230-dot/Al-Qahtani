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


if not ARCHIVE.is_file():
    fail(f"missing baseline archive: {ARCHIVE}")

with zipfile.ZipFile(ARCHIVE) as zf:
    try:
        source = zf.read(MEMBER).decode("utf-8", "ignore")
    except KeyError:
        fail(f"missing archive member: {MEMBER}")

# The original Basri UI exposes a watch/download choice after selecting an
# episode. This guard deliberately validates semantic markers instead of exact
# minified formatting so a harmless baseline whitespace change does not break
# the check.
if "fa-download" not in source or "تحميل" not in source:
    fail("original cinema page no longer exposes the download choice")

# Capture every function name whose body or nearby markup discusses download.
function_names: list[str] = []
for match in re.finditer(r"(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{", source):
    name = match.group(1)
    snippet = source[match.start(): min(len(source), match.start() + 5000)]
    if re.search(r"download|تحميل", snippet, re.I):
        function_names.append(name)

# Capture onclick handlers attached to visible download controls.
handlers: list[str] = []
for match in re.finditer(r"<button\b[^>]*>[^<]*(?:<[^>]+>[^<]*</[^>]+>\s*)*[^<]*تحميل[^<]*</button>", source, re.I | re.S):
    tag = match.group(0)
    onclick = re.search(r"onclick\s*=\s*[\"']([^\"']+)[\"']", tag, re.I)
    if onclick:
        handlers.append(html.unescape(onclick.group(1)).strip())

# Extract original-source download URL shapes referenced by the page itself.
download_shapes = sorted(set(re.findall(r"https://akwam\.ss/download/[^\"'<>\s]+", source, re.I)))

print("ORIGINAL_DOWNLOAD_CONTRACT")
print("download_button=true")
print("download_handlers=", handlers)
print("download_functions=", sorted(set(function_names)))
print("download_url_samples=", download_shapes[:5])

# Print bounded contexts for auditability in Actions logs. No tokens or secrets
# exist in this historical static page beyond the already-known Basri session
# flow; nevertheless keep output bounded.
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

if not handlers:
    # The original button may use an id/listener rather than inline onclick.
    # In that case demand at least a callable download-related function so the
    # contract still remains recoverable rather than silently drifting away.
    if not function_names:
        fail("could not identify the original download action handler")

print("PASS original Basri download UI/action contract is recoverable")
