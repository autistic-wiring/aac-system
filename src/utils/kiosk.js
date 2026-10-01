import { useCallback, useEffect, useRef, useState } from 'react';

// Caregiver exit gesture: press and hold this screen corner for 3s.
const EXIT_HOLD_MS = 3000;
// Corner square size in CSS px, measured from the top-right viewport edges.
const EXIT_CORNER = 96;

const inExitCorner = (x, y) =>
  x >= window.innerWidth - EXIT_CORNER && y <= EXIT_CORNER;

const preventAll = (e) => e.preventDefault();

// Keys a user would press to leave a kiosk: fullscreen toggle, reload, close
// tab, address bar, new tab, and devtools.
const BLOCKED_KEYS = new Set(['Escape', 'F5', 'F11', 'F12']);
const BLOCKED_WITH_CTRL = new Set(['r', 'w', 'l', 't', 'n', 'p']);

// Set by allowUnload() so our own PWA-update reload is not stopped.
let allowNextUnload = false;

/** Let the next page unload happen. Call before an intentional reload. */
export function allowUnload() {
  allowNextUnload = true;
}

/**
 * Locks the page into kiosk mode: re-enters fullscreen whenever it drops,
 * blocks the keyboard/pointer gestures that would leave the board, and traps
 * the history back button. Lifting the lock is a deliberate long-press in the
 * top-right corner.
 *
 * `active` gates only the exit-blocking half. Fullscreen is re-entered from
 * mount so a launch straight from the home screen is already fullscreen.
 * Returns `holding` so the caller can render a progress ring for the gesture.
 */
export function useKiosk({ active = true } = {}) {
  const [holding, setHolding] = useState(false);
  const unlockedRef = useRef(false);
  const holdTimer = useRef(null);

  const cancelHold = useCallback(() => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (unlockedRef.current || document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen();
      if (screen.orientation?.lock) {
        try { await screen.orientation.lock('landscape'); } catch { /* unsupported */ }
      }
    } catch {
      // Chrome requires a user gesture; the listener below retries on the
      // first tap. iPadOS has no Fullscreen API, so this is a no-op there.
    }
  }, []);

  // Re-enter fullscreen when it drops (Esc, swipe, tab switch).
  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement || unlockedRef.current) return;
      document.addEventListener('pointerdown', enterFullscreen, { once: true });
      document.addEventListener('keydown', enterFullscreen, { once: true });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') enterFullscreen();
    };

    enterFullscreen();
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enterFullscreen]);

  useEffect(() => {
    if (!active) return;

    // The back button fires popstate. Re-pushing the sentinel makes it a
    // no-op, so the board can never be navigated out of.
    history.pushState({ kiosk: true }, '');
    const onPop = () => history.pushState({ kiosk: true }, '');

    const onKeyDown = (e) => {
      const withCtrl = e.ctrlKey || e.metaKey;
      if (BLOCKED_KEYS.has(e.key) || (withCtrl && BLOCKED_WITH_CTRL.has(e.key))) {
        e.preventDefault();
        enterFullscreen();
      }
    };

    // Long-press exit gesture. Bound to the window rather than to a DOM
    // element so no hotspot can swallow taps meant for a word card.
    const startHold = (e) => {
      if (e.button !== 0 || !inExitCorner(e.clientX, e.clientY)) return;
      setHolding(true);
      holdTimer.current = setTimeout(() => {
        unlockedRef.current = true;
        setHolding(false);
      }, EXIT_HOLD_MS);
    };
    const onPointerMove = (e) => {
      if (holdTimer.current && !inExitCorner(e.clientX, e.clientY)) cancelHold();
    };

    const onBeforeUnload = (e) => {
      if (allowNextUnload) {
        allowNextUnload = false;
        return;
      }
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', startHold);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', cancelHold);
    window.addEventListener('pointercancel', cancelHold);
    window.addEventListener('blur', cancelHold);
    document.addEventListener('contextmenu', preventAll);
    document.addEventListener('dragstart', preventAll);
    document.addEventListener('selectstart', preventAll);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', startHold);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', cancelHold);
      window.removeEventListener('pointercancel', cancelHold);
      window.removeEventListener('blur', cancelHold);
      document.removeEventListener('contextmenu', preventAll);
      document.removeEventListener('dragstart', preventAll);
      document.removeEventListener('selectstart', preventAll);
      window.removeEventListener('beforeunload', onBeforeUnload);
      cancelHold();
    };
  }, [active, cancelHold, enterFullscreen]);

  return { holding };
}
