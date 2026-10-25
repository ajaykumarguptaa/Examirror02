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
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [mySeriesSearchQuery, setMySeriesSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');

  // Category & Sub-Category Sidebar State
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
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

  // Styled Toast & Celebration Modal State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title?: string; message: string } | null>(null);
  const [enrolledSuccessSeries, setEnrolledSuccessSeries] = useState<TestSeriesItem | null>(null);

  // Wallet Purchase & Recharge Modals
  const [walletOverview, setWalletOverview] = useState<any | null>(null);
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

      const catRes = await axios.get('/api/admin/test-series/categories', { headers })
        .catch(() => axios.get('http://localhost:3000/api/admin/test-series/categories', { headers }))
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
          achievements: data.achievements
        } : data;
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

  // Auto-expand selected category
  useEffect(() => {
    if (selectedCategory !== 'ALL') {
      setExpandedCategories(prev => ({ ...prev, [selectedCategory]: true }));
    }
  }, [selectedCategory]);

  const toggleCategoryExpand = (catId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
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

  const categoryCounts = useMemo(() => {
    const counts: Record<number | string, number> = { ALL: availableSeries.length };
    availableSeries.forEach(s => {
      if (s.category_id) {
        counts[s.category_id] = (counts[s.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [availableSeries]);

  const subCategoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    availableSeries.forEach(s => {
      if (s.sub_category_id) {
        counts[s.sub_category_id] = (counts[s.sub_category_id] || 0) + 1;
      }
    });
    return counts;
  }, [availableSeries]);

  const freeSeriesCount = useMemo(() => {
    return availableSeries.filter(s => s.is_free).length;
  }, [availableSeries]);

  const paidSeriesCount = useMemo(() => {
    return availableSeries.filter(s => !s.is_free).length;
  }, [availableSeries]);

  const filteredCategoriesForSidebar = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(cat => {
      const matchCat = cat.name.toLowerCase().includes(q);
      const matchSub = subCategories.some(
        sc => sc.category_id === cat.id && sc.name.toLowerCase().includes(q)
      );
      return matchCat || matchSub;
    });
  }, [categories, subCategories, sidebarSearch]);

  const activeSubCategories = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return subCategories;
    }
    return subCategories.filter(sc => sc.category_id === selectedCategory);
  }, [subCategories, selectedCategory]);

  const filteredSeries = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();
    return availableSeries.filter(s => {
      const matchesCat = selectedCategory === 'ALL' || s.category_id === selectedCategory;
      const matchesSubCat = selectedSubCategory === 'ALL' || s.sub_category_id === selectedSubCategory;
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
      const matchesType = filterType === 'ALL' || (filterType === 'FREE' && s.is_free) || (filterType === 'PAID' && !s.is_free);
      return matchesCat && matchesSubCat && matchesSearch && matchesType;
    });
  }, [availableSeries, selectedCategory, selectedSubCategory, debouncedSearchQuery, filterType]);

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

        {/* Categories Accordion List */}
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {/* Overarching "All Categories" option */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubCategory('ALL');
              if (isMobile) setMobileFilterOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer group ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-indigo-600'
              }`}>
                <LayoutGrid size={15} />
              </span>
              <span>All Categories</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}>
              {availableSeries.length}
            </span>
          </button>

          {/* Dynamic Categories */}
          {filteredCategoriesForSidebar.map(cat => {
            const isCatSelected = selectedCategory === cat.id;
            const isExpanded = expandedCategories[cat.id] ?? isCatSelected;
            const catSubs = subCategories.filter(sc => sc.category_id === cat.id);
            const totalInCat = categoryCounts[cat.id] || 0;

            return (
              <div
                key={cat.id}
                className={`rounded-2xl transition-all border ${
                  isCatSelected
                    ? 'border-indigo-200 bg-indigo-50/40 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                {/* Category Header Row */}
                <div
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubCategory('ALL');
                    setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
                    if (isMobile && catSubs.length === 0) setMobileFilterOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group select-none ${
                    isCatSelected
                      ? 'text-indigo-900'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isCatSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}>
                      {getCategoryIcon(cat.name, isCatSelected)}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Categories Tree (Expanded) */}
                {isExpanded && catSubs.length > 0 && (
                  <div className="pb-2 pt-0.5 px-3 space-y-1">
                    <div className="border-l-2 border-indigo-100 ml-3.5 pl-3 space-y-1">
                      {/* All in this category */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedSubCategory('ALL');
                          if (isMobile) setMobileFilterOpen(false);
                        }}
                        className={`w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isCatSelected && selectedSubCategory === 'ALL'
                            ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60'
                        }`}
                      >
                        <span>All {cat.name}</span>
                        <span className="text-[10px] opacity-80">{totalInCat}</span>
                      </button>

                      {/* Individual Subcategories */}
                      {catSubs.map(sc => {
                        const isSubSelected = isCatSelected && selectedSubCategory === sc.id;
                        const subCount = subCategoryCounts[sc.id] || 0;

                        return (
                          <button
                            type="button"
                            key={sc.id}
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setSelectedSubCategory(sc.id);
                              if (isMobile) setMobileFilterOpen(false);
                            }}
                            className={`w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                              isSubSelected
                                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60'
                            }`}
                          >
                            <span className="truncate pr-2">{sc.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 font-bold ${
                              isSubSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {subCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Clear Filters Button (when filtered) */}
        {(selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL' || filterType !== 'ALL' || searchQuery || sidebarSearch) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubCategory('ALL');
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

        {/* Elite Pass All-Access Promo Mini Card */}
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
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 pb-16 font-sans">
      {/* Minimalist Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        {/* Navigation Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link
              to="/student/dashboard"
              className="hover:text-indigo-600 transition-colors flex items-center gap-1 text-slate-600"
            >
              Dashboard
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <button
              type="button"
              onClick={() => {
                setSelectedSeriesId(null);
                setActiveTab('discover');
              }}
              className={`hover:text-indigo-600 transition-colors cursor-pointer ${
                activeTab === 'discover' && !selectedSeriesId ? 'text-indigo-600 font-bold' : 'text-slate-600'
              }`}
            >
              Test Series
            </button>
            {activeTab === 'my_series' && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-indigo-600 font-bold">My Tests</span>
              </>
            )}
            {activeTab === 'achievements' && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-indigo-600 font-bold">Achievements</span>
              </>
            )}
          </nav>

          {/* Explicit Quick Back when inside a test series or sub-tab */}
          {(selectedSeriesId || activeTab !== 'discover') && (
            <button
              type="button"
              onClick={() => {
                setSelectedSeriesId(null);
                setActiveTab('discover');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <ArrowLeft size={13} />
              <span>Explore All Series</span>
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-indigo-100">
            <Trophy size={14} className="text-indigo-600" /> Online Examination & Test Series
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Practice, Compete & Excel</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Full-length mock tests, weekly test releases, instant scorecard analytics, and achievement badges.
          </p>
        </div>

        {/* Mobile Navigation Sub-Tabs (< sm screens) */}
        <div className="sm:hidden mt-4 pt-3 border-t border-slate-100">
          {renderNavTabs(true)}
        </div>
      </div>

      {/* DISCOVER TAB: Interactive Category & Sub-Category Explorer Sidebar */}
      {activeTab === 'discover' && (
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Desktop Category & Sub-Category Explorer Sidebar (lg+) */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-20 max-h-[calc(100vh-6.5rem)] overflow-y-auto pr-1">
            {renderCategorySidebar(false)}
          </aside>

          {/* Mobile Category Explorer Drawer (< lg) */}
          {mobileFilterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-stretch justify-start">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
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
                    {selectedCategory !== 'ALL' && ' (1)'}
                  </span>
                </button>

                {/* Category Breadcrumb Title & Count */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {selectedCategory === 'ALL'
                      ? 'All Test Series'
                      : (categories.find(c => c.id === selectedCategory)?.name || 'Category')}
                  </h2>
                  {selectedSubCategory !== 'ALL' && (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                      <ChevronRight size={12} />
                      <span className="text-indigo-600 font-bold">
                        {subCategories.find(s => s.id === selectedSubCategory)?.name}
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

            {/* Active Filters Tag Pills */}
            {(selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL' || filterType !== 'ALL' || debouncedSearchQuery) && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs bg-white/70 p-2.5 px-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px]">Filtered by:</span>
                {selectedCategory !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold">
                    <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedCategory('ALL'); setSelectedSubCategory('ALL'); }}
                      className="hover:text-indigo-900 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedSubCategory !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold">
                    <span>{subCategories.find(s => s.id === selectedSubCategory)?.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubCategory('ALL')}
                      className="hover:text-indigo-900 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
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
                    setSelectedCategory('ALL');
                    setSelectedSubCategory('ALL');
                    setFilterType('ALL');
                    setSearchQuery('');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold underline ml-1 cursor-pointer"
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
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {series.thumbnail_url && (
                        <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                          <img
                            src={series.thumbnail_url}
                            alt={series.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-white text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-md">
                            {series.category_name || 'General'}
                          </span>
                          {series.sub_category_name && (
                            <span className="px-2 py-0.5 bg-indigo-50/70 text-indigo-700 border border-indigo-200/60 text-[10px] font-semibold rounded-md flex items-center gap-1">
                              <FolderTree size={11} className="text-indigo-500" />
                              {series.sub_category_name}
                            </span>
                          )}
                        </div>
                        {series.unlocked_via_elite_pass ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black rounded-md flex items-center gap-1">
                            <Crown size={12} className="text-amber-600" /> ELITE PASS
                          </span>
                        ) : series.is_free ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-md">
                            FREE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold rounded-md">
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

                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs mt-4">
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
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {series.unlocked_via_elite_pass && <Crown size={13} className="text-amber-300" />}
                          <span>Go to Tests</span>
                        </button>
                      ) : isPending ? (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                          <Clock size={13} /> Under Review
                        </span>
                      ) : series.is_free ? (
                        <button
                          onClick={() => handleEnrollFree(series)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          Enroll Free
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenWalletBuy(series)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
              <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <BookOpen size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Test Series Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No mock test series match your current category, sub-category, or search filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedSubCategory('ALL');
                  setFilterType('ALL');
                  setSearchQuery('');
                  setSidebarSearch('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>View All Categories</span>
              </button>
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

      {/* ACHIEVEMENTS TAB */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
                <Star size={22} className="fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Achievement Badges & Stars</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Earn badges by completing tests, scoring 80%+, and maintaining weekly test streaks.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.isArray(achievements) && achievements.length > 0 ? (
              achievements.map((ach: any, idx: number) => {
                const isEarned = Boolean(ach.is_unlocked || ach.earned_at);
                const starCount = Math.max(1, Math.min(5, Number(ach.star_count || ach.stars_count || 1)));
                return (
                  <div
                    key={ach.id || idx}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isEarned
                        ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isEarned ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isEarned ? <Star size={20} className="fill-amber-400 text-amber-500" /> : <Lock size={18} />}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: starCount }).map((_, sIdx) => (
                            <Star
                              key={sIdx}
                              size={16}
                              className={isEarned ? 'text-amber-500 fill-amber-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{ach.title || ach.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {ach.description || 'Complete required tests to unlock this achievement badge.'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {isEarned ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 text-[11px] font-semibold">
                          <CheckCircle2 size={13} /> Unlocked {ach.earned_at ? `on ${new Date(ach.earned_at).toLocaleDateString('en-GB')}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2">
                <Trophy size={36} className="mx-auto text-slate-300 mb-1" />
                <h3 className="text-base font-bold text-slate-800">No Achievements Recorded Yet</h3>
                <p className="text-xs text-slate-500">Complete your first test to unlock your beginner achievement badge!</p>
              </div>
            )}
          </div>
        </div>
      )}

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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {selectedSeriesDetail.unlocked_via_elite_pass && <Crown size={13} className="text-amber-300" />}
                    <span>Go to Tests</span>
                  </button>
                ) : (selectedSeriesDetail.enrollment_status === 'PENDING' || selectedSeriesDetail.enrollment_status === 'PAYMENT_PENDING') ? (
                  <span className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs rounded-xl flex items-center gap-1.5">
                    <Clock size={14} /> Under Review
                  </span>
                ) : selectedSeriesDetail.is_free ? (
                  <button
                    onClick={() => handleEnrollFree(selectedSeriesDetail)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Enroll Free
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenPayment(selectedSeriesDetail)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Buy Now
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-md">
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
                <button
                  onClick={handleDownloadScorecardPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
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

            <div className="pt-3 border-t border-slate-100 flex justify-end">
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
