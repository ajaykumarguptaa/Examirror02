import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronDown, CheckCircle2, AlertCircle, User, Camera, FileCheck2, CheckCircle, ExternalLink, Clock, Lock } from 'lucide-react';
import axios from 'axios';
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

const AddStudent = () => {
  const getCenterId = () => {
    if (localStorage.getItem('centerId')) return Number(localStorage.getItem('centerId'));
    try {
      const u = JSON.parse(localStorage.getItem('centerUser') || '{}');
      if (u && (u.id || u.centerId)) return Number(u.id || u.centerId);
    } catch (_) {}
    return 1;
  };
  const centerId = getCenterId();

  // Data from backend
  const [courses, setCourses] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string; enrollNo?: string }>({ show: false, message: '' });

  // Form State
  const [studentType, setStudentType] = useState('New Student');
  const [allowOldStudent, setAllowOldStudent] = useState<boolean>(false);
  const [oldStudentSecondsLeft, setOldStudentSecondsLeft] = useState<number>(0);
  const [fullName, setFullName] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [gender, setGender] = useState('Male');
  const [maritalStatus, setMaritalStatus] = useState('Unmarried');
  const [dob, setDob] = useState('2003-09-27');
  const [qualification, setQualification] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Bihar');

  // Course State
  const [courseId, setCourseId] = useState<string>('');
  const [courseFee, setCourseFee] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [sessionFrom, setSessionFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionTo, setSessionTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Documents & Photo
  const [studentIdType, setStudentIdType] = useState('Aadhaar Card');
  const [idCardNo, setIdCardNo] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idCardBase64, setIdCardBase64] = useState<string | null>(null);
  const [marksheetBase64, setMarksheetBase64] = useState<string | null>(null);
  const [idCardFileName, setIdCardFileName] = useState<string>('no file selected');
  const [marksheetFileName, setMarksheetFileName] = useState<string>('no file selected');
  const [academicStatus, setAcademicStatus] = useState<'pursuing' | 'passout'>('pursuing');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const marksheetInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [coursesRes, walletRes, permRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/center/courses?centerId=${centerId}`),
        axios.get(`http://localhost:3000/api/center/${centerId}/wallet`),
        axios.get(`http://localhost:3000/api/center/${centerId}/old-student-permission`).catch(() => ({ data: { allowed: false, seconds_left: 0 } }))
      ]);

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || []);
      }
      if (walletRes.data.success) {
        setWalletBalance(walletRes.data.data.balance || 0);
      }
      if (permRes?.data?.success) {
        const isAllowed = Boolean(permRes.data.allowed);
        setAllowOldStudent(isAllowed);
        setOldStudentSecondsLeft(Number(permRes.data.seconds_left) || 0);
        if (!isAllowed && studentType === 'Old Student') {
          setStudentType('New Student');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live countdown timer for 2-hour Old Student permission window
  useEffect(() => {
    if (oldStudentSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setOldStudentSecondsLeft(prev => {
        if (prev <= 1) {
          setAllowOldStudent(false);
          setStudentType('New Student');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [oldStudentSecondsLeft]);

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const selectedCourse = courses.find(c => c.id === Number(courseId));
  const isSelectedCourseReady = selectedCourse ? (selectedCourse.questionsCount || 0) > 0 : false;

  // Helper to extract months from duration string (e.g., "6 Months", "3 Month(s)", "1 Year")
  const parseDurationInMonths = (durStr: string): number => {
    if (!durStr) return 0;
    const lower = durStr.toLowerCase().trim();
    if (lower.includes('year')) {
      const numMatch = lower.match(/\d+/);
      const years = numMatch ? parseInt(numMatch[0], 10) : 1;
      return years * 12;
    }
    if (lower.includes('month')) {
      const numbers = lower.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const maxNum = Math.max(...numbers.map(n => parseInt(n, 10)));
        return maxNum > 0 ? maxNum : 3;
      }
      return 3;
    }
    const numMatch = lower.match(/\d+/);
    return numMatch ? parseInt(numMatch[0], 10) : 0;
  };

  const calculateSessionTo = (startDate: string, durStr: string): string => {
    if (!startDate) return '';
    const months = parseDurationInMonths(durStr);
    if (months <= 0) return startDate;
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return startDate;
    d.setMonth(d.getMonth() + months);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleCourseSelect = (cid: string) => {
    setCourseId(cid);
    const found = courses.find(c => c.id === Number(cid));
    if (found) {
      if (found.fee !== undefined && found.fee !== null) {
        setCourseFee(String(found.fee));
      }
      const dur = found.duration || '';
      setDuration(dur);
      if (dur && sessionFrom) {
        setSessionTo(calculateSessionTo(sessionFrom, dur));
      }
    } else {
      setCourseFee('');
      setDuration('');
    }
  };

  const handleSessionFromChange = (newFrom: string) => {
    setSessionFrom(newFrom);
    if (duration && newFrom) {
      setSessionTo(calculateSessionTo(newFrom, duration));
    }
  };

  // Sync sessionTo whenever duration or sessionFrom changes
  useEffect(() => {
    if (duration && sessionFrom) {
      setSessionTo(calculateSessionTo(sessionFrom, duration));
    }
  }, [duration, sessionFrom]);

  // Enrollment is free; certificate fee is deducted only upon certificate generation
  const requiredTokens = 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.8, maxSizeKB: 120 });
        setPhotoPreview(result.dataUrl);
      } catch (err) {
        console.error('Photo compression error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleIdCardFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFileName(file.name);
      if (file.type.startsWith('image/')) {
        try {
          const result = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8, maxSizeKB: 180 });
          setIdCardBase64(result.dataUrl);
        } catch (err) {
          console.error('ID Card compression error:', err);
          const reader = new FileReader();
          reader.onloadend = () => setIdCardBase64(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setIdCardBase64(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleMarksheetFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMarksheetFileName(file.name);
      if (file.type.startsWith('image/')) {
        try {
          const result = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8, maxSizeKB: 180 });
          setMarksheetBase64(result.dataUrl);
        } catch (err) {
          console.error('Marksheet compression error:', err);
          const reader = new FileReader();
          reader.onloadend = () => setMarksheetBase64(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setMarksheetBase64(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedTerms) {
      setFeedback({ type: 'error', text: 'Please agree to the Terms & Conditions and Privacy Policy.' });
      return;
    }

    if (!courseId) {
      setFeedback({ type: 'error', text: 'Please select a Student Course.' });
      return;
    }

    if (!isValidIndianPhone(parentMobile)) {
      setFeedback({ type: 'error', text: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
      return;
    }

    if (!isValidPincode(pincode)) {
      setFeedback({ type: 'error', text: 'Please enter a valid 6-digit area pincode.' });
      return;
    }

    if (studentIdType === 'Aadhaar Card' && !isValidAadhaar(idCardNo)) {
      setFeedback({ type: 'error', text: 'Aadhaar Card number must be exactly 12 digits.' });
      return;
    }

    if (studentIdType === 'PAN Card' && !isValidPAN(idCardNo)) {
      setFeedback({ type: 'error', text: 'PAN Card number must be in valid format (e.g., ABCDE1234F).' });
      return;
    }



    try {
      setLoading(true);
      setFeedback(null);

      // Split full name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || '';

      const res = await axios.post('http://localhost:3000/api/center/students', {
        firstName,
        lastName,
        courseId: Number(courseId),
        centerId,
        studentType: studentType === 'New Student' ? 'new' : 'old',
        duration: duration || selectedCourse?.duration || '3 months',
        dob,
        gender,
        maritalStatus,
        phone: parentMobile,
        fatherName: fatherHusbandName,
        motherName,
        qualification,
        address,
        pincode,
        city: city || district,
        state,
        courseFee: Number(String(courseFee).replace(/[^0-9.]/g, '')) || 0,
        sessionStart: sessionFrom,
        sessionEnd: sessionTo,
        idType: studentIdType,
        idNumber: idCardNo,
        academicStatus,
        photoUrl: photoPreview || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
        idCardUrl: idCardBase64 || '',
        marksheetUrl: marksheetBase64 || ''
      });

      if (res.data.success) {
        setSuccessModal({
          show: true,
          message: `Student ${fullName} registered successfully!`,
          enrollNo: res.data.enrollment_no || ''
        });
        setFeedback(null);
        // Clear fields
        setFullName('');
        setFatherHusbandName('');
        setMotherName('');
        setParentMobile('');
        setQualification('');
        setAddress('');
        setPincode('');
        setCity('');
        setDistrict('');
        setCourseFee('');
        setDuration('');
        setCourseId('');
        setIdCardNo('');
        setPhotoPreview(null);
        setIdCardBase64(null);
        setMarksheetBase64(null);
        setIdCardFileName('no file selected');
        setMarksheetFileName('no file selected');
        window.dispatchEvent(new Event('center-stats-updated'));
        fetchData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to add student.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto pb-12 font-sans">
      {/* Feedback Banner */}
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

      {/* Main Form Container Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6 sm:p-8">

        {/* Title Header */}
        <div className="mb-6 flex flex-wrap items-baseline gap-2">
          <h1 className="text-xl font-bold text-[#1e293b]">Add Student</h1>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ Free Enrollment • Certificate fee applicable at issuance
          </span>
          <span className="ml-auto text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded border border-indigo-100">
            Wallet Balance: ₹{walletBalance}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN (Student Basic Details & Course Details) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Section 1: Student Basic Details */}
              <div>
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">Student Basic Details</h2>

                <div className="space-y-3">

                  {/* Row 1: Student Type & Student Fullname */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Student Type Floating Label */}
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Student Type</label>
                        {allowOldStudent ? (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 animate-pulse">
                            <Clock size={10} className="text-amber-600" />
                            Old Student Allowed ({formatTimeRemaining(oldStudentSecondsLeft)})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">New Student Admission</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          value={studentType}
                          onChange={(e) => setStudentType(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                        >
                          <option value="New Student">New Student</option>
                          {allowOldStudent && (
                            <option value="Old Student">Old Student (2h Authorized)</option>
                          )}
                        </select>
                        <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Student Fullname */}
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="Student Fullname *"
                        value={fullName}
                        onChange={(e) => setFullName(onlyNameLetters(e.target.value))}
                        className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Row 2: Father/Husband name & Mother name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
                        <input
                          type="text"
                          required
                          placeholder="Father/Husband name *"
                          value={fatherHusbandName}
                          onChange={(e) => setFatherHusbandName(onlyNameLetters(e.target.value))}
                          className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 pl-1">
                        Enter Husband name if student is married.
                      </p>
                    </div>

                    <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white h-[42px]">
                      <input
                        type="text"
                        required
                        placeholder="Mother name *"
                        value={motherName}
                        onChange={(e) => setMotherName(onlyNameLetters(e.target.value))}
                        className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Row 3: Parent's Mobile No. */}
                  <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Parent's Mobile No. (10 Digits) *"
                      value={parentMobile}
                      onChange={(e) => setParentMobile(onlyDigits(e.target.value, 10))}
                      className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                    />
                  </div>

                  {/* Row 4: Gender & Marital Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Gender</label>
                      <div className="flex items-center justify-between">
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                      </div>
                    </div>

                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Maritial Status</label>
                      <div className="flex items-center justify-between">
                        <select
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                        >
                          <option value="Unmarried">Unmarried</option>
                          <option value="Married">Married</option>
                        </select>
                        <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Date of birth & Qualification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Date of birth *</label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full text-sm font-medium text-[#1e293b] outline-none bg-transparent cursor-pointer"
                      />
                    </div>

                    <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="Qualification *"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Row 6: Address Textarea */}
                  <div className="border border-[#cbd5e1] rounded-md px-3 py-2 focus-within:border-[#6366f1] bg-white">
                    <textarea
                      required
                      rows={3}
                      placeholder="Address *"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent resize-y"
                    />
                  </div>

                  {/* Row 7: Area Pincode & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Area Pincode (6 Digits) *"
                        value={pincode}
                        onChange={(e) => setPincode(onlyDigits(e.target.value, 6))}
                        className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                      />
                    </div>

                    <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
                      <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Row 8: District & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
                      <input
                        type="text"
                        placeholder="District"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                      />
                    </div>

                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">State</label>
                      <div className="flex items-center justify-between">
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                        >
                          <option value="Bihar">Bihar</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Jharkhand">Jharkhand</option>
                          <option value="West Bengal">West Bengal</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Haryana">Haryana</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Odisha">Odisha</option>
                          <option value="Assam">Assam</option>
                        </select>
                        <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 2: Course Details* */}
              <div>
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">Course Details*</h2>

                <div className="space-y-3">

                  {/* Row 9: Student Course & Course Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Student Course Floating Select */}
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Student Course *</label>
                      <div className="flex items-center justify-between">
                        <select
                          required
                          value={courseId}
                          onChange={(e) => handleCourseSelect(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                        >
                          <option value="">Select Course</option>
                          {courses.map((c) => {
                            const isReady = (c.questionsCount || 0) > 0;
                            return (
                              <option
                                key={c.id}
                                value={c.id}
                              >
                                {c.name} ({c.code}) {isReady ? `(${c.questionsCount} Qs Available)` : '(Questions Pending)'}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                      </div>
                      {selectedCourse && !isSelectedCourseReady && (
                        <div className="mt-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200/80 rounded-md text-[11px] text-amber-800 flex items-start gap-1.5">
                          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Note:</strong> This course has 0 questions added yet. You can enroll the student now; exam scheduling will be enabled once questions are configured in Course Management.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Course Duration (Auto-fetched & Strictly Locked) */}
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 bg-slate-100/90 cursor-not-allowed select-none">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-slate-600 leading-tight flex items-center gap-1">
                          <Lock size={11} className="text-slate-400" /> Course Duration * (Locked)
                        </label>
                        {duration && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            Auto-fetched
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        readOnly
                        required
                        tabIndex={-1}
                        onKeyDown={(e) => e.preventDefault()}
                        placeholder="Select course to auto-fetch duration"
                        value={duration}
                        className="w-full text-sm font-bold text-slate-700 placeholder-gray-400 outline-none bg-transparent cursor-not-allowed pointer-events-none mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Row 10: Total Course Fee in Center & Academic Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Total Course Fee in Center (Auto-fetched & Strictly Locked) */}
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 bg-slate-100/90 cursor-not-allowed select-none">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-slate-600 leading-tight flex items-center gap-1">
                          <Lock size={11} className="text-slate-400" /> Total Course Fee in Center (₹) * (Locked)
                        </label>
                        {courseFee && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            Auto-fetched
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        readOnly
                        required
                        tabIndex={-1}
                        onKeyDown={(e) => e.preventDefault()}
                        placeholder="Select course to auto-fetch fee"
                        value={courseFee ? `₹${courseFee}` : ''}
                        className="w-full text-sm font-black text-indigo-700 placeholder-gray-400 outline-none bg-transparent cursor-not-allowed pointer-events-none mt-0.5"
                      />
                    </div>

                    {/* Academic Status (Currently Pursuing / Passout) */}
                    <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">
                        Academic Status *
                      </label>
                      <div className="flex items-center justify-between">
                        <select
                          value={academicStatus}
                          onChange={(e) => setAcademicStatus(e.target.value as 'pursuing' | 'passout')}
                          className="w-full bg-transparent text-sm font-semibold text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                        >
                          <option value="pursuing">Currently Pursuing (Enrolled / Active)</option>
                          <option value="passout">Passout / Completed Course</option>
                        </select>
                        <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Row 11: Session From & Session to (Auto-calculated from duration) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                      <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Session From (Start Date) *</label>
                      <input
                        type="date"
                        required
                        value={sessionFrom}
                        onChange={(e) => handleSessionFromChange(e.target.value)}
                        className="w-full text-sm font-medium text-[#1e293b] outline-none bg-transparent cursor-pointer mt-0.5"
                      />
                    </div>

                    <div className="border border-[#cbd5e1] rounded-md px-3 py-1.5 bg-slate-50 focus-within:border-[#6366f1]">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Session to (Completion Date) *</label>
                        {duration && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            Auto (+{duration})
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        required
                        value={sessionTo}
                        onChange={(e) => setSessionTo(e.target.value)}
                        className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (Student Photo & Student Documents) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Section 1: Student Photo * */}
              <div>
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">Student Photo *</h2>

                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-56 border border-[#cbd5e1] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors bg-white overflow-hidden group"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Student Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-3 border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors relative">
                        <User size={40} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs border border-slate-200 text-slate-500 group-hover:text-indigo-600">
                          <Camera size={14} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        Click here to upload
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        JPG, PNG up to 2MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Student Documents * */}
              <div>
                <h2 className="text-[15px] font-bold text-[#1e293b] mb-3">Student Documents *</h2>

                <div className="space-y-3">
                  {/* Student ID Type Floating Select */}
                  <div className="relative border border-[#cbd5e1] rounded-md px-3 py-1.5 focus-within:border-[#6366f1] bg-white">
                    <label className="block text-[11px] font-semibold text-[#6366f1] leading-tight">Student ID Type</label>
                    <div className="flex items-center justify-between">
                      <select
                        value={studentIdType}
                        onChange={(e) => {
                          setStudentIdType(e.target.value);
                          setIdCardNo('');
                        }}
                        className="w-full bg-transparent text-sm font-medium text-[#1e293b] outline-none appearance-none cursor-pointer pr-4"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="College/School ID">College/School ID</option>
                      </select>
                      <ChevronDown size={14} className="text-gray-500 absolute right-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* ID Card No * */}
                  <div className="border border-[#cbd5e1] rounded-md px-3 py-2.5 focus-within:border-[#6366f1] bg-white">
                    <input
                      type="text"
                      required
                      inputMode={studentIdType === 'Aadhaar Card' ? 'numeric' : 'text'}
                      maxLength={studentIdType === 'Aadhaar Card' ? 12 : studentIdType === 'PAN Card' ? 10 : 30}
                      placeholder={
                        studentIdType === 'Aadhaar Card'
                          ? 'Aadhaar Number (12 Digits) *'
                          : studentIdType === 'PAN Card'
                          ? 'PAN Card Number (10 Alphanumeric, e.g. ABCDE1234F) *'
                          : 'ID Card No *'
                      }
                      value={idCardNo}
                      onChange={(e) => {
                        if (studentIdType === 'Aadhaar Card') {
                          setIdCardNo(onlyDigits(e.target.value, 12));
                        } else if (studentIdType === 'PAN Card') {
                          setIdCardNo(formatPAN(e.target.value));
                        } else {
                          setIdCardNo(e.target.value);
                        }
                      }}
                      className="w-full text-sm font-medium text-[#1e293b] placeholder-gray-500 outline-none bg-transparent"
                    />
                  </div>

                  {/* File Pickers Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* ID Card Photo Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">ID Card Photo *</label>
                      <input
                        type="file"
                        ref={idCardInputRef}
                        onChange={handleIdCardFile}
                        className="hidden"
                      />
                      <div className="flex items-center border border-[#cbd5e1] rounded-md overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => idCardInputRef.current?.click()}
                          className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] text-xs font-medium px-3 py-2.5 transition-colors border-r border-[#cbd5e1] shrink-0"
                        >
                          Choose File
                        </button>
                        <span className="text-xs text-gray-500 px-2 truncate">
                          {idCardFileName}
                        </span>
                      </div>
                    </div>

                    {/* Any Qualification Marksheet Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Any Qualification Marksheet *</label>
                      <input
                        type="file"
                        ref={marksheetInputRef}
                        onChange={handleMarksheetFile}
                        className="hidden"
                      />
                      <div className="flex items-center border border-[#cbd5e1] rounded-md overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => marksheetInputRef.current?.click()}
                          className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] text-xs font-medium px-3 py-2.5 transition-colors border-r border-[#cbd5e1] shrink-0"
                        >
                          Choose File
                        </button>
                        <span className="text-xs text-gray-500 px-2 truncate">
                          {marksheetFileName}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* Bottom Terms & Submission Section */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center space-y-4">

            {/* Terms and conditions checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#334155] text-center">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#6366f1] focus:ring-[#6366f1] border-gray-300"
              />
              <span>
                I agreed to all <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#2563eb] underline font-bold">TERMS & CONDITIONS</a> & <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#2563eb] underline font-bold">PRIVACY POLICY</a> of EXAMIRROR EDUTECH PRIVATE LIMITED
              </span>
            </label>

            {/* All fields are required footnote */}
            <p className="text-xs text-gray-500 font-medium">
              * All fields are required
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#9496f8] hover:bg-[#8184f7] active:bg-[#7275f5] text-white font-semibold px-12 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2.5 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} className="transform rotate-45 -translate-y-0.5" />
              <span className="opacity-80">|</span>
              <span>{loading ? 'Submitting...' : 'Submit'}</span>
            </button>

          </div>

        </form>

      </div>

      {/* Success Modal Popup */}
      {successModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden scale-in-center">
            <div className="bg-emerald-50 p-6 flex flex-col items-center text-center border-b border-emerald-100">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">Registration Successful!</h3>
              <p className="text-emerald-700 font-medium text-sm leading-relaxed">
                {successModal.message}
              </p>
            </div>
            
            <div className="p-6 bg-white space-y-4 text-center">
              {successModal.enrollNo && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Student Enrollment No</p>
                  <p className="text-xl font-mono font-black text-indigo-700 select-all">{successModal.enrollNo}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.location.href = '/center/students'}
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-700 text-slate-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  <ExternalLink size={18} /> View Students
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessModal({ show: false, message: '' })}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors"
                >
                  Add Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStudent;

