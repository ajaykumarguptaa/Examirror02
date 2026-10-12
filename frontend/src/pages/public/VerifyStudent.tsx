import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Building2,
  User,
  Printer,
  Award,
  Search,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  FileCheck,
  Camera
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SEO from '../../components/SEO';
import { QrCameraScannerModal } from '../../components/QrCameraScannerModal';
import { calculateStudentAcademicGrade } from '../../utils/academicGrade';

interface VerifiedStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photo_url?: string;
  enrollment_no: string;
  roll_no: string;
  student_type?: string;
  academic_status?: 'pursuing' | 'passout';
  duration?: string;
  dob?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  qualification?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  session_start?: string;
  session_end?: string;
  certificate_status?: string;
  certificate_number?: string;
  id_type?: string;
  id_number?: string;
  status: string;
  created_at: string;
  courseName: string;
  courseCode?: string;
  courseDescription?: string;
  centerName?: string;
  centerCode?: string;
  centerCity?: string;
  centerState?: string;
  marks?: Array<{
    id: number;
    semester: number;
    written_marks?: number;
    viva_marks?: number;
    status: string;
    is_marksheet_generated?: number;
    exam_date?: string;
  }>;
}

const VerifyStudent = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [student, setStudent] = useState<VerifiedStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fetchStudent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:3000/api/public/verify/student/${encodeURIComponent(id)}`);
      if (res.data.success && res.data.data) {
        setStudent(res.data.data);
      } else {
        setError('No verified student record found for this Enrollment or Roll Number.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or unverified student credentials.');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryId = searchParams.get('cert') || searchParams.get('reg') || searchParams.get('enrollment') || searchParams.get('roll') || searchParams.get('id');
    const targetId = identifier || queryId;

    if (targetId) {
      fetchStudent(targetId);
    } else {
      setLoading(false);
    }
  }, [identifier]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSearch.trim()) {
      fetchStudent(manualSearch.trim());
    }
  };

  const handleScanSuccess = (decoded: string) => {
    setIsCameraOpen(false);
    let id = decoded.trim();
    if (id.includes('/verify/student/')) {
      id = id.split('/verify/student/')[1].split('?')[0].split('#')[0];
    } else if (id.includes('/verify/certificate/')) {
      id = id.split('/verify/certificate/')[1].split('?')[0].split('#')[0];
    } else if (id.includes('/verify/')) {
      id = id.split('/verify/')[1].split('?')[0].split('#')[0];
    }
    if (id) {
      setManualSearch(id);
      fetchStudent(id);
    }
  };

  const isPursuing = !student?.academic_status || student.academic_status === 'pursuing';

  const formatImageSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://localhost:3000')) {
      return url.replace('http://localhost:3000', '');
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 py-8 px-4 sm:px-6 font-sans">
      <SEO
        title="Student & Certificate Verification | Examirror Portal"
        description="Verify Examirror student enrollment, course completion, marksheet, and official certificates using registration number or roll number."
        keywords={[
          'Student Verification',
          'Certificate Verification Examirror',
          'Marksheet Verification',
          'Roll Number Search Examirror'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Student Verification', item: '/verify' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Official Student & Certificate Verification Portal',
          description: 'Central academic certification registry and verification portal by Examirror.'
        }}
      />

      <QrCameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
            <ArrowLeft size={16} /> Back to Portal
          </Link>
          <div className="text-xs text-slate-500 font-medium">
            Official Student Verification Portal
          </div>
        </div>

        {/* Search Bar for manual lookup */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter Enrollment No (e.g. EXAM-2026-1001) or Roll No..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-600 focus:bg-white transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              title="Scan QR Code using device camera"
            >
              <Camera size={16} /> Scan QR Code
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#0f172a] hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors cursor-pointer shrink-0"
            >
              Verify Record
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-3 shadow-sm">
            <Loader2 size={32} className="animate-spin text-slate-600 mx-auto" />
            <p className="text-slate-600 text-sm font-medium">Verifying credentials with central student database...</p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold text-red-700">Verification Record Not Found</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <p className="text-xs text-slate-400">Please check the Enrollment Number or Roll Number and try again.</p>
          </div>
        )}

        {/* Verified Student Record Card - Clean Light Institutional Design */}
        {!loading && student && (
          <div className="bg-white border border-slate-300 rounded-xl shadow-md overflow-hidden print:border-none print:shadow-none">

            {/* Header: Clean Navy Blue Institutional Bar */}
            <div className="bg-[#0f172a] text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Official Record Verified
                    </span>
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight mt-1 text-white">
                    Examirror Skill Development & Education
                  </h1>
                  <p className="text-xs text-slate-300">Central Verification & Academic Certification Registry</p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
              >
                <Printer size={14} /> Print Verification Slip
              </button>
            </div>

            {/* Sub-Header: Academic Status Banner */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status:</span>
                {isPursuing ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                    Currently Pursuing (Active Enrolled Student)
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 border border-blue-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-blue-700" />
                    Course Completed / Passout (Certified)
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-semibold bg-white border border-slate-300 px-3 py-1 rounded text-slate-700">
                Enrollment: {student.enrollment_no || `EXAM-2026-${student.id}`}
              </div>
            </div>

            {/* Main Content Details Grid */}
            <div className="p-6 sm:p-8 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                {/* Left Column: Photo & Scannable QR Code */}
                <div className="md:col-span-1 flex flex-col items-center space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">

                  {/* Photo Frame */}
                  <div className="w-32 h-36 rounded-lg border-2 border-slate-300 overflow-hidden shadow-xs bg-white">
                    <img
                      src={formatImageSrc(student.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstName + ' ' + student.lastName)}&background=0f172a&color=fff`}
                      alt={student.firstName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name & Roll */}
                  <div className="w-full border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-sm text-slate-900 uppercase">{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{student.roll_no || `ROL-${10000 + student.id}`}</p>
                  </div>

                  {/* Scannable Verification QR Code */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <QRCodeSVG
                      value={window.location.href}
                      size={105}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Scan to Authenticate</span>
                </div>

                {/* Right Column: Structured Panels */}
                <div className="md:col-span-3 space-y-4">

                  {/* Panel 1: Course & Academic Details */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider">
                      <GraduationCap size={15} className="text-slate-600" /> Course & Academic Details
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white">
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Enrolled Course</span>
                        <span className="text-slate-900 font-bold text-sm">{student.courseName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Course Code</span>
                        <span className="text-slate-800 font-mono font-bold">{student.courseCode || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Duration</span>
                        <span className="text-slate-800 font-semibold">{student.duration || '3 Month(s)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Academic Session</span>
                        <span className="text-slate-800 font-semibold">
                          {student.session_start || '2026'} - {student.session_end || '2027'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Student Particulars */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider">
                      <User size={15} className="text-slate-600" /> Student Particulars
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white">
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Father's Name</span>
                        <span className="text-slate-900 font-medium">{student.father_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Date of Birth</span>
                        <span className="text-slate-900 font-medium">{student.dob || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Gender</span>
                        <span className="text-slate-900 font-medium">{student.gender || 'Male'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Qualification</span>
                        <span className="text-slate-900 font-medium">{student.qualification || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Address / State</span>
                        <span className="text-slate-900 font-medium">{student.city || 'N/A'}, {student.state || ''}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Admission Date</span>
                        <span className="text-slate-900 font-medium">
                          {new Date(student.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Authorized Training Center */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider">
                      <Building2 size={15} className="text-slate-600" /> Authorized Training Center
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white">
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Center Name</span>
                        <span className="text-slate-900 font-bold">{student.centerName || 'Examirror Authorized Study Center'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-0.5">Center Code & Location</span>
                        <span className="text-slate-800 font-mono font-semibold">
                          {student.centerCode || 'EXAM-CTR-01'} ({student.centerCity || student.city || 'Delhi'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 4: Certificate Record (if issued) */}
                  {student.certificate_number && (
                    <div className="border border-emerald-300 bg-emerald-50/70 rounded-lg p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award size={22} className="text-emerald-700" />
                        <div>
                          <span className="text-[11px] text-emerald-800 font-bold uppercase block">Official Certificate Issued</span>
                          <div className="text-slate-900 font-mono font-bold">{student.certificate_number}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">
                          Grade {calculateStudentAcademicGrade(student).grade}
                        </span>
                        <span className="text-xs bg-emerald-700 text-white font-bold px-3 py-1 rounded-md">
                          VALIDATED
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Panel 5: Examination & Marksheet Record (if available) */}
                  {student.marks && student.marks.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <FileCheck size={15} className="text-blue-600" /> Verified Academic Performance & Marksheet
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                          {student.marks.length} Exam Record(s)
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2">Semester</th>
                              <th className="px-3 py-2">Written</th>
                              <th className="px-3 py-2">Practical / Viva</th>
                              <th className="px-3 py-2">Total</th>
                              <th className="px-3 py-2">Exam Date</th>
                              <th className="px-3 py-2">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {student.marks.map((m, idx) => {
                              const written = Number(m.written_marks || 0);
                              const viva = Number(m.viva_marks || 0);
                              const total = written + viva;
                              return (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 font-bold text-slate-800">Sem {m.semester}</td>
                                  <td className="px-3 py-2 text-slate-700">{written}</td>
                                  <td className="px-3 py-2 text-slate-700">{viva}</td>
                                  <td className="px-3 py-2 font-bold text-slate-900">{total}</td>
                                  <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{m.exam_date || 'N/A'}</td>
                                  <td className="px-3 py-2">
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                      {m.status || 'Passed'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Footer Institutional Banner */}
            <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Examirror Skill Development & Education Board</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-600" /> Digitally Validated & Signed Record
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyStudent;
