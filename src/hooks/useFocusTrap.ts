import { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus within a container element when active.
 * Tab/Shift+Tab cycle through focusable elements. On activation
 * or when focusKey changes, focuses the first focusable element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  focusKey?: unknown,
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const selector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(selector));

    // Focus first element on activation or focusKey change
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = getFocusable();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive, focusKey]);

  return containerRef;
}
