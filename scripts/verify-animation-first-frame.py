#!/usr/bin/env python3
"""Verify each AAC button animation's first frame matches the source PNG,
composited over the actual card background the app uses (per-color of vocab).

For each button id under public/images/core/:
  - Load <id>.png (transparent RGBA source)
  - Extract frame 0 of <id>.webp (the actual displayed asset)
  - Composite both over the card's background color
  - Compute MSE / MAE / PSNR on the perceived pixels
  - Save a side-by-side debug PNG to /tmp/aac-frame-cmp/<id>.png

The MP4 is intermediate only — the WebP is what ships. We still dump the MP4
first frame for cross-reference.

Usage:
    python3 scripts/verify-animation-first-frame.py [button_id ...]
"""
import argparse
import math
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
IMG_DIR = REPO / "public" / "images" / "core"
ANIM_DIR = IMG_DIR / "animated"
OUT_DIR = Path("/tmp/aac-frame-cmp")
COMPARE_SIZE = 256

# Mirror src/data/defaultVocabulary.js colors.
CARD_COLORS = {
    "pronoun": (255, 235, 59),    # #ffeb3b yellow
    "verb": (129, 199, 132),      # #81c784 green
    "noun": (255, 183, 77),       # #ffb74d orange
    "adjective": (100, 181, 246), # #64b5f6 blue
}

# Per-button color class (from src/data/defaultVocabulary.js).
BUTTON_COLOR = {
    "help": "verb",
    "me": "pronoun", "i": "pronoun", "me2": "pronoun",
    "my_turn": "pronoun", "your_turn": "pronoun",
    "want": "verb", "give": "verb",
    "more": "adjective",
    "yes": "verb", "no": "verb",
    "hi": "pronoun", "bye": "pronoun", "hi2": "pronoun", "bye2": "pronoun",
    "washroom": "noun",
    "wait": "verb",
    "i_eat": "verb", "i_drink": "verb",
    "all_done": "verb",
}


def composite_over(rgba: np.ndarray, bg: tuple[int, int, int]) -> np.ndarray:
    """RGBA uint8 + bg RGB uint8 -> RGB uint8 (alpha compositing)."""
    rgb = rgba[..., :3].astype(np.float32)
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    bg_arr = np.array(bg, dtype=np.float32)
    out = rgb * a + bg_arr * (1 - a)
    return out.astype(np.uint8)


def load_rgba(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"))


def first_frame_webp(webp: Path) -> np.ndarray:
    im = Image.open(webp)
    im.seek(0)
    return np.array(im.convert("RGBA"))


def first_frame_mp4(mp4: Path) -> np.ndarray:
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "f.png"
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(mp4), "-vframes", "1", str(out)],
            check=True, capture_output=True,
        )
        return np.array(Image.open(out).convert("RGBA"))


def to_square(arr: np.ndarray, size: int = COMPARE_SIZE) -> np.ndarray:
    h, w = arr.shape[:2]
    s = min(h, w)
    y0 = (h - s) // 2
    x0 = (w - s) // 2
    cropped = arr[y0:y0 + s, x0:x0 + s]
    return np.array(Image.fromarray(cropped).resize((size, size), Image.LANCZOS))


def metrics(a: np.ndarray, b: np.ndarray) -> dict:
    a = a.astype(np.int32)
    b = b.astype(np.int32)
    diff = np.abs(a - b)
    mse = float((diff ** 2).mean())
    rmse = math.sqrt(mse)
    mae = float(diff.mean())
    psnr = float(10 * math.log10(255 ** 2 / mse)) if mse > 0 else 99.0
    # restrict metrics to the union of non-bg pixels so bg doesn't dominate
    return {"mse": mse, "rmse": rmse, "mae": mae, "psnr": psnr}


def side_by_side(src: np.ndarray, webp_f: np.ndarray, mp4_f: np.ndarray,
                 bg: tuple, out: Path, label: str, scores: dict) -> None:
    src_sq = to_square(src)
    webp_sq = to_square(webp_f)
    mp4_sq = to_square(mp4_f)
    src_disp = composite_over(src_sq, bg)
    webp_disp = composite_over(webp_sq, bg)
    mp4_disp = composite_over(mp4_sq, bg)
    h = w = src_disp.shape[0]
    pad = 8
    label_h = 22
    footer_h = 28
    canvas = np.full(
        (h + label_h + footer_h + pad * 4, w * 3 + pad * 4, 3),
        255, dtype=np.uint8,
    )

    def place(arr, x, y):
        canvas[y:y + arr.shape[0], x:x + arr.shape[1]] = arr

    place(src_disp, pad, label_h + pad)
    place(webp_disp, pad + w, label_h + pad)
    place(mp4_disp, pad + 2 * w, label_h + pad)

    img = Image.fromarray(canvas)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.text((pad, 4), f"{label}  bg=#{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}",
              fill=(0, 0, 0))
    draw.text((pad, h + label_h + pad + 4), "src PNG", fill=(0, 0, 0))
    draw.text((pad + w, h + label_h + pad + 4),
              f"webp f0  mae={scores['webp_mae']:.1f}  psnr={scores['webp_psnr']:.2f}dB",
              fill=(0, 0, 0))
    draw.text((pad + 2 * w, h + label_h + pad + 4),
              f"mp4 f0  mae={scores['mp4_mae']:.1f}  psnr={scores['mp4_psnr']:.2f}dB",
              fill=(0, 0, 0))
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def compare_one(button_id: str) -> dict | None:
    src_png = IMG_DIR / f"{button_id}.png"
    mp4 = ANIM_DIR / f"{button_id}.mp4"
    webp = ANIM_DIR / f"{button_id}.webp"
    if not src_png.exists():
        print(f"[{button_id}] SKIP: no source PNG")
        return None
    if not webp.exists():
        print(f"[{button_id}] SKIP: no webp")
        return None

    color_key = BUTTON_COLOR.get(button_id, "verb")
    bg = CARD_COLORS[color_key]

    src = load_rgba(src_png)
    src = to_square(src)
    src_disp = composite_over(src, bg)

    result = {"id": button_id, "bg": bg, "color": color_key}

    webp_f = to_square(first_frame_webp(webp))
    webp_disp = composite_over(webp_f, bg)
    m = metrics(src_disp, webp_disp)
    result["webp_mae"] = m["mae"]
    result["webp_psnr"] = m["psnr"]

    if mp4.exists():
        mp4_f = to_square(first_frame_mp4(mp4))
        # MP4 has no alpha; composite as if fully opaque
        mp4_disp = composite_over(mp4_f, bg)
        m = metrics(src_disp, mp4_disp)
        result["mp4_mae"] = m["mae"]
        result["mp4_psnr"] = m["psnr"]
    else:
        mp4_f = src
        result["mp4_mae"] = None
        result["mp4_psnr"] = None

    side_by_side(src, webp_f, mp4_f, bg,
                 OUT_DIR / f"{button_id}.png", button_id, result)
    result["debug_png"] = str(OUT_DIR / f"{button_id}.png")
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("buttons", nargs="*", help="button ids; default = all")
    ap.add_argument("--baseline", default="help",
                    help="baseline button for 'acceptable' ceiling (default help)")
    ap.add_argument("--ceiling", type=float, default=None,
                    help="manual MAE ceiling; default 1.5x baseline webp_mae")
    args = ap.parse_args()

    if args.buttons:
        ids = args.buttons
    else:
        ids = sorted(p.stem for p in IMG_DIR.glob("*.png"))

    rows = []
    for bid in ids:
        r = compare_one(bid)
        if r:
            rows.append(r)

    if not rows:
        print("nothing to compare")
        return 1

    baseline = next((r for r in rows if r["id"] == args.baseline), None)
    if baseline is not None:
        ceil = args.ceiling or (baseline["webp_mae"] * 1.5)
        print(f"\nBaseline {args.baseline}: webp_mae={baseline['webp_mae']:.1f} "
              f"psnr={baseline['webp_psnr']:.2f}dB  "
              f"ceiling = mae <= {ceil:.1f}\n")
    else:
        ceil = args.ceiling or 20.0
        print(f"\nNo baseline '{args.baseline}' found; using ceiling mae <= {ceil:.1f}\n")

    print(f"{'id':<12}{'color':<12}{'webp_mae':>10}{'webp_psnr':>13}"
          f"{'mp4_mae':>10}{'mp4_psnr':>13}  verdict")
    print("-" * 90)
    bad = []
    for r in rows:
        verdict = "ok"
        if r["webp_mae"] > ceil:
            verdict = "REGENERATE"
            bad.append(r["id"])

        def fmt(v, fmt_str):
            return fmt_str.format(v) if v is not None else "—"

        print(f"{r['id']:<12}{r['color']:<12}"
              f"{fmt(r['webp_mae'], '{:10.1f}')}"
              f"{fmt(r['webp_psnr'], '{:10.2f}dB')}"
              f"{fmt(r['mp4_mae'], '{:10.1f}')}"
              f"{fmt(r['mp4_psnr'], '{:10.2f}dB')}  {verdict}")

    if bad:
        print(f"\nButtons whose WebP first frame diverges from source "
              f"(>{ceil:.1f} MAE): {', '.join(bad)}")
    else:
        print(f"\nAll {len(rows)} buttons within ceiling.")
    print(f"Debug PNGs: {OUT_DIR}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
