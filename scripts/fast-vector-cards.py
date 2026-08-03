#!/usr/bin/env python3
"""
Super-Fast 512x512 High-Resolution Vector WebP Card Animation Generator.
Renders all frames in-memory via HTML5 canvas and exports crisp 512x512 transparent WebPs.
"""

import sys
import os
import json
import base64
import subprocess
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 512px;
      height: 512px;
      background: transparent;
      overflow: hidden;
    }
    #container {
      width: 512px;
      height: 512px;
      background: transparent;
    }
    svg {
      width: 512px !important;
      height: 512px !important;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
</head>
<body>
  <div id="container"></div>
  <canvas id="cvs" width="512" height="512"></canvas>
  <script>
    let anim = null;
    function loadLottie(animationData) {
      document.getElementById('container').innerHTML = '';
      anim = lottie.loadAnimation({
        container: document.getElementById('container'),
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: animationData
      });
      return new Promise((resolve) => {
        anim.addEventListener('DOMLoaded', () => {
          resolve({
            totalFrames: anim.totalFrames,
            frameRate: anim.frameRate || 30
          });
        });
      });
    }

    async function exportAllFrames(fps) {
      const totalFrames = anim.totalFrames;
      const nativeFps = anim.frameRate || 30;
      const step = Math.max(1, Math.round(nativeFps / fps));
      const frames = [];

      const cvs = document.getElementById('cvs');
      const ctx = cvs.getContext('2d');
      const svgContainer = document.getElementById('container');

      for (let f = 0; f < totalFrames; f += step) {
        anim.goToAndStop(f, true);
        const svgElement = svgContainer.querySelector('svg');
        const xml = new XMLSerializer().serializeToString(svgElement);
        const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

        await new Promise((res) => {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, 512, 512);
            ctx.drawImage(img, 0, 0, 512, 512);
            frames.push(cvs.toDataURL('image/png'));
            res();
          };
          img.src = svgUrl;
        });
      }
      return { frames, duration: totalFrames / nativeFps };
    }
  </script>
</body>
</html>
"""

import importlib.util
spec = importlib.util.spec_from_file_location("gen_cards", os.path.join(os.path.dirname(__file__), "generate-all-vector-cards.py"))
gen_cards = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen_cards)
CARD_GENERATORS = gen_cards.CARD_GENERATORS

def render_fast_card(page, card_id, gen_fn, out_dir):
    print(f"Generating 512x512 vector WebP for [{card_id}]...")
    lottie_json = gen_fn(frames=60, title=card_id)
    page.evaluate("data => loadLottie(data)", lottie_json)
    result = page.evaluate("fps => exportAllFrames(fps)", 30)

    frames = result["frames"]
    duration = result["duration"]

    tmp_dir = Path(f"/tmp/fast_frames_{card_id}")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    for i, data_url in enumerate(frames):
        b64_data = data_url.split(",")[1]
        img_bytes = base64.b64decode(b64_data)
        with open(tmp_dir / f"frame_{i:04d}.png", "wb") as f:
            f.write(img_bytes)

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
    print(f"  ✓ Saved {webp_path} ({duration:.2f}s, {len(frames)} frames)")
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
            durations[card_id] = render_fast_card(page, card_id, gen_fn, out_dir)

        browser.close()

    print("\nAll 20 cards rendered successfully!")
    print("Duration map:")
    print(json.dumps(durations, indent=2))

if __name__ == "__main__":
    main()
