import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Building2,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmCaptchaModal from '../../components/DeleteConfirmCaptchaModal';

interface StudentData {
  id: number;
  centerId: number;
  centerName: string;
  centerCode: string;
  courseId: number;
  courseName: string;
  firstName: string;
  lastName: string;
  father_name: string;
  mother_name: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  qualification: string;
  id_type: string;
  id_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  enrollment_no: string;
  roll_no: string;
  academic_status: 'pursuing' | 'passout';
  photo_url?: string;
  id_card_url?: string;
  marksheet_url?: string;
  created_at: string;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingStudent, setViewingStudent] = useState<StudentData | null>(null);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (viewingStudent) {
      axios.get(`http://localhost:3000/api/admin/students/${viewingStudent.id}/marks`)
        .then(res => {
          if(res.data.success) setStudentMarks(res.data.marks);
        }).catch(err => setStudentMarks([]));
    } else {
      setStudentMarks([]);
    }
  }, [viewingStudent]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/admin/students');
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleConfirmDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    try {
      setIsDeleting(true);
      const res = await axios.delete(`http://localhost:3000/api/admin/students/${deleteStudentTarget.id}`);
      if (res.data.success) {
        setToastMessage({ type: 'success', text: `Student record "${deleteStudentTarget.name}" deleted successfully` });
        setDeleteStudentTarget(null);
        fetchStudents();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete student' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique centers for filter dropdown
  const uniqueCenters = Array.from(new Set(students.map(s => s.centerName).filter(Boolean)));

  const filtered = students.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
      (s.enrollment_no && s.enrollment_no.toLowerCase().includes(term)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      (s.centerName && s.centerName.toLowerCase().includes(term)) ||
      (s.centerCode && s.centerCode.toLowerCase().includes(term));

    const matchesCenter = selectedCenter === 'all' || s.centerName === selectedCenter;
    const matchesStatus = statusFilter === 'all' || s.academic_status === statusFilter;

    return matchesSearch && matchesCenter && matchesStatus;
  });

  const formatImageSrc = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http://localhost:3000')) {
      return src.replace('http://localhost:3000', '');
    }
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    return src.startsWith('/') ? src : `/${src}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">

      {/* Toast Message */}
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
          <div className="flex items-center gap-2 font-medium text-sm">
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <X size={18} className="text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Student Registry
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Total Enrolled: {students.length}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Centralized Students Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect, filter, and verify admission records across all affiliated computer training centers.
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, enrollment no, roll no, mobile, center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">All Study Centers ({uniqueCenters.length})</option>
            {uniqueCenters.map(center => (
              <option key={center} value={center}>{center}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">All Academic Status</option>
            <option value="pursuing">Currently Pursuing</option>
            <option value="passout">Passout / Completed</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student Name & Identifiers</th>
                <th className="py-3 px-4">Study Center</th>
                <th className="py-3 px-4">Enrolled Course</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No students found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-700 text-xs">
                          {s.photo_url ? (
                            <img src={formatImageSrc(s.photo_url)} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            `${s.firstName?.[0] || 'S'}${s.lastName?.[0] || ''}`
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {s.firstName} {s.lastName}
                          </div>
                          <div className="text-[11px] text-indigo-600 font-mono font-bold">
                            ENR: {s.enrollment_no || `EXAM-${s.id}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{s.centerName || 'Direct Center'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.centerCode}</div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {s.courseName || 'Computer Course'}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{s.phone}</div>
                      <div className="text-[10px] text-slate-400">{s.email}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${s.academic_status === 'passout'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {s.academic_status === 'passout' ? <GraduationCap size={12} /> : <CheckCircle2 size={12} />}
                        <span>{s.academic_status === 'passout' ? 'Passout' : 'Pursuing'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingStudent(s)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Full Profile"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => setDeleteStudentTarget({ id: s.id, name: `${s.firstName} ${s.lastName}` })}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-300 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-[#1e1b4b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">Student Enrollment Profile</h3>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="w-16 h-16 rounded-xl border border-slate-300 overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={formatImageSrc(viewingStudent.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingStudent.firstName + ' ' + viewingStudent.lastName)}`}
                    alt="Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-lg text-slate-900">{viewingStudent.firstName} {viewingStudent.lastName}</h4>
                  <div className="text-indigo-700 font-mono font-bold">Enrollment No: {viewingStudent.enrollment_no || `EXAM-${viewingStudent.id}`}</div>
                  <div className="text-slate-500">Center: {viewingStudent.centerName} ({viewingStudent.centerCode})</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><strong>Father's Name:</strong> {viewingStudent.father_name || 'N/A'}</div>
                <div><strong>Mother's Name:</strong> {viewingStudent.mother_name || 'N/A'}</div>
                <div><strong>Course:</strong> {viewingStudent.courseName}</div>
                <div><strong>Academic Status:</strong> {viewingStudent.academic_status}</div>
                <div><strong>Phone:</strong> {viewingStudent.phone}</div>
                <div><strong>Email:</strong> {viewingStudent.email}</div>
                <div><strong>Date of Birth:</strong> {viewingStudent.dob}</div>
                <div><strong>Gender:</strong> {viewingStudent.gender}</div>
                <div><strong>Qualification:</strong> {viewingStudent.qualification}</div>
                <div><strong>ID Proof:</strong> {viewingStudent.id_type} - {viewingStudent.id_number}</div>
                <div className="col-span-2"><strong>Address:</strong> {viewingStudent.address}, {viewingStudent.city}, {viewingStudent.state} - {viewingStudent.pincode}</div>
              </div>
              
              {/* DETAILED SCORECARD FOR SUPER ADMIN */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2">
                  <FileText size={16} /> Detailed Scorecard (Exam Analytics)
                </h4>
                {studentMarks.length === 0 ? (
                  <p className="text-gray-500 italic text-xs">No exams scheduled or attempted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {studentMarks.map((m, idx) => {
                      const written = Number(m.written_marks || 0);
                      const viva = Number(m.viva_marks || 0);
                      const total = written + viva;
                      const isCompleted = m.status === 'completed' || written > 0 || viva > 0;
                      const isPassed = isCompleted && total >= 40;
                      const reattempts = Number(m.reattempts || 0);

                      return (
                        <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-900 text-sm">{m.semester}</span>
                            <div className="flex items-center gap-1.5">
                              {isCompleted && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                  {isPassed ? 'Passed' : 'Failed'}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isCompleted ? 'Completed' : 'Scheduled'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 text-xs text-center">
                            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-xs">
                              <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Written Marks</span>
                              <span className="text-base font-black font-mono text-indigo-700">{written.toFixed(2)}</span>
                            </div>
                            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-xs">
                              <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Viva Marks</span>
                              <span className="text-base font-black font-mono text-purple-700">{viva.toFixed(2)}</span>
                            </div>
                            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-xs">
                              <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Total / 100</span>
                              <span className="text-base font-black font-mono text-emerald-800">{total.toFixed(2)}</span>
                            </div>
                            <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-xs">
                              <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Re-attempts</span>
                              <span className="text-base font-black font-mono text-red-600">{reattempts}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {(viewingStudent.id_card_url || viewingStudent.marksheet_url) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 mt-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Uploaded Documents:</div>
                  <div className="flex flex-wrap gap-2">
                    {viewingStudent.id_card_url && (
                      <a
                        href={formatImageSrc(viewingStudent.id_card_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-indigo-100"
                      >
                        <ExternalLink size={12} /> View ID Proof
                      </a>
                    )}
                    {viewingStudent.marksheet_url && (
                      <a
                        href={formatImageSrc(viewingStudent.marksheet_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-emerald-100"
                      >
                        <ExternalLink size={12} /> View Marksheet Proof
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Captcha Modal */}
      <DeleteConfirmCaptchaModal
        isOpen={Boolean(deleteStudentTarget)}
        title="Delete Student Record"
        itemName={deleteStudentTarget?.name || ''}
        itemType="Student Record"
        description="Are you sure you want to permanently delete this student? All linked academic enrollment history, marksheets, certificates, and ID records will be erased."
        onClose={() => setDeleteStudentTarget(null)}
        onConfirm={handleConfirmDeleteStudent}
        isDeleting={isDeleting}
      />

    </div>
  );
};

export default AdminStudents;
