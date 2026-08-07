import React, { useState, useEffect, useRef } from 'react';
import Board from './components/Board';
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

  const [backPressed, setBackPressed] = useState(false);
  const backPointerDownTime = useRef(0);

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setCurrentCategory(item.id);
    }
  };

  const handleBack = () => {
    setCurrentCategory('home');
  };

  const handleBackPointerDown = (e) => {
    if (e.button !== 0) return;
    setBackPressed(true);
    backPointerDownTime.current = Date.now();
    handleBack();
  };

  const handleBackPointerUp = () => {
    setBackPressed(false);
  };

  const handleBackClick = () => {
    if (Date.now() - backPointerDownTime.current < 800) {
      return;
    }
    handleBack();
  };

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
        {currentCategory !== 'home' && (
          <div className="navigation-bar">
            <button 
              className={`back-button ${backPressed ? 'pressed' : ''}`}
              onPointerDown={handleBackPointerDown}
              onPointerUp={handleBackPointerUp}
              onPointerCancel={handleBackPointerUp}
              onClick={handleBackClick}
            >
              <span className="icon">🔙</span> Back to Home
            </button>
            <h2 className="category-title">
              {defaultVocabulary.folders.find(f => f.id === currentCategory)?.word || ''}
            </h2>
          </div>
        )}
        <Board vocabulary={currentItems} onItemClick={handleItemClick} />
      </main>
    </div>
    </>
  );
}

export default App;
