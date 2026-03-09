/**
 * @deprecated 此文件为兼容层，请迁移到新模块：
 * - 编排器: import { createDialogueOrchestrator } from '@/core/dialogue/orchestrator'
 */

import { getCoreInstances } from "../index";
import type { ChatResponsePayload } from "../types";

// 重新导出类型
export type { DialogueHandleOptions } from "./orchestrator";

// 兼容旧函数导出
export function waitForAnimationComplete(): Promise<void> {
  const { orchestrator } = getCoreInstances();
  return orchestrator.waitForAnimationComplete();
}

export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options?: any,
): Promise<void> {
  const { orchestrator } = getCoreInstances();
  return orchestrator.handleResponse(res, options);
}

export function handleUserEmotion(emotion: string): void {
  const { orchestrator } = getCoreInstances();
  orchestrator.handleUserEmotion(emotion);
}

export function handleUserMotion(
  motion: "nod" | "shakeHead" | "raiseHand" | "waveHand",
): void {
  const { orchestrator } = getCoreInstances();
  orchestrator.handleUserMotion(motion);
}
