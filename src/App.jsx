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

  useEffect(() => {
    const allWordsToPreload = [
      ...defaultVocabulary.core,
      ...defaultVocabulary.folders,
      ...Object.values(defaultVocabulary.categories).flat()
    ];
    preloadWords(allWordsToPreload);
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

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setCurrentCategory(item.id);
    }
  };

  const handleBack = () => {
    setCurrentCategory('home');
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
    <div className="app-container">
      <a
        href="/donate.html"
        className="donate-fab"
        title="Support this project"
        aria-label="Donate"
      >
        💜
      </a>
      <main>
        {currentCategory !== 'home' && (
          <div className="navigation-bar">
            <button className="back-button" onClick={handleBack}>
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
