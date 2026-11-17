---
title: "AAC Component Tree"
date_modified: 2026-11-16
tags: [components, react, layout, pwa, bottombar, battery]
---

# Component Tree

```
main.jsx → createRoot(document.getElementById('root'))
  └─ App                              — state, category routing, wake lock
       ├─ SplashScreen                — PWA update check (2s min, 6s safety)
       ├─ nav.navigation-bar          — back button, home, emergency, breadcrumbs
       └─ Board                       — grid + bottom bar
            ├─ WordCard[] (grid)      — core/folder/category words
            └─ WordCard[] (yes-no)    — fixed Yes/No bar at bottom
```

## App.jsx (root state)

- `currentCategory` — `null` = home, string = folder name
- `wakeLock` — `navigator.wakeLock.request('screen')` prevents screen sleep
- Folder navigation is pure `useState`, no router library
- Express bar auto-clears after 30 min with no change to its contents (a `useEffect` keyed on
  `expressItems`); the message is stashed in `lastMessage` for one-shot restore, matching the
  Clear button. Any add/rollback/restore restarts the 30-min clock. Introduced 2026-11-16.

## WordCard.jsx

- Handles click: speech + haptic feedback
- `navigator.vibrate(50)` for words, `navigator.vibrate([30, 50, 30])` for folders
- Emoji rendering via `el.textContent = emoji` (no image assets)
- Taps speak immediately on `pointerdown` and queue (Express mode: `App.handleItemClick`
  speaks + queues while WordCard stays silent); folders never speak
- Ghost-click guard: a module-level shared `lastAnyPointerDownAt` timestamp across all card
  instances. After a tap navigates to a new page, the tap's trailing `click` can land on the
  freshly mounted card now under the finger (its own `pointerDownTime` is 0, so the per-card
  guard passes) — clicks with no recent card-level `pointerdown` are ignored. Genuine fast
  taps carry their own `pointerdown` and still go through; no global sound cooldown
  (it would swallow real taps). Verified on-device 2026-11-07.

## Board.jsx

- Fixed 3×3 CSS Grid on all pages (was viewport-computed columns)
- Separates Yes/No into a fixed bottom bar
- Filters hidden items

## BottomBar.jsx

- GoTalk-style bar: prev/next chevrons, home/back/pages, lock button.
- Lock button doubles as the battery gauge (`useBattery()` in
  `src/utils/battery.js`): shows `level%` (+⚡ while charging, `bb-yellow`;
  `.bb-batt` style in `src/App.css`), tap still enters kiosk fullscreen.
- No bridge (plain browser) falls back to an inline SVG padlock — the old ⛶
  text glyph rendered as tofu on-device (fixed 2026-11-11).
- See [[kiosk-mode]] for the `NativeBridge.getBattery()` side.

## SplashScreen.jsx

- PWA update checker
- Registers service worker with `prompt` strategy
- 2s minimum display, 6s auto-dismiss safety
- Shows `__APP_VERSION__` build-time define

## Styling

- All hand-written CSS (`App.css`, `index.css`, `SplashScreen.css`)
- No CSS framework
- Uses CSS custom properties, glassmorphism, `dvh` units, `safe-area-inset`
- Landscape-first design
- Viewport rule (2026-11-07 fix: bottom bar clipped off-screen): `.app-container` is capped
  to the real viewport (`height/max-height: 100%` + `overflow: hidden` on `html`/`body`,
  not `100dvh` on the container) so the bottom bar can never clip; grid cards use
  `min-width/min-height: 0` so they shrink inside the grid instead of overflowing it

See [[vocabulary-system]] for data flow into Board/WordCard.
See [[deployment]] for PWA/base-path configuration.
