import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
  });

  it('falls back to system theme when persisted theme is invalid', () => {
    window.localStorage.setItem('theme', 'sepia');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('sepia')).toBe(false);
    expect(window.localStorage.getItem('theme')).toBe('system');
  });
});
