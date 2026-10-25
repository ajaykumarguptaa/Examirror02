import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Zap, Award, ArrowRight, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type HomeAdvertisementSettings } from '../../types/advertisement';

interface Props {
  ad: HomeAdvertisementSettings;
}

export const HomeAdvertisementModal: React.FC<Props> = ({ ad }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  // Pick top slide or legacy
  const activeSlide = (ad.slides && ad.slides.length > 0) ? ad.slides[0] : null;
  const title = activeSlide?.title || ad.title;
  const subtitle = activeSlide?.subtitle || ad.subtitle;
  const badgeText = activeSlide?.badgeText || ad.badgeText || 'Special Announcement';
  const badgeType = activeSlide?.badgeType || ad.badgeType;
  const imageUrl = activeSlide?.imageUrl || ad.imageUrl;
  const ctaText = activeSlide?.ctaText || ad.ctaText || 'Claim Offer & Enroll';
  const ctaLink = activeSlide?.ctaLink || ad.ctaLink || '/test-series';
  const secondaryText = activeSlide?.secondaryText || ad.secondaryText;
  const countdownEnabled = activeSlide?.countdownEnabled ?? ad.countdownEnabled;
  const countdownEndDate = activeSlide?.countdownEndDate || ad.countdownEndDate;

  useEffect(() => {
    if (!ad.enabled || !ad.displayFormats?.popupModal || !title) return;

    // Check if user dismissed today
    const dismissedTimestamp = localStorage.getItem('examirror_ad_dismissed_until');
    if (dismissedTimestamp && Number(dismissedTimestamp) > Date.now()) {
      return;
    }

    // Check session storage if showOncePerSession is true
    if (ad.showOncePerSession) {
      const shownInSession = sessionStorage.getItem('examirror_ad_shown');
      if (shownInSession === 'true') return;
    }

    const delay = Math.max(0.5, ad.popupDelaySeconds || 1.5) * 1000;
    const timer = setTimeout(() => {
      setIsOpen(true);
      if (ad.showOncePerSession) {
        sessionStorage.setItem('examirror_ad_shown', 'true');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [ad.enabled, ad.displayFormats?.popupModal, ad.popupDelaySeconds, ad.showOncePerSession, title]);

  // Countdown timer logic
  useEffect(() => {
    if (!countdownEnabled || !countdownEndDate) return;

    const calculate = () => {
      const diff = new Date(countdownEndDate).getTime() - Date.now();
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
  }, [countdownEnabled, countdownEndDate]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowToday]);

  const handleClose = () => {
    if (dontShowToday) {
      localStorage.setItem('examirror_ad_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
    }
    setIsOpen(false);
  };

  const handleNavigate = (link?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleClose();
    if (!link) return;
    const target = link.trim();

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
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(target.startsWith('/') ? target : `/${target}`);
  };

  if (!isOpen) return null;

  const getBadgeIcon = () => {
    switch (badgeType) {
      case 'offer': return <Flame size={13} className="text-amber-400" />;
      case 'urgent': return <Zap size={13} className="text-rose-400" />;
      case 'exam': return <Award size={13} className="text-emerald-400" />;
      default: return <Zap size={13} className="text-amber-300" />;
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop overlay: Clicking anywhere outside closes the modal */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[110] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-slate-900 text-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-[490px] max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-indigo-500/30 font-sans cursor-default overflow-hidden my-auto"
        >
          {/* Close Button - Always visible on top right with high z-index */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-lg active:scale-95"
            title="Close announcement"
            aria-label="Close announcement"
          >
            <X size={15} />
          </button>

          {/* Poster Image (Responsive scaling with top header) */}
          {imageUrl && (
            <div className="relative w-full max-h-36 sm:max-h-48 md:max-h-56 shrink-0 overflow-hidden bg-slate-950 border-b border-white/10">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>
          )}

          {/* Scrollable Content Container (Guarantees full visibility on small phones & landscape mode) */}
          <div className="relative z-10 p-4 sm:p-6 md:p-7 space-y-3.5 sm:space-y-4 md:space-y-5 overflow-y-auto overscroll-contain flex-1 modal-dark-scroll">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/10 border border-white/15 text-amber-300 shadow-sm">
              {getBadgeIcon()}
              <span>{badgeText}</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1 sm:space-y-1.5">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Countdown Timer Box */}
            {timeLeft && (
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/85 border border-white/10 shadow-inner">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1.5 sm:mb-2">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Clock size={12} className="shrink-0" />
                    <span>Special Offer Ends In:</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-mono">Limited Time</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center font-mono">
                  <div className="bg-slate-900 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/10">
                    <div className="text-base sm:text-lg md:text-xl font-black text-white">{String(timeLeft.d).padStart(2, '0')}</div>
                    <div className="text-[8px] sm:text-[9px] uppercase text-slate-400 mt-0.5">Days</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/10">
                    <div className="text-base sm:text-lg md:text-xl font-black text-white">{String(timeLeft.h).padStart(2, '0')}</div>
                    <div className="text-[8px] sm:text-[9px] uppercase text-slate-400 mt-0.5">Hours</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/10">
                    <div className="text-base sm:text-lg md:text-xl font-black text-white">{String(timeLeft.m).padStart(2, '0')}</div>
                    <div className="text-[8px] sm:text-[9px] uppercase text-slate-400 mt-0.5">Mins</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/10">
                    <div className="text-base sm:text-lg md:text-xl font-black text-amber-400">{String(timeLeft.s).padStart(2, '0')}</div>
                    <div className="text-[8px] sm:text-[9px] uppercase text-slate-400 mt-0.5">Secs</div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="space-y-2 sm:space-y-2.5 pt-0.5">
              <button
                type="button"
                onClick={(e) => handleNavigate(ctaLink, e)}
                className="w-full py-3 sm:py-3.5 md:py-4 px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-[0.99] cursor-pointer"
              >
                <span>{ctaText}</span>
                <ArrowRight size={15} />
              </button>

              {/* Reassurance text */}
              {secondaryText && (
                <div className="text-center text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  <span>{secondaryText}</span>
                </div>
              )}
            </div>

            {/* Don't show again today footer */}
            <div className="pt-2 sm:pt-2.5 border-t border-white/10 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                />
                <span>Don't show this announcement again today</span>
              </label>

              <button
                type="button"
                onClick={handleClose}
                className="hover:text-white underline cursor-pointer self-end xs:self-auto py-0.5"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HomeAdvertisementModal;
