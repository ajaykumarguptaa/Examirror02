import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Zap, 
  Award, 
  ArrowRight, 
  Clock, 
  CheckCircle2
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

  // Normalize slides
  const slides: AdSlideItem[] = (ad.slides && Array.isArray(ad.slides) && ad.slides.length > 0)
    ? ad.slides
    : (ad.title || ad.imageUrl ? [{
        id: 'legacy-slide',
        title: ad.title || '',
        subtitle: ad.subtitle || '',
        badgeText: ad.badgeText,
        badgeType: ad.badgeType,
        imageUrl: ad.imageUrl,
        layoutType: ad.imageUrl ? 'splitCard' : 'compactCard',
        colorTheme: 'amberSunset',
        ctaText: ad.ctaText || 'Explore Now',
        ctaLink: ad.ctaLink || '/test-series',
        secondaryText: ad.secondaryText,
        countdownEnabled: ad.countdownEnabled,
        countdownEndDate: ad.countdownEndDate
      }] : DEFAULT_AD_SLIDES);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const autoSlideInterval = Math.max(3, ad.autoSlideIntervalSeconds || 5) * 1000;

  // Seamless continuous auto-slide (no blink/glitch)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, autoSlideInterval]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || slides.length <= 1) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe Left -> next slide
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else {
        // Swipe Right -> previous slide
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    setTouchStartX(null);
  };

  if (!ad.enabled || slides.length === 0) return null;

  // Solid navigation handler for internal, external, or anchor links
  const handleNavigate = (link?: string, openInNewTab?: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!link) return;
    const target = link.trim();

    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
      return;
    }

    if (openInNewTab) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    if (target.startsWith('#')) {
      const el = document.getElementById(target.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

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

    navigate(target.startsWith('/') ? target : `/${target}`);
  };

  const getBadgeIcon = (type?: string) => {
    switch (type) {
      case 'offer': return <Flame size={13} className="text-amber-300" />;
      case 'urgent': return <Zap size={13} className="text-rose-300" />;
      case 'exam': return <Award size={13} className="text-emerald-300" />;
      default: return <Zap size={13} className="text-amber-300" />;
    }
  };

  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'amberSunset':
        return {
          wrapper: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white border-amber-300/40 shadow-orange-950/20',
          badge: 'bg-white/20 border-white/30 text-amber-100',
          cta: 'bg-white hover:bg-amber-50 text-slate-950 shadow-xl',
          timer: 'bg-black/40 border-white/20 text-white',
          secondary: 'text-amber-100'
        };
      case 'emeraldTeal':
        return {
          wrapper: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white border-emerald-400/40 shadow-emerald-950/20',
          badge: 'bg-white/15 border-white/25 text-emerald-200',
          cta: 'bg-white hover:bg-emerald-50 text-slate-950 shadow-xl',
          timer: 'bg-black/40 border-white/20 text-emerald-300',
          secondary: 'text-emerald-200'
        };
      case 'royalPurple':
        return {
          wrapper: 'bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white border-purple-400/40 shadow-purple-950/20',
          badge: 'bg-white/15 border-white/25 text-purple-200',
          cta: 'bg-white hover:bg-purple-50 text-slate-950 shadow-xl',
          timer: 'bg-black/40 border-white/20 text-amber-300',
          secondary: 'text-purple-200'
        };
      case 'cleanLight':
        return {
          wrapper: 'bg-gradient-to-r from-white via-blue-50/70 to-indigo-50/70 text-slate-900 border-indigo-200 shadow-xl',
          badge: 'bg-indigo-100 border-indigo-200 text-indigo-800',
          cta: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl',
          timer: 'bg-white border-slate-200 text-indigo-700 shadow-xs',
          secondary: 'text-emerald-700'
        };
      case 'indigoBlue':
      default:
        return {
          wrapper: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border-blue-400/40 shadow-indigo-950/25',
          badge: 'bg-white/15 border-white/25 text-blue-100',
          cta: 'bg-white hover:bg-blue-50 text-slate-950 shadow-xl',
          timer: 'bg-black/40 border-white/20 text-amber-300',
          secondary: 'text-blue-100'
        };
    }
  };

  return (
    <section 
      aria-label="Promotional Announcement Card Slider"
      className={`w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 my-6 sm:my-8 font-sans select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative group">
        
        {/* CAROUSEL TRACK: Hardware-accelerated sliding with zero blank frame / zero blink glitch */}
        <div className="w-full overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div 
            className="flex transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slide, idx) => {
              const theme = getThemeClasses(slide.colorTheme);
              const hasImage = Boolean(slide.imageUrl);
              const hasText = Boolean(slide.title || slide.subtitle);

              return (
                <div
                  key={slide.id || idx}
                  onClick={() => handleNavigate(slide.ctaLink, slide.openInNewTab)}
                  className={`w-full shrink-0 relative rounded-3xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${theme.wrapper}`}
                >
                  {/* Subtle Background Radial Light Accent */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />

                  {/* SUB-CASE A: PURE IMAGE CARD (If only image exists with no text) */}
                  {hasImage && !hasText ? (
                    <div className="relative w-full h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] overflow-hidden bg-black/30 flex items-center justify-center">
                      <img
                        src={slide.imageUrl}
                        alt="Promotional Banner"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : hasImage && hasText ? (
                    
                    /* SUB-CASE B: CARD WITH BOTH IMAGE AND TEXT (Side-by-Side Integrated Card) */
                    <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                      
                      {/* Left: Text Details */}
                      <div className="space-y-3.5 max-w-2xl text-left flex-1">
                        {slide.badgeText && (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${theme.badge}`}>
                            {getBadgeIcon(slide.badgeType)}
                            <span>{slide.badgeText}</span>
                          </div>
                        )}

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight drop-shadow-sm">
                          {slide.title}
                        </h3>

                        {slide.subtitle && (
                          <p className="text-xs sm:text-sm md:text-base font-normal leading-relaxed opacity-90 max-w-xl">
                            {slide.subtitle}
                          </p>
                        )}

                        {slide.secondaryText && (
                          <div className={`flex items-center gap-2 text-xs font-bold pt-1 ${theme.secondary}`}>
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span>{slide.secondaryText}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={(e) => handleNavigate(slide.ctaLink, slide.openInNewTab, e)}
                            className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${theme.cta}`}
                          >
                            <span>{slide.ctaText || 'Explore Now'}</span>
                            <ArrowRight size={15} />
                          </button>

                          {slide.countdownEndDate && (
                            <CountdownBadge targetDate={slide.countdownEndDate} timerClass={theme.timer} />
                          )}
                        </div>
                      </div>

                      {/* Right: Crisp Rounded Image Frame */}
                      <div className="w-full sm:w-72 md:w-80 lg:w-[380px] xl:w-[420px] h-44 sm:h-52 md:h-60 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/20 shrink-0">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || 'Banner Graphic'}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                    </div>

                  ) : (

                    /* SUB-CASE C: PURE TEXT CARD (Screenshot 1 Layout with clean typography & CTA) */
                    <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                      
                      {/* Left: Text Details */}
                      <div className="space-y-3.5 max-w-2xl text-left">
                        {slide.badgeText && (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${theme.badge}`}>
                            {getBadgeIcon(slide.badgeType)}
                            <span>{slide.badgeText}</span>
                          </div>
                        )}

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight drop-shadow-sm">
                          {slide.title}
                        </h3>

                        {slide.subtitle && (
                          <p className="text-xs sm:text-sm md:text-base font-normal leading-relaxed opacity-90 max-w-xl">
                            {slide.subtitle}
                          </p>
                        )}

                        {slide.secondaryText && (
                          <div className={`flex items-center gap-2 text-xs font-bold pt-1 ${theme.secondary}`}>
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span>{slide.secondaryText}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Timer & CTA Action Button */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-4 w-full lg:w-auto shrink-0">
                        {slide.countdownEndDate && (
                          <CountdownBadge targetDate={slide.countdownEndDate} timerClass={theme.timer} />
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleNavigate(slide.ctaLink, slide.openInNewTab, e)}
                          className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${theme.cta}`}
                        >
                          <span>{slide.ctaText || 'Explore Now'}</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>

                    </div>

                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CONTROLS: Only minimal dot indicators (No arrows, no count, no paused text!) */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 bg-indigo-600 shadow-xs'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

// Isolated self-updating countdown timer badge to avoid re-rendering entire card
const CountdownBadge: React.FC<{ targetDate: string; timerClass: string }> = ({ targetDate, timerClass }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
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
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-xs px-3.5 py-2 rounded-xl border font-bold shadow-inner ${timerClass}`}>
      <Clock size={13} className="mr-1 shrink-0" />
      <span>{String(timeLeft.d).padStart(2, '0')}d :</span>
      <span>{String(timeLeft.h).padStart(2, '0')}h :</span>
      <span>{String(timeLeft.m).padStart(2, '0')}m :</span>
      <span>{String(timeLeft.s).padStart(2, '0')}s</span>
    </div>
  );
};

export default HomeHeroSpotlightAdCard;
