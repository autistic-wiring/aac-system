---
title: TTS Voice System — gTTS (Google) replaces Piper
date_modified: 2026-08-03
tags: [tts, audio, gtts, piper, aac, voice]
---

# TTS Voice System

## Decision (2026-08-03)
Switched from **Piper `en_US-lessac-medium`** to **gTTS (Google Translate TTS)** for all AAC card audio.

## Why
- Piper lessac-medium produces **weak/breathy sibilants** — `/s/` in "Stop" was inaudible through speakers (sounded like "top"). Verified via Whisper STT: Piper clips failed ~50% of the time across speeds/punctuation.
- DSP-boosting the sibilant band helped on paper (Whisper 10/10) but the user still heard it as cut off — synthesized sibilants sound unnatural/hissy.
- **gTTS uses real recorded human speech** → natural, clear consonants. All 13 core cards verified via Whisper STT (tiny+base models). See [[stop-sibilant-fix]].

## gTTS setup
```bash
pip install --break-system-packages gTTS   # needs PEP 668 override on Ubuntu
# requires internet at generation time only; output is pre-baked wav
```
- Engine: `gTTS(text, lang='en', tld='com').save(mp3)` → ffmpeg → wav (22050 Hz mono)
- Post-process: trim silence (thr 0.02, keep 30ms lead / 50ms trail), normalize to 0.92 peak
- Generation script: `/tmp/opencode/gen_gtts.py` (regenerate from vocab list if needed)

## Piper (kept but deprecated for generation)
- Model still at `tts-models/vits-piper-en_US-lessac-medium/` (sherpa-onnx WASM pipeline in `scripts/generate-audio.js`)
- Nondeterministic at generation time (noise params) — must verify each clip 5-10× with Whisper
- DO NOT trust the HF sibilance proxy (`hf.py`) — it picked the worst variant

## Regression: Piper overwrote gTTS files (2026-08-07)

Adding new buttons (Wash/More, commit `3f0bece`) re-ran `node scripts/generate-audio.js`
(the Piper script), which silently regenerated **all 53 vocab files**, wiping out the
verified gTTS clips. Symptom: "Strawberry" → "Trawberry" (Piper's weak `/s/`).

**Diagnosis without listening:** spectral check of the onset — gTTS clip has
high-freq sibilant energy (hi_ratio ≈ 0.8: 4–11kHz / 200–3kHz), Piper clip ≈ 0.04
(the `/s/` is absent entirely). One-liner:
`python3 -c "..." # FFT the first 250ms, sum hi vs lo bands`.

**Fix:** regenerated all 57 unique vocab items (skipping `audioId` reuses) with gTTS via
`/tmp/opencode/gen_gtts.py` (spec above: tld='com', 22050 Hz mono, trim thr 0.02
with 30ms lead/50ms trail, normalize 0.92 peak). Verified: strawberry 5/5 "Strawberry."
(base model), chair/food/doctor/etc. correct on `small` model. `cake` and `wipe` are
Whisper blind spots regardless of engine — verify those by spectral burst analysis
(wipe `/p/` = low-freq dominant, measured 22.8:1).

**Lessons:**
- NEVER run `scripts/generate-audio.js` (Piper) on the full vocab — it's a trap that
  overwrites good gTTS files. It's only for scratch work.
- If audio regresses after a commit, `git log --oneline -- public/audio/` will show
  which commit regenerated the files.
- Deployed 2026-08-07 as v1.2.5 (see [[deployment]]).

## Verification
- **Whisper STT** (`faster_whisper`, model "base", cpu int8) is the ground truth for spoken-word accuracy
- `tiny` model for fast batch sanity; `base` for final confirmation of problem words
- Whisper is nondeterministic — run 5-10× per clip
- **Minimal-pair caveat**: Whisper base confuses wipe/white (8/8 "white" despite correct /p/). For such pairs, verify via spectral analysis of the consonant burst (/p/ = low-freq dominant 8:1 over high-freq; /t/ = high-freq dominant) rather than Whisper alone.

## Audio playback
- `src/utils/speechAdapter.js` preloads `/audio/{audioId}.wav` into AudioBuffers, plays via Web Audio with `detune +50` cents and `gain 1.15`
- Falls back to TTS server (port 5050) then browser speechSynthesis if wav missing
