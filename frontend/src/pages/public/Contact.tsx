import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  MessageSquare,
  User,
  BookOpen,
  Award,
  Building2,
  ExternalLink,
  Check,
  Headphones,
  ArrowRight,
  MessageCircle,
  X,
  FileText,
  Search,
  Eye,
  Printer,
  GraduationCap,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SEO from '../../components/SEO';
import { onlyDigits, onlyNameLetters, isValidIndianPhone, isValidEmail } from '../../utils/validators';

interface DynamicCourseOption {
  id: number;
  name: string;
  code?: string;
  duration?: string;
  fee?: number | string;
}

export const DEFAULT_DEMO_SHOWCASE = {
  enabled: true,
  title: 'Official Specimen & Verification Showcase',
  subtitle: 'Explore authentic demo certificates, authorized study center licenses, and online verifiable student marksheets.',
  demoCertificate: {
    title: 'Diploma in Computer Application (DCA)',
    studentName: 'Ajay Kumar Gupta',
    rollNo: 'ROL-10004',
    enrollmentNo: 'EXAM-2026-1004',
    certificateNo: 'EXAM-2026-836087',
    courseName: 'DCA (Diploma in Computer Application)',
    grade: 'Grade A+ (94%)',
    issueDate: '15-08-2026',
    sampleImageUrl: ''
  },
  demoCenter: {
    centerName: 'Delhi Main Computer Skill Center',
    centerCode: 'CENT001',
    directorName: 'Chhoton Ghosh',
    city: 'New Delhi-110001',
    state: 'Delhi',
    phone: '+91 98765 43210',
    sampleImageUrl: ''
  },
  demoStudent: {
    studentName: 'Ajay Gupta',
    rollNo: 'ROL-10001',
    enrollmentNo: 'EXM-2026-1001',
    courseName: 'ADCA (Advance Diploma in Computer Application)',
    centerCode: 'CENT001',
    sampleImageUrl: ''
  }
};

const INQUIRY_TYPES = [
  { id: 'admission', label: 'Course Admission', icon: BookOpen },
  { id: 'franchise', label: 'Center Affiliation', icon: Building2 },
  { id: 'certificate', label: 'Certificate Verification', icon: Award },
  { id: 'general', label: 'General Inquiry', icon: MessageSquare },
];

const Contact = () => {
  const [searchParams] = useSearchParams();
  const queryCourse = searchParams.get('course') || '';
  const queryCode = searchParams.get('code') || '';

  const [selectedInquiry, setSelectedInquiry] = useState('admission');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    course: queryCourse || '',
    message: ''
  });
  const [dynamicCourses, setDynamicCourses] = useState<DynamicCourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Demo Showcase State (Managed via Super Admin Panel)
  const [demoShowcase, setDemoShowcase] = useState(DEFAULT_DEMO_SHOWCASE);

  // Specimen Preview Modal
  const [activeSpecimen, setActiveSpecimen] = useState<{
    type: 'certificate' | 'center' | 'student';
    title: string;
    data: any;
  } | null>(null);

  // Live Verification Test Modal
  const [verifyModal, setVerifyModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    type: 'center' | 'student';
    query: string;
    result: any;
    error?: string;
  }>({
    isOpen: false,
    loading: false,
    type: 'student',
    query: '',
    result: null
  });

  // Fetch Dynamic Courses from Super Admin / Public Catalog
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await axios.get('http://localhost:3000/api/public/courses');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDynamicCourses(res.data.data);

          if (queryCourse) {
            const matched = res.data.data.find(
              (c: DynamicCourseOption) =>
                c.name.toLowerCase() === queryCourse.toLowerCase() ||
                (c.code && queryCode && c.code.toLowerCase() === queryCode.toLowerCase())
            );
            if (matched) {
              setFormData(prev => ({ ...prev, course: matched.name }));
            } else {
              setFormData(prev => ({ ...prev, course: queryCourse }));
            }
          } else if (res.data.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              course: prev.course ? prev.course : res.data.data[0].name
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load courses dynamically:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [queryCourse, queryCode]);

  // Fetch Demo Showcase Settings
  useEffect(() => {
    const fetchDemoSettings = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/settings/demo_showcase');
        if (res.data?.success && res.data.data) {
          const merged = {
            ...DEFAULT_DEMO_SHOWCASE,
            ...res.data.data,
            demoCertificate: { ...DEFAULT_DEMO_SHOWCASE.demoCertificate, ...(res.data.data.demoCertificate || {}) },
            demoCenter: { ...DEFAULT_DEMO_SHOWCASE.demoCenter, ...(res.data.data.demoCenter || {}) },
            demoStudent: { ...DEFAULT_DEMO_SHOWCASE.demoStudent, ...(res.data.data.demoStudent || {}) },
          };
          setDemoShowcase(merged);
        }
      } catch (err) {
        // Fallback to default demo values
      }
    };
    fetchDemoSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Please fill in your Full Name and Phone Number.');
      return;
    }

    if (!isValidIndianPhone(formData.phone)) {
      setErrorMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const matchedInquiry = INQUIRY_TYPES.find(t => t.id === selectedInquiry)?.label || 'Course Admission';

    try {
      const response = await axios.post('http://localhost:3000/api/public/contact', {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        inquiryType: matchedInquiry,
        course: formData.course,
        message: formData.message.trim()
      });

      if (response.data?.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(response.data?.message || 'Failed to submit inquiry.');
      }
    } catch (err: any) {
      console.error('Error submitting contact form:', err);
      setErrorMessage(err.response?.data?.message || 'Server connection error. Please try again or reach out on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setErrorMessage('');
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      course: 'ADCA',
      message: ''
    });
  };



  // Live Verification Test Handler
  const handleTestVerify = async (type: 'center' | 'student', query: string) => {
    setVerifyModal({
      isOpen: true,
      loading: true,
      type,
      query,
      result: null
    });

    try {
      const endpoint = type === 'center'
        ? `/api/public/verify/center/${encodeURIComponent(query)}`
        : `/api/public/verify/student/${encodeURIComponent(query)}`;

      const res = await fetch(`http://localhost:3000${endpoint}`);
      const data = await res.json();

      if (data.success && data.data) {
        setVerifyModal({
          isOpen: true,
          loading: false,
          type,
          query,
          result: data.data
        });
      } else {
        setVerifyModal({
          isOpen: true,
          loading: false,
          type,
          query,
          result: null,
          error: data.message || `No active record found for identifier "${query}".`
        });
      }
    } catch (err) {
      setVerifyModal({
        isOpen: true,
        loading: false,
        type,
        query,
        result: null,
        error: 'Verification connection failed. Please ensure backend server is reachable.'
      });
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#f8fafc] min-h-screen text-slate-800 font-sans selection:bg-blue-600 selection:text-white pb-20">
      <SEO
        title="Contact Us | Examirror Admissions & Support Helpdesk"
        description="Contact Examirror for course admissions, computer center franchise inquiries, certificate verification, and student support across India."
        keywords={[
          'Contact Examirror',
          'Examirror Helpdesk',
          'Computer Center Franchise Inquiry',
          'DCA Admission Contact',
          'Examirror Phone Number Email'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Contact Us', item: '/contact' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Examirror',
          description: 'Official contact and support helpdesk for Examirror skill development institute network.',
          mainEntity: {
            '@type': 'EducationalOrganization',
            name: 'Examirror',
            email: 'saurabhcsjnu@gmail.com',
            telephone: '+91-9800000000',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Ghatsila Jamshedpur East Singhbhum',
              addressLocality: 'Jamshedpur',
              addressRegion: 'Jharkhand',
              postalCode: '832303',
              addressCountry: 'IN'
            }
          }
        }}
      />

      {/* Top Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-14 lg:py-18 border-b-2 border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>24/7 Admissions & Support Helpdesk</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4"
          >
            Get in Touch With Our Team
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Have inquiries regarding computer course admissions, new study center affiliation, or student certificate authentication? We are here to assist you.
          </motion.p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 sm:-mt-8 relative z-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column - Redesigned Contact Form Card (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-6 sm:p-9 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Headphones size={20} />
                  </div>
                  <span>Send Us a Message</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Fill out the form below and our team will get back to you within 24 hours.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Fast Response
              </span>
            </div>

            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 px-4 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Thank You, {formData.fullName}!</h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                    Your inquiry has been received by Examirror Admissions & Support Desk. One of our academic advisors will contact you shortly at <strong>{formData.phone}</strong>.
                  </p>
                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      Send Another Message
                    </button>
                    <a
                      href={`https://wa.me/91?text=Hello%20Examirror,%20I%20have%20an%20inquiry%20regarding%20${encodeURIComponent(formData.course)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-200"
                    >
                      <MessageCircle size={15} /> WhatsApp Direct
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >
                  {/* Inquiry Type Chips - Uniform Height & No Truncation */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                      I'm Interested In:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {INQUIRY_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedInquiry === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedInquiry(type.id)}
                            className={`px-3 py-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center min-h-[76px] ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                          >
                            <Icon size={18} className={isSelected ? 'text-amber-300' : 'text-slate-500'} />
                            <span className="w-full text-center leading-snug">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name and Phone Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User size={16} />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: onlyNameLetters(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="e.g. Ajay Kumar"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phone Number (10 Digits) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone size={16} />
                        </div>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: onlyDigits(e.target.value, 10) })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email and Course Select Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="e.g. name@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Preferred Course / Program
                        </label>
                        {loadingCourses && (
                          <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" /> Loading...
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <BookOpen size={16} />
                        </div>
                        <select
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                        >
                          {/* If query course from URL not in dynamic list yet, show it */}
                          {queryCourse && !dynamicCourses.some(c => c.name.toLowerCase() === queryCourse.toLowerCase()) && (
                            <option value={queryCourse}>{queryCourse} (Selected Course)</option>
                          )}

                          {/* Dynamic Master Catalog Courses */}
                          {dynamicCourses.length > 0 ? (
                            dynamicCourses.map((c) => {
                              const label = c.code ? `${c.name} (${c.code})` : c.name;
                              return (
                                <option key={c.id} value={c.name}>
                                  {label}
                                </option>
                              );
                            })
                          ) : (
                            /* Fallback placeholder while loading */
                            <>
                              <option value="ADCA (Advance Diploma in Computer Application)">ADCA (Advance Diploma in Computer Application)</option>
                              <option value="DCA (Diploma in Computer Application)">DCA (Diploma in Computer Application)</option>
                              <option value="PGDCA (Post Graduate Diploma)">PGDCA (Post Graduate Diploma)</option>
                              <option value="DIT (Diploma in Information Technology)">DIT (Diploma in Information Technology)</option>
                              <option value="Tally Prime & GST Accounting">Tally Prime & GST Accounting</option>
                              <option value="Basic Computer & Internet Office">Basic Computer & Internet Office</option>
                            </>
                          )}
                          <option value="Center Affiliation Inquiry">Center Affiliation Inquiry</option>
                          <option value="Other / General Program Inquiry">Other / General Program Inquiry</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Message or Questions
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none placeholder:text-slate-400"
                      placeholder="Tell us what you would like to know or how we can help you..."
                    ></textarea>
                  </div>

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                      <span className="font-bold">Error:</span> {errorMessage}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                      <span>Your information is 100% private and protected.</span>
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-3d-primary w-full sm:w-auto py-3 px-8 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column - Academy Card & Contact Details (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-5 space-y-5"
          >
            {/* Academy Institutional Profile Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center p-2 shadow-md shrink-0">
                    <img src="/assets/favicon.png" alt="Examirror" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">
                      Examirror Skill Development
                    </h3>
                    <p className="text-[11px] font-bold text-amber-400 tracking-wide flex items-center gap-1">
                      <ShieldCheck size={13} />
                      <span>Govt. Regd. | ISO 9001:2015 Certified</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-normal leading-relaxed">
                  Examirror is an authorized IT literacy and skill training institution dedicated to offering high-value certified career diplomas.
                </p>

                {/* Course Badges */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Flagship Certified Courses:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['BASIC', 'DCA', 'ADCA', 'PGDCA', 'TALLY PRIME', 'DIT'].map((course) => (
                      <span
                        key={course}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold tracking-wide"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              {/* Phone Card */}
              <a
                href="tel:+919123106042"
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 transition-all group"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Phone size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Phone & WhatsApp Desk
                  </span>
                  <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    +91 91231 06042
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Mon - Sat: 9:30 AM - 6:30 PM</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </a>

              {/* Email Card */}
              <a
                href="mailto:saurabhcsjnu@gmail.com"
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 transition-all group"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Mail size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Official Email Communications
                  </span>
                  <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    saurabhcsjnu@gmail.com
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">info@examirror.edu.in</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </a>

              {/* Location Card */}
              <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Campus & Registered Office
                  </span>
                  <div className="text-xs font-bold text-slate-900 leading-snug mt-0.5">
                    Ghatsila, Jamshedpur, East Singhbhum, Jharkhand – 832303
                  </div>
                  <a
                    href="https://maps.google.com/?q=Ghatsila+Jamshedpur+Jharkhand+832303"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-1 hover:underline cursor-pointer"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Instant WhatsApp Quick Button */}
              <a
                href="https://wa.me/91?text=Hello%20Examirror,%20I%20would%20like%20to%20inquire%20about%20computer%20courses"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp (+91 91231 06042)</span>
              </a>

            </div>

          </motion.div>

        </div>

        {/* ========================================================================= */}
        {/* NEW FEATURE: DEMO CERTIFICATE, CENTER & STUDENT SHOWCASE & SUPER ADMIN CONTROLS */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* DEMO CERTIFICATE, CENTER & STUDENT SPECIMEN SHOWCASE (MANAGED IN SUPER ADMIN PANEL) */}
        {/* ========================================================================= */}
        {demoShowcase.enabled && (
          <section className="mt-14 pt-10 border-t-2 border-slate-200/80">
            <div>
              {/* Section Header */}
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs mb-3">
                  <Award size={14} className="text-blue-600" />
                  <span>Instant Verification & Authenticity Proof</span>
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {demoShowcase.title || 'Official Specimen & Verification Showcase'}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-2">
                  {demoShowcase.subtitle || 'Explore authentic demo certificates, authorized study center licenses, and online verifiable student marksheets.'}
                </p>
              </div>

              {/* 3 Specimen Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Demo Student Certificate / Marksheet Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        Demo Certificate
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Verifiable
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform">
                      <Award size={24} />
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {demoShowcase.demoCertificate.title || 'Diploma in Computer Application (DCA)'}
                    </h4>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Candidate:</span>
                        <span className="font-bold text-slate-800">{demoShowcase.demoCertificate.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Certificate No:</span>
                        <span className="font-mono font-bold text-blue-600">{demoShowcase.demoCertificate.certificateNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Roll No:</span>
                        <span className="font-mono font-semibold text-slate-700">{demoShowcase.demoCertificate.rollNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Assessment:</span>
                        <span className="font-bold text-emerald-600">{demoShowcase.demoCertificate.grade || 'Grade A+ (94%)'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestVerify('student', demoShowcase.demoCertificate.certificateNo || demoShowcase.demoCertificate.rollNo)}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Search size={13} />
                      <span>Live Verify Test</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSpecimen({
                        type: 'certificate',
                        title: demoShowcase.demoCertificate.title,
                        data: demoShowcase.demoCertificate
                      })}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="View full specimen"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>

                {/* 2. Demo Study Center Affiliation Certificate Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                        Demo Center License
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Authorized
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100 group-hover:scale-105 transition-transform">
                      <Building2 size={24} />
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {demoShowcase.demoCenter.centerName || 'Delhi Main Computer Skill Center'}
                    </h4>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Affiliation Code:</span>
                        <span className="font-mono font-bold text-amber-600">{demoShowcase.demoCenter.centerCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Center Director:</span>
                        <span className="font-bold text-slate-800">{demoShowcase.demoCenter.directorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Location:</span>
                        <span className="font-semibold text-slate-700">{demoShowcase.demoCenter.city}, {demoShowcase.demoCenter.state}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Accreditation:</span>
                        <span className="font-bold text-emerald-600">ISO 9001:2015 Approved</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestVerify('center', demoShowcase.demoCenter.centerCode)}
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Search size={13} />
                      <span>Verify Center</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSpecimen({
                        type: 'center',
                        title: demoShowcase.demoCenter.centerName,
                        data: demoShowcase.demoCenter
                      })}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="View full specimen"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>

                {/* 3. Demo Student ID Card Specimen Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        Demo Student ID
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Active
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 group-hover:scale-105 transition-transform">
                      <GraduationCap size={24} />
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {demoShowcase.demoStudent.studentName || 'Ajay Gupta'}
                    </h4>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Enrollment No:</span>
                        <span className="font-mono font-bold text-emerald-700">{demoShowcase.demoStudent.enrollmentNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Roll No:</span>
                        <span className="font-mono font-semibold text-slate-700">{demoShowcase.demoStudent.rollNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Enrolled Course:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{demoShowcase.demoStudent.courseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Affiliated Center:</span>
                        <span className="font-mono font-bold text-slate-700">{demoShowcase.demoStudent.centerCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestVerify('student', demoShowcase.demoStudent.enrollmentNo || demoShowcase.demoStudent.rollNo)}
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Search size={13} />
                      <span>Verify Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSpecimen({
                        type: 'student',
                        title: `${demoShowcase.demoStudent.studentName} - Student ID`,
                        data: demoShowcase.demoStudent
                      })}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="View full specimen"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </section>
        )}

        {/* Bottom Feature Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">Recognized Certifications</h4>
              <p className="text-xs text-slate-500 font-medium">Valid for private & govt employment sectors.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">Study Center Network</h4>
              <p className="text-xs text-slate-500 font-medium">Affiliated centers across urban & rural areas.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">Instant Verification</h4>
              <p className="text-xs text-slate-500 font-medium">QR & Barcode verifiable student marksheets.</p>
            </div>
          </div>
        </motion.div>

      </div>



      {/* ========================================================================= */}
      {/* MODAL 2: SPECIMEN PREVIEW MODAL */}
      {/* ========================================================================= */}
      {activeSpecimen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-amber-400" />
                <h3 className="font-black text-base text-white">{activeSpecimen.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSpecimen(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* If custom image uploaded */}
              {activeSpecimen.data.sampleImageUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-[400px]">
                  <img
                    src={activeSpecimen.data.sampleImageUrl}
                    alt={activeSpecimen.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : (
                /* Dynamic Generated Specimen Badge Layout */
                <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 space-y-4">
                  <div className="text-center pb-4 border-b border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block mb-2">
                      Official Verifiable Specimen
                    </span>
                    <h4 className="text-lg font-black">{activeSpecimen.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">Examirror Skill Development Directorate</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(activeSpecimen.data).map(([k, v]) => {
                      if (k === 'sampleImageUrl' || !v) return null;
                      return (
                        <div key={k} className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{k}</span>
                          <span className="font-bold text-slate-800 break-all">{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck size={16} /> ISO 9001:2015 Verified
                    </span>
                    <span className="font-mono text-slate-500 font-bold">STAMP: AUTH-OK</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-3d-white py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span></span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSpecimen(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIVE VERIFICATION TEST MODAL */}
      {/* ========================================================================= */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-blue-400" />
                <h3 className="font-black text-sm text-white">
                  Real-Time Database Verification Result
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {verifyModal.loading ? (
                <div className="py-10 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Connecting to Central Academic Registry...</p>
                </div>
              ) : verifyModal.result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-emerald-950">Record Verified & Authenticated</h4>
                      <p className="text-xs text-emerald-700">Official status: ACTIVE & RECOGNIZED</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                    {verifyModal.type === 'center' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Center Name:</span>
                          <span className="font-bold text-slate-900">{verifyModal.result.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Center Code:</span>
                          <span className="font-mono font-bold text-blue-600">{verifyModal.result.center_code || verifyModal.query}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Director:</span>
                          <span className="font-semibold text-slate-800">{verifyModal.result.head_name || 'Center Director'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-semibold text-slate-800">{verifyModal.result.city || verifyModal.result.state}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Candidate:</span>
                          <span className="font-bold text-slate-900">{verifyModal.result.firstName} {verifyModal.result.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Enrollment / Roll:</span>
                          <span className="font-mono font-bold text-blue-600">{verifyModal.result.enrollment_no || verifyModal.result.roll_no}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Course:</span>
                          <span className="font-semibold text-slate-800">{verifyModal.result.course_name || 'Certified IT Diploma'}</span>
                        </div>
                        {verifyModal.result.certificate_number && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Certificate No:</span>
                            <span className="font-mono font-bold text-emerald-700">{verifyModal.result.certificate_number}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p className="font-bold">Notice:</p>
                  <p>{verifyModal.error || 'No matching active database record found for this test code.'}</p>
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setVerifyModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Contact;
