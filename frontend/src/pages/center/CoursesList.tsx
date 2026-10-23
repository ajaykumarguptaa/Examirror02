import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Plus, X, Trash2, CheckCircle2, AlertCircle, ChevronDown, HelpCircle, Loader2, AlertTriangle, Edit3, Check, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useDebounce } from '../../hooks/useDebounce';

interface Semester {
  num: number;
  subjects: string;
  marks: number;
  oral: number;
  marks_per_question?: number;
  negative_marks?: number;
  pass_marks?: number;
}

interface Course {
  id: number;
  code: string;
  name: string;
  categoryId?: string;
  fee: number;
  shortDescription?: string;
  duration?: string;
  semesters?: string | Semester[];
  questionsCount?: number;
  semesterQuestions?: Record<string, number>;
  created_by_type?: string;
}

interface Question {
  id: number;
  courseId: number;
  semester: string;
  question: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correct: string;
  marks?: number;
}

const CoursesList = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) {}
    return 1;
  };
  const centerId = getCenterId();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Manage / Add Question Modal
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState('SEM 1');
  const [viewFilterSemester, setViewFilterSemester] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [courseQuestions, setCourseQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // New Question Form State
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [questionMarks, setQuestionMarks] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Course Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editDurationValue, setEditDurationValue] = useState('3');
  const [editDurationType, setEditDurationType] = useState('Months');
  const [editCourseFee, setEditCourseFee] = useState('1500');
  const [editSemesters, setEditSemesters] = useState<Semester[]>([]);
  const [updatingCourse, setUpdatingCourse] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/center/${centerId}/courses`);
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Confirmation Modals State
  const [deactivateTarget, setDeactivateTarget] = useState<Course | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<number | null>(null);

  const confirmDeactivateCourse = async () => {
    if (!deactivateTarget) return;

    try {
      setDeactivating(true);
      const res = await axios.delete(`http://localhost:3000/api/center/${centerId}/courses/${deactivateTarget.id}`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Course "${deactivateTarget.name}" has been deactivated from your center course list.`
        });
        setDeactivateTarget(null);
        window.dispatchEvent(new Event('center-stats-updated'));
        fetchCourses();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to deactivate course.'
      });
    } finally {
      setDeactivating(false);
    }
  };

  const getSemesterQuestionCount = (course: Course, semNum: number | string): number => {
    if (!course.semesterQuestions) return 0;
    const key1 = `SEM ${semNum}`.toUpperCase();
    const key2 = `SEM-${semNum}`.toUpperCase();
    const key3 = `SEMESTER ${semNum}`.toUpperCase();
    const key4 = String(semNum).toUpperCase();
    return (
      course.semesterQuestions[key1] ||
      course.semesterQuestions[key2] ||
      course.semesterQuestions[key3] ||
      course.semesterQuestions[key4] ||
      0
    );
  };

  const handleDeactivateClick = (course: Course) => {
    setDeactivateTarget(course);
  };

  const handleOpenAddQuestion = (course: Course, semNum?: number) => {
    setActiveCourse(course);
    const targetSem = semNum ? `SEM ${semNum}` : 'SEM 1';
    setSelectedSemester(targetSem);
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOption('A');

    // Get default marks per question from semester config
    const sems = getParsedSemesters(course);
    const semConfig = sems.find(s => `SEM ${s.num}` === targetSem || String(s.num) === targetSem.replace('SEM ', ''));
    setQuestionMarks(semConfig?.marks_per_question !== undefined ? Number(semConfig.marks_per_question) : 1);

    setIsAddModalOpen(true);
  };

  const handleOpenViewQuestions = async (course: Course, semNum?: number) => {
    setActiveCourse(course);
    setSelectedSemester(semNum ? `SEM ${semNum}` : 'SEM 1');
    setViewFilterSemester(semNum ? `SEM ${semNum}` : 'ALL');
    setIsViewModalOpen(true);
    try {
      setLoadingQuestions(true);
      const res = await axios.get(`http://localhost:3000/api/center/courses/${course.id}/questions`);
      if (res.data.success) {
        setCourseQuestions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;

    try {
      setSubmitting(true);
      const res = await axios.post(`http://localhost:3000/api/center/courses/${activeCourse.id}/questions`, {
        question: questionText.trim(),
        optA: optA.trim(),
        optB: optB.trim(),
        optC: optC.trim(),
        optD: optD.trim(),
        correct: correctOption,
        semester: selectedSemester,
        marks: Number(questionMarks) || 1
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Exam question (+${questionMarks} marks) added successfully to ${selectedSemester} for ${activeCourse.name}!`
        });
        setIsAddModalOpen(false);
        fetchCourses();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save question'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    try {
      const res = await axios.delete(`http://localhost:3000/api/center/courses/questions/${qId}`);
      if (res.data.success) {
        setCourseQuestions(prev => prev.filter(q => q.id !== qId));
        setDeleteQuestionTarget(null);
        fetchCourses();
      }
    } catch (err: any) {
      console.error('Failed to delete question', err);
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
    return [{ num: 1, subjects: course.shortDescription || 'General Course Modules', marks: 80, oral: 20, marks_per_question: 1, negative_marks: 0, pass_marks: 40 }];
  };

  // Open Edit Course Modal
  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name || '');
    setEditCourseCode(course.code || '');

    const durParts = (course.duration || '3 Months').split(' ');
    setEditDurationValue(durParts[0] || '3');
    setEditDurationType(durParts[1] || 'Months');
    setEditCourseFee(String(course.fee || 1500));

    const sems = getParsedSemesters(course);
    setEditSemesters(sems.map(s => ({
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

  const handleAddEditSemester = () => {
    setEditSemesters(prev => [
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

  const handleRemoveEditSemester = (index: number) => {
    if (editSemesters.length <= 1) return;
    setEditSemesters(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, num: i + 1 })));
  };

  const handleEditSemesterChange = (index: number, field: keyof Semester, value: any) => {
    setEditSemesters(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSaveCourseUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setUpdatingCourse(true);
      const durationStr = `${editDurationValue} ${editDurationType}`;
      const payload = {
        name: editCourseName.trim(),
        code: editCourseCode.trim() || undefined,
        duration: durationStr,
        fee: Number(editCourseFee) || 0,
        categoryId: editingCourse.categoryId || 'Certificate',
        shortDescription: editSemesters.map(s => `Sem ${s.num}: ${s.subjects}`).join('; '),
        semesters: editSemesters
      };

      const res = await axios.put(`http://localhost:3000/api/center/courses/${editingCourse.id}`, payload);

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Course "${editCourseName}" and marking criteria updated successfully!`
        });
        setIsEditModalOpen(false);
        setEditingCourse(null);
        fetchCourses();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update course criteria.'
      });
    } finally {
      setUpdatingCourse(false);
    }
  };

  // Memoized & Debounced Course Filtering
  const filteredCourses = useMemo(() => {
    const q = debouncedSearchTerm.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.shortDescription && c.shortDescription.toLowerCase().includes(q))
    );
  }, [courses, debouncedSearchTerm]);

  const totalEntries = filteredCourses.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + entriesPerPage);

  const filteredViewQuestions = courseQuestions.filter((q) => {
    if (viewFilterSemester === 'ALL') return true;
    return q.semester === viewFilterSemester;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className={`mb-5 p-4 rounded-xl flex items-center justify-between border shadow-xs ${
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

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        
        {/* Header Controls */}
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Center Enrolled Courses</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage course syllabus, theory/viva marks, negative marking, and question banks.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Show Entries */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold outline-none focus:border-[#5b67f1] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search Input */}
            <div className="relative flex-grow md:w-64">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#5b67f1] bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#5b67f1] text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 text-center border-r border-indigo-400 w-32">Course ID</th>
                <th className="py-3 px-6 border-r border-indigo-400">Course Syllabus & Exam Criteria</th>
                <th className="py-3 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-[#5b67f1]" size={20} />
                      <span>Loading your courses...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCourses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-500 font-medium">
                    No courses found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((course) => {
                  const sems = getParsedSemesters(course);

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Left Column: ID & Deactivate */}
                      <td className="py-6 px-4 text-center border-r border-gray-200 align-middle">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <span className="text-sm font-bold text-gray-800">
                            #{course.id}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {course.code || `CRS-${course.id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeactivateClick(course)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="Remove from center active courses"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>

                      {/* Middle Column: Details & Semesters Table */}
                      <td className="py-4 px-6 align-top border-r border-gray-200">
                        <div className="space-y-3">
                          
                          {/* Course Name Header & Total Questions Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-base">
                                {course.name}
                              </span>
                              <span className="text-xs text-gray-500 font-medium">
                                ({course.duration || '3 Months'})
                              </span>
                            </div>

                            {/* Total Questions Count Badge */}
                            <div className="flex items-center gap-2">
                              {(course.questionsCount || 0) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewQuestions(course)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                  title="View all exam questions"
                                >
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  <span>{course.questionsCount} Total Questions Added</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddQuestion(course)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs px-3 py-1 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Add exam questions before admitting students"
                                >
                                  <AlertCircle size={13} className="text-amber-600" />
                                  <span>0 Questions (Setup Required)</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Semesters Table */}
                          <div className="w-full overflow-hidden border border-gray-200 rounded-lg">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 text-[11px] font-bold text-gray-600 border-b border-gray-200">
                                <tr>
                                  <th className="p-2 text-center w-16 border-r border-gray-200">Sem</th>
                                  <th className="p-2 border-r border-gray-200">Subjects</th>
                                  <th className="p-2 text-center w-14 border-r border-gray-200" title="Written Theory Max Marks">Theory</th>
                                  <th className="p-2 text-center w-14 border-r border-gray-200" title="Viva / Oral Max Marks">Oral</th>
                                  <th className="p-2 text-center w-14 border-r border-gray-200" title="Total Marks">Total</th>
                                  <th className="p-2 text-center w-28 border-r border-gray-200" title="Marking Rules">Marking Scheme</th>
                                  <th className="p-2 text-center w-28 border-r border-gray-200">Questions</th>
                                  <th className="p-2 text-center w-20">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {sems.map((sem, sIdx) => {
                                  const semQCount = getSemesterQuestionCount(course, sem.num);
                                  const thMarks = Number(sem.marks) || 80;
                                  const ovMarks = Number(sem.oral) || 20;
                                  const posMarks = sem.marks_per_question !== undefined ? Number(sem.marks_per_question) : 1;
                                  const negMarks = sem.negative_marks !== undefined ? Number(sem.negative_marks) : 0;
                                  const passThr = sem.pass_marks !== undefined ? Number(sem.pass_marks) : 40;
                                  const targetQs = posMarks > 0 ? Math.ceil(thMarks / posMarks) : thMarks;

                                  return (
                                    <tr key={sIdx} className="hover:bg-indigo-50/30 transition-colors">
                                      <td className="p-2.5 text-center font-bold text-indigo-700 border-r border-gray-100">
                                        SEM {sem.num}
                                      </td>
                                      <td className="p-2.5 text-gray-800 border-r border-gray-100 font-medium leading-relaxed">
                                        {sem.subjects}
                                      </td>
                                      <td className="p-2.5 text-center font-bold text-gray-800 border-r border-gray-100">
                                        {thMarks}
                                      </td>
                                      <td className="p-2.5 text-center font-bold text-gray-800 border-r border-gray-100">
                                        {ovMarks}
                                      </td>
                                      <td className="p-2.5 text-center font-bold text-emerald-700 border-r border-gray-100">
                                        {thMarks + ovMarks}
                                      </td>
                                      <td className="p-2.5 text-center border-r border-gray-100">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-gray-700 border border-slate-200">
                                          <span className="text-emerald-700">+{posMarks}</span>
                                          <span>/</span>
                                          <span className="text-red-600">-{negMarks}</span>
                                          <span className="text-gray-400">|</span>
                                          <span className="text-indigo-700">P:{passThr}%</span>
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-center border-r border-gray-100">
                                        {semQCount > 0 ? (
                                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 inline-block border border-emerald-200">
                                            {semQCount} / ~{targetQs} Qs
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenAddQuestion(course, sem.num)}
                                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <Plus size={11} className="text-amber-600" />
                                            <span>0 / ~{targetQs} Qs (Add)</span>
                                          </button>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {/* View Questions */}
                                          <button
                                            type="button"
                                            title={`View Exam Questions for SEM ${sem.num}`}
                                            onClick={() => handleOpenViewQuestions(course, sem.num)}
                                            className="w-6 h-6 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                                          >
                                            <Eye size={12} />
                                          </button>

                                          {/* Add Question */}
                                          <button
                                            type="button"
                                            title={`Add Exam Question for SEM ${sem.num}`}
                                            onClick={() => handleOpenAddQuestion(course, sem.num)}
                                            className="w-6 h-6 bg-[#5b67f1] hover:bg-indigo-600 text-white rounded flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                                          >
                                            <Plus size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                        </div>
                      </td>

                      {/* Right Action Column: Edit Course Button */}
                      <td className="py-6 px-4 text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(course)}
                            className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Edit Course Name, Code, Written/Viva Marks & Criteria"
                          >
                            <Edit3 size={13} />
                            <span>Edit Course</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddQuestion(course)}
                            className="w-full py-2 px-3 bg-[#5b67f1] hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Add Exam Question"
                          >
                            <Plus size={13} />
                            <span>+ Question</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
          <div className="text-xs text-gray-600 font-medium">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#5b67f1] text-white border border-[#5b67f1]'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* EDIT COURSE & MARKING CRITERIA MODAL */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Course & Exam Criteria</h3>
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
            
            <form onSubmit={handleSaveCourseUpdate} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1.5">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={90}
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#5b67f1] focus:ring-1 focus:ring-[#5b67f1] outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#5b67f1] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Base Fee (₹)
                  </label>
                  <input 
                    type="number" 
                    value={editCourseFee}
                    onChange={(e) => setEditCourseFee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#5b67f1] outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Duration <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={editDurationValue}
                    onChange={(e) => setEditDurationValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#5b67f1] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Duration Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={editDurationType}
                    onChange={(e) => setEditDurationType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#5b67f1] outline-none font-semibold bg-white"
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
              </div>

              {/* Semesters list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800">Semester Exam Criteria & Marking Configuration</h4>
                  <button
                    type="button"
                    onClick={handleAddEditSemester}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Semester
                  </button>
                </div>

                {editSemesters.map((sem, idx) => {
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
                          <span className="w-6 h-6 rounded-full bg-[#5b67f1] text-white text-xs font-bold flex items-center justify-center">
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
                        {editSemesters.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => handleRemoveEditSemester(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold text-xs mb-1">
                          Subjects / Syllabus Modules <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          value={sem.subjects}
                          onChange={(e) => handleEditSemesterChange(idx, 'subjects', e.target.value)}
                          className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:border-[#5b67f1] outline-none" 
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
                            onChange={(e) => handleEditSemesterChange(idx, 'marks', Number(e.target.value))}
                            className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center focus:border-[#5b67f1] outline-none" 
                          />
                          <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 80</span>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-bold text-xs mb-1">Viva / Oral *</label>
                          <input 
                            type="number" 
                            min="0"
                            required
                            value={sem.oral}
                            onChange={(e) => handleEditSemesterChange(idx, 'oral', Number(e.target.value))}
                            className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center focus:border-[#5b67f1] outline-none" 
                          />
                          <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 20</span>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-bold text-xs mb-1">+Marks / Q</label>
                          <input 
                            type="number" 
                            step="0.5"
                            min="0.5"
                            required
                            value={sem.marks_per_question !== undefined ? sem.marks_per_question : 1}
                            onChange={(e) => handleEditSemesterChange(idx, 'marks_per_question', Number(e.target.value))}
                            className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center text-emerald-700 focus:border-[#5b67f1] outline-none" 
                          />
                          <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. +1</span>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-bold text-xs mb-1">-Negative / Q</label>
                          <input 
                            type="number" 
                            step="0.25"
                            min="0"
                            value={sem.negative_marks !== undefined ? sem.negative_marks : 0}
                            onChange={(e) => handleEditSemesterChange(idx, 'negative_marks', Number(e.target.value))}
                            className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center text-red-600 focus:border-[#5b67f1] outline-none" 
                          />
                          <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 0 or 0.25</span>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-bold text-xs mb-1">Pass Thr %</label>
                          <input 
                            type="number" 
                            min="1"
                            value={sem.pass_marks !== undefined ? sem.pass_marks : 40}
                            onChange={(e) => handleEditSemesterChange(idx, 'pass_marks', Number(e.target.value))}
                            className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold text-center text-indigo-700 focus:border-[#5b67f1] outline-none" 
                          />
                          <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 40%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCourse(null);
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updatingCourse}
                  className="px-6 py-2.5 bg-[#5b67f1] hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-sm"
                >
                  {updatingCourse ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{updatingCourse ? 'Updating Course...' : 'Save & Update Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Question Modal */}
      {isAddModalOpen && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#5b67f1] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Add Exam Question for {selectedSemester}</h3>
                <p className="text-xs text-indigo-100">{activeCourse.name} ({activeCourse.code || `CRS-${activeCourse.id}`})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto space-y-4">
              
              {/* Semester Selector & Question Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Semester *</label>
                  <div className="relative">
                    <select
                      value={selectedSemester}
                      onChange={(e) => {
                        const newSem = e.target.value;
                        setSelectedSemester(newSem);
                        const sems = getParsedSemesters(activeCourse);
                        const semConfig = sems.find(s => `SEM ${s.num}` === newSem || String(s.num) === newSem.replace('SEM ', ''));
                        if (semConfig?.marks_per_question) {
                          setQuestionMarks(Number(semConfig.marks_per_question));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#5b67f1] bg-white cursor-pointer font-semibold appearance-none"
                    >
                      {getParsedSemesters(activeCourse).map((sem) => {
                        const semCount = getSemesterQuestionCount(activeCourse, sem.num);
                        return (
                          <option key={sem.num} value={`SEM ${sem.num}`}>
                            SEM {sem.num} ({semCount} questions configured)
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} className="text-gray-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Question Marks *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={questionMarks}
                    onChange={(e) => setQuestionMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:border-[#5b67f1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Question Statement *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter the exam question here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#5b67f1]"
                ></textarea>
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    placeholder="Option A value"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#5b67f1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    placeholder="Option B value"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#5b67f1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Option C *</label>
                  <input
                    type="text"
                    required
                    placeholder="Option C value"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#5b67f1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Option D *</label>
                  <input
                    type="text"
                    required
                    placeholder="Option D value"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#5b67f1]"
                  />
                </div>
              </div>

              {/* Correct Answer Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Correct Answer Option: *</label>
                <div className="grid grid-cols-4 rounded-lg overflow-hidden border border-emerald-500">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setCorrectOption(opt)}
                      className={`py-2 text-sm font-bold border-r border-emerald-500 last:border-r-0 transition-colors cursor-pointer ${
                        correctOption === opt
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-gray-800 hover:bg-emerald-50'
                      }`}
                    >
                      Option {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#5b67f1] hover:bg-indigo-600 text-white rounded-xl font-bold shadow-sm text-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : `Save Question for ${selectedSemester}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Questions Modal */}
      {isViewModalOpen && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="bg-[#5b67f1] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Course Exam Questions & Question Bank</h3>
                <p className="text-xs text-indigo-100">{activeCourse.name} ({activeCourse.code || `CRS-${activeCourse.id}`})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Filter Tabs by Semester */}
            <div className="p-3 bg-slate-50 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setViewFilterSemester('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  viewFilterSemester === 'ALL'
                    ? 'bg-[#5b67f1] text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                All Semesters ({courseQuestions.length})
              </button>
              {getParsedSemesters(activeCourse).map((sem) => {
                const sName = `SEM ${sem.num}`;
                const count = courseQuestions.filter(q => q.semester === sName).length;
                return (
                  <button
                    key={sem.num}
                    type="button"
                    onClick={() => setViewFilterSemester(sName)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      viewFilterSemester === sName
                        ? 'bg-[#5b67f1] text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {sName} ({count})
                  </button>
                );
              })}
            </div>

            {/* Questions List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-grow bg-slate-50/50">
              {loadingQuestions ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="animate-spin text-[#5b67f1] mx-auto mb-2" size={24} />
                  <span>Loading exam questions...</span>
                </div>
              ) : filteredViewQuestions.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="font-semibold text-sm">No exam questions configured for this semester yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenAddQuestion(activeCourse, viewFilterSemester !== 'ALL' ? Number(viewFilterSemester.replace('SEM ', '')) : 1);
                    }}
                    className="mt-3 px-4 py-2 bg-[#5b67f1] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-600 transition-colors cursor-pointer"
                  >
                    + Add First Question
                  </button>
                </div>
              ) : (
                filteredViewQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          Q{idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {q.semester}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          +{q.marks || 1} Marks
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-gray-900">{q.question}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const isCorrect = q.correct.toUpperCase() === opt;
                        const optVal = (q as any)[`opt${opt}`];
                        return (
                          <div
                            key={opt}
                            className={`p-2 rounded-lg border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <span className="font-bold mr-1.5">{opt}:</span>
                            <span>{optVal}</span>
                            {isCorrect && <span className="ml-1.5 text-emerald-600 text-[10px] font-bold">✓ (Correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Total: {filteredViewQuestions.length} questions in view</span>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Deactivate Course?</h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to deactivate <span className="font-bold text-gray-900">"{deactivateTarget.name}"</span>? It will no longer appear in your active courses.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivateCourse}
                disabled={deactivating}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {deactivating ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoursesList;
