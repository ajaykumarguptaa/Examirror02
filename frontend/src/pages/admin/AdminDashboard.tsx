import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  BookOpen, 
  Wallet, 
  IndianRupee, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Trash2, 
  ShieldCheck, 
  Send, 
  X,
  CreditCard,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  List,
  Mail,
  Calendar,
  Phone,
  FileText,
  Copy,
  Check,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Award,
  FileSpreadsheet,
  Download,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  PenTool,
  Megaphone,
  Trophy,
  ShoppingBag,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DeleteConfirmCaptchaModal from '../../components/DeleteConfirmCaptchaModal';
import { AuthoritySignatureModal } from '../../components/admin/AuthoritySignatureModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { NumberCounter, StaggerContainer, StaggerItem, InteractiveCard, FadeUp } from '../../motion';

interface CenterItem {
  id: number;
  center_code: string;
  name: string;
  email: string;
  wallet_balance: number;
  created_at: string;
  studentsCount: number;
}

interface WalletRequestItem {
  id: number;
  centerId: number;
  centerName: string;
  centerCode: string;
  amount: number;
  utr_number: string;
  bonus_tokens: number;
  total_credited: number;
  status: 'pending' | 'approved' | 'rejected';
  narration: string;
  created_at: string;
}

interface ActivityItem {
  recentTransactions: Array<{
    id: number;
    centerId: number;
    centerName: string;
    centerCode: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
  }>;
  recentStudents: Array<{
    id: number;
    firstName: string;
    lastName: string;
    centerName: string;
    centerCode: string;
    courseName: string;
    academic_status: string;
    created_at: string;
  }>;
}

interface AnalyticsData {
  monthlyAdmissions: Array<{ monthName: string; count: number }>;
  coursesDistribution: Array<{ name: string; value: number }>;
  statusDistribution: { passout: number; pursuing: number };
  tokenMetrics: { totalCredited: number; totalDebited: number };
  topCenters: Array<{ name: string; center_code: string; wallet_balance: number; studentCount: number }>;
  testSeriesAnalytics?: {
    totalPurchases: number;
    totalRevenue: number;
    totalEnrollments: number;
    uniqueStudents: number;
    topSeries: Array<{
      id: number;
      title: string;
      price: number;
      purchasesCount: number;
      totalRevenue: number;
    }>;
  };
  notesAnalytics?: {
    totalPurchases: number;
    studentPurchases: number;
    centerPurchases: number;
    totalRevenue: number;
    studentRevenue: number;
    centerRevenue: number;
    topNotes: Array<{
      id: number;
      title: string;
      studentPrice: number;
      centerPrice: number;
      purchasesCount: number;
      totalRevenue: number;
    }>;
  };
  digitalProductsRevenue?: {
    totalRevenue: number;
    testSeriesRevenue: number;
    notesRevenue: number;
    totalPurchases: number;
  };
}

interface CenterDetailPayload {
  center: CenterItem & { phone?: string; address?: string };
  students: Array<any>;
  transactions: Array<any>;
  walletRequests: Array<any>;
}

const BAR_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCenters: 0,
    totalStudents: 0,
    totalCourses: 0,
    pendingWalletRequests: 0,
    totalWalletsSum: 0
  });

  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<WalletRequestItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem>({ recentTransactions: [], recentStudents: [] });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Announcement Modal State
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', expiryDate: '' });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAnalyticsTab, setShowAnalyticsTab] = useState<'overview' | 'analytics'>('overview');

  // Center Details Modal State (Triggered by clicking any Center Card)
  const [selectedCenterDetail, setSelectedCenterDetail] = useState<CenterDetailPayload | null>(null);
  const [loadingCenterDetail, setLoadingCenterDetail] = useState(false);
  const [centerModalTab, setCenterModalTab] = useState<'students' | 'transactions' | 'requests'>('students');

  // Modals
  const [walletModalCenter, setWalletModalCenter] = useState<CenterItem | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Quick Approval Modal
  const [selectedRequest, setSelectedRequest] = useState<WalletRequestItem | null>(null);
  const [bonusTokens, setBonusTokens] = useState<number>(0);
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Center Deletion with Captcha
  const [deleteCenterTarget, setDeleteCenterTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingCenter, setIsDeletingCenter] = useState(false);

  // Center Password Reset Modal
  const [passwordModalCenter, setPasswordModalCenter] = useState<CenterItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Test Series Payment Approvals & History
  const [testSeriesPayments, setTestSeriesPayments] = useState<any[]>([]);
  const [testSeriesPaymentFilter, setTestSeriesPaymentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [viewingTestScreenshot, setViewingTestScreenshot] = useState<string | null>(null);
  const [rejectingTestPayment, setRejectingTestPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Authority Digital Signature Modal
  const [isAuthoritySignModalOpen, setIsAuthoritySignModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, centersRes, requestsRes, activitiesRes, analyticsRes, testPaymentsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/stats').catch(() => ({ data: { success: false } })),
        axios.get('http://localhost:3000/api/admin/centers').catch(() => ({ data: { success: false } })),
        axios.get('http://localhost:3000/api/admin/wallet-requests?status=pending').catch(() => ({ data: { success: false } })),
        axios.get('http://localhost:3000/api/admin/activities').catch(() => ({ data: { success: false } })),
        axios.get('http://localhost:3000/api/admin/analytics').catch(() => ({ data: { success: false } })),
        axios.get('http://localhost:3000/api/admin/payments?status=ALL').catch(() => ({ data: { success: false } }))
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (centersRes.data?.success) {
        setCenters(centersRes.data.data || []);
      }
      if (requestsRes.data?.success) {
        setPendingRequests(requestsRes.data.data || []);
      }
      if (activitiesRes.data?.success) {
        setActivities(activitiesRes.data.data || { recentTransactions: [], recentStudents: [] });
      }
      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data || null);
      }
      if (testPaymentsRes.data?.success) {
        setTestSeriesPayments(testPaymentsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTestPayment = async (paymentId: number) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/payments/${paymentId}/approve`);
      setToastMessage({ type: 'success', text: res.data?.message || 'Test Series payment approved and access activated!' });
      fetchDashboardData();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve payment' });
    }
  };

  const handleRejectTestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTestPayment) return;
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/payments/${rejectingTestPayment.id}/reject`, {
        reason: rejectReason || 'Transaction reference or screenshot invalid'
      });
      setToastMessage({ type: 'success', text: res.data?.message || 'Payment request rejected.' });
      setRejectingTestPayment(null);
      setRejectReason('');
      fetchDashboardData();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject payment' });
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setToastMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }
    
    try {
      setAnnouncementSubmitting(true);
      const res = await axios.post('http://localhost:3000/api/admin/announcements', {
        title: announcementForm.title,
        message: announcementForm.message,
        expiryDate: announcementForm.expiryDate || null
      });
      
      if (res.data.success) {
        setToastMessage({ type: 'success', text: 'Global announcement broadcasted successfully!' });
        setIsAnnouncementModalOpen(false);
        setAnnouncementForm({ title: '', message: '', expiryDate: '' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to broadcast announcement' });
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch full center detail when a card is clicked
  const handleOpenCenterDetails = async (centerId: number) => {
    try {
      setLoadingCenterDetail(true);
      const res = await axios.get(`http://localhost:3000/api/admin/centers/${centerId}`);
      if (res.data.success) {
        setSelectedCenterDetail(res.data.data);
        setCenterModalTab('students');
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load center details' });
    } finally {
      setLoadingCenterDetail(false);
    }
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalCenter) return;
    const amt = Number(adjustAmount);
    if (!amt || amt <= 0) {
      setToastMessage({ type: 'error', text: 'Please enter a valid token amount' });
      return;
    }

    if (adjustType === 'debit' && (!adjustReason || !adjustReason.trim())) {
      setToastMessage({ 
        type: 'error', 
        text: 'Deduction Reason is mandatory! Please specify why tokens are being deducted.' 
      });
      return;
    }

    try {
      setAdjustLoading(true);
      const res = await axios.post(`http://localhost:3000/api/admin/centers/${walletModalCenter.id}/wallet-adjust`, {
        amount: amt,
        type: adjustType,
        reason: adjustReason.trim() || `Manual ${adjustType} by Super Admin`
      });

      if (res.data.success) {
        setToastMessage({ 
          type: 'success', 
          text: `Successfully ${adjustType === 'credit' ? 'credited' : 'deducted'} ₹${amt} tokens for ${walletModalCenter.name} (Reason: ${adjustReason.trim() || 'Manual Adjustment'})` 
        });
        setWalletModalCenter(null);
        setAdjustAmount('');
        setAdjustReason('');
        fetchDashboardData();
        if (selectedCenterDetail && selectedCenterDetail.center.id === walletModalCenter.id) {
          handleOpenCenterDetails(walletModalCenter.id);
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to adjust wallet balance' });
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    try {
      setSubmittingApprove(true);
      const res = await axios.post(`http://localhost:3000/api/admin/wallet-requests/${selectedRequest.id}/approve`, {
        bonusTokens: Number(bonusTokens) || 0
      });
      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: `Approved ₹${selectedRequest.amount} (+₹${bonusTokens} bonus) for ${selectedRequest.centerName}`
        });
        setSelectedRequest(null);
        setBonusTokens(0);
        fetchDashboardData();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve request' });
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleConfirmDeleteCenter = async () => {
    if (!deleteCenterTarget) return;
    try {
      setIsDeletingCenter(true);
      const res = await axios.delete(`http://localhost:3000/api/admin/centers/${deleteCenterTarget.id}`);
      if (res.data.success) {
        setToastMessage({ type: 'success', text: `Center "${deleteCenterTarget.name}" deleted successfully` });
        if (selectedCenterDetail && selectedCenterDetail.center.id === deleteCenterTarget.id) {
          setSelectedCenterDetail(null);
        }
        setDeleteCenterTarget(null);
        fetchDashboardData();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete center' });
    } finally {
      setIsDeletingCenter(false);
    }
  };

  const handleQuickExportCenter = async (centerId: number, centerCode: string, centerName: string) => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const res = await axios.get(`http://localhost:3000/api/admin/export/center/${centerId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Center_${centerCode}_Backup_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToastMessage({ type: 'success', text: `Center "${centerName}" Excel backup downloaded!` });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: 'Failed to export center backup: ' + err.message });
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    let generated = 'Center@';
    for (let i = 0; i < 4; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setPasswordError(null);
  };

  const handleUpdateCenterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalCenter) return;
    setPasswordError(null);

    if (!newPassword || newPassword.trim().length < 4) {
      setPasswordError('Password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await axios.post(`http://localhost:3000/api/admin/centers/${passwordModalCenter.id}/password`, {
        newPassword
      });

      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: `Password updated successfully for ${passwordModalCenter.name} (${passwordModalCenter.center_code})`
        });
        setPasswordModalCenter(null);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update center password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const filteredCenters = centers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.center_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sample data fallback for charts if zero entries
  const monthlyChartData = analytics?.monthlyAdmissions && analytics.monthlyAdmissions.length > 0 
    ? analytics.monthlyAdmissions 
    : [
        { monthName: 'May 2026', count: 12 },
        { monthName: 'Jun 2026', count: 18 },
        { monthName: 'Jul 2026', count: 26 },
        { monthName: 'Aug 2026', count: 35 },
        { monthName: 'Sep 2026', count: Number(stats.totalStudents) || 45 }
      ];

  const courseChartData = analytics?.coursesDistribution && analytics.coursesDistribution.length > 0
    ? analytics.coursesDistribution
    : [
        { name: 'ADCA', value: 38 },
        { name: 'DCA', value: 24 },
        { name: 'Web Dev', value: 19 },
        { name: 'Tally Prime', value: 15 },
        { name: 'Python', value: 11 }
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      
      {/* Toast Message */}
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

      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <ShieldCheck size={13} />
              Super Admin Control Center
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Real-time System Node
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
            Institutional Administration & Analytics Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time admission velocity, verify token liquidity, inspect branch networks, and analyze institutional metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Section View Switcher (Overview vs Deep Analytics) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowAnalyticsTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAnalyticsTab === 'overview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAnalyticsTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAnalyticsTab === 'analytics' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Growth Analytics</span>
            </button>
          </div>

          <button
            onClick={() => fetchDashboardData()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center transition-colors cursor-pointer border border-slate-200"
            title="Refresh Live Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsAuthoritySignModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Configure Official Authority Digital Signature & Seal"
          >
            <PenTool size={13} />
            <span>Authority E-Sign</span>
          </button>

          <Link
            to="/admin/centers/create"
            className="px-4 py-2 rounded-xl bg-[#1e1b4b] hover:bg-[#2e2b5e] text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Center</span>
          </Link>
        </div>
      </div>

      {/* 5 High-Impact Modern Stat Metric Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Centers */}
        <StaggerItem>
          <InteractiveCard className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorized Centers</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Building2 size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                <NumberCounter value={stats.totalCenters} durationMs={800} />
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-blue-600 font-bold">Active</span> branch network
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Card 2: Total Enrolled Students */}
        <StaggerItem>
          <InteractiveCard className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                <NumberCounter value={stats.totalStudents} durationMs={800} />
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-bold">Verified</span> admissions
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Card 3: Total Courses */}
        <StaggerItem>
          <InteractiveCard className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Courses</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                <NumberCounter value={stats.totalCourses} durationMs={800} />
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-purple-600 font-bold">Vocational</span> syllabus
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Card 4: Total Wallets Pool */}
        <StaggerItem>
          <InteractiveCard className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Centers Wallet Pool</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <IndianRupee size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-indigo-700 tracking-tight">
                <NumberCounter value={stats.totalWalletsSum} prefix="₹" durationMs={900} />
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">
                Total circulating token balance
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Card 5: Pending Wallet Requests */}
        <StaggerItem>
          <Link
            to="/admin/wallet-requests"
            className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-1 block h-full ${
              stats.pendingWalletRequests > 0 
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200' 
                : 'bg-white border-slate-200/90 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${stats.pendingWalletRequests > 0 ? 'text-amber-100' : 'text-slate-500'}`}>
                Pending Requests
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stats.pendingWalletRequests > 0 ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                <Wallet size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight">
                <NumberCounter value={stats.pendingWalletRequests} durationMs={800} />
              </div>
              <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${
                stats.pendingWalletRequests > 0 ? 'text-amber-100' : 'text-slate-500'
              }`}>
                <span>Review recharge queue</span>
                <ArrowUpRight size={13} />
              </div>
            </div>
          </Link>
        </StaggerItem>

      </StaggerContainer>

      {/* ========================================================================= */}
      {/* INTERACTIVE ANALYTICS SUITE (NEW FEATURE) */}
      {/* ========================================================================= */}
      {showAnalyticsTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Charts Row 1: Admissions Growth & Popular Courses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Admissions Velocity Area Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <span>Student Admissions Growth Trend</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Monthly new student enrollments across study centers</p>
                </div>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                  Network Growth
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} dy={5} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs font-mono">
                              <div className="text-slate-400 text-[10px]">{label}</div>
                              <div className="font-bold text-amber-400 text-sm mt-0.5">
                                {payload[0].value} Enrolled Students
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#admissionGradient)" 
                      dot={{ r: 4, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#fbbf24', stroke: '#1e1b4b', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Popular Courses & Enrollments Ranking */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-600" />
                    <span>Popular Courses & Enrollments</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Student enrollment distribution by diploma & certificate course</p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  Course Demand
                </span>
              </div>

              {/* Clean Modern Progress Meter List */}
              <div className="space-y-3 pt-1">
                {courseChartData.slice(0, 5).map((course: any, index: number) => {
                  const maxVal = Math.max(...courseChartData.map((c: any) => c.value), 1);
                  const pct = Math.min(100, Math.round((course.value / maxVal) * 100));
                  const colors = [
                    'bg-indigo-600',
                    'bg-blue-600',
                    'bg-emerald-600',
                    'bg-amber-500',
                    'bg-purple-600'
                  ];
                  const barColor = colors[index % colors.length];

                  return (
                    <div key={course.name + index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[240px]" title={course.fullName || course.name}>
                          {course.fullName || course.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="font-black text-slate-900">{course.value} Students</span>
                          <span className="text-slate-400 text-[10px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Analytics Row 2: Top Centers Leaderboard & Token Liquidity Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Centers Leaderboard */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    <span>Top Performing Study Centers</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Ranked by total enrolled student volume</p>
                </div>
                <span className="text-xs font-bold text-slate-400">Institutional Ranking</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2 px-3">Rank & Center</th>
                      <th className="py-2 px-3">Center Code</th>
                      <th className="py-2 px-3 text-center">Students</th>
                      <th className="py-2 px-3 text-right">Wallet Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {centers.slice(0, 5).map((c, index) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              index === 0 ? 'bg-amber-100 text-amber-800' : index === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-800'
                            }`}>
                              #{index + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[10px] text-slate-400">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {c.center_code}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            {c.studentsCount || 0} Students
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          ₹{Number(c.wallet_balance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Academic Status & Liquidity Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 flex flex-col justify-between">
              <div className="border-b pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-600" />
                  <span>Academic Status Ratio</span>
                </h3>
                <p className="text-[11px] text-slate-500">Currently Pursuing vs Passout Ratio</p>
              </div>

              <div className="space-y-4 py-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-700">Currently Pursuing Students</span>
                    <span className="text-slate-900">{analytics?.statusDistribution?.pursuing || stats.totalStudents}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-700">Passout (Certified) Graduates</span>
                    <span className="text-slate-900">{analytics?.statusDistribution?.passout || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 mt-auto">
                <div className="font-bold text-slate-800">Token Liquidity Health</div>
                <div className="text-[11px] text-slate-500">
                  Total Wallets Pool: <strong className="text-indigo-700">₹{Number(stats.totalWalletsSum).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* DIGITAL PRODUCTS MONETIZATION ANALYTICS (TEST SERIES & STUDY NOTES) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
            
            {/* Header with Title and Combined Revenue Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Trophy size={18} />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Digital Products & Monetization Analytics
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                    Test Series & Notes
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Live tracking of Test Series sales, study note unlocks, and total revenue generated across students & centers.
                </p>
              </div>

              {/* Combined Revenue Highlight Pill */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-4 py-2.5 rounded-xl shadow-xs self-start sm:self-auto">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <IndianRupee size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Combined Digital Earnings</div>
                  <div className="text-lg font-black text-amber-400">
                    ₹{(analytics?.digitalProductsRevenue?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Core Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Test Series Purchased */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 p-4 rounded-xl border border-indigo-100/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Test Series Bought</span>
                  <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <ShoppingBag size={15} />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {analytics?.testSeriesAnalytics?.totalPurchases || 0}
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">Packs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold mt-1">
                    <UserCheck size={12} />
                    <span>{analytics?.testSeriesAnalytics?.totalEnrollments || 0} Total Active Enrollments</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-indigo-100">
                  {analytics?.testSeriesAnalytics?.uniqueStudents || 0} Unique Candidate Buyers
                </div>
              </div>

              {/* Card 2: Test Series Total Earning */}
              <div className="bg-gradient-to-br from-emerald-50/60 to-slate-50 p-4 rounded-xl border border-emerald-100/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Test Series Earning</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <IndianRupee size={15} />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-700">
                    ₹{(analytics?.testSeriesAnalytics?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                    <CheckCircle2 size={12} />
                    <span>Verified UTR & QR Collections</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-emerald-100">
                  From {analytics?.testSeriesAnalytics?.totalPurchases || 0} Approved Transactions
                </div>
              </div>

              {/* Card 3: Notes / Study Material Purchased */}
              <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 p-4 rounded-xl border border-blue-100/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Notes & Materials Bought</span>
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText size={15} />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {analytics?.notesAnalytics?.totalPurchases || 0}
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">Unlocks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold mt-1">
                    <Building2 size={12} />
                    <span>{analytics?.notesAnalytics?.centerPurchases || 0} Center B2B • {analytics?.notesAnalytics?.studentPurchases || 0} Direct Student</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-blue-100">
                  Across E-Notes, Handbooks & PDF Guides
                </div>
              </div>

              {/* Card 4: Notes Total Earning */}
              <div className="bg-gradient-to-br from-amber-50/60 to-slate-50 p-4 rounded-xl border border-amber-100/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Notes Total Earning</span>
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <TrendingUp size={15} />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-700">
                    ₹{(analytics?.notesAnalytics?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold mt-1">
                    <Wallet size={12} />
                    <span>₹{(analytics?.notesAnalytics?.centerRevenue || 0).toLocaleString('en-IN')} B2B • ₹{(analytics?.notesAnalytics?.studentRevenue || 0).toLocaleString('en-IN')} B2C</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-amber-100">
                  Total revenue collected from Study Passes
                </div>
              </div>

            </div>

            {/* Visual Revenue Share Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Monetization Split: Test Series vs Notes</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Total: ₹{(analytics?.digitalProductsRevenue?.totalRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              {(() => {
                const total = Math.max(1, (analytics?.digitalProductsRevenue?.totalRevenue || 0));
                const tsRev = analytics?.testSeriesAnalytics?.totalRevenue || 0;
                const notesRev = analytics?.notesAnalytics?.totalRevenue || 0;
                const tsPct = Math.round((tsRev / total) * 100);
                const notesPct = 100 - tsPct;
                return (
                  <div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${tsPct}%` }}
                        title={`Test Series Revenue: ₹${tsRev} (${tsPct}%)`}
                      />
                      <div 
                        className="bg-amber-500 h-full transition-all duration-500" 
                        style={{ width: `${notesPct}%` }}
                        title={`Notes Revenue: ₹${notesRev} (${notesPct}%)`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold pt-1.5">
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Test Series Revenue: ₹{tsRev.toLocaleString('en-IN')} ({tsPct}%)
                      </span>
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Notes Revenue: ₹{notesRev.toLocaleString('en-IN')} ({notesPct}%)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Top Selling Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
              
              {/* Table 1: Top Performing Test Series */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={15} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Top Earning Test Series</span>
                  </div>
                  <Link 
                    to="/admin/test-series" 
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-white">
                        <th className="py-2.5 px-3">Test Series Title</th>
                        <th className="py-2.5 px-3 text-center">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Purchases</th>
                        <th className="py-2.5 px-3 text-right">Total Earning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics?.testSeriesAnalytics?.topSeries && analytics.testSeriesAnalytics.topSeries.length > 0 ? (
                        analytics.testSeriesAnalytics.topSeries.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[180px]" title={s.title}>
                              {s.title}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              ₹{s.price}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold text-[11px]">
                                {s.purchasesCount}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-700 font-mono">
                              ₹{s.totalRevenue.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                            No paid test series purchases recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Top Performing Notes & Study Materials */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-amber-600" />
                    <span className="text-xs font-bold text-slate-800">Top Earning Study Notes</span>
                  </div>
                  <Link 
                    to="/admin/test-series" 
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <span>Manage Notes</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-white">
                        <th className="py-2.5 px-3">Note Title</th>
                        <th className="py-2.5 px-3 text-center">Pricing</th>
                        <th className="py-2.5 px-3 text-center">Unlocks</th>
                        <th className="py-2.5 px-3 text-right">Total Earning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics?.notesAnalytics?.topNotes && analytics.notesAnalytics.topNotes.length > 0 ? (
                        analytics.notesAnalytics.topNotes.map((n) => (
                          <tr key={n.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[180px]" title={n.title}>
                              {n.title}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                              {n.centerPrice > 0 ? `₹${n.centerPrice} B2B` : `₹${n.studentPrice}`}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold text-[11px]">
                                {n.purchasesCount}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-amber-700 font-mono">
                              ₹{n.totalRevenue.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                            No study material purchases recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Quick Pending Wallet Queue Strip (if any pending) */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-bold text-sm text-amber-900">
                Action Required: {pendingRequests.length} Pending Recharge Requests
              </h3>
            </div>
            <Link to="/admin/wallet-requests" className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1">
              View Full Queue <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{req.centerName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">UTR: {req.utr_number}</div>
                  <div className="text-sm font-black text-indigo-700 mt-1">₹{Number(req.amount).toLocaleString('en-IN')}</div>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN SECTION: REGISTERED STUDY CENTERS (CARDS / TABLE VIEW) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Section Header with View Toggle & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" />
              <span>Registered Study Centers</span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                {filteredCenters.length} Centers
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any center card to inspect enrolled students, wallet transactions ledger, and recharge history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards Layout"
              >
                <LayoutGrid size={14} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table Layout"
              >
                <List size={14} />
                <span>Table</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search center code, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <Link
              to="/admin/backup-export"
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Super Admin Complete Excel Backup Vault"
            >
              <FileSpreadsheet size={14} />
              <span>Backup Hub</span>
            </Link>

            <Link
              to="/admin/centers/create"
              className="px-3.5 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> New Center
            </Link>

            <button
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Megaphone size={14} /> Broadcast
            </button>
          </div>
        </div>

        {/* CARDS GRID LAYOUT */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCenters.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 font-medium">
                No centers found matching your search.
              </div>
            ) : (
              filteredCenters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleOpenCenterDetails(c.id)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  {/* Top Bar inside Card */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                        {c.center_code}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Center</span>
                      </span>
                    </div>

                    <h3 className="text-[15px] font-semibold text-slate-900 mt-3.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {c.name}
                    </h3>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{c.email || 'No email provided'}</span>
                    </div>
                  </div>

                  {/* Metrics Box inside Card */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Students
                      </span>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Users size={14} className="text-slate-500" />
                        <span>{c.studentsCount || 0}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Wallet Balance
                      </span>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        ₹{Number(c.wallet_balance || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCenterDetails(c.id);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Details</span>
                      <ChevronRight size={13} />
                    </button>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleQuickExportCenter(c.id, c.center_code, c.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Export Excel Backup"
                      >
                        <FileSpreadsheet size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPasswordModalCenter(c);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError(null);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Change Center Password"
                      >
                        <KeyRound size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWalletModalCenter(c);
                          setAdjustType('credit');
                          setAdjustAmount('');
                          setAdjustReason('');
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Adjust Wallet Tokens"
                      >
                        <CreditCard size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteCenterTarget({ id: c.id, name: c.name })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* TABLE VIEW (Minimal & Clean) */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-5 whitespace-nowrap">Center Code</th>
                    <th className="py-3 px-4">Institute & Contact</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-right">Wallet Balance</th>
                    <th className="py-3 px-5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCenters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No centers found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCenters.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Center Code */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
                            {c.center_code}
                          </span>
                        </td>

                        {/* Center Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">{c.email}</div>
                        </td>

                        {/* Students */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full text-xs">
                            <Users size={12} className="text-slate-400" />
                            <span>{c.studentsCount || 0}</span>
                          </span>
                        </td>

                        {/* Wallet Balance */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">
                            ₹{Number(c.wallet_balance || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenCenterDetails(c.id)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            >
                              <span>Details</span>
                              <ChevronRight size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickExportCenter(c.id, c.center_code, c.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Export Excel Backup"
                            >
                              <FileSpreadsheet size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPasswordModalCenter(c);
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordError(null);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setWalletModalCenter(c);
                                setAdjustType('credit');
                                setAdjustAmount('');
                                setAdjustReason('');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Adjust Wallet Tokens"
                            >
                              <CreditCard size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteCenterTarget({ id: c.id, name: c.name })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Center"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>

      {/* Two-Column Real-Time Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Recent Wallet Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wallet size={16} className="text-indigo-600" />
              <span>Recent Wallet Activity Across Network</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Live Ledger</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {activities.recentTransactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No transactions recorded yet.</div>
            ) : (
              activities.recentTransactions.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      t.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {t.type === 'credit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{t.centerName} ({t.centerCode})</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{t.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${t.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Latest Student Admissions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-600" />
              <span>Latest Student Admissions</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Network Enrollment</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {activities.recentStudents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No student admissions recorded yet.</div>
            ) : (
              activities.recentStudents.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {s.firstName?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{s.firstName} {s.lastName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{s.courseName || 'Computer Course'} • {s.centerName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.academic_status === 'passout' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {s.academic_status === 'passout' ? 'Passout' : 'Enrolled'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(s.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION: TEST SERIES PAYMENT VERIFICATION & APPROVAL HISTORY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-purple-600" />
              <span>Test Series Payment & Approval History</span>
              {testSeriesPayments.filter(p => p.status === 'PENDING').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] animate-pulse">
                  {testSeriesPayments.filter(p => p.status === 'PENDING').length} Pending Review
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Review student UPI payments, verify UTR reference numbers, and approve live mock test series access.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTestSeriesPaymentFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    testSeriesPaymentFilter === tab
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Link
              to="/admin/test-series"
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-purple-200 transition-colors"
            >
              <span>Test Series Master</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Payments Table */}
        {(() => {
          const filtered = testSeriesPayments.filter(p => {
            if (testSeriesPaymentFilter === 'ALL') return true;
            return p.status === testSeriesPaymentFilter;
          });

          if (filtered.length === 0) {
            return (
              <div className="py-10 text-center text-xs text-slate-400">
                No test series payment records found under "{testSeriesPaymentFilter}" filter.
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Student</th>
                    <th className="py-2.5 px-3 font-bold">Centre</th>
                    <th className="py-2.5 px-3 font-bold">Test Series</th>
                    <th className="py-2.5 px-3 font-bold">Amount</th>
                    <th className="py-2.5 px-3 font-bold">UTR Reference</th>
                    <th className="py-2.5 px-3 font-bold">Proof</th>
                    <th className="py-2.5 px-3 font-bold">Status</th>
                    <th className="py-2.5 px-3 font-bold text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{pay.student_first_name} {pay.student_last_name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{pay.enrollment_no || pay.roll_no || `ID #${pay.student_id}`}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block truncate max-w-[140px]">{pay.centre_name}</span>
                        <span className="text-[10px] text-slate-500">{pay.centre_code}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[180px] truncate">
                        {pay.test_series_title}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-[11px]">
                            {pay.utr_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(pay.utr_number);
                              setToastMessage({ type: 'success', text: 'UTR number copied to clipboard' });
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title="Copy UTR"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {pay.payment_screenshot ? (
                          <button
                            type="button"
                            onClick={() => setViewingTestScreenshot(pay.payment_screenshot)}
                            className="text-indigo-600 hover:underline font-bold text-[11px] flex items-center gap-1"
                          >
                            <Eye size={12} /> View Proof
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          pay.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          pay.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pay.status === 'APPROVED' && <CheckCircle2 size={10} />}
                          {pay.status === 'REJECTED' && <XCircle size={10} />}
                          {pay.status === 'PENDING' && <Clock size={10} />}
                          <span>{pay.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {pay.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveTestPayment(pay.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingTestPayment(pay)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">
                            {pay.verified_at ? new Date(pay.verified_at).toLocaleDateString('en-GB') : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Screenshot Viewer Modal */}
      {viewingTestScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-800">Payment Screenshot Proof</h4>
              <button
                type="button"
                onClick={() => setViewingTestScreenshot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-50 p-2 rounded-xl border border-slate-200">
              <img
                src={viewingTestScreenshot}
                alt="Payment Screenshot Proof"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTestScreenshot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectingTestPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
                <XCircle size={18} /> Reject Test Series Payment
              </h4>
              <button
                type="button"
                onClick={() => setRejectingTestPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting payment of <span className="font-bold">₹{rejectingTestPayment.amount}</span> (UTR: <span className="font-mono font-bold">{rejectingTestPayment.utr_number}</span>) from <span className="font-bold">{rejectingTestPayment.student_first_name} {rejectingTestPayment.student_last_name}</span>.
            </p>

            <form onSubmit={handleRejectTestPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Rejection</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR mismatch / Amount not received in bank"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingTestPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 0: FULL CENTER DEEP-DIVE INSPECTOR (TRIGGERED ON CARD CLICK) */}
      {/* ========================================================================= */}
      {selectedCenterDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-300 max-h-[90vh] flex flex-col">
            
            {/* Center Header Ribbon */}
            <div className="p-5 bg-[#1e1b4b] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-[#1e1b4b] flex items-center justify-center font-black">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-amber-400 text-[#1e1b4b] px-2 py-0.5 rounded">
                      {selectedCenterDetail.center.center_code}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      ID #{selectedCenterDetail.center.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {selectedCenterDetail.center.name}
                  </h3>
                  <div className="text-xs text-indigo-200">
                    {selectedCenterDetail.center.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-[#2e2b5e] p-3 rounded-xl border border-indigo-900 text-right">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                    Current Wallet Balance
                  </span>
                  <div className="text-xl font-black text-white mt-0.5">
                    ₹{Number(selectedCenterDetail.center.wallet_balance || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCenterDetail(null)}
                  className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside Center Modal */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setCenterModalTab('students')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  centerModalTab === 'students' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={14} />
                <span>Enrolled Students ({selectedCenterDetail.students.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCenterModalTab('transactions')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  centerModalTab === 'transactions' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wallet size={14} />
                <span>Wallet Ledger ({selectedCenterDetail.transactions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCenterModalTab('requests')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  centerModalTab === 'requests' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard size={14} />
                <span>Recharge Requests ({selectedCenterDetail.walletRequests.length})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              
              {/* TAB 1: Enrolled Students */}
              {centerModalTab === 'students' && (
                <div className="space-y-3">
                  {selectedCenterDetail.students.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No students enrolled in this center yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b">
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Enrollment / Roll No</th>
                            <th className="py-2.5 px-3">Course</th>
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCenterDetail.students.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {st.firstName} {st.lastName}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-indigo-700 text-[11px]">
                                {st.enrollment_no || `EXAM-${st.id}`}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 font-semibold">
                                {st.courseName || 'Computer Course'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {st.phone}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  st.academic_status === 'passout' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {st.academic_status === 'passout' ? 'Passout' : 'Pursuing'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Wallet Ledger */}
              {centerModalTab === 'transactions' && (
                <div className="space-y-3">
                  {selectedCenterDetail.transactions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No wallet transactions recorded for this center.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Description / Narration</th>
                            <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                            <th className="py-2.5 px-3 text-right">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCenterDetail.transactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  txn.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {txn.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium max-w-sm">
                                {txn.description}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-black ${
                                txn.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {txn.type === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500">
                                {new Date(txn.created_at).toLocaleString('en-GB')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Recharge Requests */}
              {centerModalTab === 'requests' && (
                <div className="space-y-3">
                  {selectedCenterDetail.walletRequests.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No recharge requests submitted by this center.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b">
                            <th className="py-2.5 px-3">Bank UTR / Ref</th>
                            <th className="py-2.5 px-3">Requested Amount</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Submission Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCenterDetail.walletRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                                {req.utr_number}
                              </td>
                              <td className="py-2.5 px-3 font-black text-slate-900">
                                ₹{Number(req.amount).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : req.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500">
                                {new Date(req.created_at).toLocaleString('en-GB')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalCenter(selectedCenterDetail.center);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Update / Reset Center Password"
                >
                  <KeyRound size={14} />
                  <span>Update Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletModalCenter(selectedCenterDetail.center);
                    setAdjustType('credit');
                    setAdjustAmount('');
                    setAdjustReason('');
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CreditCard size={14} />
                  <span>Adjust Wallet Tokens</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteCenterTarget({ id: selectedCenterDetail.center.id, name: selectedCenterDetail.center.name })}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Center</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCenterDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Adjust Center Wallet Tokens */}
      {/* ========================================================================= */}
      {walletModalCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">Direct Center Wallet Adjustment</h3>
              </div>
              <button 
                onClick={() => setWalletModalCenter(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWalletAdjustSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs">
                <div className="font-bold text-indigo-950 text-sm">{walletModalCenter.name}</div>
                <div className="text-indigo-700 font-mono">Code: {walletModalCenter.center_code}</div>
                <div className="mt-1 font-bold text-slate-700">
                  Current Balance: <span className="text-indigo-700 font-black">₹{Number(walletModalCenter.wallet_balance || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      adjustType === 'credit' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Credit (Add Tokens)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      adjustType === 'debit' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Debit (Deduct Tokens)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount in Tokens (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {adjustType === 'debit' ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        Reason for Token Deduction (Mandatory)*
                      </span>
                    ) : (
                      <span>Reason / Credit Narration (Optional)</span>
                    )}
                  </label>
                  {adjustType === 'debit' && (
                    <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Required
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required={adjustType === 'debit'}
                  placeholder={
                    adjustType === 'debit'
                      ? 'e.g. Violation penalty, Certificate correction, Excess credit recovery'
                      : 'e.g. Direct bank settlement, Bonus incentive, Promotional tokens'
                  }
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-900 outline-none transition-colors ${
                    adjustType === 'debit' && !adjustReason.trim()
                      ? 'border-rose-300 focus:border-rose-600 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-600 bg-white'
                  }`}
                />

                {/* Preset Chips */}
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] text-slate-500 font-medium">Quick Select Presets:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {adjustType === 'debit' ? (
                      [
                        'Violation / Policy Penalty',
                        'Certificate Correction Charge',
                        'Course Fee Rectification',
                        'Excess Credit Recovery',
                        'Direct Cash Settlement',
                        'Hardware / Kit Charges'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAdjustReason(preset)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                            adjustReason === preset
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                          }`}
                        >
                          {preset}
                        </button>
                      ))
                    ) : (
                      [
                        'Direct Bank Settlement',
                        'Performance Bonus Incentive',
                        'Promotional Free Tokens',
                        'Admission Fee Correction',
                        'Offline Cash Received'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAdjustReason(preset)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium cursor-pointer transition-colors ${
                            adjustReason === preset
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }`}
                        >
                          {preset}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {adjustType === 'debit' && (
                  <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <span className="font-bold">ℹ️</span>
                    <span>
                      <strong>Notice:</strong> This reason will appear in the Center's Passbook with a <strong>TOKEN DEDUCTION</strong> badge and date.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setWalletModalCenter(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {adjustLoading ? 'Processing...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Quick Approve Wallet Request */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} />
                <h3 className="font-bold text-sm">Approve Wallet Recharge</h3>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="text-amber-100 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div><strong>Center:</strong> {selectedRequest.centerName} ({selectedRequest.centerCode})</div>
                <div><strong>Requested Amount:</strong> <span className="font-black text-indigo-700 text-sm">₹{Number(selectedRequest.amount).toLocaleString('en-IN')}</span></div>
                <div><strong>Bank UTR / Ref No:</strong> <span className="font-mono font-bold">{selectedRequest.utr_number}</span></div>
                <div><strong>Date Submitted:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Bonus Tokens Incentive (Optional):</span>
                </label>
                <input
                  type="number"
                  value={bonusTokens}
                  onChange={(e) => setBonusTokens(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-indigo-700 outline-none focus:border-indigo-600"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Total Tokens to Credit: <strong>₹{Number(selectedRequest.amount) + Number(bonusTokens)}</strong>
                </div>
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
                  onClick={handleApproveRequest}
                  disabled={submittingApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingApprove ? 'Crediting...' : 'Approve & Credit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Update Center Password */}
      {/* ========================================================================= */}
      {passwordModalCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
            <div className="p-4 bg-[#1e1b4b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">Update Center Password</h3>
              </div>
              <button 
                onClick={() => setPasswordModalCenter(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCenterPasswordSubmit} className="p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Center Account Details:</div>
                <div className="font-bold text-slate-900 text-sm">{passwordModalCenter.name}</div>
                <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-slate-200/60">
                  <div><strong>Username / Code:</strong> <span className="text-indigo-700 font-mono font-bold">{passwordModalCenter.center_code}</span></div>
                  <div><strong>Email:</strong> <span className="text-slate-700 font-mono">{passwordModalCenter.email}</span></div>
                </div>
                <div className="text-[10px] text-slate-400">The center can use this new password with either their Username/Code or Email.</div>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPasswordModalCenter(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-amber-400 rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdatingPassword ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Set Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Center Captcha Confirmation Modal */}
      <DeleteConfirmCaptchaModal
        isOpen={Boolean(deleteCenterTarget)}
        title="Delete Study Center"
        itemName={deleteCenterTarget?.name || ''}
        itemType="Study Center"
        description="Are you sure you want to permanently delete this center? All students enrolled in this center, wallet balances, transaction logs, and certificates will be permanently deleted."
        onClose={() => setDeleteCenterTarget(null)}
        onConfirm={handleConfirmDeleteCenter}
        isDeleting={isDeletingCenter}
      />

      {/* Super Admin Authority E-Signature & Stamp Modal */}
      <AuthoritySignatureModal
        isOpen={isAuthoritySignModalOpen}
        onClose={() => setIsAuthoritySignModalOpen(false)}
        onSaved={() => {
          setToastMessage({ type: 'success', text: 'Authority E-Signature & Stamp updated and applied to all certificates/marksheets.' });
        }}
      />

      {/* ANNOUNCEMENT MODAL */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Megaphone size={20} className="text-amber-500" /> Broadcast Announcement
              </h2>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBroadcastAnnouncement} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-sm text-amber-800">
                <AlertCircle size={20} className="shrink-0 text-amber-500" />
                <p>This message will be instantly sent to the notification bell of <strong>all registered centers</strong>. You can use HTML to embed links, bold text, or images.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:border-amber-500 focus:bg-white outline-none"
                  placeholder="e.g., MEGA DIWALI OFFER ON ALL COURSES!"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Content (HTML Supported)</label>
                <textarea
                  required
                  rows={6}
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:border-amber-500 focus:bg-white outline-none font-mono"
                  placeholder="<p>Get <strong>50% off</strong> on all token recharges today!</p>"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Expiry Date & Time</span>
                  <span className="font-normal text-slate-500">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={announcementForm.expiryDate}
                  onChange={e => setAnnouncementForm({...announcementForm, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:border-amber-500 focus:bg-white outline-none"
                />
                <p className="text-[10px] text-slate-500">After this date, the notification will automatically disappear from all center dashboards.</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={announcementSubmitting}
                  className="flex-[2] px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  {announcementSubmitting ? 'Broadcasting...' : (
                    <><Send size={16} /> Broadcast Now</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
