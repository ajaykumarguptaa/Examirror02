import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { throttle } from '../../utils/throttleDebounce';
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
  Bell,
  GraduationCap,
  User,
  Phone,
  Mail,
  Eye,
  Image as ImageIcon
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

interface StudentWalletRequest {
  id: number;
  student_id: number;
  amount: number | string;
  utr_number: string;
  screenshot_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  student_first_name?: string;
  student_last_name?: string;
  student_email?: string;
  student_phone?: string;
  student_current_balance?: number | string;
  enrollment_no?: string;
  center_name?: string;
  center_code?: string;
}

const WalletRequests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'student' ? 'student' : 'center';
  const [activeTab, setActiveTabState] = useState<'center' | 'student'>(initialTab);

  const setActiveTab = (tab: 'center' | 'student') => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'student' && activeTab !== 'student') {
      setActiveTabState('student');
    } else if (tabParam === 'center' && activeTab !== 'center') {
      setActiveTabState('center');
    }
  }, [searchParams]);

  // Center Requests State
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  
  // Custom Toasts State
  const [newRechargeToast, setNewRechargeToast] = useState<{
    type: 'center' | 'student';
    title: string;
    subtitle: string;
    amount: number;
    utr: string;
    rawItem?: any;
  } | null>(null);

  const previousRequestsRef = React.useRef<WalletRequest[]>([]);
  const previousStudentRequestsRef = React.useRef<StudentWalletRequest[]>([]);

  // Verification & Approval Modal State (Center)
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [bonusTokens, setBonusTokens] = useState<number>(0);
  const [approvalNote, setApprovalNote] = useState<string>('');

  // Rejection Modal State (Center)
  const [rejectingRequest, setRejectingRequest] = useState<WalletRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment UTR reference not found in bank statement');
  
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Student Requests State
  const [studentRequests, setStudentRequests] = useState<StudentWalletRequest[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [filterStudentStatus, setFilterStudentStatus] = useState<string>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearchTerm, 250);
  const [selectedStudentReq, setSelectedStudentReq] = useState<StudentWalletRequest | null>(null);
  const [rejectingStudentReq, setRejectingStudentReq] = useState<StudentWalletRequest | null>(null);
  const [studentRejectReason, setStudentRejectReason] = useState('Payment reference not found in bank statement');
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Center Requests
  const fetchRequests = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await axios.get(
        `http://localhost:3000/api/admin/wallet-requests${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`,
        { headers: getAuthHeader() }
      ).catch(() => axios.get(`/api/admin/wallet-requests${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`, { headers: getAuthHeader() }));

      if (res.data?.success) {
        const newReqs = res.data.data || [];
        
        if (isBackground && previousRequestsRef.current.length > 0) {
          const prevIds = new Set(previousRequestsRef.current.map((r: WalletRequest) => r.id));
          const newAdded = newReqs.filter((r: WalletRequest) => r.status === 'pending' && !prevIds.has(r.id));
          if (newAdded.length > 0) {
            setNewRechargeToast({
              type: 'center',
              title: 'NEW CENTER TOKEN RECHARGE!',
              subtitle: `${newAdded[0].centerName} (${newAdded[0].centerCode})`,
              amount: newAdded[0].amount,
              utr: newAdded[0].utr_number,
              rawItem: newAdded[0]
            });
            setTimeout(() => setNewRechargeToast(null), 10000);
          }
        }
        previousRequestsRef.current = newReqs;
        setRequests(newReqs);
      }
    } catch (err: any) {
      console.error('Failed to load center wallet requests:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Fetch Student Requests
  const fetchStudentRequests = async (isBackground = false) => {
    try {
      if (!isBackground) setLoadingStudent(true);
      const res = await axios.get(
        `http://localhost:3000/api/admin/student-wallet-requests`,
        { headers: getAuthHeader() }
      )
      .catch(() => axios.get(`/api/admin/student-wallet-requests`, { headers: getAuthHeader() }))
      .catch(() => axios.get(`/api/student/wallet/admin/requests`));

      if (res.data?.success) {
        const list = res.data.data || [];

        if (isBackground && previousStudentRequestsRef.current.length > 0) {
          const prevIds = new Set(previousStudentRequestsRef.current.map((s: StudentWalletRequest) => s.id));
          const newStudentReq = list.filter((s: StudentWalletRequest) => s.status === 'PENDING' && !prevIds.has(s.id));
          if (newStudentReq.length > 0) {
            setNewRechargeToast({
              type: 'student',
              title: 'NEW STUDENT RECHARGE RECEIVED!',
              subtitle: `${newStudentReq[0].student_first_name} ${newStudentReq[0].student_last_name} (${newStudentReq[0].student_phone || 'Student'})`,
              amount: Number(newStudentReq[0].amount),
              utr: newStudentReq[0].utr_number,
              rawItem: newStudentReq[0]
            });
            setTimeout(() => setNewRechargeToast(null), 10000);
          }
        }

        previousStudentRequestsRef.current = list;
        setStudentRequests(list);
      }
    } catch (err: any) {
      console.error('Failed to load student wallet requests:', err);
    } finally {
      if (!isBackground) setLoadingStudent(false);
    }
  };

  const refreshAll = () => {
    fetchRequests();
    fetchStudentRequests();
  };

  useEffect(() => {
    fetchRequests();
    fetchStudentRequests();

    // Throttled SSE & focus sync
    const handleWalletSync = throttle(() => {
      fetchRequests(true);
      fetchStudentRequests(true);
    }, 2000);

    window.addEventListener('wallet-updated', handleWalletSync);
    window.addEventListener('student_wallet_request_created', handleWalletSync);
    window.addEventListener('focus', handleWalletSync);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
        fetchStudentRequests(true);
      }
    }, 45000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('wallet-updated', handleWalletSync);
      window.removeEventListener('student_wallet_request_created', handleWalletSync);
      window.removeEventListener('focus', handleWalletSync);
    };
  }, [filterStatus]);

  // When opening center approval modal
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
        const res = await axios.get(
          `http://localhost:3000/api/admin/wallet-requests/check-duplicate/${req.utr_number}`,
          { headers: getAuthHeader() }
        );
        if (res.data?.success && res.data.data?.isDuplicate) {
          setDuplicateWarning(res.data.data.details);
        }
      } catch (err) {
        console.error('Failed to check duplicate UTR:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }
  };

  // Center Request Handlers
  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setIsSubmitting(true);
      const vAmt = Number(verifiedAmount) || Number(selectedRequest.amount);
      const bTokens = Number(bonusTokens) || 0;
      const total = vAmt + bTokens;

      const res = await axios.post(
        `http://localhost:3000/api/admin/wallet-requests/${selectedRequest.id}/approve`,
        { verifiedAmount: vAmt, bonusTokens: bTokens },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
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
      const res = await axios.post(
        `http://localhost:3000/api/admin/wallet-requests/${rejectingRequest.id}/reject`,
        { reason: rejectReason },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
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

  // Student Request Handlers
  const handleApproveStudent = async () => {
    if (!selectedStudentReq) return;
    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `http://localhost:3000/api/admin/student-wallet-requests/${selectedStudentReq.id}/approve`,
        {},
        { headers: getAuthHeader() }
      ).catch(() => axios.post(
        `/api/student/wallet/admin/requests/${selectedStudentReq.id}/approve`,
        {},
        { headers: getAuthHeader() }
      ));

      if (res.data?.success) {
        setToastMessage({
          type: 'success',
          text: `Approved! ₹${Number(selectedStudentReq.amount).toFixed(2)} credited to ${selectedStudentReq.student_first_name}'s wallet.`
        });
        setSelectedStudentReq(null);
        fetchStudentRequests();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve student request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectStudent = async () => {
    if (!rejectingStudentReq) return;
    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `http://localhost:3000/api/admin/student-wallet-requests/${rejectingStudentReq.id}/reject`,
        { reason: studentRejectReason },
        { headers: getAuthHeader() }
      ).catch(() => axios.post(
        `/api/student/wallet/admin/requests/${rejectingStudentReq.id}/reject`,
        { reason: studentRejectReason },
        { headers: getAuthHeader() }
      ));

      if (res.data?.success) {
        setToastMessage({
          type: 'success',
          text: `Student recharge request #${rejectingStudentReq.id} marked as Rejected.`
        });
        setRejectingStudentReq(null);
        fetchStudentRequests();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject student request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Center Metrics
  const { pendingList, approvedList, rejectedList, pendingSum, approvedSum } = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved');
    const rejected = requests.filter(r => r.status === 'rejected');
    const pSum = pending.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const aSum = approved.reduce((acc, curr) => acc + Number(curr.total_credited || curr.amount || 0), 0);
    return {
      pendingList: pending,
      approvedList: approved,
      rejectedList: rejected,
      pendingSum: pSum,
      approvedSum: aSum
    };
  }, [requests]);

  // Center Filtered
  const filtered = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    if (!term) return requests;
    return requests.filter(r => {
      return (
        r.utr_number?.toLowerCase().includes(term) ||
        r.centerName?.toLowerCase().includes(term) ||
        r.centerCode?.toLowerCase().includes(term)
      );
    });
  }, [requests, debouncedSearchTerm]);

  // Student Metrics
  const { pendingStudentList, approvedStudentList, rejectedStudentList, pendingStudentSum, approvedStudentSum } = useMemo(() => {
    const pending = studentRequests.filter(s => s.status === 'PENDING');
    const approved = studentRequests.filter(s => s.status === 'APPROVED');
    const rejected = studentRequests.filter(s => s.status === 'REJECTED');
    const pSum = pending.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const aSum = approved.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    return {
      pendingStudentList: pending,
      approvedStudentList: approved,
      rejectedStudentList: rejected,
      pendingStudentSum: pSum,
      approvedStudentSum: aSum
    };
  }, [studentRequests]);

  // Student Filtered
  const filteredStudents = useMemo(() => {
    let list = studentRequests;
    if (filterStudentStatus !== 'all') {
      list = list.filter(s => s.status.toLowerCase() === filterStudentStatus.toLowerCase());
    }
    const term = debouncedStudentSearch.toLowerCase().trim();
    if (!term) return list;
    return list.filter(s => {
      return (
        s.utr_number?.toLowerCase().includes(term) ||
        s.student_first_name?.toLowerCase().includes(term) ||
        s.student_last_name?.toLowerCase().includes(term) ||
        s.student_phone?.toLowerCase().includes(term) ||
        s.student_email?.toLowerCase().includes(term) ||
        s.enrollment_no?.toLowerCase().includes(term) ||
        s.center_name?.toLowerCase().includes(term)
      );
    });
  }, [studentRequests, filterStudentStatus, debouncedStudentSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800">
      
      {/* Real-time Notification Banner for Newly Arrived Requests */}
      {newRechargeToast && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-950 text-white rounded-2xl border-2 border-amber-400 p-4 shadow-2xl animate-in slide-in-from-right fade-in flex flex-col gap-3 min-w-[340px]">
          <button onClick={() => setNewRechargeToast(null)} className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer">
            <X size={14} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 shrink-0">
              <Bell size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-amber-400 font-bold text-[11px] tracking-wider uppercase">{newRechargeToast.title}</h4>
              <div className="text-white font-black text-sm">{newRechargeToast.subtitle}</div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 flex justify-between items-center mt-1 border border-white/10">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">UTR: {newRechargeToast.utr || 'N/A'}</div>
              <div className="text-amber-400 font-black text-lg">₹{newRechargeToast.amount}</div>
            </div>
            <button 
              onClick={() => {
                setNewRechargeToast(null);
                if (newRechargeToast.type === 'student') {
                  setActiveTab('student');
                  if (newRechargeToast.rawItem) setSelectedStudentReq(newRechargeToast.rawItem);
                } else {
                  setActiveTab('center');
                  if (newRechargeToast.rawItem) handleSelectRequestForApproval(newRechargeToast.rawItem);
                }
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-md cursor-pointer"
            >
              Verify <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Toast Alert */}
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
              Live Verification & Approvals
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Real-time SSE Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            <span>Wallet Recharge & Token Verification</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify UPI UTR transactions, approve student wallet recharge requests, and manage franchise token liquidity.
          </p>
        </div>

        <button
          onClick={refreshAll}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200 shrink-0"
        >
          <RefreshCw size={14} className={loading || loadingStudent ? 'animate-spin' : ''} />
          <span>Refresh All Queues</span>
        </button>
      </div>

      {/* Dedicated Tab Switcher (Center vs Student) */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('center')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'center'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 size={16} />
          <span>Center / Franchise Topups</span>
          {pendingList.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'center' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
            }`}>
              {pendingList.length} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'student'
              ? 'bg-indigo-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap size={18} />
          <span>Student Wallet Recharges</span>
          {pendingStudentList.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-xs">
              {pendingStudentList.length} PENDING
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CENTER / FRANCHISE TOPUPS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'center' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 4 Center Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pending Card */}
            <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
              pendingList.length > 0 ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${pendingList.length > 0 ? 'text-amber-100' : 'text-slate-500'}`}>
                  Pending Center Approvals
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
                  All time center volume
                </div>
              </div>
            </div>
          </div>

          {/* Center Table & Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                  <span>Pending</span>
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

              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Center, Code, UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Center Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Center Details</th>
                    <th className="py-3 px-4">Requested Tokens</th>
                    <th className="py-3 px-4">UTR / Bank Ref</th>
                    <th className="py-3 px-4">Current Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Requested At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                        <span>Loading center requests...</span>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No center wallet recharge requests found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{req.centerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Code: {req.centerCode}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 text-sm">₹{Number(req.amount).toLocaleString('en-IN')}</div>
                          {req.bonus_tokens > 0 && (
                            <div className="text-[10px] text-emerald-600 font-bold">+₹{req.bonus_tokens} Bonus</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700">{req.utr_number || 'N/A'}</span>
                            {req.utr_number && (
                              <button 
                                onClick={() => handleCopyUtr(req.utr_number)} 
                                className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Copy UTR"
                              >
                                {copiedUtr === req.utr_number ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">₹{Number(req.currentBalance || 0).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock size={10} /> Pending
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 size={10} /> Approved
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(req.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSelectRequestForApproval(req)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                              >
                                <CheckCircle2 size={13} />
                                <span>Verify</span>
                              </button>
                              <button
                                onClick={() => setRejectingRequest(req)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENT WALLET RECHARGES                                           */}
      {/* ========================================================================= */}
      {activeTab === 'student' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 4 Student Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pending Student Card */}
            <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
              pendingStudentList.length > 0 ? 'bg-indigo-900 text-white border-indigo-800 shadow-indigo-900/30' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${pendingStudentList.length > 0 ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Pending Student Requests
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  pendingStudentList.length > 0 ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black tracking-tight">
                  {pendingStudentList.length} <span className="text-lg font-semibold">({`₹${pendingStudentSum.toLocaleString('en-IN')}`})</span>
                </div>
                <div className={`text-[11px] font-medium mt-1 ${pendingStudentList.length > 0 ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Requires UTR & proof check
                </div>
              </div>
            </div>

            {/* Total Student Approved */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Volume</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  ₹{approvedStudentSum.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1">
                  {approvedStudentList.length} recharges credited
                </div>
              </div>
            </div>

            {/* Rejected Student */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected Requests</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <XCircle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-800 tracking-tight">
                  {rejectedStudentList.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1">
                  Invalid payment attempts
                </div>
              </div>
            </div>

            {/* Total Student Submissions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <GraduationCap size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {studentRequests.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1">
                  Lifetime student recharge requests
                </div>
              </div>
            </div>
          </div>

          {/* Student Table & Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterStudentStatus('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    filterStudentStatus === 'all' 
                      ? 'bg-indigo-900 text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  All Requests ({studentRequests.length})
                </button>
                <button
                  onClick={() => setFilterStudentStatus('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    filterStudentStatus === 'pending' 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>Pending</span>
                  {pendingStudentList.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-rose-600">
                      {pendingStudentList.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilterStudentStatus('approved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    filterStudentStatus === 'approved' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Approved ({approvedStudentList.length})
                </button>
                <button
                  onClick={() => setFilterStudentStatus('rejected')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    filterStudentStatus === 'rejected' 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Rejected ({rejectedStudentList.length})
                </button>
              </div>

              <div className="relative min-w-[260px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Student, Phone, UTR, Roll..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Student Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Amount & Balance</th>
                    <th className="py-3 px-4">UTR Number</th>
                    <th className="py-3 px-4 text-center">Payment Proof</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStudent ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                        <span>Loading student requests...</span>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No student wallet recharge requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((sReq) => (
                      <tr key={sReq.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {sReq.student_first_name} {sReq.student_last_name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            {sReq.student_phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone size={10} className="text-slate-400" />
                                {sReq.student_phone}
                              </span>
                            )}
                            {sReq.enrollment_no && (
                              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                {sReq.enrollment_no}
                              </span>
                            )}
                          </div>
                          {sReq.student_email && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{sReq.student_email}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-black text-indigo-900 text-sm">
                            ₹{Number(sReq.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Current: ₹{Number(sReq.student_current_balance || 0).toFixed(2)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {sReq.utr_number}
                            </span>
                            <button
                              onClick={() => handleCopyUtr(sReq.utr_number)}
                              className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                              title="Copy UTR"
                            >
                              {copiedUtr === sReq.utr_number ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {sReq.screenshot_url ? (
                            <button
                              onClick={() => setPreviewScreenshotUrl(sReq.screenshot_url || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 cursor-pointer transition-colors"
                            >
                              <Eye size={12} />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No receipt attached</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {sReq.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              <Clock size={10} /> Pending Verification
                            </span>
                          )}
                          {sReq.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 size={10} /> Credited
                            </span>
                          )}
                          {sReq.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(sReq.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {sReq.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedStudentReq(sReq)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                              >
                                <CheckCircle2 size={13} />
                                <span>Verify & Approve</span>
                              </button>
                              <button
                                onClick={() => setRejectingStudentReq(sReq)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Student Request Approval Confirmation                              */}
      {/* ========================================================================= */}
      {selectedStudentReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base">Approve Student Wallet Recharge</h3>
                  <p className="text-[11px] text-emerald-100">Verify payment UTR and credit wallet balance</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentReq(null)} 
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Student Name:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {selectedStudentReq.student_first_name} {selectedStudentReq.student_last_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Phone / Roll:</span>
                  <span className="font-mono text-slate-800">{selectedStudentReq.student_phone || 'N/A'} ({selectedStudentReq.enrollment_no || 'N/A'})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Submitted UTR Ref:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedStudentReq.utr_number}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Recharge Amount:</span>
                  <span className="font-black text-emerald-700 text-xl">
                    ₹{Number(selectedStudentReq.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {selectedStudentReq.screenshot_url && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Submitted Payment Screenshot:</label>
                  <div 
                    onClick={() => setPreviewScreenshotUrl(selectedStudentReq.screenshot_url || null)}
                    className="border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 max-h-40 flex items-center justify-center bg-slate-900/5 group relative"
                  >
                    <img 
                      src={selectedStudentReq.screenshot_url} 
                      alt="Payment Proof" 
                      className="max-h-40 w-auto object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold gap-1 text-xs transition-opacity">
                      <Eye size={14} /> Click to Enlarge
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                Clicking confirm will atomically credit <strong>₹{Number(selectedStudentReq.amount).toFixed(2)}</strong> to student's wallet and log a verified ledger credit transaction.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedStudentReq(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveStudent}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? 'Crediting Wallet...' : `Approve & Credit ₹${Number(selectedStudentReq.amount).toFixed(0)}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Student Request Rejection                                          */}
      {/* ========================================================================= */}
      {rejectingStudentReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle size={18} />
                <h3 className="font-bold text-sm">Reject Student Recharge Request</h3>
              </div>
              <button 
                onClick={() => setRejectingStudentReq(null)} 
                className="text-rose-200 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-950">
                <div><strong>Student:</strong> {rejectingStudentReq.student_first_name} {rejectingStudentReq.student_last_name}</div>
                <div><strong>Amount:</strong> ₹{rejectingStudentReq.amount}</div>
                <div><strong>UTR:</strong> {rejectingStudentReq.utr_number}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  value={studentRejectReason}
                  onChange={(e) => setStudentRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-600"
                  placeholder="Explain why this recharge request is rejected..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingStudentReq(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectStudent}
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

      {/* ========================================================================= */}
      {/* MODAL: Full Screen Screenshot Lightbox Preview                            */}
      {/* ========================================================================= */}
      {previewScreenshotUrl && (
        <div 
          onClick={() => setPreviewScreenshotUrl(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-700"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-amber-400" />
                <span className="font-bold text-sm">UPI Payment Proof Receipt</span>
              </div>
              <button 
                onClick={() => setPreviewScreenshotUrl(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/20 max-h-[75vh]">
              <img 
                src={previewScreenshotUrl} 
                alt="Payment Receipt" 
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Verify UTR and timestamp against bank records</span>
              <a 
                href={previewScreenshotUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline"
              >
                Open Original Image <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXISTING MODALS FOR CENTER REQUESTS (Preserved 100%)                       */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300">
            
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-400" />
                <h3 className="font-bold text-sm">Verify Bank Payment & Issue Tokens</h3>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div><strong>Center:</strong> {selectedRequest.centerName} ({selectedRequest.centerCode})</div>
                <div><strong>Current Balance:</strong> ₹{Number(selectedRequest.currentBalance || 0).toLocaleString('en-IN')} Tokens</div>
                <div className="flex items-center gap-2">
                  <strong>Bank UTR:</strong> 
                  <span className="font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    {selectedRequest.utr_number}
                  </span>
                  <button 
                    onClick={() => handleCopyUtr(selectedRequest.utr_number)}
                    className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    {copiedUtr === selectedRequest.utr_number ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {duplicateWarning && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertCircle size={14} /> Duplicate UTR Detected!
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This UTR was already approved for <strong>{duplicateWarning.center_name}</strong> on {new Date(duplicateWarning.approved_at).toLocaleDateString('en-IN')}.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verified Received Amount (₹) *</label>
                <input
                  type="number"
                  value={verifiedAmount}
                  onChange={(e) => setVerifiedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bonus Incentive Tokens (₹)</label>
                <input
                  type="number"
                  value={bonusTokens}
                  onChange={(e) => setBonusTokens(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600"
                  placeholder="Optional bonus tokens"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-amber-950">Total Tokens to Credit:</span>
                <span className="font-black text-amber-900 text-base">
                  ₹{(Number(verifiedAmount) + Number(bonusTokens)).toLocaleString('en-IN')} Tokens
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
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
        </div>
      )}

      {/* Reject Center Modal */}
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
