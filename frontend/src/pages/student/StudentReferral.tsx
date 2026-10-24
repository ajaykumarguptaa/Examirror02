import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Users, Gift, ArrowRight, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';

export const StudentReferral: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('studentToken');
    const user = JSON.parse(localStorage.getItem('studentUser') || '{}');
    return {
      Authorization: `Bearer ${token}`,
      'x-student-id': String(user?.id || '')
    };
  };

  const fetchWallet = async () => {
    try {
      const res = await axios.get('/api/student/wallet/overview', { headers: getAuthHeader() })
        .catch(() => axios.get('http://localhost:3000/api/student/wallet/overview', { headers: getAuthHeader() }));
      if (res.data?.success) {
        setOverview(res.data.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const referralCode = overview?.referral?.code || 'EXAM2026';
  const shareUrl = overview?.referral?.shareUrl || `https://examirror.in/test-series?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Share link copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 Hey! Prepare for National Certification & Mock Tests on Examirror.\n\nUse my invite code *${referralCode}* to get ₹50 FREE Wallet Balance instantly for Test Series & Elite Passes!\n\nJoin here: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCode.trim()) return;

    setApplying(true);
    try {
      const res = await axios.post('/api/student/wallet/apply-referral', { referralCode: applyCode.trim() }, { headers: getAuthHeader() })
        .catch(() => axios.post('http://localhost:3000/api/student/wallet/apply-referral', { referralCode: applyCode.trim() }, { headers: getAuthHeader() }));

      if (res.data?.success) {
        toast.success(res.data.message || '₹50 bonus credited!');
        setApplyCode('');
        fetchWallet();
        window.dispatchEvent(new Event('studentWalletUpdated'));
      } else {
        toast.error(res.data?.message || 'Failed to apply code');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired referral code');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      <SEO title="Refer & Earn ₹50 Wallet Bonus | Examirror" noindex={true} />

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 text-white p-6 sm:p-10 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-purple-200 backdrop-blur-md">
            <Gift size={14} className="text-amber-400" />
            <span>EXAMIRROR GROWTH PROGRAM</span>
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Invite Friends & Earn ₹50 Wallet Cash per Referral!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Help your friends crack exams. When your friend joins Examirror, both of you get <span className="text-amber-300 font-bold">₹50 instantly credited</span> to your wallets for Test Series & Elite Passes!
          </p>

          {/* Referral Code & WhatsApp Share Container */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 backdrop-blur-md">
              <span className="text-xs text-slate-300">Your Code:</span>
              <span className="font-mono font-black text-amber-300 text-sm tracking-wider">{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Copy Code"
              >
                {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            <button
              onClick={handleWhatsAppShare}
              className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {overview?.referral?.totalReferred || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium">Friends Joined via Your Code</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Gift size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{Number(overview?.referral?.bonusEarned || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 font-medium">Total Wallet Rewards Earned</p>
          </div>
        </div>
      </div>

      {/* How it Works 3-Step Guide */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900">How Refer & Earn Works</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">Share Your Link</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Send your personal link or code to friends preparing for government & skill certification tests.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">Friend Signs Up</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When they register their student account using your link or code, they get ₹50 free wallet credits.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">Both Get ₹50</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your wallet is credited instantly with ₹50 cash which you can use for any test series or Elite Pass!
            </p>
          </div>
        </div>
      </div>

      {/* Have a referral code from a friend? Apply it */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-3xl p-6 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Have a friend's referral code?</h4>
          <p className="text-xs text-slate-500 mt-0.5">Apply it to claim your ₹50 welcome wallet bonus.</p>
        </div>

        <form onSubmit={handleApplyReferral} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Enter friend's code"
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 uppercase"
            maxLength={15}
          />
          <button
            type="submit"
            disabled={applying || !applyCode.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {applying ? 'Applying...' : 'Apply & Get ₹50'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentReferral;
