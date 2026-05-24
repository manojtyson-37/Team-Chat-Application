'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);

    // Start exit animation after 3.5s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    }, 3500);

    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}${toast.exiting ? ' exiting' : ''}`}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{icons[toast.type]}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
