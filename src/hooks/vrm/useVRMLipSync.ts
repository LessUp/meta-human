/**
 * VRM 唇形同步 — 借鉴 AIRI 项目的 winner+runner 双通道混合算法
 * 只混合权重最大的两个口型，避免 A 口型主导的问题
 */
import type { VRMCore } from '@pixiv/three-vrm-core';

type LipKey = 'A' | 'E' | 'I' | 'O' | 'U';

const LIP_KEYS: LipKey[] = ['A', 'E', 'I', 'O', 'U'];

// VRM 表情名映射
const BLENDSHAPE_MAP: Record<LipKey, string> = {
  A: 'aa',
  E: 'ee',
  I: 'ih',
  O: 'oh',
  U: 'ou',
};

// 平滑参数
const ATTACK = 50;         // 口型张开速度
const RELEASE = 30;        // 口型闭合速度
const CAP = 0.7;           // 最大权重
const SILENCE_VOL = 0.04;  // 静音阈值
const IDLE_MS = 160;       // 静音等待时间

export interface VRMLipSyncController {
  update: (vrm: VRMCore | undefined, delta: number, isSpeaking: boolean) => void;
}

export function useVRMLipSync(): VRMLipSyncController {
  // 每个口型的平滑状态
  const smoothState: Record<LipKey, number> = { A: 0, E: 0, I: 0, O: 0, U: 0 };
  let lastActiveAt = 0;
  let phase = 0;

  function update(vrm: VRMCore | undefined, delta: number, isSpeaking: boolean) {
    if (!vrm?.expressionManager) return;

    const now = performance.now();
    phase += delta * 12;

    // 模拟口型权重（真实场景应从音频分析获得）
    const projected: Record<LipKey, number> = { A: 0, E: 0, I: 0, O: 0, U: 0 };

    if (isSpeaking) {
      // 用多频叠加模拟自然说话的口型变化
      projected.A = (Math.sin(phase * 1.0) * 0.5 + 0.5) * 0.6;
      projected.E = (Math.sin(phase * 1.3 + 1.2) * 0.5 + 0.5) * 0.4;
      projected.I = (Math.sin(phase * 0.8 + 2.4) * 0.5 + 0.5) * 0.3;
      projected.O = (Math.sin(phase * 0.6 + 3.6) * 0.5 + 0.5) * 0.5;
      projected.U = (Math.sin(phase * 0.9 + 4.8) * 0.5 + 0.5) * 0.35;
    }

    // 找出权重最大的两个口型（winner + runner）
    let winner: LipKey = 'I';
    let runner: LipKey = 'E';
    let winnerVal = -Infinity;
    let runnerVal = -Infinity;

    for (const key of LIP_KEYS) {
      const val = projected[key];
      if (val > winnerVal) {
        runnerVal = winnerVal;
        runner = winner;
        winnerVal = val;
        winner = key;
      } else if (val > runnerVal) {
        runnerVal = val;
        runner = key;
      }
    }

    // 静音检测
    let silent = !isSpeaking || winnerVal < SILENCE_VOL;
    if (!silent) lastActiveAt = now;
    if (now - lastActiveAt > IDLE_MS) silent = true;

    // 构建目标值：只混合 winner 和 runner 两个口型
    const target: Record<LipKey, number> = { A: 0, E: 0, I: 0, O: 0, U: 0 };
    if (!silent) {
      target[winner] = Math.min(CAP, winnerVal);
      target[runner] = Math.min(CAP * 0.5, runnerVal * 0.6);
    }

    // 平滑过渡并应用到 VRM 表情
    for (const key of LIP_KEYS) {
      const from = smoothState[key];
      const to = target[key];
      const rate = 1 - Math.exp(-(to > from ? ATTACK : RELEASE) * delta);
      smoothState[key] = from + (to - from) * rate;
      const weight = smoothState[key] <= 0.01 ? 0 : smoothState[key] * 0.7;
      vrm.expressionManager.setValue(BLENDSHAPE_MAP[key], weight);
    }
  }

  return { update };
}
