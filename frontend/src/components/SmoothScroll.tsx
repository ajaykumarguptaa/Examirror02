import React from 'react';

/**
 * Native Hardware Scroll Provider
 * Uses browser native inertia & 120Hz smooth scrolling for maximum responsiveness
 */
export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
