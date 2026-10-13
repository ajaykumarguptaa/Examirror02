import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface AnimatedCounterProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState<string>('0');
  const hasAnimated = useRef(false);

  // Extract numeric part and any non-numeric suffixes embedded in the value
  const rawString = String(value);
  const numericMatch = rawString.match(/(\d+)/);
  const targetNumber = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const embeddedSuffix = rawString.replace(/\d+/g, '').trim();
  const finalSuffix = suffix || embeddedSuffix;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          const counterObj = { val: 0 };
          gsap.to(counterObj, {
            val: targetNumber,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
              const currentVal = Math.floor(counterObj.val);
              setDisplayValue(currentVal.toLocaleString('en-IN'));
            },
          });
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [targetNumber, duration]);

  return (
    <span ref={containerRef} className={`tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {finalSuffix}
    </span>
  );
};
