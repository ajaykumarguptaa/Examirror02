import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  Check
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DirectStudentRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetTestSeriesId?: number | string | null;
}

export const DirectStudentRegisterModal: React.FC<DirectStudentRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetTestSeriesId
}) => {
  const navigate = useNavigate();

  // Steps: 1 = Details, 2 = Email OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form input fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP field
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Interaction tracking (touched states for clean inline validation)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Loading & global error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setOtp('');
      setErrorMsg(null);
      setLoading(false);
      setTouched({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // --- Live Validation Rules ---
  const firstNameClean = firstName.trim();
  const isFirstNameValid = useMemo(() => {
    return /^[a-zA-Z\s'-]{2,40}$/.test(firstNameClean);
  }, [firstNameClean]);

  const lastNameClean = lastName.trim();
  const isLastNameValid = useMemo(() => {
    if (!lastNameClean) return true; // Optional
    return /^[a-zA-Z\s'-]{1,40}$/.test(lastNameClean);
  }, [lastNameClean]);

  const emailClean = email.trim().toLowerCase();
  const isEmailValid = useMemo(() => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailClean);
  }, [emailClean]);

  const phoneClean = phone.replace(/\D/g, '');
  const isPhoneValid = useMemo(() => {
    return /^[6-9]\d{9}$/.test(phoneClean);
  }, [phoneClean]);

  const isPasswordLengthValid = password.length >= 6;
  const hasPasswordNumberOrSpecial = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (hasPasswordNumberOrSpecial) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    return score;
  }, [password, hasPasswordNumberOrSpecial]);

  const isPasswordValid = isPasswordLengthValid;

  const isConfirmPasswordValid = useMemo(() => {
    if (!confirmPassword) return false;
    return confirmPassword === password;
  }, [confirmPassword, password]);

  const isFormValid =
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isPasswordValid &&
    isConfirmPasswordValid;

  // --- Step 1: Send OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Mark all touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    if (!isFirstNameValid) {
      setErrorMsg('Please enter a valid first name (letters only, min 2 characters).');
      return;
    }
    if (!isEmailValid) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!isPhoneValid) {
      setErrorMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/student/send-registration-otp', {
        email: emailClean,
        firstName: firstNameClean,
        lastName: lastNameClean,
        phone: phoneClean
      });

      if (res.data?.success) {
        if (res.data?.devOtp) {
          toast.success(`Verification code sent! (Dev Code: ${res.data.devOtp})`, { duration: 12000 });
        } else {
          toast.success(res.data.message || 'Verification code sent to your email!');
        }
        setStep(2);
        setResendCountdown(60);
      } else {
        setErrorMsg(res.data?.message || 'Failed to send verification code.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error sending verification code. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Resend OTP Handler
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    const toastId = toast.loading('Sending fresh verification code...');

    try {
      const res = await axios.post('http://localhost:3000/api/student/send-registration-otp', {
        email: emailClean,
        firstName: firstNameClean,
        lastName: lastNameClean,
        phone: phoneClean
      });

      if (res.data?.success) {
        setResendCountdown(60);
        if (res.data?.devOtp) {
          toast.success(`Fresh verification code sent! (Dev Code: ${res.data.devOtp})`, { id: toastId, duration: 12000 });
        } else {
          toast.success(res.data.message || 'Verification code resent to your email!', { id: toastId });
        }
      } else {
        const msg = res.data?.message || 'Failed to resend code.';
        setErrorMsg(msg);
        toast.error(msg, { id: toastId });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend verification code. Please wait a moment.';
      setErrorMsg(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verify OTP & Create Account ---
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit code received on your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/student/verify-and-register', {
        firstName: firstNameClean,
        lastName: lastNameClean,
        email: emailClean,
        phone: phoneClean,
        password: password,
        otp: cleanOtp
      });

      if (res.data?.success && res.data.token) {
        // Save session credentials
        localStorage.setItem('studentToken', res.data.token);
        localStorage.setItem('studentUser', JSON.stringify(res.data.student));

        // Notify app layouts
        window.dispatchEvent(new Event('student-auth-changed'));

        toast.success('Account created successfully! Welcome to Examirror.');
        onClose();
        if (onSuccess) onSuccess();

        if (targetTestSeriesId) {
          navigate('/student/test-series');
        } else {
          navigate('/student/test-series');
        }
      } else {
        setErrorMsg(res.data?.message || 'Verification failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to verify code. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden relative my-6 text-slate-800"
        >
          {/* Top Decorative Header Matching Examirror System UI */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 relative">
            <div className="flex items-center justify-between mb-3">
              {/* Portal Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold tracking-wide">
                <Sparkles size={12} className="text-amber-500 shrink-0" />
                <span>ONLINE TEST CANDIDATE PORTAL</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {step === 1 ? 'Create Candidate Account' : 'Verify Your Email'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {step === 1
                ? 'Register independently to access mock tests, test series, and live assessments.'
                : `We sent a 6-digit verification code to ${emailClean}`}
            </p>

            {/* Step Progress Bar */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1.5 rounded-full bg-blue-600 transition-all duration-300" />
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step === 2 ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 shrink-0">
                Step {step} of 2
              </span>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6">
            {/* Global Error Banner */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 font-medium shadow-2xs"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                {/* Row: First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        value={firstName}
                        onBlur={() => markTouched('firstName')}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Ajay"
                        className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-medium border transition-all bg-slate-50 focus:bg-white outline-none ${
                          touched.firstName && !isFirstNameValid
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                            : touched.firstName && isFirstNameValid
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                      {touched.firstName && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {isFirstNameValid ? (
                            <CheckCircle2 size={15} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={15} className="text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {touched.firstName && !isFirstNameValid && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">
                        Min 2 letters required (no special symbols).
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        value={lastName}
                        onBlur={() => markTouched('lastName')}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Gupta"
                        className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-medium border transition-all bg-slate-50 focus:bg-white outline-none ${
                          touched.lastName && !isLastNameValid
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                      {touched.lastName && isLastNameValid && lastNameClean && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                    {touched.lastName && !isLastNameValid && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">
                        Letters only.
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field with Strict Validation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onBlur={() => markTouched('email')}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@gmail.com"
                      className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-medium border transition-all bg-slate-50 focus:bg-white outline-none ${
                        touched.email && !isEmailValid
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                          : touched.email && isEmailValid
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                    {touched.email && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {isEmailValid ? (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={15} className="text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.email && !isEmailValid ? (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> Please enter a valid email address (e.g. user@domain.com).
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400 font-normal">
                      We'll send a 6-digit secure verification code to this address.
                    </p>
                  )}
                </div>

                {/* Mobile Number Field (Required Indian 10-digit number) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">10 digits required</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 font-bold text-xs">
                      <Phone size={14} className="mr-1" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      maxLength={10}
                      onBlur={() => markTouched('phone')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                      }}
                      placeholder="9876543210"
                      className={`w-full pl-16 pr-9 py-2.5 rounded-xl text-sm font-medium border transition-all bg-slate-50 focus:bg-white outline-none ${
                        touched.phone && !isPhoneValid
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                          : touched.phone && isPhoneValid
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                    {touched.phone && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {isPhoneValid ? (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={15} className="text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.phone && !isPhoneValid && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.
                    </p>
                  )}
                </div>

                {/* Password & Confirm Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Create Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onBlur={() => markTouched('password')}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-medium border transition-all bg-slate-50 focus:bg-white outline-none ${
                          touched.password && !isPasswordValid
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                            : touched.password && isPasswordValid
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1 h-1">
                          <div
                            className={`flex-1 rounded-full ${
                              passwordStrength >= 1 ? 'bg-rose-500' : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`flex-1 rounded-full ${
                              passwordStrength >= 2 ? 'bg-amber-500' : 'bg-slate-200'
                            }`}
                          />
                          <div
                            className={`flex-1 rounded-full ${
                              passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className={
                              passwordStrength <= 1
                                ? 'text-rose-600 font-bold'
                                : passwordStrength === 2
                                ? 'text-amber-600 font-bold'
                                : 'text-emerald-600 font-bold'
                            }
                          >
                            {passwordStrength <= 1
                              ? 'Weak'
                              : passwordStrength === 2
                              ? 'Moderate'
                              : 'Strong'}
                          </span>
                          <span className="text-slate-400">
                            {password.length < 6 ? 'Min 6 characters' : 'Length OK'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onBlur={() => markTouched('confirmPassword')}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-medium border transition-all bg-slate-50 focus:bg-white outline-none ${
                          touched.confirmPassword && !isConfirmPasswordValid
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                            : touched.confirmPassword && isConfirmPasswordValid
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {touched.confirmPassword && confirmPassword && (
                      <p
                        className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
                          isConfirmPasswordValid ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isConfirmPasswordValid ? (
                          <>
                            <Check size={12} /> Passwords match
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} /> Passwords do not match
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || (touched.email && !isFormValid)}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RotateCw size={16} className="animate-spin text-white" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>

                {/* Footer Switcher */}
                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">
                    Already registered?{' '}
                    <a
                      href="/login/student"
                      className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      Sign In to Student Portal
                    </a>
                  </p>
                </div>
              </form>
            ) : (
              /* Step 2: Modern OTP Verification UI */
              <form onSubmit={handleVerifyAndRegister} className="space-y-5" noValidate>
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-xs">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Enter Verification Code
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    We sent a 6-digit code to{' '}
                    <span className="font-bold text-slate-800">{emailClean}</span>. Please check
                    your inbox or spam folder.
                  </p>
                </div>

                {/* OTP Input with Large Monospace Style */}
                <div className="max-w-xs mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3.5 bg-slate-50 border-2 border-blue-400 focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all text-slate-900 font-black shadow-inner"
                      autoFocus
                    />
                  </div>
                  <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                    Enter 6 numbers from the email
                  </p>
                </div>

                {/* Helpful Spam/Junk Folder Notice */}
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 text-[11px] text-amber-900 leading-relaxed text-center font-medium">
                  📩 Can't find the email in your Inbox? Please check your Gmail <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab.
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RotateCw size={16} className="animate-spin text-white" />
                      <span>Verifying & Setting Up Portal...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      <span>Verify Code & Open Test Portal</span>
                    </>
                  )}
                </button>

                {/* Actions & Resend Controls */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Change Details</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendCountdown > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-blue-600 font-bold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                  >
                    {resendCountdown > 0 ? (
                      `Resend Code in ${resendCountdown}s`
                    ) : (
                      'Resend Code'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
