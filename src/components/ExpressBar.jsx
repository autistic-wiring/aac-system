import React from 'react';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

// GoTalk NOW-style Express bar: taps queue thumbnails into a read-only strip
// (~90% of the row); the strip itself is display-only. Controls appear based
// on state — non-empty: rollback (remove last) + clear + read; empty with
// history: restore previous message. Tapping the strip also reads (GoTalk:
// "messages play in sequence when the bar is pressed").
const ExpressBar = ({
  items,
  canRestore,
  isSpeaking,
  onRead,
  onRollback,
  onClear,
  onRestore,
}) => {
  const hasItems = items.length > 0;

  return (
    <div className="express-bar" role="toolbar" aria-label="Express message bar">
      <div
        className={`express-strip${hasItems ? ' has-items' : ''}`}
        aria-live="polite"
        aria-label={hasItems ? `${items.length} message${items.length > 1 ? 's' : ''} queued` : 'Message bar, empty'}
        onClick={hasItems && !isSpeaking ? onRead : undefined}
        title={hasItems ? 'Tap to read aloud' : undefined}
      >
        {hasItems ? (
          items.map((item) => {
            const src = resolveAsset(item.image);
            return (
              <span key={item._q} className="express-thumb" title={item.word}>
                {src ? (
                  <img src={src} alt="" draggable={false} />
                ) : (
                  <span className="express-thumb-emoji" aria-hidden="true">
                    {item.icon || '•'}
                  </span>
                )}
              </span>
            );
          })
        ) : (
          <span className="express-placeholder">Tap pictures to build a message…</span>
        )}
      </div>
      <div className="express-controls">
        {hasItems ? (
          <>
            <button
              className="bb-btn bb-white express-btn"
              aria-label="Remove last"
              title="Remove last"
              onClick={onRollback}
              disabled={isSpeaking}
            >
              <span aria-hidden="true">⌫</span>
            </button>
            <button
              className="bb-btn bb-white express-btn"
              aria-label="Clear all"
              title="Clear all"
              onClick={onClear}
              disabled={isSpeaking}
            >
              <span aria-hidden="true">🗑</span>
            </button>
            <button
              className="bb-btn bb-yellow express-btn express-read"
              aria-label="Read aloud"
              title="Read aloud"
              onClick={onRead}
              disabled={isSpeaking}
            >
              <span aria-hidden="true">{isSpeaking ? '…' : '🔊'}</span>
            </button>
          </>
        ) : (
          canRestore && (
            <button
              className="bb-btn bb-yellow express-btn"
              aria-label="Restore previous message"
              title="Restore previous message"
              onClick={onRestore}
              disabled={isSpeaking}
            >
              <span aria-hidden="true">↺</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ExpressBar;
