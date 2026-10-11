import type { Variants } from 'framer-motion';
import { motionTokens } from './motionTokens';

/**
 * Standard Framer Motion Variants using GPU-accelerated properties (opacity, transform)
 */

export const fadeInVariant: Variants = {
  hidden: { opacity: 0 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    transition: {
      duration: custom?.duration ?? motionTokens.duration.normal,
      delay: custom?.delay ?? 0,
      ease: motionTokens.easing.smooth,
    },
  }),
};

export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.medium },
  visible: (custom?: { delay?: number; duration?: number; distance?: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? motionTokens.duration.moderate,
      delay: custom?.delay ?? 0,
      ease: motionTokens.easing.standard,
    },
  }),
};

export const fadeDownVariant: Variants = {
  hidden: { opacity: 0, y: -motionTokens.distance.medium },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? motionTokens.duration.moderate,
      delay: custom?.delay ?? 0,
      ease: motionTokens.easing.standard,
    },
  }),
};

export const fadeLeftVariant: Variants = {
  hidden: { opacity: 0, x: -motionTokens.distance.large },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom?.duration ?? motionTokens.duration.moderate,
      delay: custom?.delay ?? 0,
      ease: motionTokens.easing.standard,
    },
  }),
};

export const fadeRightVariant: Variants = {
  hidden: { opacity: 0, x: motionTokens.distance.large },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom?.duration ?? motionTokens.duration.moderate,
      delay: custom?.delay ?? 0,
      ease: motionTokens.easing.standard,
    },
  }),
};

export const scaleInVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: custom?.duration ?? motionTokens.duration.normal,
      delay: custom?.delay ?? 0,
      ease: motionTokens.easing.standard,
    },
  }),
};

export const staggerContainerVariant = (staggerDelay: number = motionTokens.stagger.normal, initialDelay: number = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: initialDelay,
    },
  },
});

export const staggerItemVariant: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.medium, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionTokens.duration.moderate,
      ease: motionTokens.easing.standard,
    },
  },
};

// Subtle card hover interaction (no aggressive jumps)
export const cardHoverVariant: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.standard,
    },
  },
  tap: {
    scale: 0.99,
    transition: {
      duration: motionTokens.duration.instant,
      ease: motionTokens.easing.snappy,
    },
  },
};

// Tactile button interaction
export const buttonTapVariant: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard },
  },
  tap: {
    scale: 0.97,
    transition: { duration: motionTokens.duration.instant, ease: motionTokens.easing.snappy },
  },
};

// Modal transitions (fast backdrop, smooth dialog scale)
export const modalBackdropVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard },
  },
};

export const modalDialogVariant: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: motionTokens.distance.small },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.standard },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: motionTokens.distance.small,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard },
  },
};

// Page transition
export const pageTransitionVariant: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.small },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.moderate,
      ease: motionTokens.easing.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.standard,
    },
  },
};
