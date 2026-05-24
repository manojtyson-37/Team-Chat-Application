'use client';
import { useState } from 'react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 2) { setError('Username must be at least 2 characters'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Registration failed');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          }}>
            T
          </div>
        </div>

        <div className="auth-title">Create Account</div>
        <div className="auth-subtitle">Join Team Chat</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div className="auth-error">{error}</div>}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
              Username
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username (2-20 chars)" required autoFocus
              className="input-field" style={{ width: '100%', padding: '12px 16px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Create a password (6+ chars)" required
              className="input-field" style={{ width: '100%', padding: '12px 16px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary"
            style={{ marginTop: 4, padding: '12px 24px', fontSize: 15, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
