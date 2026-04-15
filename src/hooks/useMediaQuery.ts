import { useState, useEffect, useRef } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    setMatches(mql.matches);

    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Returns a ref containing whether the tab is currently visible.
 * Uses a ref to avoid re-renders in animation loops.
 */
export function useIsTabVisibleRef(): { readonly current: boolean } {
  // Use a mutable object that persists across renders
  const ref = useRef(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      ref.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return ref;
}
