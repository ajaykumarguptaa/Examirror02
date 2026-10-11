import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  Wallet,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateCenter = () => {
  const [formData, setFormData] = useState({
    centerCode: '',
    name: '',
    email: '',
    password: '',
    initialWallet: '0'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; data?: any } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateCenterCode = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({ ...prev, centerCode: `CENT${randomNum}` }));
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    let generated = 'Center@';
    for (let i = 0; i < 4; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: generated }));
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerCode: formData.centerCode.trim(),
          username: formData.centerCode.trim(),
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          initialWallet: Number(formData.initialWallet) || 0
        })
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Study Center "${formData.name}" registered successfully! Both Username (${formData.centerCode}) and Email (${formData.email}) can be used to log in.`,
          data: {
            centerCode: formData.centerCode,
            email: formData.email,
            password: formData.password
          }
        });
        setFormData({ centerCode: '', name: '', email: '', password: '', initialWallet: '0' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create center.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while communicating with the server.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="bg-[#1e1b4b] p-3 rounded-xl text-amber-400">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create & Authorize Study Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">Register franchise credentials with dual Username and Email login capabilities.</p>
          </div>
        </div>

        <Link
          to="/admin"
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-5 rounded-2xl border shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-start gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1 text-xs">
              <div className="font-bold text-sm">{message.text}</div>
              {message.data && (
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Generated Credentials:</div>
                  <div className="flex items-center justify-between">
                    <span><strong>Center Code / Username:</strong> <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">{message.data.centerCode}</code></span>
                    <button 
                      onClick={() => handleCopy(message.data.centerCode, 'code')}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    >
                      {copiedField === 'code' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedField === 'code' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>Registered Email:</strong> <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{message.data.email}</code></span>
                    <button 
                      onClick={() => handleCopy(message.data.email, 'email')}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    >
                      {copiedField === 'email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>Password:</strong> <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-bold">{message.data.password}</code></span>
                    <button 
                      onClick={() => handleCopy(message.data.password, 'pass')}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    >
                      {copiedField === 'pass' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedField === 'pass' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Dual Login Notice */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
            <strong className="block text-indigo-950 font-bold mb-0.5">Dual-Identifier Access Enabled:</strong>
            Study center staff can log in using <strong>either</strong> their unique <strong>Center Code / Username</strong> or their <strong>Email Address</strong> alongside the password configured below.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Center Code / Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Center Code / Username *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCenterCode}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Auto Code</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  name="centerCode"
                  required
                  value={formData.centerCode}
                  onChange={handleChange}
                  placeholder="e.g. CENT002 or EXAM-102"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold text-indigo-700 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Center Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Center Name / Institutional Title *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 size={15} />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Examirror Academy - Delhi"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address (Alternate Login ID) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. center@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Auto Password</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Secure password (min 4 chars)"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

          </div>

          {/* Initial Wallet Balance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Token Balance (₹ Optional Welcome Tokens)
            </label>
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Wallet size={15} />
              </div>
              <input
                type="number"
                name="initialWallet"
                value={formData.initialWallet}
                onChange={handleChange}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-indigo-700 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/admin"
            className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-amber-400 px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save size={16} />
            )}
            <span>{isSaving ? 'Registering Center...' : 'Authorize & Register Center'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateCenter;
