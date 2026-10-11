import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import SEO from '../../components/SEO';

const CenterLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const trimmed = identifier.trim();
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        identifier: trimmed,
        centerCode: trimmed,
        email: trimmed,
        username: trimmed,
        password: password
      });

      if (res.data && res.data.success && res.data.token) {
        // Save session credentials
        localStorage.setItem('token', res.data.token);
        if (res.data.center) {
          localStorage.setItem('centerUser', JSON.stringify(res.data.center));
          localStorage.setItem('centerId', String(res.data.center.id));
        }

        // Trigger custom event so any active layouts update immediately
        window.dispatchEvent(new Event('center-auth-changed'));

        // Redirect to center dashboard
        navigate('/center');
      } else {
        setErrorMessage(res.data?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Invalid credentials. Please verify your Center Code / Email and password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO
        title="Study Center Login | Examirror Portal"
        description="Log in to your Examirror authorized study center portal for student admissions, wallet management, and examination administration."
        keywords={['Center Login', 'Study Center Portal', 'Examirror Center Login']}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Center Login', item: '/login/center' }
        ]}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100"
      >
        <div>
          <div className="mx-auto w-16 h-16 bg-[#1e1b4b] rounded-full flex items-center justify-center border-4 border-amber-400 shadow-md overflow-hidden p-2">
            <img src="/assets/favicon.png" alt="Examirror Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="mt-5 text-center text-2xl font-black text-gray-900 tracking-tight">
            Study Center Portal Login
          </h1>
          <p className="mt-1.5 text-center text-xs text-gray-500 font-medium">
            Authorized Franchise & Institutional Access Portal
          </p>
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Center Code / Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3.5 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#1e1b4b] focus:border-[#1e1b4b] transition-all bg-slate-50/50 focus:bg-white"
                  placeholder="Enter Center Code (e.g. 6767, CENT001) or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#1e1b4b] focus:border-[#1e1b4b] transition-all bg-slate-50/50 focus:bg-white"
                  placeholder="Enter your center password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-gray-600 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-[#1e1b4b] focus:ring-[#1e1b4b] border-gray-300 rounded cursor-pointer mr-2"
              />
              Remember this device
            </label>

            <span className="text-gray-500 font-medium">
              Need help? Contact Admin
            </span>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#1e1b4b] hover:bg-[#2e2b5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e1b4b] shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  Sign In to Center Dashboard
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-600 pt-3 border-t border-gray-100">
            Don't have a registered franchise yet?{' '}
            <a href="/franchise/register" className="font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2">
              Apply for Franchise
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CenterLogin;
