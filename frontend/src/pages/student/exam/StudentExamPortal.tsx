import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  HelpCircle, 
  Check, 
  X, 
  AlertTriangle,
  Bookmark,
  Flag,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  Volume2,
  Layers,
  ArrowRight,
  BarChart2,
  CheckCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  marks?: number;
  shuffledOptions?: string[];
}

const StudentExamPortal = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalInitialTime, setTotalInitialTime] = useState<number>(1);
  
  // UI Features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'answered' | 'review' | 'unanswered'>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse course semester scoring config
  const getSemesterConfig = () => {
    let rawSem = exam?.courseSemesters;
    if (typeof rawSem === 'string') {
      try { rawSem = JSON.parse(rawSem); } catch (_) {}
    }
    if (Array.isArray(rawSem)) {
      const semStr = String(exam?.semester || 'SEM 1').toUpperCase().trim();
      const semMatch = semStr.match(/\d+/);
      const semNum = semMatch ? semMatch[0] : '1';

      const found = rawSem.find((s: any) => {
        const sNumStr = String(s.num ?? '').toUpperCase().trim();
        const sMatch = sNumStr.match(/\d+/);
        const sVal = sMatch ? sMatch[0] : sNumStr;
        return (
          sNumStr === semStr ||
          `SEM ${sNumStr}` === semStr ||
          `SEMESTER ${sNumStr}` === semStr ||
          sVal === semNum
        );
      });
      if (found) {
        return {
          marksPerQ: found.marks_per_question !== undefined && found.marks_per_question !== null ? Number(found.marks_per_question) : 1,
          negMarks: found.negative_marks !== undefined && found.negative_marks !== null ? Number(found.negative_marks) : 0,
          writtenMarks: Number(found.marks) || 80,
          passMarks: found.pass_marks !== undefined && found.pass_marks !== null ? Number(found.pass_marks) : 40
        };
      }
    }
    return { marksPerQ: 1, negMarks: 0, writtenMarks: 80, passMarks: 40 };
  };

  const semConfig = getSemesterConfig();

  // Load Exam Data
  useEffect(() => {
    const fetchExamData = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/api/student/exams/${examId}/start`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          const fetchedExam = res.data.data.exam;
          const fetchedQs = (res.data.data.questions || []).map((q: any) => {
            const options = ['optA', 'optB', 'optC', 'optD'];
            // Fisher-Yates shuffle
            for (let i = options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [options[i], options[j]] = [options[j], options[i]];
            }
            return { ...q, shuffledOptions: options };
          });
          setExam(fetchedExam);
          setQuestions(fetchedQs);

          // Restore cached answers from localStorage if any
          const cachedAnswersKey = `exam_${examId}_answers`;
          const savedAnswers = localStorage.getItem(cachedAnswersKey);
          if (savedAnswers) {
            try { setAnswers(JSON.parse(savedAnswers)); } catch (_) {}
          }

          // Calculate time: 1.5 minutes per question or default 60 min
          const allocatedSecs = Math.max(fetchedQs.length * 90, 600);
          setTimeLeft(allocatedSecs);
          setTotalInitialTime(allocatedSecs);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error initializing exam.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId, navigate]);

  // Save answers to local storage on change
  useEffect(() => {
    if (examId && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
    }
  }, [answers, examId]);

  // Timer Tick
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-submit on time expiry
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting && questions.length > 0 && !submitResult) {
      executeSubmitExam();
    }
  }, [timeLeft, isSubmitting, questions.length, submitResult]);

  // Tab switch monitor
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitResult && !loading) {
        setTabSwitchCount(prev => prev + 1);
        setShowTabWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [submitResult, loading]);

  // Keyboard Shortcuts (A, B, C, D, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || submitResult || loading) return;

      const currentQ = questions[currentQuestionIdx];
      if (!currentQ) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const optionIndex = ['A', 'B', 'C', 'D'].indexOf(key);
        const targetOptKey = currentQ.shuffledOptions ? currentQ.shuffledOptions[optionIndex] : `opt${key}`;
        const targetLetter = targetOptKey.replace('opt', '');
        setAnswers(prev => ({ ...prev, [currentQ.id]: targetLetter }));
      } else if (e.key === 'ArrowRight' && currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIdx > 0) {
        setCurrentQuestionIdx(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIdx, questions, showSubmitModal, submitResult, loading]);

  const handleSelectOption = (questionId: number, optionKey: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleClearResponse = (questionId: number) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const toggleMarkForReview = (questionId: number) => {
    setMarkedForReview(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const executeSubmitExam = async () => {
    if (isSubmitting) return;
    const token = localStorage.getItem('studentToken');
    
    setIsSubmitting(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/student/exams/${examId}/submit`, { answers }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        localStorage.removeItem(`exam_${examId}_answers`);
        setShowSubmitModal(false);
        setSubmitResult(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting exam.');
      setShowSubmitModal(false);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-slate-700 p-8 rounded-3xl shadow-2xl text-center flex flex-col items-center gap-4 text-white">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-400/30 border-t-indigo-400 animate-spin" />
            <Sparkles size={24} className="absolute inset-0 m-auto text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Initializing Examination Engine...</h2>
            <p className="text-xs text-indigo-200 mt-1">Configuring randomized question set & timing criteria</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-5 border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Exam Unavailable</h2>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  
  const timePercent = timeLeft !== null && totalInitialTime > 0 ? Math.max(0, (timeLeft / totalInitialTime) * 100) : 100;
  const isTimeCritical = timeLeft !== null && timeLeft < 300; // less than 5 mins

  // Filtered Palette Questions
  const filteredPaletteIndices = questions.map((q, idx) => {
    const isAnswered = !!answers[q.id];
    const isReview = !!markedForReview[q.id];

    if (paletteFilter === 'answered' && !isAnswered) return null;
    if (paletteFilter === 'review' && !isReview) return null;
    if (paletteFilter === 'unanswered' && isAnswered) return null;
    return idx;
  }).filter((idx): idx is number => idx !== null);

  const fontSizeClass = {
    normal: 'text-base md:text-lg',
    large: 'text-lg md:text-xl',
    xlarge: 'text-xl md:text-2xl'
  }[fontSizeLevel];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* TOP PROGRESS BAR */}
      <div className="w-full bg-slate-200/80 h-1.5 fixed top-0 left-0 z-50 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* TAB SWITCH WARNING TOAST */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-500 animate-in fade-in slide-in-from-top duration-300 max-w-lg">
          <AlertTriangle className="text-amber-400 shrink-0" size={20} />
          <div className="text-xs">
            <span className="font-bold">Tab Switch Detected (Warning {tabSwitchCount}):</span> All focus and navigation activity is logged. Please stay on the test screen.
          </div>
          <button 
            onClick={() => setShowTabWarning(false)} 
            className="text-amber-300 hover:text-white p-1 ml-auto cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-0 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Course Info & Candidate Badge */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Zap size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                  {exam?.courseName || 'Online Exam'}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                  {exam?.semester}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                <span>Roll: <strong className="text-slate-800">#{exam?.studentId}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck size={13} /> Active Proctored Session
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right: Live Timer, Accessibility & Submit Button */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* Font Size Selector */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFontSizeLevel('normal')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${fontSizeLevel === 'normal' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Normal Font Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel('large')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${fontSizeLevel === 'large' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Large Font Size"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel('xlarge')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${fontSizeLevel === 'xlarge' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Extra Large Font Size"
              >
                A++
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Countdown Timer with Animated Pulse */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold font-mono text-sm sm:text-base shadow-inner transition-all ${
              isTimeCritical
                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse ring-2 ring-red-400/40'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <Clock size={18} className={isTimeCritical ? 'text-red-500' : 'text-indigo-600'} />
              <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
            </div>

            {/* Finish & Submit Button */}
            <button 
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span className="hidden sm:inline">Finish & </span>Submit
            </button>

          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT / SIDEBAR: QUESTION PALETTE & PROGRESS STATS (4 COLS) */}
        <aside className="lg:col-span-4 order-2 lg:order-1 space-y-4">
          
          {/* Progress Overview Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BarChart2 size={15} className="text-indigo-600" />
                Exam Progress
              </span>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="block font-black text-emerald-700 text-lg leading-tight">{answeredCount}</span>
                <span className="text-[10px] font-semibold text-emerald-600">Answered</span>
              </div>
              <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-2xl">
                <span className="block font-black text-purple-700 text-lg leading-tight">{reviewCount}</span>
                <span className="text-[10px] font-semibold text-purple-600">Marked</span>
              </div>
              <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-2xl">
                <span className="block font-black text-slate-700 text-lg leading-tight">{unansweredCount}</span>
                <span className="text-[10px] font-semibold text-slate-500">Pending</span>
              </div>
            </div>

            {/* Filter Tabs for Palette */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPaletteFilter('all')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${paletteFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setPaletteFilter('answered')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${paletteFilter === 'answered' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Ans ({answeredCount})
              </button>
              <button
                type="button"
                onClick={() => setPaletteFilter('review')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${paletteFilter === 'review' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Review ({reviewCount})
              </button>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[42vh] overflow-y-auto pr-1 py-1">
              {questions.map((q, idx) => {
                if (filteredPaletteIndices.indexOf(idx) === -1) return null;

                const isAnswered = !!answers[q.id];
                const isReview = !!markedForReview[q.id];
                const isActive = idx === currentQuestionIdx;

                let btnStyles = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                if (isAnswered && isReview) {
                  btnStyles = 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-300';
                } else if (isAnswered) {
                  btnStyles = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
                } else if (isReview) {
                  btnStyles = 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-200';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`
                      aspect-square rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center relative cursor-pointer border
                      ${btnStyles}
                      ${isActive ? 'ring-3 ring-indigo-600 ring-offset-2 scale-105 z-10' : 'hover:scale-102'}
                    `}
                    title={`Question ${idx + 1}`}
                  >
                    <span>{idx + 1}</span>
                    {isReview && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shrink-0" />
                <span>Current Question</span>
              </div>
            </div>

          </div>

          {/* Exam Rules & Marking Pill */}
          <div className="bg-indigo-50/70 rounded-3xl p-4 border border-indigo-100 text-xs space-y-2">
            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Marking Scheme:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-bold">
                +{semConfig.marksPerQ} Correct
              </span>
              {semConfig.negMarks > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-700 font-bold">
                  -{semConfig.negMarks} Penalty
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                  No Negative Marking
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold">
                Pass: {semConfig.passMarks}%
              </span>
            </div>
          </div>

        </aside>

        {/* RIGHT / MAIN QUESTION DISPLAY (8 COLS) */}
        <section className="lg:col-span-8 order-1 lg:order-2 flex flex-col">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 flex-1 flex flex-col overflow-hidden relative">
            
            {/* Question Header Banner */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {currentQuestionIdx + 1}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Question {currentQuestionIdx + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      +{semConfig.marksPerQ || (currentQ?.marks ? Number(currentQ.marks) : 1)} Marks
                    </span>
                    {semConfig.negMarks > 0 && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        -{semConfig.negMarks} Negative
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Mark for Review & Clear */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMarkForReview(currentQ?.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    markedForReview[currentQ?.id]
                      ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark size={14} className={markedForReview[currentQ?.id] ? 'fill-purple-600 text-purple-600' : ''} />
                  <span>{markedForReview[currentQ?.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>

                {answers[currentQ?.id] && (
                  <button
                    type="button"
                    onClick={() => handleClearResponse(currentQ?.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                    title="Clear selected option"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Body */}
            <div className="p-6 sm:p-8 flex-1 space-y-6">
              
              {/* Question Statement */}
              <div className="space-y-2">
                <p className={`${fontSizeClass} font-semibold text-slate-900 leading-relaxed tracking-tight`}>
                  {currentQ?.question}
                </p>
              </div>

              {/* Multiple Choice Options List */}
              <div className="space-y-3 pt-2">
                {(currentQ?.shuffledOptions || ['optA', 'optB', 'optC', 'optD']).map((optKey, index) => {
                  const letter = optKey.replace('opt', ''); // original letter for saving
                  const displayLetter = ['A', 'B', 'C', 'D'][index]; // display letter for UI
                  const optText = (currentQ as any)?.[optKey];
                  if (!optText) return null;

                  const isSelected = answers[currentQ?.id] === letter || answers[currentQ?.id] === optKey;

                  return (
                    <label
                      key={optKey}
                      onClick={() => handleSelectOption(currentQ.id, letter)}
                      className={`
                        flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 group relative
                        ${isSelected 
                          ? 'border-[#5b67f1] bg-indigo-50/60 shadow-md shadow-indigo-500/10 ring-1 ring-[#5b67f1]' 
                          : 'border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/70 bg-white'
                        }
                      `}
                    >
                      {/* Radio Indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-[#5b67f1]' : 'border-slate-300 group-hover:border-indigo-400'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#5b67f1] animate-in zoom-in-50 duration-100" />}
                      </div>

                      {/* Letter Badge */}
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-[#5b67f1] text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-800'
                      }`}>
                        {displayLetter}
                      </span>

                      {/* Option Text */}
                      <span className={`text-sm sm:text-base font-medium flex-1 ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {optText}
                      </span>

                      {/* Keyboard shortcut hint */}
                      <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase px-1.5 py-0.5 rounded border border-slate-200 bg-white">
                        Press {letter}
                      </span>
                    </label>
                  );
                })}
              </div>

            </div>

            {/* Bottom Footer Navigation Bar */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
              
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIdx === 0}
                className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 text-slate-700 border border-slate-300/80 bg-white cursor-pointer shadow-2xs"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>Tip: Use keys <kbd className="px-1.5 py-0.5 rounded bg-white border font-bold text-slate-600">A</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border font-bold text-slate-600">B</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border font-bold text-slate-600">C</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border font-bold text-slate-600">D</kbd></span>
              </div>

              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 sm:px-7 py-2.5 bg-[#5b67f1] hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <span>Save & Next</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 sm:px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Review & Submit</span>
                </button>
              )}

            </div>

          </div>
        </section>

      </main>

      {/* CONFIRM SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-md shadow-emerald-500/10">
              <CheckCircle2 size={34} />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Exam Submission</h3>
              <p className="text-xs text-slate-500 mt-1">Please review your examination summary before final submission.</p>
            </div>

            {/* Scorecard Summary Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="block text-2xl font-black text-slate-900">{questions.length}</span>
                <span className="text-[11px] font-semibold text-slate-500">Total Questions</span>
              </div>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <span className="block text-2xl font-black text-emerald-700">{answeredCount}</span>
                <span className="text-[11px] font-bold text-emerald-600">Answered</span>
              </div>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <span className="block text-2xl font-black text-amber-700">{unansweredCount}</span>
                <span className="text-[11px] font-bold text-amber-600">Unanswered</span>
              </div>
            </div>

            {reviewCount > 0 && (
              <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-2xl text-xs flex items-center gap-2.5 font-medium">
                <Bookmark size={16} className="text-purple-600 shrink-0" />
                <span>You have <strong>{reviewCount} question(s)</strong> marked for review. They will be submitted as answered.</span>
              </div>
            )}

            {unansweredCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <span><strong>{unansweredCount} question(s)</strong> are currently unattempted. Unattempted questions receive 0 marks.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              >
                Back to Questions
              </button>
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={executeSubmitExam}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Exam...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Yes, Submit Exam</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FINAL SCORECARD / SUBMITTED RESULT MODAL */}
      {submitResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-9 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border-4 border-white">
              <Award size={42} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
                Exam Completed
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                Exam Successfully Evaluated!
              </h3>
              <p className="text-xs text-slate-500 mt-1">Your answers have been processed by the examination engine.</p>
            </div>

            {/* Scorecard Hero Box with Center Watermark */}
            <div className="bg-slate-50 border border-indigo-100 rounded-3xl p-6 space-y-4 relative overflow-hidden">
              
              {/* Dynamic Center Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.05]">
                <div className="flex flex-col items-center justify-center text-center rotate-[-15deg] transform scale-110">
                  <div className="font-serif font-black tracking-wider uppercase text-2xl text-slate-900 leading-tight max-w-[340px]">
                    {exam?.centerName || 'AUTHORIZED STUDY CENTER'}
                  </div>
                  <div className="font-mono font-black tracking-[0.2em] text-[10px] text-slate-800 mt-1 uppercase">
                    CENTER CODE: {exam?.centerCode || 'CENTER-01'} • VERIFIED
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-4xl sm:text-5xl font-black text-indigo-700 font-mono tracking-tight">
                {submitResult.score} <span className="text-sm sm:text-base font-bold text-slate-500">Marks Obtained</span>
              </div>
              
              <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200/80 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Qs</span>
                  <span className="font-extrabold text-slate-900 text-sm">{submitResult.totalQuestions}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-emerald-600 block uppercase font-bold">Correct</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{submitResult.correctAnswers}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-rose-600 block uppercase font-bold">Wrong</span>
                  <span className="font-extrabold text-rose-600 text-sm">{submitResult.wrongAnswers}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={() => navigate('/student/dashboard')}
                className="w-full bg-[#5b67f1] hover:bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Back to Student Dashboard</span>
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentExamPortal;
