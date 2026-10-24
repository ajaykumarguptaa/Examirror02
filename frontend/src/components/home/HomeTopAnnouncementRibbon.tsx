import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, ArrowRight, X, Clock, Award } from 'lucide-react';
import { type HomeAdvertisementSettings } from '../../types/advertisement';

interface Props {
  ad: HomeAdvertisementSettings;
}

export const HomeTopAnnouncementRibbon: React.FC<Props> = ({ ad }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  // Pick top slide or legacy title
  const activeSlide = (ad.slides && ad.slides.length > 0) ? ad.slides[0] : null;
  const title = activeSlide?.title || ad.title;
  const badgeText = activeSlide?.badgeText || ad.badgeText || 'Announcement';
  const badgeType = activeSlide?.badgeType || ad.badgeType;
  const ctaText = activeSlide?.ctaText || ad.ctaText || 'Learn More';
  const ctaLink = activeSlide?.ctaLink || ad.ctaLink || '/test-series';
  const secondaryText = activeSlide?.secondaryText || ad.secondaryText;
  const countdownEnabled = activeSlide?.countdownEnabled ?? ad.countdownEnabled;
  const countdownEndDate = activeSlide?.countdownEndDate || ad.countdownEndDate;

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
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [countdownEnabled, countdownEndDate]);

  if (!ad.enabled || !ad.displayFormats?.topRibbon || dismissed || !title) return null;

  const handleNavigate = (link?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  const getBadgeIcon = () => {
    switch (badgeType) {
      case 'offer': return <Flame size={12} className="text-amber-400" />;
      case 'urgent': return <Zap size={12} className="text-rose-400" />;
      case 'exam': return <Award size={12} className="text-emerald-400" />;
      default: return <Zap size={12} className="text-amber-300" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-indigo-400/20 py-2 sm:py-2.5 px-3 sm:px-6 relative z-50 text-xs shadow-md font-sans"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Left: Badge & Title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 border border-white/20 text-amber-300 shrink-0">
              {getBadgeIcon()}
              <span>{badgeText}</span>
            </span>

            <span className="font-bold text-white text-[11px] sm:text-xs">
              {title}
            </span>

            {secondaryText && (
              <span className="hidden lg:inline text-blue-200 font-medium text-[11px] border-l border-white/20 pl-2.5">
                {secondaryText}
              </span>
            )}
          </div>

          {/* Right: Countdown & CTA */}
          <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
            {timeLeft && (
              <div className="hidden md:flex items-center gap-1 font-mono text-[11px] font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/15 text-amber-300">
                <Clock size={11} className="mr-0.5" />
                <span>{String(timeLeft.d).padStart(2, '0')}d :</span>
                <span>{String(timeLeft.h).padStart(2, '0')}h :</span>
                <span>{String(timeLeft.m).padStart(2, '0')}m :</span>
                <span>{String(timeLeft.s).padStart(2, '0')}s</span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => handleNavigate(ctaLink, e)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 hover:brightness-110 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>{ctaText}</span>
              <ArrowRight size={12} />
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
              title="Dismiss Announcement"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HomeTopAnnouncementRibbon;
