import { useEffect, useRef } from 'react';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

/**
 * 自动错误清除 Hook
 * 错误出现后 5 秒自动消失
 */
export function useAutoError() {
  const { error, clearError } = useDigitalHumanStore();
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      errorTimeoutRef.current = setTimeout(() => {
        clearError();
      }, 5000);
    }
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error, clearError]);

  return { error, clearError };
}
