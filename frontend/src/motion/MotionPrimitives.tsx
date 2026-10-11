import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, type HTMLMotionProps } from 'framer-motion';
import { motionTokens } from './motionTokens';
import {
  fadeInVariant,
  fadeUpVariant,
  fadeDownVariant,
  fadeLeftVariant,
  fadeRightVariant,
  scaleInVariant,
  staggerContainerVariant,
  staggerItemVariant,
  cardHoverVariant,
  buttonTapVariant,
  pageTransitionVariant,
} from './motionVariants';
import { useReducedMotion } from './useReducedMotion';

interface BaseMotionProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * 1. FadeIn Primitive
 */
export const FadeIn: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = motionTokens.duration.normal,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 2. FadeUp Primitive
 */
export const FadeUp: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = motionTokens.duration.moderate,
  distance = motionTokens.distance.medium,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      custom={{ delay, duration, distance }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 3. FadeDown Primitive
 */
export const FadeDown: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = motionTokens.duration.moderate,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={fadeDownVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 4. FadeLeft Primitive
 */
export const FadeLeft: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = motionTokens.duration.moderate,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={fadeLeftVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 5. FadeRight Primitive
 */
export const FadeRight: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = motionTokens.duration.moderate,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={fadeRightVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 6. ScaleIn Primitive
 */
export const ScaleIn: React.FC<BaseMotionProps> = ({
  children,
  delay = 0,
  duration = motionTokens.duration.normal,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={scaleInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 7. StaggerContainer & StaggerItem Primitives
 */
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number;
  initialDelay?: number;
  once?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = motionTokens.stagger.normal,
  initialDelay = 0.05,
  once = true,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={staggerContainerVariant(staggerDelay, initialDelay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.05 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<BaseMotionProps> = ({
  children,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div variants={staggerItemVariant} className={className} {...props}>
      {children}
    </motion.div>
  );
};

/**
 * 8. High Performance RAF-based NumberCounter
 * Supports currency, prefixes, suffixes, decimals, formatting, and reactive InView trigger.
 */
interface NumberCounterProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  decimals?: number;
  className?: string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  prefix,
  suffix,
  durationMs = 1400,
  decimals = 0,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, margin: '0px 0px -20px 0px' });

  const rawStr = String(value ?? '');
  const prefixMatch = rawStr.match(/^[^\d.-]+/);
  const suffixMatch = rawStr.match(/[^\d.-]+$/);

  const finalPrefix = prefix !== undefined ? prefix : (prefixMatch ? prefixMatch[0] : '');
  const finalSuffix = suffix !== undefined ? suffix : (suffixMatch ? suffixMatch[0] : '');

  const cleanNumberStr = rawStr.replace(/^[^\d.-]+/, '').replace(/[^\d.-]+$/, '').replace(/,/g, '');
  const numericTarget = typeof value === 'number' ? value : (parseFloat(cleanNumberStr) || 0);

  const [displayValue, setDisplayValue] = useState<number>(() => (prefersReduced ? numericTarget : 0));
  const currentValRef = useRef<number>(prefersReduced ? numericTarget : 0);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(numericTarget);
      currentValRef.current = numericTarget;
      return;
    }

    if (!isInView && numericTarget > 0) return;

    const startVal = currentValRef.current;
    const endVal = numericTarget;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Natural ease-out cubic curve: fast start, organic deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;

      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        currentValRef.current = endVal;
        setDisplayValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, numericTarget, durationMs, prefersReduced]);

  const formattedNumber = decimals > 0
    ? displayValue.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <span ref={elementRef} className={`font-mono inline-block transform-gpu ${className}`}>
      {finalPrefix}
      {formattedNumber}
      {finalSuffix}
    </span>
  );
};

/**
 * 9. SlideText (Vertical or Horizontal dynamic text cycler)
 */
interface SlideTextProps {
  items: string[];
  intervalMs?: number;
  className?: string;
}

export const SlideText: React.FC<SlideTextProps> = ({
  items,
  intervalMs = 3200,
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (items.length <= 1 || prefersReduced) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, intervalMs, prefersReduced]);

  if (items.length === 0) return null;
  if (prefersReduced) return <span className={className}>{items[index]}</span>;

  return (
    <div className={`relative inline-block overflow-hidden align-baseline ${className}`} style={{ minHeight: '1.2em' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.standard }}
          className="inline-block"
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/**
 * 10. ScrollReveal Section Wrapper
 */
interface ScrollRevealProps extends HTMLMotionProps<'section'> {
  threshold?: number;
  once?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  threshold = 0.15,
  once = true,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <section className={className}>{children}</section>;

  return (
    <motion.section
      initial={{ opacity: 0, y: motionTokens.distance.large }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: threshold }}
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.standard }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
};

/**
 * 11. InteractiveCard (Sophisticated card with subtle lift & border transition)
 */
export const InteractiveCard: React.FC<BaseMotionProps> = ({
  children,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={cardHoverVariant}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * 12. InteractiveButton (Tactile micro-interaction button wrapper)
 */
interface InteractiveButtonProps extends HTMLMotionProps<'button'> {
  className?: string;
  children?: React.ReactNode;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <button className={className} {...(props as any)}>{children}</button>;

  return (
    <motion.button
      variants={buttonTapVariant}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * 13. PageTransition Wrapper
 */
export const PageTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={pageTransitionVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};
