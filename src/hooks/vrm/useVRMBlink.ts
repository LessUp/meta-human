/**
 * VRM 眨眼动画 — 借鉴 AIRI 项目的正弦曲线眨眼
 * 随机间隔自然眨眼，使用 sin 曲线实现平滑闭合/睁开
 */
import type { VRMCore } from '@pixiv/three-vrm-core';

const BLINK_DURATION = 0.2;       // 单次眨眼持续时间（秒）
const MIN_BLINK_INTERVAL = 1;     // 最短眨眼间隔
const MAX_BLINK_INTERVAL = 6;     // 最长眨眼间隔

export interface VRMBlinkController {
  update: (vrm: VRMCore | undefined, delta: number) => void;
}

export function useVRMBlink(): VRMBlinkController {
  let isBlinking = false;
  let blinkProgress = 0;
  let timeSinceLastBlink = 0;
  let nextBlinkTime = Math.random() * (MAX_BLINK_INTERVAL - MIN_BLINK_INTERVAL) + MIN_BLINK_INTERVAL;

  function update(vrm: VRMCore | undefined, delta: number) {
    if (!vrm?.expressionManager) return;

    timeSinceLastBlink += delta;

    // 触发下次眨眼
    if (!isBlinking && timeSinceLastBlink >= nextBlinkTime) {
      isBlinking = true;
      blinkProgress = 0;
    }

    // 眨眼动画进行中
    if (isBlinking) {
      blinkProgress += delta / BLINK_DURATION;

      // 使用正弦曲线实现平滑眨眼
      const blinkValue = Math.sin(Math.PI * blinkProgress);
      vrm.expressionManager.setValue('blink', blinkValue);

      // 眨眼结束
      if (blinkProgress >= 1) {
        isBlinking = false;
        timeSinceLastBlink = 0;
        vrm.expressionManager.setValue('blink', 0);
        nextBlinkTime = Math.random() * (MAX_BLINK_INTERVAL - MIN_BLINK_INTERVAL) + MIN_BLINK_INTERVAL;
      }
    }
  }

  return { update };
}
