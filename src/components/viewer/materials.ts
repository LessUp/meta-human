// 共享材质定义 — 参考 AIRI 柔和动漫风格
// 将材质配置集中管理，避免组件内部重复创建
// v3：新增完整材质参数 + React JSX 工厂函数

import * as THREE from "three";

// ============================================================
// 材质参数常量
// ============================================================

// 皮肤材质参数
export const SKIN_PARAMS = {
  color: "#fdd9c4",
  metalness: 0.0,
  roughness: 0.42,
  clearcoat: 0.25,
  clearcoatRoughness: 0.3,
  envMapIntensity: 0.7,
  sheen: 0.5,
  sheenColor: "#ffb8c6",
  transmission: 0.08,
  thickness: 1.0,
} as const;

// 皮肤阴影区材质参数
export const SKIN_SHADOW_PARAMS = {
  color: "#f0c4aa",
  metalness: 0.0,
  roughness: 0.5,
  clearcoat: 0.15,
  sheen: 0.3,
  sheenColor: "#e8a090",
} as const;

// 衣服主体材质参数
export const CLOTH_PARAMS = {
  color: "#f0f4ff",
  metalness: 0.02,
  roughness: 0.55,
  clearcoat: 0.18,
  clearcoatRoughness: 0.35,
  envMapIntensity: 0.7,
  sheen: 0.15,
  sheenColor: "#ddd6fe",
} as const;

// 衣服强调色材质参数
export const CLOTH_ACCENT_PARAMS = {
  color: "#7b8fba",
  metalness: 0.06,
  roughness: 0.42,
  clearcoat: 0.3,
  clearcoatRoughness: 0.25,
  envMapIntensity: 0.9,
} as const;

// 衣服细线材质参数
export const CLOTH_LINE_PARAMS = {
  color: "#98aed0",
  metalness: 0.04,
  roughness: 0.4,
  clearcoat: 0.2,
} as const;

// 头发材质参数
export const HAIR_PARAMS = {
  color: "#2e1f3e",
  metalness: 0.1,
  roughness: 0.28,
  clearcoat: 0.75,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.6,
  sheen: 0.55,
  sheenColor: "#a78bfa",
} as const;

// 头发高光材质参数
export const HAIR_HIGHLIGHT_PARAMS = {
  color: "#6d4c9e",
  metalness: 0.08,
  roughness: 0.25,
  clearcoat: 0.75,
  clearcoatRoughness: 0.08,
  envMapIntensity: 2.0,
  sheen: 0.6,
  sheenColor: "#d8b4fe",
} as const;

// 头发尖端渐变材质参数
export const HAIR_TIP_PARAMS = {
  color: "#9b72cf",
  metalness: 0.06,
  roughness: 0.3,
  clearcoat: 0.6,
  envMapIntensity: 1.5,
  sheen: 0.5,
  sheenColor: "#e9d5ff",
} as const;

// 眼白材质参数
export const EYE_WHITE_PARAMS = {
  color: "#f8fafc",
  metalness: 0.0,
  roughness: 0.12,
} as const;

// 袜子材质参数
export const SOCK_PARAMS = {
  color: "#f8f0ff",
  metalness: 0.0,
  roughness: 0.65,
  sheen: 0.2,
  sheenColor: "#e8dff5",
} as const;

// 鞋子材质参数
export const SHOE_PARAMS = {
  color: "#2e1f3e",
  metalness: 0.12,
  roughness: 0.35,
  clearcoat: 0.4,
  clearcoatRoughness: 0.2,
} as const;

// 金属（金色饰品）材质参数
export const GOLD_PARAMS = {
  color: "#e8b84b",
  metalness: 0.85,
  roughness: 0.15,
  clearcoat: 0.9,
  envMapIntensity: 2.0,
} as const;

// 腮红材质参数
export const BLUSH_PARAMS = {
  color: "#f9a8d4",
  transparent: true,
  opacity: 0.22,
} as const;

// ============================================================
// 发光材质参数
// ============================================================

// 柔紫色发光
export const GLOW_SOFT_PARAMS = {
  color: "#c4b5fd",
  emissive: "#c4b5fd",
  emissiveIntensity: 1.5,
  toneMapped: false,
} as const;

// 粉色发光
export const GLOW_PINK_PARAMS = {
  color: "#f9a8d4",
  emissive: "#f9a8d4",
  emissiveIntensity: 1.2,
  toneMapped: false,
} as const;

// ============================================================
// 情绪颜色映射
// ============================================================

export const EMOTION_LIGHT_COLORS: Record<string, string> = {
  neutral: "#a78bfa",
  happy: "#86efac",
  sad: "#93c5fd",
  angry: "#fca5a5",
  surprised: "#fcd34d",
  excited: "#f9a8d4",
};

// ============================================================
// 虹膜/瞳孔颜色参数
// ============================================================

export const IRIS_PARAMS = {
  outer: { color: "#4c1d95", emissive: "#5b21b6", emissiveIntensity: 0.3 },
  middle: { color: "#7c3aed", emissive: "#a78bfa", emissiveIntensity: 0.5 },
  pupil: {
    color: "#0f0320",
    emissive: "#7c3aed",
    emissiveIntensity: 1.0,
    toneMapped: false,
  },
  ring: {
    color: "#c084fc",
    emissive: "#a855f7",
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.6,
    toneMapped: false,
  },
} as const;

// 嘴唇颜色参数
export const LIP_PARAMS = {
  color: "#c4607e",
  emissive: "#e8a0bf",
  emissiveIntensity: 0.3,
} as const;

// ============================================================
// 模型缓存（跨组件共享）
// ============================================================
export const modelCache = new Map<string, THREE.Group>();
