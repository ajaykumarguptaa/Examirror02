import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Check, Edit3, ShieldAlert, FileText, Building2, Users, LayoutGrid, Table, Image as ImageIcon, Upload, Clock, Layers, HelpCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Semester {
  num: number;
  subjects: string;
  marks: number;
  oral: number;
  marks_per_question?: number;
  negative_marks?: number;
  pass_marks?: number;
  is_published?: boolean;
}

interface Course {
  id: number;
  code: string;
  name: string;
  duration?: string;
  fee?: number;
  shortDescription?: string;
  eligibility?: string;
  image_url?: string;
  semesters?: string | Semester[];
  questionsCount?: number;
  is_published?: number;
  is_draft?: number;
}

interface PopupState {
  isOpen: boolean;
  type: 'duplicate' | 'success';
  title: string;
  message: string;
  courseName?: string;
}

const AdminCourses = () => {
  const centerId = localStorage.getItem('centerId') ? Number(localStorage.getItem('centerId')) : 1;
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingCourseId, setAddingCourseId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; course: Course | null; usageCount: number; centers: any[]; input: string; isDeleting: boolean }>({ isOpen: false, course: null, usageCount: 0, centers: [], input: '', isDeleting: false });
  const [blockedUnpublishModal, setBlockedUnpublishModal] = useState<{ isOpen: boolean; courseName: string; centers: Array<{ id?: number; name: string; center_code: string; student_count: number }> }>({ isOpen: false, courseName: '', centers: [] });

  // Modal Form State
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [durationValue, setDurationValue] = useState('3');
  const [durationType, setDurationType] = useState('Months');
  const [courseFee, setCourseFee] = useState('1500');
  const [courseImage, setCourseImage] = useState<string>('');
  const [eligibility, setEligibility] = useState('10th / 12th Pass');
  const [shortDescription, setShortDescription] = useState('');
  const [semesters, setSemesters] = useState<Semester[]>([
    { num: 1, subjects: '', marks: 80, oral: 20, marks_per_question: 1, negative_marks: 0, pass_marks: 40 }
  ]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Image file size must be less than 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCourseImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const coursesRes = await axios.get('http://localhost:3000/api/center/courses');
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSemester = () => {
    setSemesters((prev) => [
      ...prev,
      { 
        num: prev.length + 1, 
        subjects: '', 
        marks: 80, 
        oral: 20, 
        marks_per_question: 1, 
        negative_marks: 0, 
        pass_marks: 40 
      }
    ]);
  };

  const handleRemoveSemester = (index: number) => {
    if (semesters.length <= 1) return;
    setSemesters((prev) =>
      prev.filter((_, i) => i !== index).map((sem, i) => ({ ...sem, num: i + 1 }))
    );
  };

  const handleSemesterChange = (index: number, field: keyof Semester, value: any) => {
    setSemesters((prev) =>
      prev.map((sem, i) => (i === index ? { ...sem, [field]: value } : sem))
    );
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseCode('');
    setDurationValue('3');
    setDurationType('Months');
    setCourseFee('1500');
    setCourseImage('');
    setEligibility('10th / 12th Pass');
    setShortDescription('');
    setSemesters([{ num: 1, subjects: '', marks: 80, oral: 20, marks_per_question: 1, negative_marks: 0, pass_marks: 40 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name || '');
    setCourseCode(course.code || '');

    const durParts = (course.duration || '3 Months').split(' ');
    setDurationValue(durParts[0] || '3');
    setDurationType(durParts[1] || 'Months');
    setCourseFee(String(course.fee || 1500));
    setCourseImage(course.image_url || '');
    setEligibility(course.eligibility || '10th / 12th Pass');
    setShortDescription(course.shortDescription || '');

    const parsedSems = getParsedSemesters(course);
    setSemesters(parsedSems.map(s => ({
      num: s.num,
      subjects: s.subjects || '',
      marks: s.marks !== undefined ? Number(s.marks) : 80,
      oral: s.oral !== undefined ? Number(s.oral) : 20,
      marks_per_question: s.marks_per_question !== undefined ? Number(s.marks_per_question) : 1,
      negative_marks: s.negative_marks !== undefined ? Number(s.negative_marks) : 0,
      pass_marks: s.pass_marks !== undefined ? Number(s.pass_marks) : 40
    })));

    setIsEditModalOpen(true);
  };

  const handleCreateCourse = async (e?: React.FormEvent, mode: 'publish' | 'draft' = 'publish') => {
    if (e && e.preventDefault) e.preventDefault();

    if (!courseName.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a valid Course Name.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const durationStr = `${durationValue} ${durationType}`;
      const payload = {
        name: courseName.trim(),
        code: courseCode.trim() || undefined,
        duration: durationStr,
        fee: Number(courseFee) || 0,
        categoryId: 'Certificate',
        shortDescription: shortDescription.trim() || semesters.map(s => `Sem ${s.num}: ${s.subjects}`).join('; '),
        eligibility: eligibility.trim() || '10th / 12th Pass',
        image_url: courseImage || undefined,
        semesters: semesters,
        createdByType: 'admin',
        createdById: null,
        is_published: mode === 'publish' ? 1 : 0,
        is_draft: mode === 'draft' ? 1 : 0
      };

      const res = await axios.post('http://localhost:3000/api/center/courses', payload);

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: mode === 'draft'
            ? `Course "${courseName}" saved as In-Database Draft!`
            : `Course "${courseName}" created and published successfully!`
        });
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add course. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    if (!courseName.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a valid Course Name.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const durationStr = `${durationValue} ${durationType}`;
      const payload = {
        name: courseName.trim(),
        code: courseCode.trim() || undefined,
        duration: durationStr,
        fee: Number(courseFee) || 0,
        categoryId: 'Certificate',
        shortDescription: shortDescription.trim() || semesters.map(s => `Sem ${s.num}: ${s.subjects}`).join('; '),
        eligibility: eligibility.trim() || '10th / 12th Pass',
        image_url: courseImage || undefined,
        semesters: semesters
      };

      const res = await axios.put(`http://localhost:3000/api/admin/courses/${editingCourse.id}`, payload);

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Course "${courseName}" and exam criteria updated successfully!`
        });
        setIsEditModalOpen(false);
        setEditingCourse(null);
        fetchData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update course.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (courseId: number, currentStatus: number | undefined) => {
    try {
      const targetCourse = courses.find(c => c.id === courseId);
      const nextStatus = currentStatus === 1 ? 0 : 1;
      const res = await axios.put(`http://localhost:3000/api/admin/courses/${courseId}/publish`, {
        is_published: nextStatus
      });
      
      if (res.data.blocked || res.data.inUse) {
        setBlockedUnpublishModal({
          isOpen: true,
          courseName: targetCourse?.name || 'This course',
          centers: res.data.centers || []
        });
        return;
      }
      
      if (res.data.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: nextStatus, is_draft: 0 } : c));
        setFeedback({
          type: 'success',
          text: `Course "${targetCourse?.name}" status updated to ${nextStatus === 1 ? 'Published' : 'Unpublished'}`
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update course status'
      });
    }
  };

  const handleToggleSemesterPublish = async (courseId: number, semIndex: number, currentStatus: boolean | undefined) => {
    try {
      const nextStatus = currentStatus === false ? true : false;
      const res = await axios.put(`http://localhost:3000/api/admin/courses/${courseId}/semesters/${semIndex}/publish`, {
        is_published: nextStatus
      });
      if (res.data.success) {
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            let sems = [];
            if (typeof c.semesters === 'string') {
              try { sems = JSON.parse(c.semesters); } catch (e) {}
            } else {
              sems = c.semesters || [];
            }
            if (sems[semIndex]) {
              sems[semIndex].is_published = nextStatus;
            }
            return { ...c, semesters: sems };
          }
          return c;
        }));
        setFeedback({
          type: 'success',
          text: `Semester status updated to ${nextStatus ? 'Published' : 'Unpublished'}`
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update semester status'
      });
    }
  };

  const handleDeleteCourseClick = async (course: Course) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/admin/courses/${course.id}/usage`);
      if (res.data.success) {
        const { usageCount, centers } = res.data.data;
        setDeleteConfirmModal({
          isOpen: true,
          course,
          usageCount,
          centers: centers || [],
          input: '',
          isDeleting: false
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to check course usage.'
      });
    }
  };

  const handleConfirmDeleteCourse = async () => {
    if (!deleteConfirmModal.course) return;

    if (deleteConfirmModal.usageCount > 0 && deleteConfirmModal.input !== 'DELETE') {
      return;
    }

    try {
      setDeleteConfirmModal(prev => ({ ...prev, isDeleting: true }));
      const res = await axios.delete(`http://localhost:3000/api/admin/courses/${deleteConfirmModal.course.id}`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Course "${deleteConfirmModal.course.name}" has been permanently deleted.`
        });
        setDeleteConfirmModal({ isOpen: false, course: null, usageCount: 0, centers: [], input: '', isDeleting: false });
        fetchData();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete course.'
      });
      setDeleteConfirmModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const getParsedSemesters = (course: Course): Semester[] => {
    if (Array.isArray(course.semesters)) {
      return course.semesters;
    }
    if (typeof course.semesters === 'string') {
      try {
        const parsed = JSON.parse(course.semesters);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [{ num: 1, subjects: course.shortDescription || 'General Modules', marks: 80, oral: 20, marks_per_question: 1, negative_marks: 0, pass_marks: 40 }];
  };

  const filteredCourses = courses.filter((c: any) => {
    if (filterType === 'published' && c.is_published !== 1) return false;
    if (filterType === 'drafts' && c.is_draft !== 1) return false;
    if (filterType === 'unpublished' && (c.is_published === 1 || c.is_draft === 1)) return false;

    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.code && c.code.toLowerCase().includes(query)) ||
      (c.shortDescription && c.shortDescription.toLowerCase().includes(query))
    );
  });

  const renderSemesterInputs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-800">Semester Exam Criteria & Marking Configuration</h4>
          <p className="text-xs text-gray-500">Configure theory marks, oral marks, marks per question, and negative marking.</p>
        </div>
        <button
          type="button"
          onClick={handleAddSemester}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Add Semester
        </button>
      </div>

      {semesters.map((sem, idx) => {
        const thMarks = Number(sem.marks) || 80;
        const ovMarks = Number(sem.oral) || 20;
        const posMarks = sem.marks_per_question !== undefined ? Number(sem.marks_per_question) : 1;
        const negMarks = sem.negative_marks !== undefined ? Number(sem.negative_marks) : 0;
        const passThr = sem.pass_marks !== undefined ? Number(sem.pass_marks) : 40;
        const targetQs = posMarks > 0 ? Math.ceil(thMarks / posMarks) : thMarks;

        return (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#6b6eed] text-white text-xs font-bold flex items-center justify-center">
                  {sem.num}
                </span>
                <span className="font-bold text-gray-800 text-sm">Semester {sem.num}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Total: {thMarks + ovMarks} Marks
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Target: ~{targetQs} Questions
                </span>
              </div>
              {semesters.length > 1 && (
                <button 
                  type="button"
                  onClick={() => handleRemoveSemester(idx)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-bold text-xs mb-1">
                Subjects / Modules <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Fundamental of Computer, MS Word, Excel, PowerPoint"
                value={sem.subjects}
                onChange={(e) => handleSemesterChange(idx, 'subjects', e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:border-[#6b6eed] outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Written Marks *</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={sem.marks}
                  onChange={(e) => handleSemesterChange(idx, 'marks', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center focus:border-[#6b6eed] outline-none" 
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Oral / Viva *</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={sem.oral}
                  onChange={(e) => handleSemesterChange(idx, 'oral', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center focus:border-[#6b6eed] outline-none" 
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">+Marks / Q</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  required
                  value={sem.marks_per_question !== undefined ? sem.marks_per_question : 1}
                  onChange={(e) => handleSemesterChange(idx, 'marks_per_question', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center text-emerald-700 focus:border-[#6b6eed] outline-none" 
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">-Negative / Q</label>
                <input 
                  type="number" 
                  step="0.25"
                  min="0"
                  value={sem.negative_marks !== undefined ? sem.negative_marks : 0}
                  onChange={(e) => handleSemesterChange(idx, 'negative_marks', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center text-red-600 focus:border-[#6b6eed] outline-none" 
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Pass Thr %</label>
                <input 
                  type="number" 
                  min="1"
                  value={sem.pass_marks !== undefined ? sem.pass_marks : 40}
                  onChange={(e) => handleSemesterChange(idx, 'pass_marks', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center text-indigo-700 focus:border-[#6b6eed] outline-none" 
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Master Courses Catalog Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create, edit, publish, and configure syllabus and dynamic marking criteria for courses.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#6b6eed] hover:bg-indigo-600 active:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={18} />
          <span>Add New Master Course</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs border ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2 font-medium text-sm">
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar & View Mode Toggle */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === 'all' 
                ? 'bg-[#6b6eed] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Courses ({courses.length})
          </button>
          <button 
            onClick={() => setFilterType('published')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === 'published' 
                ? 'bg-[#6b6eed] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Published ({courses.filter(c => c.is_published === 1).length})
          </button>
          <button 
            onClick={() => setFilterType('drafts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === 'drafts' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            In-DB Drafts ({courses.filter(c => c.is_draft === 1).length})
          </button>
          <button 
            onClick={() => setFilterType('unpublished')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === 'unpublished' 
                ? 'bg-[#6b6eed] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unpublished ({courses.filter(c => c.is_published !== 1 && c.is_draft !== 1).length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Cards View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <Table size={15} />
              <span className="hidden sm:inline">Table View</span>
            </button>
          </div>

          <div className="w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:border-[#6b6eed] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Courses Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 py-16 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#6b6eed]" size={22} />
            <span className="text-sm font-semibold">Loading master catalog courses...</span>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 py-16 text-center text-gray-500 font-medium">
          No courses found matching your criteria.
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW (Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const sems = getParsedSemesters(course);
            const isPub = course.is_published === 1;
            const totalMarks = sems.reduce((acc, sem) => acc + (Number(sem.marks) || 80) + (Number(sem.oral) || 20), 0);
            const imageSource = course.image_url
              ? (course.image_url.startsWith('http') || course.image_url.startsWith('data:') ? course.image_url : `http://localhost:3000${course.image_url}`)
              : null;

            return (
              <div 
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Course Image Header */}
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden border-b border-gray-100">
                  {imageSource ? (
                    <img 
                      src={imageSource} 
                      alt={course.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/50 text-indigo-400">
                      <BookOpen size={44} className="mb-2 text-[#6b6eed] opacity-70" />
                      <span className="text-xs font-semibold text-gray-400">No Image Uploaded</span>
                    </div>
                  )}

                  {/* Course Code Badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-black font-mono text-gray-800 shadow-xs border border-gray-200/80">
                    {course.code || `CRS-${course.id}`}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {course.is_draft === 1 && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
                        <FileText size={11} /> Draft
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 ${
                      isPub 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-800 text-white'
                    }`}>
                      {isPub ? '● Published' : '○ Unpublished'}
                    </span>
                  </div>

                  {/* Fee Overlay Badge */}
                  <div className="absolute bottom-3 right-3 bg-[#6b6eed] text-white px-3 py-1 rounded-lg text-xs font-black shadow-xs">
                    ₹{course.fee?.toLocaleString() || 0}
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {course.shortDescription || sems.map(s => `Sem ${s.num}: ${s.subjects}`).join(' • ') || 'Comprehensive curriculum with theory, viva, and certification exam.'}
                    </p>

                    {/* Meta info tags */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center gap-1.5 text-gray-700">
                        <Clock size={13} className="text-indigo-600 shrink-0" />
                        <span className="font-semibold truncate">{course.duration || '3 Months'}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center gap-1.5 text-gray-700">
                        <Layers size={13} className="text-indigo-600 shrink-0" />
                        <span className="font-semibold truncate">{sems.length} Semester{sems.length > 1 ? 's' : ''} ({totalMarks} M)</span>
                      </div>
                    </div>

                    {/* Eligibility Badge */}
                    <div className="text-[11px] font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200/80 mb-4 inline-flex items-center gap-1">
                      <span className="text-gray-400">Eligibility:</span>
                      <span className="text-gray-800 font-bold">{course.eligibility || '10th / 12th Pass'}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(course.id, course.is_published)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        isPub 
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={isPub ? 'Click to unpublish' : 'Click to publish course'}
                    >
                      {isPub ? 'Unpublish' : 'Publish Live'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(course)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit Course Details & Exam Criteria"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourseClick(course)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Alternative) */
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#5b67f1] text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center border-r border-indigo-400 w-12">#</th>
                <th className="py-3.5 px-4 text-center border-r border-indigo-400 w-28">Code</th>
                <th className="py-3.5 px-4 border-r border-indigo-400 w-60">Course Info</th>
                <th className="py-3.5 px-4 border-r border-indigo-400">Semester Syllabus & Exam Criteria</th>
                <th className="py-3.5 px-4 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {filteredCourses.map((course, index) => {
                const sems = getParsedSemesters(course);
                const isPub = course.is_published === 1;

                return (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-center border-r border-gray-200 font-medium text-xs">{index + 1}</td>
                    <td className="py-4 px-4 text-center border-r border-gray-200 font-mono text-xs font-bold text-gray-700">
                      {course.code || `CRS-${course.id}`}
                    </td>
                    <td className="py-4 px-4 border-r border-gray-200 align-top">
                      <div className="font-bold text-gray-900 text-sm mb-1">{course.name}</div>
                      <div className="font-semibold text-indigo-700 text-xs">
                        Duration: {course.duration || '3 Month(s)'} | Fee: ₹{course.fee || 0}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {course.is_draft === 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <FileText size={10} className="text-amber-700" /> In-DB Draft
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(course.id, course.is_published)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            isPub 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                          }`}
                          title={isPub ? 'Click to unpublish' : 'Click to publish course'}
                        >
                          {isPub ? '● Published' : (course.is_draft === 1 ? '+ Publish Draft' : '○ Unpublished')}
                        </button>
                      </div>
                    </td>
                    
                    {/* Semester Table */}
                    <td className="py-0 px-0 border-r border-gray-200 align-top">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-[11px] font-bold text-gray-600 border-b border-gray-200">
                          <tr>
                            <th className="p-2 text-center w-12 border-r border-gray-200">Sem</th>
                            <th className="p-2 border-r border-gray-200">Subjects</th>
                            <th className="p-2 text-center w-14 border-r border-gray-200">Theory</th>
                            <th className="p-2 text-center w-14 border-r border-gray-200">Oral</th>
                            <th className="p-2 text-center w-14 border-r border-gray-200">Total</th>
                            <th className="p-2 text-center w-28">Marking Scheme</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sems.map((sem, i) => {
                            const thMarks = Number(sem.marks) || 80;
                            const ovMarks = Number(sem.oral) || 20;
                            const posMarks = sem.marks_per_question !== undefined ? Number(sem.marks_per_question) : 1;
                            const negMarks = sem.negative_marks !== undefined ? Number(sem.negative_marks) : 0;
                            const passThr = sem.pass_marks !== undefined ? Number(sem.pass_marks) : 40;

                            return (
                              <tr key={i} className="hover:bg-indigo-50/30">
                                <td className="p-2 text-center font-bold text-indigo-700 border-r border-gray-100">
                                  SEM {sem.num}
                                </td>
                                <td className="p-2 text-gray-800 border-r border-gray-100 font-medium">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{sem.subjects || 'General Curriculum'}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSemesterPublish(course.id, i, sem.is_published)}
                                      className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                        sem.is_published !== false
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                      }`}
                                    >
                                      {sem.is_published !== false ? '● Published' : '○ Unpublished'}
                                    </button>
                                  </div>
                                </td>
                                <td className="p-2 text-center font-bold text-gray-800 border-r border-gray-100">
                                  {thMarks}
                                </td>
                                <td className="p-2 text-center font-bold text-gray-800 border-r border-gray-100">
                                  {ovMarks}
                                </td>
                                <td className="p-2 text-center font-bold text-emerald-700 border-r border-gray-100">
                                  {thMarks + ovMarks}
                                </td>
                                <td className="p-2 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-gray-700 border border-slate-200">
                                    <span className="text-emerald-700">+{posMarks}</span>
                                    <span>/</span>
                                    <span className="text-red-600">-{negMarks}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-indigo-700">P:{passThr}%</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center align-middle">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 size={13} />
                          <span>Edit Course</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourseClick(course)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Master Course</h3>
                <p className="text-xs text-gray-500">Upload banner image, set syllabus, written/oral exam marks, and negative marking.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCourse} className="p-6 overflow-y-auto space-y-5">
              {/* Course Thumbnail Image Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-gray-700 font-bold text-sm mb-2">
                  Course Thumbnail / Image (S3 Supported)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {courseImage ? (
                    <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-gray-300 shadow-xs shrink-0">
                      <img src={courseImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCourseImage('')}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-xs cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-36 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 shrink-0">
                      <ImageIcon size={26} className="mb-1 text-gray-400" />
                      <span className="text-[10px] font-semibold">No Image</span>
                    </div>
                  )}
                  <div className="flex-1 w-full text-left">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-2xs cursor-pointer transition-colors">
                      <Upload size={14} className="text-[#6b6eed]" />
                      <span>{courseImage ? 'Change Image' : 'Upload Course Image'}</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/jpg" 
                        className="hidden" 
                        onChange={handleImageFileChange} 
                      />
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Upload PNG, JPG or WebP (Max 5MB). Automatically saved to cloud storage & public courses page.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1.5">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={90}
                  placeholder="e.g. Diploma in Computer Applications (DCA)"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Course Code (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DCA-101"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Course Base Fee (₹)</label>
                  <input 
                    type="number" 
                    value={courseFee}
                    onChange={(e) => setCourseFee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Course Duration <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Duration Type <span className="text-red-500">*</span></label>
                  <select 
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none font-semibold bg-white"
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Eligibility</label>
                  <input 
                    type="text" 
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. 10th / 12th Pass"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1.5">
                  Short Description / Overview (Optional)
                </label>
                <textarea 
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief overview shown on cards and course detail page..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                />
              </div>

              {renderSemesterInputs()}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2.5">
                  <button 
                    type="button" 
                    disabled={submitting}
                    onClick={() => handleCreateCourse(undefined, 'draft')}
                    className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-xs"
                    title="Save this course directly in database as Draft (Hidden from all study centers)"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} className="text-amber-700" />}
                    <span>Save as Draft (In Database)</span>
                  </button>
                  <button 
                    type="button" 
                    disabled={submitting}
                    onClick={() => handleCreateCourse(undefined, 'publish')}
                    className="px-6 py-2.5 bg-[#6b6eed] hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-xs"
                    title="Publish this master course live to study centers"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    <span>Publish Course Directly</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Master Course & Exam Criteria</h3>
                <p className="text-xs text-gray-500">Edit {editingCourse.name} ({editingCourse.code || `CRS-${editingCourse.id}`})</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCourse(null);
                }} 
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCourse} className="p-6 overflow-y-auto space-y-5">
              {/* Course Thumbnail Image Upload */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-gray-700 font-bold text-sm mb-2">
                  Course Thumbnail / Image (S3 Supported)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {courseImage ? (
                    <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-gray-300 shadow-xs shrink-0">
                      <img 
                        src={courseImage.startsWith('http') || courseImage.startsWith('data:') ? courseImage : `http://localhost:3000${courseImage}`} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setCourseImage('')}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-xs cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-36 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 shrink-0">
                      <ImageIcon size={26} className="mb-1 text-gray-400" />
                      <span className="text-[10px] font-semibold">No Image</span>
                    </div>
                  )}
                  <div className="flex-1 w-full text-left">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-2xs cursor-pointer transition-colors">
                      <Upload size={14} className="text-[#6b6eed]" />
                      <span>{courseImage ? 'Change Image' : 'Upload Course Image'}</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/jpg" 
                        className="hidden" 
                        onChange={handleImageFileChange} 
                      />
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Upload PNG, JPG or WebP (Max 5MB). Automatically saved to cloud storage & public courses page.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1.5">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={90}
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Course Code (Optional)</label>
                  <input 
                    type="text" 
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Course Base Fee (₹)</label>
                  <input 
                    type="number" 
                    value={courseFee}
                    onChange={(e) => setCourseFee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Course Duration <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Duration Type <span className="text-red-500">*</span></label>
                  <select 
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none font-semibold bg-white"
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Eligibility</label>
                  <input 
                    type="text" 
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. 10th / 12th Pass"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1.5">
                  Short Description / Overview (Optional)
                </label>
                <textarea 
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief overview shown on cards and course detail page..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] outline-none" 
                />
              </div>

              {renderSemesterInputs()}

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCourse(null);
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#6b6eed] hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-sm"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{submitting ? 'Updating Course...' : 'Save & Update Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmModal.isOpen && deleteConfirmModal.course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Course?</h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to permanently delete <span className="font-bold text-gray-900">"{deleteConfirmModal.course.name}"</span>?
            </p>
            {deleteConfirmModal.usageCount > 0 && (
              <div className="mb-4 text-left p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <p className="font-bold mb-1">Warning: Course in use by {deleteConfirmModal.usageCount} center(s).</p>
                <p>Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm.</p>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmModal.input}
                  onChange={(e) => setDeleteConfirmModal(prev => ({ ...prev, input: e.target.value }))}
                  className="w-full mt-2 p-2 border border-gray-300 rounded bg-white text-xs font-mono font-bold uppercase"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, course: null, usageCount: 0, centers: [], input: '', isDeleting: false })}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={deleteConfirmModal.isDeleting || (deleteConfirmModal.usageCount > 0 && deleteConfirmModal.input !== 'DELETE')}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {deleteConfirmModal.isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCKED UNPUBLISH WARNING MODAL (Cannot unpublish if centers are using it) */}
      {blockedUnpublishModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-red-200">
            <div className="p-6 bg-red-50/70 border-b border-red-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-red-100 text-red-600 border border-red-200">
                <ShieldAlert size={26} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-200 text-red-900">
                  Unpublish Blocked
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">Cannot Unpublish Course</h3>
                <p className="text-xs text-red-800 font-medium mt-0.5">
                  This course is actively in use by study centers and cannot be unpublished.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                Super Admin, <strong className="text-gray-900 font-bold">"{blockedUnpublishModal.courseName}"</strong> is actively assigned to the following study center(s):
              </p>

              {/* List of Centers Using This Course */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-gray-100 rounded-xl p-2 bg-slate-50/60">
                {blockedUnpublishModal.centers.map((cnt: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{cnt.name}</div>
                        <div className="text-[10px] text-indigo-600 font-mono font-semibold">Code: {cnt.center_code}</div>
                      </div>
                    </div>
                    {cnt.student_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                        <Users size={10} />
                        {cnt.student_count} Students
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  To unpublish this course, the centers above must first remove it from their enrolled courses list, or existing students under this course must be transitioned.
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockedUnpublishModal({ isOpen: false, courseName: '', centers: [] })}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Understood, Keep Course Published
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCourses;
