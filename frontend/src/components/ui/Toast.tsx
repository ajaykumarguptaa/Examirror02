import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// Global Event Dispatcher for Toasts
type ToastListener = (toast: ToastItem) => void;
const listeners: ToastListener[] = [];

export const toast = {
  success: (title: string, description?: string, duration = 4000) => {
    const item: ToastItem = { id: `toast-${Date.now()}-${Math.random()}`, type: 'success', title, description, duration };
    listeners.forEach((l) => l(item));
  },
  error: (title: string, description?: string, duration = 4500) => {
    const item: ToastItem = { id: `toast-${Date.now()}-${Math.random()}`, type: 'error', title, description, duration };
    listeners.forEach((l) => l(item));
  },
  info: (title: string, description?: string, duration = 4000) => {
    const item: ToastItem = { id: `toast-${Date.now()}-${Math.random()}`, type: 'info', title, description, duration };
    listeners.forEach((l) => l(item));
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler: ToastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto relative flex items-start gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 text-white ${
              item.type === 'success'
                ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30'
                : item.type === 'error'
                ? 'bg-slate-900/90 border-rose-500/40 text-rose-100 shadow-rose-950/30'
                : 'bg-slate-900/90 border-indigo-500/40 text-indigo-100 shadow-indigo-950/30'
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400" />}
              {item.type === 'error' && <AlertTriangle size={20} className="text-rose-400" />}
              {item.type === 'info' && <Info size={20} className="text-indigo-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-sm font-bold text-white tracking-tight">{item.title}</div>
              {item.description && (
                <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{item.description}</div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
