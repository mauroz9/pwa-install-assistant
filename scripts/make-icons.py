"""Draws the demo's app icons (PNG, no dependencies): a rounded tile with a
down arrow onto a "home screen" bar. Run: python3 scripts/make-icons.py"""
import struct
import sys
import zlib
from pathlib import Path

ACCENT = (21, 70, 209)
WHITE = (255, 255, 255)


def png(path: Path, size: int, maskable: bool) -> None:
    rows = []
    r = size * (0 if maskable else 0.22)
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            # Rounded square (or full bleed for maskable icons).
            cx = min(max(x, r), size - 1 - r)
            cy = min(max(y, r), size - 1 - r)
            inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r if r else True
            u, v = x / size, y / size
            # Arrow: shaft and head, centred; a bar under it.
            shaft = 0.455 <= u <= 0.545 and 0.2 <= v <= 0.56
            head = v >= 0.44 and v <= 0.66 and abs(u - 0.5) <= (0.66 - v) * 1.15
            bar = 0.26 <= u <= 0.74 and 0.72 <= v <= 0.8
            color = WHITE if (shaft or head or bar) else ACCENT
            row += bytes(color) + (b"\xff" if inside else b"\x00")
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    head = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", head) + chunk(b"IDAT", raw) + chunk(b"IEND", b""))


out = Path(sys.argv[1] if len(sys.argv) > 1 else "demo/public/icons")
out.mkdir(parents=True, exist_ok=True)
png(out / "icon-192.png", 192, False)
png(out / "icon-512.png", 512, False)
png(out / "maskable-512.png", 512, True)
png(out / "apple-touch-icon.png", 180, True)
print("icons written to", out)
