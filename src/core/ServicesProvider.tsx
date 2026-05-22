/**
 * 服务容器 Provider。
 *
 * 通过 React Context 提供应用级单例服务。
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { createServices } from './createServices';
import { ServicesContext } from './servicesContext';

// ============================================================================
// Provider
// ============================================================================

interface ServicesProviderProps {
  children: ReactNode;
}

type OptionalDialogueService = {
  reset?: () => void;
};

/**
 * 提供应用级服务单例。
 * 在应用根组件包装使用。
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
  const services = useMemo(() => createServices(), []);

  useEffect(() => {
    return () => {
      services.asr.dispose();
      services.tts.dispose();
      services.engine.dispose();

      const dialogue = (
        services as typeof services & {
          dialogue?: OptionalDialogueService;
        }
      ).dialogue;

      if (typeof dialogue?.reset === 'function') {
        dialogue.reset();
      }
    };
  }, [services]);

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
