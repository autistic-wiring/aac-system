---
date_modified: 2026-11-10
tags: [aac, kiosk, android, webview, deploy, testing, power, device-owner, locktask, adb]
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
2026-10-04: dim overlay opacity 0.98 → 0.4 (dims to 60% brightness, still
readable; `src/App.jsx`). Fail-safe stays: only dims on confirmed battery
(`isDimmed && !charging` derived), never on unknown state.

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
takes the pairing port; `adb connect` needs the connect port.

## Wireless debugging quirks (learned 2026-11-10)

- The toggle turns itself OFF on reboot, and the connect port CHANGES each
  boot (seen 40781 → 46205 → 35389 on 192.168.50.231). After any reboot the
  user must re-enable it on the tablet and report the new IP:port — the
  tablet pings fine but refuses ADB and broadcasts no mDNS until then.
- Clean up stale entries: `adb disconnect <old-ip:port>`.
- Same physical tablet can appear twice (direct `IP:port` + mDNS
  `adb-XXXX._adb-tls-connect._tcp`) — both work, either serial is fine.

## True kiosk provisioning (done 2026-11-10, no wipe needed)

`adb shell dpm set-device-owner` succeeded on the already-provisioned tablet
because all accounts had been removed first (0 accounts, `dpm list-owners`
empty). With accounts present it fails — that is the only precondition.

Required ADB state (all persist across reboot except wireless debugging):

```bash
adb shell dpm set-device-owner cc.nexvision.aac.debug/cc.nexvision.aac.KioskDeviceAdminReceiver
adb shell cmd package set-home-activity cc.nexvision.aac.debug/cc.nexvision.aac.MainActivity  # needs HOME intent-filter
adb shell locksettings set-disabled true   # never-lock: no PIN/swipe
adb shell settings put system screen_off_timeout 2147483647
adb shell svc power stayon true
adb shell settings put global stay_on_while_plugged_in 7
adb shell dumpsys deviceidle whitelist +cc.nexvision.aac.debug
```

Verify: `dpm list-owners` shows 1 owner; `dumpsys activity activities |
grep mLockTaskModeState` shows `LOCKED`.

Uninstalling the app wipes the default-HOME setting (but the owner entry
survived a remove/reinstall 2026-11-10 — always re-check both after any
reinstall). If HOME lands on `com.blackview.gamemode` instead of the board,
re-run `set-home-activity` for the AAC component. The corner exit prefers a
real launcher package (name contains "launcher") for the same reason.

## Code lessons: what the CLIs can no longer do on Android 15

- **`dpm set-locktask-packages` is GONE** (also absent from `cmd device_policy`).
  The app self-whitelists in `MainActivity.startLockTaskIfAllowed()` when it
  sees it is device owner: `setLockTaskPackages(admin, [own package])`.
- **Bars need `setLockTaskFeatures(NONE)`.** Immersive-sticky alone does NOT
  hide status/nav on 15 (verified via screencap). With device owner,
  `setLockTaskFeatures(admin, LOCK_TASK_FEATURE_NONE)` (API 28+, guarded)
  empties lock-task system UI. The old `settings put global policy_control
  immersive.full=...` trick is ignored on 15 — tested, reverted.
- **`BOOT_COMPLETED` receiver cannot foreground the app** (background-start
  block). `BootReceiver` is registered but boot-to-board depends on the HOME
  setting. After reboot + unlock the board auto-launches; any manual tap
  into Settings drops lock to NONE.
- **Re-pin in `onResume`, not `onCreate`.** `singleTask` relaunch (launcher
  icon tap, Home press) goes `onNewIntent → onResume` without `onCreate`, so
  lock would stay NONE. Calling `startLockTaskIfAllowed()` in `onResume`
  makes Home / the AAC Board icon a no-ADB "re-enter kiosk" shortcut —
  verified: Settings (NONE) → HOME key → board LOCKED.
- **Device owner cannot be force-stopped.** `am force-stop` returns 0 but the
  process keeps its PID. Caregiver exit = reboot or remove the owner.
  (android/README.md documents this.)

## Refreshing the board without reboot

Killing the app to force a fresh load is IMPOSSIBLE for a device owner —
verified 2026-11-10, every path refused with the process (and lock) intact:
`am force-stop` (rc=0, no-op), `am kill`, `am crash`, `pm clear`
(`SecurityException: CLEAR_APP_USER_DATA` denied), `run-as` cache delete
(permission denied). This is the kiosk protecting itself — by design.

Remote page reload is ALSO blocked, by our own `beforeunload` guard: direct
`location.reload()`, `Page.reload` (even `ignoreCache`), and `Page.navigate`
(`ERR_ABORTED`, no dialog in WebView) all die. The ONLY sanctioned reloader
is the app's PWA update flow (`__checkForPwaUpdate` → `allowUnload()` →
reload), which fires on every button/card tap via `pointerdown`.

Consequences:
- After deploying web changes, tap any card on the tablet and wait ~10s:
  the board detects the new build and reloads itself with the update.
- If the SW registration was ever removed (DevTools), the update flow is
  dead until a fresh load re-registers it — only a reboot fixes that.
- After reboot: unlock, re-enable wireless debugging (toggle resets, port
  changes — get the new IP:port from the tablet), reconnect, verify.
- NEVER unregister the SW on the device (`getRegistrations().unregister()`).
  The app captures its registration once at mount (`regRef`); after an
  unregister every later update check early-returns and the page can never
  self-update again — only a reboot (fresh mount) recovers it. Lesson paid
  for 2026-11-10.

## Offline support (verified 2026-11-10, prod v1.2.78)

- All 39 speakable cards resolve to 34 unique `/audio/*.wav` files, all
  present in `public/audio/` and all in the SW precache (build-checked
  against `dist/sw.js`). Folders/empties/hidden items need no sound.
- All 36 card images exist and ride the same precache (`**/*.{png,webp,…}`).
- Google Fonts was the one online dependency — replaced with self-hosted
  variable `Outfit.ttf` in `public/fonts/` + local `@font-face`; `ttf` added
  to workbox `globPatterns`. Bundle now has zero external URLs.
- Proven on-device with network fully cut (CDP offline emulation): `/`,
  `/audio/want.wav`, icon all return 200 from cache.
- Sound chain offline: preloaded wav → `<audio>` element → device
  `speechSynthesis` (on-device voices). The `:5050` TTS server is dev-only
  (`NetworkOnly`) — fetch fails fast offline, falls through to synthesis.

```bash
PID=$(adb shell pidof cc.nexvision.aac.debug | tr -d '\r')
adb forward tcp:9222 localabstract:webview_devtools_remote_$PID
python3 -c "
import websocket, json
ws = websocket.create_connection(
  'ws://localhost:9222/devtools/page/<id-from-http://localhost:9222/json>',
  suppress_origin=True)   # without this: 403 origin rejection
ws.send(json.dumps({'id':1,'method':'Page.reload','params':{'ignoreCache':True}}))
print(ws.recv()); ws.close()"
```

`Page.reload` without `ignoreCache` serves the hashed-asset cache; with it
the new build loads and lock stays engaged.

## Bottom bar size (2026-11-10)

`.bb-btn` 52px → 42px, bar padding 10px → 8px, `margin-top` 12px → 10px,
title font `clamp(1rem,3.5vmin,1.4rem)` → `clamp(0.8rem,2.8vmin,1.15rem)`
(~111px → ~92px measured on 1280x800 screencap). Bar docked flush:
`.app-container` padding `12px 12px 0`, bar `border-radius: 16px 16px 0 0`.
Do NOT shrink buttons further unprompted — 42px is already small for kid
touch targets.
