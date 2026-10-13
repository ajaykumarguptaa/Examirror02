import React, { useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightBorderColor?: string;
  radius?: number;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.12)',
  spotlightBorderColor = 'rgba(99, 102, 241, 0.35)',
  radius = 320,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const borderOverlayRef = useRef<HTMLDivElement>(null);
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (borderOverlayRef.current) {
        borderOverlayRef.current.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, ${spotlightBorderColor}, transparent 60%)`;
      }
      if (bgOverlayRef.current) {
        bgOverlayRef.current.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;
      }
    });
  };

  const handleMouseEnter = () => {
    if (borderOverlayRef.current) borderOverlayRef.current.style.opacity = '1';
    if (bgOverlayRef.current) bgOverlayRef.current.style.opacity = '1';
  };

  const handleMouseLeave = () => {
    if (borderOverlayRef.current) borderOverlayRef.current.style.opacity = '0';
    if (bgOverlayRef.current) bgOverlayRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-shadow duration-300 hover:shadow-xl ${className}`}
    >
      {/* High Performance Direct GPU Overlay - Zero React State Re-renders */}
      <div
        ref={borderOverlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-200 z-10 will-change-[background]"
      />
      <div
        ref={bgOverlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 z-0 will-change-[background]"
      />

      {/* Card Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
