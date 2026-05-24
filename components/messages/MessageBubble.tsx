'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { Message, Reaction } from '@/lib/types';
import Avatar from '@/components/common/Avatar';
import EmojiPicker from './EmojiPicker';

interface Props {
  message: Message;
  isOwn: boolean;
  showAuthor: boolean;
  onReact: (messageId: number, emoji: string) => void;
  onOpenThread: (message: Message) => void;
  onEdit?: (messageId: number, content: string) => void;
  onDelete?: (messageId: number) => void;
  onImageClick?: (src: string) => void;
  onPin?: (messageId: number) => void;
  onProfileClick?: (username: string) => void;
}

// Detect URLs in text and render as links
function renderContent(text: string) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0; // Reset regex state
      const display = part.length > 50 ? part.slice(0, 47) + '...' : part;
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent-hover)', textDecoration: 'underline' }}
          onClick={e => e.stopPropagation()}>
          {display}
        </a>
      );
    }
    // Bold text with **text**
    const boldParts = part.split(/\*\*(.+?)\*\*/g);
    if (boldParts.length > 1) {
      return boldParts.map((bp, j) =>
        j % 2 === 1 ? <strong key={`${i}-${j}`}>{bp}</strong> : bp
      );
    }
    return part;
  });
}

export default function MessageBubble({ message, isOwn, showAuthor, onReact, onOpenThread, onEdit, onDelete, onImageClick, onPin, onProfileClick }: Props) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const handleReaction = (emoji: string) => {
    onReact(message.id, emoji);
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText.trim() !== message.content) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  };

  const handleTouchStart = () => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    setTouched(true);
    // Auto-hide toolbar after 3 seconds if user doesn't interact
    touchTimeoutRef.current = setTimeout(() => setTouched(false), 3000);
  };

  const handleTouchEnd = () => {
    // Don't immediately hide on touch end, let the timeout handle it
  };

  const renderedContent = useMemo(() => renderContent(message.content), [message.content]);

  return (
    <>
      <div
        className="message-row"
        style={{
          display: 'flex', gap: 10, padding: '2px 24px',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          marginTop: showAuthor ? 12 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowEmoji(false); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {showAuthor && !isOwn ? (
          <div style={{ cursor: 'pointer' }} onClick={() => onProfileClick?.(message.username)}>
            <Avatar username={message.username} color={message.avatar_color || '#6366f1'} size={34} profilePictureUrl={message.profile_picture_url} />
          </div>
        ) : (
          <div style={{ width: 34, flexShrink: 0 }} />
        )}

        <div style={{ maxWidth: '65%', position: 'relative' }}>
          {showAuthor && !isOwn && (
            <div
              style={{
                fontSize: 12, fontWeight: 600, color: message.avatar_color || 'var(--accent)',
                marginBottom: 2, marginLeft: 2, cursor: 'pointer',
              }}
              onClick={() => onProfileClick?.(message.username)}
            >
              {message.username}
            </div>
          )}

          <div style={{
            background: isOwn ? 'var(--bubble-own)' : 'var(--bubble-other)',
            color: 'var(--text-primary)',
            padding: '8px 14px',
            borderRadius: 16,
            ...(isOwn
              ? { borderBottomRightRadius: showAuthor ? 4 : 16 }
              : { borderBottomLeftRadius: showAuthor ? 4 : 16, border: '1px solid var(--border)' }
            ),
            fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const,
            position: 'relative' as const,
            transition: 'box-shadow 150ms ease',
            ...(hovered ? { boxShadow: 'var(--shadow-sm)' } : {}),
          }}>
            {/* Media */}
            {message.media_url && (
              <div style={{ marginBottom: message.content ? 8 : 0 }}>
                {message.media_type === 'video' ? (
                  <video src={message.media_url} controls
                    style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 300 }} />
                ) : (
                  <img src={message.media_url} alt=""
                    style={{
                      maxWidth: '100%', borderRadius: 8, maxHeight: 300, cursor: 'pointer',
                      transition: 'transform 150ms ease',
                    }}
                    onClick={() => onImageClick?.(message.media_url!)}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                )}
              </div>
            )}

            {/* Content */}
            {editing ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setEditing(false); }}
                  autoFocus
                  className="input-field"
                  style={{ flex: 1, padding: '4px 8px', fontSize: 14 }}
                />
                <button onClick={handleEditSubmit} className="action-btn" style={{ color: 'var(--success)' }}>✓</button>
                <button onClick={() => setEditing(false)} className="action-btn" style={{ color: 'var(--danger)' }}>✕</button>
              </div>
            ) : (
              renderedContent
            )}

            {/* Pinned indicator */}
            {message.pinned_at && (
              <span className="pinned-indicator" style={{ display: 'block', marginTop: 4 }}>
                📌 Pinned
              </span>
            )}

            {/* Action Toolbar */}
            {(hovered || touched) && !editing && (
              <div className="action-toolbar" style={{
                position: 'absolute', top: -32, ...(isOwn ? { left: 0 } : { right: 0 }),
                display: 'flex', gap: 1, background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 8, padding: 2,
                boxShadow: 'var(--shadow-md)',
                animation: 'fadeIn 0.15s ease',
              }}>
                <button onClick={() => setShowEmoji(!showEmoji)} className="action-btn" title="React">
                  😊
                </button>
                <button onClick={() => onOpenThread(message)} className="action-btn" title="Reply in thread">
                  💬
                </button>
                {onPin && (
                  <button onClick={() => onPin(message.id)} className="action-btn" title={message.pinned_at ? 'Unpin' : 'Pin'}>
                    📌
                  </button>
                )}
                {isOwn && (
                  <>
                    <button onClick={() => { setEditText(message.content); setEditing(true); }} className="action-btn" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="action-btn" title="Delete">
                      🗑️
                    </button>
                  </>
                )}
              </div>
            )}

            {showEmoji && (
              <EmojiPicker onSelect={handleReaction} onClose={() => setShowEmoji(false)} />
            )}
          </div>

          {/* Reactions */}
          {(message.reactions?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, marginLeft: 2 }}>
              {message.reactions!.map((r: Reaction) => (
                <button key={r.emoji} onClick={() => handleReaction(r.emoji)}
                  className={`reaction-pill ${r.reacted ? 'reacted' : ''}`}>
                  <span>{r.emoji}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timestamp + Thread */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, marginLeft: 2,
            ...(isOwn ? { justifyContent: 'flex-end' } : {}),
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {new Date(message.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {message.edited_at && (
                <span style={{ marginLeft: 4, fontStyle: 'italic' }} title={`Edited ${new Date(message.edited_at + 'Z').toLocaleString()}`}>
                  (edited)
                </span>
              )}
            </span>
            {(message.reply_count ?? 0) > 0 && (
              <button onClick={() => onOpenThread(message)} style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                fontSize: 11, cursor: 'pointer', padding: 0,
                transition: 'color 150ms ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
              >
                {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Delete Message</div>
            <div className="modal-body">Are you sure you want to delete this message? This action cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => { onDelete?.(message.id); setShowDeleteConfirm(false); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
