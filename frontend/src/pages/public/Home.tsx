import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  GraduationCap,
  Sparkles,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Send,
  Volume2,
  Star,
  Globe2,
  CheckCircle,
  Laptop,
  HandCoins,
  Users,
  MapPin,
  Flame,
  Zap,
  CheckCircle2,
  Award,
  Layers,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock3,
  Search,
  Loader2,
  UserCheck,
  Database,
  QrCode,
  X,
  ExternalLink,
  FileCheck2,
  FileText,
  Camera,
  Download,
  BadgeCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QrCameraScannerModal } from '../../components/QrCameraScannerModal';
import SEO from '../../components/SEO';
import { downloadOfficialVerificationPdf } from '../../utils/verificationPdf';
import {
  DEFAULT_HOME_SETTINGS,
  computeImageStyles,
  type StatItem,
  type FeatureItem,
  type VerificationPortalItem,
  type CourseCategoryItem,
  getCourseFallbackImage
} from '../admin/page-customization/HomePageCustomizer';
import {
  FadeIn,
  FadeUp,
  FadeDown,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  NumberCounter,
  ScrollReveal,
  InteractiveCard,
  InteractiveButton,
  motionTokens
} from '../../motion';
import { Tilt3DCard, SpotlightCard, MagneticButton } from '../../components/ui';

// Standardized Stagger & Item Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionTokens.stagger.normal,
      delayChildren: 0.05
    }
  }
};

const itemFadeUp = {
  hidden: { opacity: 0, y: motionTokens.distance.medium },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTokens.duration.moderate, ease: motionTokens.easing.standard }
  }
};

const cardHoverVariant = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard }
  }
};

const Home = () => {
  const { data: homeData } = useQuery({
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

  // Dynamic Public Stats from Live Database
  const { data: publicStats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/public/public-stats');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        return json.data;
      } catch {
        return null;
      }
    }
  });

  // Dynamic Courses from Live Database
  const { data: publicCourses } = useQuery({
    queryKey: ['publicCourses'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/public/courses');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    }
  });

  const content = homeData || DEFAULT_HOME_SETTINGS;

  const theme = content.theme || DEFAULT_HOME_SETTINGS.theme;
  const marquee = content.marquee || DEFAULT_HOME_SETTINGS.marquee;
  const hero = content.hero || DEFAULT_HOME_SETTINGS.hero;
  const stats = content.stats || DEFAULT_HOME_SETTINGS.stats;
  const features = content.features || DEFAULT_HOME_SETTINGS.features;
  const verification = content.verification || DEFAULT_HOME_SETTINGS.verification;
  const coursesSection = content.coursesSection || DEFAULT_HOME_SETTINGS.coursesSection;
  const centersSection = content.centersSection || DEFAULT_HOME_SETTINGS.centersSection;
  const enquiry = content.enquiry || DEFAULT_HOME_SETTINGS.enquiry;
  const cta = content.cta || DEFAULT_HOME_SETTINGS.cta;

  // Slider State for Courses Carousel
  const [courseSlidePage, setCourseSlidePage] = useState(0);
  const [isCourseAutoSlide, setIsCourseAutoSlide] = useState(true);

  // Real-Time Online Verification Gateway State
  const [centerInput, setCenterInput] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [mobileVerifyTab, setMobileVerifyTab] = useState<'center' | 'student' | 'cert'>('student');
  const [verificationLoading, setVerificationLoading] = useState<'center' | 'student' | 'cert' | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    type: 'center' | 'student' | 'certificate' | 'error';
    data?: any;
    message?: string;
    searchedQuery?: string;
  } | null>(null);

  const handleVerifyCenter = async (query?: string) => {
    const val = (query !== undefined ? query : centerInput).trim();
    if (!val) return;
    setVerificationLoading('center');
    setVerificationResult(null);
    try {
      const res = await fetch(`/api/public/verify/center/${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setVerificationResult({ type: 'center', data: data.data, searchedQuery: val });
      } else {
        setVerificationResult({ type: 'error', message: `No registered Study Center found with code "${val}". Please check the affiliation code.`, searchedQuery: val });
      }
    } catch {
      setVerificationResult({ type: 'error', message: 'Verification lookup failed. Please try again.', searchedQuery: val });
    } finally {
      setVerificationLoading(null);
    }
  };

  const handleVerifyStudent = async (query?: string) => {
    const val = (query !== undefined ? query : studentInput).trim();
    if (!val) return;
    setVerificationLoading('student');
    setVerificationResult(null);
    try {
      const res = await fetch(`/api/public/verify/student/${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setVerificationResult({ type: 'student', data: data.data, searchedQuery: val });
      } else {
        setVerificationResult({ type: 'error', message: `No student record found for "${val}". Please verify the Enrollment or Roll Number.`, searchedQuery: val });
      }
    } catch {
      setVerificationResult({ type: 'error', message: 'Student verification failed. Please try again.', searchedQuery: val });
    } finally {
      setVerificationLoading(null);
    }
  };

  const handleVerifyCert = async (query?: string) => {
    const val = (query !== undefined ? query : certInput).trim();
    if (!val) return;
    setVerificationLoading('cert');
    setVerificationResult(null);
    try {
      const res = await fetch(`/api/public/verify/certificate/${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setVerificationResult({ type: 'certificate', data: data.data, searchedQuery: val });
      } else {
        // Fallback search to student
        const fallbackRes = await fetch(`/api/public/verify/student/${encodeURIComponent(val)}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.data) {
          setVerificationResult({ type: 'certificate', data: fallbackData.data, searchedQuery: val });
        } else {
          setVerificationResult({ type: 'error', message: `No certificate or marksheet issued for "${val}".`, searchedQuery: val });
        }
      }
    } catch {
      setVerificationResult({ type: 'error', message: 'Certificate verification failed. Please try again.', searchedQuery: val });
    } finally {
      setVerificationLoading(null);
    }
  };

  const handleQrScanSuccess = (scannedText: string) => {
    setIsCameraScannerOpen(false);
    let identifier = scannedText.trim();
    if (identifier.includes('/verify/certificate/')) {
      identifier = identifier.split('/verify/certificate/')[1].split('?')[0].split('#')[0];
    } else if (identifier.includes('/verify/student/')) {
      identifier = identifier.split('/verify/student/')[1].split('?')[0].split('#')[0];
    } else if (identifier.includes('/verify/')) {
      identifier = identifier.split('/verify/')[1].split('?')[0].split('#')[0];
    }
    setCertInput(identifier);
    handleVerifyCert(identifier);
  };

  // Horizontal Scroll Ref for Centers Ticker
  const centersScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic formatted courses (merging db courses + custom category tags)
  const allDisplayCourses = React.useMemo(() => {
    if (publicCourses && publicCourses.length > 0) {
      return publicCourses.map((c: any) => ({
        id: c.id,
        tag: c.categoryId || (c.code ? c.code.split('_')[0] : 'Diploma'),
        name: c.name,
        duration: c.duration || '3–6 Months',
        fee: c.fee,
        image: c.image || c.thumbnail_url || getCourseFallbackImage(c.name, c.categoryId || c.code)
      }));
    }
    return Array.isArray(coursesSection?.categories)
      ? coursesSection.categories.filter((c: CourseCategoryItem) => !c.hidden).map((c: CourseCategoryItem) => ({
          ...c,
          image: c.image || getCourseFallbackImage(c.name, c.tag)
        }))
      : DEFAULT_HOME_SETTINGS.coursesSection.categories;
  }, [publicCourses, coursesSection]);

  const coursesPerPage = 4;
  const totalCoursePages = Math.ceil(allDisplayCourses.length / coursesPerPage) || 1;

  // Auto slide timer for courses carousel
  useEffect(() => {
    if (!isCourseAutoSlide || totalCoursePages <= 1) return;
    const timer = setInterval(() => {
      setCourseSlidePage((prev) => (prev + 1) % totalCoursePages);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCourseAutoSlide, totalCoursePages]);

  // Center Ticker Scroll Handler
  const handleScrollCenters = (direction: 'left' | 'right') => {
    if (centersScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      centersScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Dynamic Recent Center Codes list
  const dynamicRecentCenters = React.useMemo(() => {
    if (publicStats?.recentCenters && publicStats.recentCenters.length > 0) {
      return publicStats.recentCenters;
    }
    return (centersSection?.recentCodes || ['EXAMc2026-188', 'EXAMc2026-186', 'EXAMc2026-185', 'EXAMc2026-184', 'EXAMc2026-183']).map((code: string) => ({
      code,
      name: 'Authorized Skill Study Center',
      state: 'India',
      city: 'Main Branch'
    }));
  }, [publicStats, centersSection]);

  const spotlightCode = dynamicRecentCenters[0]?.code || centersSection.featuredCode || 'EXAMc2026-199';

  // Filter out hidden cards
  const visibleStats: StatItem[] = React.useMemo(() => {
    if (publicStats) {
      const certified = publicStats.certifiedStudentsCount !== undefined ? publicStats.certifiedStudentsCount : publicStats.studentsCount;
      return [
        { id: '1', value: `${certified.toLocaleString('en-IN')}+`, label: 'Students Certified' },
        { id: '2', value: `${publicStats.centersCount.toLocaleString('en-IN')}+`, label: 'Authorized Study Centers' },
        { id: '3', value: `${publicStats.coursesCount}+`, label: 'Vocational & IT Courses' },
        { id: '4', value: publicStats.successRate || '98%', label: 'Career & Practical Success Rate' }
      ];
    }
    return Array.isArray(stats?.items)
      ? stats.items.filter((s: StatItem) => !s.hidden)
      : DEFAULT_HOME_SETTINGS.stats.items;
  }, [publicStats, stats]);


  const visibleFeatures: FeatureItem[] = Array.isArray(features?.items)
    ? features.items.filter((f: FeatureItem) => !f.hidden)
    : DEFAULT_HOME_SETTINGS.features.items;

  const visiblePortals: VerificationPortalItem[] = Array.isArray(verification?.portals)
    ? verification.portals.filter((p: VerificationPortalItem) => !p.hidden)
    : DEFAULT_HOME_SETTINGS.verification.portals;

  const visibleCourses: CourseCategoryItem[] = Array.isArray(coursesSection?.categories)
    ? coursesSection.categories.filter((c: CourseCategoryItem) => !c.hidden)
    : DEFAULT_HOME_SETTINGS.coursesSection.categories;

  // Color Theme Mapper for Feature Cards (Clean minimalist border & soft shadow)
  const getThemeStyles = (cardTheme?: string, index: number = 0) => {
    const t = cardTheme || ['indigo', 'emerald', 'amber', 'purple'][index % 4];
    switch (t) {
      case 'green':
      case 'emerald':
        return {
          cardBg: 'bg-white',
          border: 'border border-slate-200/80 hover:border-emerald-300',
          badgeBg: 'bg-emerald-600 text-white shadow-xs',
          numberColor: 'text-emerald-500/15',
          tagBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
          accent: 'text-emerald-700'
        };
      case 'orange':
      case 'amber':
        return {
          cardBg: 'bg-white',
          border: 'border border-slate-200/80 hover:border-amber-300',
          badgeBg: 'bg-amber-500 text-slate-950 shadow-xs',
          numberColor: 'text-amber-500/15',
          tagBg: 'bg-amber-50 text-amber-900 border border-amber-200',
          accent: 'text-amber-700'
        };
      case 'purple':
      case 'pink':
        return {
          cardBg: 'bg-white',
          border: 'border border-slate-200/80 hover:border-purple-300',
          badgeBg: 'bg-purple-600 text-white shadow-xs',
          numberColor: 'text-purple-500/15',
          tagBg: 'bg-purple-50 text-purple-800 border border-purple-200',
          accent: 'text-purple-700'
        };
      case 'blue':
      case 'indigo':
      default:
        return {
          cardBg: 'bg-white',
          border: 'border border-slate-200/80 hover:border-blue-300',
          badgeBg: 'bg-blue-600 text-white shadow-xs',
          numberColor: 'text-blue-500/15',
          tagBg: 'bg-blue-50 text-blue-800 border border-blue-200',
          accent: 'text-blue-700'
        };
    }
  };

  return (
    <div className="flex flex-col w-full font-sans text-slate-800 bg-white overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      <SEO
        title="Examirror | Skill Development & National Certification"
        description="Examirror provides accredited skill development courses, computer institute franchise opportunities, national certifications, and automated center management solutions across India."
        keywords={[
          'Examirror',
          'Computer Institute Franchise',
          'Skill Development Certification',
          'National Skill Education',
          'DCA Course',
          'ADCA Course',
          'Computer Certification India',
          'ISO Certified Computer Center'
        ]}
        breadcrumbs={[{ name: 'Home', item: '/' }]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: 'Examirror',
            url: 'https://examirror.edu.in',
            logo: 'https://examirror.edu.in/assets/logo.png',
            description: 'National skill development & vocational education network across India.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Ghatsila, Jamshedpur, East Singhbhum',
              addressLocality: 'Jamshedpur',
              addressRegion: 'Jharkhand',
              postalCode: '832303',
              addressCountry: 'IN'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Examirror',
            url: 'https://examirror.edu.in',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://examirror.edu.in/courses?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          }
        ]}
      />

      {/* 1. Top Marquee Announcement Ticker */}
      {marquee?.enabled && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-400/90 backdrop-blur-sm text-slate-950 py-2.5 px-4 text-xs font-black overflow-hidden flex items-center gap-3 border-b border-amber-300 shadow-xs z-30"
        >
          <div className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black shrink-0 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <Volume2 size={13} />
            <span>Latest Notice</span>
          </div>
          <div className="truncate font-bold tracking-tight">
            {marquee.text}
          </div>
        </motion.div>
      )}

      {/* 2. Ultra-Modern Premium Solid Light Hero Section */}
      {hero?.enabled !== false && (
        <section className="relative bg-white pt-10 pb-8 sm:pt-14 sm:pb-10 lg:pt-14 lg:pb-12 border-b border-slate-200/80 overflow-hidden w-full">

          {/* Crisp Geometric Dot Pattern (Non-Gradient) */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center text-center lg:text-left">

              {/* Left Column: Hero Content with Modern Typography */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-6 space-y-6 flex flex-col items-center lg:items-start"
              >
                {/* Clean Solid Admission Announcement Badge */}
                <motion.div
                  variants={itemFadeUp}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Admissions Open for 2026–27 Session</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-blue-600 font-bold">ISO 9001:2015 Certified</span>
                </motion.div>

                {/* Main Titles */}
                <motion.div variants={itemFadeUp} className="space-y-2">
                  <div className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wider uppercase">
                    {hero.welcomeText || 'National Skill & Vocational Education'}
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-5xl font-bold leading-[1.2] tracking-tight text-slate-900">
                    {hero.mainTitle || 'Empowering Youth with Job-Ready IT & Vocational Skills'}
                  </h1>
                </motion.div>

                {/* Subtitle / Value Proposition */}
                <motion.p
                  variants={itemFadeUp}
                  className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
                >
                  {hero.subtitle || 'Join India’s premier certified vocational education network. Explore government-aligned diploma courses, verify credentials, or register an authorized training center.'}
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                  variants={itemFadeUp}
                  className="pt-2 flex flex-wrap gap-3.5 justify-center lg:justify-start"
                >
                  <Link
                    to="/courses"
                    className="font-semibold py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:-translate-y-0.5 active:scale-98"
                  >
                    <BookOpen size={16} />
                    <span>Explore Certified Courses</span>
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    to="/franchise/requirements"
                    className="font-semibold py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:-translate-y-0.5 active:scale-98"
                  >
                    <Building2 size={16} />
                    <span>Apply for Franchise</span>
                  </Link>

                  <a
                    href="#verify-gateway"
                    className="font-semibold py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  >
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Verify Credentials</span>
                  </a>
                </motion.div>

                {/* Configurable Hero Trust Badges Row */}
                <motion.div variants={itemFadeUp} className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Govt. Registered</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <BadgeCheck size={14} className="text-blue-600" />
                    <span>ISO 9001:2015</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <QrCode size={14} className="text-indigo-600" />
                    <span>Centralized QR Diplomas</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <Building2 size={14} className="text-amber-600" />
                    <span>{publicStats?.centersCount !== undefined ? `${publicStats.centersCount}+ Centers` : 'Centers'}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Industry Aligned</span>
                  </span>
                </motion.div>
              </motion.div>

              {/* Right Column: Modern High-Impact Image Composition */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-6 relative flex justify-center lg:justify-end w-full"
              >
                {/* Main Hero Card Frame with GSAP 3D Interactive Tilt & Glossy Sheen */}
                <Tilt3DCard maxTilt={7} scale={1.01} glare={true} className="w-full max-w-xl">
                  <div className="relative w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-3 sm:p-4">

                    {/* High Quality Education & Computer Lab Visual */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900">
                      <img
                        src={homeData?.hero?.heroImage || homeData?.hero?.image || "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"}
                        alt="Modern Computer Academy Training Lab"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/20" />
                    </div>

                    {/* Floating Badge: Top-Right (Government Recognized) */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-3 right-2 sm:-top-4 sm:-right-4 bg-white text-slate-900 border border-slate-200 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl flex items-center gap-2 sm:gap-2.5 z-20"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                        ✓
                      </div>
                      <div className="text-left">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Government</div>
                        <div className="text-[11px] sm:text-xs font-black text-emerald-600">Recognized</div>
                      </div>
                    </motion.div>

                    {/* Floating Badge: Bottom-Left (Student Portal & QR Verification - Desktop/Tablet only to avoid mobile overlap) */}
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="hidden sm:flex absolute -bottom-4 -left-2 sm:-left-4 bg-white text-slate-900 border border-slate-200 px-3.5 py-2.5 rounded-2xl shadow-xl items-center gap-3 z-20"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-sm font-black shadow-sm">
                        ★
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Portal</div>
                        <div className="text-xs font-black text-amber-600">Instant QR Verify</div>
                      </div>
                    </motion.div>

                    {/* Bottom Stats Ribbon */}
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="font-black text-slate-900 text-sm">
                          <NumberCounter 
                            value={publicStats ? `${(publicStats.certifiedStudentsCount ?? publicStats.studentsCount).toLocaleString('en-IN')}+` : '0+'} 
                            durationMs={1200} 
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">Certified</div>
                      </div>
                      <div className="border-x border-slate-200">
                        <div className="font-black text-slate-900 text-sm">
                          <NumberCounter 
                            value={publicStats ? `${publicStats.centersCount.toLocaleString('en-IN')}+` : '0+'} 
                            durationMs={1200} 
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">Study Centers</div>
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm">
                          <NumberCounter 
                            value={publicStats ? `${publicStats.coursesCount}+` : '0+'} 
                            durationMs={1200} 
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">Courses</div>
                      </div>
                    </div>

                  </div>
                </Tilt3DCard>
              </motion.div>

            </div>
          </div>
        </section>
      )}

      {/* 3. Impact Stats Counters (Ultra Clean Light Floating Cards) */}
      {stats?.enabled !== false && visibleStats.length > 0 && (
        <section className="relative z-20 mt-6 sm:-mt-8 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8">
          <StaggerContainer
            staggerDelay={0.08}
            className={`grid gap-3 sm:gap-5 text-center ${visibleStats.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              visibleStats.length === 2 ? 'grid-cols-2' :
                visibleStats.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
              }`}
          >
            {visibleStats.map((stat, idx) => {
              const solidColors = [
                'bg-blue-600',
                'bg-emerald-600',
                'bg-amber-500',
                'bg-purple-600',
                'bg-indigo-600',
                'bg-slate-800'
              ];
              const cardTopColor = solidColors[idx % solidColors.length];

              return (
                <StaggerItem key={stat.id || idx}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md border border-slate-200 relative overflow-hidden group flex flex-col justify-between h-full cursor-default"
                  >
                    <div>
                      <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors duration-200">
                        <NumberCounter value={stat.value} durationMs={1400} />
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-slate-600 mt-1 sm:mt-1.5 leading-snug">
                        {stat.label}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-extrabold text-blue-600">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Verified Milestone</span>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      )}

      {/* 4. Core Features Section (Solid 3D Grid) */}
      {features?.enabled !== false && visibleFeatures.length > 0 && (
        <section className="py-16 sm:py-20 bg-slate-50 border-t-2 border-b-2 border-slate-200 relative w-full overflow-hidden">
          <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">

            {/* Section Header */}
            <FadeUp>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                  <Flame size={13} className="text-amber-500" />
                  <span>Excellence in Vocational & IT Education</span>
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mt-3.5 tracking-tight">
                  {features.sectionTitle}
                </h2>
                <p className="text-slate-600 text-sm mt-2 font-normal">
                  {features.sectionSubtitle}
                </p>
              </div>
            </FadeUp>

            {/* Feature Cards Grid */}
            <StaggerContainer
              staggerDelay={0.07}
              className={`grid gap-6 ${visibleFeatures.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                visibleFeatures.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  visibleFeatures.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}
            >
              {visibleFeatures.map((item: FeatureItem, idx: number) => {
                const styles = getThemeStyles(item.theme, idx);

                return (
                  <StaggerItem key={item.id || idx}>
                    <SpotlightCard className="h-full border-none shadow-none bg-transparent">
                      <motion.div
                        whileHover={{ y: -6, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`${styles.cardBg} ${styles.border} p-7 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group h-full`}
                      >
                        {/* Card Watermark Number */}
                        <span className={`absolute -bottom-4 -right-2 text-7xl font-black ${styles.numberColor} select-none pointer-events-none group-hover:scale-110 transition-transform duration-300`}>
                          0{idx + 1}
                        </span>

                        <div>
                          {/* Icon Badge */}
                          <div className={`w-12 h-12 rounded-2xl ${styles.badgeBg} flex items-center justify-center font-black text-base mb-6 shadow-md group-hover:rotate-6 transition-transform duration-300`}>
                            {idx === 0 ? <Laptop size={22} /> :
                              idx === 1 ? <HandCoins size={22} /> :
                                idx === 2 ? <Users size={22} /> : <MapPin size={22} />}
                          </div>

                          <h3 className="font-black text-slate-900 mb-2.5 text-lg group-hover:text-indigo-900 transition-colors">
                            {item.title}
                          </h3>

                          <p className="text-slate-600 text-xs leading-relaxed font-normal">
                            {item.desc}
                          </p>
                        </div>

                        <div className="pt-6 mt-4 border-t border-slate-200/60 flex items-center justify-between">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${styles.tagBg}`}>
                            Core Benefit
                          </span>
                          <ArrowRight size={15} className={`${styles.accent} group-hover:translate-x-1.5 transition-transform duration-300`} />
                        </div>
                      </motion.div>
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* 5. Real-Time Online Verification Gateway */}
      {verification?.enabled !== false && (
        <section id="verify-gateway" className="bg-slate-100/90 py-14 lg:py-20 border-t-2 border-b-2 border-slate-200 relative w-full overflow-hidden">
          <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-4 py-1.5 rounded-full shadow-xs mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Instant Online Portal Authentication
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-medium text-slate-600">Central Sync Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                Real-Time Verification Gateway
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-2xl mx-auto">
                Instantly authenticate Study Centers, Student Records, and Diplomas directly from the centralized database.
              </p>
            </div>

            {/* Mobile Tab Switcher for Responsive 1-Tap Toggle */}
            <div className="md:hidden flex items-center justify-center p-1 bg-slate-200/80 rounded-xl mb-6 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setMobileVerifyTab('center')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mobileVerifyTab === 'center'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => setMobileVerifyTab('student')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mobileVerifyTab === 'student'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setMobileVerifyTab('cert')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mobileVerifyTab === 'cert'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Certificate
              </button>
            </div>

            {/* 3-Column Verification Feature Grid (Desktop: 3-Col, Mobile: Active Tab Card) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              
              {/* Card 1: Center Verification */}
              <div className={`${mobileVerifyTab === 'center' ? 'block' : 'hidden'} md:block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          Center Verification
                        </h3>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                          Study Center
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-normal">
                    Enter official Center Registration / Affiliation Code
                  </p>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyCenter();
                    }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <Building2 size={16} className="text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={centerInput}
                        onChange={(e) => setCenterInput(e.target.value)}
                        placeholder="e.g. CENT001 or 6767"
                        required
                        className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-medium"
                      />
                      {centerInput && (
                        <button
                          type="button"
                          onClick={() => setCenterInput('')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Quick Demo Pill Suggestions */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-400">Try:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCenterInput('CENT001');
                          handleVerifyCenter('CENT001');
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 font-mono text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        CENT001
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCenterInput('6767');
                          handleVerifyCenter('6767');
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 font-mono text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        6767
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={verificationLoading !== null}
                      className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {verificationLoading === 'center' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Verifying Center...</span>
                        </>
                      ) : (
                        <>
                          <Search size={15} />
                          <span>Verify Center</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-blue-600" />
                    <span>Authorized Center Portal</span>
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> 100% Genuine
                  </span>
                </div>
              </div>

              {/* Card 2: Student Verification (Highlighted Hero Card with Warm Amber Theme) */}
              <div className={`${mobileVerifyTab === 'student' ? 'block' : 'hidden'} md:block bg-amber-400 text-slate-950 rounded-2xl border border-amber-500 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
                          Student Verification
                        </h3>
                        <span className="text-[10px] font-bold text-amber-950 bg-amber-300 px-2 py-0.5 rounded-md inline-block">
                          Official Record
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-950 mb-4 font-medium opacity-90">
                    Enter Student Roll No. or Enrollment ID
                  </p>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyStudent();
                    }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <UserCheck size={16} className="text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={studentInput}
                        onChange={(e) => setStudentInput(e.target.value)}
                        placeholder="e.g. EXM-2026-1001 or ROL-10001"
                        required
                        className="w-full bg-white border border-amber-600/40 focus:border-slate-950 focus:ring-2 focus:ring-amber-200 rounded-xl pl-10 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none transition-all font-medium"
                      />
                      {studentInput && (
                        <button
                          type="button"
                          onClick={() => setStudentInput('')}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-800"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Quick Demo Pill Suggestions */}
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-950 font-medium">
                      <span className="opacity-80">Try:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentInput('EXM-2026-1001');
                          handleVerifyStudent('EXM-2026-1001');
                        }}
                        className="px-2 py-0.5 bg-amber-300 hover:bg-slate-950 hover:text-amber-400 font-mono text-slate-950 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        EXM-2026-1001
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentInput('ROL-10001');
                          handleVerifyStudent('ROL-10001');
                        }}
                        className="px-2 py-0.5 bg-amber-300 hover:bg-slate-950 hover:text-amber-400 font-mono text-slate-950 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        ROL-10001
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={verificationLoading !== null}
                      className="w-full mt-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {verificationLoading === 'student' ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-amber-400" />
                          <span>Verifying Record...</span>
                        </>
                      ) : (
                        <>
                          <Search size={15} className="text-amber-400" />
                          <span>Verify Student</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/60 flex items-center justify-between text-[11px] text-amber-950 font-medium">
                  <span className="flex items-center gap-1">
                    <Database size={13} className="text-amber-950" />
                    <span>Centralized Database</span>
                  </span>
                  <span className="text-amber-950 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> 100% Genuine
                  </span>
                </div>
              </div>

              {/* Card 3: Certificate Verification */}
              <div className={`${mobileVerifyTab === 'cert' ? 'block' : 'hidden'} md:block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          Certificate Verification
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          Tamper-Proof
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-normal">
                    Enter Certified Marksheet or Diploma Number
                  </p>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyCert();
                    }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <Award size={16} className="text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={certInput}
                        onChange={(e) => setCertInput(e.target.value)}
                        placeholder="e.g. Certificate / Roll No"
                        required
                        className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl pl-10 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-medium"
                      />
                      {certInput && (
                        <button
                          type="button"
                          onClick={() => setCertInput('')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Quick Demo Pill Suggestions */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-400">Try:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCertInput('EXM-2026-1001');
                          handleVerifyCert('EXM-2026-1001');
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 font-mono text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        EXM-2026-1001
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCertInput('ROL-10002');
                          handleVerifyCert('ROL-10002');
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 font-mono text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        ROL-10002
                      </button>
                    </div>

                    <div className="mt-2">
                      <button
                        type="submit"
                        disabled={verificationLoading !== null}
                        className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                      >
                        {verificationLoading === 'cert' ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Search size={14} />
                            <span>Verify ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <QrCode size={13} className="text-emerald-600" />
                    <span>QR Authenticated</span>
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> 100% Genuine
                  </span>
                </div>
              </div>

            </div>

            {/* Real-time Verification Result Presentation Card */}
            <AnimatePresence>
              {verificationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-8 max-w-3xl mx-auto"
                >
                  {verificationResult.type === 'error' ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm relative">
                      <button
                        onClick={() => setVerificationResult(null)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
                      >
                        <X size={16} />
                      </button>
                      <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center mb-3">
                        <X size={22} strokeWidth={2.5} />
                      </div>
                      <h4 className="text-base font-bold text-red-900 mb-1">
                        Record Verification Unsuccessful
                      </h4>
                      <p className="text-xs text-red-700 max-w-md mx-auto mb-4">
                        {verificationResult.message}
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setVerificationResult(null)}
                          className="px-4 py-2 bg-white border border-red-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Clear & Try Again
                        </button>
                        <Link
                          to="/contact"
                          className="px-4 py-2 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>Contact Support</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  ) : verificationResult.type === 'center' ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Building2 size={24} />
                          </div>
                          <div>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1">
                              <CheckCircle2 size={12} />
                              <span>Authorized Study Center</span>
                            </div>
                            <h4 className="text-lg font-black text-slate-900">
                              {verificationResult.data.name}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={() => setVerificationResult(null)}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Center Code</span>
                          <span className="text-sm font-mono font-bold text-blue-700">
                            {verificationResult.data.center_code || verificationResult.data.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {verificationResult.data.city || 'Main Branch'}{verificationResult.data.state ? `, ${verificationResult.data.state}` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Affiliation Status</span>
                          <span className="text-sm font-bold text-emerald-600">
                            Active & Certified
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <span className="text-xs text-slate-500">
                          Affiliated with Examirror National Skill Development Council
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/branches"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>Browse All Centers</span>
                            <ArrowRight size={13} />
                          </Link>
                          <button
                            onClick={() => setVerificationResult(null)}
                            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Student / Certificate Verification Result */
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3.5">
                          {verificationResult.data.photo_url ? (
                            <img
                              src={verificationResult.data.photo_url.startsWith('http://localhost:3000') ? verificationResult.data.photo_url.replace('http://localhost:3000', '') : verificationResult.data.photo_url}
                              alt={verificationResult.data.firstName}
                              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                              {verificationResult.data.firstName ? verificationResult.data.firstName[0].toUpperCase() : 'S'}
                            </div>
                          )}
                          <div>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1">
                              <CheckCircle2 size={12} />
                              <span>
                                {verificationResult.type === 'certificate' ? 'Official Diploma Authenticated' : 'Student Record Authenticated'}
                              </span>
                            </div>
                            <h4 className="text-xl font-black text-slate-900">
                              {verificationResult.data.firstName} {verificationResult.data.lastName || ''}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={() => setVerificationResult(null)}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Detail Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrollment No</span>
                          <span className="font-mono font-bold text-blue-700">
                            {verificationResult.data.enrollment_no || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll No</span>
                          <span className="font-mono font-bold text-slate-800">
                            {verificationResult.data.roll_no || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Name</span>
                          <span className="font-bold text-slate-900 line-clamp-1">
                            {verificationResult.data.courseName || 'IT Diploma'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Study Center</span>
                          <span className="font-semibold text-slate-700 line-clamp-1">
                            {verificationResult.data.centerName || 'Authorized Center'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadOfficialVerificationPdf(verificationResult.data)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                          >
                            <Download size={14} />
                            <span>Download Official Verification PDF</span>
                          </button>
                          <Link
                            to={`/verify/student/${encodeURIComponent(verificationResult.data.enrollment_no || verificationResult.data.roll_no || verificationResult.data.id)}`}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 border border-slate-200"
                          >
                            <FileText size={14} className="text-blue-600" />
                            <span>Full Details</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setVerificationResult(null)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                          >
                            Close Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>
      )}

      {/* 6. Popular Courses Showcase (Dynamic Slider / Carousel) */}
      {coursesSection?.enabled !== false && allDisplayCourses.length > 0 && (
        <section className="py-20 bg-slate-50/60 border-t border-slate-100 relative w-full overflow-hidden">
          <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">

            {/* Section Header & Slider Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <FadeUp>
                <div className="text-left max-w-2xl">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                    <BookOpen size={13} />
                    <span>Job-Ready Diplomas & Certificates</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-3.5 mb-2 tracking-tight">
                    {coursesSection.sectionTitle || 'Popular Certified Programs'}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm font-normal">
                    {coursesSection.sectionSubtitle || 'Master industry-recognized computer technology, software programming, and professional accounting courses.'}
                  </p>
                </div>
              </FadeUp>

              {/* Slider Navigation Buttons (if multiple course pages) */}
              {totalCoursePages > 1 && (
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <div className="text-xs font-bold text-slate-500 mr-1">
                    <span className="text-indigo-600 font-black">{courseSlidePage + 1}</span> / {totalCoursePages}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCourseAutoSlide(false);
                      setCourseSlidePage((prev) => (prev === 0 ? totalCoursePages - 1 : prev - 1));
                    }}
                    className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center shadow-sm transition-all cursor-pointer active:scale-90"
                    title="Previous Courses"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCourseAutoSlide(false);
                      setCourseSlidePage((prev) => (prev + 1) % totalCoursePages);
                    }}
                    className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center shadow-sm transition-all cursor-pointer active:scale-90"
                    title="Next Courses"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <Link
                    to="/courses"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-colors ml-2 active:scale-95"
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>

            {/* Dynamic Slider Slide Cards */}
            <div className="relative overflow-hidden min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={courseSlidePage}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left"
                >
                  {allDisplayCourses
                    .slice(courseSlidePage * coursesPerPage, (courseSlidePage + 1) * coursesPerPage)
                    .map((cat: any, idx: number) => (
                      <motion.div
                        key={cat.id || idx}
                        whileHover={{ y: -6, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="card-3d rounded-2xl flex flex-col justify-between group relative overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 h-full border border-slate-200"
                      >
                        {/* Course Card Thumbnail Image Header */}
                        <div className="h-36 sm:h-40 w-full relative overflow-hidden bg-slate-900 shrink-0">
                          <img
                            src={cat.image || getCourseFallbackImage(cat.name, cat.tag)}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                          
                          {/* Tag Overlay over Image */}
                          <div className="absolute bottom-2.5 left-3">
                            <span className="text-[10px] font-bold text-white bg-blue-600/95 backdrop-blur-xs px-2.5 py-1 rounded-md inline-block uppercase tracking-wide shadow-xs border border-white/20">
                              {cat.tag}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {cat.name}
                            </h3>
                            <p className="text-slate-500 text-xs mt-2 font-medium flex items-center gap-1.5">
                              <Clock3 size={13} className="text-slate-400" />
                              <span>Duration: {cat.duration}</span>
                            </p>
                          </div>

                          <Link
                            to="/courses"
                            className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900 cursor-pointer"
                          >
                            <span>Explore Curriculum</span>
                            <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination Dots Indicator */}
            {totalCoursePages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: totalCoursePages }).map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => {
                      setIsCourseAutoSlide(false);
                      setCourseSlidePage(dotIdx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${courseSlidePage === dotIdx
                      ? 'w-8 bg-blue-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    title={`Go to Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>
        </section>
      )}

      {/* 7. Recently Joined Centers Showcase (Dynamic Horizontal Slider) */}
      {centersSection?.enabled !== false && (
        <section className="py-14 bg-white border-t-2 border-b-2 border-slate-200 overflow-hidden w-full">
          <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 text-center sm:text-left">
              <FadeUp>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-wide uppercase flex items-center justify-center sm:justify-start gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  <span>{centersSection.sectionTitle || 'Recently Affiliated Study Centers'}</span>
                </h2>
              </FadeUp>

              {/* Slider Arrow Controls */}
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleScrollCenters('left')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 transition-colors cursor-pointer active:scale-90"
                  title="Scroll Left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollCenters('right')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 transition-colors cursor-pointer active:scale-90"
                  title="Scroll Right"
                >
                  <ChevronRight size={16} />
                </button>
                <Link
                  to="/branches"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline ml-2"
                >
                  View All Branches &rarr;
                </Link>
              </div>
            </div>

            {/* Horizontal Slider Track */}
            <div
              ref={centersScrollRef}
              className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Spotlight Center Pill */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="px-5 py-3 bg-blue-50 text-blue-950 font-mono font-bold rounded-xl text-xs sm:text-sm border border-blue-200 shadow-xs flex items-center gap-2.5 shrink-0 cursor-pointer"
                title={`Spotlight Verified Center: ${spotlightCode}`}
              >
                <Sparkles size={16} className="text-blue-600 animate-pulse" />
                <div>
                  <span className="text-blue-600 font-bold uppercase text-[10px] tracking-wider block">Spotlight</span>
                  <span className="text-slate-900 font-bold">{spotlightCode}</span>
                </div>
              </motion.div>

              {/* Dynamic Center Pills */}
              {dynamicRecentCenters.map((center: any, idx: number) => (
                <motion.div
                  key={center.code || idx}
                  whileHover={{ y: -2, scale: 1.03 }}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 text-slate-800 font-mono rounded-xl text-xs shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-2 group"
                  title={`${center.name || 'Examirror Authorized Study Center'} - ${center.city || ''}, ${center.state || ''}`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {center.code}
                    </div>
                    {center.city && (
                      <div className="text-[10px] font-sans font-medium text-slate-400 group-hover:text-slate-600 truncate max-w-[120px]">
                        {center.city}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 8. Light-Themed Enquiry Form & Dynamic Floating Stats Section with Solid 3D Cards */}
      {enquiry?.enabled !== false && (
        <section className="bg-slate-50 py-16 sm:py-20 relative border-b-2 border-slate-200 w-full overflow-hidden">
          <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10 text-center">

            <FadeUp>
              <div className="max-w-3xl mx-auto">
                <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs mb-3">
                  <Users size={13} />
                  <span>Join Our Growing Mission</span>
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                  {enquiry.sectionTitle}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mb-8 font-medium">
                  {enquiry.sectionSubtitle}
                </p>
              </div>
            </FadeUp>

            {/* Quick Enquiry Action Link to /contact */}
            <FadeUp delay={0.1}>
              <div className="max-w-2xl mx-auto mb-14 flex flex-col sm:flex-row gap-3.5 items-center justify-center">
                <Link
                  to="/contact"
                  className="btn-3d-primary w-full sm:w-auto py-3.5 px-8 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={15} />
                  <span>Submit Student / Center Inquiry</span>
                </Link>
                <Link
                  to="/franchise/register"
                  className="btn-3d-white w-full sm:w-auto py-3.5 px-7 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 size={15} className="text-blue-600" />
                  <span>Apply for Study Center</span>
                </Link>
              </div>
            </FadeUp>

            {/* Live Dynamic Stats Highlight Cards with 3D Border */}
            <StaggerContainer
              staggerDelay={0.1}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
            >
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="card-3d p-7 text-center relative overflow-hidden group h-full shadow-md"
                >
                  <Building2 size={36} className="mx-auto text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl sm:text-4xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    <NumberCounter
                      value={publicStats ? `${publicStats.centersCount.toLocaleString('en-IN')}+` : (enquiry.centerCount || '0+')}
                      durationMs={1400}
                    />
                  </div>
                  <div className="font-semibold text-xs text-slate-500 tracking-wider mt-1.5 uppercase">Study Centers Network</div>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="card-3d-emerald p-7 text-center relative overflow-hidden group h-full shadow-md"
                >
                  <Users size={36} className="mx-auto text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl sm:text-4xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    <NumberCounter
                      value={publicStats ? `${publicStats.studentsCount.toLocaleString('en-IN')}+` : (enquiry.studentCount || '0+')}
                      durationMs={1400}
                    />
                  </div>
                  <div className="font-semibold text-xs text-slate-500 tracking-wider mt-1.5 uppercase">Students Enrolled</div>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>

          </div>
        </section>
      )}

      {/* 9. Bottom CTA Ribbon */}
      {cta?.enabled !== false && (
        <section
          style={{
            backgroundColor: theme?.primaryBtnBg || '#4f46e5',
            color: theme?.primaryBtnTextColor || '#ffffff'
          }}
          className="py-16 text-center relative w-full overflow-hidden"
        >
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-4 relative z-10">
            <FadeUp>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                {cta.heading}
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="text-sm font-semibold max-w-xl mx-auto opacity-90">
                {cta.subheading}
              </p>
            </FadeUp>
            <FadeUp delay={0.2} className="pt-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  to={cta.buttonLink || '/contact'}
                  className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-black py-4 px-9 rounded-full shadow-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>{cta.buttonText}</span>
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* Camera QR Scanner Modal */}
      <QrCameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

    </div>
  );
};

export default Home;

