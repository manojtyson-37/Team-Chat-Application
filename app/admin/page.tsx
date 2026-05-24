'use client';
import { useState, useEffect } from 'react';

interface UserRow {
  id: number;
  username: string;
  avatar_color: string;
  created_at: string;
  last_seen: string | null;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { 'x-admin-key': adminKey },
    });
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/users', {
      headers: { 'x-admin-key': adminKey },
    });
    if (res.ok) {
      setAuthenticated(true);
      setUsers(await res.json());
    } else {
      setError('Invalid admin key');
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });
    if (res.ok) {
      setSuccess(`User "${newUsername}" created`);
      setNewUsername('');
      setNewPassword('');
      await fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create user');
    }
  };

  const handleResetPassword = async (userId: number) => {
    setError('');
    setSuccess('');
    if (!resetPassword || resetPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ userId, password: resetPassword }),
    });
    if (res.ok) {
      setSuccess(`Password reset for user #${userId}`);
      setResetUserId(null);
      setResetPassword('');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setSuccess(`User "${username}" deleted`);
      await fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to delete user');
    }
  };

  if (!authenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Admin Portal</h1>
          <p style={styles.subtitle}>Enter admin key to continue</p>
          {error && <div style={styles.error}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="Admin Key"
              style={{ ...styles.input, flex: 1 }}
              autoFocus
            />
            <button onClick={handleAuth} disabled={loading} style={styles.button}>
              {loading ? '...' : 'Enter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, width: 700, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ ...styles.title, margin: 0 }}>Admin Portal</h1>
          <a href="/" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>Back to Chat</a>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={{ marginBottom: 24 }}>
          <h2 style={styles.sectionTitle}>Create User</h2>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Username"
              required
              style={{ ...styles.input, flex: 1 }}
            />
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ ...styles.input, flex: 1 }}
            />
            <button type="submit" style={styles.button}>Create</button>
          </form>
        </div>

        <h2 style={styles.sectionTitle}>Users ({users.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Last Seen</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.id}</td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: u.avatar_color, display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 700,
                      }}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </span>
                      {u.username}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(u.created_at).toLocaleString()}</td>
                  <td style={styles.td}>{u.last_seen ? new Date(u.last_seen).toLocaleString() : 'Never'}</td>
                  <td style={styles.td}>
                    {resetUserId === u.id ? (
                      <span style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="text"
                          value={resetPassword}
                          onChange={e => setResetPassword(e.target.value)}
                          placeholder="New password"
                          style={{ ...styles.input, padding: '4px 8px', fontSize: 12, width: 120 }}
                          autoFocus
                        />
                        <button onClick={() => handleResetPassword(u.id)} style={{ ...styles.smallBtn, background: 'var(--accent)' }}>Save</button>
                        <button onClick={() => { setResetUserId(null); setResetPassword(''); }} style={{ ...styles.smallBtn, background: 'var(--border)' }}>Cancel</button>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setResetUserId(u.id)} style={{ ...styles.smallBtn, background: 'var(--accent)' }}>Reset PW</button>
                        <button onClick={() => handleDeleteUser(u.id, u.username)} style={{ ...styles.smallBtn, background: 'var(--danger)' }}>Delete</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 20,
  },
  card: {
    background: 'var(--bg-secondary)', borderRadius: 16, padding: '36px 32px',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
    width: 420, maxWidth: '90vw',
  },
  title: { color: 'var(--text-primary)', fontSize: 24, margin: '0 0 8px', fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: 14 },
  sectionTitle: { color: 'var(--text-primary)', fontSize: 16, margin: '0 0 12px', fontWeight: 600 },
  input: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  },
  button: {
    padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none',
    background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  smallBtn: {
    padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none',
    color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--danger)',
    fontSize: 13, marginBottom: 12,
  },
  success: {
    background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: '#10b981',
    fontSize: 13, marginBottom: 12,
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 13,
  },
  th: {
    textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '10px 12px', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)',
  },
};
