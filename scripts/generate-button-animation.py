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
    "me": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat brown skin-tone fill, "
        "solid teal shirt, PURE SOLID WHITE background #FFFFFF in every frame. "
        "The image shows a young person (male, brown skin, short black hair, "
        "teal shirt) pointing at their chest with their index finger. "
        "MOTION: the pointing index finger taps the chest twice — a gentle, "
        "rhythmic double-tap inward toward the body, about 1cm of motion per "
        "tap, with the rest of the arm and body remaining still. The tap is "
        "smooth and educational, self-referential. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical to "
        "the input image."
    ),
    "i": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat peach skin-tone fill, "
        "solid red shirt, PURE SOLID WHITE background #FFFFFF in every frame. "
        "The image shows a young person (male, light skin, short brown hair, "
        "red shirt) pointing at their own chest with their index finger. "
        "MOTION: the pointing index finger taps the chest twice — a gentle, "
        "rhythmic double-tap inward, about 1cm of motion, with the arm and body "
        "remaining still. Smooth and educational, self-referential. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "want": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat tan skin-tone fill, "
        "solid teal sleeve, two bidirectional arrows, PURE SOLID WHITE "
        "background #FFFFFF in every frame. "
        "The image shows two forearms extended from a teal sleeve on the left, "
        "hands open and cupped with palms facing upward, with arrows pointing "
        "toward the palms. "
        "MOTION: both hands gently pull inward toward the body (toward the "
        "sleeve on the left), curling the fingers slightly as if grasping or "
        "receiving, then extend back outward to the starting open-palm position. "
        "The arrows remain static. A smooth, cyclical reaching-and-receiving "
        "motion, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "give": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat tan skin-tone fill, "
        "solid teal sleeve, two directional arrows, PURE SOLID WHITE background "
        "#FFFFFF in every frame. "
        "The image shows two arms extending from a teal sleeve, both hands open "
        "with palms facing upward in an offering gesture, with arrows pointing "
        "left toward the cupped palms. "
        "MOTION: both hands gently extend outward away from the body (away from "
        "the sleeve), as if offering or presenting something. The fingers stay "
        "open and cupped. Then the hands withdraw back slightly to the starting "
        "position. A smooth, cyclical giving-and-returning motion, gentle and "
        "educational. The arrows remain static. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "me2": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat brown skin-tone fill, "
        "solid teal shirt, PURE SOLID WHITE background #FFFFFF in every frame. "
        "The image shows a young person (male, brown skin, short black hair, "
        "teal shirt) pointing at their chest with their index finger. "
        "MOTION: the pointing index finger taps the chest twice — a gentle, "
        "rhythmic double-tap inward toward the body, about 1cm of motion, with "
        "the body and other arm remaining still. Smooth and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "yes": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: bold black outlines, solid green fill, hand-drawn "
        "checkmark, PURE SOLID WHITE background #FFFFFF in every frame. "
        "MOTION: the checkmark performs a small, cheerful bounce — the entire "
        "checkmark scales up slightly (about 8%) and settles back, like a "
        "nodding confirmation. One smooth elastic bounce cycle, gentle and "
        "educational. No drawing/writing effect — the full checkmark is always "
        "present. "
        "CONSTRAINTS: hold the art style pixel-tight (same outline weight, same "
        "green fill). No camera movement, no zoom, no text, no extra objects. "
        "First and last frames identical to the input image."
    ),
    "no": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: bold black outlines, red gradient fill circle with "
        "a diagonal slash, PURE SOLID WHITE background #FFFFFF in every frame. "
        "MOTION: the entire no-symbol performs a small horizontal sway — a "
        "gentle shake left-right-left, like a shaking head, about 3-4 pixels "
        "of total displacement. One smooth head-shake cycle returning to center. "
        "CONSTRAINTS: hold the art style pixel-tight (same outline weight, same "
        "red gradient). No camera movement, no zoom, no text, no extra objects. "
        "First and last frames identical."
    ),
    "hi": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat skin-tone fill, solid "
        "green shirt, wavy blonde hair, motion lines, PURE SOLID WHITE "
        "background #FFFFFF in every frame. "
        "The image shows a smiling person (female-presenting, blonde wavy hair, "
        "green long-sleeve shirt) waving with palm forward. "
        "MOTION: the raised hand waves side-to-side in a friendly greeting — a "
        "smooth pendulum-like sway of the hand at the wrist, about 15 degrees "
        "left and right of center, with motion lines subtly pulsing. The face "
        "and body remain still. Two full wave cycles, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "bye": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat skin-tone fill, solid "
        "red shirt, brown hair, rear view, motion lines, PURE SOLID WHITE "
        "background #FFFFFF in every frame. "
        "The image shows a person from behind (brown hair, red long-sleeve "
        "shirt) with one hand raised and waving. "
        "MOTION: the raised hand waves side-to-side in a friendly goodbye — a "
        "smooth pendulum-like sway of the hand at the wrist, about 15 degrees "
        "left and right of center, with motion lines subtly pulsing. The body "
        "and head remain still. Two full wave cycles, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "my_turn": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat light skin-tone fill, "
        "solid red shirt, short brown hair, PURE SOLID WHITE background #FFFFFF "
        "in every frame. "
        "The image shows a young person (male, light skin, brown hair, red "
        "shirt) with their hand resting flat on their chest. "
        "MOTION: the hand on the chest lifts off slightly (about 1cm) and "
        "gently pats the chest twice — two soft taps, then returns to resting "
        "flat. A self-identifying gesture, gentle and educational. The body "
        "remains still. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "your_turn": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat light pink skin-tone "
        "fill, yellow rectangular border, drop shadow, PURE SOLID WHITE "
        "background #FFFFFF in every frame. "
        "The image shows a hand pointing directly at the viewer with the index "
        "finger extended, thumb folded down. "
        "MOTION: the pointing hand bounces forward slightly — the entire hand "
        "translates toward the viewer by about 2-3 pixels, then back to the "
        "starting position. A gentle, inviting point gesture, like indicating "
        "'you'. One smooth bounce cycle, educational. "
        "CONSTRAINTS: hold the art style pixel-tight (same outline weight, "
        "skin tone, yellow border). No camera movement, no zoom, no text, no "
        "extra objects. First and last frames identical."
    ),
    "more": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat peach skin-tone fill, "
        "two directional arrows, PURE SOLID WHITE background #FFFFFF in every "
        "frame. "
        "The image shows two hands with all fingertips touching and pointing "
        "toward each other, with arrows above pointing inward. "
        "MOTION: the two hands move apart slightly (about 5 pixels each side), "
        "then come back together to touch fingertips again. This is the classic "
        "ASL 'more' sign — a gentle tapping together of the fingertips. Two "
        "full tap-apart-together cycles, smooth and educational. The arrows "
        "remain static. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "all_done": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat tan skin-tone fill, "
        "ghost silhouettes, red curved arrows, PURE SOLID WHITE background "
        "#FFFFFF in every frame. "
        "The image shows two hands with ghost silhouettes and curved red arrows "
        "indicating outward twisting motion — the ASL 'all done' sign. "
        "MOTION: both hands twist outward from a palms-facing-inward position "
        "to a palms-facing-outward position, like brushing something away. "
        "The ghost silhouettes and arrows remain static as visual guides. "
        "A smooth, decisive outward twist completing one full cycle and "
        "returning to the starting palms-in position. Gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "washroom": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat skin-tone fill, "
        "solid purple shirt, blonde hair, white toilet, PURE SOLID WHITE "
        "background #FFFFFF in every frame. "
        "The image shows a person (blonde hair, purple shirt) sitting on a "
        "toilet, hands clasped together, leaning slightly forward. "
        "MOTION: the person performs a subtle seated wiggle or shift — a gentle "
        "side-to-side sway of the upper body, about 2-3 pixels, as if settling "
        "in the seat. The hands stay clasped. One smooth cycle, gentle and "
        "educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "wait": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, solid red fill, open palm "
        "hand with five fingers spread, PURE SOLID WHITE background #FFFFFF "
        "in every frame. "
        "The image shows a single red open hand, palm facing outward in a "
        "'stop' or 'wait' gesture. "
        "MOTION: the hand pulses forward gently — the entire hand scales up "
        "slightly (about 5%) as if pushing toward the viewer, then settles "
        "back to the original size. A smooth, firm but non-aggressive pulse, "
        "like politely saying 'wait' with a hand gesture. One cycle, "
        "educational. "
        "CONSTRAINTS: hold the art style pixel-tight (same red fill, same "
        "outline weight, same finger count). No camera movement, no zoom, no "
        "text, no extra objects. First and last frames identical. EXACTLY "
        "FIVE fingers — never six."
    ),
    "i_eat": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat peach skin-tone fill, "
        "horizontal double-headed arrow, person profile facing left, PURE "
        "SOLID WHITE background #FFFFFF in every frame. "
        "The image shows a person's profile on the right with a cupped hand and "
        "a horizontal arrow indicating back-and-forth motion toward the mouth. "
        "MOTION: the cupped hand moves toward the mouth (about 3-4 pixels "
        "right), as if bringing food to the lips, then moves back to the "
        "starting position. A smooth eating gesture — hand to mouth and back. "
        "The head remains still. Two complete cycles, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "i_drink": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat tan skin-tone fill, "
        "solid purple long-sleeve shirt, glass of liquid, PURE SOLID WHITE "
        "background #FFFFFF in every frame. "
        "The image shows a smiling person (dark hair, purple shirt) holding a "
        "clear glass of white liquid near their face. "
        "MOTION: the hand holding the glass tilts the glass upward slightly "
        "toward the mouth — a gentle tipping motion as if taking a sip — then "
        "returns the glass to the starting position. The face and body remain "
        "still. One smooth drinking cycle, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "hi2": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat skin-tone fill, solid "
        "green long-sleeve shirt, wavy blonde hair, motion lines, PURE SOLID "
        "WHITE background #FFFFFF in every frame. "
        "The image shows a smiling person (female-presenting, blonde wavy hair, "
        "green shirt) waving with palm forward. "
        "MOTION: the raised hand waves side-to-side in a friendly greeting — a "
        "smooth pendulum sway of the hand at the wrist, about 15 degrees left "
        "and right, with motion lines subtly pulsing. The body stays still. Two "
        "full wave cycles, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
    "bye2": (
        "Clean minimalist 2D line-art animation EXACTLY matching the reference "
        "image's art style: crisp black outlines, flat peach skin-tone fill, "
        "solid red long-sleeve shirt, brown hair, rear view, motion lines, "
        "PURE SOLID WHITE background #FFFFFF in every frame. "
        "The image shows a person from behind (brown hair, red shirt) with one "
        "hand raised waving. "
        "MOTION: the raised hand waves side-to-side — a smooth pendulum sway "
        "of the hand at the wrist, about 15 degrees left and right, with "
        "motion lines subtly pulsing. The body and head remain still. Two "
        "full wave cycles, gentle and educational. "
        "CONSTRAINTS: hold the art style pixel-tight. No camera movement, no "
        "zoom, no text, no extra objects. First and last frames identical."
    ),
}


def generate(client: genai.Client, button_id: str, model: str, duration: int,
              use_reference: bool = True) -> Path:
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
    if use_reference:
        print(f"[{button_id}] submitting to Veo (first+last frame = {src.name})...")
    else:
        print(f"[{button_id}] submitting to Veo (text-to-video, no ref image)...")

    config_kwargs = {
        "aspect_ratio": "16:9",
        "duration_seconds": duration,
        "number_of_videos": 1,
        "person_generation": "allow_all",
    }
    if use_reference:
        config_kwargs["last_frame"] = image

    op = client.models.generate_videos(
        model=model,
        prompt=prompt,
        image=image if use_reference else None,
        config=types.GenerateVideosConfig(**config_kwargs),
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

    gvs = op.response.generated_videos
    if not gvs:
        reason = getattr(op.response, 'rai_media_filtered_reason', None) or ""
        safety = getattr(op.response, 'rai_media_filtered_count', None)
        raise RuntimeError(
            f"Veo returned no videos (filtered={safety}, reason={reason}, "
            f"response_keys={list(op.response.model_fields.keys())})"
        )
    video_bytes = gvs[0].video.video_bytes
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
    ap.add_argument("--duration", type=int, default=4)
    ap.add_argument("--mp4-only", action="store_true", help="skip WebP conversion")
    ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--scale", type=int, default=320)
    ap.add_argument("--white-bg", action="store_true",
                    help="restore white bg Veo darkens (border flood-fill)")
    ap.add_argument("--from-mp4", help="skip generation; convert existing MP4 path")
    ap.add_argument("--no-reference", action="store_true",
                    help="text-to-video only (skip reference image — bypasses face filter)")
    args = ap.parse_args()

    if args.from_mp4:
        mp4 = Path(args.from_mp4)
    else:
        client = make_client()
        mp4 = generate(client, args.button, args.model, args.duration,
                       use_reference=not args.no_reference)
    if not args.mp4_only:
        to_webp(mp4, args.button, fps=args.fps, scale=args.scale,
                white_bg=args.white_bg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
