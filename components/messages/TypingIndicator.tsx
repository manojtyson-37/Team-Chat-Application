'use client';
import type { TypingUser } from '@/lib/types';

export default function TypingIndicator({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return <div className="typing-indicator" style={{ height: 24, padding: '0 24px' }} />;

  const names = users.map(u => u.username).join(', ');
  return (
    <div className="typing-indicator" style={{
      height: 24, padding: '0 24px', display: 'flex', alignItems: 'center',
      gap: 8, color: 'var(--text-muted)', fontSize: 12,
    }}>
      <span style={{ display: 'flex', gap: 2 }}>
        <span className="typing-dot" style={{ animationDelay: '0s' }}>.</span>
        <span className="typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
      </span>
      <span>{names} {users.length === 1 ? 'is' : 'are'} typing</span>
    </div>
  );
}
