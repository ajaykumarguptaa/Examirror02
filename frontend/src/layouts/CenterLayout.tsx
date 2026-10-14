import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from '../components/common/NotificationBell';
import { RealtimeNotificationProvider } from '../context/RealtimeNotificationContext';
import { NumberCounter } from '../motion';
import {
  Home,
  Wallet,
  PlusCircle,
  List,
  UserPlus,
  Users,
  FileText,
  MonitorPlay,
  LogOut,
  Search,
  Bell,
  User,
  ChevronDown,
  PenTool, X
} from 'lucide-react';
import SEO from '../components/SEO';
import { CenterSignatureUploadModal } from '../components/CenterSignatureUploadModal';

const CenterLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getStoredAuth = () => {
    try {
      const token = localStorage.getItem('token');
      const id = localStorage.getItem('centerId');
      const userRaw = localStorage.getItem('centerUser');
      const user = userRaw ? JSON.parse(userRaw) : null;
      return {
        token,
        centerId: id ? Number(id) : 1,
        centerName: user?.name || 'Authorized Study Center',
        centerCode: user?.centerCode || 'CENT001'
      };
    } catch {
      return { token: null, centerId: 1, centerName: 'Authorized Study Center', centerCode: 'CENT001' };
    }
  };

  const [authInfo, setAuthInfo] = useState(getStoredAuth);

  const [stats, setStats] = useState({
    walletBalance: 0,
    coursesCount: 0,
    studentsCount: 0,
    freeTestsCount: 0,
    examsCount: 0
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const handleAuthUpdate = () => {
      setAuthInfo(getStoredAuth());
    };
    window.addEventListener('center-auth-changed', handleAuthUpdate);
    window.addEventListener('storage', handleAuthUpdate);
    return () => {
      window.removeEventListener('center-auth-changed', handleAuthUpdate);
      window.removeEventListener('storage', handleAuthUpdate);
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const activeId = localStorage.getItem('centerId') || authInfo.centerId;
      const res = await axios.get(`http://localhost:3000/api/center/${activeId}/stats`);
      if (res.data.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch center stats:', err);
    }
  }, [authInfo.centerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, location.pathname]);

  // Listen to custom update events triggered across pages & realtime push events
  useEffect(() => {
    const handleStatsUpdate = () => fetchStats();
    window.addEventListener('center-stats-updated', handleStatsUpdate);
    window.addEventListener('wallet-updated', handleStatsUpdate);
    window.addEventListener('certificate-updated', handleStatsUpdate);
    window.addEventListener('realtime-notification', handleStatsUpdate);
    window.addEventListener('focus', handleStatsUpdate);

    return () => {
      window.removeEventListener('center-stats-updated', handleStatsUpdate);
      window.removeEventListener('wallet-updated', handleStatsUpdate);
      window.removeEventListener('certificate-updated', handleStatsUpdate);
      window.removeEventListener('realtime-notification', handleStatsUpdate);
      window.removeEventListener('focus', handleStatsUpdate);
    };
  }, [fetchStats]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('centerUser');
      localStorage.removeItem('centerId');
      sessionStorage.clear();
      window.dispatchEvent(new Event('center-auth-changed'));
    } catch (_) {}
    navigate('/login/center');
  };


  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/center', exact: true },
    { 
      name: 'Recharge Wallet', 
      icon: Wallet, 
      path: '/center/wallet', 
      badge: <NumberCounter value={Number(stats.walletBalance || 0)} prefix="Rs." durationMs={800} />
    },
    { name: 'Add Course', icon: PlusCircle, path: '/center/add-course' },
    { 
      name: 'Courses List', 
      icon: List, 
      path: '/center/courses', 
      badge: String(stats.coursesCount ?? 0) 
    },
    { name: 'Add Student', icon: UserPlus, path: '/center/add-student' },
    { 
      name: 'Students List', 
      icon: Users, 
      path: '/center/students', 
      badge: String(stats.studentsCount ?? 0) 
    },
    { 
      name: 'Setted Exams List', 
      icon: FileText, 
      path: '/center/exams',
      badge: stats.examsCount > 0 ? String(stats.examsCount) : undefined
    },
    { 
      name: 'Online Test Management', 
      icon: FileText, 
      path: '/center/free-tests', 
      badge: stats.freeTestsCount > 0 ? String(stats.freeTestsCount) : undefined
    },
    { 
      name: 'E-Notes & Study Materials', 
      icon: FileText, 
      path: '/center/study-materials'
    },
    { name: 'Training Videos', icon: MonitorPlay, path: '/center/videos' },
  ];

  return (
    <RealtimeNotificationProvider userType="center" userId={authInfo.centerId}>
      <div className="flex h-screen bg-[#f1f5f9] font-sans">
        <SEO title="Center Dashboard | Examirror" noindex={true} />

      {/* Sidebar */}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0 shadow-sm fixed md:static z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Mobile Close Button */}
        <div className="absolute top-4 right-4 md:hidden">
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100 p-4">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-[#1e1b4b] flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              <img src="/assets/favicon.png" alt="Examirror" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#1e1b4b] leading-tight">EXAMIRROR</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Center Portal</span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive
                    ? 'bg-[#e0e7ff] text-[#4f46e5]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={18} className={isActive ? 'text-[#4f46e5]' : 'text-gray-400'} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut size={18} className="text-gray-400 group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3.5 sm:px-6 shrink-0 shadow-sm z-20 gap-2">

          
          <div className="flex md:hidden items-center mr-1">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer" aria-label="Open Sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {/* Search Bar */}
          <div className="flex-1 flex items-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search Pages..."
                className="w-full pl-9 pr-4 py-2 border-none bg-transparent focus:ring-0 text-sm outline-none text-gray-700"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Director E-Signature & Stamp Button */}
            <button
              type="button"
              onClick={() => setIsSigModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Upload Center Director E-Signature & Rubber Stamp"
            >
              <PenTool size={14} className="text-indigo-600" />
              <span>E-Sign & Stamp</span>
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 py-1 px-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium border border-slate-200"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1e1b4b] text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs">
                  <User size={15} />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-none">{authInfo.centerCode}</span>
                  <span className="text-[10px] text-gray-400 leading-none mt-0.5 truncate max-w-[120px]">{authInfo.centerName}</span>
                </div>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {/* Dropdown Menu (Cleaned: No Super Admin Panel link) */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logged-in Center</p>
                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{authInfo.centerName}</p>
                    <p className="text-xs font-mono text-indigo-700 font-bold">Code: {authInfo.centerCode}</p>
                  </div>
                  
                  <Link
                    to="/center"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                  >
                    <Home size={15} /> Center Dashboard
                  </Link>
                  <Link
                    to="/center/wallet"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                  >
                    <Wallet size={15} /> Recharge Wallet (₹{Number(stats.walletBalance || 0).toLocaleString('en-IN')})
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsSigModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                  >
                    <PenTool size={15} /> E-Signature & Rubber Stamp
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={15} /> Sign Out / Logout
                  </button>
                </div>
              )}
            </div>

            <NotificationBell userType="center" userId={authInfo.centerId} />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-[#f8fafc]">
          <Outlet />
        </main>

      </div>

      {/* Center Director Signature & Stamp Upload Modal */}
      <CenterSignatureUploadModal
        isOpen={isSigModalOpen}
        centerId={authInfo.centerId}
        centerName={authInfo.centerName}
        onClose={() => setIsSigModalOpen(false)}
      />
      </div>
    </RealtimeNotificationProvider>
  );
};

export default CenterLayout;
