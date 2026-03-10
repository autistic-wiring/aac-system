import React from 'react';
import { speakWord } from '../utils/speechAdapter';

const WordCard = ({ item, onItemClick }) => {
  const handleClick = () => {
    if (item.hidden) return;
    
    if (item.type !== 'folder') {
      speakWord(item.id, item.word, item.pronounce).catch(() => {});
    }
    
    if (onItemClick) {
      onItemClick(item);
    }
    
    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(item.type === 'folder' ? [30, 30] : 50);
    }
  };

  const isFolder = item.type === 'folder';
  const isHidden = item.hidden;

  return (
    <button 
      className={`word-card ${isFolder ? 'folder-card' : ''} ${isHidden ? 'hidden-card' : ''}`} 
      style={{ '--card-color': item.color }} 
      onClick={handleClick}
      aria-label={item.word}
      disabled={isHidden}
      aria-hidden={isHidden}
    >
      {!isHidden && (
        <>
          <span className="word-icon" aria-hidden="true">
            {isFolder && <span className="folder-indicator">📁</span>}
            {item.icon}
          </span>
          <span className="word-text">{item.word}</span>
        </>
      )}
    </button>
  );
};

export default WordCard;
