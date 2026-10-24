import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LogOut, Trophy, LayoutDashboard, BookOpen, Wallet, Crown, Gift, 
  AlertTriangle, Plus, X, ArrowRight, ShieldCheck 
} from 'lucide-react';
import axios from 'axios';
import SEO from '../components/SEO';
import NotificationBell from '../components/common/NotificationBell';
import { StudentRechargeModal } from '../components/student/StudentRechargeModal';

const StudentLayout = () => {
  const token = localStorage.getItem('studentToken');
  const user = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const navigate = useNavigate();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login/student" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
    navigate('/login/student');
  };

  const isTestSeriesActive = location.pathname.includes('/student/test-series');
  const isDashboardActive = location.pathname === '/student' || location.pathname === '/student/dashboard';
  const isNotesActive = location.pathname.includes('/student/notes') || location.pathname.startsWith('/notes');
  const isWalletActive = location.pathname.includes('/student/wallet');
  const isPassesActive = location.pathname.includes('/student/passes');
  const isReferActive = location.pathname.includes('/student/refer');

  const searchParams = new URLSearchParams(location.search);
  const activeTabParam = searchParams.get('tab');
  const activeSubTab = isTestSeriesActive
    ? (activeTabParam === 'my_series' ? 'my_series' : activeTabParam === 'achievements' ? 'achievements' : 'discover')
    : null;

  const [mySeriesCount, setMySeriesCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('studentMySeriesCount') || 0);
    } catch {
      return 0;
    }
  });

  const [walletOverview, setWalletOverview] = useState<any | null>(null);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [dismissLowBalance, setDismissLowBalance] = useState(false);

  // Fetch Wallet Overview
  const fetchWallet = async () => {
    try {
      const studentId = user?.id || null;
      const res = await axios.get('/api/student/wallet/overview', {
        headers: { Authorization: `Bearer ${token}` },
        params: { studentId }
      }).catch(() => axios.get('http://localhost:3000/api/student/wallet/overview', {
        headers: { Authorization: `Bearer ${token}` },
        params: { studentId }
      }));

      if (res.data?.success) {
        setWalletOverview(res.data.data);
      }
    } catch {
      // safe ignore
    }
  };

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const studentId = user?.id || null;
        const res = await axios.get('/api/student/test-series/my-series', {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId }
        }).catch(() => axios.get('http://localhost:3000/api/student/test-series/my-series', {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId }
        }));
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setMySeriesCount(res.data.data.length);
          localStorage.setItem('studentMySeriesCount', String(res.data.data.length));
        }
      } catch {
        // preserve cached count
      }
    };

    if (token) {
      fetchCount();
      fetchWallet();
    }

    const handleStorageUpdate = () => {
      try {
        setMySeriesCount(Number(localStorage.getItem('studentMySeriesCount') || 0));
      } catch { }
    };

    const handleWalletUpdate = () => {
      fetchWallet();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('studentSeriesUpdated', handleStorageUpdate);
    window.addEventListener('studentWalletUpdated', handleWalletUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('studentSeriesUpdated', handleStorageUpdate);
      window.removeEventListener('studentWalletUpdated', handleWalletUpdate);
    };
  }, [token, user?.id]);

  const walletBalance = Number(walletOverview?.walletBalance || 0);
  const isElite = walletOverview?.activePass?.isElite;
  const showLowBalanceBanner = !dismissLowBalance && walletOverview?.isLowBalance;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full overflow-x-hidden">
      <SEO title="Student Dashboard | Examirror" noindex={true} />
      
      {/* Top Header with Apple Frosted Glass */}
      <header className="apple-glass border-b border-white/60 px-3.5 sm:px-8 lg:px-10 py-3 flex justify-between items-center sticky top-0 z-40 shadow-2xs w-full transition-all duration-300">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/student" className="flex items-center gap-2 text-indigo-700 font-bold text-base sm:text-lg">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-2xs shrink-0">
              S
            </span>
            <div className="flex flex-col">
              <span className="tracking-tight leading-tight">Student Portal</span>
              <span className="text-[10px] text-slate-500 font-normal sm:hidden">
                {user.firstName || 'Student'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <Link
              to="/student"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isDashboardActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard size={15} /> Dashboard
            </Link>

            <Link
              to="/student/test-series"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTestSeriesActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy size={15} className="text-amber-500" /> Test Series
            </Link>

            <Link
              to="/student/passes"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isPassesActive
                  ? 'bg-amber-100 text-amber-950 shadow-2xs'
                  : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Crown size={15} className="text-amber-500" /> Elite Pass
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] rounded-full font-black">VIP</span>
            </Link>

            <Link
              to="/student/wallet"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isWalletActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wallet size={15} className="text-indigo-600" /> Wallet
            </Link>

            <Link
              to="/student/refer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isReferActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Gift size={15} className="text-emerald-600" /> Refer & Earn
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-black">₹50</span>
            </Link>

            <Link
              to="/student/notes"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isNotesActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={15} className="text-indigo-600" /> E-Notes
            </Link>
          </nav>
        </div>

        {/* Right Section: Pass Badge, Wallet Pill, Notifications, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Elite Pass Badge */}
          {isElite && (
            <Link
              to="/student/passes"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs hover:scale-105 transition-transform"
            >
              <Crown size={13} />
              <span>ELITE PASS</span>
            </Link>
          )}

          {/* Wallet Balance Pill */}
          <div className="flex items-center bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 rounded-2xl p-1 pr-2 transition-all shadow-2xs">
            <Link
              to="/student/wallet"
              className="flex items-center gap-1.5 pl-2 text-xs font-bold text-slate-900 hover:text-indigo-600"
              title="View Student Wallet"
            >
              <Wallet size={14} className="text-indigo-600" />
              <span>₹{walletBalance.toFixed(2)}</span>
            </Link>
            <button
              onClick={() => setIsRechargeOpen(true)}
              className="ml-2 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Add Money"
            >
              <Plus size={12} />
            </button>
          </div>

          <NotificationBell userType="student" userId={user.id || null} />

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Sign out of student account"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Low Wallet Balance Warning Banner */}
      {showLowBalanceBanner && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 px-4 py-2.5 shadow-sm border-b border-amber-600/20 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-3xl">
            <AlertTriangle size={16} className="shrink-0 text-slate-950" />
            <span>
              Low Wallet Balance (₹{walletBalance.toFixed(2)}). Recharge your wallet to enjoy 1-click test series unlocking & Elite Pass benefits!
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRechargeOpen(true)}
              className="px-3 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Recharge Now</span>
              <ArrowRight size={12} />
            </button>
            <button
              onClick={() => setDismissLowBalance(true)}
              className="p-1 hover:bg-black/10 rounded-md transition-colors cursor-pointer"
              title="Dismiss warning"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full px-3.5 sm:px-8 lg:px-10 py-5 sm:py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Dock (Screens < 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around">
        <Link
          to="/student"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isDashboardActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </Link>

        <Link
          to="/student/test-series"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
            isTestSeriesActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Trophy size={18} className={isTestSeriesActive ? 'text-amber-500' : ''} />
          <span className="text-[10px] font-bold mt-0.5">Tests</span>
        </Link>

        <Link
          to="/student/passes"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isPassesActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Crown size={18} className="text-amber-500" />
          <span className="text-[10px] font-bold mt-0.5">Elite Pass</span>
        </Link>

        <Link
          to="/student/wallet"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isWalletActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet size={18} />
          <span className="text-[10px] font-bold mt-0.5">Wallet</span>
        </Link>

        <Link
          to="/student/refer"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isReferActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Gift size={18} className="text-emerald-600" />
          <span className="text-[10px] font-bold mt-0.5">Refer</span>
        </Link>
      </nav>

      {/* Global Student Recharge Modal */}
      <StudentRechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onSuccess={fetchWallet}
      />
    </div>
  );
};

export default StudentLayout;
