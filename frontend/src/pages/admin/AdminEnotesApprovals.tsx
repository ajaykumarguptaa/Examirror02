import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Check, X, Settings, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function AdminEnotesApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState<number>(100);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/study-materials/admin/pending-approvals');
      if (res.data?.success) {
        setPending(res.data.data);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchFee = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/public/settings/enotes_approval_fee');
      if (res.data?.success && res.data.data) {
        let val = res.data.data;
        if (typeof val === 'string') val = JSON.parse(val);
        if (val.fee !== undefined) setFee(Number(val.fee));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchFee();
  }, []);

  const handleUpdateFee = async () => {
    try {
      setIsSavingFee(true);
      await axios.put('http://localhost:3000/api/public/settings/enotes_approval_fee', { fee });
      showToast('success', 'Approval fee updated successfully');
    } catch (err: any) {
      showToast('error', 'Failed to update fee');
    } finally {
      setIsSavingFee(false);
    }
  };

  const handleApprove = async () => {
    if (!approvingId) return;
    try {
      setIsProcessing(true);
      const res = await axios.post(`http://localhost:3000/api/study-materials/admin/${approvingId}/approve`);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Approved successfully');
        fetchPending();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to approve');
    } finally {
      setIsProcessing(false);
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      setIsProcessing(true);
      const res = await axios.post(`http://localhost:3000/api/study-materials/admin/${rejectingId}/reject`);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Rejected successfully');
        fetchPending();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setIsProcessing(false);
      setRejectingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-20 right-8 z-[9999] px-5 py-4 rounded-xl shadow-2xl text-white font-bold flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 \${
          toast.type === 'success' ? 'bg-emerald-600 border border-emerald-500' : 'bg-rose-600 border border-rose-500'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            E-Notes Approvals
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review and approve E-Notes created by Centers. Approving deducts tokens from their wallet.
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Settings size={16} className="text-slate-400" />
            Approval Fee (Tokens):
          </div>
          <input 
            type="number" 
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm text-center font-bold"
          />
          <button
            onClick={handleUpdateFee}
            disabled={isSavingFee}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isSavingFee ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Check size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-slate-500 max-w-sm mt-2">There are no pending E-Notes waiting for your approval right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wide">
                      {item.category || 'General'}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <AlertCircle size={10} /> Pending
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  
                  <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg inline-flex">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Created By</span>
                      {item.center_name} ({item.center_code})
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Format</span>
                      {item.file_type}
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Wallet Balance</span>
                      <span className={Number(item.center_wallet_balance) < Number(fee) ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {Number(item.center_wallet_balance || 0).toLocaleString()} T
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:pl-4 md:border-l border-slate-100 shrink-0">
                  <button
                    onClick={() => setRejectingId(item.id)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button
                    onClick={() => setApprovingId(item.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles size={16} /> Approve & Deduct
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approvingId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Approve E-Note</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-1">
                Are you sure you want to approve this E-Note?
              </p>
              <p className="text-slate-600 text-sm font-medium mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
                The approval fee of <strong className="text-indigo-600">{fee} Tokens</strong> will be automatically deducted from the Center's wallet.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setApprovingId(null)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-70"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Reject E-Note</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Are you sure you want to reject this E-Note? It will be permanently archived and the center will be notified. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectingId(null)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-70"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
