import { useEffect, useState } from 'react';

const POLL_MS = 5000;

/**
 * Charging state, preferring the kiosk shell's bridge.
 *
 * Android WebView does not implement the Battery Status API, so
 * `navigator.getBattery` is undefined inside the shell and the board dims
 * itself even while parked on its charger. The shell exposes the real
 * hardware state through `window.AACNative` instead. Plain browsers have no
 * bridge and fall back to the Battery Status API, which is Chromium-only —
 * on other engines `charging` stays false and the idle dim runs as before.
 *
 * Returns a boolean. `null` from the bridge means the object is missing or
 * mid-install, so we fall back rather than trusting it.
 */
function readNative() {
  try {
    const value = window.AACNative?.isCharging?.();
    return typeof value === 'boolean' ? value : null;
  } catch {
    return null;
  }
}

export function useCharging() {
  const [charging, setCharging] = useState(() => readNative() ?? false);

  useEffect(() => {
    if (readNative() !== null) {
      // No event exists to subscribe to: Android does not forward power
      // broadcasts into a WebView, so poll instead.
      const id = setInterval(() => {
        const next = readNative();
        if (next !== null) setCharging(next);
      }, POLL_MS);
      return () => clearInterval(id);
    }

    if (!navigator.getBattery) return;
    let battery = null;
    const onChange = () => setCharging(battery.charging);
    navigator.getBattery().then((b) => {
      battery = b;
      setCharging(b.charging);
      b.addEventListener('chargingchange', onChange);
    }).catch(() => {});
    return () => battery?.removeEventListener('chargingchange', onChange);
  }, []);

  return charging;
}
