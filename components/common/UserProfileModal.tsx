'use client';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@/lib/types';
import Avatar from './Avatar';

interface Props {
  user: User;
  onClose: () => void;
  onStartDm?: (userId: number) => void;
  isCurrentUser?: boolean;
  onProfilePictureUpdate?: (user: User) => void;
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

export default function UserProfileModal({ user, onClose, onStartDm, isCurrentUser, onProfilePictureUpdate }: Props) {
  const online = user.last_seen_at && (Date.now() - new Date(user.last_seen_at + 'Z').getTime() < 30000);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'team_chat_uploads');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const uploadData = await uploadRes.json();
      const profilePictureUrl = uploadData.secure_url;

      // Update in our database
      const updateRes = await fetch('/api/users/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePictureUrl }),
      });

      if (!updateRes.ok) throw new Error('Database update failed');

      const updatedUser = await updateRes.json();
      onProfilePictureUpdate?.(updatedUser);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ cursor: isCurrentUser ? 'pointer' : 'default' }} onClick={() => isCurrentUser && fileInputRef.current?.click()}>
              <Avatar username={user.username} color={user.avatar_color} size={72} profilePictureUrl={user.profile_picture_url} />
              {isCurrentUser && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, cursor: 'pointer', border: '2px solid var(--bg-primary)',
                }}>
                  📷
                </div>
              )}
            </div>
            <div
              className={`avatar-status-dot ${online ? 'online' : 'offline'}`}
              style={{ width: 14, height: 14, borderWidth: 3 }}
            />
          </div>
        </div>

        {isCurrentUser && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        )}

        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          {user.username}
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: online ? '#22c55e' : 'var(--text-muted)', marginBottom: 16,
        }}>
          <span className={`status-dot ${online ? 'online' : 'offline'}`} style={{ width: 6, height: 6 }} />
          {online ? 'Online' : user.last_seen_at ? `Last seen ${timeAgo(user.last_seen_at)}` : 'Offline'}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          Joined {new Date(user.created_at + 'Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          {!isCurrentUser && onStartDm && (
            <button className="btn-primary" onClick={() => { onStartDm(user.id); onClose(); }}>
              Send Message
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
