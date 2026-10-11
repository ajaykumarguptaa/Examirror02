import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Users,
  Globe,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  CreditCard,
  Sparkles,
  FileSpreadsheet,
  MessageSquare,
  Sliders,
  GraduationCap,
  Trophy,
  PenTool,
  Tag,
  Megaphone,
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import NotificationBell from '../components/common/NotificationBell';
import { AuthoritySignatureModal } from '../components/admin/AuthoritySignatureModal';
import SEO from '../components/SEO';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Pending requests real-time state
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingFranchiseCount, setPendingFranchiseCount] = useState<number>(0);
  const [pendingContactCount, setPendingContactCount] = useState<number>(0);
  const [pendingTestPaymentsCount, setPendingTestPaymentsCount] = useState<number>(0);
  const [latestPendingRequest, setLatestPendingRequest] = useState<any | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [lastKnownRequestId, setLastKnownRequestId] = useState<number>(0);
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    navigate('/login/admin');
  };

  // Super Admin Authentication Guard
  useEffect(() => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/login/admin', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Real-time polling for new token requests, franchise requests & contact queries (every 4 seconds)
  useEffect(() => {
    let isMounted = true;

    const checkPendingRequests = async () => {
      try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const [walletRes, franchiseRes, contactRes, testPayRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/wallet-requests?status=pending'),
          axios.get('http://localhost:3000/api/admin/franchise-requests?status=Pending'),
          axios.get('http://localhost:3000/api/admin/contact-queries?status=Pending'),
          axios.get('http://localhost:3000/api/admin/test-series/payments?status=PENDING', { headers: authHeaders }).catch(() => ({ data: { data: [] } }))
        ]);

        if (isMounted) {
          if (walletRes.data?.success) {
            const list = walletRes.data.data || [];
            setPendingCount(list.length);

            if (list.length > 0) {
              const mostRecent = list[0];
              // Check if there is a newly arrived request
              if (lastKnownRequestId !== 0 && mostRecent.id > lastKnownRequestId) {
                setLatestPendingRequest(mostRecent);
                setShowNotificationToast(true);
              }
              setLastKnownRequestId(mostRecent.id);
            }
          }

          if (franchiseRes.data?.success) {
            const frList = franchiseRes.data.data || [];
            setPendingFranchiseCount(frList.length);
          }

          if (contactRes.data?.success) {
            const cqList = contactRes.data.data || [];
            setPendingContactCount(cqList.length);
          }

          if (testPayRes.data?.data) {
            const tpList = testPayRes.data.data || [];
            setPendingTestPaymentsCount(tpList.length);
          }
        }
      } catch (err) {
        // Silently handle polling network error
      }
    };

    checkPendingRequests();
    const interval = setInterval(checkPendingRequests, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lastKnownRequestId]);

  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true
    },
    {
      to: '/admin/test-series',
      label: 'Test Series Master',
      icon: Trophy,
      badge: pendingTestPaymentsCount > 0 ? pendingTestPaymentsCount : null,
      highlight: pendingTestPaymentsCount > 0
    },
    {
      to: '/admin/franchise-requests',
      label: 'Franchise Requests',
      icon: Building2,
      badge: pendingFranchiseCount > 0 ? pendingFranchiseCount : null,
      highlight: pendingFranchiseCount > 0
    },
    {
      to: '/admin/contact-queries',
      label: 'Contact Queries',
      icon: MessageSquare,
      badge: pendingContactCount > 0 ? pendingContactCount : null,
      highlight: pendingContactCount > 0
    },
    {
      to: '/admin/centers/create',
      label: 'Create Center',
      icon: Building2
    },
    {
      to: '/admin/wallet-requests',
      label: 'Token Approval',
      icon: Wallet,
      badge: pendingCount > 0 ? pendingCount : null,
      highlight: true
    },
    {
      to: '/admin/students',
      label: 'Students Directory',
      icon: Users
    },
    {
      to: '/admin/broadcast',
      label: 'Broadcasts',
      icon: Megaphone
    },
    {
      to: '/admin/courses',
      label: 'Course Manager',
      icon: GraduationCap
    },
    {
      to: '/admin/test-pricing',
      label: 'Test Pricing & Quota',
      icon: Sliders
    },
    {
      to: '/admin/backup-export',
      label: 'Backup & Export',
      icon: FileSpreadsheet
    },
    {
      to: '/admin/settings/home',
      label: 'Page Customization',
      icon: Globe
    }
  ];


  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <SEO title="Super Admin Dashboard | Examirror" noindex={true} />

      {/* Real-time Floating Notification Toast */}
      {showNotificationToast && latestPendingRequest && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-[#1e1b4b] text-white border-2 border-amber-400 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-[#1e1b4b] flex items-center justify-center font-black animate-bounce">
                <Bell size={16} />
              </div>
              <div>
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  New Token Recharge Received!
                </div>
                <div className="text-xs font-bold text-white">
                  {latestPendingRequest.centerName} ({latestPendingRequest.centerCode})
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 p-2.5 bg-[#2e2b5e] rounded-xl text-xs flex items-center justify-between border border-indigo-900">
            <div>
              <div className="text-slate-300 font-mono text-[11px]">UTR: {latestPendingRequest.utr_number}</div>
              <div className="font-black text-amber-300 text-sm mt-0.5">
                ₹{Number(latestPendingRequest.amount).toLocaleString('en-IN')} Tokens
              </div>
            </div>
            <Link
              to="/admin/wallet-requests"
              onClick={() => setShowNotificationToast(false)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#1e1b4b] font-black rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <span>Verify</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#1e1b4b] text-white hidden md:flex flex-col shadow-xl z-20">

        {/* Brand Header */}
        <div className="p-6 border-b border-indigo-950 flex flex-col items-center justify-center">
          <span className="font-black text-2xl tracking-wider text-yellow-400 font-mono">
            SUPER ADMIN
          </span>
          <span className="text-[10px] text-indigo-300 tracking-widest uppercase font-semibold mt-0.5">
            Central Management Portal
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-medium text-xs ${isActive
                    ? 'bg-[#2e2b5e] text-white shadow-xs font-bold border-l-4 border-yellow-400'
                    : item.highlight
                      ? 'text-amber-300 hover:bg-[#2e2b5e]/70 hover:text-white'
                      : 'text-indigo-200 hover:bg-[#2e2b5e]/60 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-yellow-400' : ''} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-[#1e1b4b] animate-pulse shadow-xs">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="text-yellow-400" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Exit Admin Button */}
        <div className="p-4 border-t border-indigo-950">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition-colors text-xs font-bold cursor-pointer"
          >
            <LogOut size={18} />
            <span>Exit Admin</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header Ribbon */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Examirror Administration
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Token Notification Icon */}
            <Link
              to="/admin/wallet-requests"
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${pendingCount > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              title="Token Recharge Requests Queue"
            >
              <div className="relative flex items-center justify-center">
                <Bell size={16} className={pendingCount > 0 ? 'text-amber-700' : 'text-slate-500'} />
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-2 border-amber-100">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span>
                {pendingCount > 0 ? 'Token Approvals' : 'No Pending Tokens'}
              </span>
            </Link>

            {/* Note Distribution Fee Indicator (Removed: Now dynamic per note) */}

            <span className="text-slate-300 mx-1">|</span>

            {/* Authority E-Signature Settings */}
            <button
              type="button"
              onClick={() => setIsAuthorityModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-900 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Super Admin E-Signature & Stamp Settings"
            >
              <PenTool size={13} className="text-amber-700" />
              <span>Authority E-Sign</span>
            </button>

            <span className="text-slate-300">|</span>

            <div className="flex items-center mx-2">
              <NotificationBell userType="admin" />
            </div>

            <span className="text-slate-300">|</span>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>

      </div>

      {/* Super Admin Authority Signature Modal */}
      <AuthoritySignatureModal
        isOpen={isAuthorityModalOpen}
        onClose={() => setIsAuthorityModalOpen(false)}
      />

    </div>
  );
};

export default AdminLayout;
