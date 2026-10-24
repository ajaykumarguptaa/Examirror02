import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, Copy, Check, Upload, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface StudentRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export const StudentRechargeModal: React.FC<StudentRechargeModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 100,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [100, 250, 499, 1000];
  const upiId = 'examirror1@okhdfcbank';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    const cleanUtr = utrNumber.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      toast.error('Please enter a valid 12-digit UPI UTR reference number');
      return;
    }

    const token = localStorage.getItem('studentToken');
    const user = JSON.parse(localStorage.getItem('studentUser') || '{}');

    setLoading(true);
    try {
      const res = await axios.post('/api/student/wallet/recharge', {
        amount,
        utrNumber: cleanUtr,
        screenshot
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-student-id': String(user?.id || '')
        }
      }).catch(() => axios.post('http://localhost:3000/api/student/wallet/recharge', {
        amount,
        utrNumber: cleanUtr,
        screenshot
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-student-id': String(user?.id || '')
        }
      }));

      if (res.data?.success) {
        toast.success(res.data.message || 'Recharge request submitted successfully!');
        window.dispatchEvent(new Event('studentWalletUpdated'));
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to submit recharge request');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Recharge Student Wallet</h3>
                  <p className="text-[11px] text-slate-300">Scan QR Code & Enter 12-Digit UTR</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Select Recharge Amount:</span>
                <span className="text-indigo-600 font-extrabold text-sm">₹{amount}</span>
              </label>

              {/* Quick Pills */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      amount === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter custom amount"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* QR Payment Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-32 bg-white rounded-xl p-2 border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                <img
                  src="/assets/hdfc-qr.png"
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Instant UPI Payment
                </span>
                <p className="text-xs text-slate-600">
                  Scan via PhonePe, Google Pay, Paytm, or BHIM.
                </p>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] font-mono text-slate-800 font-bold truncate flex-1">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 hover:bg-slate-100 rounded text-indigo-600 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* UTR Reference Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                12-Digit UPI Transaction ID / UTR Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={30}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 429812345678"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all uppercase placeholder:normal-case placeholder:font-sans"
                required
              />
              <p className="text-[10px] text-slate-400">
                You can copy the 12-digit UTR from your UPI payment success screen.
              </p>
            </div>

            {/* Screenshot Upload (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Payment Screenshot Proof:</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-50/60 hover:bg-indigo-50/20 transition-all text-xs text-slate-600">
                <Upload size={16} className="text-indigo-600" />
                <span className="truncate">
                  {screenshot ? 'Screenshot Attached ✓' : 'Upload Screenshot (Max 5MB)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting Verification...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Submit Recharge Request (₹{amount})</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
