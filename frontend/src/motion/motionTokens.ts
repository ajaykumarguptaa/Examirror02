/**
 * Centralized Production Motion Design System Tokens
 * Defines standardized timing, easings, distances, and staggers for a coherent, premium SaaS UX.
 */

export const motionTokens = {
  // Duration in seconds (for Framer Motion & CSS)
  duration: {
    instant: 0.12,   // 120ms - micro interactions, tooltips
    fast: 0.18,      // 180ms - buttons, toggles, badges
    normal: 0.3,     // 300ms - dropdowns, accordions, tabs
    moderate: 0.45,  // 450ms - card reveals, modals, page transitions
    slow: 0.65,      // 650ms - large sections, hero elements
    hero: 0.75,      // 750ms - initial hero sequence
    floating: 5.0,   // 5s - continuous ambient movement
  },

  // Distances for translate animations (in pixels)
  distance: {
    micro: 4,
    small: 8,
    medium: 16,
    large: 28,
    hero: 40,
  },

  // Stagger intervals (in seconds)
  stagger: {
    tight: 0.04,     // 40ms - fast lists, icons
    normal: 0.07,    // 70ms - cards, grid items
    relaxed: 0.1,    // 100ms - large sections, features
  },

  // Easing curves (GPU accelerated)
  easing: {
    // Premium custom cubic-bezier curves
    standard: [0.22, 1, 0.36, 1] as const,     // Quick start, natural decelerate
    smooth: [0.16, 1, 0.3, 1] as const,        // High-end smooth transition
    snappy: [0.25, 0.1, 0.25, 1] as const,      // Responsive UI interactions
    gentle: [0.33, 1, 0.68, 1] as const,       // Soft organic reveals
    bounceSubtle: [0.34, 1.4, 0.64, 1] as const, // Subtle tactile overshoot
  },

  // Spring configurations for physics-based interaction
  spring: {
    snappy: { type: 'spring', stiffness: 450, damping: 30 },
    gentle: { type: 'spring', stiffness: 280, damping: 24 },
    bouncy: { type: 'spring', stiffness: 400, damping: 18 },
    smooth: { type: 'spring', stiffness: 200, damping: 20 },
  }
} as const;

export type MotionTokens = typeof motionTokens;
