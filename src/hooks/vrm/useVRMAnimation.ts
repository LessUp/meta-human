/**
 * VRM 动画加载与播放 — 借鉴 AIRI 项目的 AnimationMixer 模式
 * 支持 .vrma 动画剪辑加载、AnimationMixer 管理、根位置锚定
 */
import type { VRMCore } from '@pixiv/three-vrm-core';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import { createVRMAnimationClip } from '@pixiv/three-vrm-animation';
import { AnimationMixer, VectorKeyframeTrack, Vector3 } from 'three';
import { useVRMLoader } from './useVRMLoader';

// .vrma 文件加载后的 userData 类型
interface VRMAUserdata extends Record<string, unknown> {
  vrmAnimations?: VRMAnimation[];
}

/**
 * 加载 .vrma 动画文件
 */
export async function loadVRMAnimation(url: string): Promise<VRMAnimation | undefined> {
  const loader = useVRMLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const userData = gltf.userData as VRMAUserdata;
        if (!userData.vrmAnimations || userData.vrmAnimations.length === 0) {
          console.warn('未在 .vrma 文件中找到 VRM 动画');
          resolve(undefined);
          return;
        }
        resolve(userData.vrmAnimations[0]);
      },
      undefined,
      (error) => {
        console.error('加载 VRM 动画失败:', error);
        reject(error);
      },
    );
  });
}

/**
 * 从 VRMAnimation 创建 AnimationClip
 */
export function clipFromVRMAnimation(vrm: VRMCore, animation: VRMAnimation) {
  return createVRMAnimationClip(animation, vrm);
}

/**
 * 重锚定根位置轨道 — 参考 AIRI reAnchorRootPositionTrack
 * 确保动画播放时模型不会跳到错误位置
 */
export function reAnchorRootPositionTrack(
  clip: ReturnType<typeof createVRMAnimationClip>,
  vrm: VRMCore,
) {
  const hipNode = vrm.humanoid?.getNormalizedBoneNode('hips');
  if (!hipNode) {
    console.warn('VRM 模型中未找到 hips 节点');
    return;
  }

  hipNode.updateMatrixWorld(true);
  const defaultHipPos = new Vector3();
  hipNode.getWorldPosition(defaultHipPos);

  // 查找 hips 位置轨道
  const hipsTrack = clip.tracks.find(
    (track) =>
      track instanceof VectorKeyframeTrack &&
      track.name === `${hipNode.name}.position`,
  );

  if (!(hipsTrack instanceof VectorKeyframeTrack)) {
    return; // 没有位置轨道，无需锚定
  }

  // 计算动画第一帧 hips 位置与默认位置的偏移
  const animeHipPos = new Vector3(
    hipsTrack.values[0],
    hipsTrack.values[1],
    hipsTrack.values[2],
  );
  const animeDelta = new Vector3().subVectors(animeHipPos, defaultHipPos);

  // 对所有位置轨道应用偏移修正
  clip.tracks.forEach((track) => {
    if (
      track.name.endsWith('.position') &&
      track instanceof VectorKeyframeTrack
    ) {
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] -= animeDelta.x;
        track.values[i + 1] -= animeDelta.y;
        track.values[i + 2] -= animeDelta.z;
      }
    }
  });
}

/**
 * VRM 动画控制器接口
 */
export interface VRMAnimationController {
  /** 当前是否有动画在播放 */
  isPlaying: boolean;
  /** 加载并播放 .vrma 闲置动画 */
  loadAndPlay: (url: string) => Promise<void>;
  /** 每帧更新 AnimationMixer */
  update: (delta: number) => void;
  /** 停止所有动画 */
  stop: () => void;
  /** 清理资源 */
  dispose: () => void;
}

/**
 * 创建 VRM 动画控制器 — 管理 AnimationMixer 和动画剪辑
 */
export function createVRMAnimationController(
  vrm: VRMCore,
): VRMAnimationController {
  let mixer: AnimationMixer | null = null;
  let isPlaying = false;

  async function loadAndPlay(url: string) {
    try {
      const animation = await loadVRMAnimation(url);
      if (!animation) {
        console.warn('动画加载返回空');
        return;
      }

      const clip = clipFromVRMAnimation(vrm, animation);
      if (!clip) {
        console.warn('无法创建动画剪辑');
        return;
      }

      // 锚定根位置
      reAnchorRootPositionTrack(clip, vrm);

      // 创建或复用 AnimationMixer
      if (!mixer) {
        mixer = new AnimationMixer(vrm.scene);
      }

      // 播放动画
      const action = mixer.clipAction(clip);
      action.play();
      isPlaying = true;

      console.log('VRM 动画已加载并播放:', url);
    } catch (err) {
      console.error('加载 VRM 动画失败:', err);
    }
  }

  function update(delta: number) {
    mixer?.update(delta);
  }

  function stop() {
    mixer?.stopAllAction();
    isPlaying = false;
  }

  function dispose() {
    stop();
    mixer = null;
  }

  return {
    get isPlaying() {
      return isPlaying;
    },
    loadAndPlay,
    update,
    stop,
    dispose,
  };
}
