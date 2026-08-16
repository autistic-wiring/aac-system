import React, { useState, useRef } from 'react';
import { speakWord } from '../utils/speechAdapter';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

const GoTalkCard = ({ item }) => {
  const [isPressed, setIsPressed] = useState(false);
  const pointerDownTime = useRef(0);
  const imageUrl = resolveAsset(item.image);

  const triggerAction = () => {
    speakWord(item.audioId || item.id, item.word, item.pronounce).catch(() => {});
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    setIsPressed(true);
    pointerDownTime.current = Date.now();
    triggerAction();
  };

  const handleRelease = () => setIsPressed(false);

  const handleClick = () => {
    if (Date.now() - pointerDownTime.current < 800) {
      return;
    }
    triggerAction();
  };

  return (
    <button
      className={`gotalk-card ${item.bakedLabel ? 'baked-label' : ''} ${isPressed ? 'pressed' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onPointerLeave={handleRelease}
      onClick={handleClick}
      aria-label={item.word}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="gotalk-card-image" draggable={false} />
      ) : (
        <span className="gotalk-card-icon" aria-hidden="true">{item.icon}</span>
      )}
      {!item.bakedLabel && <span className="gotalk-card-text">{item.word}</span>}
    </button>
  );
};

export default GoTalkCard;
