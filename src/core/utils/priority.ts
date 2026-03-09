/**
 * 优先级解析工具
 *
 * 参考 airi 项目的 priority.ts，提供语义化优先级到数值的映射。
 * 用于语音管线、动画队列等需要优先级调度的场景。
 */

import type { PriorityLevel } from '../types'

/** 默认优先级数值映射 */
const DEFAULT_LEVELS: Record<PriorityLevel, number> = {
  critical: 300,
  high: 200,
  normal: 100,
  low: 0,
}

/** 优先级解析器接口 */
export interface PriorityResolver {
  resolve(priority?: PriorityLevel | number): number
}

/**
 * 创建优先级解析器
 *
 * @param levels - 自定义优先级数值映射
 */
export function createPriorityResolver(
  levels?: Partial<Record<PriorityLevel, number>>,
): PriorityResolver {
  const resolved = { ...DEFAULT_LEVELS, ...levels }

  return {
    resolve(priority?: PriorityLevel | number) {
      if (priority == null) return resolved.normal
      if (typeof priority === 'number') return priority
      return resolved[priority] ?? resolved.normal
    },
  }
}

/**
 * 比较两个优先级数值
 *
 * @returns 1 如果 a > b, -1 如果 a < b, 0 如果相等
 */
export function comparePriority(a: number, b: number): number {
  if (a === b) return 0
  return a > b ? 1 : -1
}
