import sys
import os
import json
import time
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
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
</head>
<body>
  <div id="container"></div>
  <script>
    let anim = null;
    function loadLottie(animationData) {
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
            frameRate: anim.frameRate
          });
        });
      });
    }

    function goToFrame(frame) {
      anim.goToAndStop(frame, true);
    }
  </script>
</body>
</html>
"""

def render_lottie_to_webp(json_data, output_webp_path, fps=30, scale=512):
    tmp_dir = Path("/tmp/lottie_frames")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": scale, "height": scale})
        page.set_content(HTML_TEMPLATE)

        info = page.evaluate("data => loadLottie(data)", json_data)
        total_frames = int(info["totalFrames"])
        native_fps = float(info["frameRate"]) or 30.0

        step = max(1, int(round(native_fps / fps)))
        frame_idx = 0
        saved_count = 0

        for f in range(0, total_frames, step):
            page.evaluate("frame => goToFrame(frame)", f)
            frame_path = tmp_dir / f"frame_{saved_count:04d}.png"
            page.screenshot(path=str(frame_path), omit_background=True)
            saved_count += 1

        browser.close()

    duration = total_frames / native_fps
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(tmp_dir / "frame_%04d.png"),
        "-c:v", "libwebp",
        "-lossless", "0",
        "-compression_level", "6",
        "-q:v", "85",
        "-loop", "0",
        "-pix_fmt", "yuva420p",
        str(output_webp_path)
    ]
    subprocess.run(cmd, check=True)
    print(f"Rendered {saved_count} frames to {output_webp_path} ({duration:.2f}s)")
    shutil.rmtree(tmp_dir)

if __name__ == "__main__":
    sample_lottie = {
        "v": "5.5.7",
        "fr": 30,
        "ip": 0,
        "op": 30,
        "w": 512,
        "h": 512,
        "nm": "Sample Circle",
        "ddd": 0,
        "assets": [],
        "layers": [
            {
                "ddd": 0,
                "ind": 1,
                "ty": 4,
                "nm": "Circle",
                "sr": 1,
                "ks": {
                    "o": {"a": 0, "k": 100},
                    "r": {"a": 0, "k": 0},
                    "p": {"a": 0, "k": [256, 256, 0]},
                    "a": {"a": 0, "k": [0, 0, 0]},
                    "s": {
                        "a": 1,
                        "k": [
                            {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [50, 50, 100]},
                            {"t": 30, "s": [100, 100, 100]}
                        ]
                    }
                },
                "shapes": [
                    {
                        "ty": "el",
                        "d": 1,
                        "s": {"a": 0, "k": [200, 200]},
                        "p": {"a": 0, "k": [0, 0]}
                    },
                    {
                        "ty": "fl",
                        "c": {"a": 0, "k": [0.3, 0.7, 0.9, 1]},
                        "o": {"a": 0, "k": 100}
                    }
                ]
            }
        ]
    }
    out_path = Path("/tmp/sample_lottie.webp")
    render_lottie_to_webp(sample_lottie, out_path)
