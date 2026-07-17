import React, { useState, useRef } from 'react';
import { speakWord } from '../utils/speechAdapter';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

const WordCard = ({ item, onItemClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const pointerDownTime = useRef(0);
  const isPressedRef = useRef(false);

  const imageUrl = resolveAsset(item.image);
  const animationUrl = resolveAsset(item.animation);
  // Decoupled from isPressed: a quick tap mounts/unmounts <video> in ~100ms,
  // so the user never sees it. Keep the video mounted until it finishes its
  // cycle (looping while held, ending once on release).
  const showAnimation = animating && animationUrl;

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
    isPressedRef.current = true;
    setPressCount((n) => n + 1); // remount video -> replay from frame 0
    setAnimating(true);
    pointerDownTime.current = Date.now();
    triggerAction();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    isPressedRef.current = false;
  };

  // Stop animation when pointer leaves (touch drags off, mouse moves away).
  // Only fires for mouse; touch with `pointerleave` won't fire during a
  // stationary press per the Pointer Events spec.
  const handlePointerLeave = () => {
    setIsPressed(false);
    isPressedRef.current = false;
  };

  // When the current playback cycle ends: keep looping only while held.
  // Once released, let it finish this cycle (handled by loop=false) then hide.
  const handleVideoEnded = () => {
    if (!isPressedRef.current) setAnimating(false);
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
              // for autoPlay on mobile browsers. loop only while held so a
              // tap plays exactly one cycle then reverts to the static image.
              <video
                key={`vid-${pressCount}`}
                src={animationUrl}
                autoPlay
                muted
                loop={isPressed}
                playsInline
                onEnded={handleVideoEnded}
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
