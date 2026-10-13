import React, { useRef, useState } from 'react';
import { ShieldCheck, Award, Sparkles } from 'lucide-react';

interface HoloBadgeProps {
  label?: string;
  sublabel?: string;
  className?: string;
  verifiedDate?: string;
}

export const HoloBadge: React.FC<HoloBadgeProps> = ({
  label = 'AUTHENTIC & VERIFIED',
  sublabel = 'GOVT. RECOGNIZED • ISO 9001:2015',
  className = '',
  verifiedDate,
}) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(45);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const calculatedAngle = Math.atan2(y, x) * (180 / Math.PI) + 180;
    setAngle(calculatedAngle);
  };

  return (
    <div
      ref={badgeRef}
      onMouseMove={handleMouseMove}
      className={`relative group overflow-hidden rounded-2xl p-0.5 shadow-lg select-none cursor-default transition-transform duration-300 hover:scale-[1.02] ${className}`}
      style={{
        background: `linear-gradient(${angle}deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4, #10b981, #f59e0b)`,
        backgroundSize: '300% 300%',
      }}
    >
      {/* Animated Hologram Iridescent Sheen Layer */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none animate-pulse"
        style={{
          background: `linear-gradient(${angle + 90}deg, transparent 20%, rgba(255,255,255,0.8) 50%, transparent 80%)`,
        }}
      />

      {/* Inner Badge Surface */}
      <div className="relative bg-slate-950/95 backdrop-blur-md rounded-[14px] px-4 py-3 text-white flex items-center gap-3.5 border border-white/10">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-inner shadow-amber-200/50 shrink-0">
          <ShieldCheck size={24} className="stroke-[2.5]" />
          <Sparkles size={12} className="absolute -top-1 -right-1 text-white animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black tracking-wider uppercase text-amber-300 flex items-center gap-1">
              <Award size={13} className="text-amber-400" />
              {label}
            </span>
          </div>
          <div className="text-[10px] text-slate-300 font-semibold tracking-wide truncate">
            {sublabel}
          </div>
          {verifiedDate && (
            <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
              Verified: {verifiedDate}
            </div>
          )}
        </div>

        {/* Security Watermark Hologram Stamp */}
        <div className="hidden sm:flex flex-col items-end shrink-0 pl-2 border-l border-white/10">
          <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">Tamper-Proof</span>
          <span className="text-[9px] font-black tracking-tight text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" /> 100% VALID
          </span>
        </div>
      </div>
    </div>
  );
};
