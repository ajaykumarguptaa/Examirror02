import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useThrottle: Throttles a rapidly changing value (e.g. scroll position, mouse coordinates).
 * Ensures the value updates at most once every interval milliseconds.
 *
 * @param value The value to throttle
 * @param interval Minimum time in milliseconds between updates (default: 300ms)
 */
export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLast = now - lastExecuted.current;

    if (timeSinceLast >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLast);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * useThrottledCallback: Throttles a callback function execution.
 * Ideal for scroll listeners, window resize, and spammy click prevention.
 *
 * @param callback The function to throttle
 * @param interval Minimum time in milliseconds between executions (default: 300ms)
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastRan.current;

      if (elapsed >= interval) {
        lastRan.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          callbackRef.current(...args);
        }, interval - elapsed);
      }
    },
    [interval]
  );
}

export default useThrottle;
