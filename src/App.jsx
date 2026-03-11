import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import SplashScreen from './components/SplashScreen';
import { defaultVocabulary } from './data/defaultVocabulary';
import { preloadWords } from './utils/speechAdapter';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('home');

  useEffect(() => {
    // Preload all words (core + folders + all subcategories)
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
      } catch {
        // silently ignore — device may deny (e.g. low battery)
      }
    };

    // re-acquire when tab becomes visible again (wake lock is released on hide)
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
    currentItems = [...defaultVocabulary.core, ...defaultVocabulary.folders];
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
