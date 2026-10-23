import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Lock, Mail, AlertCircle, Eye, EyeOff, GraduationCap, Sparkles, UserPlus } from 'lucide-react';
import axios from 'axios';
import SEO from '../../components/SEO';
import { DirectStudentRegisterModal } from '../../components/DirectStudentRegisterModal';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const trimmed = identifier.trim();
      const res = await axios.post('http://localhost:3000/api/student/login', {
        email: trimmed,
        password: password
      });

      if (res.data && res.data.success && res.data.token) {
        // Save session credentials
        localStorage.setItem('studentToken', res.data.token);
        localStorage.setItem('studentUser', JSON.stringify(res.data.student));

        // Trigger custom event so any active layouts update immediately
        window.dispatchEvent(new Event('student-auth-changed'));

        // Redirect to student dashboard
        navigate('/student');
      } else {
        setErrorMessage(res.data?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Invalid credentials. Please verify your Email and Password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-indigo-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans ">
      <SEO
        title="Student Login | Examirror Portal"
        description="Log in to your Examirror student account to access enrolled courses, study materials, and live online tests."
        keywords={['Student Login', 'Examirror Student Portal', 'Student Exam Portal']}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Student Login', item: '/login/student' }
        ]}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-3d max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl relative overflow-hidden shadow-xl"
      >
        <div>
          <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <GraduationCap className="text-white h-8 w-8" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-black text-gray-900 tracking-tight">
            Student Portal Login
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500 font-medium">
            Welcome back! Sign in to access your courses and exams.
          </p>
        </div>

        {/* Tab Switcher between Login and Candidate Registration */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            className="flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-white text-indigo-700 shadow-xs"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-slate-600 hover:text-indigo-600 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserPlus size={13} />
            <span>Register Now</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in duration-200">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Registered Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3.5 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. student@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-10 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-3d-primary w-full py-3.5 px-4 text-sm flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Online Test Candidate Registration Prompt */}
        <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-900">
            <Sparkles size={14} className="text-amber-500" />
            <span>Interested in Online Test Series?</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Not studying in an offline center? Create an account to start practicing mock tests, live assessments & all-India rankings directly.
          </p>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
          >
            <UserPlus size={14} />
            <span>Register Now (New Student)</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center">
          <p className="text-sm text-gray-500 text-center">
            Are you a Center Operator?{' '}
            <a href="/login/center" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Center Portal Login
            </a>
          </p>
        </div>
      </motion.div>

      {/* Direct Candidate Registration Modal */}
      <DirectStudentRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  );
};

export default StudentLogin;
