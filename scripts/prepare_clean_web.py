#!/usr/bin/env python3
"""Prepare a clean, self-hostable web tree from the original Albasri archive.

The script intentionally keeps behavior before removing legacy compatibility.
Run against the extracted directory that contains index.html/news.html/etc.
"""
from __future__ import annotations
import argparse, base64, re, shutil
from pathlib import Path

AD_PATTERNS = (
    r'<script[^>]+src="https://www\.highperformanceformat\.com/[^"]+"[^>]*></script>',
    r'<script[^>]+src="https://pl\d+\.effectivecpmnetwork\.com/[^"]+"[^>]*></script>',
)

def decode_news(source: str) -> str:
    key_match = re.search(r'atob\("([^"]+)"\)', source)
    chunks_match = re.search(r'var S=\[(.*?)\]\.join\(""\);', source, re.S)
    if not key_match or not chunks_match:
        return source
    chunks = re.findall(r"'([^']*)'", chunks_match.group(1))
    key = base64.b64decode(key_match.group(1))
    data = bytearray(base64.b64decode("".join(chunks)))
    for i in range(len(data)):
        j = (i * 11 + (i >> 7) + 17) % len(key)
        data[i] ^= key[j] ^ ((i * 19 + 37) & 255)
    return bytes(data).decode("utf-8")

def clean_index(source: str) -> str:
    for pattern in AD_PATTERNS:
        source = re.sub(r"\s*" + pattern + r"\s*", "\n", source)
    source = re.sub(r'\s*<div id="container-dc29d3daa278da998dee275e6e196c86"></div>\s*', "\n", source)
    source = re.sub(r'\s*window\.open\("https://www\.effectivecpmnetwork\.com/[^"]+",\s*"_blank"\);', "", source)
    source = source.replace(
        "// تنفيذ الإجراء من أول لمسة/ضغطة حتى لو حاول إعلان منبثق استهلاك حدث click",
        "// تنفيذ الإجراء من أول لمسة/ضغطة مع منع التكرار بين pointerdown و click",
    )
    source = source.replace(
        'return "https://koooracity.com/" + u.replace(/^\\//, \'\');',
        "try { return new URL(u, window.location.href).href; } catch (_) { return u; }",
    )
    return source

def unlock_cinema(source: str) -> str:
    source = source.replace('    const ALLOWED_HOST = "www.albasritv.abrdns.com";\n', "")
    source = source.replace('    const ALLOWED_PAGE = "/2026/09/movies-series.html";\n', "")
    source = re.sub(
        r"\n    function enforceAllowedPage\(\)\{.*?\n    \}\n\n    function renderCategoryGroup",
        "\n    function renderCategoryGroup",
        source,
        flags=re.S,
    )
    source = source.replace(
        "    if(enforceAllowedPage()){\n      history.replaceState({view:'homeView'},'',location.href);\n      init();\n    }",
        "    history.replaceState({view:'homeView'},'',location.href);\n    init();",
    )
    return source

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    required = ["index.html", "news.html", "albasri-cinema.html", "basrimatches.html", "bsr-Player.html"]
    missing = [name for name in required if not (args.source / name).exists()]
    if missing:
        raise SystemExit("Missing original files: " + ", ".join(missing))

    (args.output / "index.html").write_text(clean_index((args.source / "index.html").read_text()), encoding="utf-8")
    (args.output / "news.html").write_text(decode_news((args.source / "news.html").read_text()), encoding="utf-8")
    (args.output / "albasri-cinema.html").write_text(unlock_cinema((args.source / "albasri-cinema.html").read_text()), encoding="utf-8")
    for name in ["basrimatches.html", "bsr-Player.html", "google96f84339fde830fd.html", "sitemap.xml"]:
        p = args.source / name
        if p.exists():
            shutil.copy2(p, args.output / name)

if __name__ == "__main__":
    main()
