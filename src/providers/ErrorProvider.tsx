import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, WifiOff, AlertCircle } from 'lucide-react';
import { errorBus, normalizeError, type AppError } from '@/lib/errors';
import { ErrorContext } from './ErrorContext';

interface Toast {
  id: number;
  error: AppError;
  timestamp: number;
}

let nextId = 0;
const TOAST_DURATION = 6_000;
const MAX_TOASTS = 3;

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const reportError = useCallback((error: unknown) => {
    const appError = error instanceof Object && 'code' in error
      ? (error as AppError)
      : normalizeError(error);

    const id = ++nextId;
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, error: appError, timestamp: Date.now() }]);

    // Auto-dismiss after duration
    setTimeout(() => dismiss(id), TOAST_DURATION);
  }, [dismiss]);

  // Subscribe to global error bus
  useEffect(() => {
    return errorBus.subscribe(reportError);
  }, [reportError]);

  // Catch unhandled promise rejections globally
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      reportError(e.reason);
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, [reportError]);

  const contextValue = useMemo(
    () => ({ reportError, dismiss, dismissAll }),
    [reportError, dismiss, dismissAll],
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm" aria-live="assertive">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ErrorContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const Icon = toast.error.code === 'NETWORK_ERROR' || toast.error.code === 'TIMEOUT'
    ? WifiOff
    : toast.error.code === 'UNKNOWN'
      ? AlertCircle
      : AlertTriangle;

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="glass-panel flex items-start gap-3 p-4 shadow-lg border-l-4 border-[var(--error)]"
      role="alert"
    >
      <Icon size={18} className="text-[var(--error)] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-main)] truncate">{toast.error.message}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{toast.error.code}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-main)]"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </m.div>
  );
}

