import React, { useState, useRef } from 'react';
import { speakWord } from '../utils/speechAdapter';

const WordCard = ({ item, onItemClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  const pointerDownTime = useRef(0);

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
  const imageUrl = item.image ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}` : null;

  return (
    <button 
      className={`word-card ${isFolder ? 'folder-card' : ''} ${isHidden ? 'hidden-card' : ''} ${isPressed ? 'pressed' : ''}`} 
      style={{ '--card-color': item.color }} 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
              <img src={imageUrl} alt="" className="word-card-image" />
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
