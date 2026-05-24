'use client';
import { useRef, useEffect } from 'react';
import type { Message } from '@/lib/types';
import MessageBubble from './MessageBubble';

interface Props {
  messages: Message[];
  currentUsername: string;
  onReact: (messageId: number, emoji: string) => void;
  onOpenThread: (message: Message) => void;
  onEdit?: (messageId: number, content: string) => void;
  onDelete?: (messageId: number) => void;
  onImageClick?: (src: string) => void;
  onPin?: (messageId: number) => void;
  onProfileClick?: (username: string) => void;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr + 'Z');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr + 'Z').toDateString();
}

export default function MessageList({ messages, currentUsername, onReact, onOpenThread, onEdit, onDelete, onImageClick, onPin, onProfileClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (messages.length > prevCountRef.current || prevCountRef.current === 0) {
      if (prevCountRef.current === 0) {
        // Initial load: jump to bottom instantly
        container.scrollTop = container.scrollHeight;
      } else {
        // New messages: smooth scroll to bottom
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  return (
    <div ref={containerRef} style={{
      flex: 1, overflowY: 'auto', paddingTop: 16, paddingBottom: 8,
      display: 'flex', flexDirection: 'column',
      WebkitOverflowScrolling: 'touch' as any,
      overscrollBehavior: 'contain',
    }}>
      {messages.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">No messages yet</div>
          <div className="empty-state-hint">Start the conversation by sending a message below</div>
        </div>
      )}
      {messages.map((msg, i) => {
        const prev = messages[i - 1];
        const showAuthor = !prev || prev.username !== msg.username ||
          (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 60000);
        const isOwn = msg.username === currentUsername;

        // Date separator
        const showDate = !prev || getDateKey(msg.created_at) !== getDateKey(prev.created_at);

        return (
          <div key={msg.id} className={i >= prevCountRef.current - 1 && prevCountRef.current > 0 ? 'message-fade-in' : ''}>
            {showDate && (
              <div className="date-separator">
                {formatDateSeparator(msg.created_at)}
              </div>
            )}
            <MessageBubble
              message={msg}
              isOwn={isOwn}
              showAuthor={showAuthor}
              onReact={onReact}
              onOpenThread={onOpenThread}
              onEdit={onEdit}
              onDelete={onDelete}
              onImageClick={onImageClick}
              onPin={onPin}
              onProfileClick={onProfileClick}
            />
          </div>
        );
      })}
    </div>
  );
}
