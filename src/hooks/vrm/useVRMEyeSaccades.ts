/**
 * VRM 空闲眼球微动 — 借鉴 AIRI 项目的 saccade 系统
 * 模拟人类注视时的自然微小眼球运动，增加角色的生命感
 */
import type { VRMCore } from '@pixiv/three-vrm-core';
import { Object3D, Vector3 } from 'three';

// 微动间隔范围（毫秒 → 秒）
const MIN_SACCADE_INTERVAL = 0.3;
const MAX_SACCADE_INTERVAL = 2.0;
const SACCADE_RANGE = 0.25;  // 随机偏移范围

function randomSaccadeInterval(): number {
  return MIN_SACCADE_INTERVAL + Math.random() * (MAX_SACCADE_INTERVAL - MIN_SACCADE_INTERVAL);
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface VRMEyeSaccadesController {
  update: (vrm: VRMCore | undefined, lookAtTarget: { x: number; y: number; z: number }, delta: number) => void;
}

export function useVRMEyeSaccades(): VRMEyeSaccadesController {
  let nextSaccadeAfter = -1;
  const fixationTarget = new Vector3();
  let timeSinceLastSaccade = 0;

  function updateFixationTarget(base: { x: number; y: number; z: number }) {
    fixationTarget.set(
      base.x + randFloat(-SACCADE_RANGE, SACCADE_RANGE),
      base.y + randFloat(-SACCADE_RANGE, SACCADE_RANGE),
      base.z,
    );
  }

  function update(
    vrm: VRMCore | undefined,
    lookAtTarget: { x: number; y: number; z: number },
    delta: number,
  ) {
    if (!vrm?.expressionManager || !vrm.lookAt) return;

    if (timeSinceLastSaccade >= nextSaccadeAfter) {
      updateFixationTarget(lookAtTarget);
      timeSinceLastSaccade = 0;
      nextSaccadeAfter = randomSaccadeInterval();
    }

    // 确保 lookAt 有 target
    if (!vrm.lookAt.target) {
      vrm.lookAt.target = new Object3D() as any;
    }

    vrm.lookAt.target?.position.lerp(fixationTarget, 1);
    vrm.lookAt?.update(delta);

    timeSinceLastSaccade += delta;
  }

  return { update };
}
