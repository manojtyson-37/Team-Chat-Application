'use client';
import { useState } from 'react';

export default function Avatar({ username, color, size = 36, profilePictureUrl }: { username: string; color: string; size?: number; profilePictureUrl?: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  const [imageError, setImageError] = useState(false);

  // If we have a profile picture and no error, show the image
  if (profilePictureUrl && !imageError) {
    return (
      <img
        src={profilePictureUrl}
        alt={username}
        onError={() => setImageError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  // Fall back to colored initials
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}
