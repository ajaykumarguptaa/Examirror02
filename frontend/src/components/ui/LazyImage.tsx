import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ImageOff } from 'lucide-react';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  wrapperClassName?: string;
  aspectRatio?: string;
  priority?: boolean; // For above-the-fold or hero images
  rootMargin?: string; // Preload distance before entering viewport (default 300px)
  showIndicator?: boolean; // Show minimalist glassmorphism sparkle badge while loading
}

/**
 * Enterprise Ultra-Smooth & Stylish LazyImage Component
 * 
 * Aesthetics & Motion:
 * 1. Ambient Glassmorphism Placeholder: Soft gradient slate backdrop with subtle indigo tint.
 * 2. High-Gloss Prism Light Beam: Animated diagonal ray sweeping across container.
 * 3. Minimalist Floating Glass Badge: Translucent breathing badge with Sparkles indicator.
 * 4. Cinema-grade Lens Focus Progressive Reveal: Blur-12px -> Blur-0, Scale-103 -> Scale-100.
 * 5. IntersectionObserver 300px Pre-fetch: Zero user wait time during fast scroll.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc = '/favicon.png',
  className = '',
  wrapperClassName = '',
  aspectRatio,
  priority = false,
  rootMargin = '300px 0px',
  showIndicator = false,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Pre-load via IntersectionObserver 300px before scrolling into viewport
  useEffect(() => {
    if (priority || isInView) return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, rootMargin, isInView]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none bg-slate-100/90 ${wrapperClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Modern High-Gloss Prism Shimmer & Ambient Layer */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out z-0 ${
          isLoaded || hasError ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Soft Ambient Radial Tint */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/90 via-slate-100 to-indigo-50/50" />

        {/* Diagonal High-Gloss Prism Light Beam Sweep */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-2/3 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-prism-sweep" />
        </div>

        {/* Minimalist Floating Glass Shimmer Badge */}
        {showIndicator && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-md border border-white/80 shadow-2xs flex items-center justify-center animate-ambient-breathe">
              <Sparkles size={14} className="text-indigo-600/70" />
            </div>
          </div>
        )}
      </div>

      {/* Error Fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center z-10">
          <ImageOff size={22} className="mb-1 text-slate-400/80" />
          <span className="text-[10px] font-semibold text-slate-500">Image unavailable</span>
        </div>
      ) : isInView ? (
        <img
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover relative z-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isLoaded
              ? 'opacity-100 blur-0 scale-100'
              : 'opacity-0 blur-md scale-[1.03]'
          } ${className}`}
          {...props}
        />
      ) : null}
    </div>
  );
};

export default LazyImage;
