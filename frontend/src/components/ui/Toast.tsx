import { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toast: (options: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...options, id };

    setToasts((prev) => {
      const updated = [newToast, ...prev].slice(0, maxToasts);
      return updated;
    });

    return id;
  }, [maxToasts]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const typeClasses = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
  };

  const iconColors = {
    success: 'text-success-600',
    error: 'text-danger-600',
    warning: 'text-warning-600',
    info: 'text-primary-600',
  };

  const titleColors = {
    success: 'text-success-800',
    error: 'text-danger-800',
    warning: 'text-warning-800',
    info: 'text-primary-800',
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <div
        className={`fixed z-toast flex flex-col gap-2 ${positionClasses[position]} pointer-events-none`}
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-up card border ${typeClasses[toast.type]} w-full max-w-sm`}
            role="alert"
          >
            <div className="card-body flex gap-3 p-4">
              <div className={`flex-shrink-0 w-5 h-5 ${iconColors[toast.type]}`}>
                {React.createElement(icons[toast.type], { className: "w-5 h-5", "aria-hidden": "true" })}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${titleColors[toast.type]}`}>{toast.title}</p>
                {toast.message && (
                  <p className="text-body-sm text-text-secondary mt-0.5">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 p-1 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            {toast.action && (
              <div className="card-footer px-4 pb-4 pt-0">
                <button
                  type="button"
                  onClick={() => {
                    const action = toast.action;
                    if (action) {
                      action.onClick();
                      dismiss(toast.id);
                    }
                  }}
                  className="btn-secondary btn-sm w-full"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) =>
    useToast().toast({ type: 'success', title, message, ...options }),
  error: (title: string, message?: string, options?: Partial<Toast>) =>
    useToast().toast({ type: 'error', title, message, ...options }),
  warning: (title: string, message?: string, options?: Partial<Toast>) =>
    useToast().toast({ type: 'warning', title, message, ...options }),
  info: (title: string, message?: string, options?: Partial<Toast>) =>
    useToast().toast({ type: 'info', title, message, ...options }),
};