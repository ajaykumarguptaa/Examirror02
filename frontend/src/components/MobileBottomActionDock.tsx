import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Building2, UserCircle2, ShieldCheck } from 'lucide-react';

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
      id: 'verify',
      label: 'Verify',
      icon: ShieldCheck,
      action: handleVerifyClick,
      isActive: false,
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: BookOpen,
      to: '/courses',
      isActive: location.pathname.startsWith('/courses'),
    },
    {
      id: 'centers',
      label: 'Branches',
      icon: Building2,
      to: '/centers',
      isActive: location.pathname.startsWith('/centers'),
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.action) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center py-1 px-3 text-slate-300 hover:text-amber-400 active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-bold mt-1 tracking-wide">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.to || '/'}
              className={`flex flex-col items-center justify-center py-1 px-3 active:scale-95 transition-all group ${
                item.isActive ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  item.isActive ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}
              >
                <Icon size={16} />
              </div>
              <span className="text-[10px] font-semibold mt-1 tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
