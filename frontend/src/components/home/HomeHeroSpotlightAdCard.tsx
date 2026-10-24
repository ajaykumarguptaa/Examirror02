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
  ExternalLink
} from 'lucide-react';
import { 
  type HomeAdvertisementSettings, 
  type AdSlideItem,
  DEFAULT_AD_SLIDES 
} from '../../types/advertisement';

interface Props {
  ad: HomeAdvertisementSettings;
  className?: string;
}

export const HomeHeroSpotlightAdCard: React.FC<Props> = ({ ad, className = '' }) => {
  const navigate = useNavigate();

  // Normalize slides (support multi-slide array and legacy single-ad settings)
  const slides: AdSlideItem[] = (ad.slides && Array.isArray(ad.slides) && ad.slides.length > 0)
    ? ad.slides
    : (ad.title || ad.imageUrl ? [{
        id: 'legacy-slide',
        title: ad.title || '',
        subtitle: ad.subtitle || '',
        badgeText: ad.badgeText,
        badgeType: ad.badgeType,
        imageUrl: ad.imageUrl,
        imageFit: ad.bannerFit || 'cover',
        layoutType: ad.imageUrl ? 'pureImage' : 'compactCard',
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const autoSlideInterval = Math.max(3, ad.autoSlideIntervalSeconds || 5) * 1000;
  const currentSlide: AdSlideItem = slides[currentIndex] || slides[0];

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

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || slides.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else {
        // Swiped right -> prev
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    setTouchStartX(null);
  };

  // If campaign is paused or no slides, do not render
  if (!ad.enabled || slides.length === 0) return null;

  // Navigation handler
  const handleNavigate = (link?: string, openInNewTab?: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!link) return;
    const target = link.trim();

    // Check external URL
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
      return;
    }

    if (openInNewTab) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    // In-page anchor (e.g. #test-series or #free-tests)
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

  const isFullWidth = ad.bannerWidth !== 'container';
  const bannerHeightClass = (() => {
    switch (ad.bannerHeight) {
      case 'compact':
        return 'h-[160px] sm:h-[220px] md:h-[280px] lg:h-[340px]';
      case 'large':
        return 'h-[240px] sm:h-[360px] md:h-[460px] lg:h-[540px] xl:h-[600px]';
      case 'auto':
        return 'aspect-[21/9] sm:aspect-[24/8] min-h-[170px] max-h-[520px]';
      case 'standard':
      default:
        return 'h-[200px] sm:h-[300px] md:h-[380px] lg:h-[440px] xl:h-[480px]';
    }
  })();

  const imageFitStyle = currentSlide.imageFit || ad.bannerFit || 'cover';

  // Determine slide display style
  // If slide has an image and layout is 'pureImage', OR if it has an image with no title -> Pure Image Banner
  const isPureImage = Boolean(
    currentSlide.imageUrl && (
      currentSlide.layoutType === 'pureImage' || 
      (!currentSlide.title && !currentSlide.subtitle) ||
      currentSlide.layoutType === 'compactCard' // If image uploaded in compact mode, render it directly!
    )
  );

  return (
    <section 
      aria-label="Promotional Announcement Slider"
      className={`w-full font-sans select-none ${isFullWidth ? 'bg-slate-950 px-0 my-0' : 'max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 my-4 sm:my-6'} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`relative group overflow-hidden ${isFullWidth ? 'rounded-none' : 'rounded-3xl shadow-xl border border-slate-200/80 bg-slate-900'}`}>
        
        {/* Slides Viewport */}
        <div className={`relative w-full ${bannerHeightClass} overflow-hidden`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id || `slide-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              onClick={() => handleNavigate(currentSlide.ctaLink, currentSlide.openInNewTab)}
              className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden"
            >
              
              {/* MODE 1: PURE GRAPHIC IMAGE BANNER (Edge-to-Edge / Clean Widescreen Banner) */}
              {isPureImage ? (
                <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  
                  {/* Blurred Backdrop if image is in 'contain' fit */}
                  {imageFitStyle === 'contain' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
                    />
                  )}

                  {/* Main Banner Graphic Image */}
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title || 'Promotional Banner'}
                    className={`relative z-10 w-full h-full transition-transform duration-500 group-hover:scale-[1.01] ${
                      imageFitStyle === 'contain' ? 'object-contain' : 'object-cover object-center'
                    }`}
                    loading="eager"
                  />

                  {/* Subtle Top-Right External Link Badge if link exists */}
                  {currentSlide.ctaLink && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow-lg pointer-events-none">
                      <span>{currentSlide.ctaText || 'Open Link'}</span>
                      <ExternalLink size={12} />
                    </div>
                  )}

                  {/* Countdown Badge if enabled on pure image */}
                  {timeLeft && (
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-lg pointer-events-none">
                      <Clock size={12} className="text-amber-400 shrink-0" />
                      <span>Ends in: {String(timeLeft.d).padStart(2, '0')}d {String(timeLeft.h).padStart(2, '0')}h {String(timeLeft.m).padStart(2, '0')}m</span>
                    </div>
                  )}

                </div>
              ) : currentSlide.layoutType === 'fullBanner' && currentSlide.imageUrl ? (
                
                /* MODE 2: FULL GRAPHIC BANNER WITH TEXT & CTA OVERLAY */
                <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col justify-end p-6 sm:p-10 md:p-12">
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title || 'Promotional Banner'}
                    className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Multi-stage High-Contrast Gradient Mask */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4 text-left">
                    {currentSlide.badgeText && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-lg">
                        {getBadgeIcon(currentSlide.badgeType)}
                        <span>{currentSlide.badgeText}</span>
                      </span>
                    )}

                    {currentSlide.title && (
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                        {currentSlide.title}
                      </h2>
                    )}

                    {currentSlide.subtitle && (
                      <p className="text-xs sm:text-sm md:text-base text-slate-200 line-clamp-2 max-w-xl font-medium drop-shadow">
                        {currentSlide.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={(e) => handleNavigate(currentSlide.ctaLink, currentSlide.openInNewTab, e)}
                        className="px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-xl cursor-pointer transition-all active:scale-95"
                      >
                        <span>{currentSlide.ctaText || 'Explore Now'}</span>
                        <ArrowRight size={15} />
                      </button>

                      {timeLeft && (
                        <div className="flex items-center gap-1.5 font-mono text-xs px-3.5 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md text-amber-300 border border-white/20 font-bold">
                          <Clock size={13} className="shrink-0" />
                          <span>{String(timeLeft.d).padStart(2, '0')}d : {String(timeLeft.h).padStart(2, '0')}h : {String(timeLeft.m).padStart(2, '0')}m : {String(timeLeft.s).padStart(2, '0')}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              ) : (

                /* MODE 3: SPLIT CARD / GRADIENT CARD */
                <div className={`relative w-full h-full flex flex-col lg:flex-row items-center justify-between p-6 sm:p-10 md:p-12 text-white ${
                  currentSlide.colorTheme === 'amberSunset'
                    ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700'
                    : currentSlide.colorTheme === 'emeraldTeal'
                    ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900'
                    : currentSlide.colorTheme === 'royalPurple'
                    ? 'bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900'
                    : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900'
                }`}>
                  <div className="space-y-3.5 max-w-2xl text-left z-10">
                    {currentSlide.badgeText && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 border border-white/30 text-white shadow-xs">
                        {getBadgeIcon(currentSlide.badgeType)}
                        <span>{currentSlide.badgeText}</span>
                      </div>
                    )}

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                      {currentSlide.title || 'Special Announcement'}
                    </h3>

                    {currentSlide.subtitle && (
                      <p className="text-xs sm:text-sm md:text-base font-normal leading-relaxed text-white/90 max-w-xl">
                        {currentSlide.subtitle}
                      </p>
                    )}

                    {currentSlide.secondaryText && (
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-200 pt-1">
                        <CheckCircle2 size={15} className="shrink-0" />
                        <span>{currentSlide.secondaryText}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 z-10 mt-4 lg:mt-0">
                    {currentSlide.imageUrl && (
                      <div className="w-48 h-32 sm:w-60 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl shrink-0">
                        <img src={currentSlide.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleNavigate(currentSlide.ctaLink, currentSlide.openInNewTab, e)}
                      className="px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-xl cursor-pointer hover:from-amber-300 hover:to-yellow-300 transition-all active:scale-95"
                    >
                      <span>{currentSlide.ctaText || 'Explore Now'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>

              )}

            </motion.div>
          </AnimatePresence>

          {/* SLIDER CONTROLS (Only visible if > 1 slide) */}
          {slides.length > 1 && (
            <>
              {/* Prev Arrow Button */}
              {ad.showArrows !== false && (
                <button
                  type="button"
                  aria-label="Previous Banner Slide"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
                  }}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/25 flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-90 cursor-pointer"
                >
                  <ChevronLeft size={22} className="stroke-[2.5]" />
                </button>
              )}

              {/* Next Arrow Button */}
              {ad.showArrows !== false && (
                <button
                  type="button"
                  aria-label="Next Banner Slide"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex((prev) => (prev + 1) % slides.length);
                  }}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/25 flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-90 cursor-pointer"
                >
                  <ChevronRight size={22} className="stroke-[2.5]" />
                </button>
              )}

              {/* Bottom Navigation Indicators (Pills / Dots) */}
              {ad.showDots !== false && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-lg">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentIndex === idx
                          ? 'w-7 bg-amber-400 shadow-xs'
                          : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}

                  {/* Pause / Play status toggle */}
                  <button
                    type="button"
                    aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPaused(!isPaused);
                    }}
                    className="ml-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
                  >
                    {isPaused ? <Play size={11} /> : <Pause size={11} />}
                  </button>
                </div>
              )}

              {/* Slide Counter Indicator */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[11px] font-black tracking-wider text-white pointer-events-none">
                {currentIndex + 1} / {slides.length}
              </div>
            </>
          )}

        </div>

      </div>
    </section>
  );
};

export default HomeHeroSpotlightAdCard;
