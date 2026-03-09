/**
 * ID 生成工具
 *
 * 提供各模块使用的唯一 ID 生成函数。
 */

/**
 * 生成带前缀的唯一 ID
 */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 生成会话 ID
 */
export function createSessionId(): string {
  return createId('session')
}

/**
 * 生成错误 ID
 */
export function createErrorId(): string {
  return createId('error')
}
