'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, message };

    setToasts((prev) => [...prev, toast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast('success', message), [showToast]);
  const error = useCallback((message: string) => showToast('error', message), [showToast]);
  const info = useCallback((message: string) => showToast('info', message), [showToast]);
  const warning = useCallback((message: string) => showToast('warning', message), [showToast]);

  const getToastStyles = (type: ToastType) => {
    const styleMap = {
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        iconBg: 'bg-green-100',
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        iconBg: 'bg-red-100',
      },
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        iconBg: 'bg-yellow-100',
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Info className="w-5 h-5 text-blue-600" />,
        iconBg: 'bg-blue-100',
      },
    } as const;
    return styleMap[type];
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          if (!styles) return null;

          return (
            <div
              key={toast.id}
              className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right duration-300`}
            >
              <div className={`${styles.iconBg} rounded-full p-1`}>
                {styles.icon}
              </div>
              <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
