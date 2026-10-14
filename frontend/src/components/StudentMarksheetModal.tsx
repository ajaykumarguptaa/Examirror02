import { X, Printer, Download, CheckCircle2, XCircle, ShieldCheck, Award, QrCode, Upload, Sparkles, Building2, UserCheck, BookOpen, Layers, Trash2 } from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { ExamirrorOfficialStamp } from './common/ExamirrorOfficialStamp';
import { getAssetUrl } from '../utils/axiosSetup';

export const StudentMarksheetModal = ({ 
  student, 
  initialSemester,
  onClose 
}: { 
  student: any; 
  initialSemester?: string | number;
  onClose: () => void;
}) => {
  const [marks, setMarks] = useState<any[]>([]);
  const [fullStudent, setFullStudent] = useState<any>(student);
  const [loading, setLoading] = useState(true);
  const [showSignatureUpload, setShowSignatureUpload] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [stampPreview, setStampPreview] = useState<string>('');
  const [headName, setHeadName] = useState<string>('');
  const [isSavingSign, setIsSavingSign] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);

  const [authorityConfig, setAuthorityConfig] = useState<any>({
    authority_signature_url: '',
    authority_stamp_url: '',
    authority_title: 'Controller of Examinations',
    authority_name: 'Examirror Examination Board'
  });

  const activeStudent = fullStudent || student || {};

  useEffect(() => {
    if (student?.id) {
      setLoading(true);
      // 1. Fetch marks for the student
      axios.get(`http://localhost:3000/api/center/students/${student.id}/marks`)
        .then(res => {
          if (res.data.success) {
            setMarks(res.data.marks || []);
          }
        })
        .catch(err => console.error("Error fetching marks", err));

      // 2. Fetch full student & center metadata
      axios.get(`http://localhost:3000/api/center/students/${student.id}`)
        .then(res => {
          if (res.data.success && res.data.data) {
            setFullStudent(res.data.data);
            if (res.data.data.centerSignatureUrl) setSignaturePreview(res.data.data.centerSignatureUrl);
            if (res.data.data.centerStampUrl) setStampPreview(res.data.data.centerStampUrl);
            if (res.data.data.centerHeadName) setHeadName(res.data.data.centerHeadName);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      // 3. Fetch authority signature & stamp
      axios.get('http://localhost:3000/api/public/authority-signature')
        .then(res => {
          if (res.data?.success && res.data.data) {
            setAuthorityConfig(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [student]);

  // Extract semester list from student course config and marks
  const semesterOptions = useMemo(() => {
    let rawSem = activeStudent.courseSemesters || activeStudent.semesters;
    if (typeof rawSem === 'string') {
      try { rawSem = JSON.parse(rawSem); } catch (_) {}
    }
    
    const options: Array<{ id: string; label: string; num: number; mark?: any; config?: any }> = [];

    if (Array.isArray(rawSem) && rawSem.length > 0) {
      rawSem.forEach((s: any, idx: number) => {
        const num = Number(s.num || idx + 1);
        const id = `SEM ${num}`;
        const mark = marks.find(m => {
          const mStr = String(m.semester || '').toUpperCase().trim();
          return mStr === id || mStr === `SEMESTER ${num}` || mStr === String(num);
        });
        options.push({
          id,
          label: `Semester ${num}`,
          num,
          mark,
          config: s
        });
      });
    } else if (marks.length > 0) {
      marks.forEach((m: any, idx: number) => {
        const sStr = (m.semester || `SEM ${idx + 1}`).toUpperCase().trim();
        options.push({
          id: sStr,
          label: sStr.startsWith('SEM') ? `Semester ${sStr.replace(/\D+/g, '') || idx + 1}` : sStr,
          num: idx + 1,
          mark: m
        });
      });
    } else {
      options.push({
        id: 'SEM 1',
        label: 'Semester 1',
        num: 1
      });
    }

    return options;
  }, [activeStudent, marks]);

  // Set initial selected semester
  useEffect(() => {
    if (initialSemester) {
      const initStr = String(initialSemester).toUpperCase().trim();
      const match = semesterOptions.find(o => 
        o.id === initStr || 
        `SEM ${o.num}` === initStr || 
        `SEMESTER ${o.num}` === initStr || 
        String(o.num) === initStr
      );
      if (match) {
        setSelectedSemester(match.id);
        return;
      }
    }

    // Default to first completed or first semester
    if (!selectedSemester && semesterOptions.length > 0) {
      const completed = semesterOptions.find(o => o.mark && (Number(o.mark.is_marksheet_generated) === 1 || o.mark.status === 'completed'));
      setSelectedSemester(completed ? completed.id : semesterOptions[0].id);
    }
  }, [initialSemester, semesterOptions]);

  // Helper to parse course semester max marks
  const getSemesterConfig = (semNumOrName: string | number) => {
    let rawSem = activeStudent.courseSemesters || activeStudent.semesters;
    if (typeof rawSem === 'string') {
      try { rawSem = JSON.parse(rawSem); } catch (_) {}
    }
    if (Array.isArray(rawSem)) {
      const semStr = String(semNumOrName).toUpperCase().trim();
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
        const maxWritten = Number(found.marks) || 80;
        const maxViva = Number(found.oral) || 20;
        return {
          subjects: found.subjects || 'Core Vocational Theory & Practical Modules',
          maxWritten,
          maxViva,
          maxTotal: maxWritten + maxViva
        };
      }
    }
    return {
      subjects: 'Theory, Practical & Viva Examination',
      maxWritten: 80,
      maxViva: 20,
      maxTotal: 100
    };
  };

  const getGrade = (pct: number) => {
    if (pct >= 85) return { grade: 'A+', label: 'Outstanding (Distinction)', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (pct >= 75) return { grade: 'A', label: 'First Class with Distinction', color: 'text-teal-700 bg-teal-50 border-teal-300' };
    if (pct >= 60) return { grade: 'B', label: 'First Class', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (pct >= 50) return { grade: 'C', label: 'Second Class', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' };
    if (pct >= 40) return { grade: 'D', label: 'Pass Class', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    return { grade: 'F', label: 'Failed (Re-appear)', color: 'text-red-700 bg-red-50 border-red-300' };
  };

  const calculateRow = (m: any) => {
    const cfg = getSemesterConfig(m.semester);
    // Ensure written marks obtained never exceeds maxWritten (e.g. 80 when viva is 20)
    const rawWritten = Number(m.written_marks) || 0;
    const written = Math.min(cfg.maxWritten, rawWritten);
    const rawViva = Number(m.viva_marks) || 0;
    const viva = Math.min(cfg.maxViva, rawViva);
    const total = Math.min(cfg.maxTotal, written + viva);
    const percentage = cfg.maxTotal > 0 ? Math.min(100, Math.round((total / cfg.maxTotal) * 100)) : 0;
    const isPass = percentage >= 40;
    const gradeInfo = getGrade(percentage);
    return {
      ...cfg,
      semester: m.semester || 'SEM 1',
      exam_date: m.exam_date,
      written,
      viva,
      total,
      percentage,
      isPass,
      gradeInfo
    };
  };

  // Determine filtered marks based on selectedSemester
  const activeMarks = useMemo(() => {
    if (selectedSemester === 'CONSOLIDATED') {
      return marks;
    }
    if (selectedSemester) {
      const match = marks.find(m => {
        const mStr = String(m.semester || '').toUpperCase().trim();
        return mStr === selectedSemester || 
          mStr === selectedSemester.replace(' ', '') ||
          selectedSemester.includes(mStr);
      });
      if (match) return [match];

      // If mark record not created yet, mock a template for that semester from courseSemesters
      const opt = semesterOptions.find(o => o.id === selectedSemester);
      if (opt) {
        return [{
          semester: opt.id,
          exam_date: null,
          written_marks: 0,
          viva_marks: 0,
          status: 'scheduled'
        }];
      }
    }
    return marks.length > 0 ? [marks[0]] : [];
  }, [marks, selectedSemester, semesterOptions]);

  const calculatedRows = activeMarks.map(calculateRow);
  const totalObtained = Math.min(
    calculatedRows.reduce((sum, r) => sum + r.maxTotal, 0) || 100,
    calculatedRows.reduce((sum, r) => sum + r.total, 0)
  );
  const totalMaxMarks = calculatedRows.reduce((sum, r) => sum + r.maxTotal, 0) || 100;
  const overallPercentage = totalMaxMarks > 0 ? Math.min(100, Math.round((totalObtained / totalMaxMarks) * 100)) : 0;
  const isOverallPassed = calculatedRows.length > 0 && overallPercentage >= 40 && calculatedRows.every(r => r.isPass);
  const overallGrade = getGrade(overallPercentage);

  // Check if consolidated marksheet is eligible (all semesters completed)
  const isConsolidatedAvailable = semesterOptions.length > 1 && semesterOptions.every(
    opt => opt.mark && (opt.mark.status === 'completed' || Number(opt.mark.is_marksheet_generated) === 1)
  );

  // Dynamic Marksheet Title & Ref Suffix
  const isSingleSemesterView = selectedSemester !== 'CONSOLIDATED' && semesterOptions.length > 1;
  const currentSemesterNum = selectedSemester.match(/\d+/)?.[0] || '1';
  
  const getSemesterOrdinal = (n: string) => {
    if (n === '1') return 'First';
    if (n === '2') return 'Second';
    if (n === '3') return 'Third';
    if (n === '4') return 'Fourth';
    return `Semester ${n}`;
  };

  const marksheetBadgeText = selectedSemester === 'CONSOLIDATED' 
    ? 'Official Consolidated Statement of Marks'
    : (semesterOptions.length > 1 
        ? `Official Statement of Marks • ${getSemesterOrdinal(currentSemesterNum)} Semester (SEM ${currentSemesterNum})`
        : 'Official Statement of Marks & Evaluation');

  const refNumberSuffix = selectedSemester === 'CONSOLIDATED' 
    ? '-FINAL' 
    : (semesterOptions.length > 1 ? `-S${currentSemesterNum}` : '');

  // Center Details
  const centerName = activeStudent.centerName || activeStudent.center?.name || activeStudent.center_name || (activeStudent.centerId === 2 ? 'LAXMAN IT ACADEMY' : '') || 'EXAMIRROR AUTHORIZED STUDY CENTER';
  const centerCode = activeStudent.centerCode || activeStudent.center?.center_code || activeStudent.center_code || (activeStudent.centerId === 2 ? '6767' : '') || '6767';
  const centerAddress = activeStudent.centerAddress || activeStudent.address || '';
  const centerCity = activeStudent.centerCity || activeStudent.city || 'Central District';
  const centerState = activeStudent.centerState || activeStudent.state || 'India';
  const centerHead = headName || activeStudent.centerHeadName || activeStudent.centerHead || 'Center Director';
  const centerSig = signaturePreview || activeStudent.centerSignatureUrl || '';
  const centerStamp = stampPreview || activeStudent.centerStampUrl || '';

  const handlePrint = () => {
    const content = document.getElementById('printable-marksheet');
    if (content) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Official Statement of Marks - ${isSingleSemesterView ? `Semester ${currentSemesterNum}` : 'Evaluation'} - ${activeStudent.firstName || ''} ${activeStudent.lastName || ''}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; background: white !important; }
                  @page { size: A4 portrait; margin: 6mm; }
                  #printable-marksheet { 
                    border: 2px solid #1e3a8a !important; 
                    box-shadow: none !important; 
                    max-width: 100% !important; 
                    width: 100% !important; 
                    min-height: auto !important; 
                    height: auto !important; 
                    padding: 16px 20px !important; 
                    page-break-inside: avoid !important;
                  }
                  .no-print { display: none !important; }
                }
                .font-cinzel { font-family: 'Cinzel', serif; }
                .font-cursive { font-family: 'Great Vibes', cursive; }
              </style>
            </head>
            <body class="bg-white text-slate-900">
              <div class="flex justify-center p-2">
                ${content.outerHTML}
              </div>
              <script>
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 600);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Handle signature & stamp file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'stamp') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (type === 'signature') setSignaturePreview(reader.result);
        else setStampPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCenterSignature = async () => {
    const centerId = activeStudent.centerId;
    if (!centerId) return;
    try {
      setIsSavingSign(true);
      const res = await axios.post(`http://localhost:3000/api/center/${centerId}/signature-stamp`, {
        signature_url: signaturePreview,
        stamp_url: stampPreview,
        head_name: headName
      });
      if (res.data.success) {
        setUploadSuccess('Digital signature & stamp saved successfully! Applied to all marksheets.');
        setTimeout(() => {
          setUploadSuccess('');
          setShowSignatureUpload(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error saving signature', err);
    } finally {
      setIsSavingSign(false);
    }
  };

  const handleRemoveCenterSignature = async () => {
    const centerId = activeStudent.centerId;
    if (!centerId) return;
    try {
      setIsSavingSign(true);
      const res = await axios.post(`http://localhost:3000/api/center/${centerId}/signature-stamp`, {
        signature_url: null,
        stamp_url: null,
        head_name: headName || ''
      });
      if (res.data.success) {
        setSignaturePreview('');
        setStampPreview('');
        setUploadSuccess('Digital signature & stamp removed.');
        setTimeout(() => {
          setUploadSuccess('');
          setShowSignatureUpload(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error removing signature', err);
    } finally {
      setIsSavingSign(false);
    }
  };

  const isCenterPortal = !!localStorage.getItem('centerToken') 
    || !!localStorage.getItem('centerInfo') 
    || !!sessionStorage.getItem('centerToken')
    || window.location.pathname.includes('/center');

  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.examirror.in'}/verify/student/${encodeURIComponent(activeStudent.enrollment_no || activeStudent.roll_no || activeStudent.id)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 relative flex flex-col max-h-[96vh] my-2">
        
        {/* Modal Top Header Bar */}
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center px-3.5 sm:px-6 py-3 sm:py-4 bg-[#0f172a] text-white shrink-0 border-b border-blue-800 shadow-md gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-800/60 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                Official Statement of Examination Marks
              </h2>
              <p className="text-[10px] sm:text-[11px] text-blue-200/80 font-medium">
                National Vocational Standard Verification • Government Grade Marksheet
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {isCenterPortal && (
              <button
                onClick={() => setShowSignatureUpload(prev => !prev)}
                className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Upload size={13} />
                <span className="hidden sm:inline">Center Sign & Stamp</span>
                <span className="sm:hidden">Sign & Stamp</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional Signature & Stamp Upload Panel */}
        {showSignatureUpload && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 animate-in slide-in-from-top-2 duration-150">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-700" />
                  Upload Center Coordinator Digital Signature & Stamp (One-time Setup)
                </span>
                <span className="text-[11px] text-blue-700">Applied across all student marksheets & certificates</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Coordinator / Head Name</label>
                  <input
                    type="text"
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Digital Signature (PNG/JPG)</label>
                  <input
                    type="file"
                    ref={sigFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'signature')}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sigFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Upload size={12} /> Choose Sign
                    </button>
                    {signaturePreview && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Sign Loaded</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Center Official Stamp Seal (PNG)</label>
                  <input
                    type="file"
                    ref={stampFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'stamp')}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stampFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Upload size={12} /> Choose Stamp
                    </button>
                    {stampPreview && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Stamp Loaded</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {uploadSuccess ? (
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-blue-600" /> {uploadSuccess}
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={handleSaveCenterSignature}
                  disabled={isSavingSign}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingSign ? 'Saving...' : 'Save Signature & Stamp'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1 flex flex-col items-center">
          
          {/* SEMESTER SWITCHER TABS (When 2 or more semesters exist) */}
          {semesterOptions.length > 1 && (
            <div className="w-full max-w-[780px] mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 no-print">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Layers size={13} className="text-blue-700" />
                  Select Marksheet:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {semesterOptions.map((opt) => {
                    const isSel = selectedSemester === opt.id;
                    const hasMarks = opt.mark && (Number(opt.mark.written_marks) > 0 || Number(opt.mark.viva_marks) > 0 || opt.mark.status === 'completed');
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedSemester(opt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? 'bg-[#0f172a] text-white shadow-xs scale-102'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {hasMarks && (
                          <span className={`w-2 h-2 rounded-full ${isSel ? 'bg-blue-300' : 'bg-blue-500'}`} title="Exam Evaluated" />
                        )}
                      </button>
                    );
                  })}
                  
                  {isConsolidatedAvailable && (
                    <button
                      type="button"
                      onClick={() => setSelectedSemester('CONSOLIDATED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedSemester === 'CONSOLIDATED'
                          ? 'bg-indigo-800 text-white shadow-xs scale-102'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>Consolidated Final</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {selectedSemester === 'CONSOLIDATED' ? 'All Semesters Combined' : `Individual ${selectedSemester} Marksheet`}
              </div>
            </div>
          )}

          {/* PRINTABLE OFFICIAL MARKSHEET CONTAINER (With mobile responsive scroll wrapper) */}
          <div className="w-full overflow-x-auto py-2 no-scrollbar">
            <div 
              id="printable-marksheet" 
              className="w-full max-w-[780px] min-w-[580px] sm:min-w-[700px] mx-auto bg-white text-slate-900 border-2 border-blue-900 shadow-xl relative rounded-xl p-4 sm:p-7 pb-8 sm:pb-10 font-sans select-none shrink-0"
            >
            {/* Ornate Corner Accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-800" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-blue-800" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-blue-800" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-800" />
            
            {/* Inner Double Border */}
            <div className="absolute inset-3 border border-blue-800/40 pointer-events-none rounded-lg" />
            <div className="absolute inset-3.5 border border-amber-500/30 pointer-events-none rounded-lg" />

            {/* Dynamic Official Examirror & Center Watermark in background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden watermark-center opacity-[0.085]">
              <div className="flex flex-col items-center justify-center text-center transform scale-110">
                <img 
                  src="/Blue Circular Tech Emblem Logo.png?v=2" 
                  alt="Examirror Official Watermark" 
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain grayscale mb-1 select-none" 
                />
                <div className="font-serif font-black tracking-[0.25em] uppercase text-2xl sm:text-3xl text-slate-900 leading-tight">
                  EXAMIRROR
                </div>
                <div className="font-serif font-bold tracking-wider uppercase text-sm sm:text-base text-slate-800 mt-1 max-w-[500px]">
                  {centerName || 'AUTHORIZED STUDY CENTER'}
                </div>
                <div className="font-mono font-black tracking-[0.2em] text-[10px] text-blue-900 mt-0.5 uppercase">
                  CENTER CODE: {centerCode || '6767'} • VERIFIED ACADEMIC RECORD
                </div>
                <div className="font-serif font-extrabold tracking-[0.25em] text-[8.5px] text-slate-700 mt-0.5 uppercase">
                  VOCATIONAL EDUCATION & EXAMINATION AUTHORITY
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-3.5">
              
              {/* TOP HEADER: EXAMIRROR BRAND & STUDY CENTER EMBLEM */}
              <div className="text-center pb-2.5 border-b-2 border-blue-900/80 relative">
                
                {/* Top Meta Bar */}
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider pb-1.5 border-b border-slate-200/80 mb-2">
                  <span>REF NO: MS/{new Date().getFullYear()}/{centerCode}-{activeStudent.id || '101'}{refNumberSuffix}</span>
                  <span className="text-blue-900 font-extrabold flex items-center gap-1.5">
                    <span className="font-serif tracking-wider">EXAMIRROR</span> • <span>ISO 9001:2015 CERTIFIED INSTITUTION</span>
                  </span>
                  <span>CENTER CODE: {centerCode}</span>
                </div>

                {/* Main Institutional Header Row */}
                <div className="flex items-center justify-between gap-3 my-1">
                  
                  {/* Left: Examirror Brand Logo */}
                  <div className="flex flex-col items-center sm:items-start shrink-0">
                    <img 
                      src="/assets/logo.png" 
                      alt="Examirror Official Logo" 
                      className="h-10 sm:h-12 w-auto object-contain" 
                    />
                    <span className="text-[7.5px] font-extrabold text-blue-900 tracking-wider uppercase mt-0.5 font-mono">
                      EXAMINATION BOARD
                    </span>
                  </div>

                  {/* Center: Study Center Name & Location */}
                  <div className="flex-1 text-center px-1">
                    <div className="inline-block text-[8px] font-extrabold uppercase tracking-widest text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mb-0.5">
                      AUTHORIZED STUDY & EXAMINATION CENTRE
                    </div>
                    <h1 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-wide uppercase leading-tight">
                      {centerName}
                    </h1>
                    <div className="text-[9.5px] sm:text-[10.5px] font-bold text-blue-800 tracking-wider uppercase mt-0.5">
                      {centerAddress ? `${centerAddress}, ` : ''}{centerCity ? `${centerCity}, ` : ''}{centerState || 'India'}
                    </div>
                    <p className="text-[8px] text-slate-500 font-medium tracking-wide mt-0.5">
                      Autonomous Institute for Technical, Computer Science & Vocational Skills Education
                    </p>
                  </div>

                  {/* Right: Center Logo / SC Emblem */}
                  <div className="flex flex-col items-center sm:items-end shrink-0">
                    {activeStudent.centerLogo ? (
                      <img 
                        src={getAssetUrl(activeStudent.centerLogo)} 
                        alt={centerName} 
                        className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-xl p-1 bg-white border border-blue-800 shadow-xs shrink-0" 
                      />
                    ) : (
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0f172a] text-amber-300 flex items-center justify-center font-serif font-black text-lg sm:text-xl shadow-xs border border-amber-400 shrink-0">
                        {centerName ? centerName.substring(0, 2).toUpperCase() : 'SC'}
                      </div>
                    )}
                    <span className="text-[7.5px] font-mono font-bold text-slate-500 uppercase mt-0.5">
                      CODE: {centerCode}
                    </span>
                  </div>

                </div>

                {/* Marksheet Badge Banner */}
                <div className="text-center mt-2">
                  <div className="inline-block px-7 py-1 bg-[#0f172a] text-white font-serif font-bold text-xs uppercase tracking-widest rounded-full shadow-xs border border-amber-400/60">
                    {marksheetBadgeText}
                  </div>
                </div>

              </div>

              {/* CANDIDATE & COURSE CREDENTIALS GRID */}
              <div className="grid grid-cols-12 gap-3 text-xs bg-slate-50/60 backdrop-blur-[0.5px] p-3.5 rounded-xl border border-slate-200 relative">
                
                {/* Left 9 Cols: Student Details */}
                <div className="col-span-9 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  
                  <div className="flex flex-col border-b border-dashed border-slate-200 pb-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Candidate's Full Name</span>
                    <span className="font-black text-slate-900 uppercase text-xs">
                      {activeStudent.firstName} {activeStudent.lastName}
                    </span>
                  </div>

                  <div className="flex flex-col border-b border-dashed border-slate-200 pb-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Official Enrollment No</span>
                    <span className="font-mono font-black text-indigo-900">
                      {activeStudent.enrollment_no || `EXAM-2026-${activeStudent.id}`}
                    </span>
                  </div>

                  <div className="flex flex-col border-b border-dashed border-slate-200 pb-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Father's Name</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {activeStudent.father_name || 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-col border-b border-dashed border-slate-200 pb-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Roll Number</span>
                    <span className="font-mono font-black text-slate-900">
                      {activeStudent.roll_no || `ROL-${10000 + (activeStudent.id || 1)}`}
                    </span>
                  </div>

                  <div className="flex flex-col border-b border-dashed border-slate-200 pb-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Mother's Name</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {activeStudent.mother_name || 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-col border-b border-dashed border-slate-200 pb-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Academic Session</span>
                    <span className="font-bold text-slate-800">
                      {activeStudent.session_start || '2026'} - {activeStudent.session_end || '2026'}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col pt-1 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/80">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                      <BookOpen size={11} className="text-blue-700" />
                      Enrolled Course / Trade Program
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mt-0.5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-[13px] uppercase tracking-tight">
                        {activeStudent.courseName || activeStudent.course_name || 'Vocational Training & Skills Certificate'}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        {(activeStudent.courseCode || activeStudent.course_code) && (
                          <span className="font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-300 shadow-2xs">
                            CODE: {activeStudent.courseCode || activeStudent.course_code}
                          </span>
                        )}
                        <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                          {activeStudent.duration || activeStudent.courseDuration || '6 Months'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right 3 Cols: Photo & QR Seal */}
                <div className="col-span-3 flex flex-col items-center justify-center border-l border-slate-200 pl-3">
                  <div className="w-20 h-24 rounded-lg bg-white border-2 border-blue-700 shadow-xs overflow-hidden relative flex flex-col items-center justify-center p-0.5">
                    {activeStudent.photo_url ? (
                      <img 
                        src={getAssetUrl(activeStudent.photo_url)} 
                        alt="Candidate Photo" 
                        className="w-full h-full object-cover rounded" 
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-center p-1">
                        <UserCheck size={24} className="text-slate-300" />
                        <span className="text-[8px] font-bold uppercase mt-1">Photo</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-blue-900 text-white text-[7px] font-bold uppercase text-center py-0.5">
                      Verified
                    </div>
                  </div>
                </div>

              </div>

              {/* ACADEMIC EVALUATION MARKS TABLE */}
              <div className="space-y-1">
                <table className="w-full border-collapse border-2 border-slate-700 text-xs">
                  <thead>
                    <tr className="bg-[#0f172a] text-white font-bold text-[10px] uppercase tracking-wider">
                      <th className="border border-slate-600 p-2 text-left">Semester & Subject Curriculum</th>
                      <th className="border border-slate-600 p-2 text-center w-24">Written (Max)</th>
                      <th className="border border-slate-600 p-2 text-center w-24">Viva / Pract. (Max)</th>
                      <th className="border border-slate-600 p-2 text-center w-24">Total (Max)</th>
                      <th className="border border-slate-600 p-2 text-center w-16">Grade</th>
                      <th className="border border-slate-600 p-2 text-center w-20">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-300 p-5 text-center text-slate-500 italic text-xs">
                          No official examinations recorded yet for this student profile.
                        </td>
                      </tr>
                    ) : (
                      calculatedRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 font-medium text-[11px] bg-white/40">
                          <td className="border border-slate-300 p-2 text-slate-900">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{r.semester}</span>
                              <span className="text-[9px] font-bold text-slate-400 font-mono">
                                [Date: {r.exam_date ? new Date(r.exam_date).toLocaleDateString('en-GB') : 'Completed'}]
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                              {r.subjects}
                            </div>
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-800">
                            <span className="text-indigo-900 font-extrabold">{r.written}</span>
                            <span className="text-slate-400 font-normal text-[10px]"> / {r.maxWritten}</span>
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-800">
                            <span className="text-purple-900 font-extrabold">{r.viva}</span>
                            <span className="text-slate-400 font-normal text-[10px]"> / {r.maxViva}</span>
                          </td>
                          <td className="border border-slate-300 p-2 text-center font-mono font-extrabold text-slate-900">
                            <span className="text-blue-900">{r.total}</span>
                            <span className="text-slate-400 font-normal text-[10px]"> / {r.maxTotal}</span>
                          </td>
                          <td className="border border-slate-300 p-2 text-center">
                            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${r.gradeInfo.color}`}>
                              {r.gradeInfo.grade}
                            </span>
                          </td>
                          <td className="border border-slate-300 p-2 text-center">
                            <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] tracking-wider ${
                              r.isPass ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {r.isPass ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}

                    {/* GRAND / SEMESTER TOTAL SUMMARY ROW */}
                    {calculatedRows.length > 0 && (
                      <tr className="bg-blue-50/80 font-black text-xs border-t-2 border-blue-900 text-slate-900">
                        <td className="border border-slate-300 p-2 text-right uppercase tracking-wider text-slate-900 font-serif">
                          {isSingleSemesterView ? `SEMESTER ${currentSemesterNum} TOTAL SCORE:` : 'GRAND TOTAL SCORE:'}
                        </td>
                        <td colSpan={2} className="border border-slate-300 p-2 text-center font-mono text-[11px] text-slate-600">
                          Agg. Maximum: <strong className="text-slate-900">{totalMaxMarks}</strong>
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-black text-sm text-slate-900">
                          {totalObtained} / {totalMaxMarks}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-black text-xs text-blue-900">
                          {overallPercentage}% ({overallGrade.grade})
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                            isOverallPassed ? 'bg-blue-700 text-white shadow-2xs' : 'bg-red-600 text-white'
                          }`}>
                            {isOverallPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* GRADING SCALE FOOTNOTE */}
                <div className="flex flex-wrap items-center justify-between text-[8px] text-slate-500 font-semibold px-1 pt-1 border-b border-slate-200 pb-1">
                  <span><strong>Scale:</strong> A+ (&gt;=85% Distinction) | A (75-84% First Class) | B (60-74% Second Class) | C (50-59%) | D (40-49% Pass) | F (&lt;40% Fail)</span>
                  <span className="text-blue-800 font-bold">Min Pass Marks: 40% in each module</span>
                </div>
              </div>

              {/* FOOTER: SIGNATURES & 3D VERIFICATION STAMP */}
              <div className="pt-2 pb-1">
                <div className="grid grid-cols-3 gap-2 items-end">
                  
                  {/* 1. Center Coordinator Signature */}
                  <div className="flex flex-col items-center text-center relative">
                    <div className="h-14 flex items-end justify-center mb-1 w-full relative">
                      
                      {/* Center Coordinator Stamp (only visible if uploaded by center) */}
                      {centerStamp && (
                        <img 
                          src={getAssetUrl(centerStamp)}
                          alt="Center Stamp"
                          className="absolute left-2 -bottom-1 w-16 h-16 object-contain opacity-90 mix-blend-multiply rotate-[-12deg] pointer-events-none z-0"
                        />
                      )}

                      {/* Center Coordinator Signature (only visible if uploaded by center) */}
                      {centerSig && (
                        <img 
                          src={getAssetUrl(centerSig)}
                          alt="Coordinator Signature"
                          className="max-h-12 max-w-[130px] object-contain relative z-10 mix-blend-multiply"
                        />
                      )}
                      <div className="hidden">
                        {centerHead}
                      </div>
                    </div>
                    <div className="w-36 border-b-2 border-slate-800 mb-1" />
                    <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">
                      Center Coordinator
                    </span>
                    <span className="text-[8px] text-slate-500 font-medium">
                      {centerName} (Code: {centerCode})
                    </span>
                  </div>

                  {/* 2. Official Rosette Hologram & Verified Stamp Seal */}
                  <div className="flex flex-col items-center justify-center text-center relative">
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center p-1 bg-[#1e3a8a] shadow-md border-2 border-amber-300">
                      {/* Inner Ring */}
                      <div className="w-full h-full rounded-full border-2 border-dashed border-amber-200/90 flex flex-col items-center justify-center bg-slate-900/90 text-white text-center p-1 relative overflow-hidden">
                        <span className="text-[7px] font-extrabold uppercase text-amber-300 tracking-wider leading-none">
                          OFFICIAL
                        </span>
                        <div className="my-0.5">
                          <CheckCircle2 size={15} className="text-amber-300 mx-auto" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white leading-none">
                          VERIFIED
                        </span>
                        <span className="text-[6px] text-blue-200 uppercase tracking-tighter mt-0.5">
                          INSTITUTE SEAL
                        </span>
                      </div>
                    </div>

                    <span className="text-[8px] font-bold text-blue-900 uppercase tracking-wider mt-1 flex items-center gap-1">
                      <ShieldCheck size={10} className="text-blue-700" /> Tamper-Proof Document
                    </span>
                  </div>

                  {/* 3. Controller of Examinations Signature */}
                  <div className="flex flex-col items-center text-center relative">
                    <div className="h-14 flex items-end justify-center mb-1 relative w-full">
                      <img 
                        src="/Blue Circular Tech Emblem Logo.png?v=2"
                        alt="Authority Stamp"
                        className="absolute left-4 -bottom-1 w-16 h-16 object-contain opacity-95 mix-blend-multiply rotate-[-12deg] pointer-events-none z-0"
                      />
                      <img 
                        src="/Saurabh_Signature_Final.png?v=3"
                        alt="Authority Signature"
                        className="max-h-12 max-w-[130px] object-contain relative z-10 mix-blend-multiply"
                      />
                    </div>
                    <div className="w-36 border-b-2 border-slate-800 mb-1" />
                    <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block">
                      {authorityConfig?.authority_title || 'Controller of Exams'}
                    </span>
                    <span className="text-[8px] text-slate-500 font-medium block">
                      {authorityConfig?.authority_name || 'Academic Examination Cell'}
                    </span>
                  </div>

                </div>

                {/* Bottom Verification Note & QR code info */}
                <div className="mt-3 pt-2 border-t border-slate-200 text-[8px] text-slate-400 flex items-center justify-between">
                  <span>To verify this marksheet online, scan the QR code with Enrollment #{activeStudent.enrollment_no || activeStudent.id}</span>
                  <span className="font-mono">Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Official marksheet can be saved or printed in high resolution A4 format.
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2 sm:py-2.5 px-4 sm:px-5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial py-2 sm:py-2.5 px-4 sm:px-6 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 cursor-pointer transition-all active:scale-95"
            >
              <Printer size={16} /> <span>Print Marksheet</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
