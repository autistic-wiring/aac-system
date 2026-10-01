# AAC Kiosk — Android shell

A WebView wrapper that puts the AAC board into kiosk mode on a dedicated
tablet. Two layers of lockdown, because the stronger one is not always
available.

| Layer | What it blocks | Needs provisioning |
|---|---|---|
| Lock task (`startLockTask`) | Home, recents, status bar, hardware back, notification shade | Yes — this app must be the device owner |
| Immersive sticky (fallback) | Status and nav bars stay hidden; a swipe shows them transiently and they auto-hide | No |

The app uses lock task when it is the device owner and silently falls back to
immersive mode otherwise, so it is safe to install on a normal tablet.

## Build

Requires JDK 17+ and an Android SDK with platform 34.

```bash
cd android
./gradlew assembleDebug            # → app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleDebug -PboardUrl=https://aac-testing.nexvision.cc/
```

`boardUrl` defaults to prod. It must be HTTPS — `usesCleartextTraffic` is off.

## Install

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n cc.nexvision.aac.debug/cc.nexvision.aac.MainActivity
```

The debug build uses applicationId `cc.nexvision.aac.debug`, so it sits
alongside a release install rather than replacing it.

## Provisioning as device owner (true kiosk)

Lock task only engages once this app is the device owner. This wipes the
device, so do it before the tablet is set up for the user.

1. Enable Developer options and USB debugging.
2. Factory reset, then on the welcome screen tap the build number 7 times.
3. Connect over ADB and run:
   ```bash
   adb shell dpm set-device-owner cc.nexvision.aac.debug/cc.nexvision.aac.KioskDeviceAdminReceiver
   ```
4. Confirm with `adb shell dpm list-owners` — it must list the package.

After that, Home, recents, and the status bar are unavailable until the owner
is removed with `adb shell dpm remove-active-admin --user 0 <component>`.

Without provisioning, immersive mode still hides the bars and re-hides them
whenever focus returns, and hardware back is consumed. Home will still leave
the app. That is the intended degradation for a shared tablet.

## Caregiver exit

The web layer has its own long-press exit gesture (top-right corner, 3
seconds). That unlocks the browser kiosk only — the shell stays in lock task
until the app is stopped from ADB. To leave the app entirely:

```bash
adb shell am force-stop cc.nexvision.aac.debug
```

## Screen and orientation

`FLAG_KEEP_SCREEN_ON` prevents sleep, and the manifest locks landscape with
`configChanges` so rotation never reloads the WebView. The browser also
requests wake lock and landscape orientation lock, which is what covers a plain
browser install with no shell at all.
