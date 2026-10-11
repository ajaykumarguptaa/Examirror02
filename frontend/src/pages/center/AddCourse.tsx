import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Check, Edit3, HelpCircle } from 'lucide-react';
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
  total_marks?: number;
  num_questions?: number;
}

interface Course {
  id: number;
  code: string;
  name: string;
  duration?: string;
  fee?: number;
  shortDescription?: string;
  semesters?: string | Semester[];
  questionsCount?: number;
  created_by_type?: string;
  created_by_id?: number | null;
}

interface PopupState {
  isOpen: boolean;
  type: 'duplicate' | 'success';
  title: string;
  message: string;
  courseName?: string;
}

const AddCourse = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && u.id) return Number(u.id);
    } catch (_) {}
    return 1;
  };
  const centerId = getCenterId();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [centerCourseIds, setCenterCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingCourseId, setAddingCourseId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);

  // Modal Form State (Create / Edit)
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [durationValue, setDurationValue] = useState('3');
  const [durationType, setDurationType] = useState('Months');
  const [courseFee, setCourseFee] = useState('1500');
  const [semesters, setSemesters] = useState<Semester[]>([
    { num: 1, subjects: '', marks: 80, oral: 20, marks_per_question: 1.6, negative_marks: 0, pass_marks: 40, total_marks: 100, num_questions: 50 }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, idsRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/center/courses?centerId=${centerId}`),
        axios.get(`http://localhost:3000/api/center/${centerId}/course-ids`)
      ]);

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || []);
      }
      if (idsRes.data.success) {
        setCenterCourseIds(idsRes.data.data || []);
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
        marks_per_question: 1.6, 
        negative_marks: 0, 
        pass_marks: 40,
        total_marks: 100,
        num_questions: 50
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
      prev.map((sem, i) => {
        if (i !== index) return sem;
        
        const newSem = { ...sem, [field]: value };
        
        // Ensure constraints
        if (field === 'num_questions' && Number(value) < 16) {
          newSem.num_questions = 16;
        }

        // Auto calculations
        const total = Number(newSem.total_marks) || 100;
        
        if (field === 'total_marks' || field === 'oral') {
           const oral = Number(newSem.oral) || 0;
           newSem.marks = total - oral;
        } else if (field === 'marks') {
           const marks = Number(newSem.marks) || 0;
           newSem.oral = total - marks;
        }

        // Calculate marks per question based on Written Marks (marks) and Num Qs
        const writtenMarks = Number(newSem.marks) || 0;
        const questions = Number(newSem.num_questions) || 16;
        newSem.marks_per_question = parseFloat((writtenMarks / Math.max(questions, 16)).toFixed(2));
        
        return newSem;
      })
    );
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseCode('');
    setDurationValue('3');
    setDurationType('Months');
    setCourseFee('1500');
    setSemesters([{ num: 1, subjects: '', marks: 80, oral: 20, marks_per_question: 1.6, negative_marks: 0, pass_marks: 40, total_marks: 100, num_questions: 50 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name || '');
    setCourseCode(course.code || '');
    
    // Parse duration
    const durParts = (course.duration || '3 Months').split(' ');
    setDurationValue(durParts[0] || '3');
    setDurationType(durParts[1] || 'Months');
    setCourseFee(String(course.fee || 1500));

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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

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
        shortDescription: semesters.map(s => `Sem ${s.num}: ${s.subjects}`).join('; '),
        semesters: semesters,
        createdByType: 'center',
        createdById: centerId
      };

      const res = await axios.post('http://localhost:3000/api/center/courses', payload);

      if (res.data.success) {
        const newCourseId = res.data.courseId;
        if (newCourseId) {
          await axios.post(`http://localhost:3000/api/center/${centerId}/courses/add`, {
            courseId: newCourseId
          });
        }

        setFeedback({
          type: 'success',
          text: `Course "${courseName}" created with customized exam criteria and added to your list!`
        });
        setFilterType('all');
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
        shortDescription: semesters.map(s => `Sem ${s.num}: ${s.subjects}`).join('; '),
        semesters: semesters
      };

      const res = await axios.put(`http://localhost:3000/api/center/courses/${editingCourse.id}`, payload);

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

  const handleAddThisCourse = async (course: Course) => {
    if (centerCourseIds.includes(course.id)) {
      setPopup({
        isOpen: true,
        type: 'duplicate',
        title: 'Course Already Exists',
        message: 'The course is already been added in course list. Will not add duplicate course in course list.',
        courseName: course.name
      });
      return;
    }

    try {
      setAddingCourseId(course.id);
      const res = await axios.post(`http://localhost:3000/api/center/${centerId}/courses/add`, {
        courseId: course.id
      });

      if (res.data.alreadyAdded) {
        setPopup({
          isOpen: true,
          type: 'duplicate',
          title: 'Course Already Exists',
          message: 'The course is already been added in course list. Will not add duplicate course in course list.',
          courseName: course.name
        });
        if (!centerCourseIds.includes(course.id)) {
          setCenterCourseIds(prev => [...prev, course.id]);
        }
      } else if (res.data.success) {
        setCenterCourseIds(prev => [...prev, course.id]);
        window.dispatchEvent(new Event('center-stats-updated'));
        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Course Added Successfully',
          message: `"${course.name}" has been added to your Courses List!`,
          courseName: course.name
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add course to your center list.'
      });
    } finally {
      setAddingCourseId(null);
    }
  };

  const getParsedSemesters = (course: Course): Semester[] => {
    let parsedSems: Semester[] = [];
    if (Array.isArray(course.semesters)) {
      parsedSems = course.semesters;
    } else if (typeof course.semesters === 'string') {
      try {
        const parsed = JSON.parse(course.semesters);
        if (Array.isArray(parsed)) parsedSems = parsed;
      } catch (_) {}
    }
    
    if (parsedSems.length === 0) {
      return [{ num: 1, subjects: course.shortDescription || 'General Modules', marks: 80, oral: 20, marks_per_question: 1.6, negative_marks: 0, pass_marks: 40, total_marks: 100, num_questions: 50 }];
    }

    return parsedSems.map(s => {
      const marks = Number(s.marks) || 80;
      const oral = Number(s.oral) || 20;
      const mpq = Number(s.marks_per_question) || 1;
      return {
        ...s,
        total_marks: s.total_marks || (marks + oral),
        num_questions: s.num_questions || (mpq > 0 ? Math.ceil(marks / mpq) : 50)
      };
    });
  };

  const filteredCourses = courses.filter((c: any) => {
    if (filterType === 'admin' && c.created_by_type !== 'admin') return false;
    if (filterType === 'center' && c.created_by_type !== 'center') return false;

    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.code && c.code.toLowerCase().includes(query)) ||
      (c.shortDescription && c.shortDescription.toLowerCase().includes(query))
    );
  });

  // Render Semester Input Fields (Reusable for Add & Edit Modal)
  const renderSemesterInputs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-800">Semester Exam Criteria & Marking Configuration</h4>
          <p className="text-xs text-gray-500">Configure written theory marks, viva/oral marks, positive marks per question, and negative marking per wrong answer.</p>
        </div>
        <button
          type="button"
          onClick={handleAddSemester}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus size={14} /> Add Semester
        </button>
      </div>

      {semesters.map((sem, idx) => {
        const theoryMarks = Number(sem.marks) || 80;
        const vivaMarks = Number(sem.oral) || 20;
        const totalMarks = theoryMarks + vivaMarks;
        const marksPerQ = Number(sem.marks_per_question) || 1;
        const negMarks = Number(sem.negative_marks) || 0;
        const passMarks = Number(sem.pass_marks) || 40;
        const targetQs = marksPerQ > 0 ? Math.ceil(theoryMarks / marksPerQ) : theoryMarks;

        return (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#6b6eed] text-white text-xs font-bold flex items-center justify-center">
                  {sem.num}
                </span>
                <span className="font-bold text-gray-800 text-sm">Semester {sem.num}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Total: {sem.total_marks || totalMarks} Marks
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full" title="Target Questions">
                  Target: ~{sem.num_questions || targetQs} Questions
                </span>
              </div>
              {semesters.length > 1 && (
                <button 
                  type="button"
                  onClick={() => handleRemoveSemester(idx)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                  title="Remove Semester"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Subjects Input */}
            <div>
              <label className="block text-gray-700 font-bold text-xs mb-1">
                Subjects / Syllabus Modules <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Fundamental of Computer, MS Word, Excel, PowerPoint, Internet"
                value={sem.subjects}
                onChange={(e) => handleSemesterChange(idx, 'subjects', e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
              />
            </div>

            {/* Marking Criteria Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">
                  Total Marks <span className="text-indigo-600">*</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={sem.total_marks}
                  onChange={(e) => handleSemesterChange(idx, 'total_marks', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold focus:border-[#6b6eed] outline-none text-center" 
                />
                <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 100</span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1" title="Maximum Viva / Oral Marks">
                  Viva / Oral <span className="text-indigo-600">*</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={sem.oral}
                  onChange={(e) => handleSemesterChange(idx, 'oral', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold focus:border-[#6b6eed] outline-none text-center" 
                />
                <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 20</span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1" title="Maximum Written Theory Marks">
                  Written Marks <span className="text-indigo-600">*</span>
                </label>
                <input 
                  type="number" 
                  readOnly
                  value={sem.marks}
                  className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2 text-sm font-semibold outline-none text-center cursor-not-allowed" 
                />
                <span className="text-[10px] text-gray-400 block text-center mt-0.5">Auto-calculated</span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1" title="Target number of questions">
                  Questions <span className="text-indigo-600">*</span>
                </label>
                <input 
                  type="number" 
                  min="16"
                  required
                  value={sem.num_questions}
                  onChange={(e) => handleSemesterChange(idx, 'num_questions', Number(e.target.value))}
                  onBlur={(e) => {
                    if (Number(e.target.value) < 16) handleSemesterChange(idx, 'num_questions', 16);
                  }}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold focus:border-[#6b6eed] outline-none text-center" 
                />
                <span className="text-[10px] text-gray-500 block text-center mt-0.5">Min 16</span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1" title="Positive Marks awarded per correct answer">
                  +Marks / Q
                </label>
                <input 
                  type="number" 
                  readOnly
                  value={sem.marks_per_question}
                  className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2 text-sm font-semibold outline-none text-center text-emerald-700 cursor-not-allowed" 
                />
                <span className="text-[10px] text-gray-400 block text-center mt-0.5">Auto-calculated</span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1" title="Negative Marks deducted per wrong answer">
                  -Negative / Wrong
                </label>
                <input 
                  type="number" 
                  step="0.25"
                  min="0"
                  value={sem.negative_marks !== undefined ? sem.negative_marks : 0}
                  onChange={(e) => handleSemesterChange(idx, 'negative_marks', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold focus:border-[#6b6eed] outline-none text-center text-red-600" 
                />
                <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 0 or 0.25</span>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1" title="Minimum Marks or Percentage required to Pass">
                  Pass Threshold
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={sem.pass_marks !== undefined ? sem.pass_marks : 40}
                  onChange={(e) => handleSemesterChange(idx, 'pass_marks', Number(e.target.value))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm font-semibold focus:border-[#6b6eed] outline-none text-center text-indigo-700" 
                />
                <span className="text-[10px] text-gray-500 block text-center mt-0.5">e.g. 40%</span>
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Available Courses Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse examirror syllabus courses, customize exam criteria, or create and edit dynamic courses.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#6b6eed] hover:bg-indigo-600 active:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={18} />
          <span>Add New Course</span>
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

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'all' 
                ? 'bg-[#6b6eed] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Courses ({courses.length})
          </button>
          <button 
            onClick={() => setFilterType('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'admin' 
                ? 'bg-[#6b6eed] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Examirror Catalog ({courses.filter(c => (c as any).created_by_type === 'admin').length})
          </button>
          <button 
            onClick={() => setFilterType('center')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'center' 
                ? 'bg-[#6b6eed] text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Center Created ({courses.filter(c => (c as any).created_by_type === 'center').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search by course name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none"
          />
        </div>

      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#5b67f1] text-white text-xs font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 text-center border-r border-indigo-400 w-12">#</th>
              <th className="py-3.5 px-4 text-center border-r border-indigo-400 w-28">Course Code</th>
              <th className="py-3.5 px-4 border-r border-indigo-400 w-64">Course Info</th>
              <th className="py-3.5 px-4 border-r border-indigo-400">Semester Syllabus & Exam Criteria</th>
              <th className="py-3.5 px-4 text-center w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-[#6b6eed]" size={20} />
                    <span>Loading available courses...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                  No courses found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCourses.map((course, index) => {
                const sems = getParsedSemesters(course);
                const isAlreadyInCenter = centerCourseIds.includes(course.id);
                const isAddingThis = addingCourseId === course.id;
                const isCenterCourse = (course as any).created_by_type === 'center';

                return (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-center border-r border-gray-200 font-medium text-xs">{index + 1}</td>
                    <td className="py-4 px-4 text-center border-r border-gray-200 font-mono text-xs font-bold text-gray-700">
                      {course.code || `CRS-${course.id}`}
                    </td>
                    <td className="py-4 px-4 border-r border-gray-200 align-top">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="font-bold text-gray-900 text-sm">{course.name}</div>
                        {isCenterCourse ? (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-200">
                            Center Course
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded uppercase tracking-wider border border-yellow-200">
                            From Examirror
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-indigo-700 text-xs">
                        Duration: {course.duration || '3 Month(s)'} | Fee: ₹{course.fee || 0}
                      </div>
                    </td>
                    
                    {/* Semester Syllabus & Exam Criteria Details */}
                    <td className="py-0 px-0 border-r border-gray-200 align-top">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-[11px] font-bold text-gray-600 border-b border-gray-200">
                          <tr>
                            <th className="p-2 text-center w-12 border-r border-gray-200">Sem</th>
                            <th className="p-2 border-r border-gray-200">Subjects</th>
                            <th className="p-2 text-center w-14 border-r border-gray-200" title="Written Max Marks">Theory</th>
                            <th className="p-2 text-center w-14 border-r border-gray-200" title="Viva / Oral Max Marks">Oral</th>
                            <th className="p-2 text-center w-14 border-r border-gray-200" title="Total Marks">Total</th>
                            <th className="p-2 text-center w-28" title="Marking Rules">Marking Scheme</th>
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
                                  {sem.subjects || 'General Curriculum'}
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
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="Edit Course & Marking Criteria"
                        >
                          <Edit3 size={13} />
                          <span>Edit Course</span>
                        </button>

                        {/* Add to Center List Button */}
                        {isAlreadyInCenter ? (
                          <button 
                            type="button"
                            onClick={() => handleAddThisCourse(course)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Check size={13} className="text-emerald-600" />
                            <span>In Center List</span>
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => handleAddThisCourse(course)}
                            disabled={isAddingThis}
                            className="bg-[#6b6eed] hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isAddingThis ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                            <span>Add to List</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP ALERT MODAL */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className={`p-6 flex flex-col items-center text-center ${
              popup.type === 'duplicate' ? 'bg-amber-50/70' : 'bg-emerald-50/70'
            }`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner ${
                popup.type === 'duplicate' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {popup.type === 'duplicate' ? <AlertTriangle size={30} /> : <CheckCircle2 size={30} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{popup.title}</h3>
              {popup.courseName && (
                <div className="inline-block bg-white px-3 py-1 rounded-md text-xs font-semibold text-gray-700 border border-gray-200 my-2 shadow-xs">
                  {popup.courseName}
                </div>
              )}
              <p className={`text-sm mt-2 px-2 font-medium ${popup.type === 'duplicate' ? 'text-amber-900' : 'text-emerald-900'}`}>
                {popup.message}
              </p>
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-2.5 justify-center">
              {popup.type === 'duplicate' ? (
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="w-full py-2.5 px-6 bg-[#6b6eed] hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  OK, Got It
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPopup(null)}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPopup(null);
                      navigate('/center/courses');
                    }}
                    className="w-full py-2.5 px-4 bg-[#6b6eed] hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Go to Courses List
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New Course</h3>
                <p className="text-xs text-gray-500">Define course syllabus, written/oral exam marks, and negative marking.</p>
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
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. DCA-101"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Base Fee (₹)
                  </label>
                  <input 
                    type="number" 
                    placeholder="1500"
                    value={courseFee}
                    onChange={(e) => setCourseFee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
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
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Duration Type <span className="text-red-500">*</span>
                  </label>
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
              </div>

              {renderSemesterInputs()}

              <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#6b6eed] hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-sm"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>{submitting ? 'Creating Course...' : 'Save & Create Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE & MARKING CRITERIA MODAL */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-200 max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Course & Exam Marking Criteria</h3>
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Course Base Fee (₹)
                  </label>
                  <input 
                    type="number" 
                    value={courseFee}
                    onChange={(e) => setCourseFee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
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
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#6b6eed] focus:ring-1 focus:ring-[#6b6eed] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">
                    Duration Type <span className="text-red-500">*</span>
                  </label>
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
              </div>

              {renderSemesterInputs()}

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
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#6b6eed] hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-sm"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{submitting ? 'Updating Course...' : 'Save & Update Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddCourse;
