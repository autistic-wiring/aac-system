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

> **Revised again 2026-07-17 (transparency):** MP4/H.264 has **no alpha channel**, so the help animation showed a white box over the colored card. Switched to **transparent animated WebP** (`help.webp`, 413 KB) rendered as `<img>`. Mask: border-flood near-white pixels (the hand's dark outline bounds the flood) → alpha 0 outside, opaque inside. Generator: `scripts/mp4-to-transparent-apng.py --format webp` (also supports `apng`, but APNG with smooth alpha is ~2.4 MB vs 413 KB WebP — WebP wins). Precached via Workbox `globPatterns` incl. `webp`. The `.word-icon` ancestor `drop-shadow` does **NOT** freeze animated-WebP playback — debunked via headless-Chrome CDP pixel-delta test (delta=18061/1.2s). The original "WebP didn't play" was purely the `isPressed` gating bug (see below). iOS Safari supports animated WebP from Safari 16 (2022).

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
- `item.animation` (transparent `.webp` path) + `item.animationDuration` (cycle seconds) optional per vocab entry.
- Render `<img>` (transparent looping WebP) keyed by `pressCount` so each press remounts and replays from frame 0.
- CSS `.word-card-anim` (App.css): no element-level `drop-shadow` (the `.word-icon` ancestor filter is enough, and proven harmless for WebP). Static image keeps `.word-card-image` + its own drop-shadow.
- Static PNG is the animation's first frame → swap is seamless.

## GOTCHA — <img> has no `ended` event (timer-based cycle completion)
The `<video>` path used `onEnded` to revert to the static image after one cycle. `<img>` (APNG/WebP) fires no such event. Solution: time the cycle with `item.animationDuration`. On release, arm `setTimeout(animMs - elapsed%animMs)` → `setAnimating(false)`; on re-press, clear it. The WebP itself is encoded `loop=0` (infinite) so it loops while mounted — the timer only controls when to unmount.

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
3. Make it transparent: `python3 scripts/mp4-to-transparent-apng.py public/images/core/animated/<id>.mp4 --format webp --scale 256` (border-flood mask; the hand's dark outline bounds the flood).
4. Add `animation: 'images/core/animated/<id>.webp', animationDuration: <secs>` to the vocab item.

## Alternatives if Veo bg-drift is unacceptable
Veo darkens flat bg by design. If the salvage edges look too dithered at small sizes, consider: Imagen keyframes + interpolation (better style control), or an explicit transparent-WebP pipeline. Veo is fastest for motion but weakest at preserving flat-bg line art.

## See Also

- [[animating-buttons]] — full step-by-step guide: Veo generation → transparent WebP → app wiring → deploy.
- [[component-tree]] — app component hierarchy.
- [[vocabulary-system]] — vocab data structure and how items are consumed by the board.
