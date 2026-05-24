'use client';
import { useState } from 'react';
import type { Channel, User } from '@/lib/types';
import Avatar from '@/components/common/Avatar';

interface Props {
  channels: Channel[];
  activeChannelId: number;
  onSelectChannel: (id: number) => void;
  onCreateChannel: (name: string) => void;
  onStartDm: (userId: number) => void;
  currentUser: User;
  users: User[];
  unreadCounts: Record<number, number>;
  onLogout: () => void;
  onProfileClick?: (username: string) => void;
}

export default function Sidebar({
  channels, activeChannelId, onSelectChannel, onCreateChannel,
  onStartDm, currentUser, users, unreadCounts, onLogout, onProfileClick,
}: Props) {
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newName, setNewName] = useState('');
  const [showDmPicker, setShowDmPicker] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  const regularChannels = channels.filter(c => !c.is_dm);
  const dmChannels = channels.filter(c => c.is_dm);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) { onCreateChannel(newName.trim()); setNewName(''); setShowNewChannel(false); }
  };

  return (
    <div style={{
      width: 'var(--sidebar-width)', background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 16px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700,
        }}>
          T
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
          Team Chat
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* Channels Section */}
        <div style={{ padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="section-toggle" onClick={() => setChannelsOpen(!channelsOpen)}>
            <span className={`section-chevron ${channelsOpen ? 'open' : ''}`}>▸</span>
            Channels
          </button>
          <button onClick={() => setShowNewChannel(!showNewChannel)} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
            transition: 'color 150ms ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >+</button>
        </div>

        {showNewChannel && (
          <form onSubmit={handleCreate} style={{ padding: '4px 12px 8px', animation: 'fadeIn 0.2s ease' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="channel-name" autoFocus className="input-field"
              style={{ width: '100%', padding: '6px 10px', fontSize: 13 }} />
          </form>
        )}

        <div className={`section-content ${channelsOpen ? '' : 'collapsed'}`}
          style={{ maxHeight: channelsOpen ? `${regularChannels.length * 40 + 10}px` : 0 }}>
          {regularChannels.map(ch => (
            <ChannelRow key={ch.id} name={`# ${ch.name}`} active={ch.id === activeChannelId}
              unread={unreadCounts[ch.id] || 0} onClick={() => onSelectChannel(ch.id)} />
          ))}
        </div>

        {/* DMs Section */}
        <div style={{ padding: '16px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="section-toggle" onClick={() => setDmsOpen(!dmsOpen)}>
            <span className={`section-chevron ${dmsOpen ? 'open' : ''}`}>▸</span>
            Direct Messages
          </button>
          <button onClick={() => setShowDmPicker(!showDmPicker)} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
            transition: 'color 150ms ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >+</button>
        </div>

        {showDmPicker && (
          <div style={{ padding: '4px 12px 8px', animation: 'fadeIn 0.2s ease' }}>
            {users.filter(u => u.id !== currentUser.id).map(u => {
              const online = isOnline(u.last_seen_at);
              return (
                <button key={u.id} onClick={() => { onStartDm(u.id); setShowDmPicker(false); }}
                  className="channel-row"
                  style={{ padding: '6px 10px', gap: 8, borderLeft: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar username={u.username} color={u.avatar_color} size={24} profilePictureUrl={u.profile_picture_url} />
                      <div className={`avatar-status-dot ${online ? 'online' : 'offline'}`}
                        style={{ width: 8, height: 8, borderWidth: 1.5 }} />
                    </div>
                    {u.username}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className={`section-content ${dmsOpen ? '' : 'collapsed'}`}
          style={{ maxHeight: dmsOpen ? `${dmChannels.length * 40 + 10}px` : 0 }}>
          {dmChannels.map(ch => {
            const match = ch.name.match(/^dm-(\d+)-(\d+)$/);
            let dmName = ch.name;
            let dmUser: User | undefined;
            if (match) {
              const otherId = Number(match[1]) === currentUser.id ? Number(match[2]) : Number(match[1]);
              dmUser = users.find(u => u.id === otherId);
              dmName = dmUser?.username || ch.name;
            }
            return (
              <ChannelRow key={ch.id} name={dmName} active={ch.id === activeChannelId}
                unread={unreadCounts[ch.id] || 0} onClick={() => onSelectChannel(ch.id)} isDm
                user={dmUser} />
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', transition: 'background 150ms ease',
      }}
        onClick={() => onProfileClick?.(currentUser.username)}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ position: 'relative' }}>
          <Avatar username={currentUser.username} color={currentUser.avatar_color} size={32} profilePictureUrl={currentUser.profile_picture_url} />
          <div className="avatar-status-dot online" style={{ width: 10, height: 10, borderWidth: 2 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser.username}
          </div>
          <div style={{ fontSize: 11, color: '#22c55e' }}>Online</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: 11 }}>
          Logout
        </button>
      </div>
    </div>
  );
}

function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen + 'Z').getTime() < 30000;
}

function ChannelRow({ name, active, unread, onClick, isDm, user }: {
  name: string; active: boolean; unread: number; onClick: () => void; isDm?: boolean; user?: User;
}) {
  const online = isDm && user ? isOnline(user.last_seen_at) : false;
  return (
    <button onClick={onClick}
      className={`channel-row ${active ? 'active' : ''} ${unread > 0 ? 'unread' : ''}`}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
        {isDm && (
          <span className={`status-dot ${online ? 'online' : 'offline'}`} />
        )}
        {name}
      </span>
      {unread > 0 && <span className="badge">{unread}</span>}
    </button>
  );
}
