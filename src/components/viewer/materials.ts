// 共享材质定义 — 参考 AIRI 柔和动漫风格
// 将材质配置集中管理，避免组件内部重复创建

import * as THREE from 'three';

// 皮肤材质参数
export const SKIN_PARAMS = {
  color: '#fdd9c4',
  metalness: 0.0,
  roughness: 0.45,
  clearcoat: 0.2,
  clearcoatRoughness: 0.35,
  envMapIntensity: 0.6,
  sheen: 0.4,
  sheenColor: '#ffb8c6',
  transmission: 0.05,
  thickness: 0.8,
} as const;

// 衣服主体材质参数
export const CLOTH_PARAMS = {
  color: '#f0f4ff',
  metalness: 0.02,
  roughness: 0.6,
  clearcoat: 0.15,
  clearcoatRoughness: 0.4,
  envMapIntensity: 0.6,
  sheen: 0.1,
  sheenColor: '#ddd6fe',
} as const;

// 衣服强调色材质参数
export const CLOTH_ACCENT_PARAMS = {
  color: '#8b9dc3',
  metalness: 0.05,
  roughness: 0.45,
  clearcoat: 0.25,
  clearcoatRoughness: 0.3,
  envMapIntensity: 0.8,
} as const;

// 头发材质参数
export const HAIR_PARAMS = {
  color: '#2e1f3e',
  metalness: 0.1,
  roughness: 0.32,
  clearcoat: 0.7,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.5,
  sheen: 0.5,
  sheenColor: '#a78bfa',
} as const;

// 头发高光材质参数
export const HAIR_HIGHLIGHT_PARAMS = {
  color: '#6d4c9e',
  metalness: 0.08,
  roughness: 0.3,
  clearcoat: 0.7,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.8,
  sheen: 0.55,
  sheenColor: '#d8b4fe',
} as const;

// 鞋子材质参数
export const SHOE_PARAMS = {
  color: '#2e1f3e',
  metalness: 0.1,
  roughness: 0.4,
  clearcoat: 0.35,
} as const;

// 情绪颜色映射
export const EMOTION_LIGHT_COLORS: Record<string, string> = {
  neutral: '#a78bfa',
  happy: '#86efac',
  sad: '#93c5fd',
  angry: '#fca5a5',
  surprised: '#fcd34d',
  excited: '#f9a8d4',
};

// 模型缓存（跨组件共享）
export const modelCache = new Map<string, THREE.Group>();
