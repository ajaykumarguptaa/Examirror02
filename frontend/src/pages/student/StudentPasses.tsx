import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Wallet, 
  Check, 
  RotateCcw, 
  Trophy, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  ChevronDown,
  Lock,
  Flame,
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { WalletPurchaseConfirmModal, type PurchaseItem } from '../../components/student/WalletPurchaseConfirmModal';
import { StudentRechargeModal } from '../../components/student/StudentRechargeModal';

// Clean raw emoji artifacts from titles and features for a polished SaaS look
const cleanText = (str: string) => {
  if (!str) return '';
  return str.replace(/^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\s•\-]+/u, '').trim();
};

const cleanTitle = (title: string) => {
  if (!title) return '';
  return title.replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '').trim();
};

// Map feature text to contextual modern micro-icons
const renderFeatureIcon = (feature: string, isElite: boolean) => {
  const lower = feature.toLowerCase();
  const iconBase = `w-3.5 h-3.5 shrink-0 ${isElite ? 'text-amber-400' : 'text-indigo-600'}`;

  if (lower.includes('unlimited') || lower.includes('test series') || lower.includes('access')) {
    return <Layers className={iconBase} />;
  }
  if (lower.includes('zero') || lower.includes('instant') || lower.includes('activation')) {
    return <Zap className={iconBase} />;
  }
  if (lower.includes('re-attempt') || lower.includes('rounds') || lower.includes('practice')) {
    return <RotateCcw className={iconBase} />;
  }
  if (lower.includes('ranking') || lower.includes('air') || lower.includes('percentile')) {
    return <Trophy className={iconBase} />;
  }
  if (lower.includes('pdf') || lower.includes('solution') || lower.includes('explanation')) {
    return <FileText className={iconBase} />;
  }
  if (lower.includes('vip') || lower.includes('support') || lower.includes('badge')) {
    return <ShieldCheck className={iconBase} />;
  }
  if (lower.includes('valid') || lower.includes('days') || lower.includes('year')) {
    return <Calendar className={iconBase} />;
  }
  return <CheckCircle2 className={iconBase} />;
};

export const StudentPasses: React.FC = () => {
  const [passes, setPasses] = useState<any[]>([]);
  const [walletOverview, setWalletOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPassToBuy, setSelectedPassToBuy] = useState<PurchaseItem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeShortfall, setRechargeShortfall] = useState(100);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      title: cleanTitle(pass.title),
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

  const faqs = [
    {
      q: 'Does the Elite Pass unlock future test series automatically?',
      a: 'Yes, 100%! As an active Elite Pass holder, every single paid test series launched during your 365-day validity period will automatically unlock for free in 1 click.'
    },
    {
      q: 'Is there any hidden recurring auto-debit on my account?',
      a: 'No recurring subscriptions whatsoever. You pay once from your wallet balance. We will never deduct payments automatically.'
    },
    {
      q: 'Can I re-attempt mock tests as many times as I want?',
      a: 'Elite Pass members receive unlimited mock re-attempts and practice rounds with instant solution analysis and percentile cards.'
    },
    {
      q: 'How does wallet payment work?',
      a: 'Simply ensure your student wallet has sufficient balance. Clicking "Buy with Wallet" activates your membership instantly without any waiting or verification delays.'
    }
  ];

  return (
    <div className="space-y-12 pb-20 font-sans">
      <SEO title="Examirror Passes | Unlimited Test Series Access" noindex={true} />

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 text-amber-900 border border-amber-300/80 shadow-xs">
          <Crown size={14} className="text-amber-600 shrink-0" />
          <span className="tracking-wide uppercase text-[11px] font-bold">Official Examirror Membership</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
          One Membership. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent">
            Unlimited Practice & Mock Tests.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Skip paying per test series. Enjoy unrestricted 1-click access to all active and upcoming competitive exam series with national ranking and in-depth analytics.
        </p>

        {/* Current Active Status Banner */}
        {activePass?.isElite && (
          <div className="inline-flex items-center gap-3 p-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-300 text-slate-900 text-xs font-semibold shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              Your <strong className="font-bold text-amber-900">Elite Pass</strong> is currently active ({activePass.daysRemaining} days remaining). All paid test series are unlocked!
            </span>
            <Link
              to="/student/test-series"
              className="ml-2 text-indigo-700 hover:text-indigo-900 font-bold underline inline-flex items-center gap-1"
            >
              Browse Series <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Reassurance Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-xs text-slate-500 font-medium">
          <div className="inline-flex items-center gap-1.5">
            <Zap size={14} className="text-amber-600" />
            <span>1-Click Instant Activation</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>One-Time Fee (No Auto-Debits)</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="inline-flex items-center gap-1.5">
            <Layers size={14} className="text-indigo-600" />
            <span>Unrestricted Test Series Access</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-4 items-stretch">
        {passes.map((pass: any) => {
          const isElite = pass.pass_type === 'ELITE';
          const isCurrentActive = activePass?.type === pass.pass_type && !activePass?.isExpired;
          const features = pass.features || [];
          const price = Number(pass.price || 0);
          const validityDays = Number(pass.validity_days || 90);
          const pricePerDay = (price / validityDays).toFixed(2);

          return (
            <motion.div
              key={pass.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`relative rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                isElite
                  ? 'bg-[#090D1A] text-white border-2 border-amber-400/80 shadow-2xl shadow-indigo-950/40 p-7 sm:p-9 pt-11 sm:pt-12'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-xl shadow-slate-100 p-7 sm:p-9 pt-10 sm:pt-11 hover:border-slate-300'
              }`}
            >
              {/* Top Floating Badge for Elite Card */}
              {isElite && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 border border-amber-200">
                    <Crown size={13} className="text-slate-950" />
                    <span>{pass.badge_text || 'MOST POPULAR • ALL-ACCESS VIP'}</span>
                  </div>
                </div>
              )}

              {/* Ambient Glow for Elite */}
              {isElite && (
                <div 
                  className="absolute inset-0 rounded-3xl pointer-events-none opacity-40 overflow-hidden"
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.25) 0%, rgba(99, 102, 241, 0.12) 40%, transparent 70%)'
                  }}
                />
              )}

              <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span 
                      className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md mb-2.5 border ${
                        isElite 
                          ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}
                    >
                      {isElite ? 'Complete All-Access Membership' : 'Foundational Practice Tier'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                      {cleanTitle(pass.title)}
                    </h3>
                  </div>

                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isElite 
                        ? 'bg-gradient-to-br from-amber-400/20 to-amber-500/10 border-amber-400/30 text-amber-300 shadow-inner' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}
                  >
                    {isElite ? <Crown size={22} className="stroke-[2.2]" /> : <Zap size={22} className="stroke-[2.2]" />}
                  </div>
                </div>

                {/* Subtitle / Description */}
                <p className={`text-xs mt-2 leading-relaxed ${isElite ? 'text-slate-300' : 'text-slate-500'}`}>
                  {pass.subtitle || (isElite 
                    ? 'Unrestricted access to all current and future test series, live full mocks, and national percentiles.' 
                    : 'Targeted foundation mocks, topic-wise practice questions, and subject accuracy analysis.')
                  }
                </p>

                {/* Price Display Card */}
                <div 
                  className={`my-6 p-4 sm:p-5 rounded-2xl border ${
                    isElite 
                      ? 'bg-slate-900/80 border-white/10' 
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold opacity-80">₹</span>
                        <span className="text-4xl sm:text-5xl font-black tracking-tight">{price.toFixed(0)}</span>
                      </div>
                      {pass.original_price && Number(pass.original_price) > price && (
                        <span className="text-base line-through text-slate-500 font-bold">
                          ₹{Number(pass.original_price).toFixed(0)}
                        </span>
                      )}
                      <span className={`text-xs font-medium ml-1 ${isElite ? 'text-slate-400' : 'text-slate-500'}`}>
                        / {validityDays} Days
                      </span>
                    </div>

                    <div 
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                        isElite
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-200/80 border-slate-300 text-slate-700'
                      }`}
                    >
                      {pass.original_price && Number(pass.original_price) > price
                        ? `${Math.round(((Number(pass.original_price) - price) / Number(pass.original_price)) * 100)}% OFF`
                        : (isElite ? 'Best Value' : 'Standard Access')}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium pt-2.5 border-t border-dashed border-current/10">
                    <span className={isElite ? 'text-slate-400' : 'text-slate-500'}>Effective Daily Rate:</span>
                    <span className={`font-bold ${isElite ? 'text-amber-300' : 'text-slate-800'}`}>
                      Only ₹{pricePerDay} / day
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-1">
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider ${isElite ? 'text-amber-300/80' : 'text-slate-400'}`}>
                    What's Included:
                  </div>
                  {features.map((feat: string, idx: number) => {
                    const text = cleanText(feat);
                    return (
                      <div key={idx} className="flex items-start gap-3 text-xs leading-snug">
                        <div 
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                            isElite 
                              ? 'bg-amber-400/10 border-amber-400/20 text-amber-300' 
                              : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                          }`}
                        >
                          {renderFeatureIcon(text, isElite)}
                        </div>
                        <span className={isElite ? 'text-slate-200 font-medium' : 'text-slate-700'}>
                          {text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 mt-8 pt-4 border-t border-current/10">
                {isCurrentActive ? (
                  <div className="w-full py-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    <Check size={16} className="text-emerald-400" />
                    <span>Currently Active Plan</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuyPass(pass)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-[0.99] ${
                      isElite
                        ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                    }`}
                  >
                    <Wallet size={16} />
                    <span>Buy with Wallet (₹{price.toFixed(0)})</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto pt-6">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Compare Pass Features Side-by-Side
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            See how the Elite Pass gives you full unconstrained practice power.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-6">Benefit / Feature</div>
            <div className="col-span-3 sm:col-span-3 text-center">Basic Pass</div>
            <div className="col-span-3 sm:col-span-3 text-center text-amber-700">Elite Pass 👑</div>
          </div>

          <div className="divide-y divide-slate-100 text-xs text-slate-700">
            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 font-medium">Standard Foundation Mock Tests</div>
              <div className="col-span-3 text-center text-emerald-600 font-bold">✓ Included</div>
              <div className="col-span-3 text-center text-emerald-600 font-bold">✓ Included</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center bg-amber-50/20">
              <div className="col-span-6 font-semibold text-slate-900">
                All Paid & Upcoming Test Series
              </div>
              <div className="col-span-3 text-center text-slate-400 font-medium">Pay Separately</div>
              <div className="col-span-3 text-center text-amber-600 font-black">
                ★ 100% Free Access
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 font-medium">Mock Re-attempts & Practice Rounds</div>
              <div className="col-span-3 text-center text-slate-500">1 Free Attempt</div>
              <div className="col-span-3 text-center text-emerald-600 font-bold">✓ Unlimited</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center bg-amber-50/20">
              <div className="col-span-6 font-medium">All India Rank (AIR) & Percentile Cards</div>
              <div className="col-span-3 text-center text-slate-400">Basic Score</div>
              <div className="col-span-3 text-center text-emerald-600 font-bold">✓ Full AIR Card</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 font-medium">Detailed Solution PDF Explanations</div>
              <div className="col-span-3 text-center text-slate-500">View Online</div>
              <div className="col-span-3 text-center text-emerald-600 font-bold">✓ Full Downloadable</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center bg-amber-50/20">
              <div className="col-span-6 font-medium">Pass Validity Duration</div>
              <div className="col-span-3 text-center text-slate-700 font-bold">90 Days</div>
              <div className="col-span-3 text-center text-indigo-700 font-bold">365 Days (1 Year)</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 font-medium">Effective Daily Cost</div>
              <div className="col-span-3 text-center text-slate-600 font-bold">₹2.21 / day</div>
              <div className="col-span-3 text-center text-emerald-700 font-black">₹1.37 / day</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4 pt-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4.5 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-slate-950 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4.5 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
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
