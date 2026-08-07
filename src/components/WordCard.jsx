import React, { useState, useRef, useEffect } from 'react';
import { speakWord } from '../utils/speechAdapter';
import LottiePlayer from './LottiePlayer';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

const WordCard = ({ item, onItemClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const pointerDownTime = useRef(0);
  const pressStartRef = useRef(0);
  const endTimerRef = useRef(null);

  const imageUrl = resolveAsset(item.image);
  const animationUrl = resolveAsset(item.animation);
  const lottieUrl = resolveAsset(item.lottie || (item.animation?.endsWith('.json') ? item.animation : null));

  // One full animation cycle in ms. Needed because <img> (APNG/WebP) has no
  // `ended` event, so we time the cycle ourselves to revert to the static image
  // after a tap. Falls back to 4s if a future entry omits the duration.
  const animMs = animationUrl
    ? Math.round((item.animationDuration ?? 4) * 1000)
    : 0;
  // Decoupled from isPressed: a quick tap mounts/unmounts the element in ~100ms,
  // so the user never sees it. Keep it mounted until it finishes its cycle
  // (looping while held, finishing once on release).
  const showAnimation = animating && animationUrl;

  useEffect(() => () => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
  }, []);

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

  const clearEndTimer = () => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // only left click / primary touch
    clearEndTimer();
    setIsPressed(true);
    setPressCount((n) => n + 1); // remount <img> -> replay from frame 0
    setAnimating(true);
    pressStartRef.current = Date.now();
    pointerDownTime.current = Date.now();
    triggerAction();
  };

  const handleRelease = () => {
    setIsPressed(false);
    if (!animationUrl) return;
    // Finish the current cycle, then revert to the static image. APNG/WebP
    // have no `ended` event, so time it: remaining = full cycle - current phase.
    const elapsed = Date.now() - pressStartRef.current;
    const remaining = animMs - (elapsed % animMs);
    clearEndTimer();
    endTimerRef.current = setTimeout(() => setAnimating(false), remaining);
  };

  // Stop animation when pointer leaves (touch drags off, mouse moves away).
  // Only fires for mouse; touch with `pointerleave` won't fire during a
  // stationary press per the Pointer Events spec.
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
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onPointerLeave={handleRelease}
      onClick={handleClick}
      aria-label={item.word}
      disabled={isHidden}
      aria-hidden={isHidden}
    >
      {!isHidden && (
        <>
          <span className="word-icon" aria-hidden="true">
            {isFolder && <span className="folder-indicator">📁</span>}
            {lottieUrl ? (
              <LottiePlayer
                src={lottieUrl}
                animating={showAnimation}
                className="word-card-anim"
              />
            ) : showAnimation ? (
              <img
                key={`anim-${pressCount}`}
                src={animationUrl}
                alt=""
                className="word-card-anim"
                draggable={false}
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
