import React, { useState, useEffect, useRef } from 'react';
import GoTalkHome from './components/GoTalkHome';
import GoTalkPage from './components/GoTalkPage';
import SplashScreen from './components/SplashScreen';
import { gotalkPages, allGotalkButtons } from './data/gotalkPages';
import { preloadWords } from './utils/speechAdapter';
import './App.css';
import './GoTalk.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPageId, setCurrentPageId] = useState(null);
  const fullscreenLock = useRef(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    preloadWords(allGotalkButtons);
  }, []);

  // Check for PWA updates on button press, updating the page after 3 seconds if an update is found
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let updateScheduled = false;
    let regRef = null;

    const applyUpdateAndReload = () => {
      const reload = () => window.location.reload();
      const waiting = regRef?.waiting;
      if (!waiting) {
        reload();
        return;
      }
      // Reload once the new SW takes control; fall back to a forced reload
      // if controllerchange never fires (e.g. corrupted SW).
      navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
      waiting.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(reload, 1500);
    };

    const scheduleUpdate = () => {
      if (updateScheduled) return;
      updateScheduled = true;
      console.log('[PWA] New version detected. Reloading page in 3 seconds...');
      setTimeout(applyUpdateAndReload, 3000);
    };

    const setupUpdateListener = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      regRef = reg;

      // If an update is already waiting, schedule immediately.
      if (reg.waiting) {
        scheduleUpdate();
        return;
      }

      // Attach the updatefound listener ONCE; pointerdown only triggers reg.update().
      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        if (!installingWorker) return;
        installingWorker.addEventListener('statechange', () => {
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            scheduleUpdate();
          }
        });
      });
    };

    const triggerUpdateCheck = async () => {
      if (updateScheduled) return;
      const reg = regRef;
      if (!reg) return;
      try {
        // Force HTTP revalidation of sw.js so updatefound can fire.
        fetch('/sw.js', { cache: 'no-store' }).catch(() => {});

        if (reg.waiting) {
          scheduleUpdate();
          return;
        }
        await reg.update();
      } catch {
        /* ignore offline network errors */
      }
    };

    const handlePointerDown = (e) => {
      if (e.target.closest('button, .gotalk-card, .gotalk-launcher-card')) {
        triggerUpdateCheck();
      }
    };

    setupUpdateListener();
    window.addEventListener('pointerdown', handlePointerDown);
    // Expose for testing / manual triggering
    window.__checkForPwaUpdate = triggerUpdateCheck;
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      delete window.__checkForPwaUpdate;
    };
  }, []);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    let wakeLock = null;

    const acquire = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch { /* device may deny (e.g. low battery) */ }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLock?.release();
    };
  }, []);

  useEffect(() => {
    const enterFullscreen = async () => {
      if (document.fullscreenElement) return;
      try {
        await document.documentElement.requestFullscreen();
        if (screen.orientation?.lock) {
          try { await screen.orientation.lock('landscape'); } catch { /* not supported */ }
        }
      } catch { /* needs user gesture on some browsers */ }
    };

    const startFullscreen = () => {
      if (fullscreenLock.current) return;
      fullscreenLock.current = true;
      enterFullscreen();
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        fullscreenLock.current = false;
        document.addEventListener('click', startFullscreen, { once: true });
        document.addEventListener('touchstart', startFullscreen, { once: true });
      }
    };

    enterFullscreen();
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('click', startFullscreen, { once: true });

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('click', startFullscreen);
      document.removeEventListener('touchstart', startFullscreen);
    };
  }, []);

  useEffect(() => {
    if (showSplash) return;

    const IDLE_TIMEOUT = 20 * 60 * 1000;
    const wake = () => {
      setIsDimmed(false);
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setIsDimmed(true), IDLE_TIMEOUT);
    };

    wake();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('mousemove', wake);
    window.addEventListener('touchstart', wake);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') wake();
    });

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('touchstart', wake);
    };
  }, [showSplash]);

  const currentIndex = currentPageId === null
    ? -1
    : gotalkPages.findIndex((p) => p.id === currentPageId);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % gotalkPages.length;
    setCurrentPageId(gotalkPages[nextIndex].id);
  };

  const handleHome = () => {
    setCurrentPageId(null);
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {!showSplash && (
        <div
          className="dim-overlay"
          style={{
            opacity: isDimmed ? 0.98 : 0,
            transition: isDimmed ? 'opacity 4s ease' : 'opacity 0.4s ease',
          }}
        />
      )}
      <div className="app-container">
        <main>
          {currentPageId === null ? (
            <GoTalkHome pages={gotalkPages} onSelect={setCurrentPageId} />
          ) : (
            <GoTalkPage
              page={gotalkPages[currentIndex]}
              onHome={handleHome}
              onNext={handleNext}
            />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
