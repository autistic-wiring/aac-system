#!/usr/bin/env python3
"""
Batch 512x512 Vector Transparent WebP Generator.
Reuses single Playwright page instance to render 512x512 transparent WebPs for all 20 cards.
"""

import sys
import os
import json
import subprocess
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
import importlib.util

spec = importlib.util.spec_from_file_location("gen_cards", os.path.join(os.path.dirname(__file__), "generate-all-vector-cards.py"))
gen_cards = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen_cards)
CARD_GENERATORS = gen_cards.CARD_GENERATORS
HTML_TEMPLATE = gen_cards.HTML_TEMPLATE

def render_card_frames(page, card_id, gen_fn, out_dir):
    print(f"Generating 512x512 vector animation for [{card_id}]...", flush=True)
    lottie_json = gen_fn(frames=60, title=card_id)
    
    info = page.evaluate("data => loadLottie(data)", lottie_json)
    total_frames = int(info["totalFrames"])
    native_fps = float(info["frameRate"]) or 30.0

    tmp_dir = Path(f"/tmp/vec_frames_{card_id}")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    # 30 fps sampling (step of 1 for 60-frame 30fps animation)
    for f in range(total_frames):
        page.evaluate("frame => goToFrame(frame)", f)
        frame_path = tmp_dir / f"frame_{f:04d}.png"
        page.screenshot(path=str(frame_path), omit_background=True)

    duration = total_frames / native_fps
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
    print(f"  ✓ [{card_id}] -> {webp_path} ({duration:.2f}s, {total_frames} frames)", flush=True)
    return round(duration, 3)

def main():
    out_dir = Path("public/images/core/animated")
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 512, "height": 512})
        page.set_content(HTML_TEMPLATE)

        for card_id, gen_fn in CARD_GENERATORS.items():
            durations[card_id] = render_card_frames(page, card_id, gen_fn, out_dir)

        browser.close()

    print("\n✓ ALL 20 CORE CARDS RENDERED SUCCESSFULLY!", flush=True)
    print("Durations Map:")
    print(json.dumps(durations, indent=2))

    # Save calculated durations to json
    with open("public/images/core/animated/durations.json", "w") as f:
        json.dump(durations, f, indent=2)

if __name__ == "__main__":
    main()
