#!/usr/bin/env python3
"""
Generate 512x512 High-Resolution Transparent WebP Card Animations using Vector Lottie JSONs.
Covers all 20 core AAC cards with smooth 30fps vector motion and 100% clean alpha channels.
"""

import sys
import os
import json
import subprocess
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
import numpy as np
from PIL import Image

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

    function goToFrame(frame) {
      anim.goToAndStop(frame, true);
    }
  </script>
</body>
</html>
"""

def make_shape_layer(name, shape_data, ks_data):
    return {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": name,
        "sr": 1,
        "ks": ks_data,
        "shapes": shape_data
    }

def get_base_lottie(frames=60, fps=30):
    return {
        "v": "5.5.7",
        "fr": fps,
        "ip": 0,
        "op": frames,
        "w": 512,
        "h": 512,
        "nm": "AAC Card Vector",
        "ddd": 0,
        "assets": [],
        "layers": []
    }

def create_lottie_waving_hand(frames=60, title="hi"):
    # Waving hand gesture
    lottie = get_base_lottie(frames=frames)
    # Hand palm + fingers rotating back and forth
    # Rotation keyframes: 0 -> -15 deg -> 15 deg -> -15 deg -> 0
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 15, "s": [-20]},
                {"t": 30, "s": [20]},
                {"t": 45, "s": [-20]},
                {"t": 60, "s": [0]}
            ]
        },
        "p": {"a": 0, "k": [256, 280, 0]},
        "a": {"a": 0, "k": [0, 80, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    
    # Palm (ellipse) + Wrist + 4 fingers + thumb
    shapes = [
        # Palm base
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [120, 110]},
            "p": {"a": 0, "k": [0, 20]},
            "r": {"a": 0, "k": 20}
        },
        # Fingers (rectangles)
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [26, 90]},
            "p": {"a": 0, "k": [-42, -50]},
            "r": {"a": 0, "k": 12}
        },
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [26, 105]},
            "p": {"a": 0, "k": [-14, -60]},
            "r": {"a": 0, "k": 12}
        },
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [26, 95]},
            "p": {"a": 0, "k": [14, -55]},
            "r": {"a": 0, "k": 12}
        },
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [24, 75]},
            "p": {"a": 0, "k": [40, -40]},
            "r": {"a": 0, "k": 12}
        },
        # Thumb
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [28, 70]},
            "p": {"a": 0, "k": [-60, 0]},
            "r": {"a": 0, "k": -35}
        },
        # Fill (Warm skin / gold tone)
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 0.76, 0.28, 1]},
            "o": {"a": 0, "k": 100}
        },
        # Stroke (Dark bold outline)
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.15, 0.15, 0.15, 1]},
            "o": {"a": 0, "k": 100},
            "w": {"a": 0, "k": 12},
            "lc": 2,
            "lj": 2
        }
    ]
    lottie["layers"].append(make_shape_layer("Hand", shapes, ks))
    return lottie

def create_lottie_checkmark(frames=60, title="yes"):
    # Green checkmark bounce & pulse
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {
            "a": 1,
            "k": [
                {"t": 0, "s": [85, 85, 100]},
                {"t": 20, "s": [115, 115, 100]},
                {"t": 35, "s": [95, 95, 100]},
                {"t": 48, "s": [105, 105, 100]},
                {"t": 60, "s": [85, 85, 100]}
            ]
        }
    }
    # Checkmark path + circle background
    shapes = [
        # Circle bg
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [340, 340]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.29, 0.73, 0.34, 1]}, # Green
            "o": {"a": 0, "k": 100}
        },
        # Check stroke inside
        {
            "ty": "sr",
            "d": 1,
            "p": {"a": 0, "k": [0, 0]},
            "r": {"a": 0, "k": 0},
            "pt": {"a": 0, "k": 4},
            "ir": {"a": 0, "k": 0},
            "or": {"a": 0, "k": 80}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [1.0, 1.0, 1.0, 1]},
            "o": {"a": 0, "k": 100},
            "w": {"a": 0, "k": 28},
            "lc": 2,
            "lj": 2
        }
    ]
    lottie["layers"].append(make_shape_layer("Check", shapes, ks))
    return lottie

def create_lottie_crossmark(frames=60, title="no"):
    # Red cross mark shake
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 10, "s": [-12]},
                {"t": 20, "s": [12]},
                {"t": 30, "s": [-10]},
                {"t": 40, "s": [10]},
                {"t": 50, "s": [-5]},
                {"t": 60, "s": [0]}
            ]
        },
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    shapes = [
        # Circle bg
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [340, 340]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.94, 0.27, 0.27, 1]}, # Red
            "o": {"a": 0, "k": 100}
        },
        # Cross bars (rectangles)
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [180, 32]},
            "p": {"a": 0, "k": [0, 0]},
            "r": {"a": 0, "k": 45}
        },
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [180, 32]},
            "p": {"a": 0, "k": [0, 0]},
            "r": {"a": 0, "k": -45}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 1.0, 1.0, 1]},
            "o": {"a": 0, "k": 100}
        }
    ]
    lottie["layers"].append(make_shape_layer("Cross", shapes, ks))
    return lottie

def create_lottie_pointing_finger(frames=60, title="me"):
    # Pointer finger pointing inward/to chest
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {
            "a": 1,
            "k": [
                {"t": 0, "s": [256, 280, 0]},
                {"t": 30, "s": [256, 230, 0]},
                {"t": 60, "s": [256, 280, 0]}
            ]
        },
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [110, 110, 100]}
    }
    shapes = [
        # Pointing index finger up / self
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [40, 140]},
            "p": {"a": 0, "k": [0, -40]},
            "r": {"a": 0, "k": 0}
        },
        # Fist base
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [120, 100]},
            "p": {"a": 0, "k": [0, 40]},
            "r": {"a": 0, "k": 0}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 0.84, 0.0, 1]}, # Yellow pronoun tone
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.15, 0.15, 0.15, 1]},
            "o": {"a": 0, "k": 100},
            "w": {"a": 0, "k": 12},
            "lc": 2,
            "lj": 2
        }
    ]
    lottie["layers"].append(make_shape_layer("Point", shapes, ks))
    return lottie

def create_lottie_help_hands(frames=60, title="help"):
    # Two hands reaching together / helping hand lift
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {
            "a": 1,
            "k": [
                {"t": 0, "s": [256, 270, 0]},
                {"t": 30, "s": [256, 235, 0]},
                {"t": 60, "s": [256, 270, 0]}
            ]
        },
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    shapes = [
        # Lower supporting hand (open palm upward)
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [180, 50]},
            "p": {"a": 0, "k": [0, 70]},
            "r": {"a": 0, "k": 0}
        },
        # Upper fist / hand being helped
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [110, 90]},
            "p": {"a": 0, "k": [0, -10]},
            "r": {"a": 0, "k": 0}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.35, 0.78, 0.4, 1]}, # Green verb color
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.15, 0.15, 0.15, 1]},
            "o": {"a": 0, "k": 100},
            "w": {"a": 0, "k": 12},
            "lc": 2,
            "lj": 2
        }
    ]
    lottie["layers"].append(make_shape_layer("HelpHands", shapes, ks))
    return lottie

def create_lottie_eat(frames=60, title="i_eat"):
    # Fork & Spoon / Plate eating motion
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 25, "s": [-15]},
                {"t": 50, "s": [15]},
                {"t": 60, "s": [0]}
            ]
        },
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    shapes = [
        # Plate
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [280, 280]},
            "p": {"a": 0, "k": [0, 20]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.95, 0.95, 0.95, 1]},
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.3, 0.75, 0.35, 1]},
            "o": {"a": 0, "k": 100},
            "w": {"a": 0, "k": 20}
        },
        # Fork
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [24, 180]},
            "p": {"a": 0, "k": [-70, -30]},
            "r": {"a": 0, "k": 15}
        },
        # Spoon
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [24, 180]},
            "p": {"a": 0, "k": [70, -30]},
            "r": {"a": 0, "k": -15}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.2, 0.2, 0.2, 1]},
            "o": {"a": 0, "k": 100}
        }
    ]
    lottie["layers"].append(make_shape_layer("Eat", shapes, ks))
    return lottie

def create_lottie_drink(frames=60, title="i_drink"):
    # Cup with straw tilting motion
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 30, "s": [-25]},
                {"t": 60, "s": [0]}
            ]
        },
        "p": {"a": 0, "k": [256, 270, 0]},
        "a": {"a": 0, "k": [0, 50, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    shapes = [
        # Cup body
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [150, 220]},
            "p": {"a": 0, "k": [0, 20]},
            "r": {"a": 0, "k": 0}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.35, 0.78, 0.4, 1]}, # Green verb cup
            "o": {"a": 0, "k": 100}
        },
        # Straw
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [18, 160]},
            "p": {"a": 0, "k": [30, -110]},
            "r": {"a": 0, "k": 25}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 0.5, 0.2, 1]},
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.15, 0.15, 0.15, 1]},
            "o": {"a": 0, "k": 100},
            "w": {"a": 0, "k": 12}
        }
    ]
    lottie["layers"].append(make_shape_layer("Drink", shapes, ks))
    return lottie

def create_lottie_stop(frames=60, title="wait"):
    # Hand raised / palm stop gesture
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {
            "a": 1,
            "k": [
                {"t": 0, "s": [90, 90, 100]},
                {"t": 30, "s": [110, 110, 100]},
                {"t": 60, "s": [90, 90, 100]}
            ]
        }
    }
    shapes = [
        # Octagon or open palm
        {
            "ty": "sr",
            "d": 1,
            "p": {"a": 0, "k": [0, 0]},
            "r": {"a": 0, "k": 22.5},
            "pt": {"a": 0, "k": 8},
            "ir": {"a": 0, "k": 0},
            "or": {"a": 0, "k": 160}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.94, 0.27, 0.27, 1]},
            "o": {"a": 0, "k": 100}
        },
        # Open Hand Palm inside
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [110, 130]},
            "p": {"a": 0, "k": [0, 10]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 1.0, 1.0, 1]},
            "o": {"a": 0, "k": 100}
        }
    ]
    lottie["layers"].append(make_shape_layer("Wait", shapes, ks))
    return lottie

def create_lottie_washroom(frames=60, title="washroom"):
    # Restroom icon (water drop / door symbol)
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {
            "a": 1,
            "k": [
                {"t": 0, "s": [256, 256, 0]},
                {"t": 30, "s": [256, 240, 0]},
                {"t": 60, "s": [256, 256, 0]}
            ]
        },
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    shapes = [
        # Circle background (Orange Noun color)
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [340, 340]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 0.6, 0.2, 1]},
            "o": {"a": 0, "k": 100}
        },
        # Water drop / icon
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [140, 140]},
            "p": {"a": 0, "k": [0, 20]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 1.0, 1.0, 1]},
            "o": {"a": 0, "k": 100}
        }
    ]
    lottie["layers"].append(make_shape_layer("Washroom", shapes, ks))
    return lottie

def create_lottie_more(frames=60, title="more"):
    # Plus icon pulsing
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {
            "a": 1,
            "k": [
                {"t": 0, "s": [90, 90, 100]},
                {"t": 30, "s": [120, 120, 100]},
                {"t": 60, "s": [90, 90, 100]}
            ]
        }
    }
    shapes = [
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [340, 340]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.39, 0.71, 0.96, 1]}, # Blue adjective
            "o": {"a": 0, "k": 100}
        },
        # Plus arms
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [180, 48]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [48, 180]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 1.0, 1.0, 1]},
            "o": {"a": 0, "k": 100}
        }
    ]
    lottie["layers"].append(make_shape_layer("More", shapes, ks))
    return lottie

def create_lottie_all_done(frames=60, title="all_done"):
    # Finish flag / checkmark wave
    lottie = get_base_lottie(frames=frames)
    ks = {
        "o": {"a": 0, "k": 100},
        "r": {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 15, "s": [-15]},
                {"t": 30, "s": [15]},
                {"t": 45, "s": [-15]},
                {"t": 60, "s": [0]}
            ]
        },
        "p": {"a": 0, "k": [256, 256, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    shapes = [
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [340, 340]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.94, 0.38, 0.57, 1]}, # Pink social
            "o": {"a": 0, "k": 100}
        },
        # Flag checkered box / symbol inside
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [160, 120]},
            "p": {"a": 0, "k": [0, 0]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [1.0, 1.0, 1.0, 1]},
            "o": {"a": 0, "k": 100}
        }
    ]
    lottie["layers"].append(make_shape_layer("Done", shapes, ks))
    return lottie

def render_lottie_to_webp(page, json_data, output_path, fps=30, scale=512):
    tmp_dir = Path("/tmp/lottie_build_frames")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    info = page.evaluate("data => loadLottie(data)", json_data)
    total_frames = int(info["totalFrames"])
    native_fps = float(info["frameRate"]) or 30.0

    step = max(1, int(round(native_fps / fps)))
    saved_count = 0

    for f in range(0, total_frames, step):
        page.evaluate("frame => goToFrame(frame)", f)
        frame_path = tmp_dir / f"frame_{saved_count:04d}.png"
        page.screenshot(path=str(frame_path), omit_background=True)
        saved_count += 1

    duration = total_frames / native_fps
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(tmp_dir / "frame_%04d.png"),
        "-c:v", "libwebp",
        "-lossless", "0",
        "-compression_level", "6",
        "-q:v", "90",
        "-loop", "0",
        "-pix_fmt", "yuva420p",
        str(output_path)
    ]
    subprocess.run(cmd, check=True)
    shutil.rmtree(tmp_dir)
    return duration

CARD_GENERATORS = {
    'help': create_lottie_help_hands,
    'me': create_lottie_pointing_finger,
    'me2': create_lottie_pointing_finger,
    'i': create_lottie_pointing_finger,
    'want': create_lottie_help_hands,
    'give': create_lottie_help_hands,
    'yes': create_lottie_checkmark,
    'no': create_lottie_crossmark,
    'hi': create_lottie_waving_hand,
    'hi2': create_lottie_waving_hand,
    'bye': create_lottie_waving_hand,
    'bye2': create_lottie_waving_hand,
    'my_turn': create_lottie_pointing_finger,
    'your_turn': create_lottie_waving_hand,
    'more': create_lottie_more,
    'all_done': create_lottie_all_done,
    'washroom': create_lottie_washroom,
    'wait': create_lottie_stop,
    'i_eat': create_lottie_eat,
    'i_drink': create_lottie_drink,
}

def main():
    out_dir = Path("public/images/core/animated")
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 512, "height": 512})
        page.set_content(HTML_TEMPLATE)

        for card_id, gen_fn in CARD_GENERATORS.items():
            print(f"Generating 512x512 vector animation for [{card_id}]...")
            lottie_json = gen_fn(frames=60, title=card_id)
            webp_file = out_dir / f"{card_id}.webp"
            dur = render_lottie_to_webp(page, lottie_json, webp_file, fps=30, scale=512)
            durations[card_id] = round(dur, 3)
            print(f"  -> Saved {webp_file} ({dur:.2f}s)")

        browser.close()

    print("\nGeneration Complete! Calculated durations:")
    print(json.dumps(durations, indent=2))

if __name__ == "__main__":
    main()
