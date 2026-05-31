/**
 * 服务容器 Context。
 *
 * React Context 用于提供服务实例。
 */

import { createContext } from 'react';
import type { Services } from '@/core/serviceComposition';

/**
 * 服务 Context。
 * 由 ServicesProvider 提供，通过 useServices 等 hooks 消费。
 */
export const ServicesContext = createContext<Services | null>(null);
