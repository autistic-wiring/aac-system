---
title: "How to Animate AAC Board Buttons with Transparent Background"
date_modified: 2026-07-17
tags: [veo, animation, aac, webp, transparency, guide]
---

# Animate an AAC Board Button (End-to-End)

This guide covers the complete workflow: generate a looping hand-gesture video via Veo, convert it to a **transparent** animated WebP, and wire it into the board so a tap plays one cycle and a hold loops.

## Prerequisites

- `gcloud` CLI authenticated for the cathy-ai project (`project-104f43b7-de67-438a-a91`) — Veo quota lives here.
- Python 3 with `numpy`, `PIL` (Pillow), and `google-genai` (or use `cathy-ai/.venv`).
- `ffmpeg` with `libwebp` encoder (`ffmpeg -encoders | grep libwebp`).
- `docker`, `kubectl` for deployment.
- A static PNG icon with a **transparent background** (e.g. `public/images/core/help.png`, RGBA). The animation's first frame should match it for a seamless swap.

### Files involved

| File | Role |
|------|------|
| `public/images/core/<id>.png` | Static icon (source image for Veo, shown when not pressed) |
| `public/images/core/animated/<id>.mp4` | Veo raw output (white bg, 14 fps, square) — generation source |
| `public/images/core/animated/<id>.webp` | **Shipped asset** — transparent looping animation |
| `scripts/generate-button-animation.py` | Veo generation + white-bg salvage + WebP encoding |
| `scripts/mp4-to-transparent-apng.py` | MP4 → transparent WebP/APNG via border-flood mask |
| `src/components/WordCard.jsx` | Renders the animation `<img>` on press |
| `src/data/defaultVocabulary.js` | Vocab entries with `animation` + `animationDuration` |
| `src/App.css` | `.word-card-anim` class (no element-level drop-shadow) |
| `vite.config.js` | Workbox `globPatterns` (must include `webp`) |

---

## Step 1 — Generate the base animation (Veo)

### 1a. Write a motion prompt

Add an entry to `PROMPTS` in `scripts/generate-button-animation.py`. Key requirements:

- Describe the **exact ASL gesture** and its motion (e.g. "the fist lifts upward, then returns").
- Demand the static icon's art style: "same line weight, same skin tone, pure solid white background in every frame."
- Explicitly constrain: "no camera movement, no zoom, no text, no extra objects."
- Use `last_frame=image` so Veo loops back to the starting pose.

> Veo 3.1 **cannot preserve flat white backgrounds** — it always darkens them. That's handled in the salvage step; do NOT waste prompt tokens fighting it.

### 1b. Run the generator

```bash
python3 scripts/generate-button-animation.py <id> \
  --white-bg \        # border-flood salvage: restores white bg Veo darkened
  --fps 14 \          # matches the board's animation speed
  --scale 320 \       # square crop + resize (Veo emits 16:9)
  --duration 5
```

This outputs:
- `public/images/core/animated/<id>.mp4` — the raw Veo video (white bg, square, 14 fps)
- `public/images/core/animated/<id>.webp` — **opaque** animated WebP (white background) — **discard this**; we'll regenerate it with transparency in Step 2.

> If you already have an MP4 (e.g. from a prior run), skip generation and start at Step 2 with `--from-mp4 public/images/core/animated/<id>.mp4`.

---

## Step 2 — Make it transparent

MP4/H.264 has **no alpha channel**. The static icon is transparent (RGBA), so the animation would show a white box over the colored card. We re-render from the MP4 frames as a transparent WebP.

### How the mask works

The hand gesture has a **dark outline** that encloses the hand region. The white background touches the image border. A border-flood over **near-white** pixels (HSV: high Value, low Saturation) grows outward from the four edges — it fills the entire background but **stops at the dark outline**, leaving the hand interior untouched.

```
border pixels (white) -> flood over near-white -> blocked by dark outline
   ┌─────────────────────────┐
   │█████████████████████████│  █ = flooded background -> alpha 0
   │██████████┌─────┐████████│  hand silhouette (enclosed by outline)
   │██████████│HAND │████████│  -> alpha 255 (fully opaque)
   │██████████│     │████████│
   │██████████└─────┘████████│
   │█████████████████████████│
   └─────────────────────────┘
```

The mask is then eroded by 1 px to remove the anti-aliased white fringe at the silhouette edge.

### Run the transparency converter

```bash
python3 scripts/mp4-to-transparent-apng.py \
  public/images/core/animated/<id>.mp4 \
  --format webp \
  --fps 14 \
  --scale 256
```

This outputs `public/images/core/animated/<id>.webp` (~400 KB for a 54-frame, 256px clip — ~10× smaller than APNG with smooth alpha).

> The script also supports `--format apng`, but APNG with smooth alpha is ~2.4 MB vs ~400 KB WebP. Prefer WebP. Safari 16+ supports animated WebP (2022 release — acceptable floor for 2026).

### Verify the output

```bash
python3 -c "
from PIL import Image
im = Image.open('public/images/core/animated/help.webp')
print(f'frames={getattr(im,\"n_frames\",1)} size={im.size} mode={im.mode}')
im.seek(im.n_frames // 2)
import numpy as np
a = np.array(im.convert('RGBA'))[..., 3]
print(f'alpha_coverage={(a>10).mean()*100:.1f}%  corner_alpha={a[5,5]}')
"
```

Expected: `mode=RGBA`, `alpha_coverage` ~30% (the hand), `corner_alpha=0` (transparent bg).

---

## Step 3 — Wire into the app

### 3a. Vocabulary entry

In `src/data/defaultVocabulary.js`, add to the button's entry:

```js
{
  id: 'help',
  word: 'Help',
  icon: '🤝',
  color: colors.verb,
  image: 'images/core/help.png',                              // static PNG
  animation: 'images/core/animated/help.webp',                 // transparent WebP
  animationDuration: 3.857,                                    // one cycle in seconds
},
```

**`animationDuration` is required** — `<img>` has no `ended` event, so the component times the cycle to know when to revert to the static image. Get the exact duration from:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/images/core/animated/help.mp4
```

### 3b. CSS

In `src/App.css`, the `.word-card-anim` class (no element-level `drop-shadow` — the `.word-icon` ancestor already provides visual depth and has been proven harmless for animated WebP playback):

```css
.word-card-anim {
  height: 100%;
  width: 100%;
  object-fit: contain;
  display: block;
}
```

> **Debunked:** the `.word-icon` ancestor's `drop-shadow` filter does **NOT** freeze animated WebP playback. Verified via headless-Chrome CDP pixel-delta test (delta=18061 over 1.2s). The original "WebP didn't play" was the `isPressed` gating bug (Step 3c).

### 3c. WordCard component

The render logic in `WordCard.jsx` handles three concerns:

1. **Tap = one cycle, hold = loop.** The WebP is encoded `loop=0` (infinite), so it loops while mounted. On release, a `setTimeout` for the remaining cycle time unmounts it. On re-press, the timer is cleared.
2. **Replay from frame 0 on each press.** React `key` changes (`pressCount` → `<img key={`anim-${pressCount}`} />`) force remount → fresh decode → starts from frame 0.
3. **Seamless swap.** The static PNG is the first frame; when the timer fires, `animating` goes `false` and the static `<img>` renders in its place.

Core logic (see `src/components/WordCard.jsx` for the full implementation):

```
press   → animating=true, pressCount++, clear timer, record pressStart
release → arm timer: remaining = duration - (elapsed % duration)
           on fire → animating=false (revert to static PNG)
```

**No `pointerup`/`pointerleave` separates are needed** — all three release paths call the same `handleRelease`.

### 3d. Service worker precache

In `vite.config.js`, ensure `webp` is in the Workbox `globPatterns`:

```js
globPatterns: ['**/*.{js,css,html,svg,png,woff2,webp}'],
```

The transparent WebP (~400 KB) will be cached for offline use.

---

## Step 4 — Build & deploy

```bash
# Build & tag
SHA=$(git rev-parse --short HEAD)
docker build -t registry.nexvision.cc/nexvisioncc/aac-board:testing \
             -t registry.nexvision.cc/nexvisioncc/aac-board:sha-$SHA .

# Push both tags
docker push registry.nexvision.cc/nexvisioncc/aac-board:testing
docker push registry.nexvision.cc/nexvisioncc/aac-board:sha-$SHA

# Roll out to testing namespace
kubectl rollout restart deployment/aac-board-testing -n asd
kubectl rollout status deployment/aac-board-testing -n asd --timeout=120s

# Verify the asset is served
curl -sI https://aac-testing.nexvision.cc/images/core/animated/help.webp | grep -iE "content-type|content-length"
```

> The GHA self-hosted runner may be offline; the manual docker build/push/kubectl flow above is the reliable workaround.

---

## Quick Reference: The files you touch for one new button

1. `scripts/generate-button-animation.py` — add a `PROMPTS` entry.
2. **Run:** `python3 scripts/generate-button-animation.py <id> --white-bg --scale 320`
3. **Run:** `python3 scripts/mp4-to-transparent-apng.py public/images/core/animated/<id>.mp4 --format webp`
4. `src/data/defaultVocabulary.js` — add `animation` + `animationDuration` to the vocab entry.
5. `vite.config.js` — `webp` already in `globPatterns` (no change needed unless first time).
6. `src/App.css` — `.word-card-anim` already defined (no change needed).
7. **Build & deploy** (Step 4 above).

---

## Debugging

### "Animation has a white box instead of being transparent"

The source MP4's background isn't white (Veo may have darkened it unevenly, or the salvage step was skipped). Re-run Step 1b with `--white-bg`, then Step 2. If transparency is still broken, lower the `v_min` threshold in `mp4-to-transparent-apng.py` (currently 235 — allows some near-white noise through).

### "WebP doesn't play on my iPhone"

Animated WebP requires iOS 16 / Safari 16 (2022). For older devices, generate APNG instead (`--format apng` in Step 2) — it's universal but ~2.4 MB. Swap the vocab `animation` path and update workbox `globPatterns` to include `apng`. APNG renders identically (same `<img>` path, same timer logic).

### "Animation doesn't play on tap, only on hold"

This was the *original* bug (commit `1e91a84`). Root cause: the animation was gated on `isPressed`, so a ~100ms tap mounted and instantly unmounted the element. The fix decouples animation visibility from the press state using a separate `animating` flag + timer. See the "GOTCHA" section in `memory/veo-button-animation.md`.

### Testing animation playback in headless Chrome

```bash
# Spawn vite + headless chrome, navigate, dispatch pointer events, inspect DOM state.
# Node 22+ has global WebSocket — no puppeteer needed.
# See /tmp/aac-test/app-test.mjs patterns used in this session:
#   - cornerAlpha/centerAlpha via canvas getImageData -> transparency check
#   - pixel-sum at t0 vs t1200ms via canvas drawImage -> animation detection
#   - document.querySelector('img.word-card-anim') -> DOM presence check
```

## See Also

- [[veo-button-animation]] — original Veo generation experiments, background-color salvage, gotchas.
- [[vocabulary-system]] — how the vocab data structure works.
- [[component-tree]] — app component hierarchy.
