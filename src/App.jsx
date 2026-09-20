import React, { useState, useEffect, useRef } from 'react';
import Board from './components/Board';
import BottomBar from './components/BottomBar';
import SplashScreen from './components/SplashScreen';
import { defaultVocabulary } from './data/defaultVocabulary';
import { preloadWords } from './utils/speechAdapter';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('home');
  const fullscreenLock = useRef(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    const allWordsToPreload = [
      ...defaultVocabulary.core,
      ...defaultVocabulary.folders,
      ...Object.values(defaultVocabulary.categories).flat()
    ];
    preloadWords(allWordsToPreload);
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
      if (e.target.closest('button, .word-card, .folder-card, .back-button')) {
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
    let charging = false;
    let battery = null;

    const wake = () => {
      setIsDimmed(false);
      clearTimeout(inactivityTimer.current);
      // While charging the device is parked on its stand, so keep the
      // screen bright and never start the idle dim.
      if (!charging) {
        inactivityTimer.current = setTimeout(() => setIsDimmed(true), IDLE_TIMEOUT);
      }
    };

    const onChargingChange = () => {
      if (battery.charging) {
        clearTimeout(inactivityTimer.current);
        setIsDimmed(false);
      } else {
        wake();
      }
    };

    wake();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('mousemove', wake);
    window.addEventListener('touchstart', wake);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') wake();
    });

    // Battery Status API (Chromium only; silently no-op elsewhere).
    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        battery = b;
        charging = b.charging;
        b.addEventListener('chargingchange', onChargingChange);
        if (charging) onChargingChange();
      }).catch(() => {});
    }

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('touchstart', wake);
      if (battery) battery.removeEventListener('chargingchange', onChargingChange);
    };
  }, [showSplash]);

  // GoTalk-style page navigation: home is the Core words page, the rest
  // follow the folder order. Prev/next cycle; back returns to the last page.
  const prevPage = useRef('home');
  const pageOrder = ['home', ...defaultVocabulary.folders.map((f) => f.id)];
  const pages = pageOrder.map((id) => ({
    id,
    title: id === 'home'
      ? 'Core words'
      : defaultVocabulary.folders.find((f) => f.id === id)?.word || id,
  }));

  const goTo = (id) => {
    setCurrentCategory((prev) => {
      prevPage.current = prev;
      return id;
    });
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      goTo(item.id);
    }
  };

  const handleHome = () => goTo('home');
  const handleBack = () => setCurrentCategory(prevPage.current);
  const handleSelect = (id) => goTo(id);

  const stepPage = (dir) => {
    const idx = pageOrder.indexOf(currentCategory);
    const next = pageOrder[(idx + dir + pageOrder.length) % pageOrder.length];
    goTo(next);
  };
  const handlePrev = () => stepPage(-1);
  const handleNext = () => stepPage(1);

  let currentItems = [];
  if (currentCategory === 'home') {
    currentItems = defaultVocabulary.core;
  } else {
    currentItems = defaultVocabulary.categories[currentCategory] || [];
  }

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
        <Board vocabulary={currentItems} onItemClick={handleItemClick} />
      </main>
      <BottomBar
        pages={pages}
        currentId={currentCategory}
        onHome={handleHome}
        onBack={handleBack}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelect={handleSelect}
      />
    </div>
    </>
  );
}

export default App;
