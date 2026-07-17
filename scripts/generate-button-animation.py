#!/usr/bin/env python3
"""Animate an AAC board button image via Google Cloud Veo (Vertex AI).

The original PNG is used as the FIRST frame of the generated video. Veo outputs
an MP4; we convert it to a looping animated WebP for cheap, smooth playback in
the browser while a button is held down.

Auth: shells out to `gcloud auth print-access-token` (ADC-refresh shim) — the
SA key in ~/cathy-ai is empty, but the user account has a valid refresh token.

Usage:
    python3 scripts/generate-button-animation.py help
    python3 scripts/generate-button-animation.py help --model veo-3.1-fast-generate-001
"""
import argparse
import subprocess
import sys
import time
from pathlib import Path

_VENV = "/home/herbert/cathy-ai/.venv/lib/python3.12/site-packages"
if _VENV not in sys.path:
    sys.path.insert(0, _VENV)

from google import genai  # noqa: E402
from google.genai import types  # noqa: E402
from google.oauth2.credentials import Credentials  # noqa: E402

# cathy-ai's project with Veo enabled (free-trail quota lives here).
PROJECT = "project-104f43b7-de67-438a-a91"
LOCATION = "us-central1"
DEFAULT_MODEL = "veo-3.1-fast-generate-001"

REPO = Path(__file__).resolve().parent.parent
IMG_DIR = REPO / "public" / "images" / "core"
OUT_DIR = REPO / "public" / "images" / "core" / "animated"


def _gcloud_token() -> str:
    out = subprocess.run(
        ["gcloud", "auth", "print-access-token"],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        raise RuntimeError(f"gcloud auth failed: {out.stderr.strip()}")
    return out.stdout.strip()


class GcloudCred(Credentials):
    """Refreshable OAuth creds backed by `gcloud auth print-access-token`."""

    def __init__(self):
        super().__init__(token=_gcloud_token(), quota_project_id=PROJECT)

    def refresh(self, request):  # noqa: ARG002
        self.token = _gcloud_token()


def make_client() -> genai.Client:
    return genai.Client(
        vertexai=True, project=PROJECT, location=LOCATION, credentials=GcloudCred(),
    )


# Per-button motion prompts. Original PNG is the rest pose and first+last frame,
# so the animation loops seamlessly while the button is held.
PROMPTS = {
    "help": (
        "Clean minimalist 2D line-art animation that EXACTLY matches the reference "
        "image's art style: crisp black outlines, flat light-brown skin-tone fill, "
        "and a PURE SOLID WHITE background, same in EVERY frame. "
        "BACKGROUND (critical): the background must be pure solid white #FFFFFF in "
        "every single frame — bright, flat, featureless, with no shadows, no "
        "gradient, no grey, and absolutely never dark or black. Keep the white "
        "background of the reference image exactly. "
        "The composition shows the American Sign Language (ASL) sign for 'Help': "
        "a flat open lower hand oriented horizontally, palm facing upward, fingers "
        "pointing left; resting on its palm is an upper hand shaped as a closed "
        "fist with the thumb extended straight up (a thumbs-up, exactly FIVE "
        "digits total — never six). "
        "MOTION: the upper fist lifts straight upward, smoothly rising about one "
        "hand-width above the flat palm — the classic ASL 'help' gesture — then "
        "lowers back down to rest on the palm again. The lower flat hand remains "
        "perfectly still throughout. The rise and fall is gentle, even, and "
        "educational, completing one full up-and-down cycle that returns exactly "
        "to the starting pose for a seamless loop. "
        "CONSTRAINTS: hold the art style of frame one pixel-tight (same line "
        "weight, same skin tone, same pure white background). No camera movement, "
        "no zoom, no rotation, no text, no labels, no captions, no shadows, no "
        "extra objects, no background change. The first and last frames must be "
        "identical to the input image."
    ),
}


def generate(client: genai.Client, button_id: str, model: str, duration: int) -> Path:
    src = IMG_DIR / f"{button_id}.png"
    if not src.exists():
        raise FileNotFoundError(src)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    prompt = PROMPTS.get(button_id)
    if not prompt:
        raise KeyError(f"No motion prompt defined for button '{button_id}'")

    img_bytes = src.read_bytes()
    image = types.Image(image_bytes=img_bytes, mime_type="image/png")

    print(f"[{button_id}] model={model} duration={duration}s")
    print(f"[{button_id}] submitting to Veo (first+last frame = {src.name})...")

    op = client.models.generate_videos(
        model=model,
        prompt=prompt,
        image=image,
        config=types.GenerateVideosConfig(
            last_frame=image,          # loop back to the original pose
            # Veo 3.1 fast has no 1:1; generate 16:9 then center-crop to square.
            aspect_ratio="16:9",
            duration_seconds=duration,
            number_of_videos=1,
        ),
    )
    print(f"[{button_id}] operation: {op.name}")

    n = 0
    while not op.done:
        time.sleep(15)
        n += 1
        op = client.operations.get(operation=op)
        print(f"[{button_id}] poll {n} ({n*15}s) done={op.done}")

    if op.error:
        raise RuntimeError(f"Veo failed: {op.error}")

    video_bytes = op.response.generated_videos[0].video.video_bytes
    mp4 = OUT_DIR / f"{button_id}.mp4"
    mp4.write_bytes(video_bytes)
    print(f"[{button_id}] saved {mp4} ({len(video_bytes)} bytes)")
    return mp4


def _salvage_white_bg(frame: Path, luma_thresh: int = 28) -> None:
    """Veo flips flat white backgrounds to black. Restore white by flooding the
    border-connected dark region and setting only it to white — internal outlines
    (finger lines, enclosed by hands) are preserved. In-place edit of `frame`."""
    import numpy as np
    from PIL import Image

    rgb = np.array(Image.open(frame).convert("RGB"))
    luma = rgb.astype(int).sum(axis=2)  # 0..765
    dark = luma < luma_thresh
    if not dark.any():
        return

    # Seed = dark pixels touching the border; grow within `dark` until stable.
    grown = np.zeros_like(dark)
    grown[0, :] |= dark[0, :]
    grown[-1, :] |= dark[-1, :]
    grown[:, 0] |= dark[:, 0]
    grown[:, -1] |= dark[:, -1]

    def _dilate(m):
        out = np.zeros_like(m)
        out[1:, :] |= m[:-1, :]
        out[:-1, :] |= m[1:, :]
        out[:, 1:] |= m[:, :-1]
        out[:, :-1] |= m[:, 1:]
        return out

    while True:
        nxt = _dilate(grown) & dark
        if np.array_equal(nxt, grown):
            break
        grown = nxt

    rgb[grown] = [255, 255, 255]
    Image.fromarray(rgb).save(frame)


def to_webp(
    mp4: Path,
    button_id: str,
    fps: int = 12,
    scale: int = 320,
    white_bg: bool = False,
) -> Path:
    """MP4 -> looping animated WebP. Veo emits 16:9; center-crop to square to
    match the board icon, then scale. With `white_bg`, restore the white
    background Veo darkens (per-frame border flood-fill)."""
    import tempfile

    webp = OUT_DIR / f"{button_id}.webp"
    crop = "crop=min(iw\\,ih):min(iw\\,ih)"

    if not white_bg:
        cmd = [
            "ffmpeg", "-y", "-i", str(mp4),
            "-vf", f"fps={fps},{crop},scale={scale}:{scale}:flags=lanczos",
            "-loop", "0", "-preset", "picture", "-lossless", "0", "-q:v", "60",
            "-metadata", f"comment=aac-board animated button: {button_id}",
            str(webp),
        ]
        print(f"[{button_id}] ffmpeg -> {webp.name}")
        subprocess.run(cmd, check=True, capture_output=True)
    else:
        # 1. dump square cropped+scaled PNG frames
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            subprocess.run([
                "ffmpeg", "-y", "-i", str(mp4),
                "-vf", f"fps={fps},{crop},scale={scale}:{scale}:flags=lanczos",
                str(td / "f%04d.png"),
            ], check=True, capture_output=True)
            frames = sorted(td.glob("f*.png"))
            print(f"[{button_id}] salvaging white bg on {len(frames)} frames...")
            for f in frames:
                _salvage_white_bg(f)
            # 2. re-encode to animated webp
            subprocess.run([
                "ffmpeg", "-y", "-i", str(td / "f%04d.png"),
                "-loop", "0", "-preset", "picture", "-lossless", "0", "-q:v", "60",
                "-metadata", f"comment=aac-board animated button: {button_id}",
                str(webp),
            ], check=True, capture_output=True)

    print(f"[{button_id}] saved {webp} ({webp.stat().st_size} bytes)")
    return webp


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("button", help="button id (e.g. help)")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--duration", type=int, default=5)
    ap.add_argument("--mp4-only", action="store_true", help="skip WebP conversion")
    ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--scale", type=int, default=320)
    ap.add_argument("--white-bg", action="store_true",
                    help="restore white bg Veo darkens (border flood-fill)")
    ap.add_argument("--from-mp4", help="skip generation; convert existing MP4 path")
    args = ap.parse_args()

    if args.from_mp4:
        mp4 = Path(args.from_mp4)
    else:
        client = make_client()
        mp4 = generate(client, args.button, args.model, args.duration)
    if not args.mp4_only:
        to_webp(mp4, args.button, fps=args.fps, scale=args.scale,
                white_bg=args.white_bg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
