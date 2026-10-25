import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  Flame,
  HelpCircle,
  Lock,
  PlayCircle,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
  User,
  X,
  AlertCircle,
  FileText,
  BarChart2,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Bell,
  Info,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Target,
  Bookmark,
  CheckCheck,
  Zap,
  Loader2,
  Download,
  Wallet,
  Crown,
  FolderTree,
  ChevronDown,
  SlidersHorizontal,
  Filter,
  Layers,
  Cpu,
  GraduationCap,
  Brain,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  History,
} from 'lucide-react';
import { downloadOfficialScorecardPdf } from '../../utils/scorecardPdf';
import { WalletPurchaseConfirmModal, type PurchaseItem } from '../../components/student/WalletPurchaseConfirmModal';
import { StudentRechargeModal } from '../../components/student/StudentRechargeModal';
import { Skeleton, SkeletonTestSeriesCard } from '../../components/ui/Skeleton';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface SubCategory {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  status?: string;
}

interface TestSeriesItem {
  id: number;
  title: string;
  slug: string;
  category_name?: string;
  category_id: number;
  sub_category_name?: string;
  sub_category_id?: number | null;
  description: string;
  thumbnail_url?: string;
  instructions?: string;
  exam_type?: string;
  language: string;
  difficulty: string;
  total_tests_count: number;
  duration_minutes: number;
  validity_days: number;
  is_free: number | boolean;
  price: number;
  publish_scope: string;
  status: string;
  upi_id?: string;
  qr_image_url?: string;
  account_name?: string;
  payment_instructions?: string;
  enrollment_status?: 'NOT_ENROLLED' | 'PENDING' | 'PAYMENT_PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'FREE_AVAILABLE';
  unlocked_via_elite_pass?: boolean;
  tests?: TestItem[];
}

interface TestItem {
  id: number;
  test_series_id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  negative_marks?: number;
  negative_marks_per_question?: number;
  release_type: string;
  release_date?: string;
  week_number?: number;
  max_attempts: number;
  status: string;
  questions_count: number;
  student_attempts_count?: number;
  latest_attempt?: any;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  marks: number;
  negative_marks: number;
  section_name?: string;
  options: {
    id: number;
    option_key: string;
    option_text: string;
  }[];
}

const cleanQuestionText = (text: string) => {
  if (!text) return '';
  return text.replace(/^\[[^\]]+\]\s*/, '');
};

export default function StudentTestSeries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: 'discover' | 'my_series' | 'achievements' =
    (tabParam === 'my_series' || tabParam === 'achievements') ? tabParam : 'discover';

  const selectedSeriesId = searchParams.get('seriesId') ? Number(searchParams.get('seriesId')) : null;

  const setActiveTab = useCallback((tab: 'discover' | 'my_series' | 'achievements') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'discover') {
        next.delete('tab');
        next.delete('seriesId');
      } else {
        next.set('tab', tab);
      }
      return next;
    });
  }, [setSearchParams]);

  const setSelectedSeriesId = useCallback((seriesId: number | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (seriesId) {
        next.set('seriesId', String(seriesId));
        next.set('tab', 'my_series');
      } else {
        next.delete('seriesId');
      }
      return next;
    });
  }, [setSearchParams]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [mySeriesSearchQuery, setMySeriesSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');

  // Category & Sub-Category Sidebar State
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [availableSeries, setAvailableSeries] = useState<TestSeriesItem[]>([]);
  const [mySeries, setMySeries] = useState<TestSeriesItem[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState<TestItem | null>(null);

  // Detail Modal State
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState<TestSeriesItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentSeries, setPaymentSeries] = useState<TestSeriesItem | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [paymentErrorMsg, setPaymentErrorMsg] = useState('');

  // Live Exam State
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [activeTest, setActiveTest] = useState<TestItem | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Record<number, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [antiCheatWarnings, setAntiCheatWarnings] = useState(0);
  const [examFontSize, setExamFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<'ALL' | 'ANSWERED' | 'UNANSWERED' | 'MARKED'>('ALL');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showBackWarningModal, setShowBackWarningModal] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Scorecard State
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [scorecardData, setScorecardData] = useState<any | null>(null);
  const [isScorecardFullWidth, setIsScorecardFullWidth] = useState(false);

  // Styled Toast & Celebration Modal State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);
  const [enrolledSuccessSeries, setEnrolledSuccessSeries] = useState<TestSeriesItem | null>(null);

  // Wallet Purchase & Recharge Modals
  const [walletOverview, setWalletOverview] = useState<any | null>(null);
  const isElite = Boolean(
    walletOverview?.activePass?.isElite ||
    availableSeries.some(s => s.unlocked_via_elite_pass)
  );
  const passDaysRemaining = Number(walletOverview?.activePass?.daysRemaining ?? 0);
  const [selectedWalletItem, setSelectedWalletItem] = useState<PurchaseItem | null>(null);
  const [showWalletConfirmModal, setShowWalletConfirmModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeShortfall, setRechargeShortfall] = useState(100);

  const showToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    setToast({ type, message, title });
    setTimeout(() => setToast(null), 4000);
  };

  const timerRef = useRef<any>(null);

  const getStudentId = () => {
    try {
      const userStr = localStorage.getItem('studentUser');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        return parsed.id || parsed.studentId || '';
      }
    } catch (_) {}
    return '';
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('studentToken');
    const sId = getStudentId();
    return { 
      Authorization: `Bearer ${token || ''}`,
      'x-student-id': String(sId)
    };
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const studentId = getStudentId();
      const headers = getAuthHeader();

      const [seriesRes, mySeriesRes, achieveRes] = await Promise.all([
        axios.get('/api/student/test-series/available', { headers, params: { studentId } })
          .catch(() => axios.get('http://localhost:3000/api/student/test-series/available', { headers, params: { studentId } }))
          .catch(() => ({ data: { success: false, data: [] } })),
        axios.get('/api/student/test-series/my-series', { headers, params: { studentId } })
          .catch(() => axios.get('http://localhost:3000/api/student/test-series/my-series', { headers, params: { studentId } }))
          .catch(() => ({ data: { success: false, data: [] } })),
        axios.get('/api/student/test-series/achievements', { headers })
          .catch(() => ({ data: { data: [] } }))
      ]);

      const dedupe = (list: any[]) => {
        const seen = new Set();
        return (list || []).filter(item => {
          if (!item?.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      };

      if (seriesRes?.data?.success && Array.isArray(seriesRes.data.data)) {
        setAvailableSeries(dedupe(seriesRes.data.data));
      }
      if (mySeriesRes?.data?.success && Array.isArray(mySeriesRes.data.data)) {
        const dedupedMySeries = dedupe(mySeriesRes.data.data);
        setMySeries(dedupedMySeries);
        try {
          localStorage.setItem('studentMySeriesCount', String(dedupedMySeries.length));
          window.dispatchEvent(new Event('studentSeriesUpdated'));
        } catch { }
      }
      if (achieveRes?.data?.data && Array.isArray(achieveRes.data.data)) {
        setAchievements(achieveRes.data.data || []);
      }

      const catRes = await axios.get('/api/student/test-series/categories', { headers })
        .catch(() => axios.get('/api/public/categories', { headers }))
        .catch(() => axios.get('/api/admin/test-series/categories', { headers }))
        .catch(() => axios.get('http://localhost:3000/api/student/test-series/categories', { headers }))
        .catch(() => ({ data: { data: [] } }));
      if (catRes?.data?.data && Array.isArray(catRes.data.data)) {
        setCategories(catRes.data.data);
      }

      const subCatRes = await axios.get('/api/student/test-series/sub-categories', { headers })
        .catch(() => axios.get('http://localhost:3000/api/student/test-series/sub-categories', { headers }))
        .catch(() => ({ data: { data: [] } }));
      if (subCatRes?.data?.data && Array.isArray(subCatRes.data.data)) {
        setSubCategories(subCatRes.data.data);
      }

      // Fetch student wallet overview
      try {
        const walRes = await axios.get('/api/student/wallet/overview', { headers })
          .catch(() => axios.get('http://localhost:3000/api/student/wallet/overview', { headers }));
        if (walRes?.data?.success) {
          setWalletOverview(walRes.data.data);
        }
      } catch (_) {}
    } catch (err) {
      console.error('Failed to load student test series:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('studentWalletUpdated', loadData);
    return () => {
      window.removeEventListener('studentWalletUpdated', loadData);
    };
  }, [loadData]);

  // Anti-cheating & Back Prevention during live exam
  useEffect(() => {
    if (!isTakingExam) return;

    // 1. History Trapping: push state so browser back button triggers popstate instead of exiting
    window.history.pushState({ examActive: true }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Re-push immediately to keep candidate trapped on the active exam screen
      window.history.pushState({ examActive: true }, '', window.location.href);
      setAntiCheatWarnings(prev => {
        const next = prev + 1;
        showToast('error', `Back navigation is strictly prohibited during live examination (${next}/3).`, 'Navigation Blocked');
        return next;
      });
      setShowBackWarningModal(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAntiCheatWarnings(prev => {
          const next = prev + 1;
          showToast('error', `Tab switching or leaving the exam screen is monitored (${next}/3). Repeated actions are permanently recorded.`, 'Anti-Cheat Warning');
          return next;
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active examination in progress. Leaving will invalidate your session.';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Backspace from navigating backwards outside text fields
      if (
        e.key === 'Backspace' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
      }

      // Prevent Navigation Shortcuts: Alt+Left, Alt+ArrowLeft, Cmd+[, BrowserBack
      if (
        e.key === 'BrowserBack' ||
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'Left')) ||
        (e.metaKey && e.key === '[')
      ) {
        e.preventDefault();
        setShowBackWarningModal(true);
      }

      // Prevent Reload Shortcuts: F5, Ctrl+R, Cmd+R
      if (
        e.key === 'F5' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))
      ) {
        e.preventDefault();
        showToast('error', 'Page refresh is blocked during live examination.', 'Action Prevented');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isTakingExam]);

  // Handle browser back button for open modals when NOT taking an exam
  useEffect(() => {
    if (isTakingExam) return;

    const anyModalOpen = showDetailModal || showPayModal || showScorecardModal;
    if (anyModalOpen) {
      window.history.pushState({ modalOpen: true }, '', window.location.href);

      const handleModalPop = () => {
        setShowDetailModal(false);
        setShowPayModal(false);
        setShowScorecardModal(false);
      };

      window.addEventListener('popstate', handleModalPop);

      return () => {
        window.removeEventListener('popstate', handleModalPop);
      };
    }
  }, [showDetailModal, showPayModal, showScorecardModal, isTakingExam]);

  // Server countdown timer loop
  useEffect(() => {
    if (!isTakingExam || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTakingExam, remainingSeconds]);

  const handleEnrollFree = async (series: TestSeriesItem) => {
    try {
      let res;
      try {
        res = await axios.post(`/api/student/test-series/${series.id}/enroll-free`, {}, { headers: getAuthHeader() });
      } catch {
        res = await axios.post(`http://localhost:3000/api/student/test-series/${series.id}/enroll-free`, {}, { headers: getAuthHeader() });
      }
      if (res.data?.success) {
        setEnrolledSuccessSeries(series);
        loadData();
        setActiveTab('my_series');
        setShowDetailModal(false);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to enroll in free series');
    }
  };

  const handleGoToSeriesTests = (seriesId: number) => {
    setSelectedSeriesId(seriesId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPayment = (series: TestSeriesItem) => {
    setPaymentSeries(series);
    setUtrNumber('');
    setScreenshotFile(null);
    setPaymentSuccessMsg('');
    setPaymentErrorMsg('');
    setShowPayModal(true);
    setShowDetailModal(false);
  };

  const handleOpenWalletBuy = (series: TestSeriesItem) => {
    setSelectedWalletItem({
      id: series.id,
      title: series.title,
      price: Number(series.price),
      type: 'TEST_SERIES',
      validity: `${series.validity_days} Days`,
      category: series.category_name
    });
    setShowWalletConfirmModal(true);
    setShowDetailModal(false);
  };

  const handleOpenRechargeFromModal = (shortfall: number) => {
    setShowWalletConfirmModal(false);
    setRechargeShortfall(Math.max(100, Math.ceil(shortfall)));
    setShowRechargeModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSeries) return;
    if (!utrNumber || utrNumber.trim().length < 6) {
      setPaymentErrorMsg('Please enter a valid Bank UTR / Transaction Reference Number (min 6 chars).');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentErrorMsg('');
    setPaymentSuccessMsg('');

    try {
      let screenshotUrl = '';
      if (screenshotFile) {
        const formData = new FormData();
        formData.append('file', screenshotFile);
        const uploadRes = await axios.post('http://localhost:3000/api/upload', formData, {
          headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        }).catch(() => null);
        if (uploadRes?.data?.url) {
          screenshotUrl = uploadRes.data.url;
        }
      }

      const res = await axios.post(
        `http://localhost:3000/api/student/test-series/${paymentSeries.id}/payment`,
        {
          utr_number: utrNumber.trim().toUpperCase(),
          payment_screenshot: screenshotUrl
        },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
        setPaymentSuccessMsg('Payment submitted successfully! Your payment is under review by Super Admin. Test access will activate upon verification.');
        loadData();
        setTimeout(() => {
          setShowPayModal(false);
          setActiveTab('my_series');
        }, 2200);
      }
    } catch (err: any) {
      setPaymentErrorMsg(err.response?.data?.message || 'Failed to submit payment. Please verify your UTR.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStartTest = async (test: TestItem) => {
    try {
      setStartingTest(test);
      let res;
      try {
        res = await axios.post(`/api/student/test-series/tests/${test.id}/start`, {}, { headers: getAuthHeader() });
      } catch {
        res = await axios.post(`http://localhost:3000/api/student/test-series/tests/${test.id}/start`, {}, { headers: getAuthHeader() });
      }

      if (res.data?.success) {
        const data = res.data.data;
        const finalAttemptId = data.attemptId || data.attempt?.id;
        const startedTest = data.test || test;
        const questionsList = data.questions || [];

        let seconds = 0;
        if (data.serverEndTime) {
          const diff = Math.floor((new Date(data.serverEndTime).getTime() - Date.now()) / 1000);
          seconds = diff > 0 ? diff : (startedTest.duration_minutes || startedTest.durationMinutes || 60) * 60;
        } else if (data.attempt?.remaining_seconds) {
          seconds = data.attempt.remaining_seconds;
        } else {
          seconds = (startedTest.duration_minutes || startedTest.durationMinutes || 60) * 60;
        }

        const prefilledAnswers: Record<number, number> = {};
        const prefilledMarked: Record<number, boolean> = {};
        if (data.savedAnswers && Array.isArray(data.savedAnswers)) {
          for (const ans of data.savedAnswers) {
            if (ans.selected_option_id) prefilledAnswers[ans.question_id] = ans.selected_option_id;
            if (ans.is_marked_for_review) prefilledMarked[ans.question_id] = true;
          }
        }

        setActiveTest({
          ...test,
          ...startedTest,
          duration_minutes: startedTest.duration_minutes || startedTest.durationMinutes || test.duration_minutes || 60,
          total_marks: startedTest.total_marks || startedTest.totalMarks || test.total_marks || 100,
          negative_marks: startedTest.negative_marks || startedTest.negativeMarks || test.negative_marks || 0.5
        });
        setActiveAttemptId(finalAttemptId);
        setExamQuestions(questionsList);
        setCurrentQIndex(0);
        setSelectedAnswers(prefilledAnswers);
        setMarkedQuestions(prefilledMarked);
        setRemainingSeconds(seconds);
        setAntiCheatWarnings(0);
        setIsTakingExam(true);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to start test.');
    } finally {
      setStartingTest(null);
    }
  };

  const handleSaveAnswer = async (questionId: number, optionId: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    if (!activeAttemptId) return;

    try {
      await axios.post(
        `/api/student/test-series/attempts/${activeAttemptId}/answer`,
        {
          question_id: questionId,
          selected_option_id: optionId,
          is_marked_for_review: markedQuestions[questionId] || false
        },
        { headers: getAuthHeader() }
      ).catch(() => {
        return axios.post(
          `http://localhost:3000/api/student/test-series/attempts/${activeAttemptId}/answer`,
          {
            question_id: questionId,
            selected_option_id: optionId,
            is_marked_for_review: markedQuestions[questionId] || false
          },
          { headers: getAuthHeader() }
        );
      });
    } catch (err) {
      console.error('Failed to auto-save answer:', err);
    }
  };

  const handleClearAnswer = (questionId: number) => {
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleToggleMarkReview = (questionId: number) => {
    setMarkedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAutoSubmit = () => {
    handleFinalSubmit(true);
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (!activeAttemptId) return;
    setExamSubmitting(true);

    try {
      const formattedAnswers = Object.entries(selectedAnswers).map(([qId, optId]) => {
        const question = examQuestions.find(q => q.id === Number(qId));
        const option = question?.options?.find(o => o.id === optId);
        return {
          questionId: Number(qId),
          question_id: Number(qId),
          selectedOptionId: optId,
          selected_option_id: optId,
          selectedOptionKey: option?.option_key || '',
          selected_option_key: option?.option_key || '',
          isMarkedForReview: Boolean(markedQuestions[Number(qId)]),
          is_marked_for_review: Boolean(markedQuestions[Number(qId)])
        };
      });

      let res;
      try {
        res = await axios.post(
          `/api/student/test-series/attempts/${activeAttemptId}/submit`,
          { answers: formattedAnswers, is_auto_submit: isAuto },
          { headers: getAuthHeader() }
        );
      } catch {
        res = await axios.post(
          `http://localhost:3000/api/student/test-series/attempts/${activeAttemptId}/submit`,
          { answers: formattedAnswers, is_auto_submit: isAuto },
          { headers: getAuthHeader() }
        );
      }

      if (res.data?.success) {
        setIsTakingExam(false);
        setShowConfirmSubmit(false);
        const data = res.data.data;
        const formatted = data?.attempt ? {
          ...data.attempt,
          question_analysis: data.questions,
          achievements: data.achievements
        } : data;
        setScorecardData(formatted);
        setShowScorecardModal(true);
        loadData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error submitting test attempt.');
    } finally {
      setExamSubmitting(false);
    }
  };

  const handleViewScorecard = async (attemptId: number) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await axios.get(`/api/student/test-series/results/${attemptId}`, { headers: getAuthHeader() });
      } catch {
        res = await axios.get(`http://localhost:3000/api/student/test-series/results/${attemptId}`, { headers: getAuthHeader() });
      }
      if (res.data?.success) {
        const data = res.data.data;
        const formatted = data?.attempt ? {
          ...data.attempt,
          question_analysis: data.questions,
          achievements: data.achievements,
          comparison: data.comparison || data.attempt?.comparison,
          attempts_history: data.comparison?.attempts_history || data.attempt?.attempts_history || []
        } : {
          ...data,
          comparison: data?.comparison,
          attempts_history: data?.comparison?.attempts_history || []
        };
        setScorecardData(formatted);
        setShowScorecardModal(true);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to load scorecard.');
    } finally {
      setLoading(false);
    }
  };

  const topicAnalytics = useMemo(() => {
    if (!scorecardData?.question_analysis || !Array.isArray(scorecardData.question_analysis)) return [];
    const map = new Map<string, { total: number; correct: number; incorrect: number; unattempted: number }>();

    scorecardData.question_analysis.forEach((q: any) => {
      const sec = q.section_name?.trim() || 'General Assessment';
      if (!map.has(sec)) {
        map.set(sec, { total: 0, correct: 0, incorrect: 0, unattempted: 0 });
      }
      const entry = map.get(sec)!;
      entry.total += 1;
      if (q.student_is_correct === 1) {
        entry.correct += 1;
      } else if (q.selected_option_key) {
        entry.incorrect += 1;
      } else {
        entry.unattempted += 1;
      }
    });

    return Array.from(map.entries()).map(([topicName, stats]) => {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      let status: 'Strong' | 'Moderate' | 'Weak' = 'Weak';
      if (accuracy >= 75) status = 'Strong';
      else if (accuracy >= 45) status = 'Moderate';

      return {
        topicName,
        total: stats.total,
        correct: stats.correct,
        incorrect: stats.incorrect,
        unattempted: stats.unattempted,
        accuracy,
        status,
      };
    });
  }, [scorecardData]);

  const handleDownloadScorecardPdf = () => {
    if (!scorecardData) return;

    let studentUser: any = {};
    try {
      studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
    } catch (_) {
      studentUser = {};
    }

    const candidateName = studentUser?.firstName
      ? `${studentUser.firstName} ${studentUser.lastName || ''}`.trim()
      : studentUser?.name || 'Student Candidate';
    const candidateEnroll = studentUser?.enrollment_no || studentUser?.roll_no || studentUser?.registration_no || 'EXM-2026';
    const centerName = studentUser?.center_name || studentUser?.center?.name || 'Examirror Digital Assessment Center';

    const passingMarks = Number(scorecardData.test_passing_marks || scorecardData.passing_marks || 40);
    const finalScore = Number(scorecardData.final_score || 0);
    const isPassed = scorecardData.is_passed !== undefined
      ? Boolean(scorecardData.is_passed)
      : finalScore >= passingMarks;

    const topicBreakdown = topicAnalytics.map(t => ({
      topicName: t.topicName,
      total: t.total,
      correct: t.correct,
      accuracy: t.accuracy,
    }));

    downloadOfficialScorecardPdf({
      testTitle: scorecardData.test_title || 'Mock Examination',
      studentName: candidateName,
      enrollmentNo: candidateEnroll,
      centerName,
      examDate: scorecardData.submitted_at ? new Date(scorecardData.submitted_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : undefined,
      status: isPassed ? 'PASSED' : 'FAILED',
      finalScore,
      totalMarks: Number(scorecardData.test_total_marks || scorecardData.total_marks || 100),
      passingMarks,
      percentage: Number(scorecardData.percentage || 0),
      accuracy: Number(scorecardData.accuracy || 0),
      durationSeconds: Number(scorecardData.duration_seconds || 0),
      correctAnswers: Number(scorecardData.correct_answers || 0),
      incorrectAnswers: Number(scorecardData.incorrect_answers || 0),
      unanswered: Number(scorecardData.unanswered || 0),
      topicBreakdown,
    });

    showToast('success', 'Official PDF Scorecard generated successfully!');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-expand selected categories
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      setExpandedCategories(prev => {
        const next = { ...prev };
        selectedCategoryIds.forEach(id => { next[id] = true; });
        return next;
      });
    }
  }, [selectedCategoryIds]);

  const toggleCategoryExpand = (catId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Multi-Category Toggle
  const toggleCategory = (catId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCategoryIds(prev => {
      const isSelected = prev.includes(catId);
      if (isSelected) {
        // Also remove any selected subcategories that belonged to this category
        const subIdsOfCat = allSubCategoriesList
          .filter(sc => Number(sc.category_id) === catId)
          .map(sc => Number(sc.id));
        setSelectedSubCategoryIds(subPrev => subPrev.filter(id => !subIdsOfCat.includes(id)));
        return prev.filter(id => id !== catId);
      } else {
        setExpandedCategories(exp => ({ ...exp, [catId]: true }));
        return [...prev, catId];
      }
    });
  };

  // Multi-Subcategory Toggle
  const toggleSubCategory = (scId: number, catId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSubCategoryIds(prev => {
      const isSelected = prev.includes(scId);
      if (isSelected) {
        return prev.filter(id => id !== scId);
      } else {
        setSelectedCategoryIds(catPrev => catPrev.includes(catId) ? catPrev : [...catPrev, catId]);
        return [...prev, scId];
      }
    });
  };

  // Select all in a category (clears specific subcategory filters for this category)
  const selectAllInCat = (catId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCategoryIds(prev => prev.includes(catId) ? prev : [...prev, catId]);
    const subIdsOfCat = allSubCategoriesList
      .filter(sc => Number(sc.category_id) === catId)
      .map(sc => Number(sc.id));
    setSelectedSubCategoryIds(subPrev => subPrev.filter(id => !subIdsOfCat.includes(id)));
  };

  // Reset all filters to show everything
  const resetCategoryFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedSubCategoryIds([]);
  };

  const getCategoryIcon = (name: string, isSelected: boolean) => {
    const n = name.toLowerCase();
    const className = `shrink-0 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'}`;
    if (n.includes('computer') || n.includes('it') || n.includes('tech') || n.includes('code') || n.includes('software')) {
      return <Cpu size={16} className={className} />;
    }
    if (n.includes('ssc') || n.includes('cgl') || n.includes('chsl') || n.includes('govt')) {
      return <ShieldCheck size={16} className={className} />;
    }
    if (n.includes('bank') || n.includes('ibps') || n.includes('sbi') || n.includes('po') || n.includes('clerk')) {
      return <CreditCard size={16} className={className} />;
    }
    if (n.includes('rail') || n.includes('rrb') || n.includes('ntpc')) {
      return <Target size={16} className={className} />;
    }
    if (n.includes('reason') || n.includes('aptitude') || n.includes('quant') || n.includes('math')) {
      return <Brain size={16} className={className} />;
    }
    if (n.includes('academic') || n.includes('school') || n.includes('diploma') || n.includes('degree') || n.includes('dca')) {
      return <GraduationCap size={16} className={className} />;
    }
    return <BookOpen size={16} className={className} />;
  };

  // Merged and deduplicated categories from database + availableSeries items
  const allCategoriesList = useMemo(() => {
    const list: Category[] = [...categories];
    const existingIds = new Set(list.map(c => Number(c.id)));
    availableSeries.forEach(s => {
      const cId = Number(s.category_id);
      if (cId && !existingIds.has(cId)) {
        existingIds.add(cId);
        list.push({
          id: cId,
          name: s.category_name || `Category ${cId}`,
          slug: String(cId),
          description: ''
        });
      }
    });
    return list;
  }, [categories, availableSeries]);

  // Merged and deduplicated subcategories from database + availableSeries items
  const allSubCategoriesList = useMemo(() => {
    const list: SubCategory[] = [...subCategories];
    const existingIds = new Set(list.map(sc => Number(sc.id)));
    availableSeries.forEach(s => {
      const scId = Number(s.sub_category_id);
      if (scId && !existingIds.has(scId)) {
        existingIds.add(scId);
        list.push({
          id: scId,
          category_id: Number(s.category_id),
          category_name: s.category_name,
          name: s.sub_category_name || `Sub-Category ${scId}`,
          slug: String(scId)
        });
      }
    });
    return list;
  }, [subCategories, availableSeries]);

  const categoryCounts = useMemo(() => {
    const counts: Record<number | string, number> = { ALL: availableSeries.length };
    availableSeries.forEach(s => {
      if (s.category_id != null) {
        const cId = Number(s.category_id);
        counts[cId] = (counts[cId] || 0) + 1;
      }
    });
    return counts;
  }, [availableSeries]);

  const subCategoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    availableSeries.forEach(s => {
      if (s.sub_category_id != null) {
        const scId = Number(s.sub_category_id);
        counts[scId] = (counts[scId] || 0) + 1;
      } else if (s.sub_category_name) {
        const matched = allSubCategoriesList.find(
          sc => sc.name.toLowerCase().trim() === s.sub_category_name?.toLowerCase().trim()
        );
        if (matched) {
          const scId = Number(matched.id);
          counts[scId] = (counts[scId] || 0) + 1;
        }
      }
    });
    return counts;
  }, [availableSeries, allSubCategoriesList]);

  const freeSeriesCount = useMemo(() => {
    return availableSeries.filter(s => s.is_free).length;
  }, [availableSeries]);

  const paidSeriesCount = useMemo(() => {
    return availableSeries.filter(s => !s.is_free).length;
  }, [availableSeries]);

  const filteredCategoriesForSidebar = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return allCategoriesList;
    return allCategoriesList.filter(cat => {
      const matchCat = cat.name.toLowerCase().includes(q);
      const matchSub = allSubCategoriesList.some(
        sc => Number(sc.category_id) === Number(cat.id) && sc.name.toLowerCase().includes(q)
      );
      return matchCat || matchSub;
    });
  }, [allCategoriesList, allSubCategoriesList, sidebarSearch]);

  const activeSubCategories = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return allSubCategoriesList;
    }
    return allSubCategoriesList.filter(sc => selectedCategoryIds.includes(Number(sc.category_id)));
  }, [allSubCategoriesList, selectedCategoryIds]);

  const filteredSeries = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();
    const hasCatFilter = selectedCategoryIds.length > 0;
    const hasSubCatFilter = selectedSubCategoryIds.length > 0;

    return availableSeries.filter(s => {
      const catId = Number(s.category_id);
      const subId = s.sub_category_id != null ? Number(s.sub_category_id) : null;

      // 1. Category Matching:
      if (hasCatFilter && !selectedCategoryIds.includes(catId)) {
        return false;
      }

      // 2. Subcategory Matching:
      if (hasSubCatFilter) {
        // Are any subcategories of this test's category selected?
        const subsOfThisCat = allSubCategoriesList
          .filter(sc => Number(sc.category_id) === catId)
          .map(sc => Number(sc.id));
        const hasSubSelectedForThisCat = subsOfThisCat.some(id => selectedSubCategoryIds.includes(id));

        if (hasSubSelectedForThisCat) {
          const matches = (subId != null && selectedSubCategoryIds.includes(subId)) || (
            s.sub_category_name && allSubCategoriesList.some(
              sc => selectedSubCategoryIds.includes(Number(sc.id)) && sc.name.toLowerCase().trim() === s.sub_category_name?.toLowerCase().trim()
            )
          );
          if (!matches) return false;
        }
      }

      // 3. Search matching
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      // 4. Type matching
      const matchesType = filterType === 'ALL' || (filterType === 'FREE' && s.is_free) || (filterType === 'PAID' && !s.is_free);
      if (!matchesType) return false;

      return true;
    });
  }, [availableSeries, selectedCategoryIds, selectedSubCategoryIds, debouncedSearchQuery, filterType, allSubCategoriesList]);

  if (isTakingExam && activeTest) {
    const currentQ = examQuestions[currentQIndex];
    const answeredCount = Object.keys(selectedAnswers).length;
    const markedCount = Object.values(markedQuestions).filter(Boolean).length;
    const totalQCount = examQuestions.length;
    const unansweredCount = totalQCount - answeredCount;
    const progressPercent = totalQCount > 0 ? Math.round((answeredCount / totalQCount) * 100) : 0;

    // Filter palette questions based on filter tab
    const filteredPalette = examQuestions.map((q, idx) => ({ q, idx })).filter(({ q }) => {
      const isAns = selectedAnswers[q.id] !== undefined;
      const isMrk = markedQuestions[q.id];
      if (paletteFilter === 'ANSWERED') return isAns;
      if (paletteFilter === 'UNANSWERED') return !isAns;
      if (paletteFilter === 'MARKED') return isMrk;
      return true;
    });

    let studentUser: any = {};
    try {
      studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
    } catch {
      studentUser = {};
    }

    const candidateName = studentUser?.firstName
      ? `${studentUser.firstName} ${studentUser.lastName || ''}`.trim()
      : studentUser?.name || 'Student Candidate';
    const candidateEnroll = studentUser?.enrollment_no || studentUser?.roll_no || 'REG-2026';

    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans select-none w-full h-full">
        {/* Top Minimal CBT Navigation Bar */}
        <header className="bg-slate-900 text-white border-b border-slate-800 px-5 py-2.5 flex items-center justify-between z-30 w-full shrink-0">
          {/* Left: Test Title & Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-100 truncate">
                  {activeTest.title}
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-medium">
                  CBT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                <span>Total: {activeTest.total_marks || 100} Marks</span>
                <span>•</span>
                <span>Negative: -{activeTest.negative_marks || activeTest.negative_marks_per_question || 0.50}</span>
              </p>
            </div>
          </div>

          {/* Center: Countdown Timer */}
          <div className="flex items-center justify-center px-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors ${
                remainingSeconds < 300
                  ? 'bg-rose-950/60 border-rose-700/60 text-rose-300 animate-pulse'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
              }`}
            >
              <Clock size={14} className={remainingSeconds < 300 ? 'text-rose-400' : 'text-slate-400'} />
              <span className="font-semibold text-sm tracking-wide">{formatTimer(remainingSeconds)}</span>
            </div>
          </div>

          {/* Right: Quick Tools & Submit Button */}
          <div className="flex items-center gap-2">
            {/* Font Scale Adjuster */}
            <div className="hidden lg:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setExamFontSize(prev => prev === 'lg' ? 'base' : 'sm')}
                className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                  examFontSize === 'sm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Small font"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setExamFontSize('base')}
                className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                  examFontSize === 'base' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Default font"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setExamFontSize(prev => prev === 'sm' ? 'base' : 'lg')}
                className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                  examFontSize === 'lg' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Large font"
              >
                A+
              </button>
            </div>

            {/* Instructions */}
            <button
              type="button"
              onClick={() => setShowInstructionsModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Instructions"
            >
              <HelpCircle size={16} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:flex p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Top Submit Action Button */}
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>Submit</span>
            </button>
          </div>
        </header>

        {/* Dynamic Progress Ribbon */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-5 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5 text-slate-300">
            <span className="font-medium text-white">
              Question {currentQIndex + 1} of {totalQCount}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[11px]">
              {answeredCount}/{totalQCount} Attempted ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded font-medium">
              ✓ {answeredCount} Answered
            </span>
            <span className="px-2 py-0.5 bg-amber-950/60 text-amber-400 border border-amber-800/50 rounded font-medium">
              ★ {markedCount} Marked
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-medium">
              ○ {unansweredCount} Left
            </span>
          </div>
        </div>

        {/* Progress Fill Line */}
        <div className="w-full bg-slate-800 h-0.5 overflow-hidden shrink-0">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Exam Body (Split Viewport) */}
        <div className="flex-1 flex overflow-hidden w-full">
          {/* Main Question Area */}
          <main className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50 w-full">
            {/* Scrollable Question Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 w-full">
              {currentQ ? (
                <div className="w-full max-w-5xl mx-auto space-y-4">
                  {/* Question Statement Card */}
                  <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 w-full">
                    {/* Question Metadata Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md text-xs">
                          Question {currentQIndex + 1}
                        </span>
                        {currentQ.section_name && (
                          <span className="px-2 py-0.5 text-slate-500 text-xs">
                            {currentQ.section_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-700 font-medium">
                          +{currentQ.marks || 2.0}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-600 font-medium">
                          -{currentQ.negative_marks || 0.50}
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p
                      className={`text-slate-900 font-normal leading-relaxed whitespace-pre-wrap ${
                        examFontSize === 'sm'
                          ? 'text-sm'
                          : examFontSize === 'lg'
                          ? 'text-lg sm:text-xl'
                          : 'text-base sm:text-lg'
                      }`}
                    >
                      {cleanQuestionText(currentQ.question_text)}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 w-full">
                    {currentQ.options && currentQ.options.length > 0 ? (
                      currentQ.options.map((opt, optIndex) => {
                        const isSelected = selectedAnswers[currentQ.id] === opt.id;
                        const keyLetter = opt.option_key || String.fromCharCode(65 + optIndex);

                        return (
                          <label
                            key={opt.id}
                            onClick={() => handleSaveAnswer(currentQ.id, opt.id)}
                            className={`group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-600 text-slate-900 ring-1 ring-indigo-600/30 shadow-xs'
                                : 'bg-white hover:bg-slate-50/90 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {/* Option Key Circle */}
                            <div
                              className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}
                            >
                              {keyLetter}
                            </div>

                            {/* Option Text */}
                            <div className="flex-1 leading-normal">
                              <span
                                className={`block ${
                                  examFontSize === 'sm'
                                  ? 'text-xs sm:text-sm'
                                  : examFontSize === 'lg'
                                  ? 'text-base sm:text-lg'
                                  : 'text-sm sm:text-base'
                                } ${isSelected ? 'font-medium text-slate-900' : 'text-slate-700'}`}
                              >
                                {opt.option_text}
                              </span>
                            </div>

                            {/* Selected Checkmark */}
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                <Check size={12} className="stroke-[3]" />
                              </div>
                            )}
                          </label>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                        No options available for this question.
                      </div>
                    )}
                  </div>

                  {/* Minimalist Quick Keys Hint */}
                  <div className="text-center text-[11px] text-slate-400 font-normal pt-1">
                    Keys: <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">1-4</kbd> or <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">A-D</kbd> select • <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">→</kbd> Next • <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">M</kbd> Review
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-slate-400 w-full">
                  <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-600">No question data found</p>
                  <p className="text-xs text-slate-400 mt-1">Please select another question from the palette.</p>
                </div>
              )}
            </div>

            {/* Pinned Bottom Action Toolbar */}
            <footer className="w-full bg-white border-t border-slate-200/90 px-5 sm:px-8 py-3 flex items-center justify-between gap-3 shrink-0 shadow-xs z-10">
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => currentQ && handleToggleMarkReview(currentQ.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentQ && markedQuestions[currentQ.id]
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Bookmark size={13} className={currentQ && markedQuestions[currentQ.id] ? 'fill-amber-600 text-amber-600' : ''} />
                  <span>{currentQ && markedQuestions[currentQ.id] ? 'Marked' : 'Mark for Review'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => currentQ && handleClearAnswer(currentQ.id)}
                  className="px-3.5 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>

              {/* Right Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => {
                    if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1);
                  }}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentQIndex < totalQCount - 1) {
                      setCurrentQIndex(prev => prev + 1);
                    } else {
                      setShowConfirmSubmit(true);
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {currentQIndex < totalQCount - 1 ? (
                    <>
                      <span>Save & Next</span>
                      <ChevronRight size={15} />
                    </>
                  ) : (
                    <>
                      <span>Review & Submit</span>
                      <CheckCircle2 size={15} />
                    </>
                  )}
                </button>
              </div>
            </footer>
          </main>

          {/* Right Question Palette Sidebar */}
          <aside className="w-76 lg:w-84 bg-white border-l border-slate-200 p-4 flex flex-col justify-between hidden md:flex select-none shrink-0 h-full overflow-hidden">
            {/* Top Candidate & Legend Area */}
            <div className="space-y-3 shrink-0">
              {/* Candidate Info Header */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {candidateName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-slate-800 truncate">{candidateName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{candidateEnroll}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Proctored Session" />
              </div>

              {/* Status Legend Pills */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div
                  onClick={() => setPaletteFilter(paletteFilter === 'ANSWERED' ? 'ALL' : 'ANSWERED')}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
                    paletteFilter === 'ANSWERED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                      : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Answered ({answeredCount})</span>
                </div>

                <div
                  onClick={() => setPaletteFilter(paletteFilter === 'UNANSWERED' ? 'ALL' : 'UNANSWERED')}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
                    paletteFilter === 'UNANSWERED'
                      ? 'bg-slate-100 border-slate-300 text-slate-800 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Left ({unansweredCount})</span>
                </div>

                <div
                  onClick={() => setPaletteFilter(paletteFilter === 'MARKED' ? 'ALL' : 'MARKED')}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
                    paletteFilter === 'MARKED'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                      : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Marked ({markedCount})</span>
                </div>

                <div className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-white border-slate-200 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Current Q</span>
                </div>
              </div>

              {/* Question Palette Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setPaletteFilter('ALL')}
                  className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                    paletteFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({totalQCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('ANSWERED')}
                  className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                    paletteFilter === 'ANSWERED' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Done ({answeredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('UNANSWERED')}
                  className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                    paletteFilter === 'UNANSWERED' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Left ({unansweredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('MARKED')}
                  className={`flex-1 py-1 rounded text-center transition-all cursor-pointer ${
                    paletteFilter === 'MARKED' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mark ({markedCount})
                </button>
              </div>
            </div>

            {/* Middle Section: Full-height Flex Questions Palette */}
            <div className="flex-1 min-h-0 my-3 flex flex-col bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2 px-0.5 shrink-0">
                <span>Question Palette</span>
                <span className="text-indigo-600 font-semibold">{filteredPalette.length} shown</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-5 gap-1.5">
                  {filteredPalette.map(({ q, idx }) => {
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    const isMarked = markedQuestions[q.id];
                    const isCurrent = currentQIndex === idx;

                    let tileClasses = 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200';
                    if (isCurrent) {
                      tileClasses = 'border-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50 shadow-xs';
                    } else if (isAnswered && isMarked) {
                      tileClasses = 'bg-purple-600 text-white border border-purple-600 font-medium';
                    } else if (isAnswered) {
                      tileClasses = 'bg-emerald-600 text-white border border-emerald-600 font-medium';
                    } else if (isMarked) {
                      tileClasses = 'bg-amber-500 text-white border border-amber-500 font-medium';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        className={`h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer relative ${tileClasses} active:scale-95`}
                        title={`Question ${idx + 1}`}
                      >
                        <span>{idx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Proctor Status & Final Submit Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Anti-Cheat Active
                </span>
                <span className="font-medium text-slate-600">
                  {antiCheatWarnings === 0 ? '0 Violations' : `${antiCheatWarnings} Warning(s)`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCheck size={15} />
                <span>Submit Final Exam</span>
              </button>
            </div>
          </aside>
        </div>

        {/* Instructions Helper Modal */}
        {showInstructionsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  <HelpCircle size={20} />
                  <span>Exam Instructions & Shortcuts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-1">
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
                  <h4 className="font-bold text-indigo-900 mb-1">Marking Scheme:</h4>
                  <p>• Each correct answer earns <b>+{activeTest.total_marks ? (activeTest.total_marks / totalQCount).toFixed(1) : '2.0'} Marks</b>.</p>
                  <p>• Incorrect answers deduct <b>-{activeTest.negative_marks || 0.50} Marks</b>.</p>
                  <p>• Unanswered questions receive 0 marks.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">Question Palette Status:</h4>
                  <ul className="space-y-1">
                    <li>🟢 <b>Green</b>: You have answered this question.</li>
                    <li>⚪ <b>Gray</b>: You have not answered this question yet.</li>
                    <li>🟣 <b>Purple</b>: You have marked this question for review.</li>
                    <li>🔵 <b>Ring</b>: Currently viewed question.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">Keyboard Shortcuts:</h4>
                  <ul className="space-y-1 font-mono text-[11px]">
                    <li>[1] / [A] - Select Option A</li>
                    <li>[2] / [B] - Select Option B</li>
                    <li>[3] / [C] - Select Option C</li>
                    <li>[4] / [D] - Select Option D</li>
                    <li>[→] - Save & Next Question</li>
                    <li>[←] - Previous Question</li>
                    <li>[M] - Toggle Mark for Review</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close Instructions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-indigo-600">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Submit Examination?</h3>
                  <p className="text-xs text-slate-500">Your answers will be evaluated immediately.</p>
                </div>
              </div>

              {/* Statistics Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-3 text-center text-xs gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-emerald-700 text-[10px] font-bold uppercase">Answered</div>
                  <div className="text-emerald-700 font-black text-lg mt-0.5">{answeredCount}</div>
                </div>
                <div className="p-2 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-purple-700 text-[10px] font-bold uppercase">Marked</div>
                  <div className="text-purple-700 font-black text-lg mt-0.5">{markedCount}</div>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl border border-slate-300">
                  <div className="text-slate-600 text-[10px] font-bold uppercase">Left</div>
                  <div className="text-slate-800 font-black text-lg mt-0.5">{unansweredCount}</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center leading-relaxed">
                Time Remaining: <b className="text-indigo-600 font-mono font-bold">{formatTimer(remainingSeconds)}</b>. 
                Once submitted, you cannot change your answers.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  disabled={examSubmitting}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={examSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {examSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck size={16} />
                      <span>Yes, Submit Exam</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Navigation Prohibited Modal */}
        {showBackWarningModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-amber-200/90 shadow-2xl space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Back Navigation Blocked</h3>
                  <p className="text-xs text-amber-700 font-medium">Exam integrity protection is active</p>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
                <p>
                  You are attempting to use the browser back button, back navigation swipe, or keyboard shortcut.
                </p>
                <p className="font-semibold text-amber-950">
                  Leaving or refreshing the examination page during a live CBT test is prohibited. Any further attempts are permanently logged as security violations ({antiCheatWarnings}/3).
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowBackWarningModal(false);
                    setShowConfirmSubmit(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Submit Exam Instead
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackWarningModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Resume Examination</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderNavTabs = (isMobile = false) => (
    <div className={`bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 shadow-2xs ${isMobile ? 'w-full justify-between' : ''}`}>
      <button
        type="button"
        onClick={() => setActiveTab('discover')}
        className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
          activeTab === 'discover'
            ? 'bg-white text-indigo-700 shadow-2xs font-black'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        } ${isMobile ? 'flex-1 text-center' : ''}`}
      >
        Explore Series
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('my_series')}
        className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
          activeTab === 'my_series'
            ? 'bg-white text-indigo-700 shadow-2xs font-black'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        } ${isMobile ? 'flex-1' : ''}`}
      >
        <span>My Series</span>
        {mySeries.length > 0 && (
          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 font-bold rounded-full text-[10px]">
            {mySeries.length}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('achievements')}
        className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
          activeTab === 'achievements'
            ? 'bg-white text-indigo-700 shadow-2xs font-black'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        } ${isMobile ? 'flex-1 text-center' : ''}`}
      >
        Achievements
      </button>
    </div>
  );

  const renderCategorySidebar = (isMobile: boolean = false) => {
    return (
      <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col gap-4 ${isMobile ? 'h-full' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <FolderTree size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Categories & Exams</h2>
              <p className="text-[10px] text-slate-400 font-medium">Select a category to filter tests</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-100">
              {availableSeries.length} Tests
            </span>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search within Sidebar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories & exams..."
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {sidebarSearch && (
            <button
              type="button"
              onClick={() => setSidebarSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tier Quick Filter Buttons (All, Free, VIP) */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Test Access Tier
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({availableSeries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('FREE')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'FREE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Free ({freeSeriesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('PAID')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'PAID'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              VIP ({paidSeriesCount})
            </button>
          </div>
        </div>

        {/* Category Dropdown Navigation */}
        <div className="space-y-2">
          {/* Main Dropdown Header / Selector */}
          <button
            type="button"
            onClick={() => setIsCategoriesDropdownOpen(prev => !prev)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer group shadow-2xs select-none ${
              isCategoriesDropdownOpen
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isCategoriesDropdownOpen ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-indigo-600'
              }`}>
                <LayoutGrid size={16} />
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {selectedCategoryIds.length === 0 ? 'Browsing All' : 'Active Filters'}
                </span>
                <span className="font-black text-xs break-words leading-tight">
                  {selectedCategoryIds.length === 0
                    ? 'All Categories'
                    : selectedCategoryIds.length === 1
                      ? (allCategoriesList.find(c => Number(c.id) === selectedCategoryIds[0])?.name || '1 Category')
                      : `${selectedCategoryIds.length} Categories Selected`}
                </span>
                {selectedSubCategoryIds.length > 0 && (
                  <span className="text-[10px] text-indigo-400 font-semibold truncate">
                    ↳ {selectedSubCategoryIds.length === 1
                      ? allSubCategoriesList.find(sc => Number(sc.id) === selectedSubCategoryIds[0])?.name
                      : `${selectedSubCategoryIds.length} Sub-Categories Selected`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isCategoriesDropdownOpen ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {filteredSeries.length}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  isCategoriesDropdownOpen ? 'rotate-180 text-indigo-400' : 'text-slate-500'
                }`}
              />
            </div>
          </button>

          {/* Categories & Subcategories Dropdown Panel */}
          {isCategoriesDropdownOpen && (
            <div className="space-y-2 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-2 shadow-inner animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Option 1: All Categories (Show All Tests) */}
              <button
                type="button"
                onClick={() => {
                  resetCategoryFilters();
                  if (isMobile) setMobileFilterOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  selectedCategoryIds.length === 0 && selectedSubCategoryIds.length === 0
                    ? 'bg-indigo-600 text-white shadow-2xs font-black'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedCategoryIds.length === 0 && selectedSubCategoryIds.length === 0 ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    <LayoutGrid size={14} />
                  </span>
                  <span className="break-words leading-tight">All Categories (Show All)</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    selectedCategoryIds.length === 0 && selectedSubCategoryIds.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {availableSeries.length}
                  </span>
                  {selectedCategoryIds.length === 0 && selectedSubCategoryIds.length === 0 && <Check size={13} className="text-white" />}
                </div>
              </button>

              <div className="border-t border-slate-200/80 my-1" />

              {/* Dynamic Categories List inside the Dropdown with Multi-Selection */}
              {filteredCategoriesForSidebar.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No categories match "{sidebarSearch}"
                </div>
              ) : (
                filteredCategoriesForSidebar.map(cat => {
                  const catId = Number(cat.id);
                  const isCatSelected = selectedCategoryIds.includes(catId);
                  const isExpanded = expandedCategories[cat.id] ?? isCatSelected;
                  const catSubs = allSubCategoriesList.filter(sc => Number(sc.category_id) === catId);
                  const totalInCat = categoryCounts[catId] || 0;
                  const selectedSubsInThisCat = catSubs.filter(sc => selectedSubCategoryIds.includes(Number(sc.id)));

                  return (
                    <div
                      key={cat.id}
                      className={`rounded-2xl transition-all border overflow-hidden ${
                        isCatSelected
                          ? 'border-indigo-300 bg-white shadow-xs ring-1 ring-indigo-200'
                          : 'border-slate-200/70 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Category Header Row with Checkbox */}
                      <div
                        onClick={(e) => {
                          toggleCategory(catId, e);
                          if (isMobile && catSubs.length === 0) setMobileFilterOpen(false);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group select-none ${
                          isCatSelected
                            ? 'text-indigo-950 font-black bg-indigo-50/40'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1.5">
                          {/* Multi-Select Checkbox */}
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isCatSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                              : 'border-slate-300 bg-white group-hover:border-indigo-400'
                          }`}>
                            {isCatSelected && <Check size={11} strokeWidth={3} />}
                          </div>

                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isCatSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                          }`}>
                            {getCategoryIcon(cat.name, isCatSelected)}
                          </span>
                          <span className="text-xs font-bold leading-snug break-words text-left flex-1 min-w-0">
                            {cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isCatSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {totalInCat}
                          </span>
                          {catSubs.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => toggleCategoryExpand(cat.id, e)}
                              className="p-1 rounded-md hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-transform cursor-pointer"
                              title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                            >
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subcategories Dropdown Tree inside this Category with Multi-Selection */}
                      {isExpanded && catSubs.length > 0 && (
                        <div className="pb-2.5 pt-1 px-2.5 space-y-1 bg-slate-50/80 rounded-b-xl border-t border-slate-100">
                          <div className="border-l-2 border-indigo-200 ml-2.5 pl-2.5 space-y-1 my-1">
                            {/* All in this category */}
                            <button
                              type="button"
                              onClick={(e) => {
                                selectAllInCat(catId, e);
                                if (isMobile) setMobileFilterOpen(false);
                              }}
                              className={`w-full text-left py-2 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                isCatSelected && selectedSubsInThisCat.length === 0
                                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
                              }`}
                            >
                              <span className="leading-snug break-words text-left flex-1 min-w-0 pr-2">
                                All {cat.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isCatSelected && selectedSubsInThisCat.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {totalInCat}
                                </span>
                                {isCatSelected && selectedSubsInThisCat.length === 0 && <Check size={11} className="text-white" />}
                              </div>
                            </button>

                            {/* Individual Subcategories with Checkboxes */}
                            {catSubs.map(sc => {
                              const scId = Number(sc.id);
                              const isSubSelected = selectedSubCategoryIds.includes(scId);
                              const subCount = subCategoryCounts[scId] || 0;

                              return (
                                <button
                                  type="button"
                                  key={sc.id}
                                  onClick={(e) => {
                                    toggleSubCategory(scId, catId, e);
                                    if (isMobile) setMobileFilterOpen(false);
                                  }}
                                  className={`w-full text-left py-2 px-2.5 rounded-lg text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer group ${
                                    isSubSelected
                                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                      : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                                      isSubSelected
                                        ? 'bg-white text-indigo-700 border-white shadow-2xs'
                                        : 'border-slate-300 bg-white group-hover:border-indigo-400'
                                    }`}>
                                      {isSubSelected && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <span className="leading-snug break-words text-left flex-1 min-w-0">
                                      {sc.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                      isSubSelected
                                        ? 'bg-white/20 text-white'
                                        : subCount > 0
                                          ? 'bg-indigo-50 text-indigo-700'
                                          : 'bg-slate-100 text-slate-400 font-normal'
                                    }`}>
                                      {subCount}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Clear Filters Button (when filtered) */}
        {(selectedCategoryIds.length > 0 || selectedSubCategoryIds.length > 0 || filterType !== 'ALL' || searchQuery || sidebarSearch) && (
          <button
            type="button"
            onClick={() => {
              resetCategoryFilters();
              setFilterType('ALL');
              setSearchQuery('');
              setSidebarSearch('');
            }}
            className="w-full py-2 px-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Clear All Filters</span>
          </button>
        )}

        {/* Elite Pass Status / Promo Mini Card */}
        {isElite ? (
          <div className="pt-2 border-t border-slate-100 mt-auto">
            <Link
              to="/student/passes"
              className="block p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-300 hover:border-amber-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                  <Crown size={14} className="text-amber-600 fill-amber-500 shrink-0" />
                  <span>VIP Pass Active</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {passDaysRemaining > 0 ? `${passDaysRemaining}d Left` : 'Active'}
                </span>
              </div>
              <p className="text-[10px] text-amber-900 mt-1 leading-snug font-medium">
                Unlimited access active! All test series across every category are completely unlocked for you.
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-amber-800 group-hover:text-amber-950">
                <span>Manage VIP Pass</span>
                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 mt-auto">
            <Link
              to="/student/passes"
              className="block p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-300/80 hover:border-amber-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                <Crown size={14} className="text-amber-600 fill-amber-500 shrink-0" />
                <span>Examirror Elite Pass</span>
              </div>
              <p className="text-[10px] text-amber-900 mt-1 leading-snug">
                Unlock all test series across every category with 1 click.
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-800 group-hover:text-amber-950">
                <span>View VIP Pass</span>
                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 pb-16 font-sans">
      {/* Ultra-Compact High-Impact Header Banner */}
      <div className="bg-white/95 backdrop-blur-xs px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-slate-200/90 shadow-2xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          {/* Left: Breadcrumbs + Gradient Title */}
          <div className="flex flex-col gap-1 min-w-0">
            {/* Top Micro-Row: Breadcrumb + Tag Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Link
                  to="/student/dashboard"
                  className="hover:text-indigo-600 transition-colors flex items-center gap-1 text-slate-500"
                >
                  Dashboard
                </Link>
                <ChevronRight size={11} className="text-slate-300" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeriesId(null);
                    setActiveTab('discover');
                  }}
                  className={`hover:text-indigo-600 transition-colors cursor-pointer ${
                    activeTab === 'discover' && !selectedSeriesId ? 'text-indigo-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  Test Series
                </button>
                {activeTab === 'my_series' && (
                  <>
                    <ChevronRight size={11} className="text-slate-300" />
                    <span className="text-indigo-600 font-bold">My Tests</span>
                  </>
                )}
                {activeTab === 'achievements' && (
                  <>
                    <ChevronRight size={11} className="text-slate-300" />
                    <span className="text-indigo-600 font-bold">Achievements</span>
                  </>
                )}
              </nav>

              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 text-amber-900 border border-amber-300/80 shadow-2xs">
                <Crown size={11} className="text-amber-600 fill-amber-500 shrink-0" />
                <span>Online Examination & Test Series</span>
              </div>
            </div>

            {/* Bottom Title Row with VIP-Pass Style Vibrant Gradient Typography */}
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-tight flex items-baseline flex-wrap gap-1.5">
                <span>All Competitive & Academic Exams.</span>
                <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent font-black drop-shadow-2xs">
                  Unlimited Practice & Mock Tests.
                </span>
              </h1>
              <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">
                • SSC CGL, RRB NTPC, Banking, NDA, Diplomas, Reasoning & Technical
              </span>
            </div>
          </div>

          {/* Right: Navigation Sub-Tabs & Quick Back Button */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {(selectedSeriesId || activeTab !== 'discover') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSeriesId(null);
                  setActiveTab('discover');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <ArrowLeft size={13} />
                <span>Explore All</span>
              </button>
            )}

            {renderNavTabs(false)}
          </div>
        </div>

        {/* Mobile Navigation Sub-Tabs (< md screens) */}
        <div className="md:hidden mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {(selectedSeriesId || activeTab !== 'discover') && (
            <button
              type="button"
              onClick={() => {
                setSelectedSeriesId(null);
                setActiveTab('discover');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
          )}
          <div className="flex-1 min-w-0">
            {renderNavTabs(true)}
          </div>
        </div>
      </div>

      {/* DISCOVER TAB: Interactive Category & Sub-Category Explorer Sidebar */}
      {activeTab === 'discover' && (
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Desktop Category & Sub-Category Explorer Sidebar (lg+) */}
          <aside className="hidden lg:block w-84 xl:w-96 shrink-0 sticky top-[4.5rem] self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-1 z-30">
            {renderCategorySidebar(false)}
          </aside>

          {/* Mobile Category Explorer Drawer (< lg) */}
          {mobileFilterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-stretch justify-start">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="relative w-84 sm:w-92 max-w-[90vw] bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
                {renderCategorySidebar(true)}
              </div>
            </div>
          )}

          {/* Right Main Content Area */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* Top Toolbar: Search, Mobile Filter Toggle, & Result Header */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Mobile Filter Drawer Button (< lg screens) */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <SlidersHorizontal size={14} />
                  <span>
                    Categories
                    {selectedCategoryIds.length > 0 && ` (${selectedCategoryIds.length})`}
                  </span>
                </button>

                {/* Category Breadcrumb Title & Count */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {selectedCategoryIds.length === 0
                      ? 'All Test Series'
                      : selectedCategoryIds.length === 1
                        ? (allCategoriesList.find(c => Number(c.id) === selectedCategoryIds[0])?.name || 'Category')
                        : `${selectedCategoryIds.length} Categories Selected`}
                  </h2>
                  {selectedSubCategoryIds.length > 0 && (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                      <ChevronRight size={12} />
                      <span className="text-indigo-600 font-bold">
                        {selectedSubCategoryIds.length === 1
                          ? allSubCategoriesList.find(s => Number(s.id) === selectedSubCategoryIds[0])?.name
                          : `${selectedSubCategoryIds.length} Sub-Categories`}
                      </span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md shrink-0">
                    {filteredSeries.length} Available
                  </span>
                </div>
              </div>

              {/* Search Bar for Test Series */}
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search in these tests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Tag Pills with Multi-Select Support */}
            {(selectedCategoryIds.length > 0 || selectedSubCategoryIds.length > 0 || filterType !== 'ALL' || debouncedSearchQuery) && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs bg-white/70 p-2.5 px-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px]">Filtered by:</span>
                
                {/* Category Pills (only shown if no subcategories of this category are selected, to avoid redundancy) */}
                {selectedCategoryIds.map(catId => {
                  const cat = allCategoriesList.find(c => Number(c.id) === catId);
                  const subsInThisCat = allSubCategoriesList
                    .filter(sc => Number(sc.category_id) === catId)
                    .map(sc => Number(sc.id));
                  const hasSelectedSubs = subsInThisCat.some(id => selectedSubCategoryIds.includes(id));
                  if (hasSelectedSubs) return null;

                  return (
                    <span key={`cat-${catId}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold">
                      <span>{cat?.name || `Category ${catId}`}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleCategory(catId, e)}
                        className="hover:text-indigo-900 cursor-pointer"
                        title="Remove category filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}

                {/* Subcategory Pills */}
                {selectedSubCategoryIds.map(scId => {
                  const sc = allSubCategoriesList.find(s => Number(s.id) === scId);
                  return (
                    <span key={`sub-${scId}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-2xs">
                      <span>{sc?.name || `Sub-Category ${scId}`}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleSubCategory(scId, Number(sc?.category_id || 0), e)}
                        className="hover:text-white/80 cursor-pointer"
                        title="Remove subcategory filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}

                {filterType !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
                    <span>{filterType === 'FREE' ? 'Free Only' : 'VIP Elite Pass Only'}</span>
                    <button
                      type="button"
                      onClick={() => setFilterType('ALL')}
                      className="hover:text-slate-900 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {debouncedSearchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
                    <span>"{debouncedSearchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-slate-900 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    resetCategoryFilters();
                    setFilterType('ALL');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold ml-1 cursor-pointer underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Test Series Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTestSeriesCard key={i} />
              ))}
            </div>
          ) : filteredSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSeries.map(series => {
                const isEnrolled = series.enrollment_status === 'APPROVED';
                const isPending = series.enrollment_status === 'PENDING' || series.enrollment_status === 'PAYMENT_PENDING';

                return (
                  <div
                    key={series.id}
                    className="card-3d-interactive bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 flex flex-col justify-between overflow-hidden group relative"
                  >
                    {/* Top 3D specular light edge */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent pointer-events-none z-10" />

                    <div>
                      {series.thumbnail_url && (
                        <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                          <img
                            src={series.thumbnail_url}
                            alt={series.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                        </div>
                      )}

                      <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-white text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-md shadow-2xs">
                            {series.category_name || 'General'}
                          </span>
                          {series.sub_category_name && (
                            <span className="px-2 py-0.5 bg-indigo-50/70 text-indigo-700 border border-indigo-200/60 text-[10px] font-semibold rounded-md flex items-center gap-1 shadow-2xs">
                              <FolderTree size={11} className="text-indigo-500" />
                              {series.sub_category_name}
                            </span>
                          )}
                        </div>
                        {series.unlocked_via_elite_pass ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black rounded-md flex items-center gap-1 shadow-2xs">
                            <Crown size={12} className="text-amber-600 drop-shadow-xs" /> ELITE PASS
                          </span>
                        ) : series.is_free ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-md shadow-2xs">
                            FREE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold rounded-md shadow-2xs">
                            ₹{series.price}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {series.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {series.description || 'Comprehensive test series with detailed performance evaluation.'}
                        </p>

                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs mt-4 shadow-2xs">
                          <div>
                            <div className="text-slate-400 text-[10px] font-semibold uppercase">Tests</div>
                            <div className="font-bold text-slate-900">{series.tests?.length || series.total_tests_count || 1} Tests</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px] font-semibold uppercase">Duration</div>
                            <div className="font-bold text-slate-900">{series.tests?.[0]?.duration_minutes || series.duration_minutes || 60} Mins</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px] font-semibold uppercase">Validity</div>
                            <div className="font-bold text-slate-900">{series.validity_days || 365} Days</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
                      <button
                        onClick={() => {
                          setSelectedSeriesDetail(series);
                          setShowDetailModal(true);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        Details <ChevronRight size={15} />
                      </button>

                      {isEnrolled || series.unlocked_via_elite_pass ? (
                        <button
                          onClick={() => handleGoToSeriesTests(series.id)}
                          className="btn-3d-yoyo-emerald px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          {series.unlocked_via_elite_pass && <Crown size={13} className="text-amber-300 drop-shadow-xs" />}
                          <span>Go to Tests</span>
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : isPending ? (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                          <Clock size={13} /> Under Review
                        </span>
                      ) : series.is_free ? (
                        <button
                          onClick={() => handleEnrollFree(series)}
                          className="btn-3d-yoyo-emerald px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Enroll Free</span>
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenWalletBuy(series)}
                            className="btn-3d-yoyo-indigo px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                          >
                            <Wallet size={13} />
                            <span>Buy (₹{series.price})</span>
                          </button>
                          <button
                            onClick={() => handleOpenPayment(series)}
                            className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors cursor-pointer"
                            title="Pay via UPI QR"
                          >
                            <QrCode size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-10 sm:p-14 rounded-3xl border border-slate-200/90 shadow-xs text-center space-y-4">
              <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
                <BookOpen size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedSubCategoryIds.length > 0
                    ? `No Tests Found in Selected Sub-Categories`
                    : selectedCategoryIds.length > 0
                      ? `No Tests Found in Selected Categories`
                      : 'No Test Series Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {selectedSubCategoryIds.length > 0 || selectedCategoryIds.length > 0
                    ? `No mock test series match your active combination of categories, sub-categories, or access tiers. Try resetting filters or choosing other categories.`
                    : `No mock test series match your current filters or search query.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetCategoryFilters();
                    setFilterType('ALL');
                    setSearchQuery('');
                    setSidebarSearch('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw size={13} />
                  <span>Reset All Filters ({availableSeries.length})</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* MY ENROLLED SERIES TAB */}
      {activeTab === 'my_series' && (() => {
        const selectedSeriesObj = selectedSeriesId
          ? (mySeries.find(s => s.id === selectedSeriesId) || availableSeries.find(s => s.id === selectedSeriesId) || null)
          : null;

        const displayMySeries = selectedSeriesObj
          ? [selectedSeriesObj]
          : mySeries.filter(s => !mySeriesSearchQuery.trim() || s.title.toLowerCase().includes(mySeriesSearchQuery.toLowerCase()) || (s.description && s.description.toLowerCase().includes(mySeriesSearchQuery.toLowerCase())));

        return (
          <div className="space-y-6 w-full">
            {/* Selected Series Breadcrumb Header with Back button */}
            {selectedSeriesObj && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl shadow-lg border border-indigo-900/60 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesId(null)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/10 active:scale-95 shrink-0"
                  >
                    <ArrowLeft size={16} />
                    <span>View All Series</span>
                  </button>
                  <div className="border-l border-white/20 pl-3 min-w-0">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Selected Test Series</span>
                    <h3 className="text-sm sm:text-base font-black text-white truncate">{selectedSeriesObj.title}</h3>
                  </div>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold shrink-0">
                  {selectedSeriesObj.tests?.length || 0} Mock Tests Inside
                </span>
              </div>
            )}

            {/* Search box for Enrolled Series (Only shown when browsing all series) */}
            {!selectedSeriesObj && mySeries.length > 1 && (
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search enrolled series by title..."
                    value={mySeriesSearchQuery}
                    onChange={(e) => setMySeriesSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold px-2">
                  {displayMySeries.length} Enrolled Series
                </span>
              </div>
            )}

            {displayMySeries.length > 0 ? (
              <div className="space-y-6">
                {displayMySeries.map(series => {
                  const isFreeSeries = Boolean(series.is_free) || Number(series.price) === 0;
                  const enrollmentStatus = series.enrollment_status;
                  const isApproved = isFreeSeries || enrollmentStatus === 'APPROVED' || series.unlocked_via_elite_pass;
                  const isPending = !isFreeSeries && (enrollmentStatus === 'PENDING' || enrollmentStatus === 'PAYMENT_PENDING');
                  const isRejected = !isFreeSeries && enrollmentStatus === 'REJECTED';
                  const testsCount = series.tests?.length || 0;

                  return (
                    <div
                      key={series.id}
                      id={`series-${series.id}`}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-500"
                    >
                    {/* Header Banner */}
                    <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-200 text-xs font-medium rounded-md">
                            {series.category_name || 'General'}
                          </span>
                          {series.sub_category_name && (
                            <span className="px-2 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-xs font-semibold rounded-md flex items-center gap-1">
                              <FolderTree size={11} className="text-indigo-400" />
                              {series.sub_category_name}
                            </span>
                          )}
                          {isFreeSeries ? (
                            <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold rounded-md flex items-center gap-1">
                              <CheckCircle2 size={12} /> Free Access
                            </span>
                          ) : isApproved ? (
                            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-semibold rounded-md flex items-center gap-1">
                              <CheckCircle2 size={12} /> Active Enrollment
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-xs font-semibold rounded-md flex items-center gap-1">
                              <Clock size={12} /> Payment Under Verification
                            </span>
                          ) : isRejected ? (
                            <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 text-xs font-semibold rounded-md flex items-center gap-1">
                              <AlertCircle size={12} /> Payment Rejected
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{series.title}</h2>
                        {series.description && (
                          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                            {series.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Access Validity</div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                            <Calendar size={13} className="text-slate-400" />
                            {series.validity_days || 180} Days Access
                          </div>
                        </div>
                        {isRejected && (
                          <button
                            onClick={() => handleOpenPayment(series)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            Resubmit Payment
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tests Section */}
                    <div className="p-5 sm:p-6 bg-white">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-indigo-600" />
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                            Tests Inside this Series ({testsCount})
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {testsCount > 0 ? `${testsCount} Mock Tests Available` : 'Awaiting publication'}
                        </span>
                      </div>

                      {!isApproved ? (
                        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                          <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="font-bold text-sm">Access Verification In Progress</p>
                            <p className="text-amber-800 text-xs mt-0.5">
                              Tests will unlock automatically once your payment UTR is verified by the administration.
                            </p>
                          </div>
                        </div>
                      ) : series.tests && series.tests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {series.tests.map(test => {
                            const hasAttempt = Boolean(test.latest_attempt && test.latest_attempt.status === 'SUBMITTED');
                            const attemptCount = test.student_attempts_count || 0;
                            const canAttempt = !test.max_attempts || Number(test.max_attempts) === 0 || attemptCount < Number(test.max_attempts);
                            const scorePercent = test.latest_attempt?.percentage != null ? Number(test.latest_attempt.percentage).toFixed(0) : null;

                            return (
                              <div
                                key={test.id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                        hasAttempt
                                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                      }`}>
                                        {hasAttempt ? <CheckCircle size={18} /> : <PlayCircle size={18} />}
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                          {test.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          Online CBT Format
                                        </p>
                                      </div>
                                    </div>
                                    {hasAttempt ? (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border flex items-center gap-1 ${
                                          test.latest_attempt?.passed
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                          {test.latest_attempt?.passed ? (
                                            <>
                                              <CheckCircle size={12} /> PASSED
                                            </>
                                          ) : (
                                            <>
                                              <XCircle size={12} /> FAILED
                                            </>
                                          )}
                                        </span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-md">
                                          Score: {scorePercent}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold rounded-md shrink-0">
                                        Ready
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-3">
                                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                                      <Clock size={12} className="text-slate-400" /> {test.duration_minutes} Mins
                                    </span>
                                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                                      <Award size={12} className="text-slate-400" /> {test.total_marks} Marks
                                    </span>
                                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg flex items-center gap-1">
                                      <HelpCircle size={12} className="text-slate-400" /> {test.questions_count || 50} Qs
                                    </span>
                                    {hasAttempt && test.latest_attempt && (
                                      <>
                                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-lg flex items-center gap-1">
                                          <CheckCircle size={12} /> {test.latest_attempt.correct_answers || 0} Correct
                                        </span>
                                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-lg flex items-center gap-1">
                                          <XCircle size={12} /> {test.latest_attempt.incorrect_answers || 0} Incorrect
                                        </span>
                                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1">
                                          <Target size={12} /> {Number(test.latest_attempt.accuracy || 0).toFixed(0)}% Accuracy
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                  {hasAttempt ? (
                                    <button
                                      type="button"
                                      onClick={() => handleViewScorecard(test.latest_attempt.id)}
                                      className="text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <BarChart2 size={14} /> Scorecard
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Not Attempted
                                    </span>
                                  )}

                                  {(() => {
                                    const isStartingThis = startingTest?.id === test.id;
                                    return (
                                      <button
                                        type="button"
                                        disabled={!canAttempt || isStartingThis || Boolean(startingTest)}
                                        onClick={() => handleStartTest(test)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                          canAttempt && !startingTest
                                            ? hasAttempt
                                              ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                        }`}
                                      >
                                        {isStartingThis ? (
                                          <>
                                            <Loader2 size={13} className="animate-spin text-indigo-600" />
                                            <span>Starting...</span>
                                          </>
                                        ) : hasAttempt ? (
                                          <>
                                            <RotateCcw size={13} /> Retake
                                          </>
                                        ) : (
                                          <>
                                            <PlayCircle size={14} /> Start Test
                                          </>
                                        )}
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center space-y-2">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                            <BookOpen size={20} />
                          </div>
                          <p className="font-bold text-slate-800 text-sm">No Mock Tests Published Yet</p>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Tests added to this series by your institution faculty will appear here automatically.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
              <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Enrolled Test Series Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Enroll in free foundational practice mocks or unlock full competitive test series packs to begin your preparation.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Browse Available Series
              </button>
            </div>
          )}
        </div>
      );
    })()}

      {/* ACHIEVEMENTS TAB - 3D ANIMATED GAMIFIED TROPHY HALL */}
      {activeTab === 'achievements' && (() => {
        const achList = Array.isArray(achievements) ? achievements : [];
        const unlockedCount = achList.filter((a: any) => Boolean(a.is_unlocked || a.earned_at)).length;
        const totalBadges = achList.length || 6;
        const totalStarsEarned = achList
          .filter((a: any) => Boolean(a.is_unlocked || a.earned_at))
          .reduce((sum: number, a: any) => sum + Math.max(1, Math.min(5, Number(a.star_count || a.stars_count || 1))), 0);
        const progressPercent = totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0;
        const prestigeTitle =
          unlockedCount === 0
            ? 'Aspirant'
            : unlockedCount === 1
              ? 'Rookie Achiever'
              : unlockedCount <= 3
                ? 'Dedicated Scholar'
                : unlockedCount < totalBadges
                  ? 'Elite Master'
                  : 'Grand Champion 👑';

        const getBadgeTheme = (code: string, isEarned: boolean) => {
          switch (code) {
            case 'FIRST_TEST':
              return {
                tierName: 'Bronze Tier',
                aura: 'bg-amber-400',
                gradient: 'from-amber-400 via-yellow-300 to-amber-600',
                border: 'border-amber-300/80',
                bg: 'from-amber-500/10 via-yellow-500/5 to-white',
                icon: <Star size={26} className={isEarned ? "fill-amber-300 text-amber-500 drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)]" : "text-slate-400"} />
              };
            case 'FIVE_TESTS':
              return {
                tierName: 'Silver Tier',
                aura: 'bg-cyan-400',
                gradient: 'from-cyan-400 via-blue-400 to-indigo-600',
                border: 'border-cyan-300/80',
                bg: 'from-cyan-500/10 via-blue-500/5 to-white',
                icon: <Award size={26} className={isEarned ? "fill-cyan-300/40 text-cyan-500 drop-shadow-[0_4px_8px_rgba(6,182,212,0.6)]" : "text-slate-400"} />
              };
            case 'TEN_TESTS':
              return {
                tierName: 'Gold Tier',
                aura: 'bg-yellow-400',
                gradient: 'from-yellow-300 via-amber-400 to-amber-600',
                border: 'border-amber-400/80',
                bg: 'from-amber-500/15 via-yellow-500/5 to-white',
                icon: <Trophy size={26} className={isEarned ? "fill-amber-300 text-amber-600 drop-shadow-[0_4px_8px_rgba(234,179,8,0.6)]" : "text-slate-400"} />
              };
            case 'HIGH_ACCURACY_80':
              return {
                tierName: 'Emerald Precision',
                aura: 'bg-emerald-400',
                gradient: 'from-emerald-400 via-teal-400 to-emerald-600',
                border: 'border-emerald-300/80',
                bg: 'from-emerald-500/10 via-teal-500/5 to-white',
                icon: <Target size={26} className={isEarned ? "text-emerald-500 drop-shadow-[0_4px_8px_rgba(16,185,129,0.6)]" : "text-slate-400"} />
              };
            case 'WEEKLY_STREAK_4':
              return {
                tierName: 'Inferno Streak',
                aura: 'bg-orange-500',
                gradient: 'from-rose-500 via-orange-500 to-amber-400',
                border: 'border-orange-300/80',
                bg: 'from-orange-500/10 via-red-500/5 to-white',
                icon: <Flame size={26} className={isEarned ? "fill-orange-400 text-rose-500 animate-pulse drop-shadow-[0_4px_8px_rgba(249,115,22,0.6)]" : "text-slate-400"} />
              };
            case 'SUPER_SCORER_90':
            default:
              return {
                tierName: 'Diamond Champion',
                aura: 'bg-purple-400',
                gradient: 'from-fuchsia-400 via-purple-500 to-indigo-600',
                border: 'border-purple-300/80',
                bg: 'from-purple-500/10 via-indigo-500/5 to-white',
                icon: <Crown size={26} className={isEarned ? "fill-amber-300 text-purple-600 drop-shadow-[0_4px_8px_rgba(168,85,247,0.6)]" : "text-slate-400"} />
              };
          }
        };

        return (
          <div className="space-y-6">
            {/* 3D Glassmorphic Arena Mastery Banner */}
            <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Ambient Lighting Orbs in 3D */}
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left Column: Trophy + Title + Tier */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-1 flex items-center justify-center shadow-[0_12px_24px_rgba(245,158,11,0.35),inset_0_2px_4px_rgba(255,255,255,0.8)] shrink-0">
                    <div className="w-full h-full rounded-xl bg-slate-950/60 flex items-center justify-center backdrop-blur-xs">
                      <Trophy size={32} className="text-amber-300 drop-shadow-[0_4px_8px_rgba(245,158,11,0.8)]" />
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-1.5">
                      <Sparkles size={11} className="text-amber-400" />
                      <span>Student Mastery Hall</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Your Achievement Badges & Trophies</span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Earn rare 3D badges, unlock stars, and level up your mastery prestige by attempting national mock tests.
                    </p>
                  </div>
                </div>

                {/* Right Column: Mastery Progress Gauge & Stats */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[260px] sm:min-w-[300px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Crown size={14} className="text-amber-400" />
                      <span>Rank: <strong className="text-white">{prestigeTitle}</strong></span>
                    </span>
                    <span className="text-amber-400 font-black text-sm">
                      {unlockedCount} / {totalBadges} Badges
                    </span>
                  </div>

                  {/* 3D Animated Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-800/90 p-0.5 border border-white/10 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span>{totalStarsEarned} Stars Mastered</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {progressPercent}% Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Modern Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {achList.length > 0 ? (
                achList.map((ach: any, idx: number) => {
                  const isEarned = Boolean(ach.is_unlocked || ach.earned_at);
                  const starCount = Math.max(1, Math.min(5, Number(ach.star_count || ach.stars_count || 1)));
                  const theme = getBadgeTheme(ach.badge_code || '', isEarned);

                  return (
                    <div
                      key={ach.id || idx}
                      className={`relative p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
                        isEarned
                          ? `bg-gradient-to-b ${theme.bg} ${theme.border} shadow-[0_12px_28px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_22px_40px_-10px_rgba(245,158,11,0.25)] hover:-translate-y-2 hover:border-amber-400`
                          : `bg-white hover:bg-slate-50/60 border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5`
                      }`}
                    >
                      {/* 3D Specular Top Rim Reflection */}
                      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${
                        isEarned ? 'via-amber-400' : 'via-slate-300/50'
                      } to-transparent`} />

                      <div>
                        {/* Top Row: 3D Medallion + Star Badges Array */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          {/* 3D Medallion */}
                          <div className="relative flex items-center justify-center shrink-0">
                            {/* 3D Radiant Ambient Glow Aura */}
                            <div className={`absolute -inset-1 rounded-3xl blur-lg transition-all duration-500 ${
                              isEarned ? `${theme.aura} opacity-50 group-hover:opacity-85 group-hover:scale-110` : 'bg-slate-300 opacity-20'
                            }`} />

                            {/* 3D Beveled Coin Container */}
                            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1.5 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3 ${
                              isEarned
                                ? `bg-gradient-to-b from-white/80 via-white/40 to-slate-400/40 shadow-[0_10px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.2)]`
                                : `bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-[0_6px_12px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,0.6)]`
                            }`}>
                              {/* Inner Metallic Coin Face */}
                              <div className={`w-full h-full rounded-xl flex items-center justify-center border shadow-inner transition-colors ${
                                isEarned
                                  ? `bg-gradient-to-tr ${theme.gradient} border-white/60`
                                  : `bg-slate-100 border-slate-300 text-slate-400`
                              }`}>
                                {isEarned ? theme.icon : <Lock size={20} className="text-slate-400 drop-shadow-xs" />}
                              </div>
                            </div>
                          </div>

                          {/* Right: Tier Badge & 3D Stars Array */}
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${
                              isEarned
                                ? 'bg-amber-400/20 text-amber-950 border-amber-300/80 font-black'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {theme.tierName}
                            </span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, sIdx) => {
                                const isFilled = sIdx < starCount;
                                return (
                                  <Star
                                    key={sIdx}
                                    size={14}
                                    className={`transition-transform duration-300 group-hover:scale-110 ${
                                      isEarned && isFilled
                                        ? 'text-amber-500 fill-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]'
                                        : isFilled
                                          ? 'text-slate-300 fill-slate-200'
                                          : 'text-slate-200'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {ach.title || ach.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {ach.description || 'Complete required tests to unlock this achievement badge.'}
                        </p>
                      </div>

                      {/* Bottom Row: Unlocked Status / Target Progress */}
                      <div className="pt-4 mt-4 border-t border-slate-100/80 flex items-center justify-between text-xs">
                        {isEarned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 size={13} className="text-emerald-600 animate-pulse" />
                            <span>Unlocked {ach.earned_at ? `on ${new Date(ach.earned_at).toLocaleDateString('en-GB')}` : ''}</span>
                          </span>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                              <Lock size={12} className="text-slate-400" />
                              <span>Locked</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('discover')}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                            >
                              <span>Take Exam</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
                  <Trophy size={40} className="mx-auto text-amber-500 mb-1" />
                  <h3 className="text-base font-bold text-slate-800">No Achievements Recorded Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete your first test to unlock your beginner achievement badge and start building your mastery score!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('discover')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Browse Tests
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* VIEW DETAILS MODAL */}
      {showDetailModal && selectedSeriesDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-md">
                    {selectedSeriesDetail.category_name || 'Category'}
                  </span>
                  {selectedSeriesDetail.sub_category_name && (
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-md flex items-center gap-1">
                      <FolderTree size={12} className="text-indigo-600" />
                      {selectedSeriesDetail.sub_category_name}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">{selectedSeriesDetail.title}</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedSeriesDetail.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center text-xs">
              <div>
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Tests</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedSeriesDetail.tests?.length || selectedSeriesDetail.total_tests_count || 1} Tests</div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Duration</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedSeriesDetail.tests?.[0]?.duration_minutes || selectedSeriesDetail.duration_minutes || 60} Mins</div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Validity</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedSeriesDetail.validity_days || 365} Days</div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Language</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedSeriesDetail.language || 'Bilingual'}</div>
              </div>
            </div>

            {selectedSeriesDetail.tests && selectedSeriesDetail.tests.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600" />
                  <span>Tests in this Series ({selectedSeriesDetail.tests.length})</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSeriesDetail.tests.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {t.duration_minutes} Mins • {t.total_marks} Marks • {t.questions_count || t.question_count || 0} Questions
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        Available
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSeriesDetail.instructions && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                <h4 className="font-bold text-slate-900">Exam Instructions:</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{selectedSeriesDetail.instructions}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Price</div>
                <div className="text-xl font-bold text-slate-900">
                  {selectedSeriesDetail.is_free ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    `₹${selectedSeriesDetail.price}`
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {selectedSeriesDetail.enrollment_status === 'APPROVED' || selectedSeriesDetail.unlocked_via_elite_pass ? (
                  <button
                    onClick={() => {
                      const id = selectedSeriesDetail.id;
                      setShowDetailModal(false);
                      handleGoToSeriesTests(id);
                    }}
                    className="btn-3d-yoyo-emerald px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    {selectedSeriesDetail.unlocked_via_elite_pass && <Crown size={13} className="text-amber-300 drop-shadow-xs" />}
                    <span>Go to Tests</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (selectedSeriesDetail.enrollment_status === 'PENDING' || selectedSeriesDetail.enrollment_status === 'PAYMENT_PENDING') ? (
                  <span className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs rounded-xl flex items-center gap-1.5">
                    <Clock size={14} /> Under Review
                  </span>
                ) : selectedSeriesDetail.is_free ? (
                  <button
                    onClick={() => handleEnrollFree(selectedSeriesDetail)}
                    className="btn-3d-yoyo-emerald px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Enroll Free</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenPayment(selectedSeriesDetail)}
                    className="btn-3d-yoyo-indigo px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Buy Now</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR PAYMENT & UTR SUBMISSION MODAL */}
      {showPayModal && paymentSeries && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold rounded-md">
                  QR / UPI Payment
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">Enroll in {paymentSeries.title}</h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-950">Payment Submitted!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">{paymentSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {/* Amount to Pay Banner */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Amount to Pay</div>
                    <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
                      <span>₹{Number(paymentSeries.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-2xs">
                    Full Test Series Pass
                  </span>
                </div>

                {/* HDFC Bank QR Code Container */}
                <div className="relative flex flex-col items-center">
                  <div className="p-3 bg-white border border-gray-300 rounded-xl shadow-xs relative flex items-center justify-center">
                    <img
                      src="/assets/hdfc-qr.png"
                      alt="HDFC Bank QR Code"
                      className="w-48 h-48 object-contain rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2.5">
                    Scan & Pay via PhonePe / GPay / Paytm / Any UPI App
                  </span>
                </div>

                {/* Bank Details Table */}
                <div className="w-full overflow-hidden border border-gray-200 rounded-xl shadow-2xs bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 w-36 border-r border-gray-200">
                          Account Holder
                        </td>
                        <td className="py-2.5 px-4 font-bold text-gray-900 tracking-wide uppercase text-xs">
                          EXAMIRROREDUTECH PRIVATE LIMITED
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                          Ac/No.
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 text-sm">
                          50200100145470
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                          Bank
                        </td>
                        <td className="py-2.5 px-4 font-bold text-gray-900 uppercase">
                          HDFC BANK
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                          IFSC
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-900 uppercase">
                          HDFC0002643
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                          Branch
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-900 uppercase">
                          PATLIPUTRA
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                          Account Type
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-900">
                          Current Account
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {paymentErrorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{paymentErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Bank UTR / Transaction Reference ID *</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Mandatory</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 423871928374 or UPI Ref ID"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-semibold uppercase bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Payment Screenshot (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setScreenshotFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-slate-200 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    disabled={isSubmittingPayment}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {isSubmittingPayment ? 'Submitting...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DETAILED SCORECARD MODAL */}
      {showScorecardModal && scorecardData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl w-full border border-slate-200 shadow-2xl transition-all duration-300 flex flex-col font-sans ${
            isScorecardFullWidth
              ? 'max-w-[98vw] h-[96vh] p-5 sm:p-7'
              : 'max-w-3xl max-h-[90vh] p-6 sm:p-7'
          }`}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-md shadow-2xs">
                    Examination Result
                  </span>
                  {(() => {
                    const passingMarks = Number(scorecardData.test_passing_marks || scorecardData.passing_marks || 40);
                    const isPassed = scorecardData.is_passed !== undefined
                      ? Boolean(scorecardData.is_passed)
                      : Number(scorecardData.final_score || 0) >= passingMarks;

                    return isPassed ? (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-xs rounded-md shadow-2xs flex items-center gap-1">
                        <CheckCircle size={13} /> PASSED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-rose-600 text-white font-bold text-xs rounded-md shadow-2xs flex items-center gap-1">
                        <XCircle size={13} /> FAILED
                      </span>
                    );
                  })()}
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Min Passing Marks: {scorecardData.test_passing_marks || scorecardData.passing_marks || 40})
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">{scorecardData.test_title || 'Mock Examination'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submitted on {new Date(scorecardData.submitted_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Full Width Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsScorecardFullWidth(!isScorecardFullWidth)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors cursor-pointer shadow-2xs ${
                    isScorecardFullWidth
                      ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={isScorecardFullWidth ? "Standard View" : "Full Width View"}
                >
                  {isScorecardFullWidth ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span className="hidden sm:inline">{isScorecardFullWidth ? 'Standard View' : 'Full Width'}</span>
                </button>

                <button
                  onClick={handleDownloadScorecardPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                  title="Download Official PDF Marksheet"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowScorecardModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 pt-4">

              {/* COMPARATIVE IMPROVEMENT INTELLIGENCE CARD (Pichle Baar se Kitna Improvement Hua) */}
              {(() => {
                const comp = scorecardData.comparison;
                const hasPrev = Boolean(comp?.has_previous);
                const scoreDiff = Number(comp?.score_diff || 0);
                const pctDiff = Number(comp?.percentage_diff || 0);
                const accDiff = Number(comp?.accuracy_diff || 0);
                const timeDiff = Number(comp?.time_diff_seconds || 0);
                const attemptNum = comp?.attempt_number || 1;
                const totalAtts = comp?.total_attempts || 1;
                const prevDate = comp?.previous_attempt?.submitted_at
                  ? new Date(comp.previous_attempt.submitted_at).toLocaleDateString()
                  : null;

                if (!hasPrev) {
                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                          <Sparkles size={20} className="text-amber-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-indigo-950">
                              Baseline Attempt Recorded (Attempt #{attemptNum})
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800 text-[10px] font-bold">
                              Initial Benchmark
                            </span>
                          </div>
                          <p className="text-xs text-indigo-900/80 mt-0.5 leading-relaxed">
                            Yeh aapka pehla attempt hai ({Number(scorecardData.final_score || 0).toFixed(2)} Marks). Dobara test dekar apna progress aur pichle baar se improvement track karein!
                          </p>
                        </div>
                      </div>
                      {totalAtts > 1 && (
                        <span className="text-[11px] font-bold text-indigo-700 bg-white/90 px-3 py-1 rounded-xl border border-indigo-200 shrink-0 shadow-2xs">
                          {totalAtts} Total Attempts
                        </span>
                      )}
                    </div>
                  );
                }

                const isImproved = scoreDiff > 0 || (scoreDiff === 0 && pctDiff > 0);
                const isDeclined = scoreDiff < 0 || pctDiff < 0;

                return (
                  <div className={`p-4 rounded-2xl border shadow-xs transition-all space-y-3 ${
                    isImproved
                      ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950'
                      : isDeclined
                        ? 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-300 text-rose-950'
                        : 'bg-gradient-to-r from-sky-50 via-slate-50 to-sky-50 border-sky-300 text-sky-950'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-black/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shadow-xs shrink-0 ${
                          isImproved
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : isDeclined
                              ? 'bg-rose-600 text-white shadow-rose-500/20'
                              : 'bg-sky-600 text-white shadow-sky-500/20'
                        }`}>
                          {isImproved ? <TrendingUp size={24} /> : isDeclined ? <TrendingDown size={24} /> : <Target size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm sm:text-base">
                              {isImproved
                                ? `🎉 Pichle Attempt se Zabardast Improvement! (${scoreDiff > 0 ? `+${scoreDiff.toFixed(2)}` : scoreDiff.toFixed(2)} Marks)`
                                : isDeclined
                                  ? `⚠️ Pichle Attempt se Score Dip (${scoreDiff.toFixed(2)} Marks)`
                                  : `🎯 Consistent Performance (${Number(scorecardData.final_score || 0).toFixed(2)} Marks)`
                              }
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isImproved
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : isDeclined
                                  ? 'bg-rose-200 text-rose-900 border border-rose-300'
                                  : 'bg-sky-200 text-sky-900 border border-sky-300'
                            }`}>
                              Attempt #{attemptNum} of {totalAtts}
                            </span>
                          </div>
                          <p className="text-xs opacity-85 mt-0.5 leading-relaxed">
                            {isImproved
                              ? `Pichle attempt (${comp.previous_attempt?.final_score} Marks on ${prevDate}) ki tulna me aapne ${scoreDiff > 0 ? `+${scoreDiff.toFixed(2)} marks` : ''} (${pctDiff > 0 ? `+${pctDiff.toFixed(2)}%` : ''}) zyada score kiya!`
                              : isDeclined
                                ? `Pichle attempt (${comp.previous_attempt?.final_score} Marks on ${prevDate}) se thoda kam score aaya. Niche weak topics ka revision karein aur dobara try karein!`
                                : `Aapka score pichle attempt (${prevDate}) ke barabar raha. Agle attempt me higher accuracy ka target banayein!`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Progress Metrics Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs font-bold shrink-0">
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                          scoreDiff >= 0
                            ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100/90 text-rose-900 border-rose-300'
                        }`}>
                          <Award size={13} className={scoreDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'} />
                          <span>Marks:</span>
                          <span>{scoreDiff > 0 ? `+${scoreDiff.toFixed(2)}` : scoreDiff.toFixed(2)}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                          accDiff >= 0
                            ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100/90 text-rose-900 border-rose-300'
                        }`}>
                          <Target size={13} className={accDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'} />
                          <span>Accuracy:</span>
                          <span>{accDiff > 0 ? `+${accDiff.toFixed(1)}%` : `${accDiff.toFixed(1)}%`}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl border bg-white/90 text-slate-800 border-slate-200 flex items-center gap-1.5 shadow-2xs">
                          <Clock size={13} className="text-slate-500" />
                          <span>{timeDiff > 0 ? `${timeDiff}s faster ⚡` : timeDiff < 0 ? `${Math.abs(timeDiff)}s slower` : 'Same time'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Historical Attempts Timeline / Selector */}
                    {Array.isArray(scorecardData.attempts_history) && scorecardData.attempts_history.length > 1 && (
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 shrink-0">
                          <History size={12} /> Har Attempt Ka Record:
                        </span>
                        {scorecardData.attempts_history.map((att: any) => {
                          const isCurrent = Number(att.id) === Number(scorecardData.id);
                          return (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => handleViewScorecard(att.id)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                isCurrent
                                  ? 'bg-slate-900 text-white shadow-xs ring-2 ring-indigo-500/40'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <span>Attempt #{att.attempt_number}</span>
                              <span className={isCurrent ? 'text-amber-300 font-extrabold' : 'text-slate-500'}>
                                ({Number(att.final_score).toFixed(1)}m • {Number(att.accuracy).toFixed(0)}%)
                              </span>
                              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Score Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Marks Scored</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {Number(scorecardData.final_score || 0).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ {scorecardData.test_total_marks || scorecardData.total_marks}</span>
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Percentage</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{Number(scorecardData.percentage || 0).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Accuracy</div>
                <div className={`text-xl font-bold mt-0.5 ${Number(scorecardData.accuracy || 0) >= 50 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {Number(scorecardData.accuracy || 0).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Time Taken</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {(() => {
                    const sec = Number(scorecardData.duration_seconds || 0);
                    if (sec <= 0) return '0s';
                    if (sec < 60) return `${sec}s`;
                    const h = Math.floor(sec / 3600);
                    const m = Math.floor((sec % 3600) / 60);
                    const s = sec % 60;
                    if (h > 0) return `${h}h ${m}m ${s > 0 ? `${s}s` : ''}`.trim();
                    return s > 0 ? `${m}m ${s}s` : `${m}m`;
                  })()}
                </div>
              </div>
            </div>

            {/* Answer Distribution */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                <div className="font-bold text-lg">{scorecardData.correct_answers}</div>
                <div className="text-[11px] font-semibold">Correct</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                <div className="font-bold text-lg">{scorecardData.incorrect_answers}</div>
                <div className="text-[11px] font-semibold">Incorrect</div>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700">
                <div className="font-bold text-lg">{scorecardData.unanswered}</div>
                <div className="text-[11px] font-semibold">Unanswered</div>
              </div>
            </div>

            {/* Topic & Weak Area Performance Analytics */}
            {topicAnalytics.length > 0 && (
              <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-indigo-600" />
                      Topic & Module Performance Analytics
                    </h4>
                    <p className="text-[11px] text-slate-500">Breakdown of accuracy and weak areas to target for revision.</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {topicAnalytics.length} {topicAnalytics.length === 1 ? 'Topic' : 'Topics'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {topicAnalytics.map((topic, tIdx) => {
                    const acc = Math.round(topic.accuracy);
                    const isStrong = topic.status === 'Strong';
                    const isModerate = topic.status === 'Moderate';

                    return (
                      <div
                        key={tIdx}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900 truncate" title={topic.topicName}>
                            {topic.topicName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isStrong
                                ? 'bg-emerald-100 text-emerald-800'
                                : isModerate
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isStrong ? 'Strong Area' : isModerate ? 'Moderate' : 'Needs Practice'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isStrong ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.max(acc, 5)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span>{topic.correct} of {topic.total} correct</span>
                            <span className="font-bold text-slate-800">{acc}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI / Smart Guidance Note */}
                {(() => {
                  const weakTopics = topicAnalytics.filter(t => t.status === 'Weak');
                  if (weakTopics.length > 0) {
                    return (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
                        <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Targeted Revision Suggestion:</span> You have scope for improvement in{' '}
                          <span className="font-semibold underline decoration-amber-400">
                            {weakTopics.map(w => w.topicName).join(', ')}
                          </span>. Review incorrect questions below before retaking!
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-900">
                      <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Excellent Performance:</span> You demonstrated balanced mastery across all assessed topics!
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Detailed Question Review */}
            {scorecardData.question_analysis && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Question Solutions</h4>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {scorecardData.question_analysis.map((q: any, idx: number) => {
                    const isCorrect = q.student_is_correct === 1;
                    const isUnanswered = !q.selected_option_key;

                    const correctOption = q.options?.find((o: any) => o.is_correct === 1 || o.is_correct === true);
                    const selectedOption = q.options?.find((o: any) => o.option_key === q.selected_option_key);

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isUnanswered
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-900">Q{idx + 1}. {cleanQuestionText(q.question_text)}</span>
                          {isCorrect ? (
                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shrink-0"><CheckCircle size={13} /> Correct</span>
                          ) : isUnanswered ? (
                            <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0">Unanswered</span>
                          ) : (
                            <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shrink-0"><XCircle size={13} /> Incorrect</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                          <div>Your Choice: <b className={isCorrect ? 'text-emerald-700' : isUnanswered ? 'text-slate-500' : 'text-rose-600'}>{selectedOption?.option_text || 'None'}</b></div>
                          <div>Correct Answer: <b className="text-emerald-700">{correctOption?.option_text || 'Not Found'}</b></div>
                        </div>

                        {q.explanation && (
                          <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700">
                            <b className="text-slate-900">Explanation:</b> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowScorecardModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 max-w-sm ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-slate-900'
              : toast.type === 'error'
                ? 'bg-white border-rose-200 text-slate-900'
                : 'bg-white border-indigo-200 text-slate-900'
          }`}>
            <div className={`p-1.5 rounded-lg shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              toast.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 size={16} /> :
                toast.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
            </div>
            <div className="flex-1 text-xs">
              {toast.title && <div className="font-bold text-slate-900 mb-0.5">{toast.title}</div>}
              <p className="text-slate-600 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* EXAMINATION INITIALIZING SCREEN */}
      {startingTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white w-full max-w-sm rounded-3xl p-7 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Animated Logo / Icon */}
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Zap size={28} className="animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-md uppercase tracking-wider inline-block">
                CBT Examination
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Starting Examination
              </h3>
              <p className="text-xs font-semibold text-indigo-600 truncate px-2">
                {startingTest.title}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                Setting up proctoring & loading questions...
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full w-3/4 animate-pulse transition-all" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Secure Proctored Environment</span>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT SUCCESS CELEBRATION MODAL */}
      {enrolledSuccessSeries && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200 inline-block mb-1.5">
                ENROLLMENT ACTIVATED
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Enrolled Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You now have full free access to <b>"{enrolledSuccessSeries.title}"</b>. You can start practicing mock tests right away.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setEnrolledSuccessSeries(null);
                  setActiveTab('my_series');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start Practice Tests</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALLET SECONDARY CONFIRMATION PURCHASE MODAL */}
      <WalletPurchaseConfirmModal
        isOpen={showWalletConfirmModal}
        onClose={() => setShowWalletConfirmModal(false)}
        item={selectedWalletItem}
        walletBalance={Number(walletOverview?.walletBalance || 0)}
        onSuccess={() => {
          loadData();
          setActiveTab('my_series');
        }}
        onOpenRecharge={handleOpenRechargeFromModal}
      />

      {/* STUDENT WALLET RECHARGE MODAL */}
      <StudentRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        defaultAmount={rechargeShortfall}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
