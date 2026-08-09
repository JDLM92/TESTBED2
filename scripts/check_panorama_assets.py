from __future__ import annotations

import argparse
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
JPEG_SOF_MARKERS = {
    0xC0,
    0xC1,
    0xC2,
    0xC3,
    0xC5,
    0xC6,
    0xC7,
    0xC9,
    0xCA,
    0xCB,
    0xCD,
    0xCE,
    0xCF,
}


def read_png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as image:
        header = image.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError("invalid PNG header")
    return int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")


def read_jpeg_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as image:
        if image.read(2) != b"\xff\xd8":
            raise ValueError("invalid JPEG header")
        while marker_byte := image.read(1):
            if marker_byte != b"\xff":
                continue
            while marker_byte == b"\xff":
                marker_byte = image.read(1)
            if not marker_byte:
                break
            marker = marker_byte[0]
            if marker in {0xD8, 0xD9}:
                continue
            length_data = image.read(2)
            if len(length_data) != 2:
                break
            length = int.from_bytes(length_data, "big")
            if length < 2:
                raise ValueError("invalid JPEG segment length")
            if marker in JPEG_SOF_MARKERS:
                frame = image.read(5)
                if len(frame) != 5:
                    break
                return int.from_bytes(frame[3:5], "big"), int.from_bytes(frame[1:3], "big")
            image.seek(length - 2, 1)
    raise ValueError("JPEG dimensions not found")


def read_image_size(path: Path) -> tuple[int, int]:
    if path.suffix.lower() == ".png":
        return read_png_size(path)
    return read_jpeg_size(path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check that panorama assets use the expected equirectangular ratio."
    )
    parser.add_argument("--assets", type=Path, default=Path("assets"))
    parser.add_argument("--ratio", type=float, default=2.0)
    parser.add_argument("--tolerance", type=float, default=0.01)
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    paths = sorted(
        path
        for path in args.assets.rglob("*")
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and {"present", "future"}.intersection(path.parts)
    )
    warnings = 0

    for path in paths:
        try:
            width, height = read_image_size(path)
        except ValueError as error:
            print(f"ERROR {path}: {error}")
            warnings += 1
            continue
        ratio = width / height
        delta = abs(ratio - args.ratio)
        status = "PASS" if delta <= args.tolerance else "WARN"
        print(f"{status} {path}: {width}×{height} ({ratio:.4f}:1)")
        if status == "WARN":
            warnings += 1

    if warnings:
        print(
            f"{warnings} asset(s) need review before a strict panorama publish check can pass."
        )
    else:
        print("All panorama assets match the requested ratio.")
    return 1 if args.strict and warnings else 0


if __name__ == "__main__":
    raise SystemExit(main())
