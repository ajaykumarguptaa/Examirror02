import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles, ShieldCheck, Zap, ArrowRight, Wallet, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import { WalletPurchaseConfirmModal, type PurchaseItem } from '../../components/student/WalletPurchaseConfirmModal';
import { StudentRechargeModal } from '../../components/student/StudentRechargeModal';

export const StudentPasses: React.FC = () => {
  const [passes, setPasses] = useState<any[]>([]);
  const [walletOverview, setWalletOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPassToBuy, setSelectedPassToBuy] = useState<PurchaseItem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeShortfall, setRechargeShortfall] = useState(100);

  const getAuthHeader = () => {
    const token = localStorage.getItem('studentToken');
    const user = JSON.parse(localStorage.getItem('studentUser') || '{}');
    return {
      Authorization: `Bearer ${token}`,
      'x-student-id': String(user?.id || '')
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [passRes, walletRes] = await Promise.all([
        axios.get('/api/student/wallet/passes')
          .catch(() => axios.get('http://localhost:3000/api/student/wallet/passes')),
        axios.get('/api/student/wallet/overview', { headers: getAuthHeader() })
          .catch(() => axios.get('http://localhost:3000/api/student/wallet/overview', { headers: getAuthHeader() }))
      ]);

      if (passRes.data?.success) {
        setPasses(passRes.data.data);
      }
      if (walletRes.data?.success) {
        setWalletOverview(walletRes.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load pass subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuyPass = (pass: any) => {
    const item: PurchaseItem = {
      id: pass.id,
      title: pass.title,
      price: Number(pass.price),
      type: 'PASS',
      passType: pass.pass_type,
      validity: `${pass.validity_days} Days`
    };
    setSelectedPassToBuy(item);
    setIsConfirmModalOpen(true);
  };

  const handleOpenRechargeFromModal = (shortfall: number) => {
    setIsConfirmModalOpen(false);
    setRechargeShortfall(Math.max(100, Math.ceil(shortfall)));
    setIsRechargeModalOpen(true);
  };

  const activePass = walletOverview?.activePass;
  const walletBalance = Number(walletOverview?.walletBalance || 0);

  return (
    <div className="space-y-8 pb-16 font-sans">
      <SEO title="Examirror Passes | Unlimited Test Series Access" noindex={true} />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <Crown size={14} className="text-amber-600" />
          <span>OFFICIAL EXAMIRROR PASS</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Unlock Unlimited Test Series & Live Practice
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Skip paying per test series. Get complete, unrestricted access to all current and upcoming competitive tests with an Examirror Pass.
        </p>

        {/* Current Active Status Banner */}
        {activePass?.isElite && (
          <div className="inline-flex items-center gap-2 p-3 px-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold mt-2 shadow-xs">
            <Crown size={16} className="text-amber-600" />
            <span>Your Elite Pass is currently ACTIVE ({activePass.daysRemaining} days remaining)</span>
          </div>
        )}
      </div>

      {/* Passes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {passes.map((pass: any) => {
          const isElite = pass.pass_type === 'ELITE';
          const isCurrentActive = activePass?.type === pass.pass_type && !activePass?.isExpired;
          const features = pass.features || [];

          return (
            <motion.div
              key={pass.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all shadow-lg ${
                isElite
                  ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-amber-400/60 shadow-indigo-950/40'
                  : 'bg-white border border-slate-200/90 text-slate-900 shadow-slate-100'
              }`}
            >
              {/* Top Badge */}
              {isElite && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    👑 MOST POPULAR • ALL-ACCESS
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isElite ? 'text-amber-400' : 'text-indigo-600'}`}>
                      {pass.subtitle}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black mt-1">
                      {pass.title}
                    </h3>
                  </div>

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isElite ? 'bg-amber-400/20 text-amber-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {isElite ? <Crown size={24} /> : <Zap size={24} />}
                  </div>
                </div>

                {/* Price Display */}
                <div className="my-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black">₹{Number(pass.price).toFixed(0)}</span>
                    <span className={`text-xs ${isElite ? 'text-slate-400' : 'text-slate-500'}`}>
                      / {pass.validity_days} Days Validity
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isElite ? 'text-slate-400' : 'text-slate-500'}`}>
                    Includes access to all relevant tests • Instant 1-click activation
                  </p>
                </div>

                {/* Features List */}
                <div className={`space-y-3 pt-4 border-t ${isElite ? 'border-white/10' : 'border-slate-100'}`}>
                  {features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${isElite ? 'text-amber-400' : 'text-emerald-500'}`} />
                      <span className={isElite ? 'text-slate-200 font-medium' : 'text-slate-700'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                {isCurrentActive ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-default"
                  >
                    <Check size={16} />
                    <span>Currently Active Subscription</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuyPass(pass)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                      isElite
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-amber-400/25 active:scale-[0.99]'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 active:scale-[0.99]'
                    }`}
                  >
                    <Wallet size={16} />
                    <span>Buy with Wallet (₹{Number(pass.price).toFixed(0)})</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <WalletPurchaseConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        item={selectedPassToBuy}
        walletBalance={walletBalance}
        onSuccess={() => fetchData()}
        onOpenRecharge={handleOpenRechargeFromModal}
      />

      {/* Recharge Modal */}
      <StudentRechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        defaultAmount={rechargeShortfall}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};

export default StudentPasses;
