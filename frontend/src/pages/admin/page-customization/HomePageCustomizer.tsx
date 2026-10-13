import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Home as HomeIcon,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Award,
  Users,
  Building2,
  GraduationCap,
  Settings,
  HandCoins,
  MapPin,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Layers,
  Phone,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  Mail,
  FileText,
  Palette,
  Check,
  Upload,
  Image as ImageIcon,
  X,
  Maximize2,
  Minimize2,
  Square,
  Circle,
  Sliders,
  Type,
  Sun,
  Contrast,
  Lock,
  Unlock,
  Move,
  Cloud
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';


export interface StatItem {
  id: string;
  value: string;
  label: string;
  theme: string;
  hidden?: boolean;
}

export interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  theme: string;
  hidden?: boolean;
}

export interface VerificationPortalItem {
  id: string;
  title: string;
  btnText: string;
  link: string;
  iconType: 'building' | 'users' | 'grad';
  hidden?: boolean;
}

export interface CourseCategoryItem {
  id: string;
  name: string;
  tag: string;
  duration: string;
  color: string;
  hidden?: boolean;
}

export const DEFAULT_HOME_SETTINGS = {
  // Color Theme & Typography Customization (Light Mode Default)
  theme: {
    heroTitleColor: '#0f172a',
    heroAccentColor: '#4f46e5',
    heroSubtitleColor: '#475569',
    badgeTextColor: '#4338ca',
    badgeBgColor: '#e0e7ff',
    primaryBtnBg: '#4f46e5',
    primaryBtnTextColor: '#ffffff',
    secondaryBtnBg: '#f8fafc',
    secondaryBtnTextColor: '#0f172a',
    topbarBg: '#0f172a',
    topbarTextColor: '#f8fafc',
    titlebarBg: '#ffffff',
    titlebarTextColor: '#0f172a',
    footerBg: '#0f172a',
    footerTextColor: '#94a3b8'
  },
  // Global Card & Shape Styling
  cardStyle: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadow: 'lg',
    hoverEffect: true
  },
  // 1. Topbar & Brand Header
  topbar: {
    enabled: true,
    phone: '',
    email: 'saurabhcsjnu@gmail.com',
    govNotice: 'Registered by Government of India / ISO 9001:2015 Certified',
    companyTitle: 'EXAMIRROR SKILL DEVELOPMENT & EDUCATION',
    logoText: 'Examirror',
    logoImage: '/assets/logo.png',
    logoStyle: {
      height: 48,
      maxWidth: 220,
      scale: 100,
      borderRadius: 0,
      individualRadius: false,
      radiusTL: 0,
      radiusTR: 0,
      radiusBR: 0,
      radiusBL: 0,
      borderWidth: 0,
      borderColor: '#4f46e5',
      borderStyle: 'solid',
      padding: 0,
      paddingX: 0,
      paddingY: 0,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      backgroundColor: 'transparent',
      shadow: 'none',
      glowColor: '#6366f1',
      opacity: 100,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      invert: false,
      objectFit: 'contain',
      hoverEffect: 'none',
      showTextWithLogo: false,
      textColor: '#0f172a',
      textSize: 18,
      textBold: true
    }
  },
  // 2. Marquee Notice Ticker
  marquee: {
    enabled: true,
    text: 'Admission Open for 2026-2027 Academic Session • Free Center Affiliation • Instant Student Barcode & QR Verification Active • ISO 9001:2015 Certified Curriculum'
  },
  // 3. Hero Section
  hero: {
    enabled: true,
    welcomeBadge: 'Skill Development & Literacy Mission',
    welcomeText: 'Welcome to',
    mainTitle: 'EXAMIRROR SKILL DEVELOPMENT & EDUCATION',
    subtitle: 'We provide free computer franchise registration with best in class portal dashboard, online examination management, and QR verifiable student certifications.',
    primaryBtnText: 'Franchise Registration ≫',
    primaryBtnLink: '/franchise/register',
    secondaryBtnText: 'Explore Courses',
    secondaryBtnLink: '/courses',
    isoBadge: 'REGD. BY GOVT. OF INDIA / AN ISO 9001:2015 CERTIFIED',
    floatingTag1: 'Skill Development Ecosystem',
    floatingTag2: 'Pan-India Recognized',
    heroImage: '',
    heroImageStyle: {
      width: 320,
      height: 320,
      scale: 100,
      borderRadius: 24,
      individualRadius: false,
      radiusTL: 24,
      radiusTR: 24,
      radiusBR: 24,
      radiusBL: 24,
      borderWidth: 2,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      padding: 12,
      paddingX: 12,
      paddingY: 12,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      backgroundColor: '#ffffff',
      shadow: '2xl',
      glowColor: '#6366f1',
      opacity: 100,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      invert: false,
      objectFit: 'contain',
      floatingAnimation: true,
      showBadges: true,
      alignment: 'center',
      hoverEffect: 'none'
    }
  },


  // 4. Impact Counters (Dynamic Cards)
  stats: {
    enabled: true,
    items: [
      { id: 's1', value: '25,000+', label: 'Students Certified', theme: 'indigo', hidden: false },
      { id: 's2', value: '350+', label: 'Authorized Study Centers', theme: 'emerald', hidden: false },
      { id: 's3', value: '40+', label: 'Vocational & IT Courses', theme: 'amber', hidden: false },
      { id: 's4', value: '98%', label: 'Career & Practical Success Rate', theme: 'purple', hidden: false }
    ] as StatItem[]
  },
  // 5. Core Feature Cards (Dynamic Cards)
  features: {
    enabled: true,
    sectionTitle: 'WHY CHOOSE EXAMIRROR',
    sectionSubtitle: 'Empowering students and skill center directors with cutting-edge academic infrastructure.',
    items: [
      {
        id: 'f1',
        title: 'Best Computer Tools & Labs',
        desc: 'Curriculum designed with industry-standard software tools and hands-on computer lab training.',
        theme: 'green',
        hidden: false
      },
      {
        id: 'f2',
        title: 'Affordable Fee Structure',
        desc: 'Nominal fees ensuring quality computer education reaches students across all rural & urban regions.',
        theme: 'orange',
        hidden: false
      },
      {
        id: 'f3',
        title: 'Workshops from IT Experts',
        desc: 'Regular seminars, webinars, and expert mentorship sessions to boost real-world workplace readiness.',
        theme: 'blue',
        hidden: false
      },
      {
        id: 'f4',
        title: 'Centers Across India',
        desc: 'Wide network of affiliated centers equipped with modern infrastructure and central online examination support.',
        theme: 'purple',
        hidden: false
      }
    ] as FeatureItem[]
  },
  // 6. Online Verification Gateways (Dynamic Cards)
  verification: {
    enabled: true,
    sectionTitle: 'ONLINE VERIFICATION GATEWAY',
    sectionSubtitle: 'Instant transparent validation of study centers, student records, and certificate credentials.',
    portals: [
      { id: 'v1', title: 'Study Center Authenticity', btnText: 'Verify Center', link: '/verify/center', iconType: 'building', hidden: false },
      { id: 'v2', title: 'Student Enrollment Status', btnText: 'Verify Student', link: '/verify/student', iconType: 'users', hidden: false },
      { id: 'v3', title: 'Certificate & Marksheet', btnText: 'Verify Certificate', link: '/verify/certificate', iconType: 'grad', hidden: false }
    ] as VerificationPortalItem[]
  },
  // 7. Popular Course Categories (Dynamic Cards)
  coursesSection: {
    enabled: true,
    sectionTitle: 'EXPLORE POPULAR COURSE CATEGORIES',
    sectionSubtitle: 'Industry-oriented diploma and certificate programs with hands-on computer training.',
    categories: [
      { id: 'c1', name: 'COMPUTER APPLICATIONS', tag: 'ADCA / DCA / PGDCA', duration: '6 - 12 Months', color: 'blue', hidden: false },
      { id: 'c2', name: 'HARDWARE & NETWORKING', tag: 'DIT / IT Support', duration: '6 Months', color: 'teal', hidden: false },
      { id: 'c3', name: 'ACCOUNTING & TALLY PRIME', tag: 'GST & Financial Accounting', duration: '3 - 6 Months', color: 'indigo', hidden: false },
      { id: 'c4', name: 'VOCATIONAL & SKILL DEV', tag: 'Stitching / Mobile Tech', duration: '3 - 6 Months', color: 'purple', hidden: false }
    ] as CourseCategoryItem[]
  },
  // 8. Study Centers Showcase
  centersSection: {
    enabled: true,
    sectionTitle: 'RECENTLY AFFILIATED STUDY CENTERS',
    featuredCode: 'EXAMc2026-175',
    recentCodes: ['EXAMc2026-188', 'EXAMc2026-186', 'EXAMc2026-185', 'EXAMc2026-184', 'EXAMc2026-183']
  },
  // 9. Quick Enquiry & Floating Stats
  enquiry: {
    enabled: true,
    sectionTitle: 'QUICK ADMISSION & FRANCHISE ENQUIRY',
    sectionSubtitle: 'Get in touch directly with our desk for admissions or center setup.',
    buttonText: 'Submit Inquiry',
    centerCount: '350+',
    studentCount: '25,000+'
  },
  // 10. Bottom CTA Ribbon
  cta: {
    enabled: true,
    heading: 'Start Your Authorized Computer Training Center Today',
    subheading: 'Join India\'s leading vocational education network with zero franchise fee.',
    buttonText: 'Apply For Study Center',
    buttonLink: '/contact'
  },
  // 11. Footer & Contact Details
  footer: {
    enabled: true,
    companyName: 'EXAMIRROR SKILL DEVELOPMENT',
    description: 'We provide free computer franchise registration with best in class dashboard, examination management, and student certification support.',
    phone: '',
    email: 'saurabhcsjnu@gmail.com',
    address: 'Gali no4, near K-14, kankarbagh, Sampatchak, Patna, Bihar- 800020',
    copyright: '© 2026 :: Examirror'
  }
};

const PRESET_COLOR_PALETTES = [
  {
    name: 'Royal Indigo (Default)',
    theme: {
      heroTitleColor: '#0f172a',
      heroAccentColor: '#4f46e5',
      heroSubtitleColor: '#475569',
      badgeTextColor: '#4338ca',
      badgeBgColor: '#e0e7ff',
      primaryBtnBg: '#4f46e5',
      primaryBtnTextColor: '#ffffff',
      secondaryBtnBg: '#f8fafc',
      secondaryBtnTextColor: '#0f172a',
      topbarBg: '#0f172a',
      topbarTextColor: '#f8fafc',
      titlebarBg: '#ffffff',
      titlebarTextColor: '#0f172a',
      footerBg: '#0f172a',
      footerTextColor: '#94a3b8'
    }
  },
  {
    name: 'Emerald Prestige (Green)',
    theme: {
      heroTitleColor: '#064e3b',
      heroAccentColor: '#059669',
      heroSubtitleColor: '#334155',
      badgeTextColor: '#065f46',
      badgeBgColor: '#d1fae5',
      primaryBtnBg: '#059669',
      primaryBtnTextColor: '#ffffff',
      secondaryBtnBg: '#f0fdf4',
      secondaryBtnTextColor: '#064e3b',
      topbarBg: '#064e3b',
      topbarTextColor: '#f0fdf4',
      titlebarBg: '#ffffff',
      titlebarTextColor: '#064e3b',
      footerBg: '#064e3b',
      footerTextColor: '#a7f3d0'
    }
  },
  {
    name: 'Ocean Cyan & Navy',
    theme: {
      heroTitleColor: '#0c4a6e',
      heroAccentColor: '#0284c7',
      heroSubtitleColor: '#475569',
      badgeTextColor: '#0369a1',
      badgeBgColor: '#e0f2fe',
      primaryBtnBg: '#0284c7',
      primaryBtnTextColor: '#ffffff',
      secondaryBtnBg: '#f0f9ff',
      secondaryBtnTextColor: '#0c4a6e',
      topbarBg: '#0c4a6e',
      topbarTextColor: '#f0f9ff',
      titlebarBg: '#ffffff',
      titlebarTextColor: '#0c4a6e',
      footerBg: '#0c4a6e',
      footerTextColor: '#bae6fd'
    }
  },
  {
    name: 'Sunset Crimson & Amber',
    theme: {
      heroTitleColor: '#881337',
      heroAccentColor: '#e11d48',
      heroSubtitleColor: '#475569',
      badgeTextColor: '#9f1239',
      badgeBgColor: '#ffe4e6',
      primaryBtnBg: '#e11d48',
      primaryBtnTextColor: '#ffffff',
      secondaryBtnBg: '#fff1f2',
      secondaryBtnTextColor: '#881337',
      topbarBg: '#881337',
      topbarTextColor: '#fff1f2',
      titlebarBg: '#ffffff',
      titlebarTextColor: '#881337',
      footerBg: '#881337',
      footerTextColor: '#fecdd3'
    }
  },
  {
    name: 'Minimal Black & Gold',
    theme: {
      heroTitleColor: '#000000',
      heroAccentColor: '#d97706',
      heroSubtitleColor: '#3f3f46',
      badgeTextColor: '#92400e',
      badgeBgColor: '#fef3c7',
      primaryBtnBg: '#18181b',
      primaryBtnTextColor: '#fbbf24',
      secondaryBtnBg: '#f4f4f5',
      secondaryBtnTextColor: '#18181b',
      topbarBg: '#18181b',
      topbarTextColor: '#f4f4f5',
      titlebarBg: '#ffffff',
      titlebarTextColor: '#18181b',
      footerBg: '#18181b',
      footerTextColor: '#a1a1aa'
    }
  }
];

export const computeImageStyles = (styleObj: any, scaleFactor: number = 1): React.CSSProperties => {
  if (!styleObj) return {};

  const individualRadius = styleObj.individualRadius;
  const radiusTL = (styleObj.radiusTL ?? styleObj.borderRadius ?? 0) * scaleFactor;
  const radiusTR = (styleObj.radiusTR ?? styleObj.borderRadius ?? 0) * scaleFactor;
  const radiusBR = (styleObj.radiusBR ?? styleObj.borderRadius ?? 0) * scaleFactor;
  const radiusBL = (styleObj.radiusBL ?? styleObj.borderRadius ?? 0) * scaleFactor;
  const borderRadius = individualRadius
    ? `${radiusTL}px ${radiusTR}px ${radiusBR}px ${radiusBL}px`
    : `${(styleObj.borderRadius ?? 0) * scaleFactor}px`;

  const padX = (styleObj.paddingX ?? styleObj.padding ?? 0) * scaleFactor;
  const padY = (styleObj.paddingY ?? styleObj.padding ?? 0) * scaleFactor;
  const padding = `${padY}px ${padX}px`;

  const bWidth = (styleObj.borderWidth ?? 0) * scaleFactor;
  const bColor = styleObj.borderColor || '#4f46e5';
  const bStyle = styleObj.borderStyle || 'solid';

  const rot = styleObj.rotation ?? 0;
  const scl = (styleObj.scale ?? 100) / 100;
  const flpH = styleObj.flipH ? -1 : 1;
  const flpV = styleObj.flipV ? -1 : 1;
  const offX = (styleObj.offsetX ?? 0) * scaleFactor;
  const offY = (styleObj.offsetY ?? 0) * scaleFactor;

  const transform = `translate(${offX}px, ${offY}px) rotate(${rot}deg) scale(${scl * flpH}, ${scl * flpV})`;

  const opacity = (styleObj.opacity ?? 100) / 100;
  const brightness = styleObj.brightness ?? 100;
  const contrast = styleObj.contrast ?? 100;
  const grayscale = styleObj.grayscale ?? 0;
  const invert = styleObj.invert ? 1 : 0;

  let filterStr = `opacity(${opacity})`;
  if (brightness !== 100) filterStr += ` brightness(${brightness}%)`;
  if (contrast !== 100) filterStr += ` contrast(${contrast}%)`;
  if (grayscale > 0) filterStr += ` grayscale(${grayscale}%)`;
  if (invert > 0) filterStr += ` invert(1)`;

  const shadowType = styleObj.shadow || 'none';
  const glowCol = styleObj.glowColor || '#6366f1';
  let boxShadow = 'none';
  if (shadowType === 'sm') boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)';
  else if (shadowType === 'md') boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
  else if (shadowType === 'lg') boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
  else if (shadowType === 'xl') boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
  else if (shadowType === '2xl') boxShadow = '0 25px 50px -12px rgba(0,0,0,0.25)';
  else if (shadowType === 'glow') boxShadow = `0 0 35px ${glowCol}50, 0 10px 25px -5px rgba(0,0,0,0.1)`;
  else if (shadowType === 'inner') boxShadow = 'inset 0 2px 6px 0 rgba(0,0,0,0.2)';

  return {
    borderRadius,
    padding,
    borderWidth: `${bWidth}px`,
    borderColor: bColor,
    borderStyle: bStyle,
    backgroundColor: styleObj.backgroundColor || 'transparent',
    transform,
    filter: filterStr,
    boxShadow,
    objectFit: (styleObj.objectFit as any) || 'contain',
    display: 'inline-block'
  };
};

const HomePageCustomizer = () => {
  const [data, setData] = useState(DEFAULT_HOME_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Customizer Tabs & Device View State
  const [activeSection, setActiveSection] = useState<'colors' | 'topbar' | 'hero' | 'stats' | 'features' | 'verification' | 'courses' | 'centers' | 'enquiry' | 'cta' | 'footer'>('colors');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  // Image Upload Handling
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleImageUpload = async (file: File, type: 'logo' = 'logo') => {
    setUploadingLogo(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setData(prev => ({
          ...prev,
          topbar: {
            ...(prev.topbar || DEFAULT_HOME_SETTINGS.topbar),
            logoImage: res.data.url,
            logoStyle: {
              ...(prev.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
              invert: false,
              backgroundColor: 'transparent',
              grayscale: 0
            }
          }
        }));
        setToast({ type: 'success', text: 'Logo uploaded successfully!' });
      }
    } catch (err) {
      // Fallback: convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64 = e.target.result as string;
          setData(prev => ({
            ...prev,
            topbar: {
              ...(prev.topbar || DEFAULT_HOME_SETTINGS.topbar),
              logoImage: base64,
              logoStyle: {
                ...(prev.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                invert: false,
                backgroundColor: 'transparent',
                grayscale: 0
              }
            }
          }));
          setToast({ type: 'success', text: 'Logo loaded!' });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
    }
  };

  const fetchSettings = async () => {

    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/v1/settings/home');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;

        let statsItems: StatItem[] = DEFAULT_HOME_SETTINGS.stats.items;
        if (Array.isArray(d.stats?.items) && d.stats.items.length > 0) {
          statsItems = d.stats.items;
        }

        let featureItems: FeatureItem[] = DEFAULT_HOME_SETTINGS.features.items;
        if (Array.isArray(d.features?.items) && d.features.items.length > 0) {
          featureItems = d.features.items;
        }

        let verificationPortals: VerificationPortalItem[] = DEFAULT_HOME_SETTINGS.verification.portals;
        if (Array.isArray(d.verification?.portals) && d.verification.portals.length > 0) {
          verificationPortals = d.verification.portals;
        }

        let courseCats: CourseCategoryItem[] = DEFAULT_HOME_SETTINGS.coursesSection.categories;
        if (Array.isArray(d.coursesSection?.categories) && d.coursesSection.categories.length > 0) {
          courseCats = d.coursesSection.categories;
        }

        setData({
          ...DEFAULT_HOME_SETTINGS,
          ...d,
          theme: { ...DEFAULT_HOME_SETTINGS.theme, ...(d.theme || {}) },
          topbar: { ...DEFAULT_HOME_SETTINGS.topbar, ...(d.topbar || {}) },
          marquee: { ...DEFAULT_HOME_SETTINGS.marquee, ...(d.marquee || {}) },
          hero: { ...DEFAULT_HOME_SETTINGS.hero, ...(d.hero || {}) },
          stats: {
            enabled: d.stats?.enabled ?? DEFAULT_HOME_SETTINGS.stats.enabled,
            items: statsItems
          },
          features: {
            enabled: d.features?.enabled ?? DEFAULT_HOME_SETTINGS.features.enabled,
            sectionTitle: d.features?.sectionTitle || DEFAULT_HOME_SETTINGS.features.sectionTitle,
            sectionSubtitle: d.features?.sectionSubtitle || DEFAULT_HOME_SETTINGS.features.sectionSubtitle,
            items: featureItems
          },
          verification: {
            enabled: d.verification?.enabled ?? DEFAULT_HOME_SETTINGS.verification.enabled,
            sectionTitle: d.verification?.sectionTitle || DEFAULT_HOME_SETTINGS.verification.sectionTitle,
            sectionSubtitle: d.verification?.sectionSubtitle || DEFAULT_HOME_SETTINGS.verification.sectionSubtitle,
            portals: verificationPortals
          },
          coursesSection: {
            enabled: d.coursesSection?.enabled ?? DEFAULT_HOME_SETTINGS.coursesSection.enabled,
            sectionTitle: d.coursesSection?.sectionTitle || DEFAULT_HOME_SETTINGS.coursesSection.sectionTitle,
            sectionSubtitle: d.coursesSection?.sectionSubtitle || DEFAULT_HOME_SETTINGS.coursesSection.sectionSubtitle,
            categories: courseCats
          },
          centersSection: {
            ...DEFAULT_HOME_SETTINGS.centersSection,
            ...(d.centersSection || {}),
            recentCodes: (d.centersSection?.recentCodes && d.centersSection.recentCodes.length) ? d.centersSection.recentCodes : DEFAULT_HOME_SETTINGS.centersSection.recentCodes
          },
          enquiry: { ...DEFAULT_HOME_SETTINGS.enquiry, ...(d.enquiry || {}) },
          cta: { ...DEFAULT_HOME_SETTINGS.cta, ...(d.cta || {}) },
          footer: { ...DEFAULT_HOME_SETTINGS.footer, ...(d.footer || {}) }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setToast(null);
      const res = await axios.put('http://localhost:3000/api/v1/settings/home', { data });
      if (res.data?.success) {
        setToast({ type: 'success', text: 'All Home page colors, cards and components saved and published live!' });
        setPreviewKey(k => k + 1);
      } else {
        setToast({ type: 'error', text: 'Failed to update home settings.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Server error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all Home page fields and color styling to factory defaults?')) {
      setData(DEFAULT_HOME_SETTINGS);
      setToast({ type: 'success', text: 'Reset to default presets. Click "Save & Publish Live" to apply.' });
    }
  };

  const applyPalette = (paletteTheme: any) => {
    setData({
      ...data,
      theme: { ...data.theme, ...paletteTheme }
    });
    setToast({ type: 'success', text: 'Preset color palette applied! Click Save to publish.' });
  };

  // Card Handlers
  const handleAddStatCard = () => {
    const newCard: StatItem = {
      id: `stat-${Date.now()}`,
      value: '100+',
      label: 'New Metric',
      theme: 'indigo',
      hidden: false
    };
    setData({
      ...data,
      stats: { ...data.stats, items: [...data.stats.items, newCard] }
    });
  };

  const handleRemoveStatCard = (id: string) => {
    setData({
      ...data,
      stats: { ...data.stats, items: data.stats.items.filter(s => s.id !== id) }
    });
  };

  const handleToggleHideStatCard = (id: string) => {
    setData({
      ...data,
      stats: {
        ...data.stats,
        items: data.stats.items.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s)
      }
    });
  };

  const handleAddFeatureCard = () => {
    const newCard: FeatureItem = {
      id: `feature-${Date.now()}`,
      title: 'New Academy Feature',
      desc: 'Describe this key learning benefit or infrastructure feature here.',
      theme: 'blue',
      hidden: false
    };
    setData({
      ...data,
      features: { ...data.features, items: [...data.features.items, newCard] }
    });
  };

  const handleRemoveFeatureCard = (id: string) => {
    setData({
      ...data,
      features: { ...data.features, items: data.features.items.filter(f => f.id !== id) }
    });
  };

  const handleToggleHideFeatureCard = (id: string) => {
    setData({
      ...data,
      features: {
        ...data.features,
        items: data.features.items.map(f => f.id === id ? { ...f, hidden: !f.hidden } : f)
      }
    });
  };

  const handleAddVerificationPortal = () => {
    const newPortal: VerificationPortalItem = {
      id: `portal-${Date.now()}`,
      title: 'New Verification Gateway',
      btnText: 'Verify Now',
      link: '/verify/student',
      iconType: 'users',
      hidden: false
    };
    setData({
      ...data,
      verification: { ...data.verification, portals: [...data.verification.portals, newPortal] }
    });
  };

  const handleRemoveVerificationPortal = (id: string) => {
    setData({
      ...data,
      verification: { ...data.verification, portals: data.verification.portals.filter(p => p.id !== id) }
    });
  };

  const handleToggleHideVerificationPortal = (id: string) => {
    setData({
      ...data,
      verification: {
        ...data.verification,
        portals: data.verification.portals.map(p => p.id === id ? { ...p, hidden: !p.hidden } : p)
      }
    });
  };

  const handleAddCourseCategory = () => {
    const newCat: CourseCategoryItem = {
      id: `course-${Date.now()}`,
      name: 'NEW COURSE CATEGORY',
      tag: 'Certified Diploma',
      duration: '3 - 6 Months',
      color: 'indigo',
      hidden: false
    };
    setData({
      ...data,
      coursesSection: { ...data.coursesSection, categories: [...data.coursesSection.categories, newCat] }
    });
  };

  const handleRemoveCourseCategory = (id: string) => {
    setData({
      ...data,
      coursesSection: { ...data.coursesSection, categories: data.coursesSection.categories.filter(c => c.id !== id) }
    });
  };

  const handleToggleHideCourseCategory = (id: string) => {
    setData({
      ...data,
      coursesSection: {
        ...data.coursesSection,
        categories: data.coursesSection.categories.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c)
      }
    });
  };

  const SECTIONS_LIST = [
    { id: 'colors' as const, label: '🎨 Colors & Palette', icon: Palette, hint: 'Pick text, headline & button colors' },
    { id: 'topbar' as const, label: 'Top Bar & Brand', icon: Building2, hint: 'Helpline, email, logo & company title' },
    { id: 'hero' as const, label: 'Hero & Marquee', icon: Sparkles, hint: 'Main headline, badge & welcome copy' },
    { id: 'stats' as const, label: 'Impact Counters', icon: Users, hint: 'Add, remove & hide counter cards' },
    { id: 'features' as const, label: 'Key Feature Cards', icon: Award, hint: 'Add, remove & hide feature cards' },
    { id: 'verification' as const, label: 'Verification Hub', icon: ShieldCheck, hint: 'Add, remove & hide verification cards' },
    { id: 'courses' as const, label: 'Course Categories', icon: BookOpen, hint: 'Add, remove & hide course cards' },
    { id: 'centers' as const, label: 'Centers Showcase', icon: Building2, hint: 'Recently joined study center badges' },
    { id: 'enquiry' as const, label: 'Lead Enquiry & Form', icon: HelpCircle, hint: 'Interactive inquiry banner & stats' },
    { id: 'cta' as const, label: 'Bottom Ribbon CTA', icon: HomeIcon, hint: 'Franchise conversion callout' },
    { id: 'footer' as const, label: 'Footer & Address', icon: FileText, hint: 'Footer bio, address, email & copyright' },
  ];

  const currentTheme = data.theme || DEFAULT_HOME_SETTINGS.theme;

  return (
    <div className="space-y-4 text-xs text-slate-800 font-sans">

      {/* Top Action & Device Switcher Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-2 z-30">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-black text-sm text-slate-900 tracking-tight">
              Home Page Visual Customizer
            </span>
          </div>

          <span className="hidden sm:inline-block h-4 w-px bg-slate-200"></span>

          {/* Device Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${previewDevice === 'desktop' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Desktop View"
            >
              <Monitor size={14} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${previewDevice === 'tablet' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Tablet View (768px)"
            >
              <Tablet size={14} />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${previewDevice === 'mobile' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Mobile View (390px)"
            >
              <Smartphone size={14} />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to factory preset values"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Save size={15} />
            <span>{saving ? 'Publishing Live...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`p-3.5 rounded-xl flex items-center justify-between border shadow-sm transition-all ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
          <div className="flex items-center gap-2 font-bold text-xs">
            {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* SIDE-BY-SIDE SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN: Customizer Controls (5 Columns on Desktop) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Section Selector Strip */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {SECTIONS_LIST.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                >
                  <Icon size={13} className={isActive ? 'text-yellow-300' : 'text-slate-500'} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Editors Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 max-h-[calc(100vh-230px)] overflow-y-auto">

            {/* COLOR THEME & PALETTES TAB */}
            {activeSection === 'colors' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Palette size={16} className="text-indigo-600" />
                    <span>Color Palette & Text Styling Customizer</span>
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Live Styling</span>
                </div>

                {/* Preset Theme Quick Select */}
                <div>
                  <label className="block font-bold text-slate-700 mb-2">Instant Preset Palettes:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_COLOR_PALETTES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPalette(p.theme)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{p.name}</div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.theme.heroAccentColor }}></span>
                            <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.theme.topbarBg }}></span>
                            <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: p.theme.primaryBtnBg }}></span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-slate-800">Customize Specific Text & Button Colors:</h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Hero Title Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Main Headline Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTheme.heroTitleColor || '#0f172a'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, heroTitleColor: e.target.value } })}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentTheme.heroTitleColor || '#0f172a'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, heroTitleColor: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Hero Accent Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Headline Highlight Accent</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTheme.heroAccentColor || '#4f46e5'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, heroAccentColor: e.target.value } })}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentTheme.heroAccentColor || '#4f46e5'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, heroAccentColor: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Primary Button Background */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Button Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTheme.primaryBtnBg || '#4f46e5'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, primaryBtnBg: e.target.value } })}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentTheme.primaryBtnBg || '#4f46e5'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, primaryBtnBg: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Primary Button Text Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Button Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTheme.primaryBtnTextColor || '#ffffff'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, primaryBtnTextColor: e.target.value } })}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentTheme.primaryBtnTextColor || '#ffffff'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, primaryBtnTextColor: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Top Bar Background */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Top Bar Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTheme.topbarBg || '#0f172a'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, topbarBg: e.target.value } })}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentTheme.topbarBg || '#0f172a'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, topbarBg: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Top Bar Text Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Top Bar Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTheme.topbarTextColor || '#ffffff'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, topbarTextColor: e.target.value } })}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={currentTheme.topbarTextColor || '#ffffff'}
                          onChange={(e) => setData({ ...data, theme: { ...currentTheme, topbarTextColor: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* TOPBAR & COMPANY TITLE EDITOR */}
            {activeSection === 'topbar' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    <span>Top Bar, Phone, Email & Brand Header</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.topbar?.enabled ?? true}
                      onChange={(e) => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.topbar?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Top Bar Phone Number</label>
                    <input
                      type="text"
                      value={data.topbar?.phone || ''}
                      onChange={(e) => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), phone: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Top Bar Email Address</label>
                    <input
                      type="email"
                      value={data.topbar?.email || ''}
                      onChange={(e) => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), email: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Top Bar Right Gov Registration Notice</label>
                  <input
                    type="text"
                    value={data.topbar?.govNotice || ''}
                    onChange={(e) => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), govNotice: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Academy Name</label>
                  <input
                    type="text"
                    value={data.topbar?.companyTitle || ''}
                    onChange={(e) => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), companyTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-black text-indigo-950 text-xs"
                  />
                </div>

                {/* Logo Image & Text Uploader */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-indigo-600" />
                      <span>Website Navbar Logo Image</span>
                    </label>
                    {data.topbar?.logoImage && (
                      <button
                        type="button"
                        onClick={() => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), logoImage: '' } })}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Remove Image</span>
                      </button>
                    )}
                  </div>

                  {data.topbar?.logoImage ? (
                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <img
                        src={data.topbar.logoImage}
                        alt="Navbar Logo"
                        className="h-12 max-w-[160px] object-contain rounded-lg border border-slate-100 p-1 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>Custom Logo Active</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{data.topbar.logoImage}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
                    >
                      <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                      <div className="text-xs font-bold text-slate-700">Click or Drag to Upload Logo</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG or WebP (Transparent Recommended)</div>
                    </div>
                  )}

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo');
                    }}
                  />

                  {/* Advanced Logo Customization Controls */}
                  {data.topbar?.logoImage && (
                    <div className="pt-3 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <SlidersHorizontal size={13} className="text-indigo-600" />
                          <span>Logo Design & Geometry Studio</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                          Pro Studio
                        </span>
                      </div>

                      {/* 1. Quick Shape Presets Toolbar */}
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1-Click Shape Presets</span>
                          <button
                            type="button"
                            onClick={() => setData({
                              ...data,
                              topbar: {
                                ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                logoStyle: {
                                  ...(DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                  ...(data.topbar?.logoStyle || {}),
                                  height: data.topbar?.logoStyle?.height ?? 48,
                                  maxWidth: data.topbar?.logoStyle?.maxWidth ?? 200,
                                  scale: 100,
                                  borderRadius: 0,
                                  individualRadius: false,
                                  radiusTL: 0,
                                  radiusTR: 0,
                                  radiusBR: 0,
                                  radiusBL: 0,
                                  borderWidth: 0,
                                  borderColor: '#4f46e5',
                                  borderStyle: 'solid',
                                  padding: 0,
                                  paddingX: 0,
                                  paddingY: 0,
                                  offsetX: 0,
                                  offsetY: 0,
                                  rotation: 0,
                                  flipH: false,
                                  flipV: false,
                                  backgroundColor: 'transparent',
                                  shadow: 'none',
                                  glowColor: '#6366f1',
                                  opacity: 100,
                                  brightness: 100,
                                  contrast: 100,
                                  grayscale: 0,
                                  invert: false,
                                  objectFit: 'contain',
                                  hoverEffect: 'none',
                                  showTextWithLogo: data.topbar?.logoStyle?.showTextWithLogo ?? false
                                }
                              }
                            })}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw size={10} /> Reset to Original Image
                          </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {[
                            { name: 'Original', br: 0, bw: 0, bs: 'solid', bg: 'transparent', ind: false, isClean: true },
                            { name: 'Rounded', br: 12, bw: 1, bs: 'solid', bc: '#e2e8f0', bg: '#ffffff', ind: false },
                            { name: 'Squircle', br: 24, bw: 1, bs: 'solid', bc: '#e2e8f0', bg: '#ffffff', ind: false },
                            { name: 'Pill', br: 999, bw: 1, bs: 'solid', bc: '#cbd5e1', bg: '#ffffff', ind: false },
                            { name: 'Circle', br: 999, bw: 2, bs: 'solid', bc: '#4f46e5', bg: '#ffffff', ind: false },
                            { name: 'Luxury', br: 14, bw: 2, bs: 'double', bc: '#f59e0b', bg: '#ffffff', ind: false },
                            { name: 'Glass', br: 16, bw: 1, bs: 'solid', bc: '#818cf8', bg: '#ffffff', sh: 'glow', ind: false },
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    borderRadius: preset.br,
                                    individualRadius: preset.ind,
                                    radiusTL: preset.br,
                                    radiusTR: preset.br,
                                    radiusBR: preset.br,
                                    radiusBL: preset.br,
                                    borderWidth: preset.bw,
                                    borderStyle: preset.bs as any,
                                    borderColor: preset.bc || data.topbar?.logoStyle?.borderColor || '#4f46e5',
                                    backgroundColor: preset.bg,
                                    shadow: (preset.sh as any) || (preset.isClean ? 'none' : (data.topbar?.logoStyle?.shadow || 'none')),
                                    ...(preset.isClean ? {
                                      invert: false,
                                      grayscale: 0,
                                      brightness: 100,
                                      contrast: 100,
                                      opacity: 100,
                                      padding: 0,
                                      paddingX: 0,
                                      paddingY: 0,
                                      rotation: 0,
                                      offsetX: 0,
                                      offsetY: 0,
                                      flipH: false,
                                      flipV: false
                                    } : {})
                                  }
                                }
                              })}
                              className="px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Sizing, Dimensions & Scale */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span className="flex items-center gap-1.5"><Maximize2 size={13} className="text-indigo-600" /> Dimensions & Sizing</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Height</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.height ?? 48}px</span>
                            </div>
                            <input
                              type="range"
                              min="16"
                              max="140"
                              value={data.topbar?.logoStyle?.height ?? 48}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    height: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Max Width</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.maxWidth ?? 200}px</span>
                            </div>
                            <input
                              type="range"
                              min="40"
                              max="450"
                              value={data.topbar?.logoStyle?.maxWidth ?? 200}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    maxWidth: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Scale Zoom</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.scale ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="180"
                              value={data.topbar?.logoStyle?.scale ?? 100}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    scale: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Object Fit Mode</label>
                          <select
                            value={data.topbar?.logoStyle?.objectFit || 'contain'}
                            onChange={(e) => setData({
                              ...data,
                              topbar: {
                                ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                logoStyle: {
                                  ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                  objectFit: e.target.value as any
                                }
                              }
                            })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                          >
                            <option value="contain">Contain (Preserve aspect ratio cleanly)</option>
                            <option value="cover">Cover (Fill exact box dimensions)</option>
                            <option value="fill">Fill / Stretch</option>
                            <option value="scale-down">Scale Down (Only shrink if too large)</option>
                          </select>
                        </div>
                      </div>

                      {/* 3. Corner Radius with 4 Independent Corners Switcher */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <Square size={13} className="text-indigo-600" /> Corner Rounding & Curvature
                          </span>
                          <button
                            type="button"
                            onClick={() => setData({
                              ...data,
                              topbar: {
                                ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                logoStyle: {
                                  ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                  individualRadius: !data.topbar?.logoStyle?.individualRadius
                                }
                              }
                            })}
                            className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer"
                          >
                            {data.topbar?.logoStyle?.individualRadius ? <Unlock size={11} /> : <Lock size={11} />}
                            <span>{data.topbar?.logoStyle?.individualRadius ? '4 Separate Corners' : 'Unified Rounding'}</span>
                          </button>
                        </div>

                        {!data.topbar?.logoStyle?.individualRadius ? (
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>All Corners Radius</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.borderRadius ?? 12}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="64"
                              value={data.topbar?.logoStyle?.borderRadius ?? 12}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    borderRadius: Number(e.target.value),
                                    radiusTL: Number(e.target.value),
                                    radiusTR: Number(e.target.value),
                                    radiusBR: Number(e.target.value),
                                    radiusBL: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                <span>Top Left</span>
                                <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.radiusTL ?? data.topbar?.logoStyle?.borderRadius ?? 12}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="64"
                                value={data.topbar?.logoStyle?.radiusTL ?? data.topbar?.logoStyle?.borderRadius ?? 12}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      radiusTL: Number(e.target.value)
                                    }
                                  }
                                })}
                                className="w-full accent-indigo-600"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                <span>Top Right</span>
                                <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.radiusTR ?? data.topbar?.logoStyle?.borderRadius ?? 12}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="64"
                                value={data.topbar?.logoStyle?.radiusTR ?? data.topbar?.logoStyle?.borderRadius ?? 12}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      radiusTR: Number(e.target.value)
                                    }
                                  }
                                })}
                                className="w-full accent-indigo-600"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                <span>Bottom Right</span>
                                <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.radiusBR ?? data.topbar?.logoStyle?.borderRadius ?? 12}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="64"
                                value={data.topbar?.logoStyle?.radiusBR ?? data.topbar?.logoStyle?.borderRadius ?? 12}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      radiusBR: Number(e.target.value)
                                    }
                                  }
                                })}
                                className="w-full accent-indigo-600"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                <span>Bottom Left</span>
                                <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.radiusBL ?? data.topbar?.logoStyle?.borderRadius ?? 12}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="64"
                                value={data.topbar?.logoStyle?.radiusBL ?? data.topbar?.logoStyle?.borderRadius ?? 12}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      radiusBL: Number(e.target.value)
                                    }
                                  }
                                })}
                                className="w-full accent-indigo-600"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Borders & Stroke Framing */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Sliders size={13} className="text-indigo-600" /> Border Framing & Styling
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Border Width</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.borderWidth ?? 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="12"
                              value={data.topbar?.logoStyle?.borderWidth ?? 0}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    borderWidth: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Border Style</label>
                            <select
                              value={data.topbar?.logoStyle?.borderStyle || 'solid'}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    borderStyle: e.target.value as any
                                  }
                                }
                              })}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                            >
                              <option value="solid">Solid Line</option>
                              <option value="dashed">Dashed</option>
                              <option value="dotted">Dotted</option>
                              <option value="double">Double Frame</option>
                              <option value="groove">Groove 3D</option>
                              <option value="ridge">Ridge 3D</option>
                              <option value="none">No Border</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Border Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={data.topbar?.logoStyle?.borderColor || '#4f46e5'}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    borderColor: e.target.value
                                  }
                                }
                              })}
                              className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={data.topbar?.logoStyle?.borderColor || '#4f46e5'}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    borderColor: e.target.value
                                  }
                                }
                              })}
                              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. Padding, Background & Shadows */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Palette size={13} className="text-indigo-600" /> Padding, Background & Shadow
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Padding X (Horizontal)</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.paddingX ?? data.topbar?.logoStyle?.padding ?? 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={data.topbar?.logoStyle?.paddingX ?? data.topbar?.logoStyle?.padding ?? 0}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    paddingX: Number(e.target.value),
                                    padding: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Padding Y (Vertical)</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.paddingY ?? data.topbar?.logoStyle?.padding ?? 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={data.topbar?.logoStyle?.paddingY ?? data.topbar?.logoStyle?.padding ?? 0}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    paddingY: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Background Color</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={data.topbar?.logoStyle?.backgroundColor === 'transparent' ? '#ffffff' : data.topbar?.logoStyle?.backgroundColor || '#ffffff'}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      backgroundColor: e.target.value
                                    }
                                  }
                                })}
                                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                              />
                              <button
                                type="button"
                                onClick={() => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      backgroundColor: data.topbar?.logoStyle?.backgroundColor === 'transparent' ? '#ffffff' : 'transparent'
                                    }
                                  }
                                })}
                                className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border cursor-pointer ${data.topbar?.logoStyle?.backgroundColor === 'transparent'
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                              >
                                {data.topbar?.logoStyle?.backgroundColor === 'transparent' ? 'Transparent' : 'Solid'}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Shadow Elevation</label>
                            <select
                              value={data.topbar?.logoStyle?.shadow || 'none'}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    shadow: e.target.value as any
                                  }
                                }
                              })}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                            >
                              <option value="none">None (Flat)</option>
                              <option value="sm">Subtle (sm)</option>
                              <option value="md">Medium (md)</option>
                              <option value="lg">Elevated (lg)</option>
                              <option value="xl">Deep (xl)</option>
                              <option value="2xl">Ultra 3D (2xl)</option>
                              <option value="glow">Aura Glow</option>
                              <option value="inner">Inner Inset</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 6. Transforms, Rotation & Position Offsets */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <RotateCw size={13} className="text-indigo-600" /> Position, Rotation & Flip
                          </span>
                          <button
                            type="button"
                            onClick={() => setData({
                              ...data,
                              topbar: {
                                ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                logoStyle: {
                                  ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                  rotation: 0,
                                  offsetX: 0,
                                  offsetY: 0,
                                  flipH: false,
                                  flipV: false
                                }
                              }
                            })}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw size={11} /> Reset
                          </button>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Rotation Angle</span>
                            <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.rotation ?? 0}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={data.topbar?.logoStyle?.rotation ?? 0}
                            onChange={(e) => setData({
                              ...data,
                              topbar: {
                                ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                logoStyle: {
                                  ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                  rotation: Number(e.target.value)
                                }
                              }
                            })}
                            className="w-full accent-indigo-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Offset X (Horizontal)</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.offsetX ?? 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="-40"
                              max="40"
                              value={data.topbar?.logoStyle?.offsetX ?? 0}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    offsetX: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Offset Y (Vertical)</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.offsetY ?? 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="-40"
                              max="40"
                              value={data.topbar?.logoStyle?.offsetY ?? 0}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    offsetY: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={data.topbar?.logoStyle?.flipH ?? false}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    flipH: e.target.checked
                                  }
                                }
                              })}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span>Flip Horizontal</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={data.topbar?.logoStyle?.flipV ?? false}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    flipV: e.target.checked
                                  }
                                }
                              })}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span>Flip Vertical</span>
                          </label>
                        </div>
                      </div>

                      {/* 7. Image Filters & Color Grading */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Sun size={13} className="text-indigo-600" /> Image Filters & Color Grading
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Opacity</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.opacity ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="100"
                              value={data.topbar?.logoStyle?.opacity ?? 100}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    opacity: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Brightness</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.brightness ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="150"
                              value={data.topbar?.logoStyle?.brightness ?? 100}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    brightness: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Grayscale</span>
                              <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.grayscale ?? 0}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={data.topbar?.logoStyle?.grayscale ?? 0}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    grayscale: Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          <div className="flex items-center pt-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={data.topbar?.logoStyle?.invert ?? false}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      invert: e.target.checked
                                    }
                                  }
                                })}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <span>Invert Colors (Dark/Light)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* 8. Hover Interactions & Brand Text Display */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-indigo-600" /> Hover Effects & Brand Text
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Hover Animation</label>
                            <select
                              value={data.topbar?.logoStyle?.hoverEffect || 'none'}
                              onChange={(e) => setData({
                                ...data,
                                topbar: {
                                  ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                  logoStyle: {
                                    ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                    hoverEffect: e.target.value as any
                                  }
                                }
                              })}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                            >
                              <option value="none">None (Standard)</option>
                              <option value="zoom">Subtle Zoom (1.08x)</option>
                              <option value="lift">Lift Up (-4px)</option>
                              <option value="glow">Glow Accent</option>
                            </select>
                          </div>

                          <div className="flex items-center pt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={data.topbar?.logoStyle?.showTextWithLogo ?? false}
                                onChange={(e) => setData({
                                  ...data,
                                  topbar: {
                                    ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                    logoStyle: {
                                      ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                      showTextWithLogo: e.target.checked
                                    }
                                  }
                                })}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <span>Show Text Next to Logo</span>
                            </label>
                          </div>
                        </div>

                        {data.topbar?.logoStyle?.showTextWithLogo && (
                          <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-600 mb-1">Brand Text Color</label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={data.topbar?.logoStyle?.textColor || '#0f172a'}
                                    onChange={(e) => setData({
                                      ...data,
                                      topbar: {
                                        ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                        logoStyle: {
                                          ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                          textColor: e.target.value
                                        }
                                      }
                                    })}
                                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={data.topbar?.logoStyle?.textColor || '#0f172a'}
                                    onChange={(e) => setData({
                                      ...data,
                                      topbar: {
                                        ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                        logoStyle: {
                                          ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                          textColor: e.target.value
                                        }
                                      }
                                    })}
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                                  <span>Text Font Size</span>
                                  <span className="font-mono text-indigo-600">{data.topbar?.logoStyle?.textSize ?? 18}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="12"
                                  max="32"
                                  value={data.topbar?.logoStyle?.textSize ?? 18}
                                  onChange={(e) => setData({
                                    ...data,
                                    topbar: {
                                      ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar),
                                      logoStyle: {
                                        ...(data.topbar?.logoStyle || DEFAULT_HOME_SETTINGS.topbar.logoStyle),
                                        textSize: Number(e.target.value)
                                      }
                                    }
                                  })}
                                  className="w-full accent-indigo-600"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">Logo Text Fallback (When no image is uploaded)</label>
                    <input
                      type="text"
                      value={data.topbar?.logoText || ''}
                      onChange={(e) => setData({ ...data, topbar: { ...(data.topbar || DEFAULT_HOME_SETTINGS.topbar), logoText: e.target.value } })}
                      placeholder="e.g. EXAMIRROR"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-mono font-bold text-indigo-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}



            {/* HERO & MARQUEE EDITOR */}
            {activeSection === 'hero' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span>Hero Banner & Marquee Notice</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.hero?.enabled ?? true}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.hero?.enabled ? 'Hero Visible' : 'Hero Hidden'}</span>
                  </label>
                </div>

                {/* Marquee Ticker */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-xs text-amber-950 flex items-center gap-1">
                      <Volume2 size={13} className="text-amber-600" />
                      <span>Top Marquee Notice Bar</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={data.marquee?.enabled ?? true}
                        onChange={(e) => setData({ ...data, marquee: { ...data.marquee, enabled: e.target.checked } })}
                        className="rounded accent-indigo-600"
                      />
                      <span>{data.marquee?.enabled ? 'Show Notice' : 'Hide Notice'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={data.marquee?.text || ''}
                    onChange={(e) => setData({ ...data, marquee: { ...data.marquee, text: e.target.value } })}
                    placeholder="Notice ticker text..."
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tagline</label>
                  <input
                    type="text"
                    value={data.hero.welcomeBadge}
                    onChange={(e) => setData({ ...data, hero: { ...data.hero, welcomeBadge: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Welcome Text</label>
                    <input
                      type="text"
                      value={data.hero.welcomeText}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, welcomeText: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ISO Accreditation Tag</label>
                    <input
                      type="text"
                      value={data.hero.isoBadge}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, isoBadge: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Main Headline / Academy Name</label>
                  <input
                    type="text"
                    value={data.hero.mainTitle}
                    onChange={(e) => setData({ ...data, hero: { ...data.hero, mainTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-black text-indigo-950 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mission / Subtitle Description</label>
                  <textarea
                    rows={3}
                    value={data.hero.subtitle}
                    onChange={(e) => setData({ ...data, hero: { ...data.hero, subtitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary CTA Button</label>
                    <input
                      type="text"
                      value={data.hero.primaryBtnText}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, primaryBtnText: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Button Link</label>
                    <input
                      type="text"
                      value={data.hero.primaryBtnLink}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, primaryBtnLink: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secondary Button</label>
                    <input
                      type="text"
                      value={data.hero.secondaryBtnText}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, secondaryBtnText: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secondary Link</label>
                    <input
                      type="text"
                      value={data.hero.secondaryBtnLink}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, secondaryBtnLink: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                    />
                  </div>
                </div>

                {/* HERO VISUAL LAB IMAGE (S3 CLOUD BACKED) */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-black text-xs text-slate-800">
                        Hero Visual Image (Front Training Lab Photo)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Upload a photo from your computer or paste any URL. Uploaded images are automatically saved to your AWS S3 Bucket.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      <Cloud size={11} /> AWS S3 Synced
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    {/* Image Preview Box */}
                    <div className="w-28 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shrink-0 relative group shadow-xs">
                      <img
                        src={data.hero?.heroImage || data.hero?.image || "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"}
                        alt="Hero Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors">
                          <Upload size={13} />
                          <span>Upload New Hero Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const form = new FormData();
                              form.append('file', file);
                              try {
                                const res = await axios.post('/api/public/upload', form, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                if (res.data?.success && res.data.url) {
                                  setData({
                                    ...data,
                                    hero: {
                                      ...data.hero,
                                      heroImage: res.data.url
                                    }
                                  });
                                }
                              } catch (err: any) {
                                alert('Failed to upload hero image: ' + (err.response?.data?.message || err.message));
                              }
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setData({
                              ...data,
                              hero: {
                                ...data.hero,
                                heroImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
                              }
                            });
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                        >
                          Reset Default
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={data.hero?.heroImage || ''}
                          placeholder="Or paste direct image URL (e.g. /uploads/branding/... or S3 URL)"
                          onChange={(e) => setData({ ...data, hero: { ...data.hero, heroImage: e.target.value } })}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 outline-none focus:border-indigo-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* STATS EDITOR */}
            {activeSection === 'stats' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Users size={16} className="text-emerald-600" />
                    <span>Achievement Counter Cards</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.stats?.enabled ?? true}
                      onChange={(e) => setData({ ...data, stats: { ...data.stats, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.stats?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">Total Stat Cards: {data.stats.items.length}</span>
                  <button
                    type="button"
                    onClick={handleAddStatCard}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Stat Card</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {data.stats.items.map((stat, idx) => {
                    const isHidden = Boolean(stat.hidden);
                    return (
                      <div
                        key={stat.id}
                        className={`p-3.5 rounded-2xl border transition-all ${isHidden
                          ? 'bg-slate-100/80 border-slate-300 opacity-60'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/80">
                          <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Stat Card #{idx + 1}</span>
                            {isHidden && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleHideStatCard(stat.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${isHidden
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }`}
                              title={isHidden ? 'Unhide Card on Home Page' : 'Hide Card on Home Page'}
                            >
                              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveStatCard(stat.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Card"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Number / Count</label>
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => {
                                const newItems = [...data.stats.items];
                                newItems[idx] = { ...newItems[idx], value: e.target.value };
                                setData({ ...data, stats: { ...data.stats, items: newItems } });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-black text-indigo-700 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Label Description</label>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => {
                                const newItems = [...data.stats.items];
                                newItems[idx] = { ...newItems[idx], label: e.target.value };
                                setData({ ...data, stats: { ...data.stats, items: newItems } });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FEATURES EDITOR */}
            {activeSection === 'features' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Award size={16} className="text-purple-600" />
                    <span>Key Feature Proposition Cards</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.features?.enabled ?? true}
                      onChange={(e) => setData({ ...data, features: { ...data.features, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.features?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Main Title</label>
                  <input
                    type="text"
                    value={data.features.sectionTitle}
                    onChange={(e) => setData({ ...data, features: { ...data.features, sectionTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={data.features.sectionSubtitle}
                    onChange={(e) => setData({ ...data, features: { ...data.features, sectionSubtitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500 font-bold">Active Cards: {data.features.items.length}</span>
                  <button
                    type="button"
                    onClick={handleAddFeatureCard}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Feature Card</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {data.features.items.map((item, idx) => {
                    const isHidden = Boolean(item.hidden);
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all ${isHidden
                          ? 'bg-slate-100/80 border-slate-300 opacity-60'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/80">
                          <span className="font-black text-xs text-indigo-700 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Feature Card #{idx + 1}</span>
                            {isHidden && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleHideFeatureCard(item.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${isHidden
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }`}
                              title={isHidden ? 'Unhide Card on Home Page' : 'Hide Card on Home Page'}
                            >
                              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFeatureCard(item.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Card"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Feature Title"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...data.features.items];
                              newItems[idx] = { ...newItems[idx], title: e.target.value };
                              setData({ ...data, features: { ...data.features, items: newItems } });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                          />
                          <textarea
                            rows={2}
                            placeholder="Feature Description"
                            value={item.desc}
                            onChange={(e) => {
                              const newItems = [...data.features.items];
                              newItems[idx] = { ...newItems[idx], desc: e.target.value };
                              setData({ ...data, features: { ...data.features, items: newItems } });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VERIFICATION GATEWAYS */}
            {activeSection === 'verification' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-600" />
                    <span>Verification Gateways Section</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.verification?.enabled ?? true}
                      onChange={(e) => setData({ ...data, verification: { ...data.verification, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.verification?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={data.verification.sectionTitle}
                    onChange={(e) => setData({ ...data, verification: { ...data.verification, sectionTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-black text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={data.verification.sectionSubtitle}
                    onChange={(e) => setData({ ...data, verification: { ...data.verification, sectionSubtitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500 font-bold">Active Portals: {data.verification.portals.length}</span>
                  <button
                    type="button"
                    onClick={handleAddVerificationPortal}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Verification Card</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {data.verification.portals.map((portal, idx) => {
                    const isHidden = Boolean(portal.hidden);
                    return (
                      <div
                        key={portal.id}
                        className={`p-3.5 rounded-2xl border transition-all ${isHidden
                          ? 'bg-slate-100/80 border-slate-300 opacity-60'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/80">
                          <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Portal Card #{idx + 1}</span>
                            {isHidden && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleHideVerificationPortal(portal.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${isHidden
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                }`}
                              title={isHidden ? 'Unhide Card on Home Page' : 'Hide Card on Home Page'}
                            >
                              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveVerificationPortal(portal.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Card"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Card Title</label>
                            <input
                              type="text"
                              value={portal.title}
                              onChange={(e) => {
                                const newPortals = [...data.verification.portals];
                                newPortals[idx] = { ...newPortals[idx], title: e.target.value };
                                setData({ ...data, verification: { ...data.verification, portals: newPortals } });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Button Text</label>
                            <input
                              type="text"
                              value={portal.btnText}
                              onChange={(e) => {
                                const newPortals = [...data.verification.portals];
                                newPortals[idx] = { ...newPortals[idx], btnText: e.target.value };
                                setData({ ...data, verification: { ...data.verification, portals: newPortals } });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Target Link</label>
                            <input
                              type="text"
                              value={portal.link}
                              onChange={(e) => {
                                const newPortals = [...data.verification.portals];
                                newPortals[idx] = { ...newPortals[idx], link: e.target.value };
                                setData({ ...data, verification: { ...data.verification, portals: newPortals } });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COURSE CATEGORIES */}
            {activeSection === 'courses' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" />
                    <span>Popular Course Categories</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.coursesSection?.enabled ?? true}
                      onChange={(e) => setData({ ...data, coursesSection: { ...data.coursesSection, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.coursesSection?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={data.coursesSection.sectionTitle}
                    onChange={(e) => setData({ ...data, coursesSection: { ...data.coursesSection, sectionTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={data.coursesSection.sectionSubtitle}
                    onChange={(e) => setData({ ...data, coursesSection: { ...data.coursesSection, sectionSubtitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500 font-bold">Categories Count: {data.coursesSection.categories.length}</span>
                  <button
                    type="button"
                    onClick={handleAddCourseCategory}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Category Card</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {data.coursesSection.categories.map((cat, idx) => {
                    const isHidden = Boolean(cat.hidden);
                    return (
                      <div
                        key={cat.id}
                        className={`p-3.5 rounded-2xl border transition-all ${isHidden
                          ? 'bg-slate-100/80 border-slate-300 opacity-60'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/80">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Course Card #{idx + 1}</span>
                            {isHidden && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleHideCourseCategory(cat.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${isHidden
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              title={isHidden ? 'Unhide Card on Home Page' : 'Hide Card on Home Page'}
                            >
                              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveCourseCategory(cat.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Card"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Category Name"
                            value={cat.name}
                            onChange={(e) => {
                              const newCats = [...data.coursesSection.categories];
                              newCats[idx] = { ...newCats[idx], name: e.target.value };
                              setData({ ...data, coursesSection: { ...data.coursesSection, categories: newCats } });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Tag e.g. ADCA / DCA"
                              value={cat.tag}
                              onChange={(e) => {
                                const newCats = [...data.coursesSection.categories];
                                newCats[idx] = { ...newCats[idx], tag: e.target.value };
                                setData({ ...data, coursesSection: { ...data.coursesSection, categories: newCats } });
                              }}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Duration e.g. 6-12 Months"
                              value={cat.duration}
                              onChange={(e) => {
                                const newCats = [...data.coursesSection.categories];
                                newCats[idx] = { ...newCats[idx], duration: e.target.value };
                                setData({ ...data, coursesSection: { ...data.coursesSection, categories: newCats } });
                              }}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RECENT CENTERS SHOWCASE */}
            {activeSection === 'centers' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-600" />
                    <span>Joined Study Centers Showcase</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.centersSection?.enabled ?? true}
                      onChange={(e) => setData({ ...data, centersSection: { ...data.centersSection, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.centersSection?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={data.centersSection.sectionTitle}
                    onChange={(e) => setData({ ...data, centersSection: { ...data.centersSection, sectionTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Main Spotlight Center Code</label>
                  <input
                    type="text"
                    value={data.centersSection.featuredCode}
                    onChange={(e) => setData({ ...data, centersSection: { ...data.centersSection, featuredCode: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Affiliated Center Badges (Comma Separated)</label>
                  <input
                    type="text"
                    value={data.centersSection.recentCodes.join(', ')}
                    onChange={(e) => {
                      const codes = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setData({ ...data, centersSection: { ...data.centersSection, recentCodes: codes } });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* ENQUIRY & STATS BANNER */}
            {activeSection === 'enquiry' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <HelpCircle size={16} className="text-yellow-600" />
                    <span>Quick Enquiry & Floating Stats</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.enquiry?.enabled ?? true}
                      onChange={(e) => setData({ ...data, enquiry: { ...data.enquiry, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.enquiry?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Heading</label>
                  <input
                    type="text"
                    value={data.enquiry.sectionTitle}
                    onChange={(e) => setData({ ...data, enquiry: { ...data.enquiry, sectionTitle: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Form Button Label</label>
                  <input
                    type="text"
                    value={data.enquiry.buttonText}
                    onChange={(e) => setData({ ...data, enquiry: { ...data.enquiry, buttonText: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Floating Centers Pill</label>
                    <input
                      type="text"
                      value={data.enquiry.centerCount}
                      onChange={(e) => setData({ ...data, enquiry: { ...data.enquiry, centerCount: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Floating Students Pill</label>
                    <input
                      type="text"
                      value={data.enquiry.studentCount}
                      onChange={(e) => setData({ ...data, enquiry: { ...data.enquiry, studentCount: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM CTA RIBBON */}
            {activeSection === 'cta' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <HomeIcon size={16} className="text-indigo-600" />
                    <span>Bottom Franchise Call-To-Action</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.cta?.enabled ?? true}
                      onChange={(e) => setData({ ...data, cta: { ...data.cta, enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.cta?.enabled ? 'Section Visible' : 'Section Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CTA Headline</label>
                  <input
                    type="text"
                    value={data.cta.heading}
                    onChange={(e) => setData({ ...data, cta: { ...data.cta, heading: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-black text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CTA Subheading</label>
                  <textarea
                    rows={2}
                    value={data.cta.subheading}
                    onChange={(e) => setData({ ...data, cta: { ...data.cta, subheading: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={data.cta.buttonText}
                      onChange={(e) => setData({ ...data, cta: { ...data.cta, buttonText: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      value={data.cta.buttonLink}
                      onChange={(e) => setData({ ...data, cta: { ...data.cta, buttonLink: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER & CONTACT INFO EDITOR */}
            {activeSection === 'footer' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600" />
                    <span>Footer, Bio & Global Contact Information</span>
                  </h3>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={data.footer?.enabled ?? true}
                      onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), enabled: e.target.checked } })}
                      className="rounded accent-indigo-600"
                    />
                    <span>{data.footer?.enabled ? 'Footer Visible' : 'Footer Hidden'}</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Footer Company / Brand Title</label>
                  <input
                    type="text"
                    value={data.footer?.companyName || ''}
                    onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), companyName: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Footer Description / About Blurb</label>
                  <textarea
                    rows={2}
                    value={data.footer?.description || ''}
                    onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), description: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Footer Helpline Phone</label>
                    <input
                      type="text"
                      value={data.footer?.phone || ''}
                      onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), phone: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Footer Email</label>
                    <input
                      type="email"
                      value={data.footer?.email || ''}
                      onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), email: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Campus Address</label>
                  <input
                    type="text"
                    value={data.footer?.address || ''}
                    onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), address: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Copyright Footer Strip</label>
                  <input
                    type="text"
                    value={data.footer?.copyright || ''}
                    onChange={(e) => setData({ ...data, footer: { ...(data.footer || DEFAULT_HOME_SETTINGS.footer), copyright: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-xs font-medium text-slate-600"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Direct Public Page Link */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
            <span className="text-xs text-indigo-950 font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              <span>All updates apply immediately to live public URL & layout.</span>
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Visit /</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>


        {/* RIGHT COLUMN: Interactive Live Device Preview (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800 flex flex-col items-center">

          {/* Mock Browser Frame Header */}
          <div className="w-full bg-slate-800 rounded-2xl px-4 py-2.5 flex items-center justify-between mb-3 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>

            <div className="bg-slate-950 px-6 py-1 rounded-full text-[11px] font-mono font-bold text-slate-400 flex items-center gap-2 max-w-sm truncate border border-slate-700">
              <span className="text-emerald-400">🔒</span>
              <span>https://examirror.edu.in/</span>
              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.2 rounded">LIVE PREVIEW</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <button
                type="button"
                onClick={() => setPreviewKey(k => k + 1)}
                className="p-1 hover:text-white rounded transition-colors cursor-pointer"
                title="Refresh Live Preview Frame"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Dynamic Device Sized Frame in Light Mode */}
          <div
            className={`w-full transition-all duration-300 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-300 max-h-[calc(100vh-210px)] overflow-y-auto ${previewDevice === 'mobile'
              ? 'max-w-[390px] border-4 border-slate-700'
              : previewDevice === 'tablet'
                ? 'max-w-[768px] border-4 border-slate-700'
                : 'max-w-full'
              }`}
          >

            {/* LIVE SIMULATED LIGHT-MODE COMPLETE PUBLIC LAYOUT & HOME PAGE */}
            <div key={previewKey} className="w-full flex flex-col font-sans text-slate-800 bg-white">

              {/* Top Bar Preview */}
              {data.topbar?.enabled !== false && (
                <div
                  style={{ backgroundColor: currentTheme.topbarBg || '#0f172a', color: currentTheme.topbarTextColor || '#ffffff' }}
                  className={`w-full py-2 px-4 text-xs flex justify-between items-center z-10 ${activeSection === 'topbar' || activeSection === 'colors' ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Phone size={11} className="text-blue-400" />
                      <span>{data.topbar?.phone || ''}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail size={11} className="text-blue-400" />
                      <span>{data.topbar?.email || 'saurabhcsjnu@gmail.com'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] opacity-90 hidden sm:block">
                    {data.topbar?.govNotice || 'Registered by Government of India'}
                  </div>
                </div>
              )}

              {/* Navbar Preview */}
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  {data.topbar?.logoImage ? (
                    <div className="flex items-center gap-2.5">
                      <img
                        src={data.topbar.logoImage}
                        alt="Logo"
                        style={{
                          ...computeImageStyles(data.topbar?.logoStyle, 0.75),
                          height: `${(data.topbar?.logoStyle?.height ?? 48) * 0.75}px`,
                          maxWidth: `${(data.topbar?.logoStyle?.maxWidth ?? 200) * 0.75}px`
                        }}
                      />
                      {data.topbar?.logoStyle?.showTextWithLogo && (
                        <span
                          style={{
                            color: data.topbar?.logoStyle?.textColor || '#0f172a',
                            fontSize: `${(data.topbar?.logoStyle?.textSize ?? 16) * 0.75}px`,
                            fontWeight: data.topbar?.logoStyle?.textBold !== false ? 900 : 600
                          }}
                          className="tracking-tight leading-none"
                        >
                          {data.topbar?.logoText || 'Examirror'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center border border-slate-300 px-2.5 py-1 rounded-xl bg-slate-50">
                      <span className="font-black text-lg text-indigo-700 italic tracking-tighter">{data.topbar?.logoText || 'Examirror'}</span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center space-x-4 text-xs font-bold text-slate-700">
                  <span className="text-indigo-600 font-black">HOME</span>
                  <span>ABOUT US</span>
                  <span>COURSES</span>
                  <span>BRANCHES</span>
                  <span>GALLERY</span>
                  <span>CONTACT US</span>
                </div>
              </div>

              {/* Marquee Notice */}
              {data.marquee?.enabled && (
                <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-slate-950 py-2 px-4 text-[11px] font-extrabold overflow-hidden whitespace-nowrap shadow-inner flex items-center gap-2">
                  <span className="bg-slate-950 text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-black shrink-0">
                    Notice
                  </span>
                  <div className="truncate">
                    {data.marquee.text}
                  </div>
                </div>
              )}

              {/* Hero Section in Clean Solid Light Mode */}
              {data.hero?.enabled !== false && (
                <section
                  style={{ backgroundColor: '#ffffff' }}
                  className={`relative overflow-hidden border-b border-slate-200 ${activeSection === 'hero' || activeSection === 'colors' ? 'ring-4 ring-indigo-400/80' : ''} ${previewDevice === 'mobile' ? 'py-8 px-4' : 'py-12 px-8'}`}
                >
                  <div className="max-w-4xl mx-auto text-center lg:text-left grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-4">

                      <div
                        style={{ backgroundColor: currentTheme.badgeBgColor || '#eff6ff', color: currentTheme.badgeTextColor || '#1d4ed8' }}
                        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs border border-blue-200"
                      >
                        <Sparkles size={12} />
                        <span>{data.hero.welcomeBadge}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">{data.hero.welcomeText}</div>
                        <h1
                          style={{ color: currentTheme.heroTitleColor || '#0f172a' }}
                          className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight"
                        >
                          {data.hero.mainTitle}
                        </h1>
                      </div>

                      <p
                        style={{ color: currentTheme.heroSubtitleColor || '#475569' }}
                        className="text-xs leading-relaxed max-w-xl font-medium"
                      >
                        {data.hero.subtitle}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-2.5 justify-center lg:justify-start">
                        <button
                          type="button"
                          style={{ backgroundColor: currentTheme.primaryBtnBg || '#2563eb', color: currentTheme.primaryBtnTextColor || '#ffffff' }}
                          className="font-black px-5 py-2.5 rounded-xl text-xs uppercase shadow-md shadow-blue-200 tracking-wider cursor-pointer"
                        >
                          {data.hero.primaryBtnText}
                        </button>
                        <button
                          type="button"
                          style={{ backgroundColor: currentTheme.secondaryBtnBg || '#f8fafc', color: currentTheme.secondaryBtnTextColor || '#0f172a' }}
                          className="border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
                        >
                          {data.hero.secondaryBtnText}
                        </button>
                      </div>

                      <div className="pt-1 flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg inline-block border border-slate-200">
                          {data.hero.isoBadge}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg inline-block border border-slate-200">
                          Zero Franchise Fee
                        </span>
                      </div>
                    </div>

                    {/* Right Hero Side in Modern Solid Showcase Frame */}
                    <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center">
                      <div className="relative w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5">
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-900">
                          <img
                            src={data.hero?.heroImage || data.hero?.image || "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"}
                            alt="Academy Lab Visual"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-2.5 -right-2 bg-white text-slate-900 border border-slate-200 px-2 py-0.5 rounded-xl shadow-md flex items-center gap-1 z-20">
                          <div className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">✓</div>
                          <span className="text-[8px] font-bold text-emerald-600">Gov. Recognized</span>
                        </div>
                        <div className="absolute -bottom-2.5 -left-2 bg-white text-slate-900 border border-slate-200 px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 z-20">
                          <div className="w-4 h-4 rounded-md bg-amber-500 text-white flex items-center justify-center text-[9px] font-black">★</div>
                          <span className="text-[8px] font-bold text-amber-600">Instant QR Verify</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}



              {/* Impact Stats in Light Mode */}
              {data.stats?.enabled !== false && data.stats.items.filter(s => !s.hidden).length > 0 && (
                <section className="py-8 bg-slate-50 border-b border-slate-200">
                  <div className={`max-w-4xl mx-auto px-4 grid gap-3.5 text-center ${data.stats.items.filter(s => !s.hidden).length === 1 ? 'grid-cols-1' :
                    data.stats.items.filter(s => !s.hidden).length === 2 ? 'grid-cols-2' :
                      data.stats.items.filter(s => !s.hidden).length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
                    }`}>
                    {data.stats.items.filter(s => !s.hidden).map((stat) => (
                      <div key={stat.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-xl sm:text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-[11px] font-bold text-slate-600 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Core Features in Light Mode */}
              {data.features?.enabled !== false && data.features.items.filter(f => !f.hidden).length > 0 && (
                <section className="py-10 bg-white border-b border-slate-200">
                  <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                        {data.features.sectionTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{data.features.sectionSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                      {data.features.items.filter(f => !f.hidden).map((item, idx) => (
                        <div key={item.id} className="bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2 transition-all">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            0{idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Verification Section in Crisp Light Mode */}
              {data.verification?.enabled !== false && data.verification.portals.filter(p => !p.hidden).length > 0 && (
                <section className="py-10 bg-slate-50 border-b border-slate-200 text-center">
                  <div className="max-w-3xl mx-auto px-4 space-y-6">
                    <div>
                      <h3 className="text-base font-black tracking-wider uppercase text-slate-900">
                        {data.verification.sectionTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{data.verification.sectionSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {data.verification.portals.filter(p => !p.hidden).map((portal) => (
                        <div key={portal.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2">
                          {portal.iconType === 'building' ? <Building2 size={24} className="text-indigo-600" /> :
                            portal.iconType === 'grad' ? <GraduationCap size={24} className="text-purple-600" /> :
                              <Users size={24} className="text-emerald-600" />}
                          <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{portal.title}</span>
                          <span
                            style={{ backgroundColor: currentTheme.primaryBtnBg || '#4f46e5' }}
                            className="text-[10px] font-bold text-white px-3 py-1 rounded-full w-full truncate shadow-xs"
                          >
                            {portal.btnText}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Popular Courses in Light Mode */}
              {data.coursesSection?.enabled !== false && data.coursesSection.categories.filter(c => !c.hidden).length > 0 && (
                <section className="py-10 bg-white border-b border-slate-200">
                  <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase">
                        {data.coursesSection.sectionTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{data.coursesSection.sectionSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      {data.coursesSection.categories.filter(c => !c.hidden).map((cat) => (
                        <div key={cat.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl space-y-2 transition-all shadow-xs">
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full inline-block">
                            {cat.tag}
                          </span>
                          <h4 className="font-black text-xs text-slate-900 line-clamp-1">{cat.name}</h4>
                          <span className="text-[10px] text-slate-500 block font-medium">Duration: {cat.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Study Centers Showcase */}
              {data.centersSection?.enabled !== false && (
                <section className="py-8 bg-slate-50 border-b border-slate-200">
                  <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
                    <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                      {data.centersSection.sectionTitle}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold rounded-xl text-xs border border-slate-700 shadow-xs">
                        {data.centersSection.featuredCode}
                      </span>
                      {data.centersSection.recentCodes.map((code, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 font-mono font-semibold rounded-xl text-[10px]">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Enquiry in Light Mode */}
              {data.enquiry?.enabled !== false && (
                <section className="bg-white py-8 px-4 text-center space-y-4 border-b border-slate-200">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {data.enquiry.sectionTitle}
                  </h3>
                  <div className="flex justify-center gap-4 text-xs font-bold">
                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1 rounded-xl">Centers: {data.enquiry.centerCount}</span>
                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1 rounded-xl">Students: {data.enquiry.studentCount}</span>
                  </div>
                </section>
              )}

              {/* Bottom CTA in Light Mode */}
              {data.cta?.enabled !== false && (
                <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-8 px-4 text-center space-y-3">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {data.cta.heading}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto">
                    {data.cta.subheading}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      style={{ backgroundColor: currentTheme.primaryBtnBg || '#4f46e5', color: currentTheme.primaryBtnTextColor || '#ffffff' }}
                      className="font-black px-6 py-2 rounded-full text-xs shadow-md uppercase tracking-wider cursor-pointer"
                    >
                      {data.cta.buttonText}
                    </button>
                  </div>
                </section>
              )}

              {/* Footer Preview */}
              {data.footer?.enabled !== false && (
                <footer
                  style={{ backgroundColor: currentTheme.footerBg || '#0f172a', color: currentTheme.footerTextColor || '#94a3b8' }}
                  className="pt-8 pb-4 px-4 text-xs border-t border-slate-800"
                >
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1">{data.footer?.companyName || 'EXAMIRROR SKILL'}</h4>
                      <p className="text-[11px] leading-relaxed opacity-90">{data.footer?.description}</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-white mb-2">Useful Links</h5>
                      <ul className="space-y-1 text-[11px] opacity-90">
                        <li>Courses</li>
                        <li>Gallery</li>
                        <li>Terms & Conditions</li>
                        <li>Privacy Policy</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-bold text-white mb-2">Contact Info</h5>
                      <div className="space-y-1 text-[11px] opacity-90">
                        <div>📞 {data.footer?.phone || ''}</div>
                        <div>✉️ {data.footer?.email || 'saurabhcsjnu@gmail.com'}</div>
                        <div className="text-[10px] opacity-80 mt-1">{data.footer?.address}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-800 text-center text-[10px] opacity-75">
                    {data.footer?.copyright || '© 2026 :: Examirror'}
                  </div>
                </footer>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default HomePageCustomizer;
