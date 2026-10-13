import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, CheckSquare, IndianRupee, Sparkles, TrendingUp, Clock, ArrowRight, UserPlus, CheckCircle2, Award, ShieldCheck, Download, Printer, FileCheck, AlertTriangle, AlertCircle, Upload, Send, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { StaggerContainer, StaggerItem, InteractiveCard, NumberCounter, FadeUp } from '../../motion';
import CenterCertificateModal from '../../components/CenterCertificateModal';
import CenterDemandDocsUploadModal from '../../components/CenterDemandDocsUploadModal';

const DEFAULT_CHART = [
  { name: 'January', Students: 0 },
  { name: 'February', Students: 0 },
  { name: 'March', Students: 0 },
  { name: 'April', Students: 0 },
  { name: 'May', Students: 0 },
  { name: 'June', Students: 0 },
  { name: 'July', Students: 0 },
  { name: 'August', Students: 0 },
  { name: 'September', Students: 0 },
];

const CenterDashboard = () => {
  const navigate = useNavigate();
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) {}
    return 1;
  };
  const centerId = getCenterId();
  const [stats, setStats] = useState({
    studentsCount: 0,
    freeTestsCount: 0,
    coursesCount: 0,
    walletBalance: 0
  });
  const [centerProfile, setCenterProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>(DEFAULT_CHART);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimToast, setClaimToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDashboardData = () => {
    axios.get(`http://localhost:3000/api/center/${centerId}/dashboard`)
      .then((res) => {
        if (res.data.success && res.data.data) {
          const { stats: s, chartData: cd, centerProfile: cp, recentStudents: rs } = res.data.data;
          setStats({
            studentsCount: s.studentsCount || 0,
            freeTestsCount: s.freeTestsCount || 0,
            coursesCount: s.coursesCount || 0,
            walletBalance: s.walletBalance || 0
          });
          if (cp) setCenterProfile(cp);

          if (cd && cd.length > 0) {
            const formatted = cd.map((item: any) => ({
              name: item.month.substring(0, 3), // e.g. 'Jan'
              Students: Number(item.count) || 0
            }));
            setChartData(formatted);
          }

          if (rs && rs.length > 0) {
            setRecentStudents(rs);
          }
        }
      })
      .catch((err) => console.log('Using initial dashboard state', err));
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-sync dashboard immediately when Super Admin approves certificate, demands docs, or wallet changes
    const handleRealtimeSync = () => {
      fetchDashboardData();
    };
    window.addEventListener('certificate-updated', handleRealtimeSync);
    window.addEventListener('wallet-updated', handleRealtimeSync);
    window.addEventListener('center-stats-updated', handleRealtimeSync);

    return () => {
      window.removeEventListener('certificate-updated', handleRealtimeSync);
      window.removeEventListener('wallet-updated', handleRealtimeSync);
      window.removeEventListener('center-stats-updated', handleRealtimeSync);
    };
  }, [centerId]);

  const handleClaimCertificate = async () => {
    setClaimLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/center/${centerId}/claim-certificate`);
      if (res.data?.success) {
        setCenterProfile((prev: any) => ({ ...prev, certificateStatus: 'pending' }));
        setClaimToast({
          type: 'success',
          message: 'Certificate claim request submitted to Super Admin for verification!'
        });
        setTimeout(() => setClaimToast(null), 6000);
      }
    } catch (err: any) {
      setClaimToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit certificate claim request.'
      });
      setTimeout(() => setClaimToast(null), 6000);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Minimalist Hero Section */}
      {centerProfile && (
        <FadeUp delay={0.05}>
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Minimal Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-4xl font-extrabold text-indigo-600">
                {centerProfile.name ? centerProfile.name.charAt(0).toUpperCase() : 'C'}
              </span>
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {centerProfile.name || 'Center Name'}
                    </h1>
                    {centerProfile.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Active Center
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 flex items-center justify-center sm:justify-start gap-1">
                    <Sparkles size={14} className="text-indigo-500" />
                    Center Code: <span className="font-bold text-gray-900">{centerProfile.code || 'N/A'}</span>
                  </p>
                </div>

                {/* Top Profile Quick Action */}
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/center/add-student')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
                  >
                    <UserPlus size={16} />
                    <span>+ New Admission</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-3 gap-x-6 text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                    <BookOpen size={16} />
                  </div>
                  <span>{centerProfile.email || 'Email N/A'}</span>
                </div>
                {centerProfile.phone && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                      <Users size={16} />
                    </div>
                    <span>{centerProfile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeUp>
      )}

      {/* Toast Alert Message */}
      {claimToast && (
        <FadeUp delay={0.06}>
          <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border shadow-lg ${
            claimToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {claimToast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
              <span>{claimToast.message}</span>
            </div>
            <button type="button" onClick={() => setClaimToast(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        </FadeUp>
      )}

      {/* Prominent Center Affiliation & Authorization Certificate Banner (Status Driven) */}
      <FadeUp delay={0.08}>
        {centerProfile?.certificateStatus === 'action_required' ? (
          /* STATE 1: SUPER ADMIN DEMANDED DOCUMENTS */
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-rose-500/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-lg shadow-rose-500/30 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <AlertTriangle size={30} className="text-rose-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-500/25 border border-rose-400/40 text-rose-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                      Verification Action Required
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-[11px] font-bold">
                      Documents Demanded by Super Admin
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Additional Verification Documents Demanded
                  </h2>
                  <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs text-rose-100 leading-relaxed font-medium">
                    <span className="font-bold text-amber-300 block mb-0.5">Admin Notice:</span>
                    {centerProfile.certificateDemandNotes || 'Please upload the demanded premises / identity documents to complete affiliation verification.'}
                  </div>

                  {centerProfile.certificateDemandedDocs && centerProfile.certificateDemandedDocs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-300">Required:</span>
                      {centerProfile.certificateDemandedDocs.map((docName: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-rose-900/60 border border-rose-500/40 text-rose-200 rounded-md text-[11px] font-bold">
                          • {docName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-600/30 hover:shadow-xl transition-all transform active:scale-95 cursor-pointer"
                >
                  <Upload size={18} />
                  <span>Upload Requested Documents</span>
                </button>
              </div>
            </div>
          </div>
        ) : centerProfile?.certificateStatus === 'pending' ? (
          /* STATE 2: CLAIM REQUEST SUBMITTED & PENDING APPROVAL */
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-500/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Clock size={30} className="text-amber-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} className="animate-spin" /> Claim Submitted • Awaiting Super Admin
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[11px] font-medium border border-slate-700">
                      Under Audit Wing Review
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Center Affiliation Certificate Under Review
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your certificate claim request has been received by Super Admin. After secondary verification of your premises and documents, your certificate will be officially unlocked here.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-200/90 font-mono">
                    <span>Center Code: <b className="text-white">{centerProfile?.code || 'ATC-PENDING'}</b></span>
                    <span>•</span>
                    <span>Pending Super Admin Secondary Confirmation</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Clock size={16} />
                  <span>Verification in Progress</span>
                </div>
              </div>
            </div>
          </div>
        ) : centerProfile?.certificateStatus === 'approved' ? (
          /* STATE 3: OFFICIALLY APPROVED & ACTIVE */
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-500/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Award size={32} className="text-amber-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                      Official Recognition
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified & Authorized
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Center Authorization & Affiliation Certificate
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your authorized training center certificate has been officially issued under Examirror accreditation. Print and display this certificate at your study center.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-200/90 font-mono">
                    <span>Cert No: <b className="text-white">{centerProfile?.certificate_number || `EXAM-ATC-2026-${String(centerProfile?.id || centerId).padStart(4, '0')}`}</b></span>
                    <span>•</span>
                    <span>Center Code: <b className="text-white">{centerProfile?.code || 'ATC-PENDING'}</b></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all transform active:scale-95 cursor-pointer"
                >
                  <Award size={18} className="text-slate-950" />
                  <span>Claim & View Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 hover:border-white/30 transition-all cursor-pointer backdrop-blur-sm"
                  title="Print or Download Certificate"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">Print / HD PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STATE 4: UNCLAIMED (INITIAL STATE) */
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-500/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-amber-300 p-0.5 shadow-lg shadow-indigo-500/30 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Award size={32} className="text-indigo-300" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                      Accreditation Available
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[11px] font-bold">
                      Govt. Recognized (MCA) & ISO 9001:2015
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Center Authorization & Affiliation Certificate
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Submit your official certificate claim request to Super Admin for verification. Once approved with secondary confirmation, your authorized accreditation certificate will be issued.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200/90 font-mono">
                    <span>Center Code: <b className="text-white">{centerProfile?.code || 'ATC-PENDING'}</b></span>
                    <span>•</span>
                    <span>Ready to Claim</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  disabled={claimLoading}
                  onClick={handleClaimCertificate}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all transform active:scale-95 cursor-pointer"
                >
                  {claimLoading ? <RefreshCw size={18} className="animate-spin text-slate-950" /> : <Award size={18} className="text-slate-950" />}
                  <span>Claim Center Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </FadeUp>

      {/* Stats Cards Row with Stagger & NumberCounter */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Students Card */}
        <StaggerItem>
          <InteractiveCard className="bg-white p-6 rounded-2xl shadow-xs hover:shadow-md border border-gray-100 flex justify-between items-center transition-all">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                <NumberCounter value={stats.studentsCount} durationMs={800} />
              </div>
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Enrolled Students</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Users size={24} strokeWidth={2} />
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Free Tests Card */}
        <StaggerItem>
          <InteractiveCard className="bg-white p-6 rounded-2xl shadow-xs hover:shadow-md border border-gray-100 flex justify-between items-center transition-all">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                <NumberCounter value={stats.freeTestsCount} durationMs={800} />
              </div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Assigned Online Tests</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <CheckSquare size={24} strokeWidth={2} />
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Courses Card */}
        <StaggerItem>
          <InteractiveCard className="bg-white p-6 rounded-2xl shadow-xs hover:shadow-md border border-gray-100 flex justify-between items-center transition-all">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                <NumberCounter value={stats.coursesCount} durationMs={800} />
              </div>
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Active Course Catalog</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
              <BookOpen size={24} strokeWidth={2} />
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* Wallet Card */}
        <StaggerItem>
          <InteractiveCard className="bg-white p-6 rounded-2xl shadow-xs hover:shadow-md border border-gray-100 flex justify-between items-center transition-all">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight flex items-baseline">
                <span className="text-lg font-normal text-gray-500 mr-0.5">₹</span>
                <NumberCounter value={stats.walletBalance} durationMs={900} />
              </div>
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Available Wallet Balance</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs">
              <IndianRupee size={24} strokeWidth={2} />
            </div>
          </InteractiveCard>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fees Table */}
        <FadeUp delay={0.1} className="lg:col-span-1 bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-center">
            <thead className="bg-[#5b5fd8] text-white font-bold">
              <tr>
                <th className="py-3 px-4 border-b border-[#4f46e5]/20 w-1/3">Duration</th>
                <th colSpan={2} className="py-3 px-4 border-b border-[#4f46e5]/20">Student Admission Fees</th>
              </tr>
              <tr className="bg-[#6b6eed]">
                <th className="py-2 px-4 border-r border-[#4f46e5]/20 text-xs">in Months</th>
                <th className="py-2 px-4 border-r border-[#4f46e5]/20 text-xs">New</th>
                <th className="py-2 px-4 text-xs">Old</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-gray-900 border-r border-gray-100">1 - 3</td>
                <td className="py-3.5 px-4 border-r border-gray-100 font-bold text-indigo-700">₹100</td>
                <td className="py-3.5 px-4 font-bold text-indigo-700">₹150</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-gray-900 border-r border-gray-100">4 - 6</td>
                <td className="py-3.5 px-4 border-r border-gray-100 font-bold text-indigo-700">₹150</td>
                <td className="py-3.5 px-4 font-bold text-indigo-700">₹200</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-gray-900 border-r border-gray-100">7 - 12</td>
                <td className="py-3.5 px-4 border-r border-gray-100 font-bold text-indigo-700">₹200</td>
                <td className="py-3.5 px-4 font-bold text-indigo-700">₹250</td>
              </tr>
            </tbody>
          </table>
        </FadeUp>

        {/* Chart */}
        <FadeUp delay={0.15} className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
          <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-gray-900 font-bold text-sm sm:text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <span>Students Enrollment Trend ({new Date().getFullYear()})</span>
            </h3>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Live Center Analytics
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6b6eed" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#6b6eed" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Students" 
                  stroke="#6b6eed" 
                  strokeWidth={3}
                  fill="url(#areaGradient)" 
                  activeDot={{ r: 6, fill: '#6b6eed', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center items-center mt-3 gap-2 text-xs text-gray-500 font-medium">
            <div className="w-3.5 h-3.5 bg-[#6b6eed] rounded-full border-2 border-white shadow-xs"></div> Monthly Admissions
          </div>
        </FadeUp>
      </div>

      {/* Recent Students & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Enrollments */}
        <FadeUp delay={0.2} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-gray-900 font-bold text-sm sm:text-base flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-600" />
              <span>Recent Enrollments</span>
            </h3>
            <button className="text-[11px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {recentStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                <Users size={32} className="text-gray-300 mb-2" />
                <p>No recent enrollments found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentStudents.map((student) => (
                  <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 cursor-pointer" onClick={() => navigate('/center/students')}>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100 shrink-0">
                      {student.firstName ? student.firstName.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                        <BookOpen size={10} />
                        {student.courseName || 'Unassigned Course'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        student.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {student.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                        <Clock size={10} />
                        {new Date(student.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Action Center / Quick Actions */}
        <FadeUp delay={0.25} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-gray-900 font-bold text-sm sm:text-base flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>Center Highlights & Quick Actions</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Manage your active operations directly from here.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div onClick={() => navigate('/center/add-student')} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700">Add Student</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Register a new candidate</p>
              </div>
            </div>

            <div onClick={() => navigate('/center/add-course')} className="p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-700">Course Catalog</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Browse available courses</p>
              </div>
            </div>

            <div onClick={() => navigate('/center/exams')} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">Admit Cards</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Manage exam permissions</p>
              </div>
            </div>

            <div onClick={() => navigate('/center/wallet')} className="p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <IndianRupee size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-700">Wallet Recharge</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Add funds to wallet</p>
              </div>
            </div>
          </div>
        </FadeUp>

      </div>

      {/* Center Affiliation & Authorization Certificate Modal */}
      <CenterCertificateModal
        center={centerProfile ? {
          ...centerProfile,
          id: centerProfile.id || centerId,
          centerName: centerProfile.name || centerProfile.centerName || 'AUTHORIZED STUDY CENTRE',
          centerCode: centerProfile.code || centerProfile.center_code || centerProfile.centerCode || 'EXAMc2026-101',
          headName: centerProfile.headName || centerProfile.head_name || 'Center Director',
          headPhoto: centerProfile.head_image_url || centerProfile.photo_url || centerProfile.headPhoto,
          address: centerProfile.address || centerProfile.address_line1,
          addressLine2: centerProfile.addressLine2 || centerProfile.address_line2,
          city: centerProfile.city,
          district: centerProfile.district,
          state: centerProfile.state,
          pincode: centerProfile.pincode,
          certificateNumber: centerProfile.certificate_number || centerProfile.certificateNumber || `EXAM-ATC-2026-${String(centerProfile.id || centerId).padStart(4, '0')}`,
          issueDate: centerProfile.certificate_issued_date || centerProfile.joined_date || centerProfile.created_at,
          validUntil: centerProfile.certificate_valid_until
        } : null}
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
      />

      {/* Demanded Documents Upload Modal */}
      <CenterDemandDocsUploadModal
        centerId={centerId}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        adminNotes={centerProfile?.certificateDemandNotes}
        demandedDocs={centerProfile?.certificateDemandedDocs || []}
        onSuccess={() => {
          fetchDashboardData();
          setClaimToast({
            type: 'success',
            message: 'Demanded documents uploaded successfully! Awaiting Super Admin final review.'
          });
          setTimeout(() => setClaimToast(null), 6000);
        }}
      />

    </div>
  );
};

export default CenterDashboard;
