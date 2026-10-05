import React, { useState, useEffect, useRef } from 'react';
import Board from './components/Board';
import BottomBar from './components/BottomBar';
import SplashScreen from './components/SplashScreen';
import ExitHotspot from './components/ExitHotspot';
import { defaultVocabulary } from './data/defaultVocabulary';
import { preloadWords } from './utils/speechAdapter';
import { useKiosk, allowUnload } from './utils/kiosk';
import { useCharging } from './utils/charging';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('home');
  const [isDimmed, setIsDimmed] = useState(false);
  const inactivityTimer = useRef(null);
  const charging = useCharging();

  // Kiosk is not active during the splash: the PWA update flow reloads the
  // page there, and beforeunload would turn that into a "leave site?" prompt.
  const { holding } = useKiosk({ active: !showSplash });

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
      const reload = () => {
        allowUnload();
        window.location.reload();
      };
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
    if (showSplash) return;

    const IDLE_TIMEOUT = 20 * 60 * 1000;

    // While charging the device is parked on its stand, so keep the screen
    // bright and never start the idle dim.
    if (charging) {
      clearTimeout(inactivityTimer.current);
      return;
    }

    const wake = () => {
      setIsDimmed(false);
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setIsDimmed(true), IDLE_TIMEOUT);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') wake();
    };

    wake();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('mousemove', wake);
    window.addEventListener('touchstart', wake);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('touchstart', wake);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [showSplash, charging]);

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
        // Derived, not stored: on the charger the overlay is forced clear
        // and `isDimmed` is left as-is so it resumes correctly on unplug.
        style={{
          opacity: isDimmed && !charging ? 0.4 : 0,
          transition: isDimmed ? 'opacity 4s ease' : 'opacity 0.4s ease',
        }}
      />
    )}
    {holding && <ExitHotspot />}
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
