#!/usr/bin/env python3
"""Generate deterministic Al-Qahtani native branding after `flutter create`.

No bundled font or third-party image dependency is required. The mark is a simplified
geometric Arabic qaf inspired by the user-approved black/gold identity.
"""
from __future__ import annotations

import json
import math
import plistlib
import re
import struct
import sys
import zlib
from pathlib import Path

BLACK = (9, 9, 11, 255)
GOLD = (216, 170, 79, 255)
TRANSPARENT = (0, 0, 0, 0)


def png_bytes(width: int, height: int, rgba: bytearray) -> bytes:
    raw = b"".join(b"\x00" + bytes(rgba[y * width * 4:(y + 1) * width * 4]) for y in range(height))
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def mark(size: int, background: tuple[int, int, int, int]) -> bytes:
    w = h = max(16, int(size))
    px = bytearray(background * (w * h))

    def blend(x: int, y: int, color=GOLD):
        if 0 <= x < w and 0 <= y < h:
            i = (y * w + x) * 4
            px[i:i + 4] = bytes(color)

    def disk(cx: float, cy: float, radius: float, color=GOLD):
        x0, x1 = max(0, int(cx - radius)), min(w - 1, int(cx + radius))
        y0, y1 = max(0, int(cy - radius)), min(h - 1, int(cy + radius))
        r2 = radius * radius
        for y in range(y0, y1 + 1):
            dy = y - cy
            for x in range(x0, x1 + 1):
                dx = x - cx
                if dx * dx + dy * dy <= r2:
                    blend(x, y, color)

    def ring(cx: float, cy: float, outer: float, inner: float):
        x0, x1 = max(0, int(cx - outer)), min(w - 1, int(cx + outer))
        y0, y1 = max(0, int(cy - outer)), min(h - 1, int(cy + outer))
        o2, i2 = outer * outer, inner * inner
        for y in range(y0, y1 + 1):
            dy = y - cy
            for x in range(x0, x1 + 1):
                dx = x - cx
                d2 = dx * dx + dy * dy
                if i2 <= d2 <= o2:
                    blend(x, y)

    def thick_bezier(p0, p1, p2, radius):
        steps = max(80, int(size * 0.8))
        for n in range(steps + 1):
            t = n / steps
            u = 1 - t
            x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
            y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
            disk(x, y, radius)

    # Isolated ق: compact bowl, two dots, then a long lower-left tail.
    ring(w * .59, h * .44, w * .205, w * .125)
    # Mask a small lower-left seam so the tail feels continuous rather than a Latin Q.
    disk(w * .46, h * .57, w * .07, background)
    thick_bezier((w * .55, h * .57), (w * .52, h * .75), (w * .22, h * .70), w * .035)
    disk(w * .52, h * .18, w * .036)
    disk(w * .65, h * .18, w * .036)
    return png_bytes(w, h, px)


def write_icon(path: Path, size: int, transparent: bool = False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(mark(size, TRANSPARENT if transparent else BLACK))


def apply_android(root: Path):
    android = root / "android"
    if not android.exists():
        return
    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    res = android / "app/src/main/res"
    for folder, size in sizes.items():
        write_icon(res / folder / "ic_launcher.png", size)
    write_icon(res / "drawable" / "launch_qaf.png", 256, transparent=True)
    launch_xml = """<?xml version=\"1.0\" encoding=\"utf-8\"?>
<layer-list xmlns:android=\"http://schemas.android.com/apk/res/android\">
    <item android:drawable=\"@android:color/black\" />
    <item><bitmap android:gravity=\"center\" android:src=\"@drawable/launch_qaf\" /></item>
</layer-list>
"""
    for folder in ("drawable", "drawable-v21"):
        target = res / folder / "launch_background.xml"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(launch_xml, encoding="utf-8")
    manifest = android / "app/src/main/AndroidManifest.xml"
    if manifest.exists():
        text = manifest.read_text(encoding="utf-8")
        text = re.sub(r'android:label="[^"]*"', 'android:label="القحطاني"', text, count=1)
        manifest.write_text(text, encoding="utf-8")


def ios_pixel_size(entry: dict) -> int:
    raw_size = str(entry.get("size", "0x0")).split("x", 1)[0]
    scale = str(entry.get("scale", "1x")).rstrip("x")
    try:
        return max(16, round(float(raw_size) * float(scale)))
    except ValueError:
        return 64


def apply_ios(root: Path):
    ios = root / "ios"
    if not ios.exists():
        return
    assets = ios / "Runner/Assets.xcassets"
    contents = assets / "AppIcon.appiconset/Contents.json"
    if contents.exists():
        data = json.loads(contents.read_text(encoding="utf-8"))
        for image in data.get("images", []):
            filename = image.get("filename")
            if filename:
                write_icon(contents.parent / filename, ios_pixel_size(image))
    launch_contents = assets / "LaunchImage.imageset/Contents.json"
    if launch_contents.exists():
        data = json.loads(launch_contents.read_text(encoding="utf-8"))
        for image in data.get("images", []):
            filename = image.get("filename")
            if filename:
                scale = str(image.get("scale", "1x")).rstrip("x")
                try: factor = max(1, int(float(scale)))
                except ValueError: factor = 1
                write_icon(launch_contents.parent / filename, 192 * factor, transparent=True)
    storyboard = ios / "Runner/Base.lproj/LaunchScreen.storyboard"
    if storyboard.exists():
        text = storyboard.read_text(encoding="utf-8")
        text = text.replace('red="1" green="1" blue="1" alpha="1"', 'red="0.035" green="0.035" blue="0.043" alpha="1"')
        storyboard.write_text(text, encoding="utf-8")
    plist = ios / "Runner/Info.plist"
    if plist.exists():
        with plist.open("rb") as fh:
            data = plistlib.load(fh)
        data["CFBundleDisplayName"] = "القحطاني"
        data["CFBundleName"] = "القحطاني"
        with plist.open("wb") as fh:
            plistlib.dump(data, fh, sort_keys=False)


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "flutter_app").resolve()
    apply_android(root)
    apply_ios(root)
    print(f"native branding applied to {root}")


if __name__ == "__main__":
    main()
