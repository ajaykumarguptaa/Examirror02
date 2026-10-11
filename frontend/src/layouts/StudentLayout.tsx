import { Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User, Trophy, LayoutDashboard } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full">
      <SEO title="Student Dashboard | Examirror" noindex={true} />
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 lg:px-10 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-xs w-full">
        <div className="flex items-center gap-8">
          <Link to="/student" className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              S
            </span>
            <span className="tracking-tight">Student Portal</span>
          </Link>

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
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy size={15} className="text-amber-500" /> Test Series
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">New</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell userType="student" userId={user.id || null} />

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-400">Logged in as:</span>
            <span className="font-bold text-slate-800">{user.firstName || 'Student'} {user.lastName || ''}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-8 lg:px-10 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
