import React, { useState, useRef, useEffect } from 'react';
import { speakWord } from '../utils/speechAdapter';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

// Shared across all card instances: timestamp of the most recent pointerdown
// on ANY card. After a tap navigates to a new page, the browser may dispatch
// the tap's trailing `click` to the card now under the finger (a freshly
// mounted element whose own pointerDownTime is 0, so the per-card guard
// passes). That ghost click must be ignored — but a genuine fast tap on
// another card carries its own recent pointerdown, so it still goes through.
let lastAnyPointerDownAt = 0;

const WordCard = ({ item, onItemClick, silent = false }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const pointerDownTime = useRef(0);
  const pressStartRef = useRef(0);
  const endTimerRef = useRef(null);

  const imageUrl = resolveAsset(item.image);
  const animationUrl = resolveAsset(item.animation);
  // One full animation cycle in ms. Needed because <img> (APNG/WebP) has no
  // `ended` event, so we time the cycle ourselves to revert to the static image
  // after a tap. Falls back to 4s if a future entry omits the duration.
  const animMs = animationUrl
    ? Math.round((item.animationDuration ?? 4) * 1000)
    : 0;
  // Decoupled from isPressed: a quick tap mounts/unmounts the element in ~100ms,
  // so the user never sees it. Keep it mounted until it finishes its cycle
  // (looping while held, finishing once on release).
  // Animations are disabled in production builds (static image only).
  const showAnimation = !import.meta.env.PROD && animating && animationUrl;

  useEffect(() => () => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
  }, []);

  const triggerAction = () => {
    if (item.hidden) return;

    // WordCard itself stays silent in Express mode: App.handleItemClick
    // speaks the word immediately and queues it. Folders never speak.
    if (!silent && item.type !== 'folder') {
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
    lastAnyPointerDownAt = pointerDownTime.current;
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
    const now = Date.now();
    // If pointerdown triggered the action recently, ignore the subsequent click
    if (now - pointerDownTime.current < 800) {
      return;
    }
    // Ghost click after a navigation: another card handled this tap's
    // pointerdown moments ago (this card just mounted under the finger).
    // A genuine tap always has its own recent pointerdown, so it passes.
    if (now - lastAnyPointerDownAt < 800) {
      return;
    }
    triggerAction();
  };

  const isFolder = item.type === 'folder';
  const isHidden = item.hidden;
  const isDark = item.color === '#000000' || item.color === 'black';

  return (
    <button
      className={`word-card ${isFolder ? 'folder-card' : ''} ${isHidden ? 'hidden-card' : ''} ${isPressed ? 'pressed' : ''} ${isDark ? 'dark-card' : ''}`}
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
            {showAnimation ? (
              // Transparent looping animation (APNG/WebP). key changes each
              // press -> React remounts the <img> -> plays from frame 0.
              // The .word-icon ancestor's drop-shadow filter does NOT freeze
              // playback (verified via headless-Chrome CDP pixel-delta test).
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
