/**
 * 服务容器工厂。
 *
 * 创建服务实例，使用集中式 adapters 与 Zustand store 交互。
 */

import {
  createServiceComposition,
  type CreateServiceCompositionOptions,
} from './serviceComposition';
import type { Services } from './servicesContext';

// ============================================================================
// 服务工厂
// ============================================================================

/**
 * 创建服务实例。
 * 使用集中式 adapters 操作 Zustand store。
 */
export function createServices(options: CreateServiceCompositionOptions = {}): Services {
  return createServiceComposition(options).services;
}
