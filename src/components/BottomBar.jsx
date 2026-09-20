import React, { useState } from 'react';

// GoTalk-style bottom navigation bar (mirrors the GoTalk NOW app):
// white-circle prev/next chevrons, yellow-circle home/back/pages buttons,
// and a raised center tab showing the current page title. The pages button
// opens a Page Select dialog to jump straight to any page.
const BottomBar = ({ pages, currentId, onHome, onBack, onPrev, onNext, onSelect }) => {
  const [selectOpen, setSelectOpen] = useState(false);
  const [pending, setPending] = useState(currentId);
  const current = pages.find((p) => p.id === currentId);

  const openSelect = () => {
    setPending(currentId);
    setSelectOpen(true);
  };

  const confirmSelect = () => {
    setSelectOpen(false);
    onSelect(pending);
  };

  return (
    <>
      {selectOpen && (
        <div className="page-select-overlay" onPointerDown={() => setSelectOpen(false)}>
          <div
            className="page-select-dialog"
            role="dialog"
            aria-label="Page Select"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <h2>Page Select</h2>
            <ul>
              {pages.map((p) => (
                <li key={p.id}>
                  <button
                    className={p.id === pending ? 'selected' : ''}
                    onClick={() => setPending(p.id)}
                  >
                    {p.title}
                  </button>
                </li>
              ))}
            </ul>
            <div className="page-select-actions">
              <button className="ps-cancel" aria-label="Cancel" onClick={() => setSelectOpen(false)}>
                ✕
              </button>
              <button className="ps-ok" onClick={confirmSelect}>
                OK ✓
              </button>
            </div>
          </div>
        </div>
      )}
      <footer className="gotalk-bottombar">
        <button className="bb-btn bb-white" aria-label="Previous page" onClick={onPrev}>
          <span aria-hidden="true">‹</span>
        </button>
        <button className="bb-btn bb-yellow" aria-label="Home" onClick={onHome}>
          <span aria-hidden="true">⌂</span>
        </button>
        <button className="bb-btn bb-yellow" aria-label="Back" onClick={onBack}>
          <span aria-hidden="true">↩</span>
        </button>
        <div className="bb-title" aria-live="polite">{current?.title || ''}</div>
        <button className="bb-btn bb-yellow" aria-label="Select page" onClick={openSelect}>
          <span aria-hidden="true">❐</span>
        </button>
        <button className="bb-btn bb-white" aria-label="Next page" onClick={onNext}>
          <span aria-hidden="true">›</span>
        </button>
      </footer>
    </>
  );
};

export default BottomBar;
