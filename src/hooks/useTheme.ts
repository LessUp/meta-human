import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
const VALID_THEMES: ReadonlySet<Theme> = new Set(['light', 'dark', 'system']);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

function isValidTheme(value: string | null): value is Theme {
  return value !== null && VALID_THEMES.has(value as Theme);
}

function getStoredTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem('theme');
    return isValidTheme(storedTheme) ? storedTheme : 'system';
  } catch {
    return 'system';
  }
}

function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Ignore storage write failures
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return getStoredTheme();
  });

  const resolved = resolveTheme(theme);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    setStoredTheme(theme);
  }, [theme, resolved]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(getSystemTheme());
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = resolveTheme(prev);
      return current === 'light' ? 'dark' : 'light';
    });
  }, []);

  return {
    theme,
    resolvedTheme: resolved,
    setTheme,
    toggleTheme,
    isDark: resolved === 'dark',
  };
}
