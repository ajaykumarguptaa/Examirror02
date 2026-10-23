import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, HelpCircle, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onClose
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-apple-modal border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle highlight banner */}
        <div
          className={`h-1.5 w-full ${isDanger
              ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
              : isWarning
                ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500'
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600'
            }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Type Icon with glowing halo */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDanger
                  ? 'bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 border border-rose-100'
                  : isWarning
                    ? 'bg-amber-50 text-amber-600 ring-8 ring-amber-50/60 border border-amber-100'
                    : 'bg-blue-50 text-blue-600 ring-8 ring-blue-50/60 border border-blue-100'
                }`}
            >
              {isDanger ? (
                <Trash2 size={22} className="animate-in fade-in" />
              ) : isWarning ? (
                <AlertTriangle size={22} />
              ) : (
                <HelpCircle size={22} />
              )}
            </div>

            {/* Title & Message */}
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {message}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-60 cursor-pointer ${isDanger
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-rose-500/20'
                  : isWarning
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                }`}
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
