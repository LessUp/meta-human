import { useState, useEffect } from 'react';

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useTouch(): { isTouchDevice: boolean } {
  const [touch, setTouch] = useState(isTouchDevice);

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  return { isTouchDevice: touch };
}
