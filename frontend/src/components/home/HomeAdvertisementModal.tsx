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
      case 'offer': return <Flame size={14} className="text-amber-400" />;
      case 'urgent': return <Zap size={14} className="text-rose-400" />;
      case 'exam': return <Award size={14} className="text-emerald-400" />;
      default: return <Zap size={14} className="text-amber-300" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-slate-900 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-indigo-500/30 font-sans"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
            title="Close"
          >
            <X size={16} />
          </button>

          {/* Poster Image (if provided) */}
          {imageUrl && (
            <div className="relative w-full max-h-56 overflow-hidden bg-slate-950 border-b border-white/10">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>
          )}

          {/* Modal Content */}
          <div className="relative z-10 p-6 sm:p-8 space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/15 text-amber-300 shadow-sm">
              {getBadgeIcon()}
              <span>{badgeText}</span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Countdown Timer Box */}
            {timeLeft && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Clock size={13} />
                    <span>Special Offer Ends In:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Limited Time</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-900 p-2 rounded-xl border border-white/10">
                    <div className="text-lg font-black text-white">{String(timeLeft.d).padStart(2, '0')}</div>
                    <div className="text-[9px] uppercase text-slate-400">Days</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-white/10">
                    <div className="text-lg font-black text-white">{String(timeLeft.h).padStart(2, '0')}</div>
                    <div className="text-[9px] uppercase text-slate-400">Hours</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-white/10">
                    <div className="text-lg font-black text-white">{String(timeLeft.m).padStart(2, '0')}</div>
                    <div className="text-[9px] uppercase text-slate-400">Mins</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-white/10">
                    <div className="text-lg font-black text-amber-400">{String(timeLeft.s).padStart(2, '0')}</div>
                    <div className="text-[9px] uppercase text-slate-400">Secs</div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={(e) => handleNavigate(ctaLink, e)}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-[0.99] cursor-pointer"
              >
                <span>{ctaText}</span>
                <ArrowRight size={14} />
              </button>

              {/* Reassurance text */}
              {secondaryText && (
                <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>{secondaryText}</span>
                </div>
              )}
            </div>

            {/* Don't show again today footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Don't show this announcement again today</span>
              </label>

              <button
                onClick={handleClose}
                className="hover:text-white underline cursor-pointer"
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
