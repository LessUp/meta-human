/**
 * VRM 模块化 Hooks — 借鉴 AIRI 项目架构
 */
export { useVRMLoader } from "./useVRMLoader";
export { useVRMEmote } from "./useVRMEmote";
export type { VRMEmoteController } from "./useVRMEmote";
export { useVRMBlink } from "./useVRMBlink";
export type { VRMBlinkController } from "./useVRMBlink";
export { useVRMLipSync } from "./useVRMLipSync";
export type { VRMLipSyncController } from "./useVRMLipSync";
export { useVRMEyeSaccades } from "./useVRMEyeSaccades";
export type { VRMEyeSaccadesController } from "./useVRMEyeSaccades";
export {
  loadVRMAnimation,
  clipFromVRMAnimation,
  reAnchorRootPositionTrack,
  createVRMAnimationController,
} from "./useVRMAnimation";
export type { VRMAnimationController } from "./useVRMAnimation";
