#!/usr/bin/env python3
"""Convert a flat-white-background animation MP4 into a transparent looping APNG.

The Veo pipeline emits a hand gesture on a white background (restored by the
border flood-fill salvage in generate-button-animation.py). MP4 has no alpha
channel, so for a transparent animation we re-render as APNG (full alpha,
plays everywhere including iOS Safari, in a plain <img>).

Strategy: the hand is enclosed by a dark outline, so flooding NEAR-WHITE pixels
from the image border stops at the outline -> the flooded region is exactly the
background. Set it to alpha 0; everything inside the outline keeps alpha 255.

Usage:
    python3 scripts/mp4-to-transparent-apng.py public/images/core/animated/help.mp4
    python3 scripts/mp4-to-transparent-apng.py help.mp4 --out public/images/core/animated/help.apng --fps 14 --scale 256
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def _border_flood_bg(hsv: np.ndarray, v_min: int = 235, s_max: int = 35) -> np.ndarray:
    """Return a boolean mask of the border-connected background (near-white).
    `hsv` is HxWx3 uint8 from PIL convert('HSV'). Growth stays inside near-white
    so the dark outline bounding the hand blocks the flood."""
    v, s = hsv[..., 2], hsv[..., 1]
    near_white = (v >= v_min) & (s <= s_max)

    grown = np.zeros_like(near_white)
    grown[0, :] |= near_white[0, :]
    grown[-1, :] |= near_white[-1, :]
    grown[:, 0] |= near_white[:, 0]
    grown[:, -1] |= near_white[:, -1]

    def _dilate(m: np.ndarray) -> np.ndarray:
        out = np.zeros_like(m)
        out[1:, :] |= m[:-1, :]
        out[:-1, :] |= m[1:, :]
        out[:, 1:] |= m[:, :-1]
        out[:, :-1] |= m[:, 1:]
        return out

    while True:
        nxt = _dilate(grown) & near_white
        if np.array_equal(nxt, grown):
            break
        grown = nxt
    return grown


def _erode(mask: np.ndarray) -> np.ndarray:
    """3x3 min-filter (binary erosion) — shrinks the opaque region by 1px,
    removing the anti-aliased white fringe at the silhouette edge."""
    out = np.ones_like(mask)
    out[1:, :] &= mask[:-1, :]
    out[:-1, :] &= mask[1:, :]
    out[:, 1:] &= mask[:, :-1]
    out[:, :-1] &= mask[:, 1:]
    return out


def frame_to_rgba(rgb_path: Path) -> Image.Image:
    img = Image.open(rgb_path).convert("RGB")
    arr = np.array(img)
    hsv = np.array(img.convert("HSV"))
    bg = _border_flood_bg(hsv)                       # border-connected white region
    alpha = np.where(bg, 0, 255).astype("uint8")     # hand opaque, bg transparent
    alpha = _erode(alpha == 255).astype("uint8") * 255  # kill 1px white fringe
    rgba = np.dstack([arr, alpha])
    return Image.fromarray(rgba, "RGBA")


def convert(mp4: Path, out: Path, fps: int, scale: int, fmt: str) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        raw = td / "raw"
        cut = td / "cut"
        raw.mkdir()
        cut.mkdir()
        # 1. dump frames (mp4 is already square; just set fps)
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(mp4), "-vf", f"fps={fps}",
             str(raw / "f%04d.png")],
            check=True, capture_output=True,
        )
        frames = sorted(raw.glob("f*.png"))
        if not frames:
            raise RuntimeError("ffmpeg produced no frames")
        print(f"[anim] masking {len(frames)} frames -> transparent")
        for i, f in enumerate(frames, 1):
            rgba = frame_to_rgba(f)
            if scale and rgba.width != scale:
                rgba = rgba.resize((scale, scale), Image.LANCZOS)
            rgba.save(cut / f"f{i:04d}.png")
        # 2. encode (alpha preserved by both muxers)
        if fmt == "apng":
            subprocess.run(
                ["ffmpeg", "-y", "-framerate", str(fps),
                 "-i", str(cut / "f%04d.png"),
                 "-plays", "0", str(out)],
                check=True, capture_output=True,
            )
        elif fmt == "webp":
            subprocess.run(
                ["ffmpeg", "-y", "-framerate", str(fps),
                 "-i", str(cut / "f%04d.png"),
                 "-loop", "0", "-lossless", "0", "-q:v", "60",
                 "-metadata", f"comment=aac-board animated button (transparent)",
                 str(out)],
                check=True, capture_output=True,
            )
        else:
            raise ValueError(f"unknown format {fmt}")
    print(f"[anim] saved {out} ({out.stat().st_size} bytes)")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("mp4", type=Path)
    ap.add_argument("--out", type=Path, default=None,
                    help="output file (default: same stem as input, .apng)")
    ap.add_argument("--fps", type=int, default=14)
    ap.add_argument("--scale", type=int, default=256,
                    help="output square size in px (0 = keep source)")
    ap.add_argument("--format", choices=["apng", "webp"], default="apng",
                    help="output container (webp is ~10x smaller with smooth alpha)")
    args = ap.parse_args()
    if args.out is None:
        args.out = args.mp4.with_suffix("." + args.format)
    convert(args.mp4, args.out, args.fps, args.scale, args.format)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
