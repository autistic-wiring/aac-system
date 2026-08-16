---
title: "AAC System — Project Overview"
date_modified: 2026-07-16
tags: [aac, pwa, react, speech-synthesis, offline-first, motor-planning]
---

# AAC System

Augmentative and Alternative Communication web app for non-verbal individuals (autistic toddlers). Emphasizes **motor planning** (buttons stay in consistent grid positions) and works **fully offline**.

- **Domain:** `aac.nexvision.cc`
- **GitHub:** `autistic-wiring/aac-system`
- **License:** open-source, non-profit

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, CSS (hand-written, no framework) |
| Speech | Sherpa-ONNX + Piper VITS (en_US-lessac-medium, 22050 Hz) |
| PWA | `vite-plugin-pwa`, fullscreen + landscape, Workbox SW |
| Lint | ESLint 9 flat config, React Hooks + Refresh plugins |
| Runtime | Node >= 18, ESM-only (`"type": "module"`) |
| Deploy | GitHub Pages (`/aac-system/` base), Docker + nginx + k8s |
| Language | **Pure JS/JSX** — TypeScript types installed only for editor intellisense, no `tsconfig.json` |

## Architecture

See [[speech-pipeline]] [[gotalk-visual-supports]] [[component-tree]] [[deployment]].

### Key Patterns

1. **GoTalk Page System** (2026-08-16) — app is a launcher + 2-picture pages per the SLP's GoTalk Lite setup; replaces the old core board. See [[gotalk-visual-supports]]
2. **Motor Planning First** — page buttons stay at fixed positions; no layout shifts
3. **3-Layer Speech Fallback** — pre-generated WAV > TTS server (port 5050) > browser SpeechSynthesis
4. **Page Navigation** — pure React state (`currentPageId`), no router; footer home + next
5. **Wake Lock** — prevents screen sleep during AAC use
6. **Haptic Feedback** — `navigator.vibrate()`: single pulse on button press
7. **Instant Pointer Triggers** — GoTalkCard and footer buttons trigger immediately on `pointerdown` (touch/mouse press) to prevent missed activations if users drag their fingers away before releasing.

### Source Layout

```
src/
  main.jsx                 — createRoot entry
  App.jsx                  — state, page routing logic
  App.css / GoTalk.css     — styles (GoTalk pages: teal bg, white cards, dark-teal footer)
  components/
    GoTalkHome.jsx         — launcher grid (one card per page)
    GoTalkPage.jsx         — 2-button page + footer (home / title / next)
    GoTalkCard.jsx         — page button (speaks on press, haptics)
    SplashScreen.jsx       — PWA update check
    SplashScreen.css
  data/
    gotalkPages.js         — all pages (Turn Taking, Yes No, More Block, Help, I Want)
  utils/
    speechAdapter.js       — speech layer with cache + fallback
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run tts` | TTS server on port 5050 |
| `npm run generate-audio` | Pre-generate WAV from vocabulary |
| `npm run lint` | ESLint |

## Testing

**No test framework exists.** No Vitest, Jest, or testing library dependencies.

## Infrastructure

- **K8s:** 1 replica, namespace `asd`, image `registry.nexvision.cc/nexvisioncc/aac-board:latest`
- **CI:** GitHub Actions on self-hosted runner, push to `main` deploys to GitHub Pages
- **TLS:** cert-manager + Let's Encrypt via nginx ingress
