/**
 * Pure TypeScript utility functions for Debouncing and Throttling
 * Usable inside or outside React components.
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: any = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastRan = 0;
  let lastTimeout: any = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (!inThrottle) {
      func.apply(context, args);
      lastRan = now;
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      if (lastTimeout) clearTimeout(lastTimeout);
      lastTimeout = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, Math.max(limit - (now - lastRan), 0));
    }
  };
}
