---
title: "GoTalk NOW Copy Guide"
date_modified: 2026-09-20
tags: [gotalk, adb, asset-extraction, unity, tts, vocabulary]
---

# GoTalk NOW Copy Guide

How the 4 GoTalk NOW pages (Core words, Core words Action, Favorite things,
Social greetings) were copied from the Tab A6 Kids tablet into this app.
Repeat for future re-syncs.

## 1. Wireless ADB

```bash
adb pair 192.168.50.231:<pair-port>   # 6-digit code from phone:
                                      # Developer Options → Wireless debugging → Pair with pairing code
adb connect 192.168.50.231:<debug-port>  # IP shown on main Wireless debugging screen
adb -s 192.168.50.231:<debug-port> shell ...
```

Ports/ips change on reboot. TCP-open ≠ ADB-accepted: a `failed to connect`
with port reachable means wrong port type (pairing vs debug).

## 2. GoTalk on-device layout

- Package: `com.attainment.gotalk` (NOT debuggable → no `run-as`, no root → private data unreadable)
- Readable: `/sdcard/Android/data/com.attainment.gotalk/files/`
  - `TTS/Ivy/*.mp3` — per-word voice cache, generated on first tap. Pull for app voice.
  - `Search/*.json`, `Users/`, `prefs.xml`, `system.xml` — not needed.
- APKs: `pm path com.attainment.gotalk` → `base.apk` + `split_UnityDataAssetPack.apk`
  (Unity art lives in the split pack: `assets/bin/Data/datapack.unity3d` + `assets/words.db`)

## 3. Artwork extraction (Unity bundle)

- `words.db` (SQLite, table `English`: `text,type,image0..`) maps words → sprite keys
  (e.g. strawberry→`strawber`, spinning→`spin`, hi→`wave`, mommy→`mother`).
- Sprites via UnityPy 1.x API (`obj.read().m_Name`, `.image` saves RGBA):
  `eat_0, toilet_0, tissue_0, strawber_0, wave_0, want_1, help_0, done_0
  (All done), mother_0, father_0`. Bundle gaps (custom/photo cards) → screenshot crops.
- `mother_0/father_0` fill Mommy/Daddy cards that are BLANK in GoTalk itself. Mommy and Daddy cards are customized with real family photos on seamless pure black cards (`gotalkBlack: '#000000'`) with high-contrast white text (`#ffffff`), centered framing, and clean edge blending.

## 4. Screenshot page capture

- `uiautomator dump` is useless (Unity). Tap by coordinates on 1280×800 landscape:
  OK button ≈ (851,659) [found via green-pixel bbox], right-arrow ≈ (1237,757),
  left-arrow ≈ (32,757). Page order: Core words → Action → Favorite things → Social greetings.
- Card grid geometry (px): cols x 15–415 / 435–845 / 860–1265, rows y 15–335 / 360–705.
- Crop each card with ~12px inset (excludes grey `#808990` card border), drop bottom
  24% (label strip), trim white, edge-flood-fill bg → transparent (tol≈45).
  Previous failure mode: border strips baked into Wash/Spinning/Music crops.

## 5. GoTalk visual spec (sampled from screenshots)

- Card bg: Core words `#40a1de` (More/All done/No) + `#0ed601` (Want/Help); all other pages white.
- Card border: 2px `#808990`, rounded. Bottom bar: `#1f6e7e` with white ‹ › circles,
  yellow `#f5b301` ⌂ ↩ ❐ circles, raised white title tab.
- Assets: `public/images/gotalk/*.png` (RGBA, transparent bg). Voice:
  `public/audio/*.wav` mono 16-bit 22050Hz (`ffmpeg -ar 22050 -ac 1 -sample_fmt s16`).
- Missing recordings: card label ≠ spoken phrase is possible — Go washroom speaks
  "pee pee" (`peepee.mp3`, wired via `audioId`). ADB taps never produce speech audio
  (verified across 4 screen recordings: only tap thumps), so new words can't be
  captured this way; per-tap mp3 caching does not happen (pack is downloaded).

## 6. App wiring

- `src/data/defaultVocabulary.js`: home `core` = Core words page; `folders` =
  page metadata (titles feed `BottomBar`); `categories` = other 3 pages.
- `src/components/BottomBar.jsx`: prev/home/back/pages-tab/next + Page Select dialog.
  Back = last-visited page (`prevPage` ref); prev/next cycle `pageOrder`.
- New words without `audio/<id>.wav` fall back to live TTS via [[speech-pipeline]].
- Verify: `node` import check (19 images exist, 19 audio exist) + `npm run build`.
- Preview: `npm run dev -- --host --port 5173` → `http://<lan-ip>:5173/`.

See [[vocabulary-system]] for data schema, [[tts-voice-system]] for voice pipeline, [[deployment]] for release flow.
