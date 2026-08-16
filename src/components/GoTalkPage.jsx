import React, { useState, useRef } from 'react';
import GoTalkCard from './GoTalkCard';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" focusable="false">
    <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5" />
  </svg>
);

const NextIcon = () => (
  <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" focusable="false">
    <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      d="M9 5l7 7-7 7" />
  </svg>
);

const GoTalkPage = ({ page, onHome, onNext }) => {
  const [pressed, setPressed] = useState(null);
  const pointerDownTime = useRef(0);

  const runAction = (action, which) => {
    setPressed(which);
    pointerDownTime.current = Date.now();
    action();
  };

  const release = () => setPressed(null);

  const clickGuard = (action, which) => {
    if (Date.now() - pointerDownTime.current < 800) return;
    runAction(action, which);
  };

  return (
    <div className="gotalk-page">
      <div className="gotalk-page-grid">
        {page.buttons.map((item) => (
          <GoTalkCard key={item.id} item={item} />
        ))}
      </div>
      <footer className="gotalk-footer">
        <button
          className={`gotalk-footer-btn ${pressed === 'home' ? 'pressed' : ''}`}
          aria-label="Home"
          onPointerDown={(e) => { if (e.button === 0) runAction(onHome, 'home'); }}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
          onClick={() => clickGuard(onHome, 'home')}
        >
          <HomeIcon />
        </button>
        <h2 className="gotalk-footer-title">{page.title}</h2>
        <button
          className={`gotalk-footer-btn ${pressed === 'next' ? 'pressed' : ''}`}
          aria-label="Next page"
          onPointerDown={(e) => { if (e.button === 0) runAction(onNext, 'next'); }}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
          onClick={() => clickGuard(onNext, 'next')}
        >
          <NextIcon />
        </button>
      </footer>
    </div>
  );
};

export default GoTalkPage;
