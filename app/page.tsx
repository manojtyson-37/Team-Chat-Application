'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext, useAuth, useAuthProvider } from '@/hooks/useAuth';
import type { Message, Channel, User, TypingUser } from '@/lib/types';
import Sidebar from '@/components/sidebar/Sidebar';
import MessageList from '@/components/messages/MessageList';
import MessageInput from '@/components/messages/MessageInput';
import ThreadPanel from '@/components/messages/ThreadPanel';
import TypingIndicator from '@/components/messages/TypingIndicator';
import ImageLightbox from '@/components/messages/ImageLightbox';
import UserProfileModal from '@/components/common/UserProfileModal';
import Avatar from '@/components/common/Avatar';
import { ToastProvider, useToast } from '@/components/common/Toast';
import MembersPanel from '@/components/common/MembersPanel';

function ChatApp() {
  const auth = useAuthProvider();

  if (auth.loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <ToastProvider>
        {auth.user ? <ChatView /> : <AuthRedirect />}
      </ToastProvider>
    </AuthContext.Provider>
  );
}

function AuthRedirect() {
  useEffect(() => { window.location.href = '/login'; }, []);
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="search-highlight">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function ChatView() {
  const auth = useAuth();
  const user = auth.user!;
  const { showToast } = useToast();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChannelId, setActiveChannelId] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<TypingUser[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const lastIdRef = useRef(0);
  const fetchingRef = useRef(false);
  const activeChannelRef = useRef(activeChannelId);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep activeChannelRef in sync
  activeChannelRef.current = activeChannelId;

  // Fetch channels and users on mount
  useEffect(() => {
    fetch('/api/channels').then(r => r.ok ? r.json() : []).then(setChannels);
    fetch('/api/users').then(r => r.ok ? r.json() : []).then(setUsers);
  }, []);

  // Fetch messages for active channel
  const fetchMessages = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const channelAtStart = activeChannelId;
    try {
      const url = lastIdRef.current
        ? `/api/channels/${channelAtStart}/messages?after=${lastIdRef.current}`
        : `/api/channels/${channelAtStart}/messages`;
      const res = await fetch(url);
      if (!res.ok) return;
      // Stale check: if user switched channels while fetch was in-flight, discard
      if (activeChannelRef.current !== channelAtStart) return;
      const data: Message[] = await res.json();
      if (data.length > 0) {
        // Double-check staleness after parsing
        if (activeChannelRef.current !== channelAtStart) return;
        if (lastIdRef.current === 0) {
          setMessages(data);
        } else {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const fresh = data.filter(m => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
        lastIdRef.current = data[data.length - 1].id;

        // Mark as read
        const latest = data[data.length - 1];
        fetch(`/api/channels/${channelAtStart}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: latest.id }),
        });
      }
    } catch {} finally {
      fetchingRef.current = false;
    }
  }, [activeChannelId]);

  // Poll for messages — reset state on channel switch
  useEffect(() => {
    lastIdRef.current = 0;
    fetchingRef.current = false; // Force-reset so new channel fetch isn't blocked
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Poll for typing and unread counts
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/poll?activeChannel=${activeChannelId}`);
        if (!res.ok) return;
        const data = await res.json();
        setTyping(data.typing || []);
        setUnreadCounts(data.unreadCounts || {});
        if (data.channels) setChannels(data.channels);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [activeChannelId]);

  const handleSend = async (content: string, mediaUrl?: string, mediaType?: string) => {
    await fetch(`/api/channels/${activeChannelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mediaUrl, mediaType }),
    });
    await fetchMessages();
  };

  const handleTyping = useCallback(() => {
    fetch(`/api/channels/${activeChannelId}/typing`, { method: 'POST' });
  }, [activeChannelId]);

  const handleReact = async (messageId: number, emoji: string) => {
    const msg = messages.find(m => m.id === messageId);
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.reacted);
    if (existing) {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } else {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    }
    lastIdRef.current = 0;
    fetchingRef.current = false;
    await fetchMessages();
  };

  const handleEdit = async (messageId: number, content: string) => {
    await fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    lastIdRef.current = 0;
    fetchingRef.current = false;
    await fetchMessages();
    showToast('Message edited', 'success');
  };

  const handleDelete = async (messageId: number) => {
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    setMessages(prev => prev.filter(m => m.id !== messageId));
    showToast('Message deleted', 'success');
  };

  const handlePin = async (messageId: number) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg?.pinned_at) {
      await fetch(`/api/messages/${messageId}/pin`, { method: 'DELETE' });
      showToast('Message unpinned', 'info');
    } else {
      await fetch(`/api/messages/${messageId}/pin`, { method: 'POST' });
      showToast('Message pinned', 'success');
    }
    lastIdRef.current = 0;
    fetchingRef.current = false;
    await fetchMessages();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {} finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleCreateChannel = async (name: string) => {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const ch = await res.json();
      setChannels(prev => [...prev, ch]);
      setActiveChannelId(ch.id);
      showToast(`Channel #${ch.name} created`, 'success');
    }
  };

  const handleStartDm = async (userId: number) => {
    const res = await fetch('/api/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const ch = await res.json();
      if (!channels.find(c => c.id === ch.id)) {
        setChannels(prev => [...prev, ch]);
      }
      setActiveChannelId(ch.id);
    }
  };

  const handleSelectChannel = (id: number) => {
    setActiveChannelId(id);
    setThreadMessage(null);
    setShowPins(false);
    setShowMembers(false);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleProfileClick = (username: string) => {
    const u = users.find(usr => usr.username === username);
    if (u) setProfileUser(u);
  };

  const handleProfilePictureUpdate = (updatedUser: User) => {
    // Update users list with new profile picture
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // Update current profile modal
    setProfileUser(updatedUser);
    // If it's the current user, update auth context
    if (updatedUser.id === user.id) {
      auth.setUser(updatedUser);
    }
  };

  const fetchPins = async () => {
    const res = await fetch(`/api/channels/${activeChannelId}/pins`);
    if (res.ok) setPinnedMessages(await res.json());
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Resolve channel display name
  let channelDisplayName = 'Loading...';
  let dmOtherUser: User | undefined;
  if (activeChannel) {
    if (activeChannel.is_dm) {
      const match = activeChannel.name.match(/^dm-(\d+)-(\d+)$/);
      if (match) {
        const otherId = Number(match[1]) === user.id ? Number(match[2]) : Number(match[1]);
        dmOtherUser = users.find(u => u.id === otherId);
        channelDisplayName = dmOtherUser?.username || 'DM';
      } else {
        channelDisplayName = 'DM';
      }
    } else {
      channelDisplayName = activeChannel.name;
    }
  }

  const dmOnline = dmOtherUser?.last_seen_at && (Date.now() - new Date(dmOtherUser.last_seen_at + 'Z').getTime() < 30000);

  // Search results dropdown (shared between desktop and mobile)
  const searchDropdown = searchResults && (
    <div className="search-dropdown" style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 4,
      width: 380, maxHeight: 400, overflowY: 'auto',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100,
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{searching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}</span>
        <button onClick={() => { setSearchQuery(''); setSearchResults(null); setMobileSearchOpen(false); }} className="action-btn" style={{ fontSize: 14, padding: '0 4px' }}>
          ✕
        </button>
      </div>
      {searchResults.map(msg => (
        <div key={msg.id} onClick={() => {
          if (msg.channel_id !== activeChannelId) setActiveChannelId(msg.channel_id);
          setSearchQuery(''); setSearchResults(null); setMobileSearchOpen(false);
        }} className="search-result-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{msg.username}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {msg.channel_name && (msg.channel_name.startsWith('dm-') ? 'DM' : `#${msg.channel_name}`)}
            </span>
          </div>
          <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highlightMatch(msg.content, searchQuery)}
          </div>
        </div>
      ))}
      {searchResults.length === 0 && !searching && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No messages found
        </div>
      )}
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - wrapped for mobile drawer */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={handleCreateChannel}
          onStartDm={handleStartDm}
          currentUser={user}
          users={users}
          unreadCounts={unreadCounts}
          onLogout={auth.logout}
          onProfileClick={handleProfileClick}
        />
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div className="chat-header" style={{
          padding: '10px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
        }}>
          <div className="channel-info" style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hamburger button — mobile only */}
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>

            {/* Channel icon/avatar */}
            {!!activeChannel?.is_dm && dmOtherUser ? (
              <div className="channel-icon" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => setProfileUser(dmOtherUser!)}>
                <Avatar username={dmOtherUser.username} color={dmOtherUser.avatar_color} size={32} profilePictureUrl={dmOtherUser.profile_picture_url} />
                <div className={`avatar-status-dot ${dmOnline ? 'online' : 'offline'}`}
                  style={{ width: 10, height: 10, borderWidth: 2 }} />
              </div>
            ) : (
              <div className="channel-icon" style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                #
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div className="channel-name" style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {channelDisplayName}
                {!!activeChannel?.is_dm && dmOtherUser && (
                  <span className="dm-status-text" style={{ fontSize: 11, color: dmOnline ? '#22c55e' : 'var(--text-muted)', fontWeight: 400 }}>
                    {dmOnline ? 'online' : dmOtherUser.last_seen_at ? `last seen ${timeAgo(dmOtherUser.last_seen_at)}` : 'offline'}
                  </span>
                )}
              </div>
              {activeChannel?.description && (
                <div className="channel-desc" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {activeChannel.description}
                </div>
              )}
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Members Button (only for non-DM channels) */}
            {activeChannel && !activeChannel.is_dm && (
              <button
                className="btn-icon"
                style={{ padding: '6px 10px', fontSize: 14, height: 34 }}
                title="Members"
                onClick={() => setShowMembers(true)}
              >
                👥
              </button>
            )}

            {/* Pins Button */}
            <button
              className="btn-icon"
              style={{ padding: '6px 10px', fontSize: 14, height: 34 }}
              title="Pinned messages"
              onClick={() => { setShowPins(!showPins); if (!showPins) fetchPins(); }}
            >
              📌
            </button>

            {/* Desktop Search */}
            <div className="desktop-search" style={{ position: 'relative', flexShrink: 0 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search messages..."
                className="input-field"
                style={{
                  fontSize: 13, width: searchFocused || searchQuery ? 260 : 180,
                  transition: 'width 250ms ease, border-color 150ms ease, box-shadow 150ms ease',
                  padding: '6px 12px',
                }}
              />
              {searchDropdown}
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="mobile-search-toggle btn-icon"
              style={{ padding: '6px 10px', fontSize: 14, height: 34 }}
              title="Search"
              onClick={() => setMobileSearchOpen(true)}
            >
              🔍
            </button>
          </div>
        </div>

        {/* Mobile Search Expanded */}
        {mobileSearchOpen && (
          <div className="mobile-search-expanded">
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search messages..."
              className="input-field"
              style={{ fontSize: 16, padding: '8px 12px' }}
              autoFocus
            />
            <button className="action-btn" style={{ fontSize: 16 }} onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); setSearchResults(null); }}>
              ✕
            </button>
            {searchDropdown}
          </div>
        )}

        {/* Pinned Messages Dropdown */}
        {showPins && (
          <div className="pinned-dropdown" style={{
            borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
            maxHeight: 200, overflowY: 'auto', animation: 'fadeInDown 0.2s ease',
          }}>
            <div style={{ padding: '8px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              📌 Pinned Messages ({pinnedMessages.length})
            </div>
            {pinnedMessages.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No pinned messages in this channel
              </div>
            )}
            {pinnedMessages.map(msg => (
              <div key={msg.id} style={{
                padding: '8px 24px', borderBottom: '1px solid var(--border)',
                fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontWeight: 600, color: msg.avatar_color || 'var(--accent)', flexShrink: 0 }}>
                  {msg.username}
                </span>
                <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.content || '(media)'}
                </span>
              </div>
            ))}
          </div>
        )}

        <MessageList
          messages={messages}
          currentUsername={user.username}
          onReact={handleReact}
          onOpenThread={setThreadMessage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onImageClick={(src) => setLightboxSrc(src)}
          onPin={handlePin}
          onProfileClick={handleProfileClick}
        />
        <TypingIndicator users={typing} />
        <div className="message-input-wrapper">
          <MessageInput channelId={activeChannelId} onSend={handleSend} onTyping={handleTyping} />
        </div>
      </div>

      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          currentUsername={user.username}
          onClose={() => setThreadMessage(null)}
          onReact={handleReact}
          onImageClick={(src) => setLightboxSrc(src)}
        />
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* Members Panel */}
      {showMembers && activeChannel && !activeChannel.is_dm && (
        <MembersPanel
          channelId={activeChannelId}
          channelName={activeChannel.name}
          currentUserId={user.id}
          onClose={() => setShowMembers(false)}
          onProfileClick={handleProfileClick}
        />
      )}

      {/* User Profile Modal */}
      {profileUser && (
        <UserProfileModal
          user={profileUser}
          onClose={() => setProfileUser(null)}
          onStartDm={handleStartDm}
          isCurrentUser={profileUser.id === user.id}
          onProfilePictureUpdate={handleProfilePictureUpdate}
        />
      )}
    </div>
  );
}

export default ChatApp;
