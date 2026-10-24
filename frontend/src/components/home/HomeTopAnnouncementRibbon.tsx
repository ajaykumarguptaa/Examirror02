import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Zap, ArrowRight, X, Clock, Award } from 'lucide-react';
import { type HomeAdvertisementSettings } from '../../types/advertisement';

interface Props {
  ad: HomeAdvertisementSettings;
}

export const HomeTopAnnouncementRibbon: React.FC<Props> = ({ ad }) => {
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!ad.countdownEnabled || !ad.countdownEndDate) return;

    const calculate = () => {
      const diff = new Date(ad.countdownEndDate!).getTime() - Date.now();
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
  }, [ad.countdownEnabled, ad.countdownEndDate]);

  if (!ad.enabled || !ad.displayFormats?.topRibbon || dismissed) return null;

  const getBadgeIcon = () => {
    switch (ad.badgeType) {
      case 'offer': return <Flame size={12} className="text-amber-400 fill-amber-400" />;
      case 'urgent': return <Zap size={12} className="text-rose-400 fill-rose-400" />;
      case 'exam': return <Award size={12} className="text-emerald-400" />;
      default: return <Sparkles size={12} className="text-indigo-400 fill-indigo-400" />;
    }
  };

  const isInternal = ad.ctaLink && (ad.ctaLink.startsWith('/') || !ad.ctaLink.startsWith('http'));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-indigo-500/20 py-2 sm:py-2.5 px-3 sm:px-6 relative z-50 text-xs shadow-md"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Left: Badge & Title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/15 text-amber-300 shrink-0">
              {getBadgeIcon()}
              <span>{ad.badgeText || 'Announcement'}</span>
            </span>

            <span className="font-bold text-slate-100 text-[11px] sm:text-xs">
              {ad.title}
            </span>

            {ad.secondaryText && (
              <span className="hidden lg:inline text-indigo-300 font-medium text-[11px] border-l border-white/20 pl-2.5">
                {ad.secondaryText}
              </span>
            )}
          </div>

          {/* Right: Countdown & CTA */}
          <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
            {timeLeft && (
              <div className="hidden md:flex items-center gap-1 font-mono text-[11px] font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/10 text-amber-300">
                <Clock size={11} className="mr-0.5" />
                <span>{String(timeLeft.d).padStart(2, '0')}d :</span>
                <span>{String(timeLeft.h).padStart(2, '0')}h :</span>
                <span>{String(timeLeft.m).padStart(2, '0')}m :</span>
                <span>{String(timeLeft.s).padStart(2, '0')}s</span>
              </div>
            )}

            {isInternal ? (
              <Link
                to={ad.ctaLink}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 hover:brightness-110 shadow-sm transition-all"
              >
                <span>{ad.ctaText || 'Learn More'}</span>
                <ArrowRight size={12} />
              </Link>
            ) : (
              <a
                href={ad.ctaLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 hover:brightness-110 shadow-sm transition-all"
              >
                <span>{ad.ctaText || 'Learn More'}</span>
                <ArrowRight size={12} />
              </a>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss announcement"
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
