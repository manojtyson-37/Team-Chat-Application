'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: number;
  username: string;
  content: string;
  is_ai: number;
  created_at: string;
}

const COLORS: Record<string, string> = {};
const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
function getColor(name: string) {
  if (!COLORS[name]) {
    COLORS[name] = PALETTE[Object.keys(COLORS).length % PALETTE.length];
  }
  return COLORS[name];
}

export default function Chat() {
  const [username, setUsername] = useState('');
  const [tempName, setTempName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const url = lastIdRef.current
        ? `/api/messages?after=${lastIdRef.current}`
        : '/api/messages';
      const res = await fetch(url);
      const data: Message[] = await res.json();
      if (data.length > 0) {
        if (lastIdRef.current === 0) {
          setMessages(data);
        } else {
          setMessages((prev) => [...prev, ...data]);
        }
        lastIdRef.current = data[data.length - 1].id;
      }
    } catch {}
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chat-username');
    if (saved) setUsername(saved);
  }, []);

  useEffect(() => {
    if (!username) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [username, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, content: input.trim() }),
      });
      setInput('');
      await fetchMessages();
    } catch {} finally {
      setSending(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const name = tempName.trim();
    setUsername(name);
    localStorage.setItem('chat-username', name);
  };

  if (!username) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={styles.loginTitle}>Team Chat</h1>
          <p style={styles.loginSubtitle}>Enter your name to join</p>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your name"
              style={styles.loginInput}
              autoFocus
            />
            <button type="submit" style={styles.loginButton}>
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Team Chat</h1>
          <p style={styles.headerHint}>Type @claude to ask AI</p>
        </div>
        <div style={styles.userBadge}>
          {username}
          <button
            onClick={() => { setUsername(''); localStorage.removeItem('chat-username'); }}
            style={styles.logoutBtn}
          >
            logout
          </button>
        </div>
      </div>

      <div style={styles.messagesArea}>
        {messages.map((msg) => {
          const isMe = msg.username === username;
          const isAi = msg.is_ai === 1;
          return (
            <div key={msg.id} style={{ ...styles.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  ...styles.bubble,
                  ...(isAi
                    ? styles.aiBubble
                    : isMe
                    ? styles.myBubble
                    : styles.otherBubble),
                }}
              >
                {!isMe && (
                  <div style={{ ...styles.msgAuthor, color: isAi ? '#8b5cf6' : getColor(msg.username) }}>
                    {isAi ? '🤖 Claude' : msg.username}
                  </div>
                )}
                <div style={styles.msgText}>{msg.content}</div>
                <div style={styles.msgTime}>
                  {new Date(msg.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message... (use @claude to ask AI)"
          style={styles.chatInput}
          autoFocus
        />
        <button type="submit" disabled={sending || !input.trim()} style={styles.sendBtn}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
  loginCard: {
    background: '#1e293b',
    borderRadius: 16,
    padding: '48px 40px',
    textAlign: 'center',
    border: '1px solid #334155',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  loginTitle: {
    color: '#f1f5f9',
    fontSize: 28,
    margin: '0 0 8px',
    fontWeight: 700,
  },
  loginSubtitle: {
    color: '#94a3b8',
    margin: '0 0 24px',
    fontSize: 14,
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  loginInput: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: 16,
    outline: 'none',
  },
  loginButton: {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f172a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  headerTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    margin: 0,
    fontWeight: 700,
  },
  headerHint: {
    color: '#64748b',
    fontSize: 12,
    margin: '4px 0 0',
  },
  userBadge: {
    color: '#94a3b8',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #475569',
    color: '#64748b',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 11,
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  msgRow: {
    display: 'flex',
  },
  bubble: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.5,
  },
  myBubble: {
    background: '#6366f1',
    color: '#fff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderBottomLeftRadius: 4,
  },
  aiBubble: {
    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
    color: '#e0e7ff',
    border: '1px solid #4338ca',
    borderBottomLeftRadius: 4,
  },
  msgAuthor: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 2,
  },
  msgText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  msgTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    textAlign: 'right' as const,
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '16px 24px',
    background: '#1e293b',
    borderTop: '1px solid #334155',
  },
  chatInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
  },
  sendBtn: {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
