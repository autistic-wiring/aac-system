import React, { useState, useRef } from 'react';
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
    setPressCount((n) => n + 1); // remount video -> replay from frame 0
    pointerDownTime.current = Date.now();
    triggerAction();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  // Stop animation when pointer leaves (touch drags off, mouse moves away).
  // Only fires for mouse; touch with `pointerleave` won't fire during a
  // stationary press per the Pointer Events spec.
  const handlePointerLeave = () => {
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
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      aria-label={item.word}
      disabled={isHidden}
      aria-hidden={isHidden}
    >
      {!isHidden && (
        <>
          <span className="word-icon" aria-hidden="true">
            {isFolder && <span className="folder-indicator">📁</span>}
            {showAnimation ? (
              // key changes each press -> React remounts the <video> ->
              // autoPlay starts from frame 0. muted + playsInline required
              // for autoPlay on mobile browsers.
              <video
                key={`vid-${pressCount}`}
                src={animationUrl}
                autoPlay
                muted
                loop
                playsInline
                className="word-card-video"
              />
            ) : imageUrl ? (
              <img src={imageUrl} alt="" className="word-card-image" draggable={false} />
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
