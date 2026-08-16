import React from 'react';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const resolveAsset = (p) => (p ? `${baseUrl}/${p.replace(/^\//, '')}` : null);

const GoTalkHome = ({ pages, onSelect }) => (
  <div className="gotalk-home">
    {pages.map((page) => (
      <button
        key={page.id}
        className="gotalk-launcher-card"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          onSelect(page.id);
        }}
        aria-label={`Open ${page.title} page`}
      >
        {page.thumb ? (
          <img src={resolveAsset(page.thumb)} alt="" className="gotalk-launcher-thumb" draggable={false} />
        ) : (
          <span className="gotalk-launcher-icon" aria-hidden="true">{page.icon}</span>
        )}
        <span className="gotalk-launcher-title">{page.title}</span>
      </button>
    ))}
  </div>
);

export default GoTalkHome;
