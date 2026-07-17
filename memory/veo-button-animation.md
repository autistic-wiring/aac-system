---
title: "Veo for AAC Button Animation"
date_modified: 2026-07-17
tags: [veo, video-generation, animation, aac, gcp, gotcha]
---

# Animating AAC Board Buttons with Google Veo

PoC: animate board icons (e.g. the ASL "Help" hand gesture) so they play while a button is pressed/held. See [[component-tree]] [[vocabulary-system]].

## What works
- **Model:** `veo-3.1-generate-001` (full) gives cleaner hands than `veo-3.1-fast-generate-001` (fast had a 6-finger glitch). Both are image-to-video with first+last frame = original PNG → seamless loop.
- **Project / auth:** Veo is enabled on cathy-ai project `project-104f43b7-de67-438a-a91` (NOT `social-media-manager-464820` — Vertex AI API is disabled there). The `~/cathy-ai/gcp-veo-sa-key.json` is **empty**; auth via `gcloud auth print-access-token` shim instead — ADC (`application_default_credentials.json`) is stale (`invalid_grant`) but the account refresh token is valid.
- **Aspect ratio:** Veo 3.1 has **no `1:1`**. Generate `16:9` then center-crop to square in ffmpeg: `crop=min(iw\,ih):min(iw\,ih)`.
- **Duration:** image_to_video supports only `[4, 6, 8]` seconds. Use 4.
- **Output:** MP4 → square animated WebP (`-loop 0`), ~237 KB at 360px / 14fps. Fine for the offline-first PWA (precache).

> **Revised 2026-07-17:** Animated WebP in `<img>` did NOT play reliably — CSS `drop-shadow` filters (even on an ancestor, `.word-icon`) can freeze animated-WebP frame updates, and iOS Safari has spotty animated-WebP support. **Shipped format is MP4 + `<video>`** (`help.mp4`, ~89 KB), precached via Workbox `globPatterns` incl. `mp4`. `scripts/generate-button-animation.py` still emits WebP — needs updating to also emit MP4.

## GOTCHA — Veo flips white backgrounds to black
Both Veo variants convert the **flat white background of the line-art icons to black**, regardless of prompt strength ("pure solid white #FFFFFF in every frame" was ignored). Veo I2V does not preserve flat backgrounds. This is the key finding for "which model works best" — neither preserves it.

## Salvage: border flood-fill (white-bg restore)
Since the icon background is **border-connected** but internal outlines (finger lines) are enclosed by the hands, a border flood-fill restores white while keeping outlines:

```
dark = luma < 28                       # bg + outlines are dark
grown = dark on border pixels only     # seed from edges
repeat: grown = dilate(grown) & dark   # 4-conn grow, pure numpy (no scipy needed)
rgb[grown] = white                     # only border-connected dark -> white
```

Internal dark pixels (finger separations) stay because they never connect to the border. venv `cathy-ai/.venv` has numpy 2.x but **no scipy** → use pure-numpy iterative dilation (converges fast). Script: `scripts/generate-button-animation.py --white-bg`.

## Wiring (WordCard.jsx)
- `item.animation` (mp4 path) optional per vocab entry.
- Render `<video>` (NOT `<img>`): `autoPlay muted loop playsInline` — required attrs for mobile autoplay. Keyed by `pressCount` so each press remounts and replays from frame 0.
- CSS `.word-card-video` (App.css) has **no `drop-shadow`** — filter on the element or ancestor can freeze `<video>`/animated-WebP playback. Note: `.word-icon` (the wrapper) still carries a `drop-shadow`; headless-Chrome CDP tests proved it does NOT block `<video>` (currentTime advances), so it's left as-is for the static icon.
- Static PNG is the animation's first frame → swap is seamless.

## GOTCHA — don't gate the video on `isPressed`
Original impl: `showAnimation = isPressed && animationUrl`, hide on `onPointerUp/Leave`. Symptom: "animation only works when holding." Root cause: a quick tap fires `pointerdown→pointerup` in ~100ms, so the `<video>` mounted and **instantly unmounted** on release — the user never saw it. Diagnosed & verified via headless Chrome CDP (global `WebSocket` in Node 22, no puppeteer needed): after a simulated quick tap no `<video>` survived in the DOM.

Fix (commit `1e91a84`): decouple visibility from press state.
- `animating` state drives `showAnimation`; `isPressed` only controls `loop` + the `.pressed` visual.
- On `pointerdown`: `setAnimating(true)`, bump `pressCount` (remount → replay from 0).
- `loop={isPressed}` → loops while held; once released, plays the current cycle to the end.
- `onEnded` → `setAnimating(false)` if not held → reverts to static PNG.
- Verified: quick tap now plays a full ~3.86s cycle then reverts; hold loops.

## To animate more buttons
1. Add a motion prompt entry to `PROMPTS` in `scripts/generate-button-animation.py`.
2. `python3 scripts/generate-button-animation.py <id> --white-bg` (needs `gcloud` on PATH).
3. Add `animation: 'images/core/animated/<id>.mp4'` to the vocab item.

## Alternatives if Veo bg-drift is unacceptable
Veo darkens flat bg by design. If the salvage edges look too dithered at small sizes, consider: Imagen keyframes + interpolation (better style control), or an explicit transparent-WebP pipeline. Veo is fastest for motion but weakest at preserving flat-bg line art.
