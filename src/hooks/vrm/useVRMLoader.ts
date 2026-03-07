/**
 * VRM 模型加载器 — 借鉴 AIRI 项目的单例模式
 * 复用同一个 GLTFLoader 实例，注册 VRMLoaderPlugin
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

let loader: GLTFLoader | null = null;

export function useVRMLoader(): GLTFLoader {
  if (loader) {
    return loader;
  }

  loader = new GLTFLoader();
  loader.crossOrigin = 'anonymous';
  loader.register((parser) => new VRMLoaderPlugin(parser));

  return loader;
}
