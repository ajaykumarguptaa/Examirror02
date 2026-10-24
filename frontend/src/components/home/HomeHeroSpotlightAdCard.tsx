import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Zap, 
  Award, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Pause,
  Play,
  Layers,
  Crown
} from 'lucide-react';
import { 
  type HomeAdvertisementSettings, 
  type AdSlideItem,
  DEFAULT_AD_SLIDES 
} from '../../types/advertisement';

interface Props {
  ad: HomeAdvertisementSettings;
}

export const HomeHeroSpotlightAdCard: React.FC<Props> = ({ ad }) => {
  const navigate = useNavigate();

  // Normalize slides (support both new multi-slide array and legacy single-ad settings)
  const slides: AdSlideItem[] = (ad.slides && Array.isArray(ad.slides) && ad.slides.length > 0)
    ? ad.slides
    : (ad.title ? [{
        id: 'legacy-slide',
        title: ad.title,
        subtitle: ad.subtitle || '',
        badgeText: ad.badgeText,
        badgeType: ad.badgeType,
        imageUrl: ad.imageUrl,
        layoutType: ad.imageUrl ? 'splitCard' : 'compactCard',
        colorTheme: 'indigoBlue',
        ctaText: ad.ctaText || 'Explore Now',
        ctaLink: ad.ctaLink || '/test-series',
        secondaryText: ad.secondaryText,
        countdownEnabled: ad.countdownEnabled,
        countdownEndDate: ad.countdownEndDate
      }] : DEFAULT_AD_SLIDES);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  const autoSlideInterval = Math.max(3, ad.autoSlideIntervalSeconds || 5) * 1000;
  const currentSlide = slides[currentIndex] || slides[0];

  // Auto-slide effect
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, autoSlideInterval]);

  // Slide countdown timer
  useEffect(() => {
    if (!currentSlide?.countdownEnabled || !currentSlide?.countdownEndDate) {
      setTimeLeft(null);
      return;
    }

    const calculate = () => {
      const diff = new Date(currentSlide.countdownEndDate!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ d, h, m, s });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [currentSlide?.countdownEnabled, currentSlide?.countdownEndDate, currentIndex]);

  if (!ad.enabled || !ad.displayFormats?.heroCard || slides.length === 0) return null;

  // Solid, fail-safe navigation handler for links, anchors, and external URLs
  const handleNavigate = (link?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!link) return;
    const target = link.trim();

    // In-page hash anchor (e.g. #test-series or #elite-pass)
    if (target.startsWith('#')) {
      const el = document.getElementById(target.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Relative hash anchor from home page (e.g. /#test-series)
    if (target.startsWith('/#')) {
      const hash = target.replace('/#', '');
      if (window.location.pathname === '/') {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    }

    // External URL
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    // React router internal path
    navigate(target.startsWith('/') ? target : `/${target}`);
  };

  const getBadgeIcon = (type?: string) => {
    switch (type) {
      case 'offer': return <Flame size={13} className="text-amber-400" />;
      case 'urgent': return <Zap size={13} className="text-rose-400" />;
      case 'exam': return <Award size={13} className="text-emerald-400" />;
      default: return <Zap size={13} className="text-amber-300" />;
    }
  };

  // Modern, vibrant, professional color theme classes (No gloomy black block!)
  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'amberSunset':
        return {
          wrapper: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white border-amber-300/40 shadow-orange-950/20',
          badge: 'bg-white/20 border-white/30 text-amber-100',
          cta: 'bg-white hover:bg-amber-50 text-amber-900 shadow-lg',
          timer: 'bg-amber-950/50 border-white/20 text-white',
          secondary: 'text-amber-100'
        };
      case 'emeraldTeal':
        return {
          wrapper: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white border-emerald-400/40 shadow-emerald-950/20',
          badge: 'bg-white/15 border-white/25 text-emerald-200',
          cta: 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-lg hover:from-emerald-300 hover:to-teal-200',
          timer: 'bg-slate-950/60 border-white/15 text-emerald-300',
          secondary: 'text-emerald-200'
        };
      case 'royalPurple':
        return {
          wrapper: 'bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white border-purple-400/40 shadow-purple-950/20',
          badge: 'bg-white/15 border-white/25 text-purple-200',
          cta: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-lg hover:from-amber-300 hover:to-yellow-300',
          timer: 'bg-slate-950/60 border-white/15 text-amber-300',
          secondary: 'text-purple-200'
        };
      case 'cleanLight':
        return {
          wrapper: 'bg-gradient-to-r from-white via-blue-50/60 to-indigo-50/60 text-slate-900 border-indigo-200 shadow-xl shadow-indigo-100/50',
          badge: 'bg-indigo-100 border-indigo-200 text-indigo-800',
          cta: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25',
          timer: 'bg-white border-slate-200 text-indigo-700 shadow-xs',
          secondary: 'text-emerald-700'
        };
      case 'indigoBlue':
      default:
        return {
          wrapper: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border-blue-400/40 shadow-indigo-950/25',
          badge: 'bg-white/15 border-white/25 text-blue-100',
          cta: 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg',
          timer: 'bg-slate-950/60 border-white/15 text-amber-300',
          secondary: 'text-blue-100'
        };
    }
  };

  const themeClasses = getThemeClasses(currentSlide.colorTheme);

  return (
    <div 
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 my-8 font-sans"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative group">
        
        {/* Slides Container with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id || `slide-${currentIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={() => handleNavigate(currentSlide.ctaLink)}
            className={`relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 cursor-pointer shadow-xl transition-all duration-300 hover:shadow-2xl ${themeClasses.wrapper}`}
          >
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

            {/* Layout Mode 1: Full Graphic Banner (User Uploaded Banner Poster) */}
            {currentSlide.layoutType === 'fullBanner' && currentSlide.imageUrl ? (
              <div className="relative w-full overflow-hidden rounded-2xl min-h-[180px] sm:min-h-[260px] md:min-h-[300px] flex flex-col justify-end p-4 sm:p-6">
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.title || 'Promotional Banner'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="max-w-xl space-y-1.5 text-white">
                    {currentSlide.badgeText && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                        {getBadgeIcon(currentSlide.badgeType)}
                        <span>{currentSlide.badgeText}</span>
                      </span>
                    )}
                    {currentSlide.title && (
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight drop-shadow-md text-white">
                        {currentSlide.title}
                      </h3>
                    )}
                    {currentSlide.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow">
                        {currentSlide.subtitle}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleNavigate(currentSlide.ctaLink, e)}
                    className="self-start sm:self-auto px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-xl cursor-pointer transition-all active:scale-95"
                  >
                    <span>{currentSlide.ctaText || 'Explore Now'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : (
              /* Layout Mode 2: Split Card & Graphic / Details */
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Content Details */}
                <div className="space-y-3.5 max-w-2xl text-left">
                  {currentSlide.badgeText && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${themeClasses.badge}`}>
                      {getBadgeIcon(currentSlide.badgeType)}
                      <span>{currentSlide.badgeText}</span>
                    </div>
                  )}

                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                    {currentSlide.title}
                  </h3>

                  {currentSlide.subtitle && (
                    <p className="text-xs sm:text-sm md:text-base font-normal leading-relaxed opacity-90 max-w-xl">
                      {currentSlide.subtitle}
                    </p>
                  )}

                  {currentSlide.secondaryText && (
                    <div className={`flex items-center gap-2 text-xs font-bold pt-1 ${themeClasses.secondary}`}>
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>{currentSlide.secondaryText}</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Optional Thumbnail & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-4 w-full lg:w-auto shrink-0">
                  
                  {/* Thumbnail Poster Preview (if splitCard with image) */}
                  {currentSlide.imageUrl && currentSlide.layoutType === 'splitCard' && (
                    <div className="hidden sm:block w-36 h-24 lg:w-48 lg:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg shrink-0">
                      <img
                        src={currentSlide.imageUrl}
                        alt={currentSlide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Countdown Timer */}
                  {timeLeft && (
                    <div className={`flex items-center gap-1.5 font-mono text-xs px-3.5 py-2 rounded-xl border font-bold shadow-inner ${themeClasses.timer}`}>
                      <Clock size={13} className="mr-1 shrink-0" />
                      <span>{String(timeLeft.d).padStart(2, '0')}d :</span>
                      <span>{String(timeLeft.h).padStart(2, '0')}h :</span>
                      <span>{String(timeLeft.m).padStart(2, '0')}m :</span>
                      <span>{String(timeLeft.s).padStart(2, '0')}s</span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={(e) => handleNavigate(currentSlide.ctaLink, e)}
                    className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ${themeClasses.cta}`}
                  >
                    <span>{currentSlide.ctaText || 'Explore Now'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Carousel Slide Controls & Indicator Dots (If > 1 slide) */}
        {slides.length > 1 && (
          <div className="flex items-center justify-between gap-4 mt-3 px-2">
            
            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
                }}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Previous Slide"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev + 1) % slides.length);
                }}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Next Slide"
              >
                <ChevronRight size={16} />
              </button>

              <span className="text-xs font-bold text-slate-500 ml-1">
                {currentIndex + 1} / {slides.length}
              </span>
            </div>

            {/* Indicator Dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx 
                      ? 'w-6 bg-indigo-600' 
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Pause / Play status toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              title={isPaused ? 'Resume auto-slideshow' : 'Pause slideshow'}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
              <span className="hidden sm:inline">{isPaused ? 'Paused' : 'Auto'}</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default HomeHeroSpotlightAdCard;
