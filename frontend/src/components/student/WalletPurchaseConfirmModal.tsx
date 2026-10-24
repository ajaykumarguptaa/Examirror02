import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Crown, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface PurchaseItem {
  id: number | string;
  title: string;
  price: number;
  type: 'TEST_SERIES' | 'PASS' | 'NOTE' | 'COURSE';
  validity?: string;
  passType?: 'BASIC' | 'ELITE';
  category?: string;
}

interface WalletPurchaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PurchaseItem | null;
  walletBalance: number;
  onSuccess?: (res: any) => void;
  onOpenRecharge?: (missingAmount: number) => void;
}

export const WalletPurchaseConfirmModal: React.FC<WalletPurchaseConfirmModalProps> = ({
  isOpen,
  onClose,
  item,
  walletBalance,
  onSuccess,
  onOpenRecharge,
}) => {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen || !item) return null;

  const itemPrice = Number(item.price || 0);
  const isSufficient = walletBalance >= itemPrice;
  const balanceAfter = Math.max(0, walletBalance - itemPrice);
  const shortfall = Math.max(0, itemPrice - walletBalance);

  const getAuthHeader = () => {
    const token = localStorage.getItem('studentToken');
    const user = JSON.parse(localStorage.getItem('studentUser') || '{}');
    return {
      Authorization: `Bearer ${token}`,
      'x-student-id': String(user?.id || '')
    };
  };

  const handleConfirmPurchase = async () => {
    if (!isSufficient) {
      toast.error('Insufficient wallet balance. Please recharge.');
      if (onOpenRecharge) onOpenRecharge(shortfall);
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload: any = {};

      if (item.type === 'TEST_SERIES') {
        endpoint = '/api/student/wallet/purchase/test-series';
        payload = { seriesId: item.id };
      } else if (item.type === 'PASS') {
        endpoint = '/api/student/wallet/purchase/pass';
        payload = { passType: item.passType || 'ELITE' };
      } else {
        endpoint = '/api/student/wallet/purchase/test-series';
        payload = { seriesId: item.id };
      }

      // Fallback support for local dev & production
      const res = await axios.post(endpoint, payload, { headers: getAuthHeader() })
        .catch(() => axios.post(`http://localhost:3000${endpoint}`, payload, { headers: getAuthHeader() }));

      if (res.data?.success) {
        setSuccessData(res.data);
        toast.success(res.data.message || 'Purchase successful!');
        window.dispatchEvent(new Event('studentWalletUpdated'));
        window.dispatchEvent(new Event('studentSeriesUpdated'));
        if (onSuccess) onSuccess(res.data);
      } else {
        toast.error(res.data?.message || 'Transaction could not be completed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  {item.type === 'PASS' ? <Crown size={18} className="text-amber-400" /> : <Wallet size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {successData ? 'Payment Confirmed' : 'Confirm Purchase'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {item.type === 'PASS' ? 'Examirror VIP Pass' : 'Secure Wallet Checkout'}
                  </p>
                </div>
              </div>
              <button
                onClick={successData ? handleDone : onClose}
                disabled={loading}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {successData ? (
              /* Success View */
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">Purchase Successful!</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                    {successData.message || `You have successfully unlocked "${item.title}".`}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-slate-900">₹{itemPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Remaining Wallet Balance:</span>
                    <span className="font-bold text-indigo-600">₹{Number(successData.remainingBalance ?? balanceAfter).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleDone}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Start Practicing Now</span>
                </button>
              </div>
            ) : (
              /* Confirmation Order Summary */
              <>
                {/* Item Card */}
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {item.type === 'PASS' ? '👑 All-Access Pass' : item.category || 'Test Series'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      {item.validity && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Validity: <span className="text-slate-800 font-semibold">{item.validity}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400 font-medium line-through">
                        ₹{(itemPrice * 1.5).toFixed(0)}
                      </div>
                      <div className="text-xl font-black text-indigo-700">
                        ₹{itemPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Balance Calculation Breakdown */}
                <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Wallet size={14} className="text-slate-500" />
                      Current Wallet Balance:
                    </span>
                    <span className="font-bold text-slate-900">₹{walletBalance.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Order Amount:</span>
                    <span className="font-bold text-rose-600">- ₹{itemPrice.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Balance After Purchase:</span>
                    <span className={`font-black text-sm ${isSufficient ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isSufficient ? `₹${balanceAfter.toFixed(2)}` : 'Insufficient'}
                    </span>
                  </div>
                </div>

                {/* Insufficient Balance Notice */}
                {!isSufficient && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <p className="font-bold">Insufficient Balance</p>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        You need <span className="font-bold">₹{shortfall.toFixed(2)}</span> more in your wallet to unlock this item.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {isSufficient ? (
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Deducting & Activating...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Confirm & Pay ₹{itemPrice.toFixed(2)} from Wallet</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenRecharge) onOpenRecharge(shortfall);
                      }}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Wallet size={16} />
                      <span>Recharge Wallet (+₹{Math.max(100, Math.ceil(shortfall))})</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span>100% Secure Checkout • Instant Activation</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
