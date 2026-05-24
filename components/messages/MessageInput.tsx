'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import EmojiPicker from './EmojiPicker';

interface Props {
  channelId: number;
  parentId?: number;
  onSend: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  onTyping: () => void;
  placeholder?: string;
}

export default function MessageInput({ channelId, parentId, onSend, onTyping, placeholder }: Props) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<{ url: string; type: string; name?: string } | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, [channelId, parentId]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 5 * 24; // ~5 lines
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitInner();
      return;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    onTyping();
    typingTimeout.current = setTimeout(() => {}, 2000);
  }, [onTyping, input, preview, sending]);

  const handleSubmitInner = async () => {
    if ((!input.trim() && !preview) || sending) return;
    setSending(true);
    try {
      await onSend(input.trim(), preview?.url, preview?.type);
      setInput('');
      setPreview(null);
    } catch {} finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitInner();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }

    setUploading(true);
    setUploadProgress(10);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !preset) {
        alert('Cloudinary not configured');
        return;
      }
      setUploadProgress(30);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      setUploadProgress(50);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData });
      setUploadProgress(80);
      const data = await res.json();
      setUploadProgress(100);
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      setPreview({ url: data.secure_url, type: mediaType, name: file.name });
    } catch { alert('Upload failed'); } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'relative' }}>
      {/* Media Preview */}
      {preview && (
        <div style={{
          marginBottom: 8, display: 'inline-flex', alignItems: 'flex-start', gap: 8,
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          padding: 8, position: 'relative',
        }}>
          {preview.type === 'video' ? (
            <video src={preview.url} style={{ height: 64, borderRadius: 6 }} />
          ) : (
            <img src={preview.url} alt="preview" style={{ height: 64, borderRadius: 6 }} />
          )}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview.name || 'Attachment'}
          </div>
          <button onClick={() => setPreview(null)} style={{
            position: 'absolute', top: -6, right: -6, width: 20, height: 20,
            borderRadius: '50%', background: 'var(--danger)', border: 'none',
            color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'transform 150ms ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >✕</button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress" style={{ marginBottom: 8 }}>
          <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div style={{ position: 'absolute', bottom: '100%', right: 24, marginBottom: 4 }}>
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="btn-icon" title="Attach file"
          style={{ padding: '8px 12px', fontSize: 18, flexShrink: 0, height: 42 }}>
          {uploading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '📎'}
        </button>
        <input type="file" ref={fileRef} onChange={handleFile} accept="image/*,video/*" hidden />

        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type a message...'}
            className="input-field"
            rows={1}
            style={{
              width: '100%', resize: 'none', overflow: 'hidden',
              minHeight: 42, maxHeight: 120, lineHeight: '22px',
              paddingRight: 40,
            }}
          />
        </div>

        <button type="button" onClick={() => setShowEmoji(!showEmoji)}
          className="btn-icon" title="Emoji"
          style={{ padding: '8px 12px', fontSize: 18, flexShrink: 0, height: 42 }}>
          😊
        </button>

        <button type="submit" disabled={sending || (!input.trim() && !preview)}
          className="btn-primary"
          style={{
            padding: '10px 18px', height: 42, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
          {sending ? <span className="spinner" /> : '➤'}
        </button>
      </form>
    </div>
  );
}
