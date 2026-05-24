'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '@/lib/types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface Props {
  parentMessage: Message;
  currentUsername: string;
  onClose: () => void;
  onReact: (messageId: number, emoji: string) => void;
  onImageClick?: (src: string) => void;
}

export default function ThreadPanel({ parentMessage, currentUsername, onClose, onReact, onImageClick }: Props) {
  const [replies, setReplies] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchReplies = useCallback(async () => {
    const res = await fetch(`/api/messages/${parentMessage.id}/thread`);
    if (res.ok) setReplies(await res.json());
  }, [parentMessage.id]);

  useEffect(() => {
    fetchReplies();
    const interval = setInterval(fetchReplies, 2000);
    return () => clearInterval(interval);
  }, [fetchReplies]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSend = async (content: string, mediaUrl?: string, mediaType?: string) => {
    await fetch(`/api/channels/${parentMessage.channel_id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId: parentMessage.id, mediaUrl, mediaType }),
    });
    await fetchReplies();
  };

  const handleTyping = () => {
    fetch(`/api/channels/${parentMessage.channel_id}/typing`, { method: 'POST' });
  };

  // Truncate parent message for header
  const parentSnippet = parentMessage.content.length > 60
    ? parentMessage.content.slice(0, 57) + '...'
    : parentMessage.content;

  return (
    <div className="thread-panel" style={{
      width: 'var(--thread-width)', borderLeft: '1px solid var(--border)',
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        background: 'var(--bg-secondary)', gap: 8,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            Thread
            {replies.length > 0 && (
              <span className="badge" style={{ fontSize: 10, padding: '0 6px', animation: 'none' }}>
                {replies.length}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {parentSnippet || '(media)'}
          </div>
        </div>
        <button onClick={onClose} className="action-btn" style={{ fontSize: 18, padding: '0 4px', flexShrink: 0 }}>
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8 }}>
        <div style={{ opacity: 0.7, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
          <MessageBubble
            message={parentMessage}
            isOwn={parentMessage.username === currentUsername}
            showAuthor={true}
            onReact={onReact}
            onOpenThread={() => {}}
            onImageClick={onImageClick}
          />
        </div>

        {replies.length > 0 && (
          <div className="date-separator" style={{ padding: '8px 16px' }}>
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </div>
        )}

        {replies.map((msg, i) => {
          const prev = replies[i - 1];
          const showAuthor = !prev || prev.username !== msg.username;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.username === currentUsername}
              showAuthor={showAuthor}
              onReact={onReact}
              onOpenThread={() => {}}
              onImageClick={onImageClick}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        channelId={parentMessage.channel_id}
        parentId={parentMessage.id}
        onSend={handleSend}
        onTyping={handleTyping}
        placeholder="Reply in thread..."
      />
    </div>
  );
}
