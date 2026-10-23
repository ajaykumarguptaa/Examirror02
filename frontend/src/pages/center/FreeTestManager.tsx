import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DeleteConfirmCaptchaModal from '../../components/DeleteConfirmCaptchaModal';
import { BulkQuestionJsonImportModal } from '../../components/admin/BulkQuestionJsonImportModal';
import {
  Eye,
  Plus,
  Send,
  X,
  Sparkles,
  ChevronDown,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Share2,
  Copy,
  ExternalLink,
  Timer,
  Award,
  BookOpen,
  BarChart3,
  Clock,
  Printer,
  Download,
  Users,
  Search,
  Check,
  RotateCcw,
  Sliders,
  QrCode,
  FileText,
  ShieldCheck,
  FileCheck2,
  School,
  User,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  Wallet,
  CreditCard,
  AlertTriangle,
  Info,
  Coins,
  LayoutDashboard,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export interface OnlineTestQuota {
  center_id: number;
  current_month: string;
  tests_created_this_month: number;
  monthly_free_limit: number;
  charge_per_extra_test: number;
  free_tests_remaining: number;
  paid_tests_this_month: number;
  requires_charge: boolean;
  next_test_cost: number;
  wallet_balance: number;
  has_sufficient_balance: boolean;
  free_students_per_test?: number;
  charge_per_extra_student?: number;
}

interface FreeTest {
  id: number;
  centerId: number;
  title: string;
  description?: string;
  test_uid?: string;
  duration_minutes?: number;
  auto_submit?: number;
  pass_marks?: number;
  total_marks?: number;
  category?: string;
  student_limit?: number;
  is_published?: number;
  has_been_published?: number;
  is_deleted?: number;
  status?: string;
  questionCount?: number;
  totalQuestionMarks?: number;
  submissionCount?: number;
  testedCount?: number;
  uniqueDevicesCount?: number;
  expires_at?: string;
  deleted_at?: string;
  remaining_seconds?: number;
  auto_delete_remaining_seconds?: number;
  is_expired?: number;
  views?: number;
  created_at?: string;
}

interface TestQuestion {
  id: number;
  testId: number;
  question: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correct: string;
  marks?: number;
  created_at?: string;
}

interface TestSubmission {
  id: number;
  test_id: number;
  student_name: string;
  student_roll?: string;
  student_id_card?: string;
  student_mobile?: string;
  student_email?: string;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  percentage: number;
  status: 'PASSED' | 'FAILED' | string;
  time_taken_seconds: number;
  is_cheating?: boolean | number;
  responses_json?: string;
  ip_address?: string;
  device_type?: string;
  user_agent?: string;
  submitted_at: string;
  testTitle?: string;
  testCategory?: string;
  testPassMarks?: number;
  testTotalMarks?: number;
  testDuration?: number;
  centerName?: string;
  centerCode?: string;
}

const API_BASE = 'http://localhost:3000/api/center';

const FreeTestManager: React.FC = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) { }
    return 1;
  };
  const centerId = getCenterId();

  // View state with refresh persistence
  const [activeTab, setActiveTab] = useState<'tests' | 'candidates'>('tests');

  const handleTabChange = (tab: 'tests' | 'candidates') => {
    setActiveTab(tab);
  };

  const [viewMode, setViewMode] = useState<'list' | 'add-questions'>('list');
  const [tests, setTests] = useState<FreeTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTest, setActiveTest] = useState<FreeTest | null>(null);

  // All Submissions Live Register State
  const [allSubmissions, setAllSubmissions] = useState<TestSubmission[]>([]);
  const [loadingAllSubmissions, setLoadingAllSubmissions] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateTestFilter, setCandidateTestFilter] = useState('all');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('all');
  const [candidatePage, setCandidatePage] = useState(1);
  const candidatePageSize = 25;

  // Marksheet Modal State for Center
  const [marksheetModalSubmission, setMarksheetModalSubmission] = useState<TestSubmission | null>(null);

  // New Test form state
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('Computer Basics');
  const [newTestDuration, setNewTestDuration] = useState<number>(30);
  const [newTestTotalMarks, setNewTestTotalMarks] = useState<number>(100);
  const [newTestPassMarks, setNewTestPassMarks] = useState<number>(40);
  const [newTestAutoSubmit, setNewTestAutoSubmit] = useState<boolean>(true);
  const [creatingTest, setCreatingTest] = useState(false);

  // Dynamic Online Test Quota State (Super Admin Configured)
  const [quota, setQuota] = useState<OnlineTestQuota | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [paidConfirmModalOpen, setPaidConfirmModalOpen] = useState(false);

  // Questions state for active test
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Question Editor state
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [questionMarks, setQuestionMarks] = useState<number>(1);
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D' | null>('B');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Modals
  const [isViewQuestionsModalOpen, setIsViewQuestionsModalOpen] = useState(false);
  const [isBulkJsonModalOpen, setIsBulkJsonModalOpen] = useState(false);
  const [publishModalTest, setPublishModalTest] = useState<FreeTest | null>(null);
  const [publishDuration, setPublishDuration] = useState<number>(30);
  const [publishAutoSubmit, setPublishAutoSubmit] = useState<boolean>(true);
  const [publishPassMarks, setPublishPassMarks] = useState<number>(40);
  const [publishStudentLimit, setPublishStudentLimit] = useState<number>(50);
  const [publishSaving, setPublishSaving] = useState(false);
  const [showConfirmPublishModal, setShowConfirmPublishModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Results & Scorecards Modal (for specific test)
  const [resultsModalTest, setResultsModalTest] = useState<FreeTest | null>(null);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<TestSubmission | null>(null);
  const [resultsSearch, setResultsSearch] = useState('');

  // Delete modal
  const [deletingTest, setDeletingTest] = useState<FreeTest | null>(null);
  const [permanentDeletingTest, setPermanentDeletingTest] = useState<FreeTest | null>(null);
  const [recoveringTest, setRecoveringTest] = useState<FreeTest | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<TestQuestion | null>(null);

  // Toast notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Pagination - Test List
  const [testSearch, setTestSearch] = useState('');
  const [testPageSize, setTestPageSize] = useState(50);
  const [testPage, setTestPage] = useState(1);

  // Show auto-dismiss notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all tests for this center
  const fetchTests = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_BASE}/${centerId}/free-tests`);
      if (res.data.success) {
        setTests(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching tests:', err);
      if (!silent) showToast('error', 'Failed to load test management list');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [centerId]);

  // Fetch all submissions for all tests of this center
  const fetchAllSubmissions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingAllSubmissions(true);
      const res = await axios.get(`${API_BASE}/${centerId}/all-test-submissions`);
      if (res.data.success) {
        setAllSubmissions(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching all test submissions:', err);
    } finally {
      if (!silent) setLoadingAllSubmissions(false);
    }
  }, [centerId]);

  // Fetch online test quota for this center
  const fetchQuota = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingQuota(true);
      const res = await axios.get(`${API_BASE}/${centerId}/online-test-quota`);
      if (res.data?.success) {
        setQuota(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching online test quota:', err);
    } finally {
      if (!silent) setLoadingQuota(false);
    }
  }, [centerId]);

  useEffect(() => {
    fetchTests();
    fetchAllSubmissions();
    fetchQuota();

    // Auto-refresh polling every 4 seconds for live candidate submissions and quota
    const interval = setInterval(() => {
      fetchTests(true);
      fetchAllSubmissions(true);
      fetchQuota(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchTests, fetchAllSubmissions, fetchQuota]);

  // Fetch questions for active test
  const fetchQuestions = useCallback(async (testId: number) => {
    try {
      setLoadingQuestions(true);
      const res = await axios.get(`${API_BASE}/free-tests/${testId}/questions`);
      if (res.data.success) {
        setQuestions(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      showToast('error', 'Failed to load test questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  // Fetch submissions for active test
  const fetchSubmissions = useCallback(async (testId: number) => {
    try {
      setLoadingSubmissions(true);
      const res = await axios.get(`${API_BASE}/free-tests/${testId}/submissions`);
      if (res.data.success) {
        setSubmissions(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      showToast('error', 'Failed to load test submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // Initiate Create Test
  const handleInitiateCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) {
      showToast('error', 'Please enter a valid Test Name');
      return;
    }

    if (quota?.requires_charge) {
      if (!quota.has_sufficient_balance) {
        showToast('error', `Insufficient Wallet Balance! Creating this extra test costs ₹${quota.charge_per_extra_test}. Current wallet balance: ₹${quota.wallet_balance}. Please recharge.`);
        return;
      }
      setPaidConfirmModalOpen(true);
      return;
    }

    // Free test creation
    executeCreateTest();
  };

  // Execute Actual Test Creation (Free or Paid)
  const executeCreateTest = async () => {
    try {
      setCreatingTest(true);
      const res = await axios.post(`${API_BASE}/free-tests`, {
        centerId,
        title: newTestTitle.trim(),
        category: newTestCategory,
        duration_minutes: 0, // Removed per user request
        total_marks: Number(newTestTotalMarks) || 100,
        pass_marks: Number(newTestPassMarks) || 40,
        auto_submit: newTestAutoSubmit ? 1 : 0
      });

      if (res.data.success) {
        if (res.data.data?.is_paid) {
          showToast('success', `Test created! ₹${res.data.data.charged_amount} deducted from your wallet balance. New Balance: ₹${res.data.data.remaining_balance}`);
        } else {
          showToast('success', 'Test created successfully under Free Monthly Quota! You can now add questions.');
        }
        setNewTestTitle('');
        setPaidConfirmModalOpen(false);
        fetchTests();
        fetchQuota();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create test');
    } finally {
      setCreatingTest(false);
    }
  };

  // Open Add/Edit Questions
  const handleOpenAddQuestions = (test: FreeTest) => {
    setActiveTest(test);
    setViewMode('add-questions');
    fetchQuestions(test.id);
    resetQuestionForm();
  };

  // Open View Questions Modal
  const handleOpenViewQuestions = (test: FreeTest) => {
    setActiveTest(test);
    fetchQuestions(test.id);
    setIsViewQuestionsModalOpen(true);
  };

  // Open Publish Settings Modal
  const handleOpenPublishModal = (test: FreeTest) => {
    setPublishModalTest(test);
    setPublishDuration(test.duration_minutes || 30);
    setPublishAutoSubmit(test.auto_submit !== undefined ? Boolean(test.auto_submit) : true);
    setPublishPassMarks(test.pass_marks || 40);
    setPublishStudentLimit(test.student_limit || quota?.free_students_per_test || 50);
    setCopiedLink(false);
  };

  // Save Publish Settings & Toggle Publish
  const handleSavePublishSettings = async (publishState: boolean, bypassConfirm = false) => {
    if (!publishModalTest) return;

    if (publishState && !publishModalTest.has_been_published && !bypassConfirm) {
      setShowConfirmPublishModal(true);
      return;
    }

    try {
      setPublishSaving(true);
      const res = await axios.put(`${API_BASE}/free-tests/${publishModalTest.id}/publish-settings`, {
        is_published: publishState ? 1 : 0,
        duration_minutes: 0, // Removed per user request
        auto_submit: publishAutoSubmit ? 1 : 0,
        pass_marks: Number(publishPassMarks) || 40,
        student_limit: Number(publishStudentLimit) || 50
      });

      if (res.data.success) {
        showToast(
          'success',
          publishState
            ? 'Test Published & Secure Candidate Link is Active!'
            : 'Test Un-published (Draft Mode)'
        );
        fetchTests();
        const updatedUid = res.data.data?.test_uid || publishModalTest.test_uid;
        setActiveTest((prev) => prev && prev.id === publishModalTest.id ? {
          ...prev,
          is_published: publishState ? 1 : 0,
          status: publishState ? 'published' : 'draft',
          test_uid: updatedUid,
          has_been_published: publishState ? 1 : prev.has_been_published
        } : prev);
        setPublishModalTest(null);
        setShowConfirmPublishModal(false);
      }
    } catch (err: any) {
      showToast('error', `Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setPublishSaving(false);
    }
  };

  // Open Results / Scorecards Modal
  const handleOpenResultsModal = (test: FreeTest) => {
    setResultsModalTest(test);
    setSelectedSubmission(null);
    setResultsSearch('');
    fetchSubmissions(test.id);
  };

  // Copy candidate link helper
  const getCandidateTestUrl = (testUid?: string) => {
    const origin = window.location.origin;
    return `${origin}/test/live/${testUid || 'TEST-DEMO'}`;
  };

  const handleCopyLink = (testUid?: string) => {
    const url = getCandidateTestUrl(testUid);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('success', 'Candidate Live Test Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Question Form Reset
  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setQuestionMarks(1);
    setCorrectOption('A');
  };

  // Question Save / Edit
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTest) return;

    if (!questionText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      showToast('error', 'Please fill in Question text and all 4 options (A, B, C, D)');
      return;
    }

    if (!correctOption) {
      showToast('error', 'Please select the correct option (A, B, C, or D)');
      return;
    }

    if (!editingQuestionId && questions.length >= 150) {
      showToast('error', 'Maximum limit of 150 questions reached for this test.');
      return;
    }

    try {
      setSubmittingQuestion(true);
      const qMarks = Number(questionMarks) > 0 ? Number(questionMarks) : 1;
      if (editingQuestionId) {
        await axios.put(`${API_BASE}/free-tests/questions/${editingQuestionId}`, {
          question: questionText.trim(),
          optA: optA.trim(),
          optB: optB.trim(),
          optC: optC.trim(),
          optD: optD.trim(),
          correct: correctOption,
          marks: qMarks
        });
        showToast('success', 'Question updated successfully');
      } else {
        await axios.post(`${API_BASE}/free-tests/${activeTest.id}/questions`, {
          question: questionText.trim(),
          optA: optA.trim(),
          optB: optB.trim(),
          optC: optC.trim(),
          optD: optD.trim(),
          correct: correctOption,
          marks: qMarks
        });
        showToast('success', `Question ${questions.length + 1} (+${qMarks} Marks) added successfully`);
      }

      resetQuestionForm();
      fetchQuestions(activeTest.id);
      fetchTests();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleEditQuestion = (q: TestQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.question);
    setOptA(q.optA);
    setOptB(q.optB);
    setOptC(q.optC);
    setOptD(q.optD);
    setQuestionMarks(q.marks !== undefined ? Number(q.marks) : 1);
    setCorrectOption(q.correct as any);
  };

  // Helper to format 72-hour countdown & auto-delete warning timer
  const format72hTimer = (test: FreeTest) => {
    const isDeleted = Number(test.is_deleted) === 1 || test.status === 'expired';
    if (isDeleted) {
      // Auto-delete / purge countdown for deleted/expired tests (72h from deleted_at / expiry)
      const baseTime = test.deleted_at
        ? new Date(test.deleted_at).getTime()
        : (test.expires_at ? new Date(test.expires_at).getTime() : (test.created_at ? new Date(test.created_at).getTime() : Date.now()));
      const purgeTime = baseTime + 72 * 3600 * 1000;
      const purgeDiffMs = purgeTime - Date.now();

      if (purgeDiffMs <= 0) {
        return {
          text: 'Auto-Purging...',
          isExpired: true,
          isPurging: true,
          color: 'text-rose-800 bg-rose-100 border-rose-300 animate-pulse'
        };
      }

      const totalSec = Math.floor(purgeDiffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);

      const isUrgentPurge = hours < 12;

      return {
        text: `⚠️ Auto-Deletes in ${hours}h ${mins}m`,
        isExpired: true,
        isPurging: false,
        color: isUrgentPurge
          ? 'text-rose-800 bg-rose-50 border-rose-300 font-bold animate-pulse'
          : 'text-amber-800 bg-amber-50 border-amber-300 font-semibold'
      };
    }

    // Active test expiration timestamp (72 hours from creation/recovery)
    const expTime = test.expires_at
      ? new Date(test.expires_at).getTime()
      : (test.created_at ? new Date(test.created_at).getTime() + 72 * 3600 * 1000 : 0);

    const diffMs = expTime - Date.now();

    if (diffMs <= 0 || test.is_expired) {
      return { text: 'Expired (72h Elapsed)', isExpired: true, color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }

    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    const isUrgent = hours < 12;
    const isCritical = hours < 4;

    return {
      text: `${hours}h ${mins}m left`,
      isExpired: false,
      color: isCritical
        ? 'text-rose-800 bg-rose-50 border-rose-300 font-black animate-pulse'
        : isUrgent
          ? 'text-amber-800 bg-amber-50 border-amber-300 font-bold'
          : 'text-indigo-800 bg-indigo-50 border-indigo-200'
    };
  };

  // Move to Recycle Bin (Soft Delete)
  const confirmDeleteTest = async () => {
    if (!deletingTest) return;
    try {
      await axios.delete(`${API_BASE}/free-tests/${deletingTest.id}`);
      showToast('success', `Test "${deletingTest.title}" moved to recycle bin. (Auto-purges after 72h)`);
      setDeletingTest(null);
      fetchTests();
      fetchQuota();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete test');
    }
  };

  // Permanent Delete Test (Hard Delete from Database)
  const confirmPermanentDeleteTest = async () => {
    if (!permanentDeletingTest) return;
    try {
      await axios.delete(`${API_BASE}/free-tests/${permanentDeletingTest.id}/permanent`);
      showToast('success', `Test "${permanentDeletingTest.title}" permanently deleted from database`);
      setPermanentDeletingTest(null);
      fetchTests();
      fetchQuota();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to permanently delete test');
    }
  };

  // Recover Test (Counts as 1 towards monthly quota, renews 72h validity)
  const confirmRecoverTest = async () => {
    if (!recoveringTest) return;
    try {
      const res = await axios.post(`${API_BASE}/free-tests/${recoveringTest.id}/recover`);
      showToast('success', res.data?.message || `Test "${recoveringTest.title}" recovered successfully`);
      setRecoveringTest(null);
      fetchTests();
      fetchQuota();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to recover test');
    }
  };

  // Delete Question
  const confirmDeleteQuestion = async () => {
    if (!deletingQuestion || !activeTest) return;
    try {
      await axios.delete(`${API_BASE}/free-tests/questions/${deletingQuestion.id}`);
      showToast('success', 'Question deleted successfully');
      setDeletingQuestion(null);
      fetchQuestions(activeTest.id);
      fetchTests();
    } catch (err: any) {
      showToast('error', 'Failed to delete question');
    }
  };

  // Filtered Tests
  const filteredTests = useMemo(() => {
    if (!testSearch.trim()) return tests;
    const q = testSearch.toLowerCase();
    return tests.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.test_uid && t.test_uid.toLowerCase().includes(q))
    );
  }, [tests, testSearch]);

  // Warning Counter Alerts: Tests expiring soon (< 24h) & Tests in Recycle Bin
  const expiringSoonTests = useMemo(() => {
    return tests.filter((t) => {
      const isDeleted = Number(t.is_deleted) === 1 || t.status === 'expired';
      if (isDeleted) return false;
      const expTime = t.expires_at ? new Date(t.expires_at).getTime() : (t.created_at ? new Date(t.created_at).getTime() + 72 * 3600 * 1000 : 0);
      const diffMs = expTime - Date.now();
      return diffMs > 0 && diffMs <= 24 * 3600 * 1000;
    });
  }, [tests]);

  const deletedOrExpiredTests = useMemo(() => {
    return tests.filter((t) => Number(t.is_deleted) === 1 || t.status === 'expired');
  }, [tests]);

  const totalPages = Math.ceil(filteredTests.length / testPageSize) || 1;
  const paginatedTests = useMemo(() => {
    const start = (testPage - 1) * testPageSize;
    return filteredTests.slice(start, start + testPageSize);
  }, [filteredTests, testPage, testPageSize]);

  // Filtered Submissions for single test modal
  const filteredSubmissions = useMemo(() => {
    if (!resultsSearch.trim()) return submissions;
    const q = resultsSearch.toLowerCase();
    return submissions.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        (s.student_roll && s.student_roll.toLowerCase().includes(q)) ||
        (s.student_id_card && s.student_id_card.toLowerCase().includes(q)) ||
        (s.student_mobile && s.student_mobile.toLowerCase().includes(q)) ||
        (s.student_email && s.student_email.toLowerCase().includes(q))
    );
  }, [submissions, resultsSearch]);

  // Filtered Candidate Live Register (All Tests)
  const filteredCandidateRegister = useMemo(() => {
    return allSubmissions.filter((s) => {
      // 1. Search Query
      if (candidateSearch.trim()) {
        const q = candidateSearch.toLowerCase();
        const matchesName = s.student_name.toLowerCase().includes(q);
        const matchesRoll = s.student_roll ? s.student_roll.toLowerCase().includes(q) : false;
        const matchesId = s.student_id_card ? s.student_id_card.toLowerCase().includes(q) : false;
        const matchesPhone = s.student_mobile ? s.student_mobile.toLowerCase().includes(q) : false;
        const matchesEmail = s.student_email ? s.student_email.toLowerCase().includes(q) : false;
        const matchesTest = s.testTitle ? s.testTitle.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesRoll && !matchesId && !matchesPhone && !matchesEmail && !matchesTest) {
          return false;
        }
      }

      // 2. Test Filter
      if (candidateTestFilter !== 'all' && String(s.test_id) !== String(candidateTestFilter)) {
        return false;
      }

      // 3. Status Filter
      if (candidateStatusFilter !== 'all' && s.status.toLowerCase() !== candidateStatusFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [allSubmissions, candidateSearch, candidateTestFilter, candidateStatusFilter]);

  const totalCandidatePages = Math.ceil(filteredCandidateRegister.length / candidatePageSize) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (candidatePage - 1) * candidatePageSize;
    return filteredCandidateRegister.slice(start, start + candidatePageSize);
  }, [filteredCandidateRegister, candidatePage, candidatePageSize]);

  // Export Results to CSV helper
  const exportResultsCSV = () => {
    if (submissions.length === 0) {
      showToast('error', 'No submissions to export');
      return;
    }
    const headers = ['Sr', 'Student Name', 'Roll No', 'ID Card No', 'Mobile', 'Email', 'Score', 'Total Marks', 'Percentage', 'Status', 'Time Taken (Sec)', 'Is Cheating', 'Device Type', 'IP Address', 'Submitted At'];
    const rows = submissions.map((s, idx) => [
      idx + 1,
      `"${s.student_name}"`,
      `"${s.student_roll || ''}"`,
      `"${s.student_id_card || ''}"`,
      `"${s.student_mobile || ''}"`,
      `"${s.student_email || ''}"`,
      s.score,
      s.total_marks,
      `${s.percentage}%`,
      s.status,
      s.time_taken_seconds,
      s.is_cheating ? 'YES' : 'NO',
      `"${s.device_type || 'Unknown'}"`,
      `"${s.ip_address || 'N/A'}"`,
      `"${new Date(s.submitted_at).toLocaleString('en-IN')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Test_Results_${resultsModalTest?.title || 'Report'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Candidate Results exported successfully!');
  };

  // Export All Candidate Submissions to CSV
  const exportAllCandidatesCSV = () => {
    if (filteredCandidateRegister.length === 0) {
      showToast('error', 'No candidate records to export');
      return;
    }
    const headers = ['Sr', 'Candidate Name', 'Roll No', 'ID Card No', 'Test Title', 'Category', 'Mobile', 'Email', 'Score', 'Total Marks', 'Percentage', 'Status', 'Time Taken (Sec)', 'Is Cheating', 'Device Type', 'IP Address', 'Attempt Date & Time'];
    const rows = filteredCandidateRegister.map((s, idx) => [
      idx + 1,
      `"${s.student_name}"`,
      `"${s.student_roll || ''}"`,
      `"${s.student_id_card || ''}"`,
      `"${s.testTitle || 'Online Test'}"`,
      `"${s.testCategory || 'General'}"`,
      `"${s.student_mobile || ''}"`,
      `"${s.student_email || ''}"`,
      s.score,
      s.total_marks,
      `${s.percentage}%`,
      s.status,
      s.time_taken_seconds,
      s.is_cheating ? 'YES' : 'NO',
      `"${s.device_type || 'Unknown'}"`,
      `"${s.ip_address || 'N/A'}"`,
      `"${new Date(s.submitted_at).toLocaleString('en-IN')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `All_Enrolled_Candidate_Submissions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Complete Enrolled Candidate Register exported to CSV!');
  };

  const questionLimitReached = questions.length >= 150;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto font-sans space-y-6">

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-200 ${notification.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500'
            : 'bg-rose-600 text-white border-rose-500'
            }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* RENDER: VIEW 2 (ADD / EDIT QUESTIONS) OR VIEW 1 (DASHBOARD) */}
      {viewMode === 'add-questions' && activeTest ? (
        <div className="space-y-6 animate-in fade-in duration-150">

        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                fetchTests();
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Tests
            </button>
            <div>
              <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Question Bank Editor</div>
              <h1 className="text-lg font-black text-slate-900">{activeTest.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${questionLimitReached
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
              {questions.length} / 150 Qs • {questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)} Total Marks
            </div>

            <button
              type="button"
              onClick={() => handleOpenPublishModal(activeTest)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Share2 size={14} /> Publish & Share
            </button>
          </div>
        </div>

        {/* Question Form & Questions List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Form: Add / Edit Question */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                {editingQuestionId ? 'Edit Question' : `Add Question #${questions.length + 1}`}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkJsonModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
                  title="Import Questions via AI or Bulk JSON"
                >
                  <Sparkles size={13} className="text-amber-300" />
                  <span>AI / Bulk JSON</span>
                </button>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Statement *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the question statement clearly..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600 leading-relaxed"
                />
              </div>

              {/* Marks for this Question */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marks for this Question *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 1, 2, 4, 5..."
                    value={questionMarks}
                    onChange={(e) => setQuestionMarks(Math.max(0.5, Number(e.target.value)))}
                    className="w-full pl-3.5 pr-16 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-indigo-600"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-indigo-600">
                    Marks
                  </span>
                </div>
              </div>

              {/* 4 Options */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">Answer Options *</label>

                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const val = key === 'A' ? optA : key === 'B' ? optB : key === 'C' ? optC : optD;
                  const setVal = key === 'A' ? setOptA : key === 'B' ? setOptB : key === 'C' ? setOptC : setOptD;
                  const isCorrect = correctOption === key;

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOption(key)}
                        className={`w-7 h-7 rounded-lg font-black text-xs shrink-0 transition-colors flex items-center justify-center cursor-pointer ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {key}
                      </button>

                      <input
                        type="text"
                        required
                        placeholder={`Option ${key} text...`}
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="flex-1 bg-transparent border-0 text-xs text-slate-900 outline-none font-medium"
                      />

                      <button
                        type="button"
                        onClick={() => setCorrectOption(key)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md cursor-pointer ${isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                      >
                        {isCorrect ? 'Correct ✓' : 'Mark Correct'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingQuestion || (!editingQuestionId && questionLimitReached)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingQuestion
                    ? 'Saving...'
                    : editingQuestionId
                      ? 'Update Question'
                      : `+ Add Question (+${questionMarks || 1} Marks)`}
                </button>
              </div>
            </form>
          </div>

          {/* Right List: Questions List Preview */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Questions in this Test ({questions.length})</h3>
                <p className="text-[11px] text-slate-500">
                  Total Score Weightage: <strong className="text-indigo-700 font-black">{questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)} Marks</strong>
                </p>
              </div>
            </div>

            {loadingQuestions ? (
              <div className="text-center py-16 text-slate-400 text-xs">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No questions added yet. Use the form on the left to add questions!
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm leading-relaxed space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 font-black">Q{idx + 1}.</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                            +{q.marks || 1} {Number(q.marks) === 1 ? 'Mark' : 'Marks'}
                          </span>
                        </div>
                        <div>{q.question}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(q)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Question"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingQuestion(q)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const optText = (q as any)[`opt${key}`];
                        const isCorrect = q.correct === key;

                        return (
                          <div
                            key={key}
                            className={`p-2 rounded-lg border text-[11px] font-medium flex items-center gap-2 ${isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                          >
                            <span className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                              {key}
                            </span>
                            <span className="truncate">{optText}</span>
                            {isCorrect && <span className="text-[9px] text-emerald-700 font-black ml-auto">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    ) : (
      <>
          {/* Header Banner */}
      <div className="bg-[#1e1b4b] rounded-3xl p-5 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[11px] font-bold backdrop-blur-xs mb-2">
            <Award size={13} /> Assessment & Examination Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Online Test Management</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Create online assessments, manage question banks, share test links, and monitor live candidate submissions with downloadable marksheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
            <div className="text-[10px] text-indigo-200 uppercase font-bold">Total Tests</div>
            <div className="text-xl font-black text-white">{tests.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
            <div className="text-[10px] text-indigo-200 uppercase font-bold">Total Submissions</div>
            <div className="text-xl font-black text-emerald-400">
              {allSubmissions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('tests')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'tests'
                ? 'bg-[#1e1b4b] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <BookOpen size={15} />
            <span>Online Tests & Question Bank</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'tests' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
              {tests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('candidates')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'candidates'
                ? 'bg-[#1e1b4b] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <GraduationCap size={16} />
            <span>Live Enrolled Candidates Register</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'candidates' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
              {allSubmissions.length}
            </span>
          </button>
        </div>

        {/* Live sync pulse status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time Live Sync (4s)</span>
          <button
            type="button"
            onClick={() => fetchAllSubmissions()}
            disabled={loadingAllSubmissions}
            className="p-1 text-slate-500 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
            title="Refresh candidate records now"
          >
            <RefreshCw size={13} className={loadingAllSubmissions ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TESTS MANAGEMENT & CREATION */}
      {/* ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="space-y-6">

          {/* Super Admin Monthly Quota & Wallet Status Widget */}
          {quota && (
            <div className={`rounded-3xl p-5 sm:p-6 border transition-all ${quota.requires_charge
                ? 'bg-amber-50 border-amber-300'
                : 'bg-indigo-50/70 border-indigo-100'
              }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${quota.requires_charge
                        ? 'bg-amber-500 text-white'
                        : 'bg-indigo-600 text-white'
                      }`}>
                      {quota.requires_charge ? 'Paid Creation Mode' : 'Free Quota Active'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {quota.current_month} Quota
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {quota.requires_charge ? (
                      <span className="text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle size={18} className="text-amber-600" />
                        Monthly Free Limit Reached ({quota.tests_created_this_month}/{quota.monthly_free_limit} Tests Created)
                      </span>
                    ) : (
                      <span className="text-indigo-950 flex items-center gap-1.5">
                        <Sparkles size={18} className="text-indigo-600" />
                        {quota.free_tests_remaining} of {quota.monthly_free_limit} Free Tests Available This Month
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-600 max-w-2xl">
                    {quota.requires_charge ? (
                      <>
                        You have consumed your monthly allowance of <strong>{quota.monthly_free_limit} free tests</strong> for {quota.current_month}. Additional tests cost <strong className="text-amber-900">₹{quota.charge_per_extra_test} each</strong>, automatically debited from your center wallet balance upon creation.
                      </>
                    ) : (
                      <>
                        Each center receives <strong>{quota.monthly_free_limit} free test creations</strong> every calendar month. Additional tests after quota exhaustion cost <strong>₹{quota.charge_per_extra_test} each</strong>.
                      </>
                    )}
                  </p>
                </div>

                {/* Quota & Wallet Metrics Pill */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-right border-r border-slate-200 pr-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Used This Month</div>
                    <div className="text-base font-black text-slate-900">
                      {quota.tests_created_this_month} <span className="text-xs font-normal text-slate-400">/ {quota.monthly_free_limit} Free</span>
                    </div>
                  </div>

                  <div className="text-right border-r border-slate-200 pr-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Extra Test Cost</div>
                    <div className="text-base font-black text-indigo-900">
                      ₹{quota.charge_per_extra_test}
                    </div>
                  </div>

                  <div className="pl-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Wallet size={12} className="text-indigo-600" /> Wallet Balance
                    </div>
                    <div className={`text-base font-black ${quota.wallet_balance >= quota.charge_per_extra_test ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ₹{quota.wallet_balance.toLocaleString('en-IN')}
                    </div>
                    {quota.wallet_balance < quota.charge_per_extra_test && quota.requires_charge && (
                      <Link
                        to="/center/wallet"
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        Recharge now &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add New Test Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Create New Online Test
            </h2>

            <form onSubmit={handleInitiateCreateTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Test Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Test Name / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DCA Semester 1 Mock Exam / Typing Speed Test"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Category</label>
                  <select
                    value={newTestCategory}
                    onChange={(e) => setNewTestCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Computer Basics">Computer Basics</option>
                    <option value="DCA / ADCA">DCA / ADCA</option>
                    <option value="Typing Test">Typing Test</option>
                    <option value="MS Office">MS Office</option>
                    <option value="Programming">Programming</option>
                    <option value="General Knowledge">General Knowledge</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <select
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1 Hr)</option>
                    <option value={90}>90 Minutes</option>
                    <option value={120}>120 Minutes (2 Hrs)</option>
                  </select>
                </div>

              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTestAutoSubmit}
                      onChange={(e) => setNewTestAutoSubmit(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Auto-Submit Test on Timeout</span>
                  </label>

                  <span className="text-slate-300">|</span>
                  <span>Pass Criteria: <strong className="text-slate-900">{newTestPassMarks}%</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Max Capacity: <strong className="text-indigo-700">150 Questions</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  {quota?.requires_charge && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-600" /> Cost: ₹{quota.charge_per_extra_test} (from Wallet)
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={creatingTest}
                    className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${quota?.requires_charge
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                      }`}
                  >
                    {quota?.requires_charge ? <Coins size={16} /> : <Plus size={16} />}
                    <span>
                      {creatingTest
                        ? 'Creating Test...'
                        : quota?.requires_charge
                          ? `Create Paid Test (₹${quota.charge_per_extra_test})`
                          : 'Create Free Test'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Warning Counter Banner (72h Expiry & Auto-Purge System) */}
          {(expiringSoonTests.length > 0 || deletedOrExpiredTests.length > 0) && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/60">
                  <Clock size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950 flex items-center gap-2">
                    <span>72-Hour Expiry & Auto-Delete Policy Active</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      Auto-Purge Warning
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 mt-1 leading-relaxed">
                    Online tests stay active for <strong>72 hours</strong> from creation or recovery. Expired and deleted tests remain in the Recycle Bin with a live countdown and will be <strong>permanently auto-purged after 72 hours</strong>.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {expiringSoonTests.length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100/90 text-amber-900 text-[11px] font-bold border border-amber-300 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-700" />
                        <span>{expiringSoonTests.length} active test{expiringSoonTests.length > 1 ? 's' : ''} expiring within 24 hours</span>
                      </span>
                    )}
                    {deletedOrExpiredTests.length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100/90 text-rose-900 text-[11px] font-bold border border-rose-300 flex items-center gap-1.5">
                        <Trash2 size={12} className="text-rose-700" />
                        <span>{deletedOrExpiredTests.length} test{deletedOrExpiredTests.length > 1 ? 's' : ''} in Recycle Bin (Auto-Purging in 72h)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tests Table Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Table Controls */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Online Tests List</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                  {filteredTests.length}
                </span>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tests by name or UID..."
                  value={testSearch}
                  onChange={(e) => {
                    setTestSearch(e.target.value);
                    setTestPage(1);
                  }}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                <thead className="bg-[#1e1b4b] text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold w-12 text-center">Sr.</th>
                    <th className="py-3 px-4 font-bold">Test Information</th>
                    <th className="py-3 px-4 font-bold text-center">Questions</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-center">Submissions</th>
                    <th className="py-3 px-4 font-bold text-center">Tested Students</th>
                    <th className="py-3 px-4 font-bold text-right pr-6">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">Loading tests...</td>
                    </tr>
                  ) : paginatedTests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500 font-medium">
                        No online tests found. Create your first test above!
                      </td>
                    </tr>
                  ) : (
                    paginatedTests.map((test, index) => {
                      const isPublished = Number(test.is_published) === 1;
                      const qCount = test.questionCount || 0;
                      const subCount = test.submissionCount || 0;

                      const isDeleted = Number(test.is_deleted) === 1;

                      return (
                        <tr key={test.id} className={`transition-colors ${isDeleted ? 'bg-rose-50/40 opacity-75' : 'hover:bg-slate-50/70'}`}>

                          {/* Sr */}
                          <td className="py-4 px-4 text-center font-bold text-slate-600 align-middle">
                            {(testPage - 1) * testPageSize + index + 1}
                          </td>

                          {/* Test Title & UID */}
                          <td className="py-4 px-4 align-middle space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="font-extrabold text-slate-900 text-sm">{test.title}</div>
                              {test.created_at && (new Date().getTime() - new Date(test.created_at).getTime()) < 24 * 60 * 60 * 1000 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 tracking-wider">New</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>UID: {test.test_uid || 'N/A'}</span>
                              {test.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-sans text-slate-700 font-semibold">
                                  {test.category}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {test.created_at && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Created: {new Date(test.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              {/* 72-Hour Auto-Delete Countdown Timer */}
                              {(() => {
                                const timer = format72hTimer(test);
                                return (
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${timer.color}`} title="72 Hours Test Validity & Auto-Delete Timer">
                                    <Timer size={11} className="shrink-0" />
                                    <span>{timer.text}</span>
                                    {!timer.isExpired && <span className="text-[9px] opacity-70">Validity</span>}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Questions Count & Total Marks */}
                          <td className="py-4 px-4 align-middle text-center">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <div className="inline-flex items-center gap-1 font-bold text-slate-800">
                                <BookOpen size={13} className="text-indigo-600" />
                                <span>{qCount} / 150 Qs</span>
                              </div>
                              {test.totalQuestionMarks !== undefined && (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {test.totalQuestionMarks} Max Marks
                                </span>
                              )}
                            </div>
                          </td>


                          {/* Status */}
                          <td className="py-4 px-4 align-middle text-center">
                            {isDeleted ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                Deleted / In Bin
                              </span>
                            ) : isPublished ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Published
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                Draft (Hidden)
                              </span>
                            )}
                          </td>

                          {/* Submissions */}
                          <td className="py-4 px-4 align-middle text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenResultsModal(test)}
                              className="px-3 py-1 rounded-xl text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <BarChart3 size={13} /> {subCount} Results
                            </button>
                          </td>

                          {/* Tested Students (Actual Test Takers) */}
                          <td className="py-4 px-4 align-middle text-center">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-800 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold" title="Total Students who opened link and tested">
                                <Users size={13} className="text-indigo-600" /> {test.testedCount !== undefined ? test.testedCount : (test.submissionCount || 0)} Tested
                              </div>
                              {(test.uniqueDevicesCount || 0) > 0 && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {test.uniqueDevicesCount} IP / Device{test.uniqueDevicesCount === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-4 align-middle text-right pr-6 space-x-1.5">

                            {isDeleted ? (
                              <div className="inline-flex items-center gap-1.5">
                                {/* Recover Button */}
                                <button
                                  type="button"
                                  onClick={() => setRecoveringTest(test)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="Recover Test (Renews 72h and counts as 1 in monthly quota)"
                                >
                                  <RefreshCw size={13} strokeWidth={2.5} /> Recover
                                </button>

                                {/* Permanent Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => setPermanentDeletingTest(test)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="Permanently Delete Test from Database"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Publish & Share Modal Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPublishModal(test)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${isPublished
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                    }`}
                                  title="Configure Publish & Get Link"
                                >
                                  <Share2 size={13} /> {isPublished ? 'Share Link' : 'Publish'}
                                </button>

                                {/* Add / Edit Questions */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddQuestions(test)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="Manage Questions"
                                >
                                  <Plus size={13} /> Questions
                                </button>

                                {/* Move to Recycle Bin (Soft Delete) */}
                                <button
                                  type="button"
                                  onClick={() => setDeletingTest(test)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer inline-block"
                                  title="Move to Recycle Bin"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}

                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE ENROLLED CANDIDATES REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled / Attempts</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{allSubmissions.length}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Passed Candidates</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {allSubmissions.filter((s) => s.status === 'PASSED').length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed / Needs Retry</div>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {allSubmissions.filter((s) => s.status === 'FAILED').length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Pass Rate</div>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  {allSubmissions.length > 0
                    ? `${Math.round((allSubmissions.filter((s) => s.status === 'PASSED').length / allSubmissions.length) * 100)}%`
                    : '0%'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Filter & Action Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[260px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Student Name, Roll No, ID Card / Aadhar, Mobile, Email or Test..."
                  value={candidateSearch}
                  onChange={(e) => {
                    setCandidateSearch(e.target.value);
                    setCandidatePage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              {/* Test Filter */}
              <div className="w-full sm:w-56">
                <select
                  value={candidateTestFilter}
                  onChange={(e) => {
                    setCandidateTestFilter(e.target.value);
                    setCandidatePage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="all">All Online Tests ({tests.length})</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={candidateStatusFilter}
                  onChange={(e) => {
                    setCandidateStatusFilter(e.target.value);
                    setCandidatePage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="PASSED">Passed Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {(candidateSearch || candidateTestFilter !== 'all' || candidateStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateSearch('');
                      setCandidateTestFilter('all');
                      setCandidateStatusFilter('all');
                      setCandidatePage(1);
                    }}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}

                <button
                  type="button"
                  onClick={exportAllCandidatesCSV}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>

            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100">
              <span>
                Showing <strong className="text-slate-900">{filteredCandidateRegister.length}</strong> enrolled candidate attempt records
              </span>
              <span>Page {candidatePage} of {totalCandidatePages}</span>
            </div>
          </div>

          {/* Candidate Register Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                <thead className="bg-[#1e1b4b] text-white">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-center w-12">Sr.</th>
                    <th className="py-3.5 px-4 font-bold">Candidate Information</th>
                    <th className="py-3.5 px-4 font-bold">Roll / ID Card No</th>
                    <th className="py-3.5 px-4 font-bold">Test & Category</th>
                    <th className="py-3.5 px-4 font-bold text-center">Score</th>
                    <th className="py-3.5 px-4 font-bold text-center">% Score</th>
                    <th className="py-3.5 px-4 font-bold text-center">Status</th>
                    <th className="py-3.5 px-4 font-bold text-center">Anti-Cheat</th>
                    <th className="py-3.5 px-4 font-bold text-center">IP & Device</th>
                    <th className="py-3.5 px-4 font-bold text-center">Time Spent</th>
                    <th className="py-3.5 px-4 font-bold">Submitted At</th>
                    <th className="py-3.5 px-4 font-bold text-right pr-6">Reports & Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loadingAllSubmissions && allSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-16 text-center text-slate-400 font-medium">
                        Loading enrolled candidate submissions...
                      </td>
                    </tr>
                  ) : paginatedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-16 text-center text-slate-500 font-medium">
                        {allSubmissions.length === 0
                          ? 'No student candidates have enrolled or completed any tests yet. Share the candidate test link to begin receiving live submissions.'
                          : 'No candidate submissions matched your current search and filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((sub, index) => {
                      const isPass = sub.status === 'PASSED';
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">

                          {/* Sr */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500 align-middle">
                            {(candidatePage - 1) * candidatePageSize + index + 1}
                          </td>

                          {/* Candidate Information */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <User size={13} className="text-indigo-600 shrink-0" />
                              <span>{sub.student_name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 space-x-2">
                              {sub.student_mobile && <span>📱 {sub.student_mobile}</span>}
                              {sub.student_email && <span>✉️ {sub.student_email}</span>}
                            </div>
                          </td>

                          {/* Roll / ID Card */}
                          <td className="py-3.5 px-4 align-middle font-mono text-[11px] text-slate-700">
                            <div><strong className="text-slate-900">Roll:</strong> {sub.student_roll || 'N/A'}</div>
                            <div className="text-slate-500"><strong className="text-slate-800">ID:</strong> {sub.student_id_card || 'N/A'}</div>
                          </td>

                          {/* Test & Category */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-bold text-slate-900 text-xs">{sub.testTitle || 'Online Assessment'}</div>
                            <div className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">
                              {sub.testCategory || 'General Knowledge'}
                            </div>
                          </td>

                          {/* Score */}
                          <td className="py-3.5 px-4 text-center align-middle font-black text-slate-900">
                            <span className="text-sm">{sub.score}</span>
                            <span className="text-slate-400 text-[11px]"> / {sub.total_marks}</span>
                          </td>

                          {/* Percentage */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-black text-xs text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50">
                              {sub.percentage}%
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${isPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                              {isPass ? '✓ PASSED' : '✗ FAILED'}
                            </span>
                          </td>

                          {/* Anti-Cheat */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            {sub.is_cheating ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200">DETECTED</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">CLEAN</span>
                            )}
                          </td>

                          {/* IP & Device Tracking */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                                {sub.device_type === 'Mobile' ? '📱 Mobile' : sub.device_type === 'Tablet' ? '📟 Tablet' : '💻 Desktop'}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500" title={sub.user_agent || sub.ip_address || 'IP Address'}>
                                {sub.ip_address || 'IP Logged'}
                              </span>
                            </div>
                          </td>

                          {/* Time Spent */}
                          <td className="py-3.5 px-4 text-center align-middle font-mono text-slate-600 text-[11px]">
                            {Math.floor(sub.time_taken_seconds / 60)}m {sub.time_taken_seconds % 60}s
                          </td>

                          {/* Submitted Date */}
                          <td className="py-3.5 px-4 align-middle text-[11px] text-slate-600">
                            {new Date(sub.submitted_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(sub.submitted_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right pr-6 align-middle space-x-1.5 whitespace-nowrap">

                            {/* Official Marksheet PDF Modal */}
                            <button
                              type="button"
                              onClick={() => setMarksheetModalSubmission(sub)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] shadow-2xs inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Generate Official Marksheet PDF"
                            >
                              <FileCheck2 size={12} /> Marksheet (PDF)
                            </button>

                            {/* Detailed Answer Sheet */}
                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(sub)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Inspect Candidate's Selected Answers"
                            >
                              <Eye size={12} /> Sheet
                            </button>

                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalCandidatePages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="text-xs text-slate-500 font-bold">
                  Page {candidatePage} of {totalCandidatePages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={candidatePage === 1}
                    onClick={() => setCandidatePage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={candidatePage === totalCandidatePages}
                    onClick={() => setCandidatePage((p) => Math.min(totalCandidatePages, p + 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Candidate Detailed Answer Sheet Drawer / Modal */}
          {selectedSubmission && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Candidate Answer Sheet Inspection</div>
                  <h4 className="text-sm font-black text-slate-900">
                    {selectedSubmission.student_name} - Score: {selectedSubmission.score} / {selectedSubmission.total_marks} ({selectedSubmission.percentage}%)
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                      {selectedSubmission.device_type === 'Mobile' ? '📱 Mobile Device' : selectedSubmission.device_type === 'Tablet' ? '📟 Tablet Device' : '💻 Desktop / Laptop'}
                    </span>
                    {selectedSubmission.ip_address && (
                      <span className="px-2 py-0.5 rounded-md font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                        IP: {selectedSubmission.ip_address}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                      ⏱️ {Math.floor(selectedSubmission.time_taken_seconds / 60)}m {selectedSubmission.time_taken_seconds % 60}s
                    </span>
                    {selectedSubmission.is_cheating ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold border border-rose-200">
                        ⚠️ Focus Switching Detected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        ✓ Clean Session
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMarksheetModalSubmission(selectedSubmission)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileCheck2 size={13} /> View Marksheet (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {(() => {
                  try {
                    const parsed = typeof selectedSubmission.responses_json === 'string'
                      ? JSON.parse(selectedSubmission.responses_json)
                      : selectedSubmission.responses_json;

                    if (!Array.isArray(parsed) || parsed.length === 0) {
                      return <div className="text-xs text-slate-400 py-6 text-center">No individual question breakdown available for this submission.</div>;
                    }

                    return parsed.map((item: any, qIdx: number) => (
                      <div
                        key={item.questionId || qIdx}
                        className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.isCorrect ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                          }`}
                      >
                        <div className="font-medium text-slate-900 pr-2">
                          <strong className="text-slate-950 font-bold">Q{item.questionNumber || qIdx + 1}.</strong> {item.question}
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                          <span className="px-2 py-1 rounded bg-white border border-slate-200">
                            Chosen: <strong className="text-slate-900">{item.candidateAnswer || 'None'}</strong>
                          </span>
                          <span className="px-2 py-1 rounded bg-emerald-100/70 text-emerald-900 border border-emerald-300">
                            Correct: <strong>{item.correctAnswer}</strong>
                          </span>
                          <span className={`px-2 py-1 rounded font-bold uppercase text-[10px] ${item.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                            {item.isCorrect ? '✓ Correct' : '✗ Wrong'}
                          </span>
                        </div>
                      </div>
                    ));
                  } catch {
                    return <div className="text-xs text-slate-400 py-4">Unable to parse response JSON.</div>;
                  }
                })()}
              </div>
            </div>
          )}

        </div>
      )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PUBLISH SETTINGS & CANDIDATE LINK GENERATOR */}
      {/* ========================================================================= */}
      {publishModalTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">Publish & Test Link</div>
                <h3 className="text-lg font-black text-slate-900">{publishModalTest.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalTest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Config Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Mark %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={publishPassMarks}
                    onChange={(e) => setPublishPassMarks(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={publishStudentLimit}
                    onChange={(e) => setPublishStudentLimit(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {quota && (publishStudentLimit > (quota.free_students_per_test || 50)) && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <strong>Additional Fee Required:</strong> You are setting the candidate limit to {publishStudentLimit}, which is {(publishStudentLimit - (quota.free_students_per_test || 50))} more than the free base limit ({quota.free_students_per_test || 50}).
                      <br />
                      <span className="font-bold text-amber-700 mt-1 block">
                        Wallet Deduction: ₹{(publishStudentLimit - (quota.free_students_per_test || 50)) * (quota.charge_per_extra_student || 5)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                <span>Auto-Submit Test on Timeout</span>
                <input
                  type="checkbox"
                  checked={publishAutoSubmit}
                  onChange={(e) => setPublishAutoSubmit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Secure Public Test Link Box */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-indigo-600" /> Candidate Public Link</span>
                  {Number(publishModalTest.is_published) === 1 ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Needs Publish</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getCandidateTestUrl(publishModalTest.test_uid)}
                    className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-[11px] font-mono text-slate-800 outline-none select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(publishModalTest.test_uid)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Quick Share Links */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <a
                    href={getCandidateTestUrl(publishModalTest.test_uid)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Open Test In New Tab
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Take your Online Exam for ${publishModalTest.title}: ${getCandidateTestUrl(publishModalTest.test_uid)}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    Share via WhatsApp &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setPublishModalTest(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              {Number(publishModalTest.is_published) === 1 ? (
                <button
                  type="button"
                  disabled={publishSaving}
                  onClick={() => handleSavePublishSettings(false)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Unpublish Test
                </button>
              ) : null}

              <button
                type="button"
                disabled={publishSaving}
                onClick={() => handleSavePublishSettings(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>
                  {publishSaving
                    ? 'Saving...'
                    : Number(publishModalTest.is_published) === 1
                      ? 'Save Changes & Close'
                      : 'Publish Test & Activate Link'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SINGLE TEST RESULTS & CANDIDATE SCORECARDS INSPECTOR */}
      {/* ========================================================================= */}
      {resultsModalTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 shrink-0">
              <div>
                <div className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">Candidate Scorecard Report</div>
                <h3 className="text-lg font-black text-slate-900">{resultsModalTest.title} - Test Results</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportResultsCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setResultsModalTest(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search & Submissions Table */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidates by name or roll..."
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Total Attempts: <strong className="text-slate-900">{filteredSubmissions.length}</strong>
                </div>
              </div>

              {loadingSubmissions ? (
                <div className="text-center py-16 text-slate-400 text-xs">Loading candidate scorecards...</div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  No candidate submissions recorded yet for this test.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 text-center">Sr.</th>
                        <th className="py-2.5 px-3">Candidate</th>
                        <th className="py-2.5 px-3">Roll / Mobile</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Anti-Cheat</th>
                        <th className="py-2.5 px-3 text-center">IP & Device</th>
                        <th className="py-2.5 px-3 text-center">Time Spent</th>
                        <th className="py-2.5 px-3 text-right">Reports</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredSubmissions.map((sub, idx) => {
                        const isPass = sub.status === 'PASSED';
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{sub.student_name}</td>
                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                              {sub.student_roll || sub.student_mobile || 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-slate-900">
                              {sub.score} / {sub.total_marks}
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold text-indigo-700">
                              {sub.percentage}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sub.is_cheating ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200">CHEATING</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">CLEAN</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {sub.device_type === 'Mobile' ? '📱 Mobile' : sub.device_type === 'Tablet' ? '📟 Tablet' : '💻 PC'}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500" title={sub.ip_address || 'IP'}>
                                  {sub.ip_address || 'Logged'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600 text-[11px]">
                              {Math.floor(sub.time_taken_seconds / 60)}m {sub.time_taken_seconds % 60}s
                            </td>
                            <td className="py-3 px-3 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => setMarksheetModalSubmission(sub)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <FileCheck2 size={11} /> Marksheet
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSubmission(sub)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                              >
                                Sheet
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFICIAL MARKSHEET (PDF) PREVIEW & PRINT FOR CENTER */}
      {/* ========================================================================= */}
      {marksheetModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8 space-y-6">

            {/* Action Bar */}
            <div className="flex items-center justify-between border-b pb-4 no-print">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Official Statement of Marks</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer size={15} /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setMarksheetModalSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Marksheet Container */}
            <div className="border-4 border-double border-indigo-950 p-6 sm:p-8 rounded-2xl bg-white space-y-6 text-slate-900 relative">

              {/* Header */}
              <div className="text-center border-b-2 border-indigo-950 pb-4 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900">
                  Government of India Accredited Assessment Portal
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-indigo-950 uppercase tracking-tight">
                  {marksheetModalSubmission.centerName || 'Skill Development & Examination Center'}
                </h2>
                <div className="text-xs text-slate-600 font-bold">
                  {marksheetModalSubmission.centerCode && `Center Code: ${marksheetModalSubmission.centerCode} | `}
                  ISO 9001:2015 Certified Examination Body
                </div>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-indigo-950 text-white font-extrabold text-xs tracking-wider uppercase">
                  Statement of Marks / E-Certificate
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Candidate Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{marksheetModalSubmission.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Examination / Test</span>
                  <span className="font-extrabold text-slate-900 text-sm">{marksheetModalSubmission.testTitle || 'Online Examination'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Roll Number</span>
                  <span className="font-mono font-bold text-slate-800">{marksheetModalSubmission.student_roll || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Student ID / Aadhar</span>
                  <span className="font-mono font-bold text-slate-800">{marksheetModalSubmission.student_id_card || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Date of Examination</span>
                  <span className="font-bold text-slate-800">
                    {new Date(marksheetModalSubmission.submitted_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Contact / Email</span>
                  <span className="font-medium text-slate-700">
                    {marksheetModalSubmission.student_mobile || marksheetModalSubmission.student_email || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-indigo-950 text-white font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Subject / Module</th>
                      <th className="py-2.5 px-3 text-center">Maximum Marks</th>
                      <th className="py-2.5 px-3 text-center">Passing Marks</th>
                      <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                      <th className="py-2.5 px-3 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {marksheetModalSubmission.testCategory || 'General Assessment'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {marksheetModalSubmission.total_marks}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {marksheetModalSubmission.testPassMarks || Math.round(marksheetModalSubmission.total_marks * 0.4)}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-indigo-900 text-sm">
                        {marksheetModalSubmission.score}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${marksheetModalSubmission.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                          {marksheetModalSubmission.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
                    <tr>
                      <td className="py-2.5 px-3">Grand Total</td>
                      <td className="py-2.5 px-3 text-center">{marksheetModalSubmission.total_marks}</td>
                      <td className="py-2.5 px-3 text-center">-</td>
                      <td className="py-2.5 px-3 text-center text-indigo-950 text-sm">{marksheetModalSubmission.score}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-700">{marksheetModalSubmission.percentage}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* QR Verification and Signature Seals */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-white border border-slate-300 rounded-lg">
                    <QRCodeSVG
                      value={`VERIFY-CERT:${marksheetModalSubmission.id}-${marksheetModalSubmission.student_name}-${marksheetModalSubmission.score}/${marksheetModalSubmission.total_marks}`}
                      size={60}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <span className="font-bold text-slate-700 block">QR Verification Valid</span>
                    <span>Scan to verify candidate result authenticity on official portal.</span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-32 border-b border-slate-400 mx-auto" />
                  <div className="text-[10px] font-bold uppercase text-slate-700">Authorized Signatory</div>
                  <div className="text-[9px] text-slate-400">Controller of Examinations</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAID TEST CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {paidConfirmModalOpen && quota && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Coins size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Paid Test Creation</h3>
                <p className="text-xs text-slate-500">Super Admin Monthly Quota Policy</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 mb-4 space-y-2 text-xs">
              <p className="font-semibold text-amber-900">
                You have used all <strong className="font-bold">{quota.monthly_free_limit} free tests</strong> allocated for {quota.current_month}.
              </p>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-slate-700">
                <span>Fee for this test:</span>
                <span className="font-black text-amber-900 text-sm">₹{quota.charge_per_extra_test}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Current Wallet Balance:</span>
                <span className="font-bold text-slate-900">₹{quota.wallet_balance}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-emerald-800 pt-1 border-t border-amber-200">
                <span>Balance after deduction:</span>
                <span>₹{quota.wallet_balance - quota.charge_per_extra_test}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Test Name: <strong className="text-slate-900">"{newTestTitle}"</strong>.
              ₹{quota.charge_per_extra_test} will be automatically debited from your center wallet balance.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaidConfirmModalOpen(false)}
                disabled={creatingTest}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCreateTest}
                disabled={creatingTest}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Coins size={15} />
                <span>{creatingTest ? 'Processing Payment...' : `Confirm & Pay ₹${quota.charge_per_extra_test}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAPTCHA CONFIRM DELETE MODALS */}
      {/* ========================================================================= */}
      {/* Soft Delete / Move to Recycle Bin */}
      <DeleteConfirmCaptchaModal
        isOpen={Boolean(deletingTest)}
        onClose={() => setDeletingTest(null)}
        onConfirm={confirmDeleteTest}
        title="Move Test to Recycle Bin"
        description="Are you sure you want to delete this test? It will be moved to the Recycle Bin and can be recovered within 72 hours. After 72 hours, it will be automatically and permanently removed."
        itemName={deletingTest?.title || 'Online Test'}
      />

      {/* Permanent Delete Modal */}
      <DeleteConfirmCaptchaModal
        isOpen={Boolean(permanentDeletingTest)}
        onClose={() => setPermanentDeletingTest(null)}
        onConfirm={confirmPermanentDeleteTest}
        title="Permanently Delete Online Test"
        description="Are you sure you want to PERMANENTLY remove this test? This action cannot be undone. All questions, candidate submissions, and results will be permanently erased."
        itemName={permanentDeletingTest?.title || 'Online Test'}
      />

      {/* Recover Confirm Modal */}
      {recoveringTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                <RefreshCw size={30} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Recover Test?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Restore <strong className="text-slate-900">{recoveringTest.title}</strong> back to active status.
              </p>

              {/* Recovery Rules & Quota Breakdown */}
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-left space-y-2 mb-6">
                <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                  <span>Important Recovery & Quota Policy:</span>
                </div>
                <ul className="text-[11px] text-indigo-900 space-y-1 list-disc list-inside">
                  <li>Recovering counts as <strong>1 test</strong> in your current monthly quota.</li>
                  <li>A fresh <strong>72-hour validity countdown</strong> will be activated.</li>
                  {quota?.requires_charge ? (
                    <li className="text-amber-900 font-bold">
                      ⚠️ Monthly free limit reached. Recovery fee of <strong>₹{quota.charge_per_extra_test}</strong> will be debited from Center Wallet (Balance: ₹{quota.wallet_balance}).
                    </li>
                  ) : (
                    <li className="text-emerald-800 font-semibold">
                      Covered under your Monthly Free Test Quota ({quota?.free_tests_remaining ?? 0} free tests remaining).
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setRecoveringTest(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRecoverTest}
                  disabled={Boolean(quota?.requires_charge && !quota.has_sufficient_balance)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold shadow-md transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5 ${quota?.requires_charge && !quota.has_sufficient_balance
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                    }`}
                >
                  <RefreshCw size={13} />
                  <span>
                    {quota?.requires_charge && !quota.has_sufficient_balance
                      ? 'Insufficient Balance'
                      : quota?.requires_charge
                        ? `Recover & Pay ₹${quota.charge_per_extra_test}`
                        : 'Yes, Recover Test'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmCaptchaModal
        isOpen={Boolean(deletingQuestion)}
        onClose={() => setDeletingQuestion(null)}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        description="Are you sure you want to remove this question from the test?"
        itemName={deletingQuestion?.question.slice(0, 30) || 'Question'}
      />

      {/* CONFIRM PUBLISH MODAL (CUSTOM STYLED) */}
      {showConfirmPublishModal && publishModalTest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border border-slate-200/50">
            {/* Header */}
            <div className="bg-amber-50 border-b border-amber-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-amber-500/10">
                <AlertCircle size={120} />
              </div>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-sm z-10 border border-amber-200">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-amber-900 z-10">Confirm Publish Action</h3>
              <p className="text-amber-700 text-sm mt-2 max-w-sm z-10 font-medium leading-relaxed">
                {publishModalTest.has_been_published ? (
                  "This test has already been published before. Republishing it will not cost any extra quota or credits."
                ) : quota?.requires_charge ? (
                  <>
                    <strong className="text-red-600">WARNING: You have exhausted your free quota.</strong><br />
                    Publishing this test will deduct <strong>₹{quota.charge_per_extra_test}</strong> from your wallet.
                  </>
                ) : (
                  <>
                    Publishing this test will use <strong>1</strong> of your <strong>{quota?.free_tests_remaining}</strong> remaining free tests this month.
                  </>
                )}
              </p>
            </div>

            {/* Complete Preview / Details */}
            <div className="p-6 bg-white">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                <LayoutDashboard size={12} /> Test Details Preview
              </h4>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 mb-6">
                <div className="flex justify-between items-start pb-3 border-b border-slate-200/60">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Test Title</div>
                    <div className="text-sm font-bold text-slate-800">{publishModalTest.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Category</div>
                    <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">{publishModalTest.category || 'General'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Questions</div>
                    <div className="text-sm font-black text-slate-700 flex items-center gap-1.5"><HelpCircle size={14} className="text-slate-400" /> {publishModalTest.questionCount || 0} Total</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Marks</div>
                    <div className="text-sm font-black text-slate-700 flex items-center gap-1.5"><Award size={14} className="text-slate-400" /> {publishPassMarks} / {publishModalTest.total_marks || 100}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Duration</div>
                    <div className="text-sm font-black text-slate-700 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {publishDuration} Mins</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Student Limit</div>
                    <div className="text-sm font-black text-slate-700 flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {publishStudentLimit} Max</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl">
                <CheckCircle2 size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Please confirm that all questions, correct options, and test settings are accurate. Changes to questions after publishing may affect active candidate sessions.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 rounded-b-3xl">
              <button
                type="button"
                disabled={publishSaving}
                onClick={() => {
                  setShowConfirmPublishModal(false);
                  setPublishModalTest(null);
                  handleOpenAddQuestions(publishModalTest);
                }}
                className="px-4 py-2.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="View & Edit Questions"
              >
                <Eye size={16} /> Review Q&A
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={publishSaving}
                  onClick={() => setShowConfirmPublishModal(false)}
                  className="px-4 py-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={publishSaving}
                  onClick={() => handleSavePublishSettings(true, true)}
                  className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${!publishModalTest.has_been_published && quota?.requires_charge
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    }`}
                >
                  {publishSaving ? 'Publishing...' :
                    !publishModalTest.has_been_published && quota?.requires_charge
                      ? `Yes, Deduct ₹${quota.charge_per_extra_test} & Publish`
                      : 'Yes, Confirm & Publish'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: AI / JSON BULK IMPORT QUESTIONS */}
      {/* ========================================== */}
      {isBulkJsonModalOpen && activeTest && (
        <BulkQuestionJsonImportModal
          testId={activeTest.id}
          testTitle={activeTest.title}
          customApiEndpoint={`/api/center/free-tests/${activeTest.id}/questions/bulk`}
          onClose={() => setIsBulkJsonModalOpen(false)}
          onSuccess={() => {
            setIsBulkJsonModalOpen(false);
            setNotification({ type: 'success', message: 'Questions successfully imported via JSON!' });
            fetchQuestions(activeTest.id);
            fetchTests();
          }}
        />
      )}

    </div>
  );
};

export default FreeTestManager;
