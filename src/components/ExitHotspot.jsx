import { useEffect, useState } from 'react';

const HOLD_MS = 3000;
const STEPS = 30;
const CIRC = 2 * Math.PI * 44;

// Progress ring shown while a caregiver holds the exit hotspot. Bound to the
// window (not to this element) in useKiosk, so it is pointer-events: none and
// cannot swallow taps meant for the top-right word card. App mounts this only
// while the hold is in progress, so `pct` always starts fresh at 0.
export default function ExitHotspot() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / HOLD_MS) * 100);
      setPct(p);
      if (p >= 100) clearInterval(id);
    }, HOLD_MS / STEPS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="exit-hotspot" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="exit-ring">
        <circle className="exit-ring-track" cx="50" cy="50" r="44" />
        <circle
          className="exit-ring-fill"
          cx="50"
          cy="50"
          r="44"
          strokeDasharray={`${(pct / 100) * CIRC} ${CIRC}`}
        />
      </svg>
      <span className="exit-label">Keep holding</span>
    </div>
  );
}
