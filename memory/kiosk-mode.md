---
date_modified: 2026-10-01
tags: [aac, kiosk, android, webview, deploy, testing]
---

# AAC kiosk mode

Two layers, deployed 2026-10-01.

## Web layer — `src/utils/kiosk.js`

`useKiosk({ active })` hook. Re-enters fullscreen on `fullscreenchange` and on
visibility return. Blocks Esc/F5/F11/F12 and Ctrl+R/W/L/T/N/P, contextmenu,
dragstart, selectstart. Traps the back button via `pushState` + `popstate`
re-push. Warns on `beforeunload`.

Two non-obvious decisions:

- **`active: !showSplash`.** The splash is where the PWA update flow reloads the
  page. If kiosk were active there, `beforeunload` turns the update into a
  "leave site?" prompt and the device can never update. `allowUnload()` covers
  the in-App reload path; the splash is handled by not activating at all.
- **Exit hold is bound to `window`, not to a DOM element.** A hotspot element
  would intercept the top-right word card's taps. Verified on device: the "Want"
  card under the corner still plays audio while the ring renders.

`src/components/ExitHotspot.jsx` is mounted only while holding, so its `pct`
state starts fresh each time. This also dodges the `react-hooks/set-state-in-
effect` lint rule that fires if you reset state in an effect body.

## Android shell — `android/`

WebView, Java, no Kotlin. `applicationId` is `cc.nexvision.aac`, debug build
appends `.debug` so both can be installed at once.

Two lockdown levels, picked at runtime:
- `startLockTask()` when `dpm.isAdminActive()` — true kiosk, needs device-owner
  provisioning.
- Immersive sticky otherwise — bars hidden, re-hidden on focus regain.

`boardUrl` is a `resValue` generated in `app/build.gradle`, overridable with
`-PboardUrl=...`. Declared in build.gradle, NOT strings.xml, or there is a
duplicate-resource conflict.

Added `android` to `.dockerignore` so the SDK-sized build tree stays out of the
web image context.

## Charging / idle dim

The board dims after 20 min idle. It must NOT dim while on the charger.

**`navigator.getBattery` is unusable inside the WebView shell.** It EXISTS
(WebView 153) but returns STALE state — with the OS at
`BATTERY_STATUS_CHARGING` it still reported `charging=false`. This was a real
bug, not a missing API, and the old code dimmed on the charger because of it.

Fix: `NativeBridge.isCharging()` reads `ACTION_BATTERY_CHANGED` directly.
`useCharging()` (src/utils/charging.js) prefers the bridge, polls every 5s
(no power events reach a WebView), and falls back to the Battery Status API
when absent so browser installs are unaffected.

Overlay opacity is DERIVED: `isDimmed && !charging`. Do not reset `isDimmed`
in an effect — keeps dim state intact across a charger connect, and dodges
the `react-hooks/set-state-in-effect` lint rule.

## Verifying on-device (WebView remote debugging)

Debug builds call `WebView.setWebContentsDebuggingEnabled(true)`.

```bash
PID=$(adb shell pidof cc.nexvision.aac.debug | tr -d '\r')
adb forward tcp:9333 localabstract:webview_devtools_remote_$PID
# then a WebSocket client against /json/list
```

This is the only way to assert on in-page state (overlay opacity, bridge
return value). Patching `.style` directly proves nothing — it bypasses React.
To exercise the 20-minute idle timer, inject a `setTimeout` patch via
`Page.addScriptToEvaluateOnNewDocument` that collapses delays >300000ms to
2000ms, then `Page.reload`.

Simulate charging without a cable:
```bash
adb shell dumpsys battery set status 2 && adb shell dumpsys battery set level 90
adb shell dumpsys battery reset     # restore
```

## Test device

Blackview Tab A6 Kids, Android 15 (SDK 35), 800x1280 @ 213dpi, arm64.
Wireless debugging: pairing port and connect port are DIFFERENT. `adb pair`
takes the pairing port; `adb connect` needs the connect port, which mDNS did not
advertise here — had to scan 30000-50000 to find it (was 44541).

`adb shell dpm set-device-owner` wipes the device, so lock task was NOT tested.
Verified only: immersive bars hidden, back swallowed, HOME still leaves,
keep-screen-on flag set, audio plays, exit ring fills and unlocks.
