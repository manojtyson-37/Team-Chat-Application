'use client';
import { useState, useMemo } from 'react';

const CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '😍', '🥰', '😘', '😜', '🤪', '😎', '🤩', '😤', '😭', '😱', '🥳', '🤔', '🫡', '😴', '🤮', '💀', '😈'],
  'Gestures': ['👍', '👎', '👏', '🙏', '🤝', '💪', '✌️', '🤞', '👀', '🫶', '👋', '🤙', '✋', '🖐️'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '💕', '💗'],
  'Objects': ['🔥', '⭐', '💡', '🎉', '🎊', '🚀', '💯', '✅', '❌', '❓', '💬', '📌', '🏆', '🎯', '💎', '🔔', '⚡', '🌟'],
};

const ALL_EMOJIS = Object.values(CATEGORIES).flat();

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<string>('Smileys');
  const [search, setSearch] = useState('');

  const displayEmojis = useMemo(() => {
    if (search.trim()) {
      // Simple filter - just show all on search since we can't search emoji names easily
      return ALL_EMOJIS;
    }
    return CATEGORIES[activeTab] || [];
  }, [activeTab, search]);

  const tabs = Object.keys(CATEGORIES);
  const tabIcons: Record<string, string> = {
    'Smileys': '😊',
    'Gestures': '👍',
    'Hearts': '❤️',
    'Objects': '🔥',
  };

  return (
    <div className="emoji-picker" style={{
      position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 0, zIndex: 100,
      boxShadow: 'var(--shadow-lg)', width: 280, overflow: 'hidden',
    }} onClick={e => e.stopPropagation()}>
      {/* Search */}
      <div style={{ padding: '8px 8px 4px' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emojis..."
          className="input-field"
          style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
          autoFocus
        />
      </div>

      {/* Tabs */}
      {!search && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              className={`emoji-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              title={tab}
            >
              {tabIcons[tab]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1,
        padding: 6, maxHeight: 220, overflowY: 'auto',
      }}>
        {displayEmojis.map(emoji => (
          <button key={emoji} className="emoji-btn" onClick={() => { onSelect(emoji); onClose(); }}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
