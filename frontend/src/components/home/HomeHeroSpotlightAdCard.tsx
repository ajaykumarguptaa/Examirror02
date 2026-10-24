import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Zap, Award, ArrowRight, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type HomeAdvertisementSettings } from '../../types/advertisement';

interface Props {
  ad: HomeAdvertisementSettings;
}

export const HomeHeroSpotlightAdCard: React.FC<Props> = ({ ad }) => {
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
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [ad.countdownEnabled, ad.countdownEndDate]);

  if (!ad.enabled || !ad.displayFormats?.heroCard) return null;

  const getBadgeIcon = () => {
    switch (ad.badgeType) {
      case 'offer': return <Flame size={13} className="text-amber-400 fill-amber-400" />;
      case 'urgent': return <Zap size={13} className="text-rose-400 fill-rose-400" />;
      case 'exam': return <Award size={13} className="text-emerald-400" />;
      default: return <Sparkles size={13} className="text-indigo-400 fill-indigo-400" />;
    }
  };

  const isInternal = ad.ctaLink && (ad.ctaLink.startsWith('/') || !ad.ctaLink.startsWith('http'));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 my-8 font-sans">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-amber-400/40 p-6 sm:p-8 shadow-2xl shadow-indigo-950/30 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        {/* Glow Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.25) 0%, transparent 60%)'
          }}
        />

        {/* Content Side */}
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/15 text-amber-300">
            {getBadgeIcon()}
            <span>{ad.badgeText || 'Special Announcement'}</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {ad.title}
          </h3>

          {ad.subtitle && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {ad.subtitle}
            </p>
          )}

          {ad.secondaryText && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <CheckCircle2 size={14} />
              <span>{ad.secondaryText}</span>
            </div>
          )}
        </div>

        {/* Action Side */}
        <div className="relative z-10 flex flex-col items-center md:items-end gap-4 shrink-0 w-full md:w-auto">
          {timeLeft && (
            <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-white/10 text-amber-300 font-bold shadow-inner">
              <Clock size={13} className="mr-1" />
              <span>{String(timeLeft.d).padStart(2, '0')}d :</span>
              <span>{String(timeLeft.h).padStart(2, '0')}h :</span>
              <span>{String(timeLeft.m).padStart(2, '0')}m :</span>
              <span>{String(timeLeft.s).padStart(2, '0')}s</span>
            </div>
          )}

          {isInternal ? (
            <Link
              to={ad.ctaLink}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-[0.99]"
            >
              <span>{ad.ctaText || 'Explore Now'}</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <a
              href={ad.ctaLink}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-[0.99]"
            >
              <span>{ad.ctaText || 'Explore Now'}</span>
              <ArrowRight size={14} />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HomeHeroSpotlightAdCard;
