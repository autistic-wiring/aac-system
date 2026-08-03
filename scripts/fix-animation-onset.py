#!/usr/bin/env python3
"""Fix animations whose first frame doesn't match the source PNG.

Veo's color processing shifts even image-to-video inputs, and text-to-video
runs (used to bypass the face safety filter) produce a frame 0 that has no
relation to the static icon at all. The result is a visible "pop" when the
user taps: the static PNG swaps out and a different-looking first frame
swaps in.

Fix: replace frame 0 with the source PNG so the very first frame the user
sees is pixel-identical to the static icon, then cross-fade over a few
frames into the Veo animation so there's no harsh jump. Symmetric cross-
fade at the end ensures the loop boundary is also seamless (last frame ==
first frame == PNG).

Usage:
    python3 scripts/fix-animation-onset.py            # fix all
    python3 scripts/fix-animation-onset.py help bye   # fix specific ones
    python3 scripts/fix-animation-onset.py --transition 4   # cross-fade length
    python3 scripts/fix-animation-onset.py --dry-run
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
IMG_DIR = REPO / "public" / "images" / "core"
ANIM_DIR = IMG_DIR / "animated"
DEFAULT_TRANSITION = 3  # frames to cross-fade in and out


def _blend(a: np.ndarray, b: np.ndarray, alpha: float) -> np.ndarray:
    """Alpha-blend two RGBA uint8 arrays. alpha=0 -> a, alpha=1 -> b.
    Output alpha = max(a.alpha, b.alpha) so transparent regions stay transparent."""
    a_f = a.astype(float)
    b_f = b.astype(float)
    out_rgb = a_f[..., :3] * (1 - alpha) + b_f[..., :3] * alpha
    # Take alpha from whichever side is more opaque (avoids dark fringes)
    out_a = np.maximum(a[..., 3], b[..., 3]).astype("uint8")
    return np.dstack([out_rgb.astype("uint8"), out_a])


def load_png_rgba(png_path: Path, size: tuple[int, int]) -> np.ndarray:
    """Load the source PNG and resize to the animation size."""
    img = Image.open(png_path).convert("RGBA")
    if img.size != size:
        img = img.resize(size, Image.LANCZOS)
    return np.array(img)


def load_webp_frames(webp_path: Path) -> list[np.ndarray]:
    """Load every frame of an animated WebP as RGBA numpy arrays."""
    img = Image.open(webp_path)
    n = getattr(img, "n_frames", 1)
    frames = []
    for i in range(n):
        img.seek(i)
        frames.append(np.array(img.convert("RGBA")))
    return frames


def make_fixed_frames(
    png: np.ndarray,
    frames: list[np.ndarray],
    transition: int,
) -> list[np.ndarray]:
    """Build the new frame list with PNG at frame 0 and last, cross-faded in/out.

    Layout (N = len(frames), T = transition):
      frame 0          = PNG
      frames 1..T      = blend from PNG toward frames[0]
      frames T+1..N-T-2 = frames[1..N-2T-1]   (middle of animation, shifted)
      frames N-T-1..N-2 = blend from frames[N-1] back toward PNG
      frame N-1        = PNG

    If N is too small to support the layout (N <= 2T+2), transition is shrunk.
    Total frame count is preserved so duration is unchanged.
    """
    n = len(frames)
    t = min(transition, max(0, (n - 2) // 2))
    vevo_first = frames[0]
    vevo_last = frames[n - 1]

    out: list[np.ndarray] = [png]

    # Fade IN: PNG -> vevo_first over t frames
    for i in range(1, t + 1):
        alpha = i / (t + 1)  # 0..1
        out.append(_blend(png, vevo_first, alpha))

    # Middle: as many original frames as fit
    # Total slots used so far: 1 (png) + t (fade-in) + t (fade-out) + 1 (png) = 2t+2
    middle_count = n - (2 * t + 2)
    if middle_count > 0:
        # Distribute middle frames evenly from vevo_first..vevo_last
        # Original has n frames; we want middle_count of them, skipping first and last
        for i in range(middle_count):
            # Sample original frame index proportional to position
            src_idx = 1 + int(round(i * (n - 2) / max(1, middle_count - 1))) if middle_count > 1 else n // 2
            src_idx = max(1, min(n - 2, src_idx))
            out.append(frames[src_idx])

    # Fade OUT: vevo_last -> PNG over t frames
    for i in range(1, t + 1):
        alpha = i / (t + 1)  # 0..1, but blending FROM vevo_last TO png
        out.append(_blend(vevo_last, png, alpha))

    out.append(png)

    assert len(out) == n, f"frame count mismatch: built {len(out)} vs original {n}"
    return out


def encode_webp(frames: list[np.ndarray], fps: int, out_path: Path,
                button_id: str) -> None:
    """Encode RGBA frames to an animated WebP via ffmpeg."""
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        for i, arr in enumerate(frames, 1):
            Image.fromarray(arr, "RGBA").save(td / f"f{i:04d}.png")
        subprocess.run(
            ["ffmpeg", "-y", "-framerate", str(fps),
             "-i", str(td / "f%04d.png"),
             "-loop", "0", "-lossless", "0", "-q:v", "60",
             "-metadata", f"comment=aac-board animated button (onset-fixed): {button_id}",
             str(out_path)],
            check=True, capture_output=True,
        )


def fix_one(button_id: str, transition: int, dry_run: bool) -> dict:
    """Fix a single button's WebP. Returns a status dict."""
    webp = ANIM_DIR / f"{button_id}.webp"
    png_path = IMG_DIR / f"{button_id}.png"
    if not webp.exists():
        return {"id": button_id, "status": "skip", "reason": f"no webp at {webp}"}
    if not png_path.exists():
        return {"id": button_id, "status": "skip", "reason": f"no png at {png_path}"}

    frames = load_webp_frames(webp)
    if not frames:
        return {"id": button_id, "status": "skip", "reason": "no frames"}

    # Probe fps from the source MP4 (matches what was encoded)
    mp4 = ANIM_DIR / f"{button_id}.mp4"
    fps = 14
    if mp4.exists():
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v",
             "-show_entries", "stream=r_frame_rate", "-of",
             "default=noprint_wrappers=1:nokey=1", str(mp4)],
            capture_output=True, text=True,
        )
        if probe.returncode == 0 and "/" in probe.stdout:
            num, den = probe.stdout.strip().split("/")
            den_i = int(den) or 1
            fps = round(int(num) / den_i)

    size = (frames[0].shape[1], frames[0].shape[0])  # (W, H)
    png_arr = load_png_rgba(png_path, size)

    # Measure before mismatch (RGB only)
    before = np.abs(
        frames[0][..., :3].astype(int) - png_arr[..., :3].astype(int)
    ).mean()

    new_frames = make_fixed_frames(png_arr, frames, transition)

    after_in = np.abs(
        new_frames[0][..., :3].astype(int) - png_arr[..., :3].astype(int)
    ).mean()
    after_out = np.abs(
        new_frames[-1][..., :3].astype(int) - png_arr[..., :3].astype(int)
    ).mean()

    if dry_run:
        return {
            "id": button_id, "status": "dry-run",
            "frames": len(frames), "fps": fps, "size": size,
            "before_diff": round(before, 2),
            "after_first_diff": round(after_in, 2),
            "after_last_diff": round(after_out, 2),
        }

    encode_webp(new_frames, fps, webp, button_id)
    return {
        "id": button_id, "status": "ok",
        "frames": len(frames), "fps": fps, "size": size,
        "before_diff": round(before, 2),
        "after_first_diff": round(after_in, 2),
        "after_last_diff": round(after_out, 2),
        "bytes": webp.stat().st_size,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("buttons", nargs="*",
                    help="button ids to fix (default: all in animated/)")
    ap.add_argument("--transition", type=int, default=DEFAULT_TRANSITION,
                    help=f"cross-fade frame count in+out (default {DEFAULT_TRANSITION})")
    ap.add_argument("--dry-run", action="store_true",
                    help="measure mismatches without rewriting files")
    args = ap.parse_args()

    if args.buttons:
        targets = args.buttons
    else:
        targets = sorted(p.stem for p in ANIM_DIR.glob("*.webp"))

    print(f"{'button':12s} {'frames':>6s} {'fps':>4s} {'before':>8s} "
          f"{'after(0)':>9s} {'after(N)':>9s}  status")
    print("-" * 70)
    for bid in targets:
        try:
            r = fix_one(bid, args.transition, args.dry_run)
        except Exception as e:
            print(f"{bid:12s} {'-':>6s} {'-':>4s} {'-':>8s} "
                  f"{'-':>9s} {'-':>9s}  ERROR: {e}")
            continue
        if r["status"] in ("ok", "dry-run"):
            print(f"{r['id']:12s} {r['frames']:>6d} {r['fps']:>4d} "
                  f"{r['before_diff']:>8.2f} {r['after_first_diff']:>9.2f} "
                  f"{r['after_last_diff']:>9.2f}  {r['status']}")
        else:
            print(f"{bid:12s} {'-':>6s} {'-':>4s} {'-':>8s} "
                  f"{'-':>9s} {'-':>9s}  {r['status']}: {r.get('reason','')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
