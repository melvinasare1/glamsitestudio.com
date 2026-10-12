#!/usr/bin/env python3
"""Knock out near-black studio backdrops without eating dark vehicle parts.

Protects lit/colored pixels (and a dilated neighborhood around them) so black
tires, engines, and frames stay opaque. Only edge-connected backdrop is cleared.
"""

from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path

PNG_SIG = b"\x89PNG\r\n\x1a\n"

# Pixels at least this bright are definitely part of the vehicle.
FG_MAX_CHANNEL = 36
# Expand the vehicle mask so black tires/engines next to lit body stay protected.
FG_DILATE_RADIUS = 22
# Backdrop: very near black, sampled from studio corners.
BG_MAX_CHANNEL = 18
BG_SUM = 40
# Fringe fade around the silhouette only (not interior holes).
HALO_MAX_CHANNEL = 42


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png(path: Path) -> tuple[int, int, list[list[tuple[int, int, int, int]]]]:
    data = path.read_bytes()
    if data[:8] != PNG_SIG:
        raise ValueError(f"Not a PNG: {path}")
    pos = 8
    width = height = bit = color = 0
    idat = b""
    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        ctype = data[pos + 4 : pos + 8]
        cdata = data[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if ctype == b"IHDR":
            width, height, bit, color, compression, filt, interlace = struct.unpack(
                ">IIBBBBB", cdata
            )
            if bit != 8 or color not in (2, 6) or compression or filt or interlace:
                raise ValueError(
                    f"Unsupported PNG {path}: bit={bit} color={color} interlace={interlace}"
                )
        elif ctype == b"IDAT":
            idat += cdata
        elif ctype == b"IEND":
            break

    bpp = 4 if color == 6 else 3
    raw = zlib.decompress(idat)
    stride = width * bpp
    rows: list[bytes] = []
    i = 0
    prev = bytes(stride)
    for _ in range(height):
        ftype = raw[i]
        scan = bytearray(raw[i + 1 : i + 1 + stride])
        i += 1 + stride
        if ftype == 1:
            for x in range(stride):
                left = scan[x - bpp] if x >= bpp else 0
                scan[x] = (scan[x] + left) & 255
        elif ftype == 2:
            for x in range(stride):
                scan[x] = (scan[x] + prev[x]) & 255
        elif ftype == 3:
            for x in range(stride):
                left = scan[x - bpp] if x >= bpp else 0
                scan[x] = (scan[x] + ((left + prev[x]) // 2)) & 255
        elif ftype == 4:
            for x in range(stride):
                left = scan[x - bpp] if x >= bpp else 0
                up = prev[x]
                ul = prev[x - bpp] if x >= bpp else 0
                scan[x] = (scan[x] + paeth(left, up, ul)) & 255
        elif ftype != 0:
            raise ValueError(f"Unknown filter {ftype}")
        prev = bytes(scan)
        rows.append(bytes(scan))

    pixels: list[list[tuple[int, int, int, int]]] = []
    for row in rows:
        line: list[tuple[int, int, int, int]] = []
        for x in range(width):
            o = x * bpp
            if bpp == 4:
                line.append((row[o], row[o + 1], row[o + 2], row[o + 3]))
            else:
                line.append((row[o], row[o + 1], row[o + 2], 255))
        pixels.append(line)
    return width, height, pixels


def write_png(path: Path, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for r, g, b, a in pixels[y]:
            raw.extend((r, g, b, max(0, min(255, a))))

    def chunk(tag: bytes, payload: bytes) -> bytes:
        crc = zlib.crc32(tag + payload) & 0xFFFFFFFF
        return struct.pack(">I", len(payload)) + tag + payload + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    body = PNG_SIG + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    body += chunk(b"IEND", b"")
    path.write_bytes(body)


def is_backdrop(r: int, g: int, b: int) -> bool:
    return max(r, g, b) < BG_MAX_CHANNEL and (r + g + b) < BG_SUM


def dilate(mask: bytearray, w: int, h: int, radius: int) -> bytearray:
    """Square dilation, separable, two passes."""
    if radius <= 0:
        return bytearray(mask)
    horiz = bytearray(w * h)
    for y in range(h):
        row = y * w
        run = 0
        for x in range(min(radius, w)):
            run += mask[row + x]
        for x in range(w):
            right = x + radius
            if right < w:
                run += mask[row + right]
            left = x - radius - 1
            if left >= 0:
                run -= mask[row + left]
            horiz[row + x] = 1 if run else 0
    out = bytearray(w * h)
    for x in range(w):
        run = 0
        for y in range(min(radius, h)):
            run += horiz[y * w + x]
        for y in range(h):
            bottom = y + radius
            if bottom < h:
                run += horiz[bottom * w + x]
            top = y - radius - 1
            if top >= 0:
                run -= horiz[top * w + x]
            out[y * w + x] = 1 if run else 0
    return out


def knock_out(pixels: list[list[tuple[int, int, int, int]]]) -> None:
    h = len(pixels)
    w = len(pixels[0])

    # Treat the subject as fully opaque so leftover ChatGPT alpha doesn't ghost.
    for y in range(h):
        row = pixels[y]
        for x in range(w):
            r, g, b, a = row[x]
            if a == 0:
                continue
            row[x] = (r, g, b, 255)

    fg = bytearray(w * h)
    for y in range(h):
        row = pixels[y]
        base = y * w
        for x in range(w):
            r, g, b, a = row[x]
            if a == 0:
                continue
            if max(r, g, b) >= FG_MAX_CHANNEL:
                fg[base + x] = 1
    protected = dilate(fg, w, h, FG_DILATE_RADIUS)

    seen = bytearray(w * h)
    stack: list[tuple[int, int]] = []

    def push(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not seen[y * w + x]:
            stack.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while stack:
        x, y = stack.pop()
        idx = y * w + x
        if seen[idx]:
            continue
        seen[idx] = 1
        if protected[idx]:
            continue
        r, g, b, a = pixels[y][x]
        if a == 0 or not is_backdrop(r, g, b):
            continue
        pixels[y][x] = (r, g, b, 0)
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)

    # Soften near-black fringe on the outer silhouette only. Interior dark
    # parts (engine, tires) have no transparent neighbors, so they stay.
    neighbors = (
        (1, 0),
        (-1, 0),
        (0, 1),
        (0, -1),
        (1, 1),
        (-1, 1),
        (1, -1),
        (-1, -1),
    )
    for _ in range(2):
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[y][x]
                if a == 0 or max(r, g, b) >= HALO_MAX_CHANNEL:
                    continue
                clear_n = 0
                for dx, dy in neighbors:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and pixels[ny][nx][3] == 0:
                        clear_n += 1
                if clear_n == 0:
                    continue
                if clear_n >= 4 or max(r, g, b) < 24:
                    pixels[y][x] = (r, g, b, 0)
                else:
                    luma = (r + g + b) / 3.0
                    fade = max(0.0, min(1.0, (luma - 10) / 20))
                    pixels[y][x] = (r, g, b, int(a * fade))


def main() -> None:
    src, dest = Path(sys.argv[1]), Path(sys.argv[2])
    _, _, pixels = read_png(src)
    knock_out(pixels)
    write_png(dest, pixels)
    print(f"wrote {dest}")


if __name__ == "__main__":
    main()
