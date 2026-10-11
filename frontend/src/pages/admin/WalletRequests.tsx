import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  Building2, 
  IndianRupee, 
  ArrowUpRight, 
  X,
  CreditCard,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Bell
} from 'lucide-react';
import axios from 'axios';

interface WalletRequest {
  id: number;
  centerId: number;
  centerName: string;
  centerCode: string;
  currentBalance?: number;
  amount: number;
  utr_number: string;
  bonus_tokens: number;
  total_credited: number;
  status: 'pending' | 'approved' | 'rejected';
  narration: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

const WalletRequests = () => {
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  
  // Custom Toasts State
  const [newRechargeToast, setNewRechargeToast] = useState<WalletRequest | null>(null);
  const previousRequestsRef = React.useRef<WalletRequest[]>([]);

  // Verification & Approval Modal State
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [bonusTokens, setBonusTokens] = useState<number>(0);
  const [approvalNote, setApprovalNote] = useState<string>('');

  // Rejection Modal State
  const [rejectingRequest, setRejectingRequest] = useState<WalletRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment UTR reference not found in bank statement');
  
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const fetchRequests = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/admin/wallet-requests${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`);
      if (res.data.success) {
        const newReqs = res.data.data || [];
        
        // Check for newly added pending requests for notification
        if (isBackground && previousRequestsRef.current.length > 0) {
          const prevIds = new Set(previousRequestsRef.current.map((r: WalletRequest) => r.id));
          const newAdded = newReqs.filter((r: WalletRequest) => r.status === 'pending' && !prevIds.has(r.id));
          if (newAdded.length > 0) {
            setNewRechargeToast(newAdded[0]);
            // Auto hide after 10 seconds
            setTimeout(() => setNewRechargeToast(null), 10000);
          }
        }
        
        previousRequestsRef.current = newReqs;
        setRequests(newReqs);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Live 3-second auto sync
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  // When opening approval modal, preset verifiedAmount
  useEffect(() => {
    if (selectedRequest) {
      setVerifiedAmount(Number(selectedRequest.amount) || 0);
      setBonusTokens(0);
      setApprovalNote('');
    }
  }, [selectedRequest]);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleSelectRequestForApproval = async (req: WalletRequest) => {
    setSelectedRequest(req);
    setDuplicateWarning(null);
    setVerifiedAmount(0);
    setBonusTokens(0);
    setApprovalNote('');
    
    if (req.utr_number) {
      try {
        setCheckingDuplicate(true);
        const res = await axios.get(`http://localhost:3000/api/admin/wallet-requests/check-duplicate/${req.utr_number}`);
        if (res.data.success && res.data.data.isDuplicate) {
          setDuplicateWarning(res.data.data.details);
        }
      } catch (err) {
        console.error('Failed to check duplicate UTR:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setIsSubmitting(true);
      const vAmt = Number(verifiedAmount) || Number(selectedRequest.amount);
      const bTokens = Number(bonusTokens) || 0;
      const total = vAmt + bTokens;

      const res = await axios.post(`http://localhost:3000/api/admin/wallet-requests/${selectedRequest.id}/approve`, {
        verifiedAmount: vAmt,
        bonusTokens: bTokens
      });

      if (res.data.success) {
        setToastMessage({ 
          type: 'success', 
          text: `Verified & Credited! ₹${total.toLocaleString('en-IN')} tokens added to ${selectedRequest.centerName}'s wallet.` 
        });
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingRequest) return;
    try {
      setIsSubmitting(true);
      const res = await axios.post(`http://localhost:3000/api/admin/wallet-requests/${rejectingRequest.id}/reject`, {
        reason: rejectReason
      });

      if (res.data.success) {
        setToastMessage({ type: 'success', text: `Recharge request #${rejectingRequest.id} marked as Rejected.` });
        setRejectingRequest(null);
        fetchRequests();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const pendingList = requests.filter(r => r.status === 'pending');
  const approvedList = requests.filter(r => r.status === 'approved');
  const rejectedList = requests.filter(r => r.status === 'rejected');

  const pendingSum = pendingList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const approvedSum = approvedList.reduce((acc, curr) => acc + Number(curr.total_credited || curr.amount || 0), 0);

  const filtered = requests.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      r.utr_number?.toLowerCase().includes(term) ||
      r.centerName?.toLowerCase().includes(term) ||
      r.centerCode?.toLowerCase().includes(term);

    return matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      
      {/* Custom Admin New Recharge Notification Toast */}
      {newRechargeToast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#1a1443] rounded-2xl border-2 border-amber-400 p-4 shadow-2xl animate-in slide-in-from-right fade-in flex flex-col gap-3 min-w-[320px]">
          <button onClick={() => setNewRechargeToast(null)} className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer">
            <X size={14} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Bell size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-amber-400 font-bold text-[11px] tracking-wider uppercase">NEW TOKEN RECHARGE RECEIVED!</h4>
              <div className="text-white font-black text-sm uppercase">{newRechargeToast.centerName} ({newRechargeToast.centerCode})</div>
            </div>
          </div>
          <div className="bg-[#241c59] rounded-xl p-3 flex justify-between items-center mt-1">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">UTR: {newRechargeToast.utr_number || 'N/A'}</div>
              <div className="text-amber-400 font-black text-lg">₹{newRechargeToast.amount} Tokens</div>
            </div>
            <button 
              onClick={() => {
                setNewRechargeToast(null);
                handleSelectRequestForApproval(newRechargeToast);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-[#1a1443] font-bold px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Verify <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
          toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2 font-medium text-sm">
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Dedicated Token Verification Gateway
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Live Auto-Sync Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <span>Token Approval & Wallet Recharge Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify bank UTR transactions, approve token credits with bonus incentives, and manage center wallet liquidity.
          </p>
        </div>

        <button
          onClick={() => fetchRequests()}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200 shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pending Card */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
          pendingList.length > 0 ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${pendingList.length > 0 ? 'text-amber-100' : 'text-slate-500'}`}>
              Pending Approval
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              pendingList.length > 0 ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight">
              {pendingList.length} <span className="text-lg font-semibold">({`₹${pendingSum.toLocaleString('en-IN')}`})</span>
            </div>
            <div className={`text-[11px] font-medium mt-1 ${pendingList.length > 0 ? 'text-amber-100' : 'text-slate-500'}`}>
              Awaiting UTR verification
            </div>
          </div>
        </div>

        {/* Total Credited */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Approved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-700 tracking-tight">
              ₹{approvedSum.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              {approvedList.length} successful recharges
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected Requests</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {rejectedList.length}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Payment verification failed
            </div>
          </div>
        </div>

        {/* Total Recharges Logged */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-indigo-700 tracking-tight">
              {requests.length}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              All time request volume
            </div>
          </div>
        </div>

      </div>

      {/* Main Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                filterStatus === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              All Requests ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filterStatus === 'pending' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>Pending Verification</span>
              {pendingList.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  filterStatus === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-900'
                }`}>
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                filterStatus === 'approved' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Approved ({approvedList.length})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                filterStatus === 'rejected' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Rejected ({rejectedList.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search UTR, Center Name, Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Center Details</th>
                <th className="py-3 px-4">Requested Tokens (₹)</th>
                <th className="py-3 px-4">Bank UTR / Ref Number</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No token recharge requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{req.centerName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                          {req.centerCode}
                        </span>
                        {req.currentBalance !== undefined && (
                          <span className="text-[10px] text-slate-500">
                            Bal: ₹{Number(req.currentBalance).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-sm font-black text-slate-900">
                        ₹{Number(req.amount).toLocaleString('en-IN')}
                      </div>
                      {req.bonus_tokens > 0 && (
                        <div className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                          <Sparkles size={10} /> +₹{req.bonus_tokens} Bonus
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200 px-2 py-1 rounded text-xs">
                          {req.utr_number}
                        </span>
                        <button
                          onClick={() => handleCopyUtr(req.utr_number)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Copy UTR Number"
                        >
                          {copiedUtr === req.utr_number ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      <div>{new Date(req.created_at).toLocaleDateString('en-GB')}</div>
                      <div className="text-[10px] text-slate-400">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-2xs animate-pulse">
                          <Clock size={12} /> Pending Verification
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <CheckCircle2 size={12} /> Verified & Credited
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-300 text-rose-900 px-2.5 py-1 rounded-full font-bold text-[11px]" title={req.rejection_reason}>
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <ShieldCheck size={14} />
                            <span>Verify & Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectingRequest(req)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {req.status === 'approved' ? `Credited ₹${req.total_credited || req.amount}` : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: Dedicated Token Verification & Approval */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#1e1b4b] text-white flex items-center justify-between border-b border-indigo-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#1e1b4b] flex items-center justify-center font-black">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Token Recharge Verification</h3>
                  <p className="text-[10px] text-amber-300">Confirm bank payment receipt & allocate center tokens</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              
              {/* Center & UTR Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Study Center:</span>
                    <div className="text-sm font-black text-slate-900">{selectedRequest.centerName}</div>
                    <div className="text-indigo-700 font-mono text-[11px] font-bold">Code: {selectedRequest.centerCode}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Balance:</span>
                    <div className="text-sm font-black text-emerald-700">
                      ₹{Number(selectedRequest.currentBalance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Bank UTR / Ref No:</span>
                    <div className="font-mono font-bold text-xs text-indigo-900 bg-white px-2 py-1 rounded border border-indigo-100 inline-block mt-0.5">
                      {selectedRequest.utr_number}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyUtr(selectedRequest.utr_number)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedUtr === selectedRequest.utr_number ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedUtr === selectedRequest.utr_number ? 'Copied' : 'Copy UTR'}</span>
                  </button>
                </div>
              </div>

              {/* Amount Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmed Received Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={verifiedAmount}
                    onChange={(e) => setVerifiedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black text-indigo-900 outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-500">Requested: ₹{selectedRequest.amount}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Bonus Tokens Incentive (₹)</span>
                  </label>
                  <input
                    type="number"
                    value={bonusTokens}
                    onChange={(e) => setBonusTokens(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black text-amber-700 outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-500">Optional extra reward tokens</span>
                </div>
              </div>

              {/* Live Total Tokens to Credit Calculation Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Total Tokens Credited to Center Wallet:
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    ₹{verifiedAmount} base + ₹{bonusTokens} bonus
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-800">
                  ₹{(Number(verifiedAmount) + Number(bonusTokens)).toLocaleString('en-IN')}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting || !verifiedAmount || verifiedAmount <= 0}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Crediting Tokens...' : `Approve & Credit ₹${(Number(verifiedAmount) + Number(bonusTokens)).toLocaleString('en-IN')} Tokens`}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Reject Recharge Request */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle size={18} />
                <h3 className="font-bold text-sm">Reject Recharge Request</h3>
              </div>
              <button 
                onClick={() => setRejectingRequest(null)} 
                className="text-rose-200 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-950">
                <div><strong>Center:</strong> {rejectingRequest.centerName} ({rejectingRequest.centerCode})</div>
                <div><strong>Amount:</strong> ₹{rejectingRequest.amount}</div>
                <div><strong>UTR:</strong> {rejectingRequest.utr_number}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-600"
                  placeholder="Explain why this request is rejected..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WalletRequests;
