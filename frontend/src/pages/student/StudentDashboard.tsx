import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, User, MapPin, Phone, Award, CreditCard, Calendar, CheckCircle, 
  Clock, PlayCircle, Star, BookOpen, ExternalLink, ShieldCheck, Mail, 
  Info, X, Flame, Trophy, Zap, Target, ArrowRight, FileText, CheckCircle2,
  Sparkles, Check, MessageSquare, GraduationCap, Building2, Printer, BadgeCheck,
  Hash, UserCheck, RotateCcw, Crown, HelpCircle, BookmarkCheck, Layers, Lock as LockIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudentIdCardModal } from '../../components/StudentIdCardModal';
import { StudentMarksheetModal } from '../../components/StudentMarksheetModal';
import { StudentCertificateModal } from '../../components/StudentCertificateModal';
import { AntiPiracyStudyMaterialModal } from '../../components/AntiPiracyStudyMaterialModal';
import { StudyMaterialPaymentModal } from '../../components/StudyMaterialPaymentModal';
import { FadeUp, StaggerContainer, StaggerItem } from '../../motion';
import { getAssetUrl } from '../../utils/axiosSetup';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeReadingMaterialId, setActiveReadingMaterialId] = useState<number | string | null>(null);
  const [paymentMaterial, setPaymentMaterial] = useState<any | null>(null);
  const [certificateInfo, setCertificateInfo] = useState<any>(null);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'info' | 'warning' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [scheduledExams, setScheduledExams] = useState<any[]>([]);
  const [enrolledSeries, setEnrolledSeries] = useState<any[]>([]);
  const [featuredSeries, setFeaturedSeries] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalAttempted: 0,
    avgScore: 0,
    bestScore: 0,
    totalMinutes: 0,
    centerRank: 1,
    streakDays: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('studentUser');
    if (data) {
      setStudent(JSON.parse(data));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      let res;
      try {
        res = await axios.get('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        res = await axios.get('http://localhost:3000/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (res.data?.success) {
        const d = res.data.data;
        if (d.student) setStudent(d.student);
        setScheduledExams(d.exams || []);
        setEnrolledSeries(d.enrolledSeries || []);
        setFeaturedSeries(d.featuredSeries || []);
        setRecentAttempts(d.recentAttempts || []);
        setStudyMaterials(d.studyMaterials || []);
        setBadges(d.badges || []);
        if (d.certificateInfo) setCertificateInfo(d.certificateInfo);
        if (d.analytics) setAnalytics(d.analytics);
      }

      // Fetch live dynamic study materials with anti-piracy permissions
      try {
        const smRes = await axios.get('http://localhost:3000/api/study-materials/student/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (smRes.data?.success && smRes.data.data?.length > 0) {
          setStudyMaterials(smRes.data.data);
        }
      } catch (smErr) {
        // Fallback to dashboard materials if endpoint offline
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Student Hub...</p>
      </div>
    );
  }

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ========================================================= */}
      {/* 1. MINIMALIST HERO & STUDENT PROFILE HEADER */}
      {/* ========================================================= */}
      <FadeUp>
        <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                  {student?.photo_url ? (
                    <img src={getAssetUrl(student.photo_url)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-600">{student?.firstName?.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-white shadow-2xs" title="Enrolled & Active">
                  <Check size={10} className="stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200">
                    {student?.courseName || 'Vocational Course'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-semibold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck size={12} /> {student?.centerName || 'Active Center'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Welcome back, {student?.firstName} {student?.lastName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  Student Roll / ID: <span className="font-mono text-slate-800 font-semibold">{student?.id_number || `STU${student?.id}`}</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
              <button 
                type="button"
                onClick={() => setShowIdCardModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <CreditCard size={14} className="text-slate-500" />
                <span>ID Card</span>
              </button>

              <button 
                type="button"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('studentToken');
                    const toastId = toast.loading('Generating official Admit Card PDF...');
                    const res = await axios.get('http://localhost:3000/api/student/admit-card', {
                      headers: { Authorization: `Bearer ${token}` },
                      responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Admit_Card_${student?.roll_no || student?.id}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success('Admit Card downloaded successfully!', { id: toastId });
                  } catch (err: any) {
                    toast.error('Failed to download Admit Card. Please try again.');
                  }
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <FileText size={14} className="text-indigo-600" />
                <span>Admit Card</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  const isReady = certificateInfo?.isReady || 
                    student?.certificate_status === 'generated' || 
                    student?.certificate_status === 'issued' || 
                    (scheduledExams.length > 0 && scheduledExams.every((e: any) => e.status === 'completed'));

                  if (isReady) {
                    setShowCertificateModal(true);
                  } else {
                    const totalSems = scheduledExams.length || 1;
                    const completedSems = scheduledExams.filter((e: any) => e.status === 'completed').length;
                    setInfoModal({
                      isOpen: true,
                      title: 'Certificate Eligibility Status',
                      message: `Your course certificate is generated upon successful completion of all semester examinations and fee clearance.\n\n• Semester Progress: ${completedSems} of ${totalSems} Exams Completed\n• Course Fee: ₹${student?.course_fee || '0.00'} (Registered)\n\nPlease complete your remaining scheduled semester examination below to activate your official certificate.`,
                      type: 'info'
                    });
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  (student?.certificate_status === 'generated' || student?.certificate_status === 'issued' || certificateInfo?.isReady)
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Award size={14} className="text-amber-600" />
                <span>Certificate</span>
                {(student?.certificate_status === 'generated' || student?.certificate_status === 'issued' || certificateInfo?.isReady) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>

              {(student?.certificate_status === 'generated' || student?.certificate_status === 'issued' || scheduledExams.some((e: any) => (Number(e.is_marksheet_generated) === 1 || e.status === 'completed') && e.is_published_to_student !== 0)) ? (
                <button 
                  type="button"
                  onClick={() => setShowMarksheetModal(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Download size={14} />
                  <span>Marksheet</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* ========================================================= */}
          {/* STATS STRIP INSIDE HERO */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
            {/* 1. Daily Streak */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Study Streak</div>
                <div className="text-sm font-bold text-slate-900">{analytics.streakDays} Days</div>
              </div>
            </div>

            {/* 2. Average Accuracy */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                <Target size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Avg Accuracy</div>
                <div className="text-sm font-bold text-slate-900">{analytics.avgScore > 0 ? `${analytics.avgScore}%` : '85%'}</div>
              </div>
            </div>

            {/* 3. Center Rank */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0">
                <Trophy size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Center Rank</div>
                <div className="text-sm font-bold text-slate-900">Rank #{analytics.centerRank}</div>
              </div>
            </div>

            {/* 4. Total Practice Minutes */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Practice Time</div>
                <div className="text-sm font-bold text-slate-900">{analytics.totalMinutes > 0 ? `${analytics.totalMinutes} Mins` : '45 Mins'}</div>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ========================================================= */}
      {/* 2. MINIMALIST CONTINUE PRACTICE HERO BANNER */}
      {/* ========================================================= */}
      <FadeUp delay={0.05}>
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                  Mock Tests
                </span>
                <h3 className="font-bold text-base text-slate-900">National Mock Test Series 2026</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Attempt live test packs with instant percentiles and solution breakdowns.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/test-series')}
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <span>Open Test Series</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </FadeUp>

      {/* ========================================================= */}
      {/* 3. TROPHY CASE & BADGES SECTION */}
      {/* ========================================================= */}
      <FadeUp delay={0.1}>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="text-amber-500" size={18} />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Achievement Trophies & Badges</h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {badges.filter(b => b.unlocked).length} of {badges.length || 4} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b: any) => (
              <div 
                key={b.id}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center gap-2 ${
                  b.unlocked 
                    ? 'bg-amber-50/40 border-amber-200/80 text-slate-900' 
                    : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  b.unlocked ? 'bg-amber-100/70 text-amber-700' : 'bg-slate-200 text-slate-400'
                }`}>
                  {b.id === 'first_test' && <Target size={20} />}
                  {b.id === 'score_90' && <Zap size={20} />}
                  {b.id === 'master_5' && <BookOpen size={20} />}
                  {b.id === 'top_rank' && <Crown size={20} />}
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">{b.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{b.desc}</div>
                </div>
                {b.unlocked ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-semibold rounded-md border border-emerald-200 flex items-center gap-1">
                    <Check size={10} /> Unlocked
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-medium rounded-md">
                    Locked
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ========================================================= */}
      {/* 3B. MY ENROLLED TEST SERIES & ACTIVE PRACTICE ITEMS */}
      {/* ========================================================= */}
      <FadeUp delay={0.12}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <BookmarkCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">My Enrolled Test Series & Live Mocks</h3>
                <p className="text-[11px] text-slate-500 font-normal">Active mock series and test packs linked to your account</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/test-series')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore All Series</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {enrolledSeries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledSeries.map((series: any) => (
                <div
                  key={series.id}
                  className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                      {series.thumbnail_url ? (
                        <img
                          src={series.thumbnail_url}
                          alt={series.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen size={28} />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {Number(series.is_free) === 1 ? (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-md shadow-2xs">
                            Free Access
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider rounded-md shadow-2xs">
                            Enrolled
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                        {series.target_exam || 'National Mock Pack'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors mt-0.5">
                        {series.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Layers size={12} className="text-slate-400" />
                          {series.tests_count || 2} Tests
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">Ready</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/student/test-series')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <PlayCircle size={14} />
                    <span>Practice Tests</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <BookOpen size={32} className="mx-auto text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800 text-xs">No active test series enrolled yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Enroll in free national mock series to practice chapter tests and full exams.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/student/test-series')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <span>Browse Test Series</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </FadeUp>

      {/* ========================================================= */}
      {/* 4. MAIN TWO-COLUMN SECTION */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Semester Exams */}
        <FadeUp delay={0.15}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-0 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-600" size={17} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Course Semester Exams</h3>
                {scheduledExams.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">
                    {scheduledExams.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {scheduledExams.some((e: any) => Number(e.is_marksheet_generated) === 1 && e.is_published_to_student !== 0) && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    Marksheet Available
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Reload Exam Schedules"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 bg-white overflow-y-auto space-y-3">
              {scheduledExams.length > 0 ? (
                scheduledExams.map((exam: any) => {
                  const isCompleted = exam.status === 'completed';
                  const isReExam = Number(exam.reattempts || 0) > 0;
                  const isMarksheetHeld = Number(exam.is_marksheet_generated) === 1 && exam.is_published_to_student === 0;
                  const written = Number(exam.written_marks) || 0;
                  const viva = Number(exam.viva_marks) || 0;
                  const total = written + viva;

                  return (
                    <div key={exam.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold rounded-md">
                            {exam.semester || 'SEM 1'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{exam.courseName || student?.courseName}</span>
                          {isCompleted && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-md">
                              Evaluated & Passed
                            </span>
                          )}
                          {isMarksheetHeld && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1" title={exam.hold_reason || 'Marksheet held pending dues clearance'}>
                              <LockIcon size={10} className="text-amber-600 shrink-0" />
                              <span>Held: {exam.hold_reason || 'Dues Pending'}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-GB') : 'Scheduled'}
                          </span>
                          {isCompleted ? (
                            <span className="font-semibold text-slate-800 font-mono flex items-center gap-1">
                              <Target size={12} className="text-indigo-600" />
                              Score: <strong className="text-indigo-700">{total}</strong> / 100 
                              <span className="text-slate-400 font-normal text-[10px]"> (Written: {written}, Viva: {viva})</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium text-[10px] flex items-center gap-1">
                              <Clock size={12} />
                              Online Assessment Pending
                            </span>
                          )}
                        </div>
                        {isMarksheetHeld && (
                          <div className="text-[10px] text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/80 font-medium">
                            ⚠️ <strong>Notice from Study Center:</strong> {exam.hold_reason || 'Course fee or center dues pending clearance. Please contact center office.'}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {isCompleted ? (
                          isMarksheetHeld ? (
                            <button
                              type="button"
                              onClick={() => alert(`Your official marksheet is currently held.\n\nReason: ${exam.hold_reason || 'Course fee or center dues pending clearance.'}\n\nPlease contact your study center administration to clear dues and download your marksheet.`)}
                              className="w-full sm:w-auto justify-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Marksheet held pending dues clearance"
                            >
                              <LockIcon size={13} className="text-amber-600 shrink-0" />
                              <span>Marksheet Held</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowMarksheetModal(true)}
                              className="w-full sm:w-auto justify-center px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                            >
                              <FileText size={13} className="text-emerald-600 shrink-0" />
                              <span>Marksheet</span>
                            </button>
                          )
                        ) : (
                          <button 
                            type="button"
                            onClick={() => navigate(`/student/exam/${exam.id}`)}
                            className="w-full sm:w-auto justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                          >
                            <PlayCircle size={14} className="shrink-0" /> {isReExam ? 'Give Re-Exam' : 'Start Exam'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                  <Calendar size={36} className="mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 text-xs sm:text-sm">No Semester Exams Scheduled</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your study center will publish your semester test schedule here.</p>
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Downloadable PDF Resources & Cheat Sheets */}
        <FadeUp delay={0.2}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-0 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={17} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Study Materials & Notes</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                Verified Resources
              </span>
            </div>

            <div className="p-5 flex-1 bg-white space-y-3">
              {studyMaterials.map((item: any) => {
                const isFree = Number(item.is_free) === 1 || Number(item.price || 0) <= 0;
                const isUnlocked = isFree || item.purchase_status === 'APPROVED' || item.is_unlocked;
                const isPending = item.purchase_status === 'PENDING';

                return (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.thumbnail_url ? (
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                          {isFree ? (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-200">
                              FREE
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 text-[9px] font-bold rounded border border-amber-200">
                              ₹{Number(item.price || 0).toFixed(0)}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{item.category || 'Curriculum'}</span>
                          <span>•</span>
                          <span>{item.file_size || item.size || '2.4 MB'}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Examirror Protected</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => setActiveReadingMaterialId(item.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                        >
                          <BookOpen size={13} />
                          <span>Read Note</span>
                        </button>
                      ) : isPending ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl">
                          Verifying...
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPaymentMaterial(item)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                        >
                          <span>Unlock ₹{Number(item.price || 0).toFixed(0)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeUp>
      </div>

      {/* ========================================================= */}
      {/* 5. COMPLETE STUDENT PROFILE & ACADEMIC DOSSIER */}
      {/* ========================================================= */}
      <FadeUp delay={0.25}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">Complete Student Profile & Academic Dossier</h3>
                <p className="text-xs text-slate-500 font-normal">Verified Enrollment Records, Program Details, Personal Credentials & Center Affiliation</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                <BadgeCheck size={14} className="text-emerald-600" />
                Status: {student?.status ? student.status.toUpperCase() : 'ACTIVE'}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg font-mono">
                Session: {student?.session_start || '2026'} - {student?.session_end || '2026'}
              </span>
            </div>
          </div>

          {/* 4 Multi-Column Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. PERSONAL INFORMATION CARD */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200/70">
                <User size={15} />
                <span>Personal Information</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Full Name</span>
                  <p className="font-bold text-slate-900 text-sm">{student?.firstName} {student?.lastName}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Date of Birth</span>
                  <p className="font-semibold text-slate-800">
                    {student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'Not Specified'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Father's Name</span>
                  <p className="font-semibold text-slate-800">{student?.father_name || 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Mother's Name</span>
                  <p className="font-semibold text-slate-800">{student?.mother_name || 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Gender</span>
                  <p className="font-semibold text-slate-800 capitalize">{student?.gender || 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Category</span>
                  <p className="font-semibold text-slate-800 uppercase">{student?.category || 'General'}</p>
                </div>
              </div>
            </div>

            {/* 2. ENROLLMENT & ACADEMIC CREDENTIALS */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200/70">
                <GraduationCap size={15} />
                <span>Program & Enrollment Credentials</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Enrolled Course</span>
                  <p className="font-bold text-slate-900 text-sm">{student?.courseName || 'Vocational Skill Certification'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Roll No</span>
                  <p className="font-mono font-bold text-indigo-700">{student?.roll_no || student?.id_number || `ROL-${student?.id}`}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Enrollment No</span>
                  <p className="font-mono font-bold text-slate-900">{student?.enrollment_no || `ENR-2026-${student?.id}`}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Course Code & Duration</span>
                  <p className="font-semibold text-slate-800">{student?.courseCode || 'VOC-101'} • {student?.courseDuration || '6 Months'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Admission Date</span>
                  <p className="font-semibold text-slate-800">
                    {student?.created_at ? new Date(student.created_at).toLocaleDateString('en-GB') : '2026-09-27'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. CONTACT & RESIDENTIAL ADDRESS */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200/70">
                <Phone size={15} />
                <span>Contact & Address</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Primary Mobile</span>
                    <p className="font-mono font-bold text-slate-900">{student?.phone || 'N/A'}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Alternate Contact</span>
                    <p className="font-mono font-semibold text-slate-800">{student?.alternate_phone || student?.parent_phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Registered Email</span>
                  <p className="font-semibold text-slate-800 truncate">{student?.email || 'N/A'}</p>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Residential Address</span>
                  <p className="font-medium text-slate-700 leading-relaxed">
                    {student?.address ? `${student.address}, ` : ''}
                    {student?.city || student?.centerCity || ''}
                    {student?.state ? `, ${student.state}` : ''}
                    {student?.pincode ? ` - ${student.pincode}` : ''}
                    {!student?.address && !student?.city && !student?.state && 'Address on record with study center'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. AUTHORIZED STUDY CENTER & MENTOR */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200/70">
                <Building2 size={15} />
                <span>Study Center & Authority</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Study Center</span>
                  <p className="font-bold text-slate-900 text-sm">{student?.centerName || 'Central Skill Academy'}</p>
                  <p className="text-[11px] font-mono text-indigo-700 font-semibold">Code: {student?.centerCode || 'CENTER-01'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Center Head</span>
                    <p className="font-semibold text-slate-900">{student?.centerHeadName || 'Center Administrator'}</p>
                    <span className="text-[10px] text-emerald-600 font-medium block">✓ Verified Center</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Center Contact</span>
                    <p className="font-mono font-semibold text-slate-800">{student?.centerPhone || student?.phone || 'N/A'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{student?.centerEmail || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Location</span>
                  <p className="text-[11px] text-slate-600">
                    {student?.centerAddress ? `${student.centerAddress}, ` : ''}
                    {student?.centerCity || ''}
                    {student?.centerState ? `, ${student.centerState}` : ''}
                    {student?.centerPincode ? ` - ${student.centerPincode}` : ''}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Action / Document Quick-Access Toolbar */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>All student records and credentials are cryptographically verified and recorded on the academic registry.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowIdCardModal(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <CreditCard size={14} className="text-indigo-600" />
                <span>View ID Card</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Printer size={14} />
                <span>Print Dossier</span>
              </button>
            </div>
          </div>

        </div>
      </FadeUp>

      {/* Modals */}
      {showIdCardModal && student && (
        <StudentIdCardModal student={student} onClose={() => setShowIdCardModal(false)} />
      )}
      
      {showMarksheetModal && student && (
        <StudentMarksheetModal 
          student={{
            ...student,
            marks: student.marks && student.marks.length > 0 ? student.marks : scheduledExams
          }} 
          onClose={() => setShowMarksheetModal(false)} 
        />
      )}

      {showCertificateModal && student && (
        <StudentCertificateModal 
          student={{
            ...student,
            marks: student.marks && student.marks.length > 0 ? student.marks : scheduledExams
          }} 
          onClose={() => setShowCertificateModal(false)} 
          onOpenMarksheet={() => {
            setShowCertificateModal(false);
            setShowMarksheetModal(true);
          }}
        />
      )}

      {/* Anti-Piracy Secure Watermarked Reader Modal */}
      {activeReadingMaterialId && student && (
        <AntiPiracyStudyMaterialModal
          materialId={activeReadingMaterialId}
          student={student}
          onClose={() => setActiveReadingMaterialId(null)}
          onUnlockClick={(matId) => {
            const mat = studyMaterials.find((m: any) => String(m.id) === String(matId));
            setActiveReadingMaterialId(null);
            if (mat) {
              setPaymentMaterial(mat);
            }
          }}
        />
      )}

      {/* Payment QR Unlock Modal */}
      {paymentMaterial && student && (
        <StudyMaterialPaymentModal
          material={paymentMaterial}
          student={student}
          onClose={() => setPaymentMaterial(null)}
          onSuccess={() => {
            setPaymentMaterial(null);
            fetchDashboardData();
            setInfoModal({
              isOpen: true,
              title: 'Payment Verification Submitted',
              message: 'Your payment reference has been submitted. Your study note access will be unlocked shortly once verified by Examirror admin.',
              type: 'info'
            });
          }}
        />
      )}

      {/* Info Notice Modal */}
      {infoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-4 text-center">
            <button 
              onClick={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
              <Info size={28} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{infoModal.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed px-2">
                {infoModal.message}
              </p>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
