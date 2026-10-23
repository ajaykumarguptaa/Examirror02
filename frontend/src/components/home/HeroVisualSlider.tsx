import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Star,
  Building2,
  Check,
  CheckCircle2,
  QrCode,
  Laptop,
  Sparkles,
  Trophy,
  Play,
  Pause
} from 'lucide-react';
import { Tilt3DCard } from '../ui';
import { NumberCounter } from '../../motion';

export interface HeroSlideItem {
  id: string;
  url: string;
  title?: string;
  badge?: string;
}

export interface HeroSliderConfig {
  heroImage?: string;
  heroImages?: string[];
  heroSlides?: HeroSlideItem[];

  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'slide-up' | 'flip';
  autoplay?: boolean;
  intervalSeconds?: number;
  pauseOnHover?: boolean;
  showIndicators?: boolean;
  indicatorStyle?: 'dots' | 'bars' | 'numbers' | 'progress';
  showArrows?: 'always' | 'hover' | 'never';

  aspectRatio?: '4/3' | '16/9' | '3/2' | '1/1';
  overlayStyle?: 'subtle-dark' | 'brand-indigo' | 'emerald' | 'glass' | 'none';
  cardBorderRadius?: 'rounded-2xl' | 'rounded-3xl' | 'rounded-xl';
  enableTilt3D?: boolean;

  badgeTopRight?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    icon?: 'check' | 'shield' | 'star' | 'award' | 'building';
    theme?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'purple';
    animate?: boolean;
  };
  badgeBottomLeft?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    icon?: 'star' | 'qrcode' | 'laptop' | 'sparkles' | 'trophy';
    theme?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
    animate?: boolean;
  };

  statsRibbon?: {
    enabled?: boolean;
    stat1Label?: string;
    stat1Value?: string;
    stat2Label?: string;
    stat2Value?: string;
    stat3Label?: string;
    stat3Value?: string;
  };
}

interface HeroVisualSliderProps {
  config?: HeroSliderConfig;
  publicStats?: {
    certifiedStudentsCount?: number;
    studentsCount?: number;
    centersCount?: number;
    coursesCount?: number;
  } | null;
  className?: string;
  isCustomizerPreview?: boolean;
}

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'hs-1',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    title: 'Modern Computer Lab & Practical Workstation',
    badge: 'High-Tech Lab'
  },
  {
    id: 'hs-2',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    title: 'Job-Ready Digital Skills & Teamwork',
    badge: 'Live Projects'
  },
  {
    id: 'hs-3',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    title: 'Software Development & IT Industry Training',
    badge: 'Industry Aligned'
  },
  {
    id: 'hs-4',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    title: 'Interactive Audio-Visual Smart Classrooms',
    badge: 'Expert Faculty'
  }
];

export const HeroVisualSlider: React.FC<HeroVisualSliderProps> = ({
  config,
  publicStats,
  className = '',
  isCustomizerPreview = false
}) => {
  // Normalize slides
  const slides: HeroSlideItem[] = React.useMemo(() => {
    if (config?.heroSlides && config.heroSlides.length > 0) {
      return config.heroSlides.map((s, idx) => {
        if (typeof s === 'string') return { id: `s-${idx}`, url: s };
        return s;
      });
    }
    if (config?.heroImages && config.heroImages.length > 0) {
      return config.heroImages.map((url, idx) => ({
        id: `s-${idx}`,
        url,
        title: DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length]?.title,
        badge: DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length]?.badge
      }));
    }
    if (config?.heroImage) {
      return [{ id: 's-single', url: config.heroImage, title: 'Examirror Training Academy' }];
    }
    return DEFAULT_HERO_SLIDES;
  }, [config?.heroSlides, config?.heroImages, config?.heroImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(config?.autoplay !== false);

  const transitionEffect = config?.transitionEffect || 'zoom';
  const autoplay = config?.autoplay !== false;
  const intervalSeconds = Math.max(2, config?.intervalSeconds || 4);
  const pauseOnHover = config?.pauseOnHover !== false;
  const showIndicators = config?.showIndicators !== false;
  const indicatorStyle = config?.indicatorStyle || 'dots';
  const showArrows = config?.showArrows || 'hover';
  const aspectRatio = config?.aspectRatio || '4/3';
  const overlayStyle = config?.overlayStyle || 'subtle-dark';
  const cardRadius = config?.cardBorderRadius || 'rounded-3xl';
  const enableTilt = config?.enableTilt3D !== false;

  // Keep index in range if slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay timer
  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    if (pauseOnHover && isHovered) return;
    if (!isPlaying) return;

    const timer = setInterval(() => {
      nextSlide();
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [autoplay, slides.length, intervalSeconds, isHovered, pauseOnHover, isPlaying, nextSlide]);

  // Aspect ratio classes
  const aspectClass = {
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]',
    '3/2': 'aspect-[3/2]',
    '1/1': 'aspect-square'
  }[aspectRatio] || 'aspect-[4/3]';

  // Overlay styles
  const overlayGradients = {
    'subtle-dark': 'from-slate-950/50 via-slate-950/15 to-transparent',
    'brand-indigo': 'from-indigo-950/60 via-purple-900/20 to-transparent',
    'emerald': 'from-emerald-950/60 via-teal-900/20 to-transparent',
    'glass': 'bg-slate-900/15 backdrop-blur-[2px]',
    'none': ''
  }[overlayStyle] || 'from-slate-950/40 via-transparent to-slate-950/20';

  // Animation variants based on transitionEffect
  const variants: any = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
      exit: { opacity: 0, transition: { duration: 0.45 } }
    },
    slide: {
      initial: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
      animate: { x: '0%', opacity: 1, transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] } },
      exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.45 } })
    },
    zoom: {
      initial: { opacity: 0, scale: 1.12 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          opacity: { duration: 0.7 },
          scale: { duration: 5.5, ease: 'easeOut' }
        }
      },
      exit: { opacity: 0, scale: 1.04, transition: { duration: 0.5 } }
    },
    'slide-up': {
      initial: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
      animate: { y: '0%', opacity: 1, transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] } },
      exit: (dir: number) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.45 } })
    },
    flip: {
      initial: { rotateY: 90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
      exit: { rotateY: -90, opacity: 0, transition: { duration: 0.5 } }
    }
  }[transitionEffect] || {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // Badges config
  const badgeTopRight = {
    enabled: config?.badgeTopRight?.enabled ?? true,
    title: config?.badgeTopRight?.title || 'Government',
    subtitle: config?.badgeTopRight?.subtitle || 'Recognized',
    icon: config?.badgeTopRight?.icon || 'check',
    theme: config?.badgeTopRight?.theme || 'emerald',
    animate: config?.badgeTopRight?.animate ?? true
  };

  const badgeBottomLeft = {
    enabled: config?.badgeBottomLeft?.enabled ?? true,
    title: config?.badgeBottomLeft?.title || 'Student Portal',
    subtitle: config?.badgeBottomLeft?.subtitle || 'Instant QR Verify',
    icon: config?.badgeBottomLeft?.icon || 'star',
    theme: config?.badgeBottomLeft?.theme || 'amber',
    animate: config?.badgeBottomLeft?.animate ?? true
  };

  const statsRibbon = {
    enabled: config?.statsRibbon?.enabled ?? true,
    stat1Label: config?.statsRibbon?.stat1Label || 'Certified',
    stat1Value: config?.statsRibbon?.stat1Value,
    stat2Label: config?.statsRibbon?.stat2Label || 'Study Centers',
    stat2Value: config?.statsRibbon?.stat2Value,
    stat3Label: config?.statsRibbon?.stat3Label || 'Courses',
    stat3Value: config?.statsRibbon?.stat3Value
  };

  // Helper to render badge icon
  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield': return <ShieldCheck size={14} className="text-white" />;
      case 'star': return <Star size={14} className="text-white fill-white" />;
      case 'award': return <Award size={14} className="text-white" />;
      case 'building': return <Building2 size={14} className="text-white" />;
      case 'qrcode': return <QrCode size={14} className="text-white" />;
      case 'laptop': return <Laptop size={14} className="text-white" />;
      case 'sparkles': return <Sparkles size={14} className="text-white" />;
      case 'trophy': return <Trophy size={14} className="text-white" />;
      default: return <span className="font-black text-xs text-white">✓</span>;
    }
  };

  // Helper for badge color themes
  const getBadgeThemeClass = (theme: string) => {
    switch (theme) {
      case 'blue': return { bg: 'bg-blue-600', text: 'text-blue-600' };
      case 'indigo': return { bg: 'bg-indigo-600', text: 'text-indigo-600' };
      case 'amber': return { bg: 'bg-amber-500', text: 'text-amber-600' };
      case 'purple': return { bg: 'bg-purple-600', text: 'text-purple-600' };
      case 'rose': return { bg: 'bg-rose-500', text: 'text-rose-600' };
      default: return { bg: 'bg-emerald-500', text: 'text-emerald-600' };
    }
  };

  const currentSlide = slides[currentIndex] || slides[0];

  const content = (
    <div
      className={`relative w-full bg-white ${cardRadius} border border-slate-200 shadow-2xl p-3 sm:p-4 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual Image Viewport */}
      <div className={`relative rounded-2xl overflow-hidden ${aspectClass} bg-slate-950 shadow-inner group select-none`}>
        {/* Animated Image Canvas */}
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentSlide?.id || currentIndex}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
          >
            <img
              src={currentSlide?.url}
              alt={currentSlide?.title || 'Academy Training Lab'}
              decoding="async"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>

        {/* Ambient Gradient Overlay */}
        {overlayStyle !== 'none' && (
          <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradients} pointer-events-none z-10`} />
        )}

        {/* Top-Left Slide Badge & Caption (if present) */}
        {currentSlide?.badge && (
          <div className="absolute top-3 left-3 z-20">
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-[10px] font-bold border border-white/20 tracking-wide inline-flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentSlide.badge}</span>
            </span>
          </div>
        )}

        {/* Slide Title Tag (bottom-left of image) */}
        {currentSlide?.title && (
          <div className="absolute bottom-3 left-3 right-16 z-20 pointer-events-none">
            <p className="text-white text-xs sm:text-sm font-bold drop-shadow-md truncate opacity-90">
              {currentSlide.title}
            </p>
          </div>
        )}

        {/* Navigation Arrow Controls */}
        {slides.length > 1 && showArrows !== 'never' && (
          <div
            className={`absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-20 transition-opacity duration-200 ${
              showArrows === 'hover' ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous Slide"
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg pointer-events-auto transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next Slide"
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg pointer-events-auto transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Slide Indicators */}
        {slides.length > 1 && showIndicators && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
            {indicatorStyle === 'numbers' ? (
              <span className="text-[10px] font-mono text-white font-bold px-1">
                {currentIndex + 1} / {slides.length}
              </span>
            ) : indicatorStyle === 'progress' ? (
              <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                />
              </div>
            ) : indicatorStyle === 'bars' ? (
              slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-5 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))
            ) : (
              // Default Dots
              slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-2 h-2 bg-white ring-2 ring-white/50' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Badge: Top-Right */}
      {badgeTopRight.enabled && (
        <motion.div
          animate={badgeTopRight.animate ? { y: [0, -6, 0] } : undefined}
          transition={badgeTopRight.animate ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
          className="absolute -top-3 right-2 sm:-top-4 sm:-right-4 bg-white text-slate-900 border border-slate-200 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl flex items-center gap-2 sm:gap-2.5 z-30"
        >
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl ${getBadgeThemeClass(badgeTopRight.theme).bg} text-white flex items-center justify-center shadow-xs shrink-0`}>
            {renderBadgeIcon(badgeTopRight.icon)}
          </div>
          <div className="text-left leading-tight">
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{badgeTopRight.title}</div>
            <div className={`text-[11px] sm:text-xs font-black ${getBadgeThemeClass(badgeTopRight.theme).text}`}>{badgeTopRight.subtitle}</div>
          </div>
        </motion.div>
      )}

      {/* Floating Badge: Bottom-Left (Desktop/Tablet) */}
      {badgeBottomLeft.enabled && (
        <motion.div
          animate={badgeBottomLeft.animate ? { y: [0, 6, 0] } : undefined}
          transition={badgeBottomLeft.animate ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } : undefined}
          className="hidden sm:flex absolute -bottom-4 -left-2 sm:-left-4 bg-white text-slate-900 border border-slate-200 px-3.5 py-2.5 rounded-2xl shadow-xl items-center gap-3 z-30"
        >
          <div className={`w-8 h-8 rounded-xl ${getBadgeThemeClass(badgeBottomLeft.theme).bg} text-white flex items-center justify-center shadow-xs shrink-0`}>
            {renderBadgeIcon(badgeBottomLeft.icon)}
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{badgeBottomLeft.title}</div>
            <div className={`text-xs font-black ${getBadgeThemeClass(badgeBottomLeft.theme).text}`}>{badgeBottomLeft.subtitle}</div>
          </div>
        </motion.div>
      )}

      {/* Bottom Stats Ribbon */}
      {statsRibbon.enabled && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-black text-slate-900 text-sm">
              {statsRibbon.stat1Value ? (
                statsRibbon.stat1Value
              ) : isCustomizerPreview ? (
                '25,000+'
              ) : (
                <NumberCounter
                  value={publicStats ? `${(publicStats.certifiedStudentsCount ?? publicStats.studentsCount ?? 25000).toLocaleString('en-IN')}+` : '25,000+'}
                  durationMs={1200}
                />
              )}
            </div>
            <div className="text-[10px] font-bold text-slate-500">{statsRibbon.stat1Label}</div>
          </div>
          <div className="border-x border-slate-200">
            <div className="font-black text-slate-900 text-sm">
              {statsRibbon.stat2Value ? (
                statsRibbon.stat2Value
              ) : isCustomizerPreview ? (
                '350+'
              ) : (
                <NumberCounter
                  value={publicStats ? `${(publicStats.centersCount ?? 350).toLocaleString('en-IN')}+` : '350+'}
                  durationMs={1200}
                />
              )}
            </div>
            <div className="text-[10px] font-bold text-slate-500">{statsRibbon.stat2Label}</div>
          </div>
          <div>
            <div className="font-black text-slate-900 text-sm">
              {statsRibbon.stat3Value ? (
                statsRibbon.stat3Value
              ) : isCustomizerPreview ? (
                '40+'
              ) : (
                <NumberCounter
                  value={publicStats ? `${(publicStats.coursesCount ?? 40)}+` : '40+'}
                  durationMs={1200}
                />
              )}
            </div>
            <div className="text-[10px] font-bold text-slate-500">{statsRibbon.stat3Label}</div>
          </div>
        </div>
      )}
    </div>
  );

  if (enableTilt && !isCustomizerPreview) {
    return (
      <Tilt3DCard maxTilt={7} scale={1.01} glare={true} className={className || "w-full max-w-xl"}>
        {content}
      </Tilt3DCard>
    );
  }

  return <div className={className || "w-full max-w-xl"}>{content}</div>;
};

export default HeroVisualSlider;
