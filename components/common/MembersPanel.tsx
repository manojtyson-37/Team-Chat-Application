'use client';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import Avatar from './Avatar';

interface Props {
  channelId: number;
  channelName: string;
  currentUserId: number;
  onClose: () => void;
  onProfileClick?: (username: string) => void;
}

function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen + 'Z').getTime() < 30000;
}

export default function MembersPanel({ channelId, channelName, currentUserId, onClose, onProfileClick }: Props) {
  const [members, setMembers] = useState<User[]>([]);
  const [nonMembers, setNonMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setNonMembers(data.nonMembers);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = async (userId: number) => {
    await fetch(`/api/channels/${channelId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await fetchMembers();
  };

  const handleRemove = async (userId: number) => {
    await fetch(`/api/channels/${channelId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await fetchMembers();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="modal-header" style={{ marginBottom: 2 }}>Channel Members</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>#{channelName}</div>
          </div>
          <button className="action-btn" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <span className="spinner" />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Current Members */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Members ({members.length})
            </div>

            {members.map(u => {
              const online = isOnline(u.last_seen_at);
              return (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => onProfileClick?.(u.username)}>
                    <Avatar username={u.username} color={u.avatar_color} size={32} profilePictureUrl={u.profile_picture_url} />
                    <div className={`avatar-status-dot ${online ? 'online' : 'offline'}`}
                      style={{ width: 10, height: 10, borderWidth: 2 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {u.username}
                      {u.id === currentUserId && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(you)</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: online ? '#22c55e' : 'var(--text-muted)' }}>
                      {online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  {u.id !== currentUserId && (
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11, color: 'var(--danger)' }}
                      onClick={() => handleRemove(u.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Members Section */}
            <div style={{ marginTop: 20 }}>
              <button
                className="btn-secondary"
                style={{ width: '100%', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setShowAdd(!showAdd)}
              >
                <span style={{ fontSize: 16 }}>+</span>
                Add Members
              </button>

              {showAdd && nonMembers.length > 0 && (
                <div style={{ marginTop: 8, animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    Available Users ({nonMembers.length})
                  </div>
                  {nonMembers.map(u => (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <Avatar username={u.username} color={u.avatar_color} size={32} profilePictureUrl={u.profile_picture_url} />
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {u.username}
                      </div>
                      <button
                        className="btn-primary"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                        onClick={() => handleAdd(u.id)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showAdd && nonMembers.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
                  All users are already members of this channel
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
