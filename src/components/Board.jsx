import React from 'react';
import WordCard from './WordCard';

const Board = ({ vocabulary, onItemClick }) => {
  // Separate Yes/No for the bottom bar if they exist in the current vocabulary
  const mainItems = vocabulary.filter(item => item.id !== 'yes' && item.id !== 'no');
  const bottomBarItems = vocabulary.filter(item => item.id === 'yes' || item.id === 'no');

  const visibleCount = mainItems.filter(item => !item.hidden).length;
  const cols = Math.max(3, Math.ceil(visibleCount / 3));

  return (
    <div className="board-container">
      <div className="board-grid" style={{ '--grid-cols': cols }}>
        {mainItems.map((item) => (
          <WordCard
            key={item.id}
            item={item}
            onItemClick={onItemClick}
          />
        ))}
      </div>
      
      {bottomBarItems.length > 0 && (
        <div className="bottom-bar">
          {bottomBarItems.map((item) => (
            <WordCard
              key={item.id}
              item={item}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Board;
