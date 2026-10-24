import { Outlet, Link, useLocation } from 'react-router-dom';
import { Phone, Mail, Menu, ChevronDown, Sparkles, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_HOME_SETTINGS, computeImageStyles } from '../pages/admin/page-customization/HomePageCustomizer';
import { PageTransition } from '../motion';
import { MobileBottomActionDock } from '../components/MobileBottomActionDock';
import { DirectStudentRegisterModal } from '../components/DirectStudentRegisterModal';
import { HomeTopAnnouncementRibbon } from '../components/home/HomeTopAnnouncementRibbon';
import { HomeAdvertisementModal } from '../components/home/HomeAdvertisementModal';
import { type HomeAdvertisementSettings, DEFAULT_AD_SETTINGS } from '../types/advertisement';

const PublicLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const loginRef = useRef<HTMLDivElement>(null);
  const franchiseRef = useRef<HTMLDivElement>(null);

  const isLinkActive = (path: string) => {
    if (path === '/') return pathname === '/' && (!location.hash || (location.hash !== '#test-series' && location.hash !== '#elite-pass'));
    if (path === '/test-series') return pathname === '/test-series' || pathname.startsWith('/test-series');
    if (path === '/passes') return pathname === '/passes' || pathname === '/pass' || pathname === '/elite-pass' || (pathname === '/' && location.hash === '#elite-pass');
    if (path === '/centers' && (pathname === '/centers' || pathname === '/branches' || pathname.startsWith('/centers/') || pathname.startsWith('/branches/'))) {
      return true;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isLoginActive = pathname.startsWith('/login') || pathname.startsWith('/student/login') || pathname.startsWith('/center/login');
  const isFranchiseActive = pathname.startsWith('/franchise');

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Courses', path: '/courses' },
    { label: 'Test Series', path: '/test-series', badge: 'Live' },
    { label: 'Elite Pass', path: '/passes', badge: 'VIP' },
    { label: 'E-Notes', path: '/notes' },
    { label: 'Branches', path: '/centers' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' }
  ];

  // Fetch customizable layout & branding settings
  const { data: homeSettings } = useQuery({
    queryKey: ['homeSettings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/settings/home');
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        return json.data ? { ...DEFAULT_HOME_SETTINGS, ...json.data } : DEFAULT_HOME_SETTINGS;
      } catch (error) {
        return DEFAULT_HOME_SETTINGS;
      }
    }
  });

  // Fetch campaign advertisement settings
  const { data: adSettings } = useQuery({
    queryKey: ['homeAdvertisement'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/settings/home_advertisement');
        if (!response.ok) return null;
        const json = await response.json();
        return json.data ? { ...DEFAULT_AD_SETTINGS, ...json.data } : DEFAULT_AD_SETTINGS;
      } catch (error) {
        return DEFAULT_AD_SETTINGS;
      }
    },
    staleTime: 60 * 1000
  });

  const settings = homeSettings || DEFAULT_HOME_SETTINGS;
  const theme = settings.theme || DEFAULT_HOME_SETTINGS.theme;
  const topbar = settings.topbar || DEFAULT_HOME_SETTINGS.topbar;
  const footer = settings.footer || DEFAULT_HOME_SETTINGS.footer;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(event.target as Node)) {
        if (activeDropdown === 'login') setActiveDropdown(null);
      }
      if (franchiseRef.current && !franchiseRef.current.contains(event.target as Node)) {
        if (activeDropdown === 'franchise') setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Handle cross-page or direct hash scrolling (e.g. /#test-series)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const getHoverClass = (hoverEffect?: string) => {
    if (hoverEffect === 'zoom') return 'hover:scale-105 transition-transform duration-200';
    if (hoverEffect === 'lift') return 'hover:-translate-y-1 transition-transform duration-200';
    if (hoverEffect === 'glow') return 'hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all duration-200';
    return 'hover:opacity-95 transition-opacity duration-200';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-white">
      {/* Top Floating Announcement Ribbon */}
      {adSettings?.enabled && adSettings?.displayFormats?.topRibbon && (
        <HomeTopAnnouncementRibbon ad={adSettings} />
      )}

      {/* Interactive Entry Popup Ad Modal (Home Page Only) */}
      {pathname === '/' && adSettings?.enabled && adSettings?.displayFormats?.popupModal && (
        <HomeAdvertisementModal ad={adSettings} />
      )}

      {/* Top Bar */}
      {topbar.enabled !== false && (
        <div
          style={{
            backgroundColor: theme?.topbarBg || '#0f172a',
            color: theme?.topbarTextColor || '#f8fafc'
          }}
          className="w-full py-2.5 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm flex flex-col sm:flex-row justify-between items-center z-50 relative border-b border-white/10 shadow-xs"
        >
          <div className="flex items-center space-x-6 font-medium">
            <div className="flex items-center space-x-2">
              <Phone size={13} className="text-indigo-400" />
              <span>{topbar.phone || ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={13} className="text-indigo-400" />
              <span>{topbar.email || 'saurabhcsjnu@gmail.com'}</span>
            </div>
          </div>
          <div className="text-xs mt-1 sm:mt-0 opacity-80 hidden md:block font-medium">
            {topbar.govNotice || 'Registered by Government of India / ISO 9001:2015 Certified'}
          </div>
        </div>
      )}

      {/* Main Navbar with Modern Frosted Glass */}
      <header className="glass-panel sticky top-0 z-40 shadow-xs border-b border-slate-200/70 w-full transition-all duration-300">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            {/* Logo Image or Badge */}
            <Link to="/" className={`flex items-center gap-2 ${getHoverClass(topbar.logoStyle?.hoverEffect)}`}>
              {(topbar.logoImage || '/assets/logo.png') ? (
                <div className="flex items-center gap-2 bg-transparent py-0 my-0">
                  <img
                    src={
                      (topbar.logoImage || '/assets/logo.png').startsWith('data:')
                        ? (topbar.logoImage || '/assets/logo.png')
                        : `${(topbar.logoImage || '/assets/logo.png').split('?')[0]}?v=transparent_v2`
                    }
                    alt={topbar.logoText || 'Examirror Logo'}
                    className="bg-transparent object-contain m-0 p-0"
                    style={{
                      ...computeImageStyles(topbar.logoStyle, 1),
                      height: topbar.logoStyle?.height ? `${Math.min(topbar.logoStyle.height, 32)}px` : '30px',
                      maxWidth: topbar.logoStyle?.maxWidth ? `${topbar.logoStyle.maxWidth}px` : '180px',
                      backgroundColor: 'transparent',
                      mixBlendMode: 'multiply'
                    }}
                  />
                  {topbar.logoStyle?.showTextWithLogo && (
                    <span
                      style={{
                        color: topbar.logoStyle?.textColor || '#0f172a',
                        fontSize: topbar.logoStyle?.textSize ? `${topbar.logoStyle.textSize}px` : '17px',
                        fontWeight: topbar.logoStyle?.textBold !== false ? 900 : 600
                      }}
                      className="tracking-tight leading-none"
                    >
                      {topbar.logoText || 'Examirror'}
                    </span>
                  )}
                </div>
              ) : (
                <div className="border border-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-lg shadow-xs">
                  <span className="font-extrabold text-lg tracking-tighter text-indigo-700 italic pr-0.5">
                    {topbar.logoText || 'Examirror'}
                  </span>
                </div>
              )}
            </Link>
          </div>


          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-4 lg:space-x-6 items-center font-semibold text-[13px] text-black tracking-normal">
            {navLinks.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative py-1 px-1 text-[13px] transition-colors duration-200 cursor-pointer inline-flex flex-col items-center justify-center ${active
                    ? 'text-blue-600 font-bold'
                    : 'text-black hover:text-blue-600 font-semibold'
                    }`}
                >
                  <span className="inline-flex items-center gap-1 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:text-blue-600">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black rounded-full shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </span>

                  {/* Fluid Expanding Underline on Hover */}
                  {!active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
                  )}

                  {/* Active Indicator Underline */}
                  {active && (
                    <motion.span
                      layoutId="activePublicNavIndicator"
                      className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Login Dropdown */}
            <div className="relative" ref={loginRef}>
              <button
                type="button"
                onClick={() => toggleDropdown('login')}
                className={`group relative py-1 px-1 text-[13px] flex items-center gap-1 transition-colors duration-200 cursor-pointer ${isLoginActive || activeDropdown === 'login'
                  ? 'text-blue-600 font-bold'
                  : 'text-black hover:text-blue-600 font-semibold'
                  }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:text-blue-600">
                  Login
                </span>
                <ChevronDown
                  size={13}
                  className={`transform transition-transform duration-200 ${activeDropdown === 'login' ? 'rotate-180' : 'group-hover:translate-y-0.5'
                    }`}
                />
                {!isLoginActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
                )}
                {isLoginActive && (
                  <motion.span
                    layoutId="activePublicNavIndicator"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
              <AnimatePresence>
                {activeDropdown === 'login' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden"
                  >
                    <Link
                      to="/login/center"
                      className={`block px-4 py-2 text-xs font-semibold border-b border-slate-100 transition-colors ${pathname === '/login/center' || pathname === '/center/login'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-black hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Center Login
                    </Link>
                    <Link
                      to="/login/student"
                      className={`block px-4 py-2 text-xs font-semibold transition-colors ${pathname === '/login/student' || pathname === '/student/login'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-black hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Student Login
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        setIsRegisterModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 border-t border-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} className="text-amber-500" />
                      <span>New Candidate (OTP)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Franchise Dropdown */}
            <div className="relative" ref={franchiseRef}>
              <button
                type="button"
                onClick={() => toggleDropdown('franchise')}
                className={`group relative py-1 px-1 text-[13px] flex items-center gap-1 transition-colors duration-200 cursor-pointer ${isFranchiseActive || activeDropdown === 'franchise'
                  ? 'text-blue-600 font-bold'
                  : 'text-black hover:text-blue-600 font-semibold'
                  }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:text-blue-600">
                  Franchise
                </span>
                <ChevronDown
                  size={13}
                  className={`transform transition-transform duration-200 ${activeDropdown === 'franchise' ? 'rotate-180' : 'group-hover:translate-y-0.5'
                    }`}
                />
                {!isFranchiseActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out group-hover:w-full" />
                )}
                {isFranchiseActive && (
                  <motion.span
                    layoutId="activePublicNavIndicator"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
              <AnimatePresence>
                {activeDropdown === 'franchise' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden"
                  >
                    <Link
                      to="/franchise/requirements"
                      className={`block px-4 py-2.5 text-xs font-semibold border-b border-slate-100 transition-colors ${pathname === '/franchise/requirements'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-black hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Franchise Requirements
                    </Link>
                    <Link
                      to="/franchise/register"
                      className={`block px-4 py-2.5 text-xs font-semibold transition-colors ${pathname === '/franchise/register'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-black hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Franchise Registration
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-800 hover:text-blue-600 focus:outline-none cursor-pointer p-1"
            >
              <Menu size={26} />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden shadow-lg"
            >
              <div className="px-3 pt-2 pb-4 space-y-1 font-bold text-xs uppercase tracking-wider">
                {navLinks.map((item) => {
                  const active = isLinkActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${active
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-2xs font-bold'
                        : 'text-black hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black rounded-full shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="px-3 py-2 text-slate-400 text-[10px] uppercase tracking-wider mt-3 border-t border-slate-100 pt-3">
                  Logins
                </div>
                <Link
                  to="/login/center"
                  className={`block px-3 py-2 rounded-xl ${pathname.includes('/login/center') || pathname.includes('/center/login')
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-black hover:bg-slate-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Center Login
                </Link>
                <Link
                  to="/login/student"
                  className={`block px-3 py-2 rounded-xl ${pathname.includes('/login/student') || pathname.includes('/student/login')
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-black hover:bg-slate-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Student Login
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRegisterModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-indigo-700 bg-indigo-50 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Register as Candidate (OTP)</span>
                </button>

                <div className="px-3 py-2 text-slate-400 text-[10px] uppercase tracking-wider mt-3 border-t border-slate-100 pt-3">
                  Franchise
                </div>
                <Link
                  to="/franchise/requirements"
                  className={`block px-3 py-2 rounded-xl ${pathname === '/franchise/requirements'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-black hover:bg-slate-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Franchise Requirements
                </Link>
                <Link
                  to="/franchise/register"
                  className={`block px-3 py-2 rounded-xl ${pathname === '/franchise/register'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Franchise Registration
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content with dynamic mobile dock offset */}
      <main className="flex-grow pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Sticky Mobile Bottom Action Dock */}
      <MobileBottomActionDock />

      {/* 3D Elevated Public Footer with 4-Column Responsive Layout */}
      <footer
        style={{
          backgroundColor: theme?.footerBg || '#0f172a',
          color: theme?.footerTextColor || '#94a3b8'
        }}
        className="pt-10 sm:pt-12 pb-6 border-t border-slate-800/80 w-full relative z-10 card-3d-elevated"
      >
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 text-left">
            
            {/* Col 1: Brand & Certification */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl inline-flex items-center justify-center p-2 shadow-md max-w-[140px] overflow-hidden card-3d-elevated">
                {topbar.logoImage ? (
                  <img
                    src={topbar.logoImage}
                    alt={topbar.logoText || 'Logo'}
                    style={{
                      borderRadius: `${Math.min(topbar.logoStyle?.borderRadius ?? 6, 8)}px`
                    }}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center border-2 border-indigo-500 rounded-lg">
                    <span className="font-extrabold text-lg text-indigo-700 italic">
                      {topbar.logoText || 'Examirror'}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="font-extrabold text-base tracking-tight text-white">
                {footer.companyName || 'EXAMIRROR DIGITAL EDUCATION'}
              </h3>
              <p className="text-xs leading-relaxed opacity-80">
                {footer.description || 'India’s premier certified vocational education and computer franchise network, providing government-aligned curriculums and high-speed mock test engines.'}
              </p>

              <div className="pt-1 flex flex-wrap gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 inline-flex items-center gap-1 shadow-2xs">
                  <span>ISO 9001:2015</span>
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 inline-flex items-center gap-1 shadow-2xs">
                  <span>Govt. Registered</span>
                </span>
              </div>
            </div>

            {/* Col 2: Academic & Assessment */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wider uppercase opacity-95">Academic & Mocks</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <Link to="/passes" className="text-amber-400 font-bold hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm">
                    <span>👑 Examirror Elite Pass VIP</span>
                  </Link>
                </li>
                <li>
                  <Link to="/test-series" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    All-India Test Series & Mocks
                  </Link>
                </li>
                <li>
                  <Link to="/courses" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Certified Diploma Courses
                  </Link>
                </li>
                <li>
                  <Link to="/notes" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Digital Study Material & E-Notes
                  </Link>
                </li>
                <li>
                  <a href="/#verify-gateway" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Student & Certificate Verification
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Franchise & Network */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wider uppercase opacity-95">Franchise Network</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <Link to="/franchise/requirements" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Franchise Affiliation Norms
                  </Link>
                </li>
                <li>
                  <Link to="/franchise/register" className="text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm">
                    Apply for Training Center
                  </Link>
                </li>
                <li>
                  <Link to="/centers" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Authorized Branches & Centers
                  </Link>
                </li>
                <li>
                  <Link to="/login/center" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Authorized Center Portal Login
                  </Link>
                </li>
                <li>
                  <Link to="/login/student" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm">
                    Candidate Student Portal Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Verification Support */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wider uppercase opacity-95">Support & Head Office</h4>
              <ul className="space-y-2.5 text-xs">
                {footer.phone && (
                  <li className="flex items-center space-x-2.5">
                    <Phone size={14} className="text-indigo-400 shrink-0" />
                    <span className="font-semibold text-white">{footer.phone}</span>
                  </li>
                )}
                <li className="flex items-center space-x-2.5">
                  <Mail size={14} className="text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">{footer.email || 'saurabhcsjnu@gmail.com'}</span>
                </li>
                <li className="flex items-start space-x-2.5 leading-relaxed opacity-80">
                  <span>{footer.address || 'Gali no4, near K-14, kankarbagh, Sampatchak, Patna, Bihar - 800020'}</span>
                </li>
                <li className="pt-1">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                  >
                    <span>Submit Query or Grievance</span>
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Dynamic Copyright & Verified Security Badges */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-medium text-slate-400">
            <div>
              {footer.copyright || `© ${new Date().getFullYear()} ${footer.companyName || 'Examirror Digital Education Network'}. All Rights Reserved.`}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>256-Bit SSL Encrypted</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Direct Candidate Registration Modal */}
      <DirectStudentRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};

export default PublicLayout;

