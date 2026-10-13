import React, { useEffect, useState } from 'react';
import { requestProgressBar } from '../../utils/requestProgressBar';

/**
 * Global top progress bar for all network request hits and route navigations.
 * Features a glowing gradient, responsive trickle animation, and seamless fade-out.
 */
export const GlobalProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = requestProgressBar.subscribe((p, visible) => {
      setProgress(p);
      setIsVisible(visible);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      id="global-network-progress-bar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none transition-opacity duration-300 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Active Loading Bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-cyan-400 via-indigo-600 via-purple-600 to-pink-500 relative"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.8), 0 0 6px rgba(236, 72, 153, 0.6), 0 0 2px rgba(34, 211, 238, 0.8)',
          transition: progress === 100 
            ? 'width 180ms ease-out' 
            : 'width 260ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Forward-facing luminous tip flare */}
        <div 
          className="absolute right-0 top-[-2px] bottom-[-2px] w-20 bg-gradient-to-r from-transparent to-white opacity-80"
          style={{
            boxShadow: '0 0 8px #ffffff, 0 0 14px rgba(99, 102, 241, 0.9)',
            borderRadius: '9999px',
          }}
        />
      </div>

      {/* Subtle spinner indicator in top-right corner */}
      {isVisible && (
        <div className="fixed top-2.5 right-3.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 text-[10px] font-medium text-indigo-300 shadow-lg shadow-indigo-500/10 animate-fade-in pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="tracking-wide uppercase text-[9px] opacity-90">Syncing</span>
        </div>
      )}
    </div>
  );
};

export default GlobalProgressBar;
