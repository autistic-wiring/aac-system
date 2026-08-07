#!/usr/bin/env python3
"""
Generates clean, 100% standard Bodymovin vector Lottie JSON animations into public/images/core/lottie/
"""

import json
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images" / "core" / "lottie"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def get_base_lottie(name, frames=60, fps=30):
    return {
        "v": "5.5.7",
        "fr": fps,
        "ip": 0,
        "op": frames,
        "w": 512,
        "h": 512,
        "nm": name,
        "ddd": 0,
        "assets": [],
        "layers": []
    }

def make_layer(name, shapes, ks):
    return {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": name,
        "sr": 1,
        "ks": ks,
        "shapes": shapes
    }

def make_group(name, items):
    # Standard Bodymovin shape group with transform
    items_with_tr = list(items)
    items_with_tr.append({
        "ty": "tr",
        "p": {"a": 0, "k": [0, 0]},
        "a": {"a": 0, "k": [0, 0]},
        "s": {"a": 0, "k": [100, 100]},
        "r": {"a": 0, "k": 0},
        "o": {"a": 0, "k": 100}
    })
    return {
        "ty": "gr",
        "nm": name,
        "it": items_with_tr
    }

# 1. Wipe card Lottie (tissue pulling upward out of box)
def build_lottie_wipe():
    lottie = get_base_lottie("Wipe")
    
    # Tissue 1 layer (pulling upward)
    t1_ks = {
        "o": {
            "a": 1,
            "k": [
                {"t": 0, "s": [100]},
                {"t": 35, "s": [100]},
                {"t": 45, "s": [0]},
                {"t": 60, "s": [0]}
            ]
        },
        "r": {"a": 0, "k": 0},
        "p": {
            "a": 1,
            "k": [
                {"t": 0, "s": [256, 170, 0]},
                {"t": 40, "s": [256, -60, 0]},
                {"t": 60, "s": [256, -60, 0]}
            ]
        },
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    
    tissue_group = make_group("Tissue Shape", [
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [110, 130]},
            "p": {"a": 0, "k": [0, 0]},
            "r": {"a": 0, "k": 25}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.96, 0.96, 0.96, 1]},
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.15, 0.15, 0.15, 1]},
            "w": {"a": 0, "k": 10},
            "lc": 2, "lj": 2
        }
    ])
    
    # Tissue 2 layer (emerging from slot)
    t2_ks = {
        "o": {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 15, "s": [0]},
                {"t": 20, "s": [100]},
                {"t": 60, "s": [100]}
            ]
        },
        "r": {"a": 0, "k": 0},
        "p": {
            "a": 1,
            "k": [
                {"t": 0, "s": [256, 260, 0]},
                {"t": 15, "s": [256, 260, 0]},
                {"t": 55, "s": [256, 170, 0]},
                {"t": 60, "s": [256, 170, 0]}
            ]
        },
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }

    # Box Body Layer
    box_ks = {
        "o": {"a": 0, "k": 100},
        "r": {"a": 0, "k": 0},
        "p": {"a": 0, "k": [256, 330, 0]},
        "a": {"a": 0, "k": [0, 0, 0]},
        "s": {"a": 0, "k": [100, 100, 100]}
    }
    
    box_group = make_group("Box Rect", [
        {
            "ty": "rc",
            "d": 1,
            "s": {"a": 0, "k": [320, 180]},
            "p": {"a": 0, "k": [0, 20]},
            "r": {"a": 0, "k": 30}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.12, 0.69, 0.88, 1]},
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.12, 0.12, 0.12, 1]},
            "w": {"a": 0, "k": 14},
            "lc": 2, "lj": 2
        }
    ])

    slot_group = make_group("Slot Oval", [
        {
            "ty": "el",
            "d": 1,
            "s": {"a": 0, "k": [160, 45]},
            "p": {"a": 0, "k": [0, -65]}
        },
        {
            "ty": "fl",
            "c": {"a": 0, "k": [0.08, 0.45, 0.58, 1]},
            "o": {"a": 0, "k": 100}
        },
        {
            "ty": "st",
            "c": {"a": 0, "k": [0.12, 0.12, 0.12, 1]},
            "w": {"a": 0, "k": 8}
        }
    ])

    lottie["layers"].append(make_layer("Tissue2", [tissue_group], t2_ks))
    lottie["layers"].append(make_layer("Tissue1", [tissue_group], t1_ks))
    lottie["layers"].append(make_layer("Box", [box_group, slot_group], box_ks))
    return lottie

def main():
    print("Generating standard vector Lottie JSONs...")
    wipe_lottie = build_lottie_wipe()
    wipe_path = OUT_DIR / "wipe.json"
    with open(wipe_path, "w") as f:
        json.dump(wipe_lottie, f, indent=2)
    print(f"✓ Saved vector Lottie animation to {wipe_path} ({wipe_path.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
