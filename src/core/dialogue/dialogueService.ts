/**
 * @deprecated 此文件为兼容层，请迁移到新模块：
 * - 对话服务: import { createDialogueService } from '@/core/dialogue/service'
 * - 降级响应: import { getFallbackResponse } from '@/core/dialogue/fallback'
 */

import { getCoreInstances } from "../index";

// 重新导出类型（兼容旧接口）
export type {
  ChatRequestPayload,
  ChatResponsePayload,
  DialogueServiceConfig,
} from "../types";
export { DialogueApiError } from "./service";

// 兼容旧函数导出
export async function checkServerHealth() {
  const { dialogue } = getCoreInstances();
  return dialogue.checkHealth();
}

export function clearSession(sessionId: string) {
  const { dialogue } = getCoreInstances();
  dialogue.clearSession(sessionId);
}

export function getSessionHistory(sessionId: string) {
  const { dialogue } = getCoreInstances();
  return dialogue.getSessionHistory(sessionId);
}

export async function sendUserInput(
  payload: {
    sessionId?: string;
    userText: string;
    meta?: Record<string, unknown>;
  },
  config?: any,
) {
  const { dialogue } = getCoreInstances();
  return dialogue.sendUserInput(payload, config);
}

export async function* streamUserInput(payload: {
  sessionId?: string;
  userText: string;
  meta?: Record<string, unknown>;
}) {
  const { dialogue } = getCoreInstances();
  yield* dialogue.streamUserInput(payload);
}
