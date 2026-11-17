// Device battery for the bottom-bar gauge. Prefers the shell bridge
// (AACNative.getBattery → "level,charging"), which works fully offline — plain
// WebView has no Battery Status API. Falls back to navigator.getBattery()
// in a normal browser, where the OS supplies it.
import { useState, useEffect } from 'react';

function readNative() {
  try {
    const raw = window.AACNative?.getBattery?.();
    if (typeof raw === 'string' && raw) {
      const [lvl, ch] = raw.split(',');
      const level = parseInt(lvl, 10);
      if (!Number.isNaN(level)) return { level, charging: ch === 'true' };
    }
  } catch {
    // No bridge (plain browser) — fall through to the web API.
  }
  return null;
}

export function useBattery() {
  const [battery, setBattery] = useState(readNative);

  useEffect(() => {
    let dead = false;
    let mgr = null;

    const poll = () => {
      const r = readNative();
      if (r && !dead) setBattery(r);
    };
    const id = setInterval(poll, 30000);
    poll();

    if (!readNative() && 'getBattery' in navigator) {
      navigator
        .getBattery()
        .then((m) => {
          if (dead) return;
          mgr = m;
          const upd = () => {
            if (!dead) {
              setBattery({ level: Math.round(m.level * 100), charging: m.charging });
            }
          };
          upd();
          m.addEventListener('levelchange', upd);
          m.addEventListener('chargingchange', upd);
        })
        .catch(() => {});
    }

    const onVis = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      dead = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      if (mgr) {
        mgr.onlevelchange = null;
        mgr.onchargingchange = null;
      }
    };
  }, []);

  return battery;
}
