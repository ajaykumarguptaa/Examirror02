import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import SEO from '../../components/SEO';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post('/api/admin/login', {
        username,
        password
      }).catch(() => {
        return axios.post('http://localhost:3000/api/admin/login', {
          username,
          password
        });
      });

      if (res.data?.success && res.data?.token) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('admin_token', res.data.token);
        sessionStorage.setItem('adminToken', res.data.token);
        navigate('/admin');
      } else {
        setErrorMessage(res.data?.message || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO
        title="Admin Portal Login | Examirror"
        description="Super Admin portal login for Examirror institutional governance and system management."
        noindex={true}
      />
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200">
        
        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#1e1b4b] rounded-2xl flex items-center justify-center border-2 border-yellow-400 shadow-md">
            <ShieldCheck className="h-9 w-9 text-yellow-400" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900 tracking-tight">
            Super Admin Portal Login
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Central Institutional Governance & Token Gateway
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-semibold"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-xl relative block w-full pl-10 pr-10 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-semibold"
                placeholder="Enter master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>



          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent text-xs font-bold rounded-xl text-slate-950 bg-yellow-400 hover:bg-yellow-300 focus:outline-none shadow-md transition-all disabled:opacity-60 cursor-pointer items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Authenticate & Enter Admin</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2 border-t text-xs text-slate-500">
            Authorized Center Operator?{' '}
            <Link to="/login/center" className="font-bold text-indigo-700 hover:underline">
              Center Portal Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
