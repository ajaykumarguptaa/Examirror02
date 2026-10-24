import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Award, ShieldCheck, UserCircle2 } from 'lucide-react';

export const MobileBottomActionDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleVerifyClick = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('verify-gateway');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/#verify-gateway');
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      to: '/',
      isActive: location.pathname === '/' && (!location.hash || location.hash !== '#verify-gateway'),
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: BookOpen,
      to: '/courses',
      isActive: location.pathname.startsWith('/courses'),
    },
    {
      id: 'test-series',
      label: 'Tests',
      icon: Award,
      to: '/test-series',
      badge: 'Live',
      isActive: location.pathname.startsWith('/test-series'),
    },
    {
      id: 'verify',
      label: 'Verify',
      icon: ShieldCheck,
      action: handleVerifyClick,
      isActive: location.hash === '#verify-gateway',
    },
    {
      id: 'login',
      label: 'Login',
      icon: UserCircle2,
      to: '/login/student',
      isActive: location.pathname.includes('/login'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-2 left-2 right-2 z-40 bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 text-white rounded-2xl shadow-2xl shadow-black/40 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] card-3d-elevated"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.action) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                  item.isActive ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    item.isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                      : 'bg-slate-800/80 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-semibold mt-1 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.to || '/'}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 relative ${
                item.isActive ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all relative ${
                  item.isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                    : 'bg-slate-800/80 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-gradient-to-r from-amber-500 to-rose-500 text-[8px] font-black rounded-full text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold mt-1 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

