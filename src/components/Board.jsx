import React, { useEffect, useRef, useState } from 'react';
import WordCard from './WordCard';

const GAP = 12;
// Penalty per empty slot in the last row. Strong enough that a perfect fill
// wins over a slightly-squarest layout with gaps (e.g. 10 items → 5x2 not 4x3
// with 2 empty), but small enough that prime counts (7/11/13) still pick a
// near-square grid instead of forcing 1 or N columns.
const EMPTY_SLOT_PENALTY = 200;

// Cap card size relative to the available space so cards never become
// absurdly large on big resolutions, but never smaller than a usable AAC
// tap target. Math is per-axis on the container, scaled to square-ish cells.
const capFor = (minDim) =>
  Math.max(180, Math.min(560, Math.round(minDim * 0.5)));

const Board = ({ vocabulary, onItemClick }) => {
  const visibleItems = vocabulary.filter(item => !item.hidden);
  const containerRef = useRef(null);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const count = visibleItems.length;

  // Dynamic best-fit layout:
  //  - picks the column count that yields the squarest cards for the
  //    current container size and item count,
  //  - enforces a per-resolution max card size (adds columns when cards
  //    would exceed it),
  //  - prefers layouts with no empty trailing slots,
  //  - re-runs on container resize and on card add/remove, so the grid
  //    always reflows to best fit.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || count === 0) return;

    const compute = () => {
      const { width: W, height: H } = el.getBoundingClientRect();
      if (W <= 0 || H <= 0) return;
      const cap = capFor(Math.min(W, H));
      let best = 1;
      let bestScore = Infinity;
      for (let C = 1; C <= count; C++) {
        const R = Math.ceil(count / C);
        const cardW = (W - (C - 1) * GAP) / C;
        const cardH = (H - (R - 1) * GAP) / R;
        // Mirror the old square-fit, but penalize oversized cards so the
        // chosen layout scales cards up to (but never past) the cap.
        const squareErr = Math.abs(cardW - cardH);
        const oversize = Math.max(cardW - cap, cardH - cap, 0);
        // Penalize every empty slot in the trailing row so perfect fills
        // win when shapes are comparable. (C - count%C) % C → 0 when full.
        const emptySlots = (C - (count % C)) % C;
        const score = squareErr + oversize * 10000 + emptySlots * EMPTY_SLOT_PENALTY;
        if (score < bestScore) {
          bestScore = score;
          best = C;
        }
      }
      setCols(best);
      setRows(Math.ceil(count / best));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);

  return (
    <div className="board-container">
      <div
        className="board-grid"
        ref={containerRef}
        style={{
          '--cols': cols || count,
          '--rows': rows || Math.ceil(count / (cols || count)),
        }}
      >
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
