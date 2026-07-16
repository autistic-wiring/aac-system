import React from 'react';
import WordCard from './WordCard';

const Board = ({ vocabulary, onItemClick }) => {
  const visibleItems = vocabulary.filter(item => !item.hidden);

  return (
    <div className="board-container">
      <div className="board-grid">
        {visibleItems.map((item) => (
          <WordCard
            key={item.id}
            item={item}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
