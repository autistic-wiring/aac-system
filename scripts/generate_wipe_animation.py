#!/usr/bin/env python3
"""
Generates high-quality animated WebP for the 'wipe' AAC card (tissue box pulling tissue).
Guarantees Frame 0 is 100% identical to public/images/core/wipe.png.
"""

import math
import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

REPO_DIR = Path(__file__).resolve().parent.parent
ICON_PATH = REPO_DIR / "public" / "images" / "core" / "wipe.png"
OUTPUT_WEBP = REPO_DIR / "public" / "images" / "core" / "animated" / "wipe.webp"

TOTAL_FRAMES = 30
FPS = 30
WIDTH = 512
HEIGHT = 512

def extract_layers(icon_img):
    """
    Extract box background and tissue foreground from wipe.png.
    Returns (box_bg_img, tissue_fg_img, slot_polygon).
    """
    arr = np.array(icon_img.convert("RGBA"), dtype=np.uint8)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # White tissue fill: R>200, G>200, B>200, A>100
    # Tissue outlines: attached dark pixels above Y=240
    is_white = (r > 200) & (g > 200) & (b > 200) & (a > 100)
    is_cyan = (g > 120) & (b > 160) & (r < 100) & (a > 100)

    # Tissue mask
    tissue_mask = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if a[y, x] > 50:
                if is_white[y, x]:
                    tissue_mask[y, x] = True
                elif y < 235 and not is_cyan[y, x]:
                    tissue_mask[y, x] = True

    # Tissue image
    tissue_arr = np.zeros_like(arr)
    tissue_arr[tissue_mask] = arr[tissue_mask]
    tissue_img = Image.fromarray(tissue_arr, "RGBA")

    # Box background image (without top tissue)
    box_arr = arr.copy()
    box_arr[tissue_mask] = 0
    box_img = Image.fromarray(box_arr, "RGBA")

    # Draw box top slot interior on box_img where tissue was removed
    # The slot on top of the tissue box is centered around X: 175..335, Y: 200..240
    slot_draw = ImageDraw.Draw(box_img, "RGBA")
    
    # Slot inner shadow oval
    slot_bbox = [175, 205, 335, 240]
    slot_draw.ellipse(slot_bbox, fill=(16, 100, 135, 255), outline=(30, 30, 30, 255), width=10)

    return box_img, tissue_img, slot_bbox


def draw_hand(draw, pinch_x, pinch_y, frame_idx):
    """
    Draw a clean vector hand in pinching pose at (pinch_x, pinch_y).
    Matching the AAC line-art style (yellow hand fill, thick black outlines).
    """
    hand_color = (255, 205, 80, 255)  # AAC warm yellow skin tone
    outline_color = (30, 30, 30, 255)
    w = 12

    # Hand wrist and palm coming from top right
    wrist_x, wrist_y = pinch_x + 90, pinch_y - 120
    
    # Palm body
    palm_poly = [
        (wrist_x - 30, wrist_y - 40),
        (wrist_x + 60, wrist_y - 40),
        (pinch_x + 50, pinch_y - 10),
        (pinch_x + 20, pinch_y - 10),
    ]
    draw.polygon(palm_poly, fill=hand_color, outline=outline_color)

    # Thumb & Index Finger pinching tissue top
    # Index finger curling down to pinch
    draw.rounded_rectangle(
        [pinch_x - 15, pinch_y - 35, pinch_x + 25, pinch_y + 10],
        radius=12, fill=hand_color, outline=outline_color, width=w
    )
    # Thumb pressing from side
    draw.rounded_rectangle(
        [pinch_x - 30, pinch_y - 20, pinch_x + 10, pinch_y + 15],
        radius=12, fill=hand_color, outline=outline_color, width=w
    )
    # Wrist arm segment extending up-right
    arm_poly = [
        (wrist_x - 35, wrist_y - 100),
        (wrist_x + 65, wrist_y - 100),
        (wrist_x + 55, wrist_y - 35),
        (wrist_x - 25, wrist_y - 35),
    ]
    draw.polygon(arm_poly, fill=hand_color, outline=outline_color)


def render_frame(frame_idx, icon_img, box_img, tissue_img, slot_bbox, include_hand=True):
    # FRAME 0 MUST BE EXACTLY THE SOURCE ICON PNG
    if frame_idx == 0:
        return icon_img.copy()

    t = frame_idx / TOTAL_FRAMES  # 0.0 to ~1.0

    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))

    # Base Box
    canvas.alpha_composite(box_img)

    # Slot parameters
    slot_cx = (slot_bbox[0] + slot_bbox[2]) // 2
    slot_top_y = slot_bbox[1]

    # Animation phases:
    # Phase 1 (t: 0.0 -> 0.6, frames 1 -> 18): Tissue 1 pulled UP out of slot.
    # Phase 2 (t: 0.3 -> 1.0, frames 9 -> 29): Tissue 2 emerges from slot and rises to rest pose.

    # 1. Tissue 1 (being pulled out)
    # Offset y goes from 0 up to -320
    pull_progress = min(1.0, (frame_idx / 18.0))
    # Easing out
    pull_y = -int(320 * (1 - (1 - pull_progress) ** 2))
    
    if pull_progress < 1.0:
        t1_img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        # Place Tissue 1 shifted up
        t1_img.paste(tissue_img, (0, pull_y), tissue_img)
        
        # Fade out tissue 1 near end of pull
        if pull_progress > 0.7:
            alpha_factor = 1.0 - ((pull_progress - 0.7) / 0.3)
            t1_arr = np.array(t1_img)
            t1_arr[:, :, 3] = (t1_arr[:, :, 3] * alpha_factor).astype(np.uint8)
            t1_img = Image.fromarray(t1_arr, "RGBA")

        canvas.alpha_composite(t1_img)

    # 2. Tissue 2 (next tissue emerging from slot)
    # Emerges starting around frame 8 (t = 8/30 = 0.267) up to frame 29
    emerge_start = 6
    if frame_idx >= emerge_start:
        emerge_progress = (frame_idx - emerge_start) / (TOTAL_FRAMES - 1 - emerge_start)
        emerge_progress = min(1.0, max(0.0, emerge_progress))

        # Easing: rises from y_offset = +130 up to y_offset = 0
        t2_y_offset = int(130 * (1 - emerge_progress))

        t2_full = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        t2_full.paste(tissue_img, (0, t2_y_offset), tissue_img)

        # Mask Tissue 2 so it only shows above the slot top Y (y >= slot_top_y)
        # Create mask: keep pixels where Y < slot_top_y + 35 (above the slot opening)
        mask = Image.new("L", (WIDTH, HEIGHT), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rectangle([0, 0, WIDTH, slot_top_y + 35 + t2_y_offset], fill=255)

        t2_masked = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        t2_masked.paste(t2_full, (0, 0), mask)

        canvas.alpha_composite(t2_masked)

    # 3. Hand pulling tissue (optional gesture)
    if include_hand and 2 <= frame_idx <= 25:
        # Hand follows tissue 1 top
        # Tissue 1 top tip is around Y=74, X=240 in original
        top_tip_x = 240
        top_tip_y = 74 + pull_y

        if frame_idx <= 4:
            # Hand entering from top-right
            enter_t = (frame_idx - 2) / 2.0
            hx = int(top_tip_x + 80 * (1 - enter_t))
            hy = int(top_tip_y - 60 * (1 - enter_t))
        elif frame_idx <= 18:
            # Hand pulling tissue up
            hx = top_tip_x
            hy = top_tip_y
        else:
            # Hand exiting top-right
            exit_t = (frame_idx - 18) / 7.0
            hx = int(top_tip_x + 100 * exit_t)
            hy = int(top_tip_y - 80 * exit_t)

        hand_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        hdraw = ImageDraw.Draw(hand_layer, "RGBA")
        draw_hand(hdraw, hx, hy, frame_idx)
        canvas.alpha_composite(hand_layer)

    return canvas


def main():
    print(f"Loading icon from {ICON_PATH}...")
    icon_img = Image.open(ICON_PATH).convert("RGBA")
    box_img, tissue_img, slot_bbox = extract_layers(icon_img)

    tmp_dir = Path("/tmp/wipe_anim_frames")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    print(f"Rendering {TOTAL_FRAMES} frames...")
    for f in range(TOTAL_FRAMES):
        frame = render_frame(f, icon_img, box_img, tissue_img, slot_bbox, include_hand=True)
        frame.save(tmp_dir / f"frame_{f:04d}.png")

    print("Encoding WebP animation with sharp (node)...")
    # Use sharp node script to encode transparent animated webp
    node_cmd = [
        "node", "-e", f"""
        import sharp from 'sharp';
        import fs from 'fs';

        async function encode() {{
            const frames = [];
            for (let i = 0; i < {TOTAL_FRAMES}; i++) {{
                const num = String(i).padStart(4, '0');
                frames.push(`/tmp/wipe_anim_frames/frame_${{num}}.png`);
            }}
            
            // Stack images vertically for multi-page webp
            const buffers = await Promise.all(frames.map(f => fs.promises.readFile(f)));
            const delayArr = Array({TOTAL_FRAMES}).fill(33);
            
            // Build animated WebP using sharp page stacking / webpmux
            // sharp join / page encoding:
            await sharp(buffers[0])
                .toFile('{OUTPUT_WEBP}');
        }}
        """
    ]

    # Or encode via ffmpeg:
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", str(tmp_dir / "frame_%04d.png"),
        "-c:v", "libwebp",
        "-lossless", "1",
        "-compression_level", "6",
        "-loop", "0",
        "-pix_fmt", "yuva420p",
        str(OUTPUT_WEBP)
    ]
    subprocess.run(ffmpeg_cmd, check=True)

    print(f"✓ WebP saved to {OUTPUT_WEBP}")

if __name__ == "__main__":
    main()
