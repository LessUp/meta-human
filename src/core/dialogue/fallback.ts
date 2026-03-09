/**
 * 对话降级响应
 *
 * 从 dialogueService.ts 拆分，集中管理离线/错误时的降级回复逻辑。
 */

import type { ChatResponsePayload } from '../types'

/**
 * 智能降级响应 - 基于用户输入生成
 */
export function getFallbackResponse(
  userText: string,
  _context?: { emotion?: string; lastTopic?: string },
): ChatResponsePayload {
  const lowerText = userText.toLowerCase()

  // 问候语
  const greetings = ['你好', '您好', 'hello', 'hi', '嗨', '早上好', '下午好', '晚上好']
  if (greetings.some(g => lowerText.includes(g))) {
    return {
      replyText: '您好！很高兴见到您。由于网络问题，我目前处于离线模式，但仍然可以进行简单的交互。',
      emotion: 'happy',
      action: 'wave',
    }
  }

  // 感谢
  if (lowerText.includes('谢谢') || lowerText.includes('感谢') || lowerText.includes('thank')) {
    return {
      replyText: '不客气！很高兴能帮到您。',
      emotion: 'happy',
      action: 'nod',
    }
  }

  // 再见
  if (lowerText.includes('再见') || lowerText.includes('拜拜') || lowerText.includes('bye')) {
    return {
      replyText: '再见！期待下次与您交流。',
      emotion: 'happy',
      action: 'wave',
    }
  }

  // 询问状态
  if (lowerText.includes('怎么样') || lowerText.includes('如何') || lowerText.includes('好吗')) {
    return {
      replyText: '我现在状态不错，谢谢关心！不过由于网络问题，我暂时无法提供完整的服务。',
      emotion: 'neutral',
      action: 'nod',
    }
  }

  // 默认响应
  return {
    replyText: '抱歉，我暂时无法连接到服务器。请检查网络连接后重试，或者稍后再来。',
    emotion: 'neutral',
    action: 'idle',
  }
}

/**
 * 获取用户友好的 HTTP 错误消息
 */
export function getHttpErrorMessage(status: number, defaultMessage: string): string {
  const messages: Record<number, string> = {
    400: '请求格式错误，请重试',
    401: '认证失败，请刷新页面',
    403: '访问被拒绝',
    404: '服务不可用，请稍后重试',
    408: '请求超时，请重试',
    429: '请求过于频繁，请稍后重试',
    500: '服务器内部错误，请稍后重试',
    502: '网关错误，请稍后重试',
    503: '服务暂时不可用，请稍后重试',
    504: '网关超时，请稍后重试',
  }
  return messages[status] || defaultMessage
}
