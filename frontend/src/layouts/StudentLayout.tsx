import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Trophy, LayoutDashboard, BookOpen } from 'lucide-react';
import axios from 'axios';
import SEO from '../components/SEO';
import NotificationBell from '../components/common/NotificationBell';

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
    }

    const handleStorageUpdate = () => {
      try {
        setMySeriesCount(Number(localStorage.getItem('studentMySeriesCount') || 0));
      } catch { }
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('studentSeriesUpdated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('studentSeriesUpdated', handleStorageUpdate);
    };
  }, [token, user?.id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full overflow-x-hidden">
      <SEO title="Student Dashboard | Examirror" noindex={true} />
      
      {/* Top Header with Apple Frosted Glass */}
      <header className="apple-glass border-b border-white/60 px-3.5 sm:px-8 lg:px-10 py-3 flex justify-between items-center sticky top-0 z-40 shadow-2xs w-full transition-all duration-300">
        <div className="flex items-center gap-4 sm:gap-8">
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
          <nav className="hidden sm:flex items-center gap-2">
            <Link
              to="/student"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isDashboardActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard size={15} /> Dashboard
            </Link>

            <Link
              to="/student/test-series"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTestSeriesActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy size={15} className="text-amber-500" /> Test Series
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">New</span>
            </Link>

            <Link
              to="/student/notes"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isNotesActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={15} className="text-indigo-600" /> E-Notes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Permanent Test Series Sub-Navigation Pills (Desktop / Laptop) */}
          <div className="hidden sm:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
            <Link
              to="/student/test-series?tab=discover"
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeSubTab === 'discover'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Explore Series
            </Link>
            <Link
              to="/student/test-series?tab=my_series"
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'my_series'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>My Series</span>
              {mySeriesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 font-bold rounded-full text-[10px]">
                  {mySeriesCount}
                </span>
              )}
            </Link>
            <Link
              to="/student/test-series?tab=achievements"
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeSubTab === 'achievements'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Achievements
            </Link>
          </div>

          <NotificationBell userType="student" userId={user.id || null} />

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-400">Logged in as:</span>
            <span className="font-bold text-slate-800">{user.firstName || 'Student'} {user.lastName || ''}</span>
          </div>

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

      {/* Main Content Area */}
      <main className="flex-1 w-full px-3.5 sm:px-8 lg:px-10 py-5 sm:py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Dock (Screens < 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around">
        <Link
          to="/student"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            isDashboardActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isDashboardActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
          }`}>
            <LayoutDashboard size={18} />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Dashboard</span>
        </Link>

        <Link
          to="/student/test-series"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isTestSeriesActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isTestSeriesActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
          }`}>
            <Trophy size={18} className={isTestSeriesActive ? 'text-amber-500' : ''} />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Test Series</span>
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
        </Link>

        <Link
          to="/student/notes"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isNotesActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isNotesActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
          }`}>
            <BookOpen size={18} className={isNotesActive ? 'text-indigo-600' : ''} />
          </div>
          <span className="text-[10px] font-bold mt-0.5">E-Notes</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-red-600 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default StudentLayout;
