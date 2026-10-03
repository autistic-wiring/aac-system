import { useEffect, useState } from 'react';

const POLL_MS = 5000;

/**
 * Charging state, preferring the kiosk shell's bridge.
 *
 * Fail-safe is BRIGHT: unknown state means "don't dim". Only a positive
 * "discharging" reading starts the idle dim. The shell exposes the real
 * hardware state through `window.AACNative` (polled, no power events reach
 * a WebView). Plain browsers have no bridge and fall back to the Battery
 * Status API, which is Chromium-only — on other engines `charging` stays
 * true so the board never dims.
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
  // Fail-safe bright: unknown (bridge mid-install, no Battery API) stays
  // true so the board never dims unless proven to be on battery.
  const [charging, setCharging] = useState(() => readNative() ?? true);

  useEffect(() => {
    let battery = null;
    const onChange = () => {
      // Battery events are stale inside the WebView shell — only trust
      // them when no native bridge is answering.
      if (readNative() === null && battery) setCharging(battery.charging);
    };

    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        battery = b;
        if (readNative() === null) setCharging(b.charging);
        b.addEventListener('chargingchange', onChange);
      }).catch(() => {});
    }

    // Always poll: the bridge can inject late (after first paint), and an
    // early null read must not lock us into the stale Battery API branch.
    // Native wins whenever it answers; battery is fallback only.
    const poll = () => {
      const native = readNative();
      if (native !== null) {
        setCharging(native);
      } else if (battery) {
        setCharging(battery.charging);
      }
      try {
        window.__charging = native ?? battery?.charging ?? true;
        window.__chargingSource = native !== null ? 'native' : (battery ? 'battery' : 'none');
      } catch { /* SSR / workers */ }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      clearInterval(id);
      battery?.removeEventListener('chargingchange', onChange);
    };
  }, []);

  return charging;
}
