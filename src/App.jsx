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
    let updateScheduled = false;

    const scheduleUpdate = () => {
      if (updateScheduled) return;
      updateScheduled = true;
      console.log('[PWA] Update detected. Reloading page in 3 seconds...');
      setTimeout(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
        window.location.reload();
      }, 3000);
    };

    const triggerUpdateCheck = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        if (reg.waiting) {
          scheduleUpdate();
          return;
        }

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                scheduleUpdate();
              }
            };
          }
        };

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

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
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

    const IDLE_TIMEOUT = 20000;
    const wake = () => {
      setIsDimmed(false);
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setIsDimmed(true), IDLE_TIMEOUT);
    };

    wake();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') wake();
    });

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
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
          opacity: isDimmed ? 0.7 : 0,
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
