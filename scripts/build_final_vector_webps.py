#!/usr/bin/env python3
"""
Robust 512x512 Vector WebP Animation Builder.
Encodes all 20 core AAC cards into 100% compliant 512x512 transparent WebP files via FFmpeg.
"""

import os
import math
import json
import subprocess
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

SCALE = 1024
OUT_SCALE = 512

def create_super_canvas():
    return Image.new("RGBA", (SCALE, SCALE), (0, 0, 0, 0))

def downsample(img):
    return img.resize((OUT_SCALE, OUT_SCALE), resample=Image.Resampling.LANCZOS)

def draw_bold_circle(draw, center, radius, fill_color, outline_color, width=24):
    cx, cy = center
    bbox = [cx - radius, cy - radius, cx + radius, cy + radius]
    draw.ellipse(bbox, fill=fill_color, outline=outline_color, width=width)

def draw_bold_rounded_rect(draw, bbox, radius, fill_color, outline_color, width=24):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill_color, outline=outline_color, width=width)

# ----------------- Card Renderers -----------------

def render_hi(frame_idx, total_frames=30):
    img = create_super_canvas()
    t = frame_idx / total_frames
    angle = math.sin(t * 4 * math.pi) * 22.0
    
    hand_img = Image.new("RGBA", (SCALE, SCALE), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(hand_img, "RGBA")
    
    cx, cy = 512, 600
    hdraw.rounded_rectangle([cx - 140, cy - 120, cx + 140, cy + 160], radius=70, fill=(255, 205, 80, 255), outline=(30, 30, 30, 255), width=24)
    finger_offsets = [-100, -35, 35, 100]
    finger_heights = [240, 280, 260, 200]
    for x_off, h in zip(finger_offsets, finger_heights):
        hdraw.rounded_rectangle([cx + x_off - 30, cy - 120 - h, cx + x_off + 30, cy - 60], radius=30, fill=(255, 205, 80, 255), outline=(30, 30, 30, 255), width=24)
    hdraw.rounded_rectangle([cx - 210, cy - 20, cx - 110, cy + 60], radius=35, fill=(255, 205, 80, 255), outline=(30, 30, 30, 255), width=24)
    
    rotated = hand_img.rotate(angle, resample=Image.Resampling.BILINEAR, center=(cx, cy + 120))
    img.alpha_composite(rotated)
    return downsample(img)

def render_yes(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    scale_factor = 1.0 + 0.12 * math.sin(t * 2 * math.pi)
    cx, cy = 512, 512
    r = int(360 * scale_factor)
    draw_bold_circle(draw, (cx, cy), r, fill_color=(76, 175, 80, 255), outline_color=(30, 30, 30, 255), width=24)
    pts = [
        (cx - int(160 * scale_factor), cy + int(10 * scale_factor)),
        (cx - int(40 * scale_factor), cy + int(130 * scale_factor)),
        (cx + int(170 * scale_factor), cy - int(120 * scale_factor))
    ]
    draw.line(pts, fill=(255, 255, 255, 255), width=int(56 * scale_factor), joint="round")
    draw.line(pts, fill=(30, 30, 30, 255), width=int(14 * scale_factor), joint="round")
    return downsample(img)

def render_no(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    shake_x = int(math.sin(t * 6 * math.pi) * 24.0)
    cx, cy = 512 + shake_x, 512
    r = 360
    draw_bold_circle(draw, (cx, cy), r, fill_color=(244, 67, 54, 255), outline_color=(30, 30, 30, 255), width=24)
    bar_len = 180
    pts1 = [(cx - bar_len, cy - bar_len), (cx + bar_len, cy + bar_len)]
    pts2 = [(cx + bar_len, cy - bar_len), (cx - bar_len, cy + bar_len)]
    draw.line(pts1, fill=(255, 255, 255, 255), width=60, joint="round")
    draw.line(pts2, fill=(255, 255, 255, 255), width=60, joint="round")
    return downsample(img)

def render_pointing(frame_idx, total_frames=30, color=(255, 235, 59, 255)):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    y_off = int(math.sin(t * 2 * math.pi) * 40.0)
    cx, cy = 512, 540 + y_off
    draw_bold_rounded_rect(draw, [cx - 150, cy - 40, cx + 150, cy + 220], radius=80, fill_color=color, outline_color=(30, 30, 30, 255), width=24)
    draw_bold_rounded_rect(draw, [cx - 45, cy - 300, cx + 45, cy - 20], radius=45, fill_color=color, outline_color=(30, 30, 30, 255), width=24)
    return downsample(img)

def render_help(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    y_lift = int(math.sin(t * 2 * math.pi) * 30.0)
    cx, cy = 512, 512
    draw_bold_rounded_rect(draw, [cx - 260, cy + 80 + y_lift, cx + 260, cy + 220 + y_lift], radius=50, fill_color=(129, 199, 132, 255), outline_color=(30, 30, 30, 255), width=24)
    draw_bold_rounded_rect(draw, [cx - 140, cy - 180 + y_lift, cx + 140, cy + 40 + y_lift], radius=70, fill_color=(129, 199, 132, 255), outline_color=(30, 30, 30, 255), width=24)
    return downsample(img)

def render_eat(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    cx, cy = 512, 540
    draw_bold_circle(draw, (cx, cy), 320, fill_color=(240, 240, 240, 255), outline_color=(76, 175, 80, 255), width=32)
    draw_bold_rounded_rect(draw, [cx - 220, cy - 300, cx - 160, cy + 100], radius=30, fill_color=(50, 50, 50, 255), outline_color=(30, 30, 30, 255), width=16)
    draw_bold_rounded_rect(draw, [cx + 160, cy - 300, cx + 220, cy + 100], radius=30, fill_color=(50, 50, 50, 255), outline_color=(30, 30, 30, 255), width=16)
    return downsample(img)

def render_drink(frame_idx, total_frames=30):
    img = create_super_canvas()
    t = frame_idx / total_frames
    angle = math.sin(t * 2 * math.pi) * 20.0
    cup_img = Image.new("RGBA", (SCALE, SCALE), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(cup_img, "RGBA")
    cx, cy = 512, 540
    draw_bold_rounded_rect(cdraw, [cx - 160, cy - 200, cx + 160, cy + 200], radius=40, fill_color=(129, 199, 132, 255), outline_color=(30, 30, 30, 255), width=24)
    draw_bold_rounded_rect(cdraw, [cx + 40, cy - 380, cx + 90, cy - 100], radius=20, fill_color=(255, 152, 0, 255), outline_color=(30, 30, 30, 255), width=16)
    rotated = cup_img.rotate(angle, resample=Image.Resampling.BILINEAR, center=(cx, cy + 100))
    img.alpha_composite(rotated)
    return downsample(img)

def render_wait(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    scale_factor = 1.0 + 0.08 * math.sin(t * 2 * math.pi)
    cx, cy = 512, 512
    r = int(360 * scale_factor)
    pts = [(cx + int(r * math.cos(math.pi / 8 + i * math.pi / 4)), cy + int(r * math.sin(math.pi / 8 + i * math.pi / 4))) for i in range(8)]
    draw.polygon(pts, fill=(244, 67, 54, 255), outline=(30, 30, 30, 255))
    draw_bold_rounded_rect(draw, [cx - 100, cy - 140, cx + 100, cy + 140], radius=50, fill_color=(255, 255, 255, 255), outline_color=(30, 30, 30, 255), width=20)
    return downsample(img)

def render_washroom(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    y_bounce = int(math.sin(t * 2 * math.pi) * 20.0)
    cx, cy = 512, 512 + y_bounce
    draw_bold_circle(draw, (cx, cy), 360, fill_color=(255, 183, 77, 255), outline_color=(30, 30, 30, 255), width=24)
    draw_bold_circle(draw, (cx, cy - 140), 70, fill_color=(255, 255, 255, 255), outline_color=(30, 30, 30, 255), width=16)
    draw_bold_rounded_rect(draw, [cx - 100, cy - 40, cx + 100, cy + 180], radius=40, fill_color=(255, 255, 255, 255), outline_color=(30, 30, 30, 255), width=16)
    return downsample(img)

def render_more(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    scale_factor = 1.0 + 0.15 * math.sin(t * 2 * math.pi)
    cx, cy = 512, 512
    r = int(360 * scale_factor)
    draw_bold_circle(draw, (cx, cy), r, fill_color=(100, 181, 246, 255), outline_color=(30, 30, 30, 255), width=24)
    arm_w = int(60 * scale_factor)
    arm_h = int(220 * scale_factor)
    draw_bold_rounded_rect(draw, [cx - arm_h, cy - arm_w, cx + arm_h, cy + arm_w], radius=30, fill_color=(255, 255, 255, 255), outline_color=(30, 30, 30, 255), width=16)
    draw_bold_rounded_rect(draw, [cx - arm_w, cy - arm_h, cx + arm_w, cy + arm_h], radius=30, fill_color=(255, 255, 255, 255), outline_color=(30, 30, 30, 255), width=16)
    return downsample(img)

def render_all_done(frame_idx, total_frames=30):
    img = create_super_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    t = frame_idx / total_frames
    cx, cy = 512, 512
    draw_bold_circle(draw, (cx, cy), 360, fill_color=(240, 98, 146, 255), outline_color=(30, 30, 30, 255), width=24)
    pts = [(cx - 140, cy), (cx - 30, cy + 110), (cx + 150, cy - 100)]
    draw.line(pts, fill=(255, 255, 255, 255), width=50, joint="round")
    draw.line(pts, fill=(30, 30, 30, 255), width=12, joint="round")
    return downsample(img)

RENDERERS = {
    'hi': render_hi,
    'hi2': render_hi,
    'bye': render_hi,
    'bye2': render_hi,
    'yes': render_yes,
    'no': render_no,
    'me': lambda f, tot=30: render_pointing(f, tot, color=(255, 235, 59, 255)),
    'me2': lambda f, tot=30: render_pointing(f, tot, color=(255, 235, 59, 255)),
    'i': lambda f, tot=30: render_pointing(f, tot, color=(255, 235, 59, 255)),
    'my_turn': lambda f, tot=30: render_pointing(f, tot, color=(255, 235, 59, 255)),
    'your_turn': lambda f, tot=30: render_pointing(f, tot, color=(255, 235, 59, 255)),
    'want': render_help,
    'give': render_help,
    'help': render_help,
    'i_eat': render_eat,
    'i_drink': render_drink,
    'wait': render_wait,
    'washroom': render_washroom,
    'more': render_more,
    'all_done': render_all_done,
}

def main():
    out_dir = Path("public/images/core/animated")
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}

    print("Encoding 512x512 vector WebP animations via FFmpeg...", flush=True)
    for card_id, fn in RENDERERS.items():
        tmp_dir = Path(f"/tmp/vec_build_{card_id}")
        if tmp_dir.exists():
            shutil.rmtree(tmp_dir)
        tmp_dir.mkdir(parents=True, exist_ok=True)

        for f in range(30):
            img = fn(f, 30)
            img.save(tmp_dir / f"frame_{f:04d}.png")

        webp_path = out_dir / f"{card_id}.webp"
        cmd = [
            "ffmpeg", "-y",
            "-framerate", "30",
            "-i", str(tmp_dir / "frame_%04d.png"),
            "-c:v", "libwebp",
            "-lossless", "0",
            "-compression_level", "6",
            "-q:v", "90",
            "-loop", "0",
            "-pix_fmt", "yuva420p",
            str(webp_path)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.rmtree(tmp_dir)
        durations[card_id] = 1.0
        print(f"  ✓ [{card_id:10s}] -> {webp_path} (1.00s, 30 frames)", flush=True)

    print("\n✓ ALL 20 CARDS GENERATED SUCCESSFULLY!", flush=True)
    with open("public/images/core/animated/durations.json", "w") as f:
        json.dump(durations, f, indent=2)

if __name__ == "__main__":
    main()
