import React from 'react';
import WordCard from './WordCard';

// Fixed GoTalk-style 3x3 grid on every page. Pages with fewer than 9 cards
// are padded with blank slots so button positions stay stable for motor
// planning regardless of device size or orientation.
const CELLS = 9;
const COLS = 3;
const ROWS = 3;

const Board = ({ vocabulary, onItemClick, silent = false }) => {
  const visibleItems = vocabulary.filter(item => !item.hidden);
  const cells = [...visibleItems];
  while (cells.length < CELLS) {
    cells.push({ id: `__pad_${cells.length}`, type: 'empty' });
  }

  return (
    <div className="board-container">
      <div
        className="board-grid"
        style={{
          '--cols': COLS,
          '--rows': ROWS,
        }}
      >
        {cells.map((item) =>
          item.type === 'empty' ? (
            <div key={item.id} className="empty-slot" aria-hidden="true" />
          ) : (
            <WordCard
              key={item.id}
              item={item}
              onItemClick={onItemClick}
              silent={silent}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Board;
