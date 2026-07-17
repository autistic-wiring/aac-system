import React, { useState, useRef, useEffect } from 'react';
import { speakWord } from '../utils/speechAdapter';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

const WordCard = ({ item, onItemClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const pointerDownTime = useRef(0);

  const imageUrl = resolveAsset(item.image);
  const animationUrl = resolveAsset(item.animation);
  const showAnimation = isPressed && animationUrl;

  // Preload the animation so the first press is instant.
  useEffect(() => {
    if (!animationUrl) return;
    const img = new Image();
    img.src = animationUrl;
  }, [animationUrl]);

  const triggerAction = () => {
    if (item.hidden) return;

    if (item.type !== 'folder') {
      speakWord(item.audioId || item.id, item.word, item.pronounce).catch(() => {});
    }

    if (onItemClick) {
      onItemClick(item);
    }

    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(item.type === 'folder' ? [30, 30] : 50);
    }
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // only left click / primary touch
    setIsPressed(true);
    setPressCount((n) => n + 1); // remount the animated img -> replay from frame 0
    pointerDownTime.current = Date.now();
    triggerAction();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    // If pointerdown triggered the action recently, ignore the subsequent click
    if (Date.now() - pointerDownTime.current < 800) {
      return;
    }
    triggerAction();
  };

  const isFolder = item.type === 'folder';
  const isHidden = item.hidden;

  return (
    <button
      className={`word-card ${isFolder ? 'folder-card' : ''} ${isHidden ? 'hidden-card' : ''} ${isPressed ? 'pressed' : ''}`}
      style={{ '--card-color': item.color }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      aria-label={item.word}
      disabled={isHidden}
      aria-hidden={isHidden}
    >
      {!isHidden && (
        <>
          <span className="word-icon" aria-hidden="true">
            {isFolder && <span className="folder-indicator">📁</span>}
            {imageUrl ? (
              // key by pressCount so each press replays the animated WebP from frame 0;
              // the static PNG is the animation's first frame, so the swap is seamless.
              <img
                key={showAnimation ? `anim-${pressCount}` : 'static'}
                src={showAnimation ? animationUrl : imageUrl}
                alt=""
                className="word-card-image"
                draggable={false}
              />
            ) : (
              item.icon
            )}
          </span>
          <span className="word-text">{item.word}</span>
        </>
      )}
    </button>
  );
};

export default WordCard;
