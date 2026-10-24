import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, 
  Sparkles, Crown, Share2, AlertCircle, RefreshCw, ChevronRight, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { StudentRechargeModal } from '../../components/student/StudentRechargeModal';

export const StudentWallet: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  const getAuthHeader = () => {
    const token = localStorage.getItem('studentToken');
    const user = JSON.parse(localStorage.getItem('studentUser') || '{}');
    return {
      Authorization: `Bearer ${token}`,
      'x-student-id': String(user?.id || '')
    };
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/wallet/overview', { headers: getAuthHeader() })
        .catch(() => axios.get('http://localhost:3000/api/student/wallet/overview', { headers: getAuthHeader() }));

      if (res.data?.success) {
        setOverview(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch wallet info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const handleUpdate = () => fetchOverview();
    window.addEventListener('studentWalletUpdated', handleUpdate);
    return () => window.removeEventListener('studentWalletUpdated', handleUpdate);
  }, []);

  const transactions = overview?.recentTransactions || [];
  const filteredTxns = transactions.filter((t: any) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      <SEO title="Student Wallet & Subscriptions | Examirror" noindex={true} />

      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
              <Wallet size={20} />
            </span>
            <span>Student Wallet & Passes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your test credits, Elite Pass access, and track purchase ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOverview()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Refresh Balance"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setIsRechargeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Recharge Wallet</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Balance Hero + Active Pass Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Balance Hero Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-white/10">
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-indigo-200 backdrop-blur-md">
                <ShieldCheck size={14} className="text-emerald-400" />
                Verified Student Wallet
              </span>

              {overview?.activePass?.isElite ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-400/25">
                  <Crown size={14} />
                  ELITE PASS ACTIVE
                </span>
              ) : (
                <Link
                  to="/student/passes"
                  className="text-xs text-indigo-300 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Explore VIP Passes</span>
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-300 font-medium">Available Balance</p>
              <div className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1 flex items-baseline gap-2">
                <span>₹{Number(overview?.walletBalance || 0).toFixed(2)}</span>
                <span className="text-xs font-semibold text-slate-400">INR</span>
              </div>
            </div>

            {/* Quick Actions & Shortfall Warning */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                {overview?.isLowBalance ? (
                  <span className="text-amber-300 flex items-center gap-1 font-semibold">
                    <AlertCircle size={14} />
                    Low Balance Warning: Less than ₹50 available.
                  </span>
                ) : (
                  <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={14} />
                    Balance healthy for instant 1-click mock unlocking.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRechargeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Money
                </button>
                <Link
                  to="/student/test-series"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Browse Tests
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Pass Status / Upgrade Card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10 border border-amber-500/20 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-black">
              <Crown size={24} />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                {overview?.activePass?.isElite ? 'ACTIVE MEMBERSHIP' : 'RECOMMENDED'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Examirror Elite Pass 👑
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {overview?.activePass?.isElite
                  ? `Unlimited access to ALL test series active. ${overview?.activePass?.daysRemaining} days remaining.`
                  : 'Get unlimited, zero-payment access to all current and upcoming paid test series for 365 days.'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200/60">
            <Link
              to="/student/passes"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{overview?.activePass?.isElite ? 'Manage Elite Pass' : 'Unlock All with Elite Pass'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Recharge Requests (if any) */}
      {overview?.pendingRequests && overview.pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <span>Pending Wallet Recharge Requests</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {overview.pendingRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Recharge Request: ₹{Number(req.amount).toFixed(2)}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">UTR: {req.utr_number}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Verifying
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Ledger (Passbook) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Wallet Passbook</h3>
            <p className="text-xs text-slate-500 mt-0.5">All credits, debits, and purchase receipts</p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'CREDIT', 'DEBIT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'CREDIT' ? 'Credits (+)' : 'Debits (-)'}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTxns.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Wallet size={32} className="mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No transactions recorded yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Recharge your wallet or refer friends to see your passbook activity here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {filteredTxns.map((txn: any) => {
              const isCredit = txn.type === 'CREDIT';
              return (
                <div key={txn.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {txn.description}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                        <span>{new Date(txn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] font-bold text-slate-500">{txn.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm sm:text-base font-black ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isCredit ? '+' : '-'}₹{Number(txn.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Bal: ₹{Number(txn.balance_after).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      <StudentRechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onSuccess={fetchOverview}
      />
    </div>
  );
};

export default StudentWallet;
