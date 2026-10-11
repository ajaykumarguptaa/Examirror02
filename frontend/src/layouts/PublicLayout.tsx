import { Outlet, Link, useLocation } from 'react-router-dom';
import { Phone, Mail, Menu, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_HOME_SETTINGS, computeImageStyles } from '../pages/admin/page-customization/HomePageCustomizer';
import { PageTransition } from '../motion';
import { MobileBottomActionDock } from '../components/MobileBottomActionDock';

const PublicLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const pathname = location.pathname;

  const loginRef = useRef<HTMLDivElement>(null);
  const franchiseRef = useRef<HTMLDivElement>(null);

  const isLinkActive = (path: string) => {
    if (path === '/') return pathname === '/';
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

      {/* Main Navbar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs border-b border-slate-200 w-full">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            {/* Logo Image or Badge */}
            <Link to="/" className={`flex items-center gap-3 ${getHoverClass(topbar.logoStyle?.hoverEffect)}`}>
              {(topbar.logoImage || '/assets/logo.png') ? (
                <div className="flex items-center gap-2.5">
                  <img
                    src={topbar.logoImage || '/assets/logo.png'}
                    alt={topbar.logoText || 'Examirror Logo'}
                    style={{
                      ...computeImageStyles(topbar.logoStyle, 1),
                      height: topbar.logoStyle?.height ? `${topbar.logoStyle.height}px` : '46px',
                      maxWidth: topbar.logoStyle?.maxWidth ? `${topbar.logoStyle.maxWidth}px` : '240px'
                    }}
                  />
                  {topbar.logoStyle?.showTextWithLogo && (
                    <span
                      style={{
                        color: topbar.logoStyle?.textColor || '#0f172a',
                        fontSize: topbar.logoStyle?.textSize ? `${topbar.logoStyle.textSize}px` : '18px',
                        fontWeight: topbar.logoStyle?.textBold !== false ? 900 : 600
                      }}
                      className="tracking-tight leading-none"
                    >
                      {topbar.logoText || 'Examirror'}
                    </span>
                  )}
                </div>
              ) : (
                <div className="border-2 border-indigo-600 bg-indigo-50/50 p-2 rounded-xl shadow-xs">
                  <span className="font-extrabold text-2xl tracking-tighter text-indigo-700 italic pr-0.5">
                    {topbar.logoText || 'Examirror'}
                  </span>
                </div>
              )}
            </Link>
          </div>


          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-5 lg:space-x-7 items-center font-medium text-[13px] text-slate-700 tracking-normal">
            {navLinks.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative py-2 px-1 text-[13px] transition-colors duration-200 cursor-pointer ${active
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-blue-600 font-medium'
                    }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="activePublicNavIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full shadow-xs"
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
                className={`relative py-2 px-1 text-[13px] flex items-center gap-1 transition-colors cursor-pointer ${isLoginActive || activeDropdown === 'login'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-blue-600 font-medium'
                  }`}
              >
                <span>Login</span>
                <ChevronDown
                  size={13}
                  className={`transform transition-transform duration-200 ${activeDropdown === 'login' ? 'rotate-180' : ''
                    }`}
                />
                {isLoginActive && (
                  <motion.span
                    layoutId="activePublicNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full shadow-xs"
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
                    className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden"
                  >
                    <Link
                      to="/login/center"
                      className={`block px-4 py-2.5 text-xs font-medium border-b border-slate-100 transition-colors ${pathname === '/login/center' || pathname === '/center/login'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Center Login
                    </Link>
                    <Link
                      to="/login/student"
                      className={`block px-4 py-2.5 text-xs font-medium transition-colors ${pathname === '/login/student' || pathname === '/student/login'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Student Login
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Franchise Dropdown */}
            <div className="relative" ref={franchiseRef}>
              <button
                type="button"
                onClick={() => toggleDropdown('franchise')}
                className={`relative py-2 px-1 text-[13px] flex items-center gap-1 transition-colors cursor-pointer ${isFranchiseActive || activeDropdown === 'franchise'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-blue-600 font-medium'
                  }`}
              >
                <span>Franchise</span>
                <ChevronDown
                  size={13}
                  className={`transform transition-transform duration-200 ${activeDropdown === 'franchise' ? 'rotate-180' : ''
                    }`}
                />
                {isFranchiseActive && (
                  <motion.span
                    layoutId="activePublicNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full shadow-xs"
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
                      className={`block px-4 py-2.5 text-xs font-medium border-b border-slate-100 transition-colors ${pathname === '/franchise/requirements'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setActiveDropdown(null)}
                    >
                      Franchise Requirements
                    </Link>
                    <Link
                      to="/franchise/register"
                      className={`block px-4 py-2.5 text-xs font-medium transition-colors ${pathname === '/franchise/register'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
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
                      className={`block px-3.5 py-2.5 rounded-xl transition-all ${active
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-2xs font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
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
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Center Login
                </Link>
                <Link
                  to="/login/student"
                  className={`block px-3 py-2 rounded-xl ${pathname.includes('/login/student') || pathname.includes('/student/login')
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Student Login
                </Link>

                <div className="px-3 py-2 text-slate-400 text-[10px] uppercase tracking-wider mt-3 border-t border-slate-100 pt-3">
                  Franchise
                </div>
                <Link
                  to="/franchise/requirements"
                  className={`block px-3 py-2 rounded-xl ${pathname === '/franchise/requirements'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
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

      {/* Main Content */}
      <main className="flex-grow pb-16 md:pb-0">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Sticky Mobile Bottom Action Dock */}
      <MobileBottomActionDock />

      {/* Footer with Dynamic Theme Colors */}
      <footer
        style={{
          backgroundColor: theme?.footerBg || '#0f172a',
          color: theme?.footerTextColor || '#94a3b8'
        }}
        className="pt-16 pb-8 border-t border-slate-800 w-full"
      >
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="bg-white rounded-2xl flex items-center justify-center p-2.5 mb-2 shadow-lg max-w-[160px] overflow-hidden">
                {topbar.logoImage ? (
                  <img
                    src={topbar.logoImage}
                    alt={topbar.logoText || 'Logo'}
                    style={{
                      borderRadius: `${Math.min(topbar.logoStyle?.borderRadius ?? 8, 12)}px`
                    }}
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border-2 border-indigo-500 rounded-xl">
                    <span className="font-extrabold text-2xl text-indigo-700 italic">
                      {topbar.logoText || 'Examirror'}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="font-black text-xl tracking-tight text-white">
                {footer.companyName || 'EXAMIRROR'}
              </h3>
              <p className="text-sm max-w-xs leading-relaxed opacity-80">
                {footer.description || 'We provide free computer franchise registration with best in class dashboard and customer support.'}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-bold text-base tracking-wide">Quick Links</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="/courses" className="hover:text-white transition-colors">Courses Catalog</Link></li>
                <li><Link to="/gallery" className="hover:text-white transition-colors">Photo Gallery</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-bold text-base tracking-wide">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-center md:justify-start space-x-3">
                  <Phone size={16} className="text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">{footer.phone || ''}</span>
                </li>
                <li className="flex items-center justify-center md:justify-start space-x-3">
                  <Mail size={16} className="text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">{footer.email || 'saurabhcsjnu@gmail.com'}</span>
                </li>
                <li className="flex items-start justify-center md:justify-start space-x-3 leading-relaxed opacity-80">
                  <span>{footer.address || 'Gali no4, near K-14, kankarbagh, Sampatchak, Patna, Bihar- 800020'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-slate-800 text-center text-xs font-medium opacity-60">
            {footer.copyright || '© 2026 :: Examirror'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

