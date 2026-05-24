'use client';
import { useEffect } from 'react';

interface Props {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-actions">
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="btn-secondary"
          style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ↓ Download
        </a>
        <button className="btn-secondary" onClick={onClose} style={{ fontSize: 16, padding: '6px 12px' }}>
          ✕
        </button>
      </div>
      <img
        src={src}
        alt=""
        className="lightbox-image"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}
