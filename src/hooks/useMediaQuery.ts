import { useState, useEffect } from 'react';

/**
 * 媒体查询 Hook
 * 监听窗口大小变化，返回是否匹配指定的媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // 初始同步
    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * 移动端检测 Hook
 * 断点与 Tailwind 的 md (768px) 保持一致
 */
export default function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
