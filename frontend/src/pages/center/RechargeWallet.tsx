import React, { useState, useEffect } from 'react';
import {
  Send,
  Search,
  ChevronDown,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Loader2,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

interface WalletTxn {
  id: number | string;
  txn_uid?: string;
  utr_number?: string;
  type: 'debit' | 'credit' | 'DEBIT' | 'CREDIT';
  amount: number;
  status: 'Approved' | 'Rejected' | 'Pending' | 'approved' | 'rejected' | 'pending';
  narration?: string;
  description?: string;
  remark?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

const RechargeWallet = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) { }
    return 1;
  };

  // Form State
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('Wallet Recharge');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resubmittingRequest, setResubmittingRequest] = useState<WalletTxn | null>(null);

  // Custom Toasts State
  const [updateToast, setUpdateToast] = useState<{ txn: WalletTxn; action: 'approved' | 'rejected' | 'credit' } | null>(null);
  const previousTxnsRef = React.useRef<WalletTxn[]>([]);

  // Data & Balance State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<WalletTxn | null>(null);

  const fetchWalletData = async (silent: boolean = false) => {
    const centerId = getCenterId();
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/center/${centerId}/wallet`);
      if (res.data.success) {
        setWalletBalance(Number(res.data.data.balance || 0));
        const txns = res.data.data.transactions || [];

        if (silent && previousTxnsRef.current.length > 0) {
          const prevMap = new Map(previousTxnsRef.current.map((t: WalletTxn) => [t.id, t]));

          for (const newTxn of txns) {
            const oldTxn = prevMap.get(newTxn.id);
            const newStatus = String(newTxn.status || '').toLowerCase();

            // Check for Rejected (same ID, status changed to rejected)
            if (oldTxn && String(oldTxn.status || '').toLowerCase() === 'pending' && newStatus === 'rejected') {
              setUpdateToast({ txn: newTxn, action: 'rejected' });
              setTimeout(() => setUpdateToast(null), 10000);
              break;
            }

            // Check for Approved/New Credit (new ID that didn't exist before)
            if (!oldTxn && newStatus === 'approved' && String(newTxn.type).toLowerCase() === 'credit') {
              setUpdateToast({ txn: newTxn, action: 'approved' });
              setTimeout(() => setUpdateToast(null), 10000);
              break;
            }
          }
        }

        previousTxnsRef.current = txns;
        setTransactions(txns);
      }
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Real-time polling every 3 seconds
    const interval = setInterval(() => {
      fetchWalletData(true);
    }, 3000);

    // Event listener for global events (admissions, cancellations, recharges)
    const handleUpdate = () => fetchWalletData(true);
    window.addEventListener('center-stats-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('center-stats-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const handleStartResubmit = (txn: WalletTxn) => {
    setResubmittingRequest(txn);
    setUtrNumber(txn.utr_number || '');
    setAmount(String(txn.amount || ''));
    setNarration(txn.narration || txn.description || 'Wallet Recharge');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelResubmit = () => {
    setResubmittingRequest(null);
    setUtrNumber('');
    setAmount('');
    setNarration('Wallet Recharge');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      setFeedback({ type: 'error', text: 'Please enter a valid 12-digit UTR or Transaction reference number.' });
      return;
    }
    if (!amount || Number(amount) < 300) {
      setFeedback({ type: 'error', text: 'Minimum recharge amount is Rs. 300.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await axios.post('http://localhost:3000/api/center/wallet/request', {
        centerId: getCenterId(),
        amount: Number(amount),
        utrNumber: utrNumber.trim(),
        narration,
        requestId: resubmittingRequest ? resubmittingRequest.id : undefined
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: resubmittingRequest
            ? 'Updated UTR recharge request re-submitted successfully! Super Admin will review again.'
            : 'Wallet recharge request submitted successfully! Super Admin will verify UTR and credit tokens.'
        });
        setUtrNumber('');
        setAmount('');
        setResubmittingRequest(null);
        window.dispatchEvent(new Event('center-stats-updated'));
        fetchWalletData();
      }
    } catch (err: any) {
      console.error('Recharge Error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit recharge request.';
      setFeedback({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper date formatter: "22-09-2026 10:48:04"
  const formatTxnDate = (dateStr?: string) => {
    if (!dateStr) return '22-09-2026 10:48:04';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n: number) => String(n).padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());
      return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
    } catch (_) {
      return dateStr;
    }
  };

  // Filter Transactions
  const filteredTransactions = transactions.filter((txn) => {
    const txnType = String(txn.type || '').toUpperCase();
    const txnStatus = String(txn.status || 'Approved').toLowerCase();
    const utr = String(txn.utr_number || '');
    const txnUid = String(txn.txn_uid || '');
    const narrationText = String(txn.narration || txn.description || '');

    // Type Filter
    if (filterType !== 'all' && txnType !== filterType.toUpperCase()) {
      return false;
    }

    // Status Filter
    if (filterStatus !== 'all' && txnStatus !== filterStatus.toLowerCase()) {
      return false;
    }

    // Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const matchesUtr = utr.toLowerCase().includes(term);
      const matchesUid = txnUid.toLowerCase().includes(term);
      const matchesNarr = narrationText.toLowerCase().includes(term);
      if (!matchesUtr && !matchesUid && !matchesNarr) return false;
    }

    return true;
  });

  const totalEntries = filteredTransactions.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedTxns = filteredTransactions.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="w-full max-w-[1350px] mx-auto pb-12 font-sans space-y-6 relative">

      {/* Custom Center Update Toast */}
      {updateToast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#1a1443] rounded-2xl border-2 border-amber-400 p-4 shadow-2xl animate-in slide-in-from-right fade-in flex flex-col gap-3 min-w-[320px]">
          <button onClick={() => setUpdateToast(null)} className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer">
            <X size={14} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${updateToast.action === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <Bell size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className={`${updateToast.action === 'approved' ? 'text-emerald-400' : 'text-rose-400'} font-bold text-[11px] tracking-wider uppercase`}>
                WALLET RECHARGE {updateToast.action.toUpperCase()}!
              </h4>
              <div className="text-white font-black text-sm uppercase">
                {updateToast.action === 'approved' ? 'Tokens Credited' : 'Verification Failed'}
              </div>
            </div>
          </div>
          <div className="bg-[#241c59] rounded-xl p-3 flex justify-between items-center mt-1">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">UTR: {updateToast.txn.utr_number || 'N/A'}</div>
              <div className={`${updateToast.action === 'approved' ? 'text-emerald-400' : 'text-rose-400'} font-black text-lg`}>
                ₹{updateToast.txn.amount} Tokens
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-semibold shadow-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
        </div>
      )}

      {/* TOP SECTION: Bank Details (Left) + Recharge Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Card: QR Code & Bank Account Details */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center">

          {/* HDFC Bank QR Code Container */}
          <div className="relative mb-5 flex flex-col items-center">
            <div className="p-3 bg-white border border-gray-300 rounded-xl shadow-sm relative flex items-center justify-center">
              <img
                src="/assets/hdfc-qr.png"
                alt="HDFC Bank QR Code"
                className="w-48 h-48 object-contain rounded-lg shadow-2xs"
                onError={(e) => {
                  // Fallback to dynamic QRCodeSVG if image fails
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">
              Scan & Pay via PhonePe / GPay / Paytm / Any UPI App
            </span>
          </div>

          {/* Bank Details Table */}
          <div className="w-full overflow-hidden border border-gray-200 rounded-lg shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 w-32 border-r border-gray-200">
                    Account Holder
                  </td>
                  <td className="py-2.5 px-4 font-bold text-gray-900 tracking-wide uppercase">
                    EXAMIRROREDUTECH PRIVATE LIMITED
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                    Ac/No.
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 text-sm">
                    50200100145470
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                    Bank
                  </td>
                  <td className="py-2.5 px-4 font-bold text-gray-900 uppercase">
                    HDFC BANK
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                    IFSC
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-gray-900 uppercase">
                    HDFC0002643
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                    Branch
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-gray-900 uppercase">
                    PATLIPUTRA
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                    Account Type
                  </td>
                  <td className="py-2.5 px-4 font-medium text-gray-900">
                    Current Account
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Card: Recharge Request Submission Form */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
          {resubmittingRequest && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-800">
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin text-amber-600" />
                  Re-submitting Rejected Request #{resubmittingRequest.id}
                </span>
                <button
                  type="button"
                  onClick={handleCancelResubmit}
                  className="text-amber-700 hover:text-amber-900 underline font-semibold text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-amber-950">
                <strong>Rejection Reason:</strong> {resubmittingRequest.rejection_reason || resubmittingRequest.remark || 'Invalid UTR'}. Please enter the correct 12-digit UTR from your bank/UPI app and click Submit.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-4 flex flex-col h-full">

            {/* Narration Select */}
            <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
              <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Narration</label>
              <div className="flex items-center justify-between">
                <select
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                >
                  <option value="Wallet Recharge">Wallet Recharge</option>
                  <option value="Admission Token Top-up">Admission Token Top-up</option>
                  <option value="Bulk Student Registration">Bulk Student Registration</option>
                </select>
                <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* Paid Amount Input */}
            <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
              <input
                type="number"
                min="300"
                required
                placeholder="Enter Paid Amount (Min ₹300) *"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-400 outline-none bg-transparent"
              />
            </div>

            {/* 12 Digit UTR Number Input */}
            <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
              <input
                type="text"
                required
                placeholder="Enter 12 Digit UTR / Transaction Reference Number *"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full text-sm font-mono font-medium text-[#1e293b] placeholder-gray-400 outline-none bg-transparent"
              />
            </div>

            {/* Purple / Amber Submit Button */}
            <div className="pt-2 flex justify-end gap-2 items-center">
              {resubmittingRequest && (
                <button
                  type="button"
                  onClick={handleCancelResubmit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`${resubmittingRequest
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6]'
                  } text-white font-semibold px-6 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all text-xs cursor-pointer disabled:opacity-50`}
              >
                {resubmittingRequest ? <RefreshCw size={13} /> : <Send size={13} className="transform rotate-45 -translate-y-0.5" />}
                <span className="opacity-80">|</span>
                <span>{submitting ? 'Submitting...' : resubmittingRequest ? 'Re-Submit Corrected UTR' : 'Submit'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* BOTTOM SECTION: Transactions History Card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">

        {/* Card Header Title */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#1e293b]">Transactions History</h2>
        </div>

        {/* Filter Controls Row */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100">

          {/* Filter By Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Filter By Type</label>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-white outline-none focus:border-[#6366f1] appearance-none pr-8 cursor-pointer font-medium text-gray-700"
              >
                <option value="all">Show all</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>
              <ChevronDown size={14} className="text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Filter By Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Filter By Status</label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-white outline-none focus:border-[#6366f1] appearance-none pr-8 cursor-pointer font-medium text-gray-700"
              >
                <option value="all">Show all</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown size={14} className="text-gray-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Search By Transaction / UTR No */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Search By Transaction / UTR No.</label>
            <input
              type="text"
              placeholder="Enter last 6 characters of Transaction / UTR"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs outline-none focus:border-[#6366f1] text-gray-700"
            />
          </div>

        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">

            {/* Purple / Royal Blue Header */}
            <thead className="bg-[#5b67f1] text-white">
              <tr>
                <th className="py-3 px-4 font-bold w-12 text-center border-r border-[#6f7bf3]/60">
                  Sr.no
                </th>
                <th className="py-3 px-4 font-bold border-r border-[#6f7bf3]/60 w-56">
                  Transaction Details
                </th>
                <th className="py-3 px-4 font-bold border-r border-[#6f7bf3]/60 w-28">
                  Amount
                </th>
                <th className="py-3 px-4 font-bold border-r border-[#6f7bf3]/60 w-56 text-center">
                  Files
                </th>
                <th className="py-3 px-4 font-bold border-r border-[#6f7bf3]/60 w-52">
                  Transaction Dates
                </th>
                <th className="py-3 px-4 font-bold border-r border-[#6f7bf3]/60 w-56">
                  Narration
                </th>
                <th className="py-3 px-4 font-bold">
                  Remark
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 size={18} className="animate-spin text-[#5b67f1]" />
                      <span>Loading transactions history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTxns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500 font-medium">
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedTxns.map((txn, index) => {
                  const typeUpper = String(txn.type || '').toUpperCase();
                  const isCredit = typeUpper === 'CREDIT';
                  const statusNormalized = String(txn.status || 'Approved');
                  const isApproved = statusNormalized.toLowerCase() === 'approved';
                  const isRejected = statusNormalized.toLowerCase() === 'rejected';
                  const isPending = statusNormalized.toLowerCase() === 'pending';

                  const txnUid = txn.txn_uid || `EXAMTXN${String(txn.id).padStart(4, '0')}${new Date(txn.created_at).getTime()}`;
                  const requestedDate = formatTxnDate(txn.created_at);
                  const approvedDate = formatTxnDate(txn.approved_at || txn.created_at);

                  return (
                    <tr
                      key={txn.id || index}
                      className={`hover:bg-slate-50/70 transition-colors ${!isCredit ? 'bg-rose-50/20' : index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                    >

                      {/* 1. Sr.no */}
                      <td className="py-4 px-4 text-center font-bold text-gray-700 border-r border-gray-200 align-top">
                        {startIndex + index + 1}
                      </td>

                      {/* 2. Transaction Details */}
                      <td className="py-4 px-4 border-r border-gray-200 align-top space-y-1">
                        {txn.utr_number ? (
                          <div className="text-gray-700 font-normal">
                            UTR No. : <span className="font-bold text-gray-900">{txn.utr_number}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {isCredit ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <ArrowUpRight size={11} /> CREDIT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <ArrowDownRight size={11} /> TOKEN DEBIT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono pt-0.5">
                          Txn ID: {txnUid}
                        </div>
                      </td>

                      {/* 3. Amount */}
                      <td className="py-4 px-4 border-r border-gray-200 align-top">
                        <div className="space-y-1">
                          <div className={`font-black text-xs ${isCredit ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isCredit ? '+' : '-'} ₹{Number(txn.amount).toLocaleString('en-IN')}/-
                          </div>
                          <div>
                            {!isCredit ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                                Deducted
                              </span>
                            ) : isApproved ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                Approved
                              </span>
                            ) : isRejected ? (
                              <span className="text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300 inline-flex items-center gap-1">
                                <AlertCircle size={10} /> REJECTED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                Pending Approval
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Files & Actions */}
                      <td className="py-4 px-4 border-r border-gray-200 align-top text-center">
                        {isCredit && isApproved ? (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(txn)}
                            className="bg-[#5b67f1] hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold px-3 py-1 rounded text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <FileText size={12} /> | Invoice
                          </button>
                        ) : isCredit && isRejected ? (
                          <button
                            type="button"
                            onClick={() => handleStartResubmit(txn)}
                            className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold px-2.5 py-1.5 rounded text-[11px] inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                            title="Edit and Re-submit UTR"
                          >
                            <RefreshCw size={11} /> Re-Submit UTR
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500 leading-tight block font-medium">
                            {!isCredit ? 'Token Debit Adjustment' : "Awaiting Admin Verification"}
                          </span>
                        )}
                      </td>

                      {/* 5. Transaction Dates */}
                      <td className="py-4 px-4 border-r border-gray-200 align-top space-y-1 font-mono text-[11px]">
                        <div className="text-gray-600">
                          {isCredit ? 'Requested on:' : 'Deducted on:'} {requestedDate}
                        </div>
                        {isCredit && (
                          <div className="text-gray-600">
                            {isRejected ? 'Rejected on:' : isPending ? 'Status:' : 'Approved on:'} {approvedDate}
                          </div>
                        )}
                      </td>

                      {/* 6. Narration */}
                      <td className="py-4 px-4 border-r border-gray-200 align-top leading-relaxed">
                        <div className={`text-xs font-semibold ${!isCredit ? 'text-rose-950' : 'text-gray-800'}`}>
                          {txn.narration || txn.description || (isCredit ? 'Wallet Recharge' : 'Token Deduction by Admin')}
                        </div>
                      </td>

                      {/* 7. Remark / Reason */}
                      <td className="py-4 px-4 align-top leading-relaxed">
                        {!isCredit ? (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-950">
                            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle size={11} /> Deduction Reason:
                            </div>
                            <div className="text-xs font-bold text-rose-900 mt-0.5">
                              {txn.remark || txn.description || 'Manual token deduction by Super Admin'}
                            </div>
                          </div>
                        ) : isRejected ? (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-950">
                            <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle size={11} /> Rejection Reason:
                            </div>
                            <div className="text-xs font-bold text-red-900 mt-0.5">
                              {txn.rejection_reason || txn.remark || 'UTR number verification failed by Super Admin. Please re-submit correct UTR.'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            {txn.remark || (isApproved ? 'Thanks for business.' : 'Pending Super Admin verification.')}
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">

          {/* Entries status */}
          <div className="text-xs text-gray-600 font-medium">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          {/* Pagination controls */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${currentPage === pageNum
                  ? 'bg-[#5b67f1] text-white border border-[#5b67f1]'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>

        </div>

      </div>

      {/* Printable Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-300 flex flex-col max-h-[90vh]">

            {/* Modal Top Bar */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <h3 className="font-bold text-sm">Official Wallet Recharge Invoice Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Printable Invoice Area */}
            <div id="printable-invoice" className="p-8 overflow-y-auto space-y-6 font-sans text-slate-800 bg-white">

              {/* Company Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-indigo-950 uppercase tracking-tight">
                    EXAMIRROR SKILL DEVELOPMENT
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Skill Development & Vocational Training Pvt. Ltd.</p>
                  <p className="text-[11px] text-gray-400 mt-1">GSTIN: 07AAACN1234F1Z8 | Support: saurabhcsjnu@gmail.com</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
                    PAID TAX INVOICE
                  </span>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    INV-{selectedInvoice.txn_uid || selectedInvoice.id}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Date: {formatTxnDate(selectedInvoice.created_at)}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Billed To Authorized Center</span>
                  <div className="font-bold text-gray-900">Delhi Main Study Center (CENT001)</div>
                  <div className="text-gray-600">Center ID: #1 | New Delhi, India</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Payment Particulars</span>
                  <div><strong>Payment Mode:</strong> UPI / Direct Bank Transfer</div>
                  <div><strong>UTR Ref No:</strong> <span className="font-mono font-bold text-indigo-700">{selectedInvoice.utr_number || 'N/A'}</span></div>
                  <div><strong>Transaction UID:</strong> <span className="font-mono text-gray-700">{selectedInvoice.txn_uid || 'N/A'}</span></div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-gray-700 border-y border-gray-200">
                    <th className="py-2.5 px-4 text-left font-bold">Description</th>
                    <th className="py-2.5 px-4 text-center font-bold">Qty</th>
                    <th className="py-2.5 px-4 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{selectedInvoice.narration || selectedInvoice.description || 'Wallet Recharge'}</div>
                      <div className="text-[11px] text-gray-500">Credited directly to Center Admission Token Wallet</div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">1</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      ₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold text-sm text-gray-900">
                    <td colSpan={2} className="py-3 px-4 text-right">Total Paid Amount:</td>
                    <td className="py-3 px-4 text-right text-indigo-700">
                      ₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Digital Footer */}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-[11px] text-gray-500">
                <span>Computer generated official tax receipt. No physical signature required.</span>
                <span className="font-bold text-emerald-600 inline-flex items-center gap-1">
                  <CheckCircle2 size={13} /> Verified & Credited
                </span>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="py-2 px-4 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 bg-[#5b67f1] hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer size={14} /> Print Invoice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RechargeWallet;
