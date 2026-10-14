import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  X, 
  Loader2, 
  RefreshCw, 
  Sparkles, 
  User, 
  Award, 
  Clock, 
  FileText, 
  Printer, 
  XCircle, 
  Coins, 
  Lock as LockIcon, 
  Eye, 
  EyeOff,
  Send,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Zap,
  ShieldCheck,
  Pencil
} from 'lucide-react';
import axios from 'axios';
import { StudentMarksheetModal } from '../../components/StudentMarksheetModal';
import { StudentCertificateModal } from '../../components/StudentCertificateModal';

const formatImageSrc = (url: string | null) => {
  if (!url) return 'https://via.placeholder.com/150';
  if (url.startsWith('http://localhost:3000')) {
    return url.replace('http://localhost:3000', '');
  }
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

interface SemesterData {
  id: number | null;
  semester: string;
  subjects: string;
  written: number;
  viva: number;
  total: number;
  maxWritten: number;
  maxViva: number;
  maxTotal: number;
  percentage: number;
  examDate: string | null;
  status: string;
  reattempts: number;
  isMarksheetGenerated: boolean;
  isPublishedToStudent?: boolean;
  duesCleared?: boolean;
  holdReason?: string;
  isAttempted: boolean;
  isPassed: boolean;
  isFailed: boolean;
}

const ExamsList = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) {}
    return null;
  };

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Instant Certificate Permissions & Pricing
  const [allowInstantCertificate, setAllowInstantCertificate] = useState(true);
  const [instantCharge, setInstantCharge] = useState(200);

  // Certificate Confirmation Modal State
  const [certConfirmModalOpen, setCertConfirmModalOpen] = useState(false);
  const [selectedCertTarget, setSelectedCertTarget] = useState<{ student: any; isInstant: boolean } | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);

  // View / Print Certificate Modal State
  const [certViewModalOpen, setCertViewModalOpen] = useState(false);
  const [viewingCertStudent, setViewingCertStudent] = useState<any | null>(null);

  // Secondary Confirmation Modal State (Re-Exam)
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedResetTarget, setSelectedResetTarget] = useState<{ student: any; semester: SemesterData } | null>(null);
  const [confirmingSecondary, setConfirmingSecondary] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Marksheet Generation Warning Modal State (with secondary dues clearance & custom hold reason)
  const [generateWarningModalOpen, setGenerateWarningModalOpen] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<{ student: any; semester: SemesterData } | null>(null);
  const [confirmMarksheetLock, setConfirmMarksheetLock] = useState(false);
  const [confirmDuesCleared, setConfirmDuesCleared] = useState(false);
  const [publishDirectlyToStudent, setPublishDirectlyToStudent] = useState(true);
  const [isGeneratingMarksheet, setIsGeneratingMarksheet] = useState(false);

  // Marksheet Publish / Send to Student Portal Toggle Modal State
  const [publishToggleModalOpen, setPublishToggleModalOpen] = useState(false);
  const [publishToggleTarget, setPublishToggleTarget] = useState<{ student: any; semester: SemesterData; action: 'publish' | 'hide' } | null>(null);
  const [confirmDuesClearedToggle, setConfirmDuesClearedToggle] = useState(false);
  const [confirmPublishAction, setConfirmPublishAction] = useState(false);
  const [customHoldReason, setCustomHoldReason] = useState('Course Fee / Exam Dues Pending');
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Inline Hold Reason Editing State
  const [editingHoldReasonKey, setEditingHoldReasonKey] = useState<string | null>(null);
  const [inlineHoldReasonText, setInlineHoldReasonText] = useState<string>('');
  const [isSavingHoldReason, setIsSavingHoldReason] = useState(false);

  // Viva Marks Modal State
  const [vivaModalOpen, setVivaModalOpen] = useState(false);
  const [vivaTarget, setVivaTarget] = useState<{ student: any; semester: SemesterData } | null>(null);
  const [vivaMarksInput, setVivaMarksInput] = useState<string>('0');
  const [isSavingViva, setIsSavingViva] = useState(false);

  // Full Official Marksheet Modal
  const [fullMarksheetModalOpen, setFullMarksheetModalOpen] = useState(false);
  const [selectedMarksheetStudent, setSelectedMarksheetStudent] = useState<any | null>(null);

  const fetchExams = async () => {
    const centerId = getCenterId();
    try {
      setLoading(true);
      const [res, walletRes, chargeRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/center/${centerId || 'all'}/setted-exams`),
        axios.get(`http://localhost:3000/api/center/${centerId || 1}/wallet`).catch(() => ({ data: { data: { wallet_balance: 0 } } })),
        axios.get(`http://localhost:3000/api/center/settings/certificate-charge?centerId=${centerId || 1}`).catch(() => ({ data: { charge: 200, allow_instant_certificate: true } }))
      ]);

      if (res.data.success) {
        setStudents(res.data.exams || []);
      }
      if (walletRes?.data?.data?.wallet_balance !== undefined) {
        setWalletBalance(Number(walletRes.data.data.wallet_balance) || 0);
      }
      if (chargeRes?.data?.charge !== undefined) {
        setInstantCharge(Number(chargeRes.data.charge) || 200);
      }
      if (chargeRes?.data?.allow_instant_certificate !== undefined) {
        setAllowInstantCertificate(Boolean(chargeRes.data.allow_instant_certificate));
      }
    } catch (error) {
      console.error('Failed to load setted exams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Helper to parse all semesters for a student
  const getStudentSemesters = (student: any): SemesterData[] => {
    let rawSem = student.courseSemesters;
    if (typeof rawSem === 'string') {
      try { rawSem = JSON.parse(rawSem); } catch (_) {}
    }

    const marksList: any[] = student.marks || [];
    const resultSemesters: SemesterData[] = [];
    const processedMarkIds = new Set<number>();

    if (Array.isArray(rawSem) && rawSem.length > 0) {
      rawSem.forEach((s: any, idx: number) => {
        const semNum = String(s.num ?? (idx + 1)).trim();
        const semName = s.name || `SEM ${semNum}`;

        // Find mark matching this semester
        const matchedMark = marksList.find(m => {
          const mSem = String(m.semester || '').toUpperCase().trim();
          const mMatch = mSem.match(/\d+/);
          const mNum = mMatch ? mMatch[0] : '';
          return mSem === semName.toUpperCase().trim() ||
                 mSem === `SEM ${semNum}`.toUpperCase() ||
                 mSem === `SEMESTER ${semNum}`.toUpperCase() ||
                 mNum === semNum;
        });

        if (matchedMark && matchedMark.id) {
          processedMarkIds.add(matchedMark.id);
        }

        const maxWritten = Number(s.marks) || 80;
        const maxViva = Number(s.oral) || 20;
        const maxTotal = maxWritten + maxViva;

        const rawWritten = Number(matchedMark?.written_marks || 0);
        const rawViva = Number(matchedMark?.viva_marks || 0);
        const written = Math.min(maxWritten, rawWritten);
        const viva = Math.min(maxViva, rawViva);
        const total = Math.min(maxTotal, written + viva);
        const percentage = maxTotal > 0 ? Math.min(100, Math.round((total / maxTotal) * 100)) : 0;

        const status = matchedMark?.status || 'scheduled';
        const isAttempted = status === 'completed' || (status !== 'scheduled' && (written > 0 || viva > 0));
        const isPassed = isAttempted && percentage >= 40;
        const isFailed = isAttempted && percentage < 40;

        resultSemesters.push({
          id: matchedMark ? matchedMark.id : null,
          semester: semName.toUpperCase(),
          subjects: s.subjects || 'Core Theory & Practical Modules',
          written,
          viva,
          total,
          maxWritten,
          maxViva,
          maxTotal,
          percentage,
          examDate: matchedMark?.exam_date || null,
          status,
          reattempts: Number(matchedMark?.reattempts || 0),
          isMarksheetGenerated: Number(matchedMark?.is_marksheet_generated) === 1,
          isPublishedToStudent: matchedMark?.is_published_to_student !== undefined ? Number(matchedMark.is_published_to_student) === 1 : true,
          duesCleared: matchedMark?.dues_cleared !== undefined ? Number(matchedMark.dues_cleared) === 1 : true,
          holdReason: matchedMark?.hold_reason || '',
          isAttempted,
          isPassed,
          isFailed
        });
      });
    }

    // Append any marks that were not in courseSemesters
    marksList.forEach((m: any, idx: number) => {
      if (!processedMarkIds.has(m.id)) {
        const maxWritten = 80;
        const maxViva = 20;
        const maxTotal = 100;
        const written = Math.min(maxWritten, Number(m.written_marks || 0));
        const viva = Math.min(maxViva, Number(m.viva_marks || 0));
        const total = Math.min(maxTotal, written + viva);
        const percentage = Math.min(100, Math.round((total / maxTotal) * 100));
        const status = m.status || 'scheduled';
        const isAttempted = status === 'completed' || (status !== 'scheduled' && (written > 0 || viva > 0));

        resultSemesters.push({
          id: m.id,
          semester: (m.semester || `SEM ${idx + 1}`).toUpperCase(),
          subjects: 'Theory & Practical Evaluation',
          written,
          viva,
          total,
          maxWritten,
          maxViva,
          maxTotal,
          percentage,
          examDate: m.exam_date || null,
          status,
          reattempts: Number(m.reattempts || 0),
          isMarksheetGenerated: Number(m.is_marksheet_generated) === 1,
          isPublishedToStudent: m?.is_published_to_student !== undefined ? Number(m.is_published_to_student) === 1 : true,
          duesCleared: m?.dues_cleared !== undefined ? Number(m.dues_cleared) === 1 : true,
          holdReason: m?.hold_reason || '',
          isAttempted,
          isPassed: isAttempted && percentage >= 40,
          isFailed: isAttempted && percentage < 40
        });
      }
    });

    if (resultSemesters.length === 0) {
      resultSemesters.push({
        id: null,
        semester: 'SEM 1',
        subjects: 'General Theory & Practical Modules',
        written: 0,
        viva: 0,
        total: 0,
        maxWritten: 80,
        maxViva: 20,
        maxTotal: 100,
        percentage: 0,
        examDate: null,
        status: 'scheduled',
        reattempts: 0,
        isMarksheetGenerated: false,
        isAttempted: false,
        isPassed: false,
        isFailed: false
      });
    }

    return resultSemesters;
  };

  // Re-Exam Reset Modal
  const openResetConfirmation = (student: any, semester: SemesterData) => {
    if (semester.isMarksheetGenerated) {
      setToastMessage({
        type: 'error',
        text: 'Exam is locked because the official marksheet has already been generated. Re-exam reset is disabled.'
      });
      return;
    }

    setSelectedResetTarget({ student, semester });
    setConfirmingSecondary(false);
    setResetModalOpen(true);
  };

  const handleExecuteReset = async () => {
    if (!selectedResetTarget) return;
    const { student, semester } = selectedResetTarget;

    const centerId = getCenterId();
    try {
      setIsResetting(true);
      const res = await axios.post(`http://localhost:3000/api/center/student-marks/${semester.id || 0}/reset`, {
        studentId: student.studentId,
        semester: semester.semester,
        centerId: centerId
      });
      if (res.data.success) {
        const chargedMsg = res.data.data?.charged > 0 ? ' (100 tokens deducted from wallet)' : ' (Free reset applied)';
        setToastMessage({
          type: 'success',
          text: `Exam for ${student.firstName} ${student.lastName || ''} (${semester.semester}) has been reset for Re-Exam!${chargedMsg}`
        });
        setResetModalOpen(false);
        setSelectedResetTarget(null);
        fetchExams();
      }
    } catch (error: any) {
      console.error('Reset failed', error);
      setToastMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reset exam. Please try again.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Marksheet Generation Warning Flow (with secondary dues clearance)
  const openGenerateWarning = (student: any, semester: SemesterData) => {
    setGenerateTarget({ student, semester });
    setConfirmMarksheetLock(false);
    setConfirmDuesCleared(false);
    setPublishDirectlyToStudent(true);
    setCustomHoldReason('Course Fee / Exam Dues Pending');
    setGenerateWarningModalOpen(true);
  };

  const handleExecuteGenerateMarksheet = async () => {
    if (!generateTarget) return;
    const { student, semester } = generateTarget;

    try {
      setIsGeneratingMarksheet(true);
      const res = await axios.post(`http://localhost:3000/api/center/student-marks/${semester.id || 0}/generate-marksheet`, {
        studentId: student.studentId,
        semester: semester.semester,
        publishToStudent: publishDirectlyToStudent,
        duesCleared: confirmDuesCleared,
        holdReason: !publishDirectlyToStudent ? customHoldReason : ''
      });
      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: publishDirectlyToStudent 
            ? `Official Marksheet generated & published for ${student.firstName} ${student.lastName || ''} (${semester.semester})! Visible in the Student Portal.`
            : `Official Marksheet generated for ${student.firstName} ${student.lastName || ''} (${semester.semester}). Held internally: "${customHoldReason}"`
        });
        setGenerateWarningModalOpen(false);
        setGenerateTarget(null);
        fetchExams();
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate marksheet.'
      });
    } finally {
      setIsGeneratingMarksheet(false);
    }
  };

  // Marksheet Publish / Send to Student Portal Toggle
  const openPublishToggleModal = (student: any, semester: SemesterData, action: 'publish' | 'hide') => {
    setPublishToggleTarget({ student, semester, action });
    setConfirmDuesClearedToggle(false);
    setConfirmPublishAction(false);
    setCustomHoldReason(semester.holdReason || 'Course Fee / Exam Dues Pending');
    setPublishToggleModalOpen(true);
  };

  const handleExecuteTogglePublish = async () => {
    if (!publishToggleTarget) return;
    const { student, semester, action } = publishToggleTarget;
    const isPub = action === 'publish';

    try {
      setIsTogglingPublish(true);
      const res = await axios.put(`http://localhost:3000/api/center/student-marks/${semester.id || 0}/publish-toggle`, {
        isPublished: isPub,
        duesCleared: isPub ? confirmDuesClearedToggle : false,
        holdReason: isPub ? '' : (customHoldReason || 'Course Fee / Exam Dues Pending'),
        studentId: student.studentId,
        semester: semester.semester
      });
      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: isPub
            ? `Marksheet for ${student.firstName} ${student.lastName || ''} (${semester.semester}) published & sent to Student Portal!`
            : `Marksheet for ${student.firstName} ${student.lastName || ''} (${semester.semester}) hidden from Student Portal. Reason: "${customHoldReason}"`
        });
        setPublishToggleModalOpen(false);
        setPublishToggleTarget(null);
        fetchExams();
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update marksheet publication status.'
      });
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const handleQuickSaveHoldReason = async (student: any, semester: SemesterData, reasonToSave: string) => {
    try {
      setIsSavingHoldReason(true);
      const res = await axios.put(`http://localhost:3000/api/center/student-marks/${semester.id || 0}/publish-toggle`, {
        isPublished: false,
        duesCleared: false,
        holdReason: reasonToSave || 'Course Fee / Exam Dues Pending',
        studentId: student.studentId,
        semester: semester.semester
      });
      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: `Hold reason saved for ${student.firstName} ${student.lastName || ''} (${semester.semester})!`
        });
        setEditingHoldReasonKey(null);
        fetchExams();
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update hold reason.'
      });
    } finally {
      setIsSavingHoldReason(false);
    }
  };

  // Viva Marks Handling
  const openVivaModal = (student: any, semester: SemesterData) => {
    setVivaTarget({ student, semester });
    setVivaMarksInput(String(semester.viva || 0));
    setVivaModalOpen(true);
  };

  const handleSaveViva = async () => {
    if (!vivaTarget) return;
    const { student, semester } = vivaTarget;

    try {
      setIsSavingViva(true);
      const res = await axios.put(`http://localhost:3000/api/center/student-marks/${semester.id || 0}/viva`, {
        vivaMarks: Number(vivaMarksInput) || 0,
        studentId: student.studentId,
        semester: semester.semester
      });
      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: `Viva marks updated to ${vivaMarksInput} for ${student.firstName} ${student.lastName || ''} (${semester.semester})!`
        });
        setVivaModalOpen(false);
        setVivaTarget(null);
        fetchExams();
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update viva marks.'
      });
    } finally {
      setIsSavingViva(false);
    }
  };

  // Open Full Marksheet Modal
  const openFullMarksheet = (student: any) => {
    setSelectedMarksheetStudent({
      ...student,
      id: student.studentId
    });
    setFullMarksheetModalOpen(true);
  };

  // Certificate Actions
  const openCertConfirmation = (student: any, isInstant: boolean) => {
    setSelectedCertTarget({ student, isInstant });
    setCertConfirmModalOpen(true);
  };

  const handleGenerateCertificate = async () => {
    if (!selectedCertTarget) return;
    const { student, isInstant } = selectedCertTarget;
    const centerId = getCenterId() || 1;

    try {
      setIsGeneratingCert(true);
      const endpoint = isInstant
        ? `http://localhost:3000/api/center/students/${student.studentId || student.id}/instant-certificate`
        : `http://localhost:3000/api/center/students/${student.studentId || student.id}/generate-certificate`;

      const res = await axios.post(endpoint, {
        centerId: centerId
      });

      if (res.data.success) {
        setToastMessage({
          type: 'success',
          text: isInstant
            ? `Instant certificate issued successfully! ₹${res.data.data?.charged || instantCharge} debited from wallet.`
            : `Official certificate generated successfully! ₹${res.data.data?.charged || instantCharge} debited from wallet.`
        });
        window.dispatchEvent(new Event('center-stats-updated'));
        setCertConfirmModalOpen(false);
        fetchExams();
      } else {
        setToastMessage({
          type: 'error',
          text: res.data.message || 'Failed to generate certificate.'
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error occurred while generating certificate.'
      });
    } finally {
      setIsGeneratingCert(false);
    }
  };

  const openCertView = (student: any) => {
    setViewingCertStudent({
      ...student,
      id: student.studentId || student.id
    });
    setCertViewModalOpen(true);
  };

  // Filtered Students
  const filteredStudents = students.filter(st => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const fullName = `${st.firstName} ${st.lastName || ''}`.toLowerCase();
    const studentId = String(st.studentId);
    const course = (st.courseName || '').toLowerCase();
    const enr = (st.enrollment_no || '').toLowerCase();
    const roll = (st.roll_no || '').toLowerCase();
    const father = (st.father_name || '').toLowerCase();
    return fullName.includes(q) || studentId.includes(q) || course.includes(q) || enr.includes(q) || roll.includes(q) || father.includes(q);
  });

  const totalPages = Math.ceil(filteredStudents.length / entriesPerPage) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Toast feedback */}
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-semibold shadow-sm transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-red-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-t-xl border border-gray-200 gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Setted Exams & Re-Exam Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluate written test and viva marks against total criteria, generate marksheet (locks exam), and grant re-exam access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Coins size={14} className="text-amber-500" />
            <span>Wallet: ₹{walletBalance}</span>
          </div>
          <button 
            onClick={fetchExams}
            className="bg-indigo-50 hover:bg-indigo-100 text-[#6b6eed] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Table Controls */}
      <div className="bg-white p-4 border-x border-gray-200 mt-0 flex flex-col sm:flex-row justify-between items-center text-sm gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <span>Show</span>
          <select 
            value={entriesPerPage} 
            onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#6b6eed] bg-white text-xs font-semibold cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Student, Enrollment, Course..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed]" 
          />
        </div>
      </div>

      {/* Exams List Table */}
      <div className="bg-white rounded-b-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#6b6eed] text-white">
            <tr>
              <th className="py-3.5 px-4 font-semibold border-r border-indigo-400/50 w-12 text-center">Sr</th>
              <th className="py-3.5 px-4 font-semibold border-r border-indigo-400/50 w-60 text-center">Student Details</th>
              <th className="py-3.5 px-4 font-semibold border-r border-indigo-400/50">Course & Semesters Examination Modules</th>
              <th className="py-3.5 px-4 font-semibold text-center w-64">Semester Status & Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 size={20} className="animate-spin text-[#6b6eed]" />
                    <span>Loading exam records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">
                  No student exam records found.
                </td>
              </tr>
            ) : paginatedStudents.map((st, index) => {
              const semesters = getStudentSemesters(st);
              const anyMarksheetGenerated = semesters.some(s => s.isMarksheetGenerated);

              return (
                <tr key={st.studentId} className="hover:bg-slate-50/70 transition-colors">
                  {/* Column 1: Sr */}
                  <td className="py-5 px-3 font-bold text-gray-900 border-r border-gray-200 text-center align-middle">
                    {(currentPage - 1) * entriesPerPage + index + 1}
                  </td>
                  
                  {/* Column 2: Student Details */}
                  <td className="py-5 px-4 text-center border-r border-gray-200 align-middle">
                    <div className="font-bold text-indigo-700 font-mono text-xs mb-1.5">
                      {st.enrollment_no || `EXAM-ID: #${st.studentId}`}
                    </div>
                    <div className="w-16 h-16 mx-auto mb-2 rounded-xl border border-gray-200 overflow-hidden shadow-xs bg-gray-100 flex items-center justify-center">
                      <img src={formatImageSrc(st.photo_url)} alt={st.firstName} className="w-full h-full object-cover" />
                    </div>
                    <div className="font-extrabold text-gray-900 uppercase text-xs leading-tight">
                      {st.firstName} {st.lastName}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 uppercase font-medium">
                      FATHER: {st.father_name || 'N/A'}
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-gray-400">
                      ROLL: {st.roll_no || `ROL-${10000 + st.studentId}`}
                    </div>

                    {/* Marksheet & Certificate Actions */}
                    <div className="mt-3 space-y-1.5">
                      <button
                        onClick={() => openFullMarksheet(st)}
                        className="w-full px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="View Full Official Statement of Marks with Center Watermark"
                      >
                        <Eye size={12} />
                        <span>Full Marksheet</span>
                      </button>

                      {st.is_certified == 1 || st.certificate_number ? (
                        <button
                          onClick={() => openCertView(st)}
                          className="w-full px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="View Official Certificate"
                        >
                          <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                          <span>View Certificate</span>
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            onClick={() => openCertConfirmation(st, false)}
                            className="w-full px-2 py-1.5 bg-white hover:bg-slate-100 text-gray-700 border border-gray-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Generate Regular Certificate after exams are completed"
                          >
                            <Award size={12} className="text-indigo-600 shrink-0" />
                            <span>Certificate</span>
                          </button>

                          {(st.allow_instant_certificate !== undefined ? Boolean(st.allow_instant_certificate) : allowInstantCertificate) && (
                            <div className="bg-amber-50/90 border border-amber-300/90 rounded-xl p-2.5 text-left space-y-1.5 shadow-2xs animate-in fade-in">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-[11px] text-amber-950 flex items-center gap-1 leading-tight">
                                  <Zap size={12} className="text-amber-600 fill-amber-600 shrink-0" />
                                  <span>Instant Certificate Option</span>
                                </span>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-950 font-mono shrink-0">
                                  ₹{st.instant_certificate_charge || instantCharge}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-amber-900/90 leading-tight">
                                Need to issue certificate before all semesters are completed?
                              </p>
                              <button
                                onClick={() => openCertConfirmation(st, true)}
                                className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title={`Issue Instant Certificate (₹${st.instant_certificate_charge || instantCharge} Wallet Fee)`}
                              >
                                <Zap size={11} className="fill-white shrink-0" />
                                <span>Issue Instant Certificate</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Column 3: Course & Semesters Breakdown */}
                  <td className="py-5 px-4 border-r border-gray-200 align-top">
                    <div className="space-y-3">
                      {/* Course Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2.5 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-indigo-600 shrink-0" />
                          <span className="font-extrabold text-gray-900 text-xs sm:text-sm uppercase tracking-tight">
                            {st.courseName || 'Enrolled Course'}
                          </span>
                          {st.courseCode && (
                            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700 shadow-2xs">
                              {st.courseCode}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md uppercase">
                          {st.duration || st.courseDuration || '6 Months'}
                        </span>
                      </div>

                      {/* All Semesters List for this Student */}
                      <div className="space-y-2.5">
                        {semesters.map((sem, sIdx) => (
                          <div key={sIdx} className="bg-slate-50 border border-gray-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-xs font-black rounded uppercase shadow-2xs">
                                  {sem.semester}
                                </span>
                                <span className="text-[11px] text-gray-600 font-medium line-clamp-1">
                                  {sem.subjects}
                                </span>
                              </div>
                              {sem.reattempts > 0 && (
                                <div className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-0.5 rounded border ${
                                  sem.reattempts < 2 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : sem.reattempts === 2
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}>
                                  <Sparkles size={11} className={sem.reattempts > 2 ? 'text-amber-600' : 'text-purple-600'} />
                                  <span>
                                    Re-Exam: Reset {sem.reattempts} time(s) {sem.reattempts < 2 ? `(${2 - sem.reattempts} free left)` : sem.reattempts === 2 ? '(2 free used)' : '(100 tokens / reset)'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Detailed Marks Breakdown: Out of Written, Out of Viva, Out of Total, Percentage */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="bg-white p-2 rounded-lg border border-gray-200 text-center shadow-2xs">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Written Marks</span>
                                <span className="font-mono text-indigo-700 font-extrabold text-sm">
                                  {sem.written} <span className="text-gray-400 text-xs font-normal">/ {sem.maxWritten}</span>
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-gray-200 text-center shadow-2xs">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Viva Marks</span>
                                <span className="font-mono text-purple-700 font-extrabold text-sm">
                                  {sem.viva} <span className="text-gray-400 text-xs font-normal">/ {sem.maxViva}</span>
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-gray-200 text-center shadow-2xs">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Total Marks</span>
                                <span className="font-mono text-gray-900 font-black text-sm">
                                  {sem.total} <span className="text-gray-400 text-xs font-normal">/ {sem.maxTotal}</span>
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-gray-200 text-center shadow-2xs">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Percentage</span>
                                <span className={`font-mono font-black text-sm ${sem.isPassed ? 'text-emerald-700' : sem.isFailed ? 'text-red-600' : 'text-slate-800'}`}>
                                  {sem.percentage}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                              <div className="flex items-center gap-1 font-medium">
                                <Clock size={12} className="text-gray-400" />
                                <span>Exam Date: {sem.examDate ? new Date(sem.examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Scheduled'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Column 4: Semester Status & Actions */}
                  <td className="py-5 px-4 text-center align-top">
                    <div className="space-y-3">
                      {semesters.map((sem, sIdx) => (
                        <div key={sIdx} className="bg-slate-50 border border-gray-200 rounded-xl p-3 space-y-2 text-center shadow-2xs">
                          {/* Semester Tag & Pass / Fail Status Badge */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono">
                              {sem.semester}:
                            </span>
                            <div>
                              {sem.isPassed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300">
                                  <CheckCircle2 size={11} /> Result: PASSED ({sem.percentage}%)
                                </span>
                              ) : sem.isFailed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full border border-red-300">
                                  <XCircle size={11} /> Result: FAILED ({sem.percentage}%)
                                </span>
                              ) : sem.status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-300">
                                  <Clock size={11} /> In Progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full border border-blue-300">
                                  <Clock size={11} /> Scheduled / Ready
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action 1: Enter / Edit Viva Marks (Disabled if Marksheet is Generated) */}
                          <button 
                            onClick={() => openVivaModal(st, sem)}
                            disabled={sem.isMarksheetGenerated}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all ${
                              sem.isMarksheetGenerated 
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                                : 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 hover:border-purple-600 cursor-pointer'
                            }`}
                            title={sem.isMarksheetGenerated ? 'Marksheet already generated. Viva marks are locked.' : 'Click to enter or update Viva marks'}
                          >
                            <Award size={13} />
                            <span>{sem.viva > 0 ? `Viva Marks (${sem.viva})` : 'Enter Viva Marks'}</span>
                          </button>

                          {/* Action 2: Generate Marksheet (Locks Exam) OR View Marksheet */}
                          {sem.isMarksheetGenerated ? (
                            <div className="space-y-1.5">
                              <button 
                                onClick={() => openFullMarksheet(st)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                title="View / Print generated marksheet"
                              >
                                <Eye size={13} />
                                <span>View / Print Marksheet</span>
                              </button>

                              {/* Student Portal Publication & Dues Clearance Status */}
                              <div className={`p-2.5 rounded-xl border text-left transition-all ${
                                sem.isPublishedToStudent !== false 
                                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 space-y-1' 
                                  : 'bg-amber-50/95 border-amber-300 text-amber-950 space-y-2'
                              }`}>
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {sem.isPublishedToStudent !== false ? (
                                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                    ) : (
                                      <LockIcon size={13} className="text-amber-700 shrink-0" />
                                    )}
                                    <span className="text-[10px] font-bold truncate">
                                      {sem.isPublishedToStudent !== false ? 'Visible in Student Portal' : 'Hidden (Dues / Hold)'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 shrink-0">
                                    {sem.isPublishedToStudent === false && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const key = `${st.studentId}-${sem.semester}`;
                                          if (editingHoldReasonKey === key) {
                                            setEditingHoldReasonKey(null);
                                          } else {
                                            setEditingHoldReasonKey(key);
                                            setInlineHoldReasonText(sem.holdReason || 'Course Fee / Exam Dues Pending');
                                          }
                                        }}
                                        className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                        title="Edit or write custom reason for hold"
                                      >
                                        <Pencil size={10} />
                                        <span>{editingHoldReasonKey === `${st.studentId}-${sem.semester}` ? 'Cancel' : 'Edit Reason'}</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => openPublishToggleModal(st, sem, sem.isPublishedToStudent !== false ? 'hide' : 'publish')}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border transition-all cursor-pointer ${
                                        sem.isPublishedToStudent !== false
                                          ? 'bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 shadow-2xs'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                                      }`}
                                      title={sem.isPublishedToStudent !== false ? 'Hide marksheet from student portal due to pending dues' : 'Verify dues clearance & send marksheet to student portal'}
                                    >
                                      {sem.isPublishedToStudent !== false ? 'Hide' : 'Send to Portal'}
                                    </button>
                                  </div>
                                </div>

                                {sem.isPublishedToStudent !== false ? (
                                  <p className="text-[9.5px] pl-4 leading-tight text-gray-500 font-medium">
                                    ✓ Marksheet sent & visible on student dashboard
                                  </p>
                                ) : (
                                  <div className="space-y-1.5 pt-0.5">
                                    {editingHoldReasonKey === `${st.studentId}-${sem.semester}` ? (
                                      <div className="space-y-1.5 bg-white p-2 rounded-lg border border-amber-300 shadow-2xs animate-in fade-in">
                                        <label className="text-[9.5px] font-bold text-amber-950 flex items-center justify-between">
                                          <span>Custom Hold Reason (Visible to Student):</span>
                                        </label>
                                        <div className="flex gap-1.5">
                                          <input
                                            type="text"
                                            value={inlineHoldReasonText}
                                            onChange={(e) => setInlineHoldReasonText(e.target.value)}
                                            placeholder="e.g. ₹1,500 dues pending, lab clearance..."
                                            className="w-full px-2 py-1 bg-amber-50/40 border border-amber-300 rounded text-[10.5px] text-gray-800 placeholder-gray-400 outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleQuickSaveHoldReason(st, sem, inlineHoldReasonText);
                                              }
                                            }}
                                          />
                                          <button
                                            type="button"
                                            disabled={isSavingHoldReason}
                                            onClick={() => handleQuickSaveHoldReason(st, sem, inlineHoldReasonText)}
                                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                          >
                                            {isSavingHoldReason ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                            <span>Save</span>
                                          </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1 pt-0.5">
                                          {[
                                            'Course Fee Dues Pending',
                                            'Fee Balance Pending (₹1,500)',
                                            'Practical / Lab Dues',
                                            'Document Pending'
                                          ].map((preset) => (
                                            <button
                                              key={preset}
                                              type="button"
                                              onClick={() => setInlineHoldReasonText(preset)}
                                              className="text-[8.5px] px-1.5 py-0.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer transition-colors"
                                            >
                                              + {preset}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[9.5px] pl-1 leading-tight flex items-start justify-between gap-1">
                                        <span className="text-amber-900 font-semibold break-words block">
                                          ⚠️ <span className="font-extrabold text-amber-950">Hold Reason:</span> {sem.holdReason || 'Marksheet held pending dues clearance'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingHoldReasonKey(`${st.studentId}-${sem.semester}`);
                                            setInlineHoldReasonText(sem.holdReason || 'Course Fee / Exam Dues Pending');
                                          }}
                                          className="text-[9px] text-amber-800 hover:text-amber-950 underline font-bold cursor-pointer shrink-0 ml-1"
                                          title="Click to write or edit custom hold reason"
                                        >
                                          Edit Reason
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => openGenerateWarning(st, sem)}
                              className="w-full bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                              title="Generate official marksheet and lock exam"
                            >
                              <FileText size={13} />
                              <span>Generate Marksheet</span>
                            </button>
                          )}

                          {/* Action 3: Re-Exam Reset Button (DISABLED if Marksheet is Generated) */}
                          {sem.isMarksheetGenerated ? (
                            <button 
                              disabled
                              className="w-full bg-gray-100 text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                              title="Marksheet has been generated. Re-exam reset is disabled and locked."
                            >
                              <LockIcon size={13} />
                              <span>Exam Locked (Marksheet Generated)</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => openResetConfirmation(st, sem)}
                              className={`w-full border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                                (sem.reattempts || 0) >= 2
                                  ? 'bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border-amber-300 hover:border-amber-600'
                                  : 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border-red-200 hover:border-red-600'
                              }`}
                              title={(sem.reattempts || 0) >= 2 ? `Reset for Re-Exam (100 Tokens fee applies - ${sem.reattempts} resets done)` : `Reset for Re-Exam (Free - ${sem.reattempts}/2 free used)`}
                            >
                              <RotateCcw size={13} />
                              <span>{(sem.reattempts || 0) >= 2 ? 'Reset Re-Exam (100 Tokens)' : `Reset for Re-Exam (Free ${sem.reattempts}/2)`}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Table Footer */}
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 border-t border-gray-200 gap-4">
          <div className="text-xs">
            Showing {filteredStudents.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredStudents.length)} of {filteredStudents.length} entries
          </div>
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden shadow-xs">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3.5 py-1.5 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3.5 py-1.5 text-xs font-bold bg-[#6b6eed] text-white border-x border-gray-200">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3.5 py-1.5 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MARKSHEET GENERATION WARNING & LOCK MODAL */}
      {/* ======================================================== */}
      {generateWarningModalOpen && generateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative space-y-4 max-h-[92vh] overflow-y-auto">
            
            <button 
              onClick={() => setGenerateWarningModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border-2 border-amber-200">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">Generate & Finalize Marksheet</h3>
                <p className="text-xs text-gray-500">Official marksheet generation with dues verification</p>
              </div>
            </div>

            {/* Target Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-indigo-600" />
                  <span className="font-bold text-gray-900 text-sm">{generateTarget.student.firstName} {generateTarget.student.lastName}</span>
                  <span className="text-xs text-gray-500 font-mono">({generateTarget.student.enrollment_no || `ID #${generateTarget.student.studentId}`})</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded uppercase">
                  {generateTarget.semester.semester}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-white p-2 border border-slate-200 rounded">
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Written</span>
                  <span className="font-mono font-bold text-indigo-700">{generateTarget.semester.written}/{generateTarget.semester.maxWritten}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded">
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Viva</span>
                  <span className="font-mono font-bold text-purple-700">{generateTarget.semester.viva}/{generateTarget.semester.maxViva}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded">
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Total Score</span>
                  <span className="font-mono font-bold text-slate-900">{generateTarget.semester.total}/{generateTarget.semester.maxTotal}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded">
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">Result</span>
                  <span className={`font-mono font-bold ${generateTarget.semester.isPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                    {generateTarget.semester.isPassed ? 'PASS' : 'FAIL'} ({generateTarget.semester.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <LockIcon size={14} /> Permanent Exam Lock Warning:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 pl-1 leading-relaxed">
                <li>Generating marksheet will <strong>permanently lock</strong> examination marks and disable re-exam resets.</li>
                <li>Ensure all practical & viva marks are completely evaluated before continuing.</li>
              </ul>
            </div>

            {/* Secondary Confirmation 1: Dues Clearance */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={confirmDuesCleared}
                onChange={(e) => setConfirmDuesCleared(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-800 font-medium select-none">
                <strong className="text-emerald-900 block font-bold">Secondary Confirmation (Dues Clearance):</strong>
                I confirm that all course fees and center dues for <strong className="text-gray-900">{generateTarget.student.firstName} {generateTarget.student.lastName}</strong> are <strong>100% completed & cleared</strong> (No pending dues).
              </span>
            </label>

            {/* Option: Send to Student Portal Immediately */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={publishDirectlyToStudent}
                onChange={(e) => setPublishDirectlyToStudent(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-800 font-medium select-none">
                <strong className="text-indigo-900 block font-bold">Send to Student Portal Immediately:</strong>
                Make this marksheet visible and downloadable on the student's dashboard portal.
              </span>
            </label>

            {/* Custom Hold Reason Input when not published immediately */}
            {!publishDirectlyToStudent && (
              <div className="space-y-2 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 animate-in fade-in">
                <label className="block text-xs font-bold text-amber-950">
                  Custom Reason for Holding Marksheet (Visible to Student):
                </label>
                <input
                  type="text"
                  value={customHoldReason}
                  onChange={(e) => setCustomHoldReason(e.target.value)}
                  placeholder="e.g. Semester 2 Tuition Fee Pending (₹1,500)"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs outline-none focus:border-amber-500 bg-white text-gray-900 shadow-2xs"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Course Fee Dues Pending',
                    'Tuition Fee Balance Pending (₹1,500)',
                    'Practical & Viva Clearance Pending',
                    'ID & Document Verification Pending'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomHoldReason(preset)}
                      className="text-[10px] px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 rounded-md font-medium text-amber-900 cursor-pointer transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Confirmation 2: Final Exam Lock */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={confirmMarksheetLock}
                onChange={(e) => setConfirmMarksheetLock(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-800 font-medium select-none">
                I understand that generating the marksheet will finalize evaluation and permanently lock this exam.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setGenerateWarningModalOpen(false)}
                disabled={isGeneratingMarksheet}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={!confirmMarksheetLock || (publishDirectlyToStudent && !confirmDuesCleared) || isGeneratingMarksheet}
                onClick={handleExecuteGenerateMarksheet}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isGeneratingMarksheet ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Generating Marksheet...</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    <span>Confirm & Generate Marksheet</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1.5 PUBLISH / SEND MARKSHEET TO STUDENT PORTAL MODAL */}
      {/* ======================================================== */}
      {publishToggleModalOpen && publishToggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-4">
            
            <button 
              onClick={() => {
                setPublishToggleModalOpen(false);
                setPublishToggleTarget(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                publishToggleTarget.action === 'publish'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {publishToggleTarget.action === 'publish' ? <Send size={22} /> : <EyeOff size={22} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {publishToggleTarget.action === 'publish' 
                    ? 'Send Marksheet to Student Portal' 
                    : 'Hide Marksheet from Student Portal'}
                </h3>
                <p className="text-xs text-gray-500">
                  {publishToggleTarget.action === 'publish'
                    ? 'Secondary confirmation & fee clearance check'
                    : 'Temporarily hold marksheet access for student'}
                </p>
              </div>
            </div>

            {/* Target Student Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Student:</span>
                <span className="font-bold text-gray-900">{publishToggleTarget.student.firstName} {publishToggleTarget.student.lastName || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Enrollment No:</span>
                <span className="font-mono text-gray-800">{publishToggleTarget.student.enrollment_no || `ID #${publishToggleTarget.student.studentId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Course & Sem:</span>
                <span className="font-semibold text-indigo-700">{publishToggleTarget.student.courseName} ({publishToggleTarget.semester.semester})</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-gray-500 font-medium">Total Marks Scored:</span>
                <span className="font-mono font-bold text-slate-900">{publishToggleTarget.semester.total} / {publishToggleTarget.semester.maxTotal} ({publishToggleTarget.semester.percentage}%)</span>
              </div>
            </div>

            {publishToggleTarget.action === 'publish' ? (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <ShieldCheck size={14} className="text-emerald-700" /> Dues Verification Required:
                  </p>
                  <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                    Once published, the student will immediately see and be able to print their official marksheet in their student portal.
                  </p>
                </div>

                {/* Secondary Checkbox 1: Dues Clearance */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={confirmDuesClearedToggle}
                    onChange={(e) => setConfirmDuesClearedToggle(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 font-medium select-none">
                    <strong className="text-emerald-950 block font-bold">1. Fee Dues Confirmation:</strong>
                    I verify that all course fees and center dues are <strong>100% cleared/completed</strong> for this student.
                  </span>
                </label>

                {/* Secondary Checkbox 2: Authorization */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={confirmPublishAction}
                    onChange={(e) => setConfirmPublishAction(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 font-medium select-none">
                    <strong className="text-gray-900 block font-bold">2. Publish Authorization:</strong>
                    I authorize sending this marksheet to the Student Portal.
                  </span>
                </label>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle size={14} className="text-amber-700" /> Hold Marksheet Notice:
                  </p>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    This will hide the marksheet from the student portal. The student will see your specific reason below.
                  </p>
                </div>

                {/* Custom Hold Reason Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    Reason for Holding Marksheet (Visible to Student):
                  </label>
                  <input
                    type="text"
                    value={customHoldReason}
                    onChange={(e) => setCustomHoldReason(e.target.value)}
                    placeholder="e.g. Semester 2 Fee Pending (₹1,500), Document Pending..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      'Course Fee Dues Pending',
                      'Fee Balance Pending (₹1,500)',
                      'Practical & Lab Clearance Required',
                      'Document Verification Required'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomHoldReason(preset)}
                        className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 border border-gray-200 rounded-md font-medium text-gray-700 cursor-pointer transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={confirmPublishAction}
                    onChange={(e) => setConfirmPublishAction(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 font-medium select-none">
                    I confirm holding and hiding this marksheet from the student portal.
                  </span>
                </label>
              </>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => {
                  setPublishToggleModalOpen(false);
                  setPublishToggleTarget(null);
                }}
                disabled={isTogglingPublish}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={
                  isTogglingPublish || 
                  (publishToggleTarget.action === 'publish' ? (!confirmDuesClearedToggle || !confirmPublishAction) : !confirmPublishAction)
                }
                onClick={handleExecuteTogglePublish}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer text-white disabled:bg-gray-300 disabled:cursor-not-allowed ${
                  publishToggleTarget.action === 'publish'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isTogglingPublish ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating Status...</span>
                  </>
                ) : publishToggleTarget.action === 'publish' ? (
                  <>
                    <Send size={14} />
                    <span>Verify Dues & Send to Portal</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={14} />
                    <span>Confirm & Hide Marksheet</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FULL MARKSHEET MODAL (WITH CENTER WATERMARK & LOGO) */}
      {/* ======================================================== */}
      {fullMarksheetModalOpen && selectedMarksheetStudent && (
        <StudentMarksheetModal 
          student={selectedMarksheetStudent} 
          onClose={() => { setFullMarksheetModalOpen(false); setSelectedMarksheetStudent(null); }} 
        />
      )}

      {/* ======================================================== */}
      {/* 3. SECONDARY CONFIRMATION MODAL FOR RE-EXAM RESET */}
      {/* ======================================================== */}
      {resetModalOpen && selectedResetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative space-y-5">
            
            <button 
              onClick={() => setResetModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border-2 border-amber-200">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">Confirm Exam Reset (Re-Exam)</h3>
                <p className="text-xs text-gray-500">Secondary confirmation required before resetting</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-indigo-600" />
                  <span className="font-bold text-gray-900 text-sm">{selectedResetTarget.student.firstName} {selectedResetTarget.student.lastName}</span>
                  <span className="text-xs text-gray-500 font-mono">(ID #{selectedResetTarget.student.studentId})</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  {selectedResetTarget.semester.semester}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block">Course:</span>
                  <span className="font-semibold text-gray-800">{selectedResetTarget.student.courseName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Current Score:</span>
                  <span className="font-bold text-amber-700 font-mono">{selectedResetTarget.semester.total} Marks</span>
                </div>
              </div>
            </div>

            {/* Reset Cost Box */}
            {(selectedResetTarget.semester.reattempts || 0) >= 2 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Coins size={15} className="text-amber-600" />
                    Paid Re-Exam Reset Fee
                  </span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-950 font-mono text-xs">
                    100 Tokens
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  The <strong>2 free resets</strong> for this exam have been exhausted (Previous resets: <strong>{selectedResetTarget.semester.reattempts}</strong>). This reset will deduct <strong>100 tokens</strong> from your center wallet balance.
                </p>
                <div className="text-[11px] font-semibold text-slate-700 pt-1.5 border-t border-amber-200/80 flex items-center justify-between">
                  <span>Your Wallet Balance: <strong className="font-mono text-slate-900">{walletBalance} Tokens</strong></span>
                  {walletBalance < 100 ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> Insufficient Balance
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      Balance after reset: {walletBalance - 100} Tokens
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles size={15} className="text-emerald-600" />
                    Free Re-Exam Reset
                  </span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-mono text-xs">
                    0 Tokens (FREE)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  This reset is <strong>100% Free</strong> (Free Reset <strong>{(selectedResetTarget.semester.reattempts || 0) + 1} of 2</strong>). Resets beyond 2 will incur a standard fee of 100 tokens per reset.
                </p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-slate-900">
                <RotateCcw size={14} className="text-slate-700" /> What happens when you reset?
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                <li>The exam status will change back to <strong>Scheduled / Ready</strong>.</li>
                <li>Previous <strong>online written answers & written marks</strong> will be cleared for re-examination.</li>
                <li><strong>Viva / Oral Marks Preserved:</strong> Evaluated Viva score ({selectedResetTarget.semester.viva} marks) remains <strong>saved and intact</strong>.</li>
                <li>The student can immediately log into their portal and <strong>Retake the Written Exam</strong>.</li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 bg-gray-50/50 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={confirmingSecondary}
                onChange={(e) => setConfirmingSecondary(e.target.checked)}
                className="mt-0.5 rounded text-[#6b6eed] focus:ring-[#6b6eed] w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-700 font-medium select-none">
                I confirm that I want to reset this exam and grant re-exam attempt access to <strong className="text-gray-900">{selectedResetTarget.student.firstName} {selectedResetTarget.student.lastName}</strong>{(selectedResetTarget.semester.reattempts || 0) >= 2 ? ' and authorize deducting 100 tokens' : ''}.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={
                  !confirmingSecondary || 
                  isResetting || 
                  ((selectedResetTarget.semester.reattempts || 0) >= 2 && walletBalance < 100)
                }
                onClick={handleExecuteReset}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Resetting Exam...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>
                      {(selectedResetTarget.semester.reattempts || 0) >= 2 
                        ? (walletBalance < 100 ? 'Insufficient Wallet Balance' : 'Pay 100 Tokens & Reset') 
                        : `Confirm Free Reset (${(selectedResetTarget.semester.reattempts || 0) + 1}/2)`
                      }
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VIVA MARKS MODAL */}
      {/* ======================================================== */}
      {vivaModalOpen && vivaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-4">
            
            <button 
              onClick={() => setVivaModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Enter / Edit Viva Marks</h3>
                <p className="text-xs text-gray-500">Center practical & oral evaluation</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Student:</span>
                <span className="font-bold text-gray-900">{vivaTarget.student.firstName} {vivaTarget.student.lastName || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Course & Semester:</span>
                <span className="font-semibold text-gray-800">{vivaTarget.student.courseName} - {vivaTarget.semester.semester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Online Written Score:</span>
                <span className="font-mono font-bold text-indigo-700">{vivaTarget.semester.written} / {vivaTarget.semester.maxWritten}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Viva Exam Marks (Max: {vivaTarget.semester.maxViva})
              </label>
              <input 
                type="number" 
                min="0" 
                max={vivaTarget.semester.maxViva} 
                value={vivaMarksInput}
                onChange={(e) => setVivaMarksInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base font-bold font-mono focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none"
                placeholder={`Enter viva marks (0 - ${vivaTarget.semester.maxViva})`}
              />
              <p className="text-[11px] text-gray-400 mt-1">Written marks come automatically from online test results.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setVivaModalOpen(false)}
                disabled={isSavingViva}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isSavingViva}
                onClick={handleSaveViva}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSavingViva ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Marks...</span>
                  </>
                ) : (
                  <>
                    <Award size={14} />
                    <span>Save Viva Marks</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Certificate Confirmation Dialog */}
      {certConfirmModalOpen && selectedCertTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedCertTarget.isInstant ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {selectedCertTarget.isInstant ? <Zap size={18} /> : <Award size={18} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedCertTarget.isInstant ? 'Instant Certificate Issue' : 'Generate Student Certificate'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedCertTarget.student.studentName || `${selectedCertTarget.student.firstName} ${selectedCertTarget.student.lastName || ''}`} ({selectedCertTarget.student.enrollment_no || selectedCertTarget.student.studentId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCertConfirmModalOpen(false);
                  setSelectedCertTarget(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Course:</span>
                  <span className="font-semibold text-slate-800">{selectedCertTarget.student.courseName || selectedCertTarget.student.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration / Semesters:</span>
                  <span className="font-semibold text-slate-800">{selectedCertTarget.student.semestersCount || selectedCertTarget.student.totalSemesters || 1} Semester(s)</span>
                </div>
                {selectedCertTarget.isInstant && (
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-amber-800 font-bold">
                    <span>Instant Issue Fee:</span>
                    <span>₹{instantCharge}</span>
                  </div>
                )}
              </div>

              {selectedCertTarget.isInstant ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <p className="font-semibold mb-1">⚡ Fast-track Certificate Generation</p>
                  <p className="text-[11px] text-amber-700">
                    This will immediately generate and activate the official Certificate for this student without waiting for standard clearance. A ₹{instantCharge} fee will be deducted from your center wallet.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                  <p className="font-semibold mb-1">🎓 Official Completion Certificate</p>
                  <p className="text-[11px] text-indigo-700">
                    This will generate the official ISO-compliant Completion Certificate with verifiable QR code. A required fee of ₹{instantCharge} will be deducted from your center wallet upon generation.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCertConfirmModalOpen(false);
                  setSelectedCertTarget(null);
                }}
                disabled={isGeneratingCert}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateCertificate}
                disabled={isGeneratingCert}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedCertTarget.isInstant
                    ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {isGeneratingCert ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : selectedCertTarget.isInstant ? (
                  <>
                    <Zap size={14} />
                    <span>Generate & Pay ₹{instantCharge}</span>
                  </>
                ) : (
                  <>
                    <Award size={14} />
                    <span>Generate Certificate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Certificate Modal View */}
      {certViewModalOpen && viewingCertStudent && (
        <StudentCertificateModal
          student={{
            ...viewingCertStudent,
            id: viewingCertStudent.studentId || viewingCertStudent.id,
            firstName: viewingCertStudent.studentName?.split(' ')[0] || viewingCertStudent.firstName || viewingCertStudent.studentName,
            lastName: viewingCertStudent.studentName?.split(' ').slice(1).join(' ') || viewingCertStudent.lastName || '',
            enrollment_no: viewingCertStudent.enrollment_no || viewingCertStudent.roll_no,
            roll_no: viewingCertStudent.roll_no,
            course_title: viewingCertStudent.courseName || viewingCertStudent.course_name,
            father_name: viewingCertStudent.father_name || viewingCertStudent.fatherName,
            mother_name: viewingCertStudent.mother_name || viewingCertStudent.motherName,
            photo: viewingCertStudent.photo || viewingCertStudent.photo_url,
            certificate_number: viewingCertStudent.certificate_number || viewingCertStudent.cert_no,
            certificate_date: viewingCertStudent.certificate_date || viewingCertStudent.cert_date,
            is_certified: viewingCertStudent.is_certified,
            center_name: viewingCertStudent.center_name,
            center_code: viewingCertStudent.center_code,
            marks: viewingCertStudent.marks || []
          }}
          onClose={() => {
            setCertViewModalOpen(false);
            setViewingCertStudent(null);
          }}
          onOpenMarksheet={() => {
            const tgt = viewingCertStudent;
            setCertViewModalOpen(false);
            setViewingCertStudent(null);
            openFullMarksheet(tgt);
          }}
        />
      )}

    </div>
  );
};

export default ExamsList;
