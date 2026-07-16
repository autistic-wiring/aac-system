---
title: "AAC Component Tree"
date_modified: 2026-07-16
tags: [components, react, layout, pwa]
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

## WordCard.jsx

- Handles click: speech + haptic feedback
- `navigator.vibrate(50)` for words, `navigator.vibrate([30, 50, 30])` for folders
- Emoji rendering via `el.textContent = emoji` (no image assets)

## Board.jsx

- Computes CSS Grid columns based on viewport
- Separates Yes/No into a fixed bottom bar
- Filters hidden items

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

See [[vocabulary-system]] for data flow into Board/WordCard.
See [[deployment]] for PWA/base-path configuration.
