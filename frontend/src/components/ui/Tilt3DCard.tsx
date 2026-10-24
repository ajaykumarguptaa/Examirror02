import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../../motion/useReducedMotion';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Maximum tilt angle in degrees, default 10
  scale?: number; // Scale on hover, default 1.02
  glare?: boolean; // Show glossy glare reflection
  onClick?: () => void;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  maxTilt = 10,
  scale = 1.02,
  glare = true,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Cleanup GSAP animations on unmount
  useEffect(() => {
    return () => {
      if (cardRef.current) gsap.killTweensOf(cardRef.current);
      if (glareRef.current) gsap.killTweensOf(glareRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      scale,
      transformPerspective: 1000,
      ease: 'power2.out',
      duration: 0.3,
      overwrite: 'auto',
    });

    if (glare && glareRef.current) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      gsap.to(glareRef.current, {
        opacity: 0.25,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`,
        ease: 'power2.out',
        duration: 0.15,
        overwrite: 'auto',
      });
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      ease: 'power2.out',
      duration: 0.4,
      overwrite: 'auto',
    });

    if (glare && glareRef.current) {
      gsap.to(glareRef.current, {
        opacity: 0,
        ease: 'power2.out',
        duration: 0.3,
        overwrite: 'auto',
      });
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ transformStyle: prefersReducedMotion ? 'flat' : 'preserve-3d' }}
      className={`relative will-change-transform transition-shadow duration-300 ${className}`}
    >
      {children}
      {glare && !prefersReducedMotion && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 z-20 transition-opacity"
        />
      )}
    </div>
  );
};

