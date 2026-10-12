import React, { useState } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SEO from '../../components/SEO';
import { onlyDigits, onlyNameLetters, isValidIndianPhone, isValidEmail } from '../../utils/validators';

const INQUIRY_TYPES = [
  { id: 'admission', label: 'Course Admission', icon: BookOpen },
  { id: 'franchise', label: 'Center Affiliation', icon: Building2 },
  { id: 'certificate', label: 'Certificate Verification', icon: Award },
  { id: 'general', label: 'General Inquiry', icon: HelpIcon },
];

function HelpIcon(props: any) {
  return <MessageSquare {...props} />;
}

const Contact = () => {
  const [selectedInquiry, setSelectedInquiry] = useState('admission');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    course: 'ADCA',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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


  return (
    <div className="flex flex-col w-full bg-[#f8fafc] min-h-screen text-slate-800 font-sans selection:bg-indigo-500 selection:text-white pb-20">
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
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight"
          >
            Let’s Connect & Elevate Your <span className="text-amber-400">Tech Career</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Have inquiries regarding computer diploma admissions, franchise affiliations, or student marksheets? Our counselors are ready to assist you.
          </motion.p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 sm:-mt-8 relative z-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column - Contact Form (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-9 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Headphones className="text-indigo-600" size={24} />
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
                    Your inquiry has been received by Examirror Admissions & Support Desk. One of our senior academic advisors will contact you shortly at <strong>{formData.phone}</strong>.
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
                  {/* Inquiry Type Chips */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      I'm Interested In:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INQUIRY_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedInquiry === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedInquiry(type.id)}
                            className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                          >
                            <Icon size={14} className={isSelected ? 'text-yellow-300' : 'text-slate-500'} />
                            <span className="truncate w-full text-center">{type.label}</span>
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
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
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
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
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
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="e.g. name@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Preferred Course / Program
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <BookOpen size={16} />
                        </div>
                        <select
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-slate-900 text-xs font-bold focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                        >
                          <option value="ADCA">ADCA (Advance Diploma in Computer App)</option>
                          <option value="DCA">DCA (Diploma in Computer Application)</option>
                          <option value="PGDCA">PGDCA (Post Graduate Diploma)</option>
                          <option value="DIT">DIT (Diploma in Information Tech)</option>
                          <option value="TALLY">Tally Prime & GST Accounting</option>
                          <option value="BASIC">Basic Computer & Internet Office</option>
                          <option value="FRANCHISE">Center Affiliation Inquiry</option>
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
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50/50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none transition-all resize-none placeholder:text-slate-400"
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
                      <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
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
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center p-2 shadow-md shadow-amber-500/20 shrink-0">
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
                    {['BASIC', 'DCA', 'ADCA', 'PGDCA', 'TALLY PRIME', 'DIT'].map((course, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Help Strip */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock size={12} className="text-emerald-400" /> Mon - Sat: 9 AM - 7 PM
                  </span>
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Desk Open
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Contact Detail Cards */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 space-y-4">

              {/* Phone Helpline Card */}
              <a
                href="tel:"
                className="group flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Phone size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Helpline & Admission Support
                  </span>
                  <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    +91 91231 06042
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Click to dial directly</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all mt-3" />
              </a>

              {/* Email Card */}
              <a
                href="mailto:saurabhcsjnu@gmail.com"
                className="group flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer"
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
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-3" />
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-1 hover:underline cursor-pointer"
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

        {/* Bottom Feature Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
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
    </div>
  );
};

export default Contact;
