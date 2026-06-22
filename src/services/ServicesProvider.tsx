/**
 * 服务容器 Provider。
 *
 * 通过 React Context 提供应用级单例服务。
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createServiceComposition, type ServiceComposition } from '@/core/serviceComposition';
import { applyRuntimeApiEndpoints } from '@/core/dialogue/dialogueService';
import { useSystemStore } from '@/store/systemStore';
import { ServicesContext } from './servicesContext';

// ============================================================================
// Provider
// ============================================================================

interface ServicesProviderProps {
  children: ReactNode;
  composition?: ServiceComposition;
  createComposition?: () => ServiceComposition;
}

/**
 * 提供应用级服务单例。
 * 在应用根组件包装使用。
 */
export function ServicesProvider({
  children,
  composition,
  createComposition,
}: ServicesProviderProps) {
  const ownedCompositionRef = useRef<ServiceComposition | null>(null);

  if (composition === undefined && ownedCompositionRef.current === null) {
    ownedCompositionRef.current = createComposition?.() ?? createServiceComposition();
  }

  const serviceComposition = composition ?? ownedCompositionRef.current!;

  // 启动时应用持久化的运行时 API 端点配置（优先于 env）
  useEffect(() => {
    if (composition) return;
    const { runtimeApiConfig } = useSystemStore.getState();
    if (runtimeApiConfig?.baseUrl) {
      applyRuntimeApiEndpoints(runtimeApiConfig.baseUrl, runtimeApiConfig.fallbacks ?? '');
    }
  }, [composition]);

  useEffect(() => {
    if (composition) {
      return;
    }

    return () => {
      ownedCompositionRef.current?.dispose();
      ownedCompositionRef.current = null;
    };
  }, [composition]);

  return (
    <ServicesContext.Provider value={serviceComposition.services}>
      {children}
    </ServicesContext.Provider>
  );
}
