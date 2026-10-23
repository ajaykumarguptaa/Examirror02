import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  Edit,
  Eye,
  FileText,
  Award,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  DollarSign,
  BookOpen,
  Settings,
  HelpCircle,
  FileCheck,
  Phone,
  MapPin,
  Mail,
  Key,
  CreditCard,
  Edit2,
  SlidersHorizontal,
  IndianRupee,
  Laptop,
  ScrollText,
  User,
  GraduationCap,
  Paperclip,
  Ban,
  XCircle,
  AlertTriangle,
  Coins,
  Save,
  Lock,
  ShieldAlert,
  PenTool,
  Archive,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { StudentIdCard } from "../../components/StudentIdCard";
import { OfficialCertificateCard } from "../../components/OfficialCertificateCard";
import { useDebounce } from '../../hooks/useDebounce';

// Lazy-loaded heavy PDF / canvas modals (code-splitting)
const StudentMarksheetModal = lazy(() => import('../../components/StudentMarksheetModal').then(m => ({ default: m.StudentMarksheetModal })));
const StudentCertificateModal = lazy(() => import('../../components/StudentCertificateModal').then(m => ({ default: m.StudentCertificateModal })));
const CenterSignatureUploadModal = lazy(() => import('../../components/CenterSignatureUploadModal').then(m => ({ default: m.CenterSignatureUploadModal })));
const StudentIdCardModal = lazy(() => import('../../components/StudentIdCardModal').then(m => ({ default: m.StudentIdCardModal })));
const BatchIdCardModal = lazy(() => import('../../components/BatchIdCardModal').then(m => ({ default: m.BatchIdCardModal })));

import { compressImageFile } from '../../utils/imageCompressor';
import {
  onlyDigits,
  onlyNameLetters,
  formatPAN,
  isValidIndianPhone,
  isValidAadhaar,
  isValidPAN,
  isValidPincode
} from '../../utils/validators';

interface Semester {
  num: number;
  subjects: string;
  marks: number;
  oral: number;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  courseId: number;
  courseQuestionsCount?: number;
  courseName?: string;
  courseCode?: string;
  courseDescription?: string;
  duration?: string;
  semesters?: string | Semester[];
  centerId: number;
  password?: string;
  centerName?: string;
  centerCode?: string;
  student_type?: string;
  academic_status?: 'pursuing' | 'passout';
  enrollment_no?: string;
  roll_no?: string;
  tokens_deducted?: number;
  certificate_status?: 'not_generated' | 'generated' | 'issued';
  certificate_number?: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  phone?: string;
  father_name?: string;
  mother_name?: string;
  qualification?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  course_fee?: number;
  session_start?: string;
  session_end?: string;
  id_type?: string;
  id_number?: string;
  photo_url?: string;
  id_card_url?: string;
  marksheet_url?: string;
  marks?: any[];
  status?: 'active' | 'cancelled';
  created_at: string;
}

const StudentsList = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) { }
    return 1;
  };
  const centerId = getCenterId();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Selected Checkboxes for Batch Actions (e.g. Print N id cards)
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [instantCharge, setInstantCharge] = useState(200);
  const [allowInstantCertificate, setAllowInstantCertificate] = useState<boolean>(true);
  const [modalType, setModalType] = useState<'form' | 'idcard' | 'certificate' | 'edit' | 'advanced_edit' | 'course_view' | 'manage_fee' | 'batch_idcards' | 'batch_certificates' | 'cancel_enrollment' | 'set_exams' | 'edit_login' | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [showAdvancedEditConfirm, setShowAdvancedEditConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingBulkZip, setIsDownloadingBulkZip] = useState(false);

  // No Screenshot & Certificate Security Warning Modal State
  const [certWarningState, setCertWarningState] = useState<{
    open: boolean;
    student: Student | null;
    isInstant: boolean;
    agreed: boolean;
  }>({
    open: false,
    student: null,
    isInstant: false,
    agreed: false
  });

  // Barcode SVG Ref
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  // Fee Management Form State
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [feePaid, setFeePaid] = useState<number>(0);
  const [feeMode, setFeeMode] = useState('Cash');

  // Student Exams State
  const [studentExamMarks, setStudentExamMarks] = useState<any[]>([]);
  const [originalExamMarks, setOriginalExamMarks] = useState<any[]>([]);

  // Edit Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const [loginPassword, setLoginPassword] = useState('');

  // Quick Edit Form State
  const [quickFirstName, setQuickFirstName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickCourseFee, setQuickCourseFee] = useState<number>(0);

  // Advanced Edit Form State (4 Tabs)
  const [activeEditTab, setActiveEditTab] = useState<'personal' | 'academic' | 'address' | 'documents'>('personal');
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    courseId: '' as number | string,
    studentType: 'new',
    duration: '3 Month(s)',
    academicStatus: 'pursuing' as 'pursuing' | 'passout',
    dob: '',
    gender: 'Male',
    maritalStatus: 'Single',
    phone: '',
    fatherName: '',
    motherName: '',
    qualification: '',
    address: '',
    pincode: '',
    city: '',
    state: 'Bihar',
    courseFee: 0,
    sessionStart: '',
    sessionEnd: '',
    idType: 'Aadhaar Card',
    idNumber: '',
    photoPreview: null as string | null,
    photoBase64: null as string | null,
    idCardBase64: null as string | null,
    idCardFileName: '',
    marksheetBase64: null as string | null,
    marksheetFileName: ''
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/center/${centerId}/students`),
        axios.get(`http://localhost:3000/api/center/courses?centerId=${centerId}`)
      ]);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data || []);
      }
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    axios.get(`http://localhost:3000/api/center/settings/certificate-charge?centerId=${centerId}`).then(res => {
      if (res.data.success) {
        if (res.data.charge !== undefined) setInstantCharge(Number(res.data.charge));
        if (res.data.allow_instant_certificate !== undefined) setAllowInstantCertificate(Boolean(res.data.allow_instant_certificate));
      }
    }).catch(() => { });
  }, [centerId]);

  // Render Barcode dynamically whenever ID card modal opens
  useEffect(() => {
    if (modalType === 'idcard' && selectedStudent && barcodeSvgRef.current) {
      try {
        const barcodeValue = selectedStudent.enrollment_no || selectedStudent.roll_no || `EXAM-2026-${selectedStudent.id}`;
        JsBarcode(barcodeSvgRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.5,
          height: 36,
          displayValue: true,
          fontSize: 10,
          font: 'monospace',
          margin: 0,
          background: 'transparent',
          lineColor: '#1e293b'
        });
      } catch (e) {
        console.error('Failed to render barcode:', e);
      }
    }
  }, [modalType, selectedStudent]);

  // Parse Semesters Helper
  const getParsedSemesters = (studentOrCourse: any): Semester[] => {
    if (!studentOrCourse) return [{ num: 1, subjects: 'Basic to Advance Modules', marks: 80, oral: 20 }];
    const foundCourse = courses.find(c => c.id === studentOrCourse.courseId || c.id === studentOrCourse.id);
    const rawSem = foundCourse?.semesters || studentOrCourse.semesters;
    if (Array.isArray(rawSem)) return rawSem;
    if (typeof rawSem === 'string') {
      try {
        const parsed = JSON.parse(rawSem);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) { }
    }
    return [
      { num: 1, subjects: 'Computer Fundamentals ,Ms Office 2007&10', marks: 40, oral: 10 },
      { num: 2, subjects: 'Tally Erp 9.0 , Photoshop , Internet & Email .', marks: 40, oral: 10 }
    ];
  };

  // Checkbox Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleUpdateLogin = async () => {
    if (!selectedStudent || !loginEmail || !loginPassword) return;
    setIsProcessing(true);
    try {
      await axios.put(`http://localhost:3000/api/center/students/${selectedStudent.id}`, {
        email: loginEmail,
        password: loginPassword
      });
      setFeedback({ type: 'success', text: 'Login credentials updated successfully.' });
      fetchStudents(); // Refresh list
      setModalType(null);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update login credentials.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportStudents = () => {
    if (students.length === 0) {
      setFeedback({ type: 'error', text: 'No students available to export.' });
      return;
    }

    const headers = ['Sr', 'Enrollment No', 'Roll No', 'Full Name', 'Father Name', 'Mother Name', 'Course Name', 'Phone', 'Email', 'DOB', 'Gender', 'Fee', 'Status'];
    const csvRows = [headers.join(',')];

    students.forEach((s, idx) => {
      const row = [
        idx + 1,
        `"${s.enrollment_no || ''}"`,
        `"${s.roll_no || ''}"`,
        `"${s.firstName} ${s.lastName}"`,
        `"${s.father_name || ''}"`,
        `"${s.mother_name || ''}"`,
        `"${s.courseName || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.email || ''}"`,
        `"${s.dob || ''}"`,
        `"${s.gender || 'Male'}"`,
        `"${s.course_fee || 0}"`,
        `"${s.status || 'active'}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({ type: 'success', text: `Exported ${students.length} student records successfully!` });
  };

  // Server-Side Bulk Marksheets & Certificates ZIP Download Engine
  const handleBulkDownloadZip = async () => {
    try {
      const idsToDownload = selectedStudentIds.length > 0 
        ? selectedStudentIds 
        : filteredStudents.map(s => s.id);

      if (idsToDownload.length === 0) {
        toast.error('No students available to download.');
        return;
      }

      setIsDownloadingBulkZip(true);
      toast.loading(`Server is packaging ${idsToDownload.length} Certificates & Marksheets into ZIP...`, { id: 'bulk-zip' });

      const response = await axios.post(
        'http://localhost:3000/api/certificates/bulk-download-zip',
        { studentIds: idsToDownload, type: 'both' },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Examirror_Batch_Docs_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`ZIP downloaded! (${idsToDownload.length} students)`, { id: 'bulk-zip' });
    } catch (err: any) {
      console.error('Bulk ZIP download error:', err);
      toast.error('Failed to download bulk ZIP archive.', { id: 'bulk-zip' });
    } finally {
      setIsDownloadingBulkZip(false);
    }
  };

  // Open Modals
  const handleOpenExamModal = async (student: Student) => {
    setSelectedStudent(student);
    setModalType('set_exams');
    setStudentExamMarks([]);
    setOriginalExamMarks([]);
    try {
      const res = await axios.get(`http://localhost:3000/api/center/students/${student.id}/marks`);
      if (res.data.success) {
        setStudentExamMarks(res.data.marks || []);
        setOriginalExamMarks(res.data.marks || []);
      }
    } catch (error) {
      console.error('Failed to load marks', error);
      setStudentExamMarks([]);
    }
  };

  const handleSaveExamMarks = async (isDateChangeCharge: boolean = false) => {
    if (!selectedStudent) return;
    if (Number(selectedStudent.courseQuestionsCount || 0) === 0) {
      const hasDate = studentExamMarks.some(m => m.exam_date && String(m.exam_date).trim() !== '');
      if (hasDate) {
        setFeedback({
          type: 'error',
          text: 'Cannot schedule exam! No exam questions have been added for this course yet. Please configure questions in Course Management first.'
        });
        return;
      }
    }
    try {
      setIsProcessing(true);
      const res = await axios.post(`http://localhost:3000/api/center/students/${selectedStudent.id}/marks`, {
        marks: studentExamMarks,
        isDateChangeCharge,
        centerId: selectedStudent.centerId
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Exam marks saved successfully!' });
        setModalType(null);
      }
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Failed to save marks' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenModal = async (student: Student, type: 'form' | 'idcard' | 'certificate' | 'edit' | 'advanced_edit' | 'course_view' | 'manage_fee' | 'cancel_enrollment') => {
    setSelectedStudent(student);
    
    if (type === 'certificate' && (student.certificate_status === 'generated' || student.certificate_status === 'issued')) {
      setShowCertModal(true);
      return;
    }

    setModalType(type);

    if (type === 'certificate') {
      try {
        const [marksRes, chargeRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/center/students/${student.id}/marks`),
          axios.get(`http://localhost:3000/api/center/settings/certificate-charge?centerId=${student.centerId || centerId}`).catch(() => ({ data: { charge: 200, allow_instant_certificate: true } }))
        ]);
        if (marksRes.data.success) {
          setStudentExamMarks(marksRes.data.marks || []);
        }
        if (chargeRes?.data?.charge !== undefined) {
          setInstantCharge(Number(chargeRes.data.charge) || 200);
        }
        if (chargeRes?.data?.allow_instant_certificate !== undefined) {
          setAllowInstantCertificate(Boolean(chargeRes.data.allow_instant_certificate));
        }
      } catch (error) {
        setStudentExamMarks([]);
      }
    }

    if (type === 'edit') {
      setQuickFirstName(student.firstName);
      setQuickLastName(student.lastName);
      setQuickPhone(student.phone || '');
      setQuickCourseFee(student.course_fee || 0);
    } else if (type === 'manage_fee') {
      const matchedCourse = courses.find(c => c.id === student.courseId);
      const officialFee = (matchedCourse?.fee !== undefined && matchedCourse?.fee !== null)
        ? Number(matchedCourse.fee)
        : (Number(student.course_fee) || 0);

      setFeeAmount(officialFee || Number(student.course_fee) || 0);
      setFeePaid(Number(student.course_fee) || officialFee || 0);
      setFeeMode('Cash');
    } else if (type === 'advanced_edit') {
      setEditFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        courseId: student.courseId || '',
        studentType: student.student_type || 'new',
        duration: student.duration || '3 Month(s)',
        academicStatus: student.academic_status || 'pursuing',
        dob: student.dob || '',
        gender: student.gender || 'Male',
        maritalStatus: student.marital_status || 'Single',
        phone: student.phone || '',
        fatherName: student.father_name || '',
        motherName: student.mother_name || '',
        qualification: student.qualification || '',
        address: student.address || '',
        pincode: student.pincode || '',
        city: student.city || '',
        state: student.state || 'Bihar',
        courseFee: Number(student.course_fee) || 0,
        sessionStart: student.session_start || '',
        sessionEnd: student.session_end || '',
        idType: student.id_type || 'Aadhaar Card',
        idNumber: student.id_number || '',
        photoPreview: student.photo_url || null,
        photoBase64: null,
        idCardBase64: null,
        idCardFileName: student.id_card_url ? 'Existing Document Attached' : '',
        marksheetBase64: null,
        marksheetFileName: student.marksheet_url ? 'Existing Marksheet Attached' : ''
      });
      setActiveEditTab('personal');
    }
  };

  const initiateCertificateGeneration = (student: Student, isInstant: boolean) => {
    setCertWarningState({
      open: true,
      student,
      isInstant,
      agreed: false
    });
  };

  const handleGenerateCertificate = async (studentId: number, isInstant: boolean = false) => {
    try {
      setIsProcessing(true);
      const res = await axios.post(`http://localhost:3000/api/center/students/${studentId}/certificate`, { isInstant });
      
      if (res.data.success) {
        // Add artificial delay for UX (make it feel like a complex generation process)
        await new Promise(resolve => setTimeout(resolve, 2500));

        setFeedback({ type: 'success', text: `Certificate generated successfully! Cert No: ${res.data.result.certificateNumber}. ₹${res.data.result.charged || instantCharge} debited from wallet.` });
        setCertWarningState({ open: false, student: null, isInstant: false, agreed: false });
        fetchStudents();
        window.dispatchEvent(new Event('center-stats-updated'));
        
        if (selectedStudent) {
          setSelectedStudent({
            ...selectedStudent,
            certificate_status: 'generated',
            certificate_number: res.data.result.certificateNumber
          });
          setModalType(null);
          setShowCertModal(true);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to generate certificate' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (quickPhone && !isValidIndianPhone(quickPhone)) {
      setFeedback({ type: 'error', text: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
      return;
    }
    try {
      setIsProcessing(true);
      const res = await axios.put(`http://localhost:3000/api/center/students/${selectedStudent.id}`, {
        firstName: quickFirstName,
        lastName: quickLastName,
        phone: quickPhone,
        course_fee: quickCourseFee
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Student details updated successfully!' });
        setModalType(null);
        fetchStudents();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update student' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAdvancedEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (editFormData.phone && !isValidIndianPhone(editFormData.phone)) {
      setFeedback({ type: 'error', text: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
      return;
    }
    if (editFormData.pincode && !isValidPincode(editFormData.pincode)) {
      setFeedback({ type: 'error', text: 'Please enter a valid 6-digit area pincode.' });
      return;
    }
    if (editFormData.idType === 'Aadhaar Card' && editFormData.idNumber && !isValidAadhaar(editFormData.idNumber)) {
      setFeedback({ type: 'error', text: 'Aadhaar Card number must be exactly 12 digits.' });
      return;
    }
    if (editFormData.idType === 'PAN Card' && editFormData.idNumber && !isValidPAN(editFormData.idNumber)) {
      setFeedback({ type: 'error', text: 'PAN Card number must be in format ABCDE1234F.' });
      return;
    }
    setShowAdvancedEditConfirm(true);
  };

  const confirmAndSaveAdvancedEdit = async () => {
    if (!selectedStudent) return;
    try {
      setIsProcessing(true);
      setShowAdvancedEditConfirm(false);
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        courseId: Number(editFormData.courseId) || selectedStudent.courseId,
        student_type: editFormData.studentType,
        duration: editFormData.duration,
        academic_status: editFormData.academicStatus,
        dob: editFormData.dob,
        gender: editFormData.gender,
        marital_status: editFormData.maritalStatus,
        phone: editFormData.phone,
        father_name: editFormData.fatherName,
        mother_name: editFormData.motherName,
        qualification: editFormData.qualification,
        address: editFormData.address,
        pincode: editFormData.pincode,
        city: editFormData.city,
        state: editFormData.state,
        course_fee: Number(editFormData.courseFee) || 0,
        session_start: editFormData.sessionStart,
        session_end: editFormData.sessionEnd,
        id_type: editFormData.idType,
        id_number: editFormData.idNumber,
        isAdvancedEdit: true
      };

      if (editFormData.photoBase64) payload.photo_url = editFormData.photoBase64;
      if (editFormData.idCardBase64) payload.id_card_url = editFormData.idCardBase64;
      if (editFormData.marksheetBase64) payload.marksheet_url = editFormData.marksheetBase64;

      const res = await axios.put(`http://localhost:3000/api/center/students/${selectedStudent.id}`, payload);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `All student details for ${editFormData.firstName} ${editFormData.lastName} updated successfully!`
        });
        setModalType(null);
        fetchStudents();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update student' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setIsProcessing(true);
      const res = await axios.put(`http://localhost:3000/api/center/students/${selectedStudent.id}`, {
        course_fee: feeAmount
      });
      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Fee recorded for ${selectedStudent.firstName} ${selectedStudent.lastName}. Total: ₹${feeAmount}, Mode: ${feeMode}`
        });
        setModalType(null);
        fetchStudents();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update fee' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEnrollment = async () => {
    if (!selectedStudent) return;
    try {
      setIsProcessing(true);
      const res = await axios.post('http://localhost:3000/api/center/students/cancel', {
        studentId: selectedStudent.id,
        centerId: centerId
      });

      if (res.data.success) {
        const refunded = res.data.result?.refundedTokens || selectedStudent.tokens_deducted || 0;
        setFeedback({
          type: 'success',
          text: `Student admission for ${selectedStudent.firstName} ${selectedStudent.lastName} has been cancelled successfully. ₹${refunded} tokens refunded to your center wallet!`
        });
        setModalType(null);
        fetchStudents();
        window.dispatchEvent(new Event('center-stats-updated'));
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel enrollment'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter & Pagination (Memoized + Debounced for high-speed rendering)
  const filteredStudents = useMemo(() => {
    const q = debouncedSearchTerm.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s =>
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      (s.father_name && s.father_name.toLowerCase().includes(q)) ||
      (s.mother_name && s.mother_name.toLowerCase().includes(q)) ||
      (s.enrollment_no && s.enrollment_no.toLowerCase().includes(q)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, debouncedSearchTerm]);

  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + entriesPerPage);

  const formatImageSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://localhost:3000')) {
      return url.replace('http://localhost:3000', '');
    }
    return url;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-12 font-sans text-slate-800">

      {/* Feedback Alert */}
      {feedback && (
        <div className={`mb-4 p-3.5 rounded-lg flex items-center justify-between text-sm font-semibold shadow-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
        </div>
      )}

      {/* Main Table Card Container */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">

        {/* Top Header Bar with Action Buttons */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-xl font-bold text-[#1e293b]">Student List</h1>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Center Director E-Sign & Stamp Upload Button */}
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
              title="Upload Center Director E-Signature & Rubber Seal"
            >
              <PenTool size={14} className="text-indigo-600 shrink-0" /> <span className="whitespace-nowrap">Director E-Sign & Stamp</span>
            </button>

            {/* Print N ID Cards Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedStudentIds.length === 0) {
                  setFeedback({ type: 'error', text: 'Please select at least one student checkbox to print ID cards.' });
                  setTimeout(() => setFeedback(null), 4000);
                  return;
                }
                setModalType('batch_idcards');
              }}
              className="bg-[#5b67f1] hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Printer size={14} className="shrink-0" /> <span className="whitespace-nowrap">Print {selectedStudentIds.length} ID Cards</span>
            </button>

            {/* Batch Print Certificates Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedStudentIds.length === 0) {
                  setFeedback({ type: 'error', text: 'Please select at least one student checkbox to batch print certificates.' });
                  setTimeout(() => setFeedback(null), 4000);
                  return;
                }
                setModalType('batch_certificates');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Printer size={14} className="shrink-0" /> <span className="whitespace-nowrap">Batch Print Certs ({selectedStudentIds.length})</span>
            </button>

            {/* Server-Side Bulk ZIP Download (0% browser RAM usage) */}
            <button
              type="button"
              disabled={isDownloadingBulkZip}
              onClick={handleBulkDownloadZip}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
              title="Fast Server-Side ZIP download of all certificates and marksheets without freezing browser RAM"
            >
              {isDownloadingBulkZip ? (
                <>
                  <Loader2 size={14} className="animate-spin shrink-0" />
                  <span className="whitespace-nowrap">Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Archive size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">Bulk ZIP ({selectedStudentIds.length > 0 ? selectedStudentIds.length : 'All'})</span>
                </>
              )}
            </button>

            {/* Export Students Button */}
            <button
              type="button"
              onClick={handleExportStudents}
              className="bg-[#8b5cf6] hover:bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Download size={14} className="shrink-0" /> <span className="whitespace-nowrap">Export Students</span>
            </button>
          </div>
        </div>

        {/* Controls: Show Entries & Search Bar */}
        <div className="px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100">

          {/* Show entries select */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>Show</span>
            <div className="relative inline-block">
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white outline-none focus:border-[#5b67f1] appearance-none pr-6 cursor-pointer font-medium"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown size={12} className="text-gray-500 absolute right-2 top-2 pointer-events-none" />
            </div>
            <span>entries</span>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2 text-xs text-gray-700 w-full sm:w-auto justify-start sm:justify-end">
            <span className="shrink-0 font-medium">Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:border-[#5b67f1] w-full sm:w-56"
              placeholder="Filter by name, phone, roll..."
            />
          </div>

        </div>

        {/* Students Data Table */}
        <div className="w-full overflow-x-auto max-w-[100vw] sm:max-w-full pb-4 scrollbar-thin scrollbar-thumb-gray-300">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">

            {/* Header Row */}
            <thead className="bg-[#5b67f1] text-white">
              <tr>
                <th className="py-3 px-3 font-semibold text-center w-14 border-r border-[#6f7bf3]/60">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Sr.</span>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedStudentIds.length > 0 && selectedStudentIds.length === filteredStudents.length}
                      className="cursor-pointer rounded accent-white"
                    />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-center border-r border-[#6f7bf3]/60 w-48">
                  Student Pic
                </th>
                <th className="py-3 px-4 font-semibold border-r border-[#6f7bf3]/60 w-72">
                  Student Details
                </th>
                <th className="py-3 px-4 font-semibold border-r border-[#6f7bf3]/60 w-80">
                  Contact Details
                </th>
                <th className="py-3 px-4 font-semibold text-center border-r border-[#6f7bf3]/60 w-36">
                  Files
                </th>
                <th className="py-3 px-4 font-semibold text-center w-64">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">Loading student directory...</td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500 font-medium">No students found.</td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const isCancelled = student.status === 'cancelled';
                  const rowNum = startIndex + idx + 1;
                  const isChecked = selectedStudentIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isCancelled ? 'bg-red-50/20' : ''
                        }`}
                    >

                      {/* Sr. Column with Checkbox */}
                      <td className="py-4 px-3 text-center border-r border-gray-200 align-middle">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectOne(student.id)}
                            className="cursor-pointer rounded accent-[#5b67f1]"
                          />
                          <span className="font-bold text-gray-600 text-xs">
                            {isCancelled ? 'x' : rowNum}
                          </span>
                          {isCancelled && (
                            <span className="text-[10px] text-gray-400 font-bold">{rowNum}</span>
                          )}
                        </div>
                      </td>

                      {/* Student Pic Column */}
                      <td className="py-4 px-3 text-center border-r border-gray-200 align-top">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="w-16 h-16 rounded-md border border-gray-300 overflow-hidden shadow-2xs bg-slate-100 shrink-0">
                            <img
                              src={formatImageSrc(student.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstName + ' ' + student.lastName)}&background=5b67f1&color=fff`}
                              alt={student.firstName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[11px] font-bold text-gray-700 font-mono">
                            {student.enrollment_no || `EXAMs26-${student.id}`}
                          </div>
                          <div className="font-bold text-gray-900 text-xs uppercase leading-tight">
                            {student.firstName} {student.lastName}
                          </div>
                          {student.father_name && (
                            <div className="text-[10px] text-gray-500 font-medium">
                              s/o {student.father_name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Student Details Column */}
                      <td className={`py-4 px-4 border-r border-gray-200 align-top space-y-1 text-xs ${isCancelled ? 'text-red-600 font-medium' : 'text-gray-700'
                        }`}>
                        <div>
                          <span className="text-gray-500">Mother name : </span>
                          <span className={isCancelled ? 'text-red-600' : 'text-gray-900 font-medium'}>{student.mother_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Gender : </span>
                          <span className="font-medium">{student.gender || 'Male'}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          <span className="text-gray-500">DOB :</span>
                          <span className="font-medium">{student.dob || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Qualification :</span>
                          <span className="font-medium">{student.qualification || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Session Start : </span>
                          <span className="font-medium">{student.session_start || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Session End : </span>
                          <span className="font-medium">{student.session_end || 'N/A'}</span>
                        </div>

                        {/* View Course Button (Cyan) */}
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(student, 'course_view')}
                            className="bg-[#06b6d4] hover:bg-cyan-600 text-white font-semibold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <BookOpen size={12} /> View Course
                          </button>
                        </div>
                      </td>

                      {/* Contact Details Column */}
                      <td className="py-4 px-4 border-r border-gray-200 align-top space-y-1 text-xs text-gray-700">
                        <div className="flex items-start gap-1.5">
                          <Phone size={12} className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-gray-500 shrink-0">:</span>
                          <span className="font-semibold text-gray-900">{student.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-gray-500 shrink-0">:</span>
                          <span className="text-gray-800 text-[11px] leading-snug">
                            {student.address ? `${student.address} ` : ''}
                            {student.city ? `${student.city} ` : ''}
                            {student.state ? `${student.state} ` : ''}
                            {student.pincode || ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between group bg-slate-50 p-1.5 rounded border border-transparent hover:border-slate-200 transition-colors mt-2">
                          <div className="space-y-1">
                            <div className="flex items-start gap-1.5">
                              <Mail size={12} className="text-gray-400 mt-0.5 shrink-0" />
                              <span className="text-gray-500 shrink-0">:</span>
                              <span className="font-mono text-gray-800 text-[11px] break-all">{student.email}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <Key size={12} className="text-gray-400 mt-0.5 shrink-0" />
                              <span className="text-gray-500 shrink-0">:</span>
                              <span className="font-mono text-gray-700 font-semibold">{student.password || '123456'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setLoginEmail(student.email || '');
                              setLoginPassword(student.password || '123456');
                              setModalType('edit_login');
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all shrink-0"
                            title="Update Student Login Credentials"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Files Column */}
                      <td className="py-4 px-3 border-r border-gray-200 align-top space-y-1.5 text-center">
                        {isCancelled ? (
                          <div className="space-y-2">
                            <div className="p-2.5 bg-red-600 text-white text-[11px] font-bold rounded shadow-xs leading-tight">
                              On request of center, student was terminated and amount refunded back to wallet.
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Form Button (Cyan) */}
                            <button
                              type="button"
                              onClick={() => handleOpenModal(student, 'form')}
                              className="w-full bg-[#06b6d4] hover:bg-cyan-600 text-white font-semibold py-1 px-2 rounded text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <FileText size={12} /> Form
                            </button>

                            {/* ID Card Button (Blue/Indigo) */}
                            <button
                              type="button"
                              onClick={() => handleOpenModal(student, 'idcard')}
                              className="w-full bg-[#5b67f1] hover:bg-indigo-600 text-white font-semibold py-1 px-2 rounded text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <CreditCard size={12} /> ID Card
                            </button>

                            {/* Admit Card Button (Cyan) */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const toastId = toast.loading('Generating Admit Card PDF...');
                                  const res = await axios.get(`http://localhost:3000/api/certificate/admit-card/${student.id}`, {
                                    responseType: 'blob'
                                  });
                                  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `Admit_Card_${student.roll_no || student.id}.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  toast.success('Admit Card downloaded successfully!', { id: toastId });
                                } catch (_) {
                                  toast.error('Failed to download Admit Card.');
                                }
                              }}
                              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1 px-2 rounded text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Download Official Admit Card PDF"
                            >
                              <FileText size={12} /> Admit Card
                            </button>

                            {/* Certificate Button (Purple) */}
                            <button
                              type="button"
                              onClick={() => handleOpenModal(student, 'certificate')}
                              className="w-full bg-[#9333ea] hover:bg-purple-700 text-white font-semibold py-1 px-2 rounded text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Award size={12} /> Certificate
                            </button>

                            {/* Cancel Enrollment Button */}
                            {student.certificate_status === 'generated' || student.certificate_status === 'issued' ? (
                              <div
                                className="w-full bg-slate-100 text-slate-400 font-semibold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-1 border border-slate-200 cursor-not-allowed select-none"
                                title="Certificate already generated for this student. Token refund is NOT available."
                              >
                                <XCircle size={11} /> No Refund (Cert Issued)
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(student, 'cancel_enrollment')}
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-1 px-2 rounded text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Cancel Student Enrollment & Refund Tokens to Wallet"
                              >
                                <XCircle size={12} /> Cancel Enrollment
                              </button>
                            )}
                          </>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-3 align-top">
                        <div className="grid grid-cols-2 gap-1.5">

                          {/* Rejection Badge if Cancelled */}
                          {isCancelled ? (
                            <button
                              type="button"
                              disabled
                              className="bg-red-500 text-white text-[11px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 shadow-2xs col-span-1"
                            >
                              <Ban size={12} /> Rejected
                            </button>
                          ) : null}

                          {/* Edit Button (Light Indigo) */}
                          <button
                            type="button"
                            onClick={() => handleOpenModal(student, 'edit')}
                            className="bg-[#93c5fd]/30 hover:bg-[#93c5fd]/60 text-indigo-700 border border-indigo-200 font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 size={12} /> Edit
                          </button>

                          {/* Advanced Edit Button (Light Purple) */}
                          <button
                            type="button"
                            onClick={() => handleOpenModal(student, 'advanced_edit')}
                            className="bg-[#c4b5fd]/30 hover:bg-[#c4b5fd]/60 text-purple-700 border border-purple-200 font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal size={12} /> Advanced Edit
                          </button>

                          {/* Manage Fee Button (Purple) */}
                          <button
                            type="button"
                            onClick={() => handleOpenModal(student, 'manage_fee')}
                            className="bg-[#8b5cf6] hover:bg-purple-700 text-white font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <IndianRupee size={12} /> Manage Fee
                          </button>

                          {/* Set Exams Button (Light Indigo) */}
                          <button
                            type="button"
                            onClick={() => handleOpenExamModal(student)}
                            className="bg-[#93c5fd]/30 hover:bg-[#93c5fd]/60 text-indigo-700 border border-indigo-200 font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Configure course exam questions"
                          >
                            <Laptop size={12} /> Set Exams
                          </button>

                          {/* Request Certificate Button (Light Indigo) */}
                          <button
                            type="button"
                            onClick={() => handleOpenModal(student, 'certificate')}
                            className="bg-[#93c5fd]/30 hover:bg-[#93c5fd]/60 text-indigo-700 border border-indigo-200 font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer col-span-2"
                          >
                            <ScrollText size={12} /> Request Certificate
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
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${currentPage === pageNum
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

      {/* 1. Student Course Modal (Exact Match of Screenshot 2) */}
      {modalType === 'course_view' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-300">

            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#1e293b]">Student Course</h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Course Info Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-700 w-44 bg-gray-50/50 border-r border-gray-200">
                        Course Name :
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-bold">
                        {selectedStudent.courseName || 'Advanced Diploma In Computer Application'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-700 w-44 bg-gray-50/50 border-r border-gray-200">
                        Course Duration :
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {selectedStudent.duration || '12 Month(s)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Semesters Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-base text-[#1e293b]">Semesters</h4>

                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#5b67f1] text-white">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold text-center w-16 border-r border-[#6f7bf3]/60">
                          Sem No.
                        </th>
                        <th className="py-2.5 px-4 font-semibold border-r border-[#6f7bf3]/60">
                          Subjects
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-center w-28 border-r border-[#6f7bf3]/60">
                          Examination Marks
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-center w-20">
                          Oral Marks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {getParsedSemesters(selectedStudent).map((sem, sIdx) => (
                        <tr key={sIdx} className="hover:bg-gray-50">
                          <td className="py-3 px-3 text-center font-bold text-gray-700 border-r border-gray-200">
                            {sem.num}
                          </td>
                          <td className="py-3 px-4 text-gray-800 font-medium border-r border-gray-200">
                            {sem.subjects}
                          </td>
                          <td className="py-3 px-3 text-center text-gray-700 font-bold border-r border-gray-200">
                            {sem.marks}
                          </td>
                          <td className="py-3 px-3 text-center text-gray-700 font-bold">
                            {sem.oral}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. Fee Management Modal */}
      {modalType === 'manage_fee' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-300">
            <div className="bg-[#8b5cf6] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>Manage Course Fee</span>
              </h3>
              <button onClick={() => setModalType(null)} className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveFee} className="p-6 space-y-4 text-xs">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="font-bold text-purple-900 text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                <div className="text-purple-700 text-xs">{selectedStudent.courseName}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">Total Course Fee (₹) *</label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    Un-editable (Auto-fetched)
                  </span>
                </div>
                <input
                  type="number"
                  readOnly
                  required
                  value={feeAmount}
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg text-sm font-bold text-indigo-700 outline-none cursor-not-allowed select-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">Course fee is auto-fetched according to official course selection and cannot be modified.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Amount Collected (₹) *</label>
                <input
                  type="number"
                  required
                  value={feePaid}
                  onChange={(e) => setFeePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={feeMode}
                  onChange={(e) => setFeeMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-purple-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-[#8b5cf6] hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {isProcessing ? 'Saving...' : 'Update Fee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Quick Edit Modal */}
      {modalType === 'edit' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="bg-[#5b67f1] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Quick Edit Student Details</h3>
              <button onClick={() => setModalType(null)} className="text-white hover:text-gray-200 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={quickFirstName}
                  onChange={(e) => setQuickFirstName(onlyNameLetters(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={quickLastName}
                  onChange={(e) => setQuickLastName(onlyNameLetters(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mobile Phone (10 Digits)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(onlyDigits(e.target.value, 10))}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Center Course Fee (₹)</label>
                <input
                  type="number"
                  value={quickCourseFee}
                  onChange={(e) => setQuickCourseFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-600 font-bold text-indigo-700"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2 border rounded-lg text-gray-700 font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-2 bg-[#5b67f1] hover:bg-indigo-600 text-white rounded-lg font-bold cursor-pointer shadow-xs">
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Advanced Student Editing Modal (4 Comprehensive Tabs) */}
      {modalType === 'advanced_edit' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-gray-300 overflow-hidden">

            {/* Modal Header */}
            <div className="bg-[#0f172a] text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg text-emerald-400">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Advanced Student Editor & Profile Management
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 font-mono">
                    <span>ENR: {selectedStudent.enrollment_no || `EXAM-2026-${selectedStudent.id}`}</span>
                    <span>•</span>
                    <span>ROLL: {selectedStudent.roll_no || `ROL-${10000 + selectedStudent.id}`}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex flex-wrap gap-2 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveEditTab('personal')}
                className={`px-4 py-2 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeEditTab === 'personal'
                  ? 'bg-white text-[#0f172a] font-bold border-t-2 border-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <User size={14} /> Personal Details
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('academic')}
                className={`px-4 py-2 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeEditTab === 'academic'
                  ? 'bg-white text-[#0f172a] font-bold border-t-2 border-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <GraduationCap size={14} /> Course & Academic
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('address')}
                className={`px-4 py-2 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeEditTab === 'address'
                  ? 'bg-white text-[#0f172a] font-bold border-t-2 border-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <MapPin size={14} /> Address & Location
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('documents')}
                className={`px-4 py-2 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeEditTab === 'documents'
                  ? 'bg-white text-[#0f172a] font-bold border-t-2 border-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <FileText size={14} /> Identity & Documents
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveAdvancedEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white text-xs">

                {/* TAB 1: Personal Details */}
                {activeEditTab === 'personal' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.firstName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: onlyNameLetters(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.lastName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: onlyNameLetters(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Father / Husband's Name</label>
                        <input
                          type="text"
                          value={editFormData.fatherName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, fatherName: onlyNameLetters(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Mother's Name</label>
                        <input
                          type="text"
                          value={editFormData.motherName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, motherName: onlyNameLetters(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Date of Birth (DOB)</label>
                        <input
                          type="date"
                          value={editFormData.dob}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, dob: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Gender</label>
                        <select
                          value={editFormData.gender}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Marital Status</label>
                        <select
                          value={editFormData.maritalStatus}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 bg-white"
                        >
                          <option value="Single">Single / Unmarried</option>
                          <option value="Married">Married</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Mobile Phone (10 Digits) *</label>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit mobile"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, phone: onlyDigits(e.target.value, 10) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Highest Qualification</label>
                        <input
                          type="text"
                          placeholder="e.g. 10th, 12th, Graduate, BCA"
                          value={editFormData.qualification}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, qualification: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Course & Academic */}
                {activeEditTab === 'academic' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Enrolled Course *</label>
                        <select
                          required
                          value={editFormData.courseId}
                          onChange={(e) => {
                            const cid = e.target.value;
                            const found = courses.find(c => c.id === Number(cid));
                            setEditFormData(prev => ({
                              ...prev,
                              courseId: cid,
                              duration: found?.duration || prev.duration,
                              courseFee: found?.fee !== undefined && found?.fee !== null ? Number(found.fee) : prev.courseFee
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 bg-white font-medium"
                        >
                          <option value="">-- Select Course --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code || `CRS-${c.id}`}) - {c.duration || '3 Months'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Course Duration</label>
                        <input
                          type="text"
                          placeholder="e.g. 3 Month(s), 6 Month(s), 1 Year"
                          value={editFormData.duration}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Student Type</label>
                        <select
                          value={editFormData.studentType}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, studentType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 bg-white"
                        >
                          <option value="new">New Student</option>
                          <option value="old">Old / Existing Student</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Academic Status</label>
                        <select
                          value={editFormData.academicStatus}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, academicStatus: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 bg-white font-bold"
                        >
                          <option value="pursuing">Currently Pursuing (Active)</option>
                          <option value="passout">Passout / Completed</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-gray-700">Center Course Fee (₹)</label>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-300 font-bold px-1.5 py-0.5 rounded">
                            Auto-fetched
                          </span>
                        </div>
                        <input
                          type="number"
                          readOnly
                          value={editFormData.courseFee}
                          className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg text-sm font-bold text-indigo-700 outline-none cursor-not-allowed select-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Academic Session Start</label>
                        <input
                          type="date"
                          value={editFormData.sessionStart}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sessionStart: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Academic Session End</label>
                        <input
                          type="date"
                          value={editFormData.sessionEnd}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sessionEnd: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Address & Location */}
                {activeEditTab === 'address' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Street Address</label>
                      <textarea
                        rows={3}
                        placeholder="Enter full address, village, landmark..."
                        value={editFormData.address}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Pincode (6 Digits)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="e.g. 800001"
                          value={editFormData.pincode}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, pincode: onlyDigits(e.target.value, 6) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">City / District</label>
                        <input
                          type="text"
                          placeholder="e.g. Patna, Delhi"
                          value={editFormData.city}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          placeholder="e.g. Bihar, Uttar Pradesh, Delhi"
                          value={editFormData.state}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Identity & Documents */}
                {activeEditTab === 'documents' && (
                  <div className="space-y-5 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Identity Document Type</label>
                        <select
                          value={editFormData.idType}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, idType: e.target.value, idNumber: '' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 bg-white"
                        >
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="School / College ID">School / College ID</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Passport">Passport</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Identity Document Number</label>
                        <input
                          type="text"
                          inputMode={editFormData.idType === 'Aadhaar Card' ? 'numeric' : 'text'}
                          maxLength={editFormData.idType === 'Aadhaar Card' ? 12 : editFormData.idType === 'PAN Card' ? 10 : 30}
                          placeholder={
                            editFormData.idType === 'Aadhaar Card'
                              ? '12-digit Aadhaar Number'
                              : editFormData.idType === 'PAN Card'
                              ? '10-char PAN (ABCDE1234F)'
                              : 'ID Number'
                          }
                          value={editFormData.idNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (editFormData.idType === 'Aadhaar Card') {
                              setEditFormData(prev => ({ ...prev, idNumber: onlyDigits(val, 12) }));
                            } else if (editFormData.idType === 'PAN Card') {
                              setEditFormData(prev => ({ ...prev, idNumber: formatPAN(val) }));
                            } else {
                              setEditFormData(prev => ({ ...prev, idNumber: val }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                    </div>

                    {/* Photo Replacement */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">Student Profile Photo</div>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-24 rounded-lg border-2 border-slate-300 overflow-hidden bg-white shrink-0 shadow-xs">
                          {editFormData.photoPreview ? (
                            <img
                              src={formatImageSrc(editFormData.photoPreview)}
                              alt="Student Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">No Photo</div>
                          )}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <label className="block text-[11px] font-bold text-slate-600">Replace Student Photo:</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.8, maxSizeKB: 120 });
                                  setEditFormData(prev => ({
                                    ...prev,
                                    photoPreview: result.dataUrl,
                                    photoBase64: result.dataUrl
                                  }));
                                } catch (err) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      photoPreview: reader.result as string,
                                      photoBase64: reader.result as string
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                            className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400">Auto-compressed JPG/WEBP for optimal server performance.</p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="font-bold text-slate-800 text-xs">ID Proof Document</div>
                        {editFormData.idCardFileName && (
                          <div className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1">
                            <Paperclip size={12} /> {editFormData.idCardFileName}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type.startsWith('image/')) {
                                try {
                                  const result = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8, maxSizeKB: 180 });
                                  setEditFormData(prev => ({
                                    ...prev,
                                    idCardFileName: file.name,
                                    idCardBase64: result.dataUrl
                                  }));
                                } catch (err) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      idCardFileName: file.name,
                                      idCardBase64: reader.result as string
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              } else {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    idCardFileName: file.name,
                                    idCardBase64: reader.result as string
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                          className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="font-bold text-slate-800 text-xs">Marksheet Proof</div>
                        {editFormData.marksheetFileName && (
                          <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                            <Paperclip size={12} /> {editFormData.marksheetFileName}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type.startsWith('image/')) {
                                try {
                                  const result = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8, maxSizeKB: 180 });
                                  setEditFormData(prev => ({
                                    ...prev,
                                    marksheetFileName: file.name,
                                    marksheetBase64: result.dataUrl
                                  }));
                                } catch (err) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      marksheetFileName: file.name,
                                      marksheetBase64: reader.result as string
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              } else {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    marksheetFileName: file.name,
                                    marksheetBase64: reader.result as string
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                          className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Modal Footer Buttons */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tabs: Array<'personal' | 'academic' | 'address' | 'documents'> = ['personal', 'academic', 'address', 'documents'];
                      const curIdx = tabs.indexOf(activeEditTab);
                      if (curIdx > 0) setActiveEditTab(tabs[curIdx - 1]);
                    }}
                    disabled={activeEditTab === 'personal'}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ← Previous Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tabs: Array<'personal' | 'academic' | 'address' | 'documents'> = ['personal', 'academic', 'address', 'documents'];
                      const curIdx = tabs.indexOf(activeEditTab);
                      if (curIdx < tabs.length - 1) setActiveEditTab(tabs[curIdx + 1]);
                    }}
                    disabled={activeEditTab === 'documents'}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next Tab →
                  </button>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 font-bold text-[11px] flex items-center gap-1.5 bg-red-50/80 px-2.5 py-1.5 rounded-md border border-red-200 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse">
                      <Coins size={14} className="text-red-500 drop-shadow-[0_0_2px_rgba(239,68,68,0.8)]" />
                      Costs 50 Tokens
                    </span>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? 'Saving Changes...' : 'Save All Student Details'}
                    </button>
                  </div>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 5. Student Admission Form Modal */}
      {modalType === 'form' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-lg text-gray-900">Student Admission Form</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <img
                  src={formatImageSrc(selectedStudent.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.firstName + ' ' + selectedStudent.lastName)}&background=5b67f1&color=fff`}
                  className="w-20 h-20 rounded border object-cover"
                  alt="Student"
                />
                <div>
                  <h4 className="font-bold text-base text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                  <p className="text-xs text-indigo-600 font-mono font-bold">Enrollment No: {selectedStudent.enrollment_no || `EXAM-2026-${selectedStudent.id}`}</p>
                  <p className="text-xs text-gray-500">Course: {selectedStudent.courseName}</p>
                  <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                    Status: {selectedStudent.academic_status === 'passout' ? (
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold"><GraduationCap size={13} /> Passout / Completed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 size={13} /> Currently Pursuing</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><strong>Enrollment No:</strong> {selectedStudent.enrollment_no || `EXAM-2026-${selectedStudent.id}`}</div>
                <div><strong>Roll No:</strong> {selectedStudent.roll_no || `ROL-${10000 + selectedStudent.id}`}</div>
                <div><strong>Father / Husband:</strong> {selectedStudent.father_name || 'N/A'}</div>
                <div><strong>Mother:</strong> {selectedStudent.mother_name || 'N/A'}</div>
                <div><strong>Phone:</strong> {selectedStudent.phone}</div>
                <div><strong>Email:</strong> {selectedStudent.email}</div>
                <div><strong>DOB:</strong> {selectedStudent.dob}</div>
                <div><strong>Gender:</strong> {selectedStudent.gender}</div>
                <div><strong>Qualification:</strong> {selectedStudent.qualification}</div>
                <div><strong>ID Type & No:</strong> {selectedStudent.id_type} - {selectedStudent.id_number}</div>
                <div className="col-span-2"><strong>Address:</strong> {selectedStudent.address}, {selectedStudent.city}, {selectedStudent.state} - {selectedStudent.pincode}</div>
              </div>

              {/* Uploaded Documents & Assets Stored Locally */}
              {(selectedStudent.id_card_url || selectedStudent.marksheet_url) && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 mt-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Uploaded Documents & Assets:</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedStudent.id_card_url && (
                      <a
                        href={formatImageSrc(selectedStudent.id_card_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={12} /> View ID Document ({selectedStudent.id_type || 'ID Card'})
                      </a>
                    )}
                    {selectedStudent.marksheet_url && (
                      <a
                        href={formatImageSrc(selectedStudent.marksheet_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={12} /> View Marksheet Document
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t mt-4">
              <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                <Printer size={14} /> Print Form
              </button>
              <button onClick={() => setModalType(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-xs font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Single Student ID Card Modal */}
      {modalType === 'idcard' && selectedStudent && (
        <Suspense fallback={null}>
          <StudentIdCardModal
            student={selectedStudent}
            onClose={() => setModalType(null)}
          />
        </Suspense>
      )}

      {/* 7. Certificate Generator Modal */}
      {modalType === 'certificate' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden">
            <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Student Certificate Record</h3>
              <button onClick={() => setModalType(null)} className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <div className="p-8 text-center space-y-4">
              {selectedStudent.certificate_status === 'generated' || selectedStudent.certificate_status === 'issued' ? (
                <div className="border-[3px] border-[#0c2340] p-6 rounded-xl bg-white space-y-3 relative shadow-md">
                  <div className="text-xl font-black text-[#0047ba] tracking-wider uppercase">EXAMIRROR</div>
                  <div className="inline-block bg-[#0047ba] text-white px-4 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    COMPUTER ACADEMY
                  </div>
                  <h2 className="text-xl font-serif font-black text-[#0c2340] tracking-widest uppercase mt-2">CERTIFICATE OF COURSE COMPLETION</h2>
                  <p className="text-xs text-gray-600 italic">This Certificate is Awarded to</p>
                  <h3 className="text-xl font-extrabold text-[#0047ba] border-b-2 border-dotted border-slate-700 inline-block px-4 pb-1">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-xs text-gray-700">
                    On Successful Completion of the Course <strong>{selectedStudent.courseName}</strong> from our Study Centre.
                  </p>
                  <div className="text-xs font-mono font-bold text-[#0c2340] bg-slate-50 p-2 rounded border border-slate-200 inline-block">
                    Reg. No: {selectedStudent.enrollment_no || selectedStudent.certificate_number} • Sl. No: {selectedStudent.certificate_number}
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <Award size={48} className="mx-auto text-purple-600" />
                  <h4 className="text-lg font-bold text-gray-800">Generate Official Certificate</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Once generated, an official certificate number will be registered and the admission cannot be refunded.
                  </p>

                  {(() => {
                    const requiredSemesters = getParsedSemesters(selectedStudent).length;
                    const completedSemesters = studentExamMarks.filter(m => m.status === 'completed').length;
                    const allExamsCompleted = requiredSemesters === completedSemesters;

                    return allExamsCompleted ? (
                      <button
                        disabled={isProcessing}
                        onClick={() => initiateCertificateGeneration(selectedStudent, false)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md transition-colors cursor-pointer"
                      >
                        {isProcessing ? 'Generating...' : 'Generate Certificate Now'}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-semibold border border-red-200">
                          <AlertCircle size={14} className="inline mr-1" />
                          Student has not completed all {requiredSemesters} semester exams yet. ({completedSemesters}/{requiredSemesters} completed)
                        </div>
                        {allowInstantCertificate ? (
                          <button
                            disabled={isProcessing}
                            onClick={() => initiateCertificateGeneration(selectedStudent, true)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Award size={16} />
                            {isProcessing ? 'Generating...' : `Generate Instant Certificate (Charges: ₹${instantCharge})`}
                          </button>
                        ) : (
                          <div className="bg-slate-100 text-slate-700 p-3.5 rounded-xl text-xs font-medium border border-slate-200 flex items-start gap-2.5 text-left">
                            <Lock size={16} className="text-slate-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold text-slate-800 block mb-0.5">Instant Certificate Unavailable</strong>
                              Instant certificate generation is not enabled for your center. All semester examinations must be completed to issue this certificate.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              {(selectedStudent.certificate_status === 'generated' || selectedStudent.certificate_status === 'issued') && (
                <>
                  <button onClick={() => setShowMarksheetModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Printer size={14} /> Print Marksheet
                  </button>
                  <button onClick={() => setShowCertModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Printer size={14} /> Print Certificate
                  </button>
                </>
              )}
              <button onClick={() => setModalType(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-xs font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {showMarksheetModal && selectedStudent && (
          <StudentMarksheetModal student={selectedStudent} onClose={() => setShowMarksheetModal(false)} />
        )}

        {showCertModal && selectedStudent && (
          <StudentCertificateModal
            student={{
              ...selectedStudent,
              marks: selectedStudent.marks && selectedStudent.marks.length > 0 ? selectedStudent.marks : studentExamMarks
            }}
            onClose={() => setShowCertModal(false)}
            onOpenMarksheet={() => {
              setShowCertModal(false);
              setShowMarksheetModal(true);
            }}
          />
        )}

        {/* 8. Batch Print ID Cards Modal (A4 Sheet Layout) */}
        {modalType === 'batch_idcards' && (
          <BatchIdCardModal
            students={students.filter(s => selectedStudentIds.includes(s.id))}
            onClose={() => setModalType(null)}
          />
        )}
      </Suspense>

      {/* 8b. Batch Print Certificates Modal */}
      {modalType === 'batch_certificates' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-6xl w-full p-6 space-y-5 my-6 border border-slate-300">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="text-amber-600" size={22} />
                  <h3 className="font-bold text-lg text-slate-900">
                    Batch Print Certificates ({selectedStudentIds.length} Students Selected)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Landscape Certificates with Dynamic Anti-Counterfeit Micro-Text, Holographic Security Thread, QR Code & Barcode.
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Container with previews */}
            <div
              id="batch-printable-certificates"
              className="max-h-[68vh] overflow-y-auto p-4 space-y-6 flex flex-col items-center bg-slate-200/60 rounded-xl border border-slate-300"
            >
              {students
                .filter(s => selectedStudentIds.includes(s.id))
                .map((st) => (
                  <div key={st.id} className="batch-cert-item flex flex-col items-center w-full">
                    <div className="w-full max-w-[830px] flex justify-between items-center px-2 py-1 text-xs font-semibold text-slate-600">
                      <span>{st.firstName} {st.lastName} ({st.enrollment_no || `ID: ${st.id}`})</span>
                      <span className="font-mono text-[11px] text-amber-700 font-bold">
                        Cert No: {st.certificate_number || 'Official Registered'}
                      </span>
                    </div>
                    <div
                      style={{ width: 1149 * 0.72, height: 758 * 0.72 }}
                      className="overflow-hidden shadow-xl rounded-lg border border-slate-400/80 bg-white shrink-0"
                    >
                      <OfficialCertificateCard
                        id={`batch-cert-${st.id}`}
                        student={st}
                        scale={0.72}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Tip: In print settings, select layout as <strong>Landscape</strong> and margins as <strong>None / 0</strong>.
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setModalType(null)}
                  className="py-2 px-4 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const container = document.getElementById('batch-printable-certificates');
                    if (!container) return;
                    const items = container.querySelectorAll('.batch-cert-item');
                    if (!items || items.length === 0) return;

                    let certsHtml = '';
                    items.forEach((item) => {
                      const certNode = item.querySelector('[id^="batch-cert-"]') as HTMLElement;
                      if (certNode) {
                        const clone = certNode.cloneNode(true) as HTMLElement;
                        clone.style.transform = 'scale(0.97)';
                        clone.style.transformOrigin = 'top left';
                        clone.style.boxShadow = 'none';
                        certsHtml += `
                          <div class="cert-print-page">
                            ${clone.outerHTML}
                          </div>
                        `;
                      }
                    });

                    const printWindow = window.open('', '_blank', 'width=1200,height=900');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Batch Official Certificates (${items.length} Students)</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <link rel="preconnect" href="https://fonts.googleapis.com">
                            <link rel="preconnect" href="https://fonts.gstatic.com">
                            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
                            <style>
                              @page {
                                size: A4 landscape;
                                margin: 0;
                              }
                              @media print {
                                body {
                                  -webkit-print-color-adjust: exact !important;
                                  print-color-adjust: exact !important;
                                  margin: 0 !important;
                                  padding: 0 !important;
                                  background: white !important;
                                }
                                .cert-print-page {
                                  page-break-after: always !important;
                                  page-break-inside: avoid !important;
                                  break-after: page !important;
                                  width: 100vw !important;
                                  height: 100vh !important;
                                  display: flex !important;
                                  align-items: center !important;
                                  justify-content: center !important;
                                  overflow: hidden !important;
                                }
                              }
                              .cert-print-page {
                                page-break-after: always;
                                page-break-inside: avoid;
                                break-after: page;
                                display: flex;
                                justify-content: center;
                                margin-bottom: 20px;
                              }
                            </style>
                          </head>
                          <body class="bg-white text-slate-900 m-0 p-0">
                            ${certsHtml}
                            <script>
                              setTimeout(() => {
                                window.print();
                                window.close();
                              }, 800);
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={15} /> Print All Selected Certificates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Cancel Student Enrollment & Token Refund Modal */}
      {modalType === 'cancel_enrollment' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden">
            {/* Header */}
            <div className="bg-rose-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-white" />
                <h3 className="font-bold text-base">Cancel Student Enrollment</h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Student Summary Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0">
                    <img
                      src={formatImageSrc(selectedStudent.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.firstName + ' ' + selectedStudent.lastName)}&background=e11d48&color=fff`}
                      alt={selectedStudent.firstName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                    <div className="font-mono text-indigo-700 font-bold text-[11px]">{selectedStudent.enrollment_no || `EXAM-${selectedStudent.id}`}</div>
                    <div className="text-slate-500 font-medium">{selectedStudent.courseName}</div>
                  </div>
                </div>
              </div>


              {/* Refund Info Box */}
              {(() => {
                const isWithin24Hours = selectedStudent.created_at ? (Math.abs(new Date().getTime() - new Date(selectedStudent.created_at).getTime()) / 3600000) <= 24 : false;
                return isWithin24Hours ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <Coins size={16} className="text-emerald-600" />
                        <span>Token Refund Amount:</span>
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        ₹{Number(selectedStudent.tokens_deducted || 250).toLocaleString('en-IN')} Tokens
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      ✓ <strong>100% Token Refund Eligible:</strong> Because the student was enrolled within the last 24 hours and the official certificate has <strong>NOT</strong> been generated, the full admission fee tokens will be automatically credited back to your center wallet immediately upon confirmation.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Coins size={16} className="text-gray-500" />
                        <span className="line-through opacity-70">Token Refund Amount:</span>
                      </span>
                      <span className="text-lg font-black text-gray-500">
                        ₹0 Tokens
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">
                      ❌ <strong>Refund Ineligible:</strong> More than 24 hours have passed since enrollment. The admission can still be cancelled, but no tokens will be refunded to your center wallet.
                    </p>
                  </div>
                );
              })()}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-snug">
                <strong>Policy Notice:</strong> If a certificate had already been generated for this student, cancellation and token refund would be permanently locked.
              </div>

              <p className="text-slate-600 font-medium text-center pt-1">
                Are you sure you want to cancel the enrollment for <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>?
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={isProcessing}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelEnrollment}
                disabled={isProcessing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>
                      {selectedStudent.created_at && (Math.abs(new Date().getTime() - new Date(selectedStudent.created_at).getTime()) / 3600000) <= 24
                        ? `Confirm Cancellation & Refund ₹${Number(selectedStudent.tokens_deducted || 250)}`
                        : 'Confirm Cancellation (No Refund)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Custom Confirmation for Advanced Edit */}
      {showAdvancedEditConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-indigo-200 flex flex-col">
            <div className="p-6 pb-4 bg-indigo-50 text-center flex flex-col items-center border-b border-indigo-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner mb-3">
                <Coins size={24} />
              </div>
              <h3 className="text-xl font-black text-indigo-900">Advanced Edit</h3>
              <p className="text-indigo-700 text-sm mt-2 font-medium">
                Saving these advanced edits will deduct <strong className="text-red-600">50 tokens</strong> from your center wallet.
              </p>
            </div>
            <div className="p-6 text-center text-sm text-gray-600 bg-white">
              Are you sure you want to proceed and save these changes?
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAdvancedEditConfirm(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndSaveAdvancedEdit}
                disabled={isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer text-xs shadow-md disabled:opacity-50"
              >
                {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 size={14} />}
                <span>Pay 50 Tokens & Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Set Exams (Marks) Modal */}
      {modalType === 'set_exams' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-indigo-50/60">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Laptop size={18} className="text-indigo-600" />
                Set Student Exams
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-slate-50 flex-1 space-y-4">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <h3 className="font-extrabold text-slate-900 text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedStudent.courseName || `Course ID: ${selectedStudent.courseId}`} {selectedStudent.roll_no ? `• Roll No: ${selectedStudent.roll_no}` : ''}</p>
              </div>

              {Number(selectedStudent.courseQuestionsCount || 0) === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2 shadow-2xs">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Exam Scheduling Locked:</span> No exam questions have been added for this course ({selectedStudent.courseName || `Course #${selectedStudent.courseId}`}). Exam dates cannot be scheduled until questions are added in Course Management.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {getParsedSemesters(selectedStudent).map((sem: any, index: number) => {
                  const semesterName = `SEM ${sem.num}`;
                  const currentMark = studentExamMarks.find(m => m.semester === semesterName) || { written_marks: 0, viva_marks: 0 };
                  const isCompleted = currentMark.status === 'completed';

                  return (
                    <div key={index} className={`p-4 bg-white border rounded-xl shadow-xs transition-colors ${isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-indigo-900 text-sm">{semesterName}</h4>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Lock size={10} className="text-emerald-700" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                            {currentMark.status || 'Pending'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mb-3 font-medium">{sem.subjects}</p>

                      {isCompleted && (
                        <div className="mb-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Exam completed and finalized. All marks and dates are locked.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {/* Written Marks */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Written Exam Marks (Max: {sem.marks})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={sem.marks}
                            value={currentMark.written_marks}
                            disabled={isCompleted}
                            readOnly={isCompleted}
                            className={`w-full px-3 py-2 border rounded-xl text-sm font-bold transition-colors ${isCompleted
                                ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                                : 'bg-white text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                              }`}
                            onChange={(e) => {
                              if (isCompleted) return;
                              const val = Math.min(Number(e.target.value), Number(sem.marks));
                              setStudentExamMarks(prev => {
                                const newMarks = [...prev];
                                const existingIdx = newMarks.findIndex(m => m.semester === semesterName);
                                if (existingIdx >= 0) newMarks[existingIdx].written_marks = val;
                                else newMarks.push({ semester: semesterName, written_marks: val, viva_marks: 0 });
                                return newMarks;
                              });
                            }}
                          />
                        </div>

                        {/* Viva Marks */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Viva Exam Marks (Max: {sem.oral})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={sem.oral}
                            value={currentMark.viva_marks}
                            disabled={isCompleted}
                            readOnly={isCompleted}
                            className={`w-full px-3 py-2 border rounded-xl text-sm font-bold transition-colors ${isCompleted
                                ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                                : 'bg-white text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                              }`}
                            onChange={(e) => {
                              if (isCompleted) return;
                              const val = Math.min(Number(e.target.value), Number(sem.oral));
                              setStudentExamMarks(prev => {
                                const newMarks = [...prev];
                                const existingIdx = newMarks.findIndex(m => m.semester === semesterName);
                                if (existingIdx >= 0) newMarks[existingIdx].viva_marks = val;
                                else newMarks.push({ semester: semesterName, written_marks: 0, viva_marks: val, exam_date: '' });
                                return newMarks;
                              });
                            }}
                          />
                        </div>

                        {/* Exam Date */}
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Exam Date</span>
                            {Number(selectedStudent.courseQuestionsCount || 0) === 0 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                Locked (0 Questions in Course)
                              </span>
                            )}
                          </label>
                          <input
                            type="date"
                            value={currentMark.exam_date ? (String(currentMark.exam_date).split('T')[0]) : ''}
                            disabled={isCompleted || Number(selectedStudent.courseQuestionsCount || 0) === 0}
                            readOnly={isCompleted || Number(selectedStudent.courseQuestionsCount || 0) === 0}
                            className={`w-full px-3 py-2 border rounded-xl text-sm font-bold transition-colors ${
                              isCompleted || Number(selectedStudent.courseQuestionsCount || 0) === 0
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none'
                                : 'bg-white text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                            }`}
                            onChange={(e) => {
                              if (isCompleted || Number(selectedStudent.courseQuestionsCount || 0) === 0) return;
                              const val = e.target.value;
                              setStudentExamMarks(prev => {
                                const newMarks = [...prev];
                                const existingIdx = newMarks.findIndex(m => m.semester === semesterName);
                                if (existingIdx >= 0) newMarks[existingIdx].exam_date = val;
                                else newMarks.push({ semester: semesterName, written_marks: 0, viva_marks: 0, exam_date: val });
                                return newMarks;
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(() => {
              const hasDateChangeCharge = studentExamMarks.some(mark => {
                const orig = originalExamMarks.find(o => o.semester === mark.semester);
                // Only charge if there was an original exam date, it is NOT completed, and it was changed to a different date
                const isCompleted = mark.status === 'completed';
                if (isCompleted) return false;
                return orig && orig.exam_date && mark.exam_date && orig.exam_date !== mark.exam_date;
              });

              const allExamsCompleted = getParsedSemesters(selectedStudent).every((sem: any) => {
                const m = studentExamMarks.find(mark => mark.semester === `SEM ${sem.num}`);
                return m && m.status === 'completed';
              });

              return (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
                  <div>
                    {hasDateChangeCharge && (
                      <span className="text-red-600 font-bold text-[11px] flex items-center gap-1.5 bg-red-50/80 px-2.5 py-1.5 rounded-md border border-red-200 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse">
                        <Coins size={14} className="text-red-500 drop-shadow-[0_0_2px_rgba(239,68,68,0.8)]" />
                        Changing Exam Date Costs 50 Tokens
                      </span>
                    )}
                    {allExamsCompleted && (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        All exams completed & locked
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 text-xs cursor-pointer"
                    >
                      {allExamsCompleted ? 'Close' : 'Cancel'}
                    </button>
                    {!allExamsCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          if (hasDateChangeCharge) {
                            if (!confirm("Are you sure you want to change the exam date? This will cost 50 tokens.")) return;
                          }
                          handleSaveExamMarks(hasDateChangeCharge);
                        }}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={14} />}
                        {hasDateChangeCharge ? 'Pay 50 Tokens & Save' : 'Save Marks & Exams'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 13. Edit Login Credentials Modal */}
      {modalType === 'edit_login' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Key size={18} className="text-indigo-600" />
                Update Login Details
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Login Email (ID)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLogin}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                disabled={isProcessing}
              >
                {isProcessing ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Verification Disclaimer Modal Before Generating Certificate */}
      {certWarningState.open && certWarningState.student && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Certificate Generation Disclaimer</h3>
                <p className="text-xs text-slate-500 font-medium">Verify credentials & adhere to official guidelines</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              {certWarningState.isInstant ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-medium flex items-start gap-2">
                  <Coins size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Generation:</strong> A fee of <strong className="text-amber-800">₹{instantCharge}</strong> will be deducted from your center wallet immediately.
                  </span>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-900 font-medium flex items-start gap-2">
                  <Coins size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Certificate Issuance Fee:</strong> A required fee of <strong className="text-indigo-800">₹{instantCharge}</strong> will be deducted from your center wallet upon generation.
                  </span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 font-medium">
                <div className="flex items-center justify-between text-slate-900 border-b border-slate-200 pb-1.5 font-semibold">
                  <span>Student Name:</span>
                  <span className="text-indigo-600 font-bold">{certWarningState.student.firstName} {certWarningState.student.lastName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Father's Name:</span>
                  <span className="font-semibold text-slate-900">{certWarningState.student.father_name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Course:</span>
                  <span className="font-semibold text-slate-900">{certWarningState.student.courseName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Roll Number:</span>
                  <span className="font-mono font-bold text-slate-900">{certWarningState.student.roll_no || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 text-red-900 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-red-700 text-[11px] uppercase tracking-wider">
                  <AlertTriangle size={14} />
                  Strict Policy & Warning
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800">
                  <li>Ensure all student details, spellings, and dates are 100% verified.</li>
                  <li>Certificate numbers are permanent and officially mapped.</li>
                  <li><strong>Warning:</strong> Taking unverified screenshots or issuing false certificates is strictly prohibited.</li>
                </ul>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={certWarningState.agreed}
                  onChange={(e) => setCertWarningState(prev => ({ ...prev, agreed: e.target.checked }))}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  I confirm that all student details and exam marks are accurate. I understand screenshots and tampered records are strictly invalid.
                </span>
              </label>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCertWarningState({ open: false, student: null, isInstant: false, agreed: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!certWarningState.agreed || isProcessing || !certWarningState.student}
                onClick={() => {
                  if (certWarningState.student) {
                    handleGenerateCertificate(certWarningState.student.id, certWarningState.isInstant);
                  }
                }}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${certWarningState.agreed && !isProcessing
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {isProcessing ? 'Generating...' : 'Confirm & Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Signature & Stamp Upload Modal (Lazy Loaded) */}
      {isSignModalOpen && (
        <Suspense fallback={null}>
          <CenterSignatureUploadModal
            isOpen={isSignModalOpen}
            centerId={centerId}
            onClose={() => setIsSignModalOpen(false)}
            onSaved={() => {
              fetchStudents();
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default StudentsList;
