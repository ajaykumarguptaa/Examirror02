import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw, ShieldAlert, Check } from 'lucide-react';

interface DeleteConfirmCaptchaModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  itemType?: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

const DeleteConfirmCaptchaModal: React.FC<DeleteConfirmCaptchaModalProps> = ({
  isOpen,
  title = 'Confirm Permanent Deletion',
  itemName,
  itemType = 'Item',
  description,
  onClose,
  onConfirm,
  isDeleting = false
}) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  // Generate random 4-digit numeric captcha
  const generateCaptcha = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(randomCode);
    setUserInput('');
    setHasError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
    }
  }, [isOpen, itemName]);

  if (!isOpen) return null;

  const isCaptchaValid = userInput.trim() === captchaCode;

  const handleConfirm = () => {
    if (!isCaptchaValid) {
      setHasError(true);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-150">
        
        {/* Header Ribbon */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-base text-rose-950 tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] font-semibold text-rose-600">
                Security Confirmation Required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-800">
          
          {/* Target Item Pill */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {itemType} to be deleted:
            </span>
            <div className="text-sm font-black text-slate-900 truncate">
              {itemName}
            </div>
          </div>

          <p className="text-slate-600 text-[11px] leading-relaxed">
            {description || `This action is permanent and cannot be reversed. All databases, certificates, and records linked to this ${itemType.toLowerCase()} will be permanently erased.`}
          </p>

          {/* Random Number Captcha Verification Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <ShieldAlert size={14} className="text-yellow-400" />
                <span>Enter Security Captcha:</span>
              </span>
              <button
                type="button"
                onClick={generateCaptcha}
                className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Generate New Captcha"
              >
                <RefreshCw size={12} />
                <span>New Code</span>
              </button>
            </div>

            {/* Captcha Display Badge */}
            <div className="bg-slate-800 border-2 border-slate-700 py-3 px-6 rounded-xl flex items-center justify-center tracking-[0.4em] font-mono text-2xl font-black text-yellow-400 select-none shadow-md">
              {captchaCode}
            </div>

            {/* Captcha Input */}
            <div>
              <input
                type="text"
                maxLength={4}
                placeholder="Type the 4-digit number here"
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  setHasError(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-800 text-white placeholder-slate-500 font-mono text-center text-sm font-bold outline-none border transition-colors ${
                  isCaptchaValid 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                    : hasError 
                      ? 'border-rose-500 ring-2 ring-rose-500/20' 
                      : 'border-slate-700 focus:border-yellow-400'
                }`}
              />

              {isCaptchaValid && (
                <div className="text-[10px] font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <Check size={12} /> Captcha Code Matched
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isCaptchaValid || isDeleting}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all ${
              isCaptchaValid && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-rose-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 size={15} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteConfirmCaptchaModal;
