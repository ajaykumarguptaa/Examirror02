import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SEO from '../../components/SEO';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  ShieldCheck,
  Printer,
  Sparkles,
  BookOpen,
  User,
  Phone,
  Mail,
  FileText,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  School,
  Timer,
  FileCheck2,
  Download,
  Lock,
  Calendar,
  Building2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Question {
  id: number;
  testId: number;
  question: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  marks?: number;
}

interface TestInfo {
  id: number;
  title: string;
  description?: string;
  test_uid: string;
  duration_minutes: number;
  auto_submit: boolean;
  pass_marks: number;
  total_marks: number;
  category?: string;
  centerName: string;
  centerCode: string;
  centerPhone?: string;
  centerLogo?: string;
  totalQuestions: number;
  is_expired?: boolean;
  expires_at?: string;
}

interface EvaluationResult {
  submissionId: number;
  testTitle: string;
  candidate: {
    name: string;
    roll?: string;
    idCard?: string;
    mobile?: string;
    email?: string;
  };
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  status: 'PASSED' | 'FAILED';
  timeTakenSeconds: number;
  questionBreakdown: Array<{
    questionNumber: number;
    questionId: number;
    question: string;
    optA: string;
    optB: string;
    optC: string;
    optD: string;
    correctAnswer: string;
    candidateAnswer: string;
    isCorrect: boolean;
    isAnswered: boolean;
    marks?: number;
  }>;
  submittedAt: string;
}

const CandidateTestPortal: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();

  // Stages: 'entry' | 'in_progress' | 'submitted'
  const [stage, setStage] = useState<'entry' | 'in_progress' | 'submitted'>('entry');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deactivation & Expiry State
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState<string | null>(null);
  const [alreadySubmittedInfo, setAlreadySubmittedInfo] = useState<any | null>(null);
  const [autoSubmittedForTimeout, setAutoSubmittedForTimeout] = useState(false);

  // Test Data
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const rawQuestionsRef = useRef<Question[]>([]);

  // Candidate Registration Info
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentIdCard, setStudentIdCard] = useState('');
  const [studentMobile, setStudentMobile] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [agreeRules, setAgreeRules] = useState(false);

  // Anti-Cheating & Security State
  const [tabViolations, setTabViolations] = useState<number>(0);
  const [showCheatingWarning, setShowCheatingWarning] = useState<boolean>(false);
  const [warningCountdown, setWarningCountdown] = useState<number>(10);
  const [autoSubmittedForCheating, setAutoSubmittedForCheating] = useState<boolean>(false);
  const [violationType, setViolationType] = useState<string>('Tab / Window Switching');

  // Test Execution State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<{ [questionId: number]: 'A' | 'B' | 'C' | 'D' }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [questionId: number]: boolean }>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Result & Marksheet State
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);

  // Web Audio Synthesizer Warning Beep
  const playWarningBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Fisher-Yates (Knuth) Array Shuffler
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Fetch Test Details
  // Fetch Test Details & Restore Persistent State (Never lose tested student data on refresh)
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Check if candidate already has a submitted evaluation result on this browser
        if (uid) {
          const savedEval = localStorage.getItem(`candidate_evaluation_${uid}`);
          if (savedEval) {
            try {
              const parsedEval = JSON.parse(savedEval);
              if (parsedEval && (parsedEval.score !== undefined || parsedEval.submissionId)) {
                setEvaluation(parsedEval);
                setStage('submitted');
                if (parsedEval.autoSubmittedForCheating) {
                  setAutoSubmittedForCheating(true);
                }
              }
            } catch (e) {
              console.error('Error parsing saved evaluation:', e);
            }
          }

          const savedSub = localStorage.getItem(`candidate_test_submitted_${uid}`);
          if (savedSub) {
            try {
              const parsed = JSON.parse(savedSub);
              setAlreadySubmittedInfo(parsed);
            } catch {}
          }
        }

        const res = await axios.get(`http://localhost:3000/api/public/test/${uid}`);
        if (res.data.success && res.data.data) {
          const testData = res.data.data.test;
          setTestInfo(testData);


          const fetchedQuestions: Question[] = res.data.data.questions || [];
          rawQuestionsRef.current = fetchedQuestions;
          setQuestions(fetchedQuestions);

          // 2. If test was in-progress before refresh (and not yet submitted), restore live state
          if (uid) {
            const savedEval = localStorage.getItem(`candidate_evaluation_${uid}`);
            const savedProgress = localStorage.getItem(`candidate_in_progress_${uid}`);
            if (savedProgress && !savedEval) {
              try {
                const prog = JSON.parse(savedProgress);
                if (prog && prog.studentName) {
                  setStudentName(prog.studentName || '');
                  setStudentRoll(prog.studentRoll || '');
                  setStudentIdCard(prog.studentIdCard || '');
                  setStudentMobile(prog.studentMobile || '');
                  setStudentEmail(prog.studentEmail || '');
                  setResponses(prog.responses || {});
                  setMarkedForReview(prog.markedForReview || {});
                  setCurrentIndex(Number(prog.currentIndex) || 0);

                  const startedAt = Number(prog.startedAt) || Date.now();
                  setStartTime(startedAt);

                  setStage('in_progress');
                }
              } catch (e) {
                console.error('Error parsing in-progress test session:', e);
              }
            } else if (!savedEval) {
              // noop
            }
          } else {
            // noop
          }

        } else {
          setError(res.data.message || 'Unable to load test');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load test. Please check the link.');
      } finally {
        setLoading(false);
      }
    };

    if (uid) fetchTest();
  }, [uid]);

  // Persist Live Test In-Progress State across Browser Refreshes
  useEffect(() => {
    if (stage === 'in_progress' && uid && studentName.trim() && startTime > 0) {
      localStorage.setItem(`candidate_in_progress_${uid}`, JSON.stringify({
        studentName,
        studentRoll,
        studentIdCard,
        studentMobile,
        studentEmail,
        responses,
        markedForReview,
        currentIndex,
        startedAt: startTime
      }));
    }
  }, [stage, uid, studentName, studentRoll, studentIdCard, studentMobile, studentEmail, responses, markedForReview, currentIndex, startTime]);

  // Submit Test Function (Permanently saves evaluation to avoid loss on refresh)
  const submitTest = useCallback(async (isAutoSubmit = false, isCheating = false) => {
    if (isSubmittingRef.current) return;
    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setShowSubmitConfirm(false);
      setShowCheatingWarning(false);
      if (isCheating) {
        setAutoSubmittedForCheating(true);
      }

      const timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);
      const payload = {
        student_name: studentName.trim(),
        student_roll: studentRoll.trim() || undefined,
        student_id_card: studentIdCard.trim() || undefined,
        student_mobile: studentMobile.trim() || undefined,
        student_email: studentEmail.trim() || undefined,
        time_taken_seconds: timeTakenSeconds,
        is_cheating: isCheating,
        responses
      };

      const res = await axios.post(`http://localhost:3000/api/public/test/${uid}/submit`, payload);
      if (res.data.success && res.data.result) {
        const evalResult = res.data.result;
        setEvaluation(evalResult);
        setStage('submitted');

        // Permanently persist full evaluation & marksheet data in localStorage
        if (uid) {
          const evalToSave = { ...evalResult, autoSubmittedForCheating: isCheating };
          localStorage.setItem(`candidate_evaluation_${uid}`, JSON.stringify(evalToSave));
          localStorage.setItem(`candidate_test_submitted_${uid}`, JSON.stringify({
            testUid: uid,
            submissionId: evalResult.submissionId,
            testTitle: testInfo?.title || evalResult.testTitle || 'Online Test',
            studentName: studentName.trim() || evalResult.candidate?.name,
            studentRoll: studentRoll.trim() || evalResult.candidate?.roll,
            studentIdCard: studentIdCard.trim() || evalResult.candidate?.idCard,
            score: evalResult.score,
            totalMarks: evalResult.totalMarks,
            percentage: evalResult.percentage,
            status: evalResult.status,
            submittedAt: evalResult.submittedAt || new Date().toISOString()
          }));
          // Clean up in-progress timer state
          localStorage.removeItem(`candidate_in_progress_${uid}`);
        }
      } else {
        alert(res.data.message || 'Failed to submit test');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.response?.data?.message || 'Submission failed. Please check network.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [responses, studentEmail, studentIdCard, studentMobile, studentName, studentRoll, testInfo?.title, startTime, uid]);

  // Start Test Action with Question Shuffling & Fullscreen Request
  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!agreeRules) {
      alert('Please accept the exam guidelines to proceed');
      return;
    }
    if (questions.length === 0) {
      alert('This test has no questions currently.');
      return;
    }

    // 1. Shuffle Questions for unique sequence per candidate
    const shuffled = shuffleArray(rawQuestionsRef.current.length > 0 ? rawQuestionsRef.current : questions);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setTabViolations(0);
    setShowCheatingWarning(false);

    // 2. Request Fullscreen if supported
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    } catch {}

    setStage('in_progress');

    // Persist immediately
    if (uid) {
      axios.post(`http://localhost:3000/api/public/test/${uid}/start`, {
        student_name: studentName.trim(),
        student_roll: studentRoll.trim(),
        student_id_card: studentIdCard.trim(),
        student_mobile: studentMobile.trim(),
        student_email: studentEmail.trim()
      }).catch(() => {});

      localStorage.setItem(`candidate_in_progress_${uid}`, JSON.stringify({
        studentName: studentName.trim(),
        studentRoll: studentRoll.trim(),
        studentIdCard: studentIdCard.trim(),
        studentMobile: studentMobile.trim(),
        studentEmail: studentEmail.trim(),
        responses: {},
        markedForReview: {},
        currentIndex: 0,
        startedAt: Date.now()
      }));
      setStartTime(Date.now());
    }
  };

  // -------------------------------------------------------------------------
  // ANTI-CHEATING SECURITY: TAB / WINDOW SWITCH & BLUR DETECTION
  // -------------------------------------------------------------------------
  const triggerViolation = useCallback((reason: string) => {
    if (stage !== 'in_progress' || isSubmitting) return;

    playWarningBeep();
    setViolationType(reason);

    setTabViolations((prevCount) => {
      const nextCount = prevCount + 1;
      if (nextCount >= 2) {
        // Exceeded allowed warnings: AUTO-SUBMIT IMMEDIATELY!
        submitTest(true, true);
        return nextCount;
      } else {
        // First violation: Show urgent modal & 10s countdown
        setShowCheatingWarning(true);
        setWarningCountdown(10);
        return nextCount;
      }
    });
  }, [stage, isSubmitting, submitTest]);

  // Tab switch & Window Blur Listeners
  useEffect(() => {
    if (stage !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerViolation('Tab Switch / Window Minimized');
      }
    };

    const handleBlur = () => {
      // Window lost focus (user clicked on another app or secondary screen)
      triggerViolation('Window Focus Lost / Screen Switch');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopyCutPaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+P, F12, Ctrl+Shift+I, Alt+Tab
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 'p', 'i', 's', 'a'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyCutPaste);
    window.addEventListener('cut', handleCopyCutPaste);
    window.addEventListener('paste', handleCopyCutPaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyCutPaste);
      window.removeEventListener('cut', handleCopyCutPaste);
      window.removeEventListener('paste', handleCopyCutPaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stage, triggerViolation]);

  // Warning Modal Countdown: If candidate stays on warning modal for 10s without clicking "Resume", auto-submit!
  useEffect(() => {
    if (!showCheatingWarning || stage !== 'in_progress') return;

    const timer = setInterval(() => {
      setWarningCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest(true, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCheatingWarning, stage, submitTest]);

  // Option selection
  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: opt
    }));
  };

  const handleClearOption = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setResponses((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Stats for palette
  const answeredCount = Object.keys(responses).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // ----------------------------------------------------
  // LOADING / ERROR STATES
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-wide">Loading Secure Test Environment...</h2>
        <p className="text-slate-400 text-xs mt-1">Please wait while we verify authentication tokens.</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // DEACTIVATED / EXPIRED TEST LINK SCREEN
  // ----------------------------------------------------
  if (isDeactivated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700/80 text-center animate-in zoom-in-95 duration-200">
          
          <div className="relative mx-auto mb-6 w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Lock size={36} className="text-amber-400 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
              CLOSED
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-3">
            <Clock size={13} /> Time Window Expired / Link Deactivated
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Online Test Link Inactive
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
            {deactivationReason || 'The designated examination window for this test has ended or has been deactivated by the Center Administrator. No further attempts or submissions are accepted.'}
          </p>

          {testInfo && (
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-left mb-6 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Test Name:</span>
                <span className="font-extrabold text-white">{testInfo.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Category:</span>
                <span className="font-bold text-indigo-300">{testInfo.category || 'General'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Examination Body:</span>
                <span className="font-bold text-slate-200">{testInfo.centerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Center Code:</span>
                <span className="font-mono font-bold text-amber-400">{testInfo.centerCode}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 uppercase">
                  Deactivated / Expired
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Return to Homepage</span>
              <ChevronRight size={15} />
            </Link>
            <Link
              to="/verify/student"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>Verify Certificates</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ALREADY SUBMITTED / ATTEMPTED SCREEN
  // ----------------------------------------------------
  if (alreadySubmittedInfo && stage !== 'submitted') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700/80 text-center animate-in zoom-in-95 duration-200">
          
          <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-3">
            <FileCheck2 size={13} /> Assessment Completed & Submitted
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Test Already Submitted
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
            You have already completed this examination on this browser. In accordance with exam guidelines, test links are single-use per candidate and are now deactivated for this device.
          </p>

          <div className="bg-slate-950/70 rounded-2xl p-5 border border-slate-800 text-left mb-6 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Candidate Name:</span>
              <span className="font-extrabold text-white text-sm">{alreadySubmittedInfo.studentName}</span>
            </div>
            {alreadySubmittedInfo.studentRoll && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Roll Number:</span>
                <span className="font-mono font-bold text-slate-200">{alreadySubmittedInfo.studentRoll}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Test Name:</span>
              <span className="font-bold text-indigo-300">{alreadySubmittedInfo.testTitle || testInfo?.title || 'Online Assessment'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Score Obtained:</span>
              <span className="font-black text-emerald-400 text-sm">{alreadySubmittedInfo.score} / {alreadySubmittedInfo.totalMarks} ({alreadySubmittedInfo.percentage}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Result Status:</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${
                alreadySubmittedInfo.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {alreadySubmittedInfo.status}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Submitted On:</span>
              <span>{new Date(alreadySubmittedInfo.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {evaluation && (
              <button
                type="button"
                onClick={() => setStage('submitted')}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 size={15} />
                <span>View Full Scorecard &amp; Marksheet</span>
              </button>
            )}
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Return to Homepage</span>
              <ChevronRight size={15} />
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (error || !testInfo) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center border border-slate-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Test Unavailable</h2>
          <p className="text-xs text-slate-600 mb-6">{error || 'This test link is either expired or unpublished.'}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STAGE 1: CANDIDATE ENTRY & INSTRUCTIONS
  // ----------------------------------------------------
  if (stage === 'entry') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans py-10 px-4 flex items-center justify-center animate-in fade-in duration-1000">
        <SEO title={`${testInfo.title || 'Online Test Portal'} | Examirror`} noindex={true} />
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 duration-700">
          
          {/* Header Banner */}
          <div className="bg-[#1e1b4b] text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm hidden sm:block">
                  <img src="/logo.png" alt="Exam Mirror" className="h-12 w-auto object-contain" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold mb-2 border border-white/20">
                    <Sparkles size={13} className="text-indigo-300" /> {testInfo.category || 'Online Assessment'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{testInfo.title}</h1>
                  <p className="text-indigo-200 text-xs sm:text-sm mt-1">{testInfo.description || 'Official Online Examination & Skill Assessment'}</p>
                </div>
              </div>

              <div className="text-right bg-black/20 px-4 py-3 rounded-2xl border border-white/10 shrink-0 max-w-[180px] sm:max-w-[250px] flex items-center gap-3 relative overflow-hidden">
                {testInfo.centerLogo && (
                  <img src={testInfo.centerLogo} alt="Center Logo" className="w-10 h-10 object-contain rounded bg-white p-1" />
                )}
                <div className="flex flex-col justify-center">
                  <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider mb-0.5 opacity-90">Conducted By</div>
                  <div className="font-bold text-sm text-white truncate" title={testInfo.centerName}>{testInfo.centerName}</div>
                  <div className="text-[10px] text-indigo-300 font-mono mt-0.5 truncate opacity-90" title={testInfo.centerCode}>Code: {testInfo.centerCode}</div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <div className="text-xs text-indigo-200 flex items-center justify-center gap-1"><BookOpen size={13} /> Total Qs</div>
                <div className="text-lg font-black text-white">{testInfo.totalQuestions}</div>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <div className="text-xs text-indigo-200 flex items-center justify-center gap-1"><Award size={13} /> Total Marks</div>
                <div className="text-lg font-black text-white">{testInfo.total_marks}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <div className="text-xs text-indigo-200 flex items-center justify-center gap-1"><CheckCircle2 size={13} /> Passing Mark</div>
                <div className="text-lg font-black text-white">{testInfo.pass_marks}%</div>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleStartTest} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <User size={18} className="text-indigo-600" /> Candidate Verification Details
                </h3>
                <p className="text-xs text-slate-500 mb-4">Please enter your accurate candidate details. Your official scorecard will be generated with this information.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Roll / Enrollment No (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. EXAM-2026-081"
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ID Card / Aadhar No (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. ID-89429 or 12-digit Aadhar"
                      value={studentIdCard}
                      onChange={(e) => setStudentIdCard(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={studentMobile}
                      onChange={(e) => setStudentMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. student@gmail.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center justify-between text-sm border-b pb-2">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-600" /> Exam Instructions & Anti-Cheat Rules</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">Strict Proctoring</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
                  <li>Timer begins immediately upon clicking <strong>Start Assessment Now</strong>.</li>
                  <li><strong>🎲 Unique Question Shuffling:</strong> All questions are randomly arranged uniquely for each candidate session.</li>
                  <li><strong>🚨 Strict Anti-Cheating Policy:</strong> Window/tab switching or minimizing the browser is strictly monitored. <strong>Switching tabs will trigger a security violation and auto-submit your test.</strong></li>
                  <li>Copying question text, right-clicking, or opening inspect tools is strictly disabled.</li>
                  <li>When timer reaches <strong>00:00</strong>, your test will <strong>automatically submit</strong>.</li>
                </ul>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeRules"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="agreeRules" className="text-xs text-slate-600 cursor-pointer select-none">
                  I agree to the examination code of conduct. I understand that any attempt to switch tabs or cheat will result in immediate automatic test submission.
                </label>
              </div>

              {/* Submit CTA */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!studentName.trim() || !agreeRules}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Start Assessment Now</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STAGE 2: LIVE TEST TAKING ENVIRONMENT
  // ----------------------------------------------------
  if (stage === 'in_progress') {
    const currentQ = questions[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === questions.length - 1;
    const selectedOpt = currentQ ? responses[currentQ.id] : null;
    const isCurrentMarked = currentQ ? markedForReview[currentQ.id] : false;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
        
        {/* Top Header */}
        <header className="bg-[#1e1b4b] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
              <School size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base leading-tight truncate max-w-[280px] sm:max-w-md">{testInfo.title}</h1>
              <div className="text-[11px] text-indigo-300 truncate">{studentName} • {testInfo.centerName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <FileCheck2 size={16} />
              <span>Submit Test</span>
            </button>
          </div>
        </header>

        {/* Anti-Cheat Active Security Status Sub-header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-bold text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="flex items-center gap-1 text-slate-700">
              <ShieldCheck size={13} className="text-indigo-600" />
              <strong>Anti-Cheating Proctor Active:</strong> Window / Tab switching is restricted.
            </span>
          </div>
          <div className="flex items-center gap-2 text-rose-700">
            <span>Violations Logged: <strong>{tabViolations}/1</strong> (Next switch = Instant Auto-Submit)</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] w-full mx-auto p-3 sm:p-5 gap-4">
          
          {/* Left: Active Question Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Question Header Bar */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                {isCurrentMarked && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[11px] flex items-center gap-1">
                    <Sparkles size={12} /> Marked for Review
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Marks: <span className="text-emerald-700 font-bold">+{currentQ.marks !== undefined ? currentQ.marks : 1}</span>
              </div>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              {currentQ ? (
                <div className="space-y-6">
                  {/* Question Text */}
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                    {currentQ.question}
                  </div>

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const optText = (currentQ as any)[`opt${key}`];
                      if (!optText) return null;
                      const isSelected = selectedOpt === key;

                      return (
                        <div
                          key={key}
                          onClick={() => handleSelectOption(key)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {key}
                          </div>
                          <div className="text-sm font-semibold text-slate-800 pt-0.5 leading-relaxed">
                            {optText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400">No question selected</div>
              )}
            </div>

            {/* Question Footer Bar */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isCurrentMarked
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{isCurrentMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                </button>

                {selectedOpt && (
                  <button
                    type="button"
                    onClick={handleClearOption}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Clear Choice
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {!isLast ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Save & Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(true)}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileCheck2 size={16} /> Complete & Submit
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right: Question Navigation Palette */}
          <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col shrink-0">
            
            {/* Palette Header */}
            <div className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between border-b pb-2.5">
              <span>Question Palette</span>
              <span className="text-[11px] font-bold text-slate-500">{answeredCount}/{questions.length} Solved</span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" /> Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 shrink-0" /> Unattempted ({unansweredCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-500 shrink-0" /> In Review ({reviewCount})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 border-2 border-indigo-400 shrink-0" /> Current
              </div>
            </div>

            {/* Question Grid Buttons (Up to 150) */}
            <div className="flex-1 overflow-y-auto max-h-[380px] lg:max-h-[460px] pr-1">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(responses[q.id]);
                  const isMarked = Boolean(markedForReview[q.id]);
                  const isCurrent = idx === currentIndex;

                  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                  if (isCurrent) {
                    bgClass = 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400 font-black shadow-xs';
                  } else if (isMarked) {
                    bgClass = 'bg-purple-600 text-white border-purple-700 font-bold';
                  } else if (isAnswered) {
                    bgClass = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl text-xs flex items-center justify-center border transition-all cursor-pointer ${bgClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Submit CTA */}
            <div className="mt-4 pt-3 border-t sm:hidden">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <FileCheck2 size={16} /> Submit Test Now
              </button>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------------- */}
        {/* ANTI-CHEATING WARNING MODAL */}
        {/* ------------------------------------------------------------------- */}
        {showCheatingWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-rose-600 text-center animate-in zoom-in-95 space-y-5">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <AlertTriangle size={44} />
              </div>

              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-rose-600">Security & Anti-Cheating Alert</div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Tab / Window Switch Detected!
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  You have switched tabs, minimized the browser window, or lost active screen focus.
                  This activity is strictly prohibited under official exam proctoring guidelines.
                </p>
              </div>

              {/* Warning Count & Countdown Box */}
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Warning Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                    Warning {tabViolations} of 1 Allowed
                  </span>
                </div>
                <p className="text-xs text-rose-700 font-semibold">
                  ⚠️ <strong>Next attempt will immediately and permanently AUTO-SUBMIT your exam!</strong>
                </p>
                <div className="text-xs font-mono font-black text-slate-800 pt-1">
                  Auto-submitting in: <span className="text-rose-600 text-sm font-black">{warningCountdown} seconds</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCheatingWarning(false)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>I Understand &amp; Return to Exam</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Confirm Test Submission</h3>
              <p className="text-xs text-slate-500 mb-6">Are you sure you want to finish and submit your test?</p>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-6 text-center text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Answered</div>
                  <div className="text-base font-black text-emerald-600">{answeredCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Unanswered</div>
                  <div className="text-base font-black text-slate-700">{unansweredCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">In Review</div>
                  <div className="text-base font-black text-purple-600">{reviewCount}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => submitTest(false)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ----------------------------------------------------
  // STAGE 3: INSTANT SCORECARD & CERTIFICATE-STYLE RESULT
  // ----------------------------------------------------
  if (stage === 'submitted' && evaluation) {
    const isPassed = evaluation.isPassed;

    return (
      <div className="min-h-screen bg-slate-900 py-10 px-4 font-sans">
        <div className="max-w-4xl w-full mx-auto space-y-6">

          {/* Anti-Cheat Auto-Submission Alert Banner if Applicable */}
          {autoSubmittedForCheating && (
            <div className="bg-rose-600 text-white p-4 sm:p-5 rounded-3xl shadow-xl flex items-center gap-3.5 border border-rose-500 animate-in slide-in-from-top duration-300">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="text-xs sm:text-sm">
                <div className="font-black uppercase tracking-wider text-[11px] text-rose-200">Security Violation Logged</div>
                <div className="font-bold">This exam was automatically submitted due to repeated tab or window switching during the test.</div>
              </div>
            </div>
          )}

          {/* Printable Result Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative" id="candidate-scorecard">
            
            {/* Dynamic Center Watermark in Result Scorecard Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.04]">
              <div className="flex flex-col items-center justify-center text-center rotate-[-22deg] transform scale-125">
                {testInfo.centerLogo ? (
                  <img src={testInfo.centerLogo.startsWith('http://localhost:3000') ? testInfo.centerLogo.replace('http://localhost:3000', '') : testInfo.centerLogo} alt="Center Logo" className="w-32 h-32 object-contain grayscale mb-2" />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-dashed border-slate-900 flex items-center justify-center mb-2 font-serif font-black text-4xl text-slate-900">
                    {testInfo.centerName ? testInfo.centerName.charAt(0) : 'E'}
                  </div>
                )}
                <div className="font-serif font-black tracking-wider uppercase text-3xl text-slate-950 leading-tight max-w-[500px]">
                  {testInfo.centerName || 'AUTHORIZED STUDY CENTER'}
                </div>
                <div className="font-mono font-black tracking-[0.2em] text-xs text-slate-900 mt-1 uppercase">
                  CENTER CODE: {testInfo.centerCode || 'EXAM-01'} • VERIFIED
                </div>
                <div className="font-serif font-extrabold tracking-[0.25em] text-[10px] text-slate-800 mt-0.5 uppercase">
                  EXAMIRROR NATIONAL ASSESSMENT SYSTEM
                </div>
              </div>
            </div>

            {/* Certificate Header Banner */}
            <div className={`p-8 text-white relative overflow-hidden ${
              isPassed
                ? 'bg-emerald-600'
                : 'bg-rose-600'
            }`}>
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs mb-2">
                    <Award size={14} /> Official Examination Scorecard
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black">{evaluation.testTitle}</h1>
                  <p className="text-white/80 text-xs sm:text-sm mt-1">Conducted by {testInfo.centerName} ({testInfo.centerCode})</p>
                </div>

                <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/25 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">Result Status</div>
                  <div className="text-xl sm:text-2xl font-black tracking-wider text-white">
                    {isPassed ? 'PASSED ✓' : 'NEEDS IMPROVEMENT ✗'}
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate & Performance Overview */}
            <div className="p-6 sm:p-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b pb-8">
                
                {/* Candidate Info */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Details</h3>
                  <div className="text-xl font-extrabold text-slate-900">{evaluation.candidate.name}</div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 font-medium">
                    {evaluation.candidate.roll && (
                      <div>Roll No: <span className="font-bold text-slate-900">{evaluation.candidate.roll}</span></div>
                    )}
                    {evaluation.candidate.idCard && (
                      <div>ID Card No: <span className="font-bold text-indigo-700 font-mono">{evaluation.candidate.idCard}</span></div>
                    )}
                    {evaluation.candidate.mobile && (
                      <div>Mobile: <span className="font-bold text-slate-900">{evaluation.candidate.mobile}</span></div>
                    )}
                    {evaluation.candidate.email && (
                      <div>Email: <span className="font-bold text-slate-900 truncate block">{evaluation.candidate.email}</span></div>
                    )}
                    <div>Date: <span className="font-bold text-slate-900">{new Date(evaluation.submittedAt).toLocaleDateString('en-IN')}</span></div>
                    <div>Center Code: <span className="font-bold text-slate-900">{testInfo.centerCode}</span></div>
                  </div>
                </div>

                {/* Big Score Box */}
                <div className={`p-5 rounded-2xl text-center border-2 ${
                  isPassed ? 'bg-emerald-50/60 border-emerald-300' : 'bg-rose-50/60 border-rose-300'
                }`}>
                  <div className="text-xs font-bold text-slate-500 uppercase">Obtained Score</div>
                  <div className={`text-4xl font-black my-1 ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {evaluation.score} <span className="text-lg font-bold text-slate-500">/ {evaluation.totalMarks}</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-700">
                    Percentage: <span className="text-indigo-700 font-black">{evaluation.percentage}%</span>
                  </div>
                </div>

              </div>

              {/* Breakdown Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Total Questions</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{evaluation.totalQuestions}</div>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1"><Check size={13} /> Correct</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{evaluation.correctCount}</div>
                </div>
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-center">
                  <div className="text-xs text-rose-700 font-semibold flex items-center justify-center gap-1"><X size={13} /> Incorrect</div>
                  <div className="text-xl font-extrabold text-rose-700 mt-0.5">{evaluation.wrongCount}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1"><Clock size={13} /> Time Spent</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatTimer(evaluation.timeTakenSeconds)}</div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 font-mono">
                  Verification Ref: EXAM-RES-{evaluation.submissionId}-{new Date().getFullYear()}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMarksheetModal(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck2 size={16} /> Generate Marksheet (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={15} /> Print Scorecard
                  </button>
                  <Link
                    to="/"
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Exit Portal
                  </Link>
                </div>
              </div>

            </div>

          </div>

          {/* Printable Official Marksheet Modal */}
          {showMarksheetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-300 flex flex-col my-auto max-h-[95vh]">
                
                {/* Modal Header Controls (Hidden during print) */}
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-amber-400" />
                    <h3 className="font-bold text-sm">Official Examination Marksheet / Statement of Marks</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Printer size={13} /> Print / Save as PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMarksheetModal(false)}
                      className="text-gray-400 hover:text-white text-xl font-bold px-2 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                {/* Printable Marksheet Container */}
                <div id="printable-marksheet" className="p-8 sm:p-12 overflow-y-auto font-sans bg-white text-slate-800 space-y-6">
                  
                  {/* Decorative Outer Border */}
                  <div className="border-4 border-double border-indigo-950 p-6 sm:p-8 rounded-2xl relative bg-white overflow-hidden">
                    
                    {/* Dynamic Center Watermark in Background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.06]">
                      <div className="flex flex-col items-center justify-center text-center rotate-[-22deg] transform scale-115">
                        {testInfo.centerLogo ? (
                          <img src={testInfo.centerLogo.startsWith('http://localhost:3000') ? testInfo.centerLogo.replace('http://localhost:3000', '') : testInfo.centerLogo} alt="Center Watermark" className="w-36 h-36 object-contain grayscale mb-3" />
                        ) : (
                          <div className="w-32 h-32 rounded-full border-4 border-dashed border-indigo-950 flex items-center justify-center mb-3 font-serif font-black text-4xl text-indigo-950">
                            {testInfo.centerName ? testInfo.centerName.charAt(0) : 'C'}
                          </div>
                        )}
                        <div className="font-serif font-black tracking-wider uppercase text-3xl sm:text-4xl text-indigo-950 leading-tight max-w-[540px]">
                          {testInfo.centerName || 'AUTHORIZED STUDY CENTER'}
                        </div>
                        <div className="font-mono font-black tracking-[0.25em] text-xs text-indigo-900 mt-1 uppercase">
                          CENTER CODE: {testInfo.centerCode || 'EXAM-01'} • VERIFIED
                        </div>
                        <div className="font-serif font-extrabold tracking-[0.3em] text-[10px] text-slate-800 mt-1 uppercase">
                          VOCATIONAL EDUCATION & ASSESSMENT CELL
                        </div>
                      </div>
                    </div>

                    {autoSubmittedForCheating && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-30deg] opacity-20">
                        <div className="text-6xl font-black text-rose-700 tracking-widest border-8 border-rose-700 px-8 py-4 rounded-3xl whitespace-pre-wrap text-center">
                          CHEATING DETECTED{'\n'}TAB SWITCHING VIOLATION
                        </div>
                      </div>
                    )}

                    {/* Top Center Header */}
                    <div className="text-center border-b-2 border-indigo-900 pb-5 relative z-10">
                      <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full mb-2">
                        <span>An ISO 9001:2015 Certified Autonomous Institution</span>
                        <span>•</span>
                        <span>Center Code: {testInfo.centerCode}</span>
                      </div>

                      <div className="flex items-center justify-center gap-3 my-2">
                        {testInfo.centerLogo ? (
                          <img 
                            src={testInfo.centerLogo.startsWith('http://localhost:3000') ? testInfo.centerLogo.replace('http://localhost:3000', '') : testInfo.centerLogo} 
                            alt={testInfo.centerName} 
                            className="w-14 h-14 object-contain rounded-xl p-1 bg-white border-2 border-indigo-800 shadow-md shrink-0" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-indigo-950 text-amber-300 flex items-center justify-center font-serif font-black text-2xl shadow-md border-2 border-amber-400 shrink-0">
                            {testInfo.centerName ? testInfo.centerName.substring(0, 2).toUpperCase() : 'SC'}
                          </div>
                        )}
                        <div className="text-center sm:text-left">
                          <h1 className="text-2xl sm:text-3xl font-black text-indigo-950 uppercase tracking-tight font-serif">
                            {testInfo.centerName}
                          </h1>
                          <p className="text-xs text-slate-600 font-semibold mt-0.5">
                            Autonomous Assessment & Vocational Skills Training Center
                          </p>
                        </div>
                      </div>

                      {/* Document Title Banner */}
                      <div className="mt-3 pt-1">
                        <div className="inline-block bg-indigo-950 text-white font-extrabold text-xs sm:text-sm px-8 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                          STATEMENT OF MARKS
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                          Online Examination & Candidate Assessment Report
                        </div>
                      </div>
                    </div>

                    {/* Meta Reference Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs border-b border-slate-200 relative z-10">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Marksheet Serial No</span>
                        <span className="font-mono font-bold text-indigo-900">
                          MS/EXM/{new Date().getFullYear()}/{String(evaluation.submissionId).padStart(5, '0')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Examination Date</span>
                        <span className="font-bold text-slate-800">
                          {new Date(evaluation.submittedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Assessment Mode</span>
                        <span className="font-bold text-slate-800">Online CBT Assessment</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Verification Ref</span>
                        <span className="font-mono font-bold text-slate-800">
                          EXM-RES-{evaluation.submissionId}-{new Date().getFullYear()}
                        </span>
                      </div>
                    </div>

                    {/* Candidate & Center Particulars (2-column Box) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs relative z-10">
                      
                      {/* Left: Candidate Details */}
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1">
                          <User size={12} /> Candidate Particulars
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Candidate Name:</span>
                            <span className="font-black text-slate-900 uppercase">{evaluation.candidate.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Roll / Enrollment No:</span>
                            <span className="font-bold font-mono text-slate-900">{evaluation.candidate.roll || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">ID Card / Aadhar No:</span>
                            <span className="font-bold font-mono text-indigo-700">{evaluation.candidate.idCard || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Mobile Number:</span>
                            <span className="font-semibold text-slate-800">{evaluation.candidate.mobile || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Email Address:</span>
                            <span className="font-semibold text-slate-800 truncate max-w-[180px]">{evaluation.candidate.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Center Details & Course Details */}
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1">
                          <School size={12} /> Authorized Examination Center
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Center Name:</span>
                            <span className="font-black text-slate-900">{testInfo.centerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Center Code:</span>
                            <span className="font-bold font-mono text-indigo-900">{testInfo.centerCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Assessment Subject:</span>
                            <span className="font-bold text-slate-900">{evaluation.testTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Subject Category:</span>
                            <span className="font-semibold text-slate-800">{testInfo.category || 'General Skills'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Duration Allotted:</span>
                            <span className="font-semibold text-slate-800">{testInfo.duration_minutes} Minutes</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Performance & Marks Matrix Table */}
                    <div className="mt-2 border border-slate-300 rounded-xl overflow-hidden relative z-10">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-indigo-950 text-white border-b border-indigo-900">
                            <th className="py-2.5 px-3 font-bold">Paper / Assessment Subject</th>
                            <th className="py-2.5 px-3 font-bold text-center w-24">Max Marks</th>
                            <th className="py-2.5 px-3 font-bold text-center w-24">Pass Marks</th>
                            <th className="py-2.5 px-3 font-bold text-center w-28">Obtained Marks</th>
                            <th className="py-2.5 px-3 font-bold text-center w-24">Percentage</th>
                            <th className="py-2.5 px-3 font-bold text-center w-20">Grade</th>
                            <th className="py-2.5 px-3 font-bold text-center w-28">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="bg-white">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              <div>{evaluation.testTitle}</div>
                              <div className="text-[10px] text-slate-500 font-normal">Online Objective Computer Based Test</div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-800">{evaluation.totalMarks}</td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-600">{Math.round(evaluation.totalMarks * (testInfo.pass_marks / 100))}</td>
                            <td className="py-3 px-3 text-center font-black text-indigo-950 text-sm">{evaluation.score}</td>
                            <td className="py-3 px-3 text-center font-black text-indigo-700">{evaluation.percentage}%</td>
                            <td className="py-3 px-3 text-center font-black">
                              <span className={`px-2 py-0.5 rounded border text-[11px] ${
                                evaluation.percentage >= 75 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : evaluation.percentage >= 40 ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}>
                                {evaluation.percentage >= 85 ? 'A+' : evaluation.percentage >= 75 ? 'A' : evaluation.percentage >= 60 ? 'B' : evaluation.percentage >= 50 ? 'C' : evaluation.percentage >= 40 ? 'D' : 'F'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${
                                isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {isPassed ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                            <td className="py-2.5 px-3 uppercase">Aggregate Total</td>
                            <td className="py-2.5 px-3 text-center">{evaluation.totalMarks}</td>
                            <td className="py-2.5 px-3 text-center">{Math.round(evaluation.totalMarks * (testInfo.pass_marks / 100))}</td>
                            <td className="py-2.5 px-3 text-center text-indigo-900 font-black">{evaluation.score}</td>
                            <td className="py-2.5 px-3 text-center text-indigo-900 font-black">{evaluation.percentage}%</td>
                            <td colSpan={2} className="py-2.5 px-3 text-center font-black text-emerald-800 uppercase">
                              {isPassed ? 'QUALIFIED ✓' : 'NOT QUALIFIED ✗'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Question Analytics Strip */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold py-3 border-b border-slate-200 relative z-10">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Total Questions: <span className="font-bold text-slate-900">{evaluation.totalQuestions}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-800">
                        Correct: <span className="font-bold">{evaluation.correctCount}</span>
                      </div>
                      <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-800">
                        Incorrect: <span className="font-bold">{evaluation.wrongCount}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Time Taken: <span className="font-bold text-slate-900">{formatTimer(evaluation.timeTakenSeconds)}</span>
                      </div>
                    </div>

                    {/* Verification & Official Signatures Footer */}
                    <div className="pt-6 grid grid-cols-3 items-end gap-4 relative z-10">
                      
                      {/* Left: Dynamic Verification QR Code */}
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
                          <QRCodeSVG
                            value={window.location.href}
                            size={64}
                            level="M"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight font-mono">
                          <span className="font-bold text-indigo-900 block">SCAN TO VERIFY</span>
                          Authenticity valid online.
                          <br />
                          Portal ID: #{evaluation.submissionId}
                        </div>
                      </div>

                      {/* Middle: Official Stamp Badge */}
                      <div className="text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full border-2 border-indigo-900/60 flex flex-col items-center justify-center p-1 text-[8px] font-extrabold text-indigo-900 uppercase text-center leading-tight bg-indigo-50/50">
                          <span>OFFICIAL</span>
                          <span>SEAL OF</span>
                          <span>EVALUATION</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Official Academic Seal</span>
                      </div>

                      {/* Right: Controller & Center Director Signatures */}
                      <div className="text-right space-y-3">
                        <div className="inline-block border-b-2 border-slate-900 pb-0.5 px-4">
                          <div className="font-serif italic text-sm font-bold text-indigo-950">Examination Dept</div>
                        </div>
                        <div className="text-[10px] font-extrabold text-slate-800 uppercase leading-tight">
                          Controller of Examinations
                          <div className="text-[9px] text-slate-500 font-normal">{testInfo.centerName}</div>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Micro Notice */}
                    <div className="border-t border-slate-200 mt-5 pt-2 text-center text-[9px] text-slate-400 font-medium">
                      This is a computer generated official statement of marks issued under the authority of {testInfo.centerName}.
                    </div>

                  </div>

                </div>

                {/* Modal Bottom Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => setShowMarksheetModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Download size={14} /> Download / Print PDF Marksheet
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Question-By-Question Detailed Answer Review */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detailed Answer Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">Compare your responses against correct solutions.</p>
              </div>
              <div className="text-xs font-bold text-slate-600">
                Passing Criteria: {testInfo.pass_marks}%
              </div>
            </div>

            <div className="space-y-4">
              {evaluation.questionBreakdown.map((q) => {
                return (
                  <div
                    key={q.questionId}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      q.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : !q.isAnswered
                        ? 'border-slate-200 bg-slate-50/40'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-bold text-slate-900 text-sm">
                        Q{q.questionNumber}. {q.question}
                      </div>
                      <div className="shrink-0">
                        {q.isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                            <Check size={11} /> Correct (+{q.marks !== undefined ? q.marks : 1})
                          </span>
                        ) : !q.isAnswered ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                            Unattempted (0)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                            <X size={11} /> Incorrect (0)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const optText = (q as any)[`opt${key}`];
                        if (!optText) return null;
                        const isThisCorrect = q.correctAnswer === key;
                        const isThisCandidateChoice = q.candidateAnswer === key;

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        if (isThisCorrect) {
                          optClass = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                        } else if (isThisCandidateChoice && !q.isCorrect) {
                          optClass = 'bg-rose-100 border-rose-400 text-rose-950 font-bold';
                        }

                        return (
                          <div
                            key={key}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${optClass}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-white/80 border border-current">
                                {key}
                              </span>
                              <span>{optText}</span>
                            </div>
                            {isThisCorrect && (
                              <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Correct Answer</span>
                            )}
                            {isThisCandidateChoice && !isThisCorrect && (
                              <span className="text-[10px] font-extrabold text-rose-700 uppercase">Your Choice</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
};

export default CandidateTestPortal;
