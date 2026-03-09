/**
 * MetaHuman Core - 统一入口
 *
 * 提供模块初始化、全局实例管理和统一导出。
 * 参考 airi 项目的模块化架构：
 * - 工厂函数创建实例
 * - 事件总线解耦通信
 * - StoreBridge 解耦状态管理
 */

import type { StoreBridge } from './types'
import { coreEvents } from './events'
import { getStoreBridge } from './store-bridge'

// 模块工厂
import { createTTSService, type TTSService } from './audio/tts-service'
import { createASRService, type ASRService } from './audio/asr-service'
import { createSpeechPipeline, type SpeechPipeline } from './audio/speech-pipeline'
import { createDigitalHumanEngine, type DigitalHumanEngine } from './avatar/engine'
import { createDialogueService, type DialogueService } from './dialogue/service'
import { createDialogueOrchestrator, type DialogueOrchestrator } from './dialogue/orchestrator'
import { createVisionService, type VisionService } from './vision/service'
import { createFPSMonitor, type FPSMonitor } from './performance/fps-monitor'
import { createVisibilityOptimizer, type VisibilityOptimizer } from './performance/visibility-optimizer'

// ============================================================
// 全局实例容器
// ============================================================

export interface CoreInstances {
  store: StoreBridge
  tts: TTSService
  asr: ASRService
  speechPipeline: SpeechPipeline
  engine: DigitalHumanEngine
  dialogue: DialogueService
  orchestrator: DialogueOrchestrator
  vision: VisionService
  fpsMonitor: FPSMonitor
  visibility: VisibilityOptimizer
}

let _instances: CoreInstances | null = null

/**
 * 初始化所有核心模块
 *
 * 创建并连接所有服务实例，建立事件订阅关系。
 * 应在应用启动时调用一次。
 */
export function initializeCore(storeOverride?: StoreBridge): CoreInstances {
  if (_instances) {
    console.warn('[Core] 已初始化，返回现有实例')
    return _instances
  }

  const store = storeOverride ?? getStoreBridge()

  // 创建各模块实例
  const tts = createTTSService({ store })
  const asr = createASRService({ store })
  const speechPipeline = createSpeechPipeline({ tts, store })
  const engine = createDigitalHumanEngine({ store })
  const dialogue = createDialogueService({ store })
  const orchestrator = createDialogueOrchestrator({ store, engine })
  const vision = createVisionService({ store })
  const fpsMonitor = createFPSMonitor({ store })
  const visibility = createVisibilityOptimizer()

  // 建立事件订阅：页面可见性 → FPS 监控
  visibility.onPause(() => fpsMonitor.stop())
  visibility.onResume(() => fpsMonitor.start())

  // 启动基础服务
  visibility.start()

  _instances = {
    store,
    tts,
    asr,
    speechPipeline,
    engine,
    dialogue,
    orchestrator,
    vision,
    fpsMonitor,
    visibility,
  }

  coreEvents.emit('system:init')

  return _instances
}

/**
 * 获取已初始化的核心实例
 */
export function getCoreInstances(): CoreInstances {
  if (!_instances) {
    return initializeCore()
  }
  return _instances
}

/**
 * 销毁所有核心模块
 */
export function disposeCore(): void {
  if (!_instances) return

  coreEvents.emit('system:dispose')

  _instances.speechPipeline.dispose()
  _instances.tts.dispose()
  _instances.asr.dispose()
  _instances.engine.dispose()
  _instances.dialogue.dispose()
  _instances.orchestrator.dispose()
  _instances.vision.dispose()
  _instances.fpsMonitor.dispose()
  _instances.visibility.dispose()

  coreEvents.clear()
  _instances = null
}

/**
 * 初始化性能监控（便捷函数，兼容旧接口）
 */
export function initPerformanceMonitoring(): () => void {
  const { fpsMonitor, visibility } = getCoreInstances()

  fpsMonitor.start()
  visibility.start()

  const unsubPause = visibility.onPause(() => fpsMonitor.stop())
  const unsubResume = visibility.onResume(() => fpsMonitor.start())

  return () => {
    fpsMonitor.stop()
    visibility.stop()
    unsubPause()
    unsubResume()
  }
}

// ============================================================
// 统一导出
// ============================================================

// 类型
export * from './types'

// 事件
export { coreEvents, type CoreEventMap, type EventBus } from './events'

// Store 桥接
export { getStoreBridge, setStoreBridge, createZustandBridge } from './store-bridge'

// 工具
export * from './utils'

// 音频
export { createTTSService, type TTSService } from './audio/tts-service'
export { createASRService, type ASRService } from './audio/asr-service'
export { createSpeechPipeline, type SpeechPipeline } from './audio/speech-pipeline'

// 数字人引擎
export { createDigitalHumanEngine, type DigitalHumanEngine } from './avatar/engine'
export { createAnimationQueue, ANIMATION_DURATIONS } from './avatar/animation-queue'
export {
  EMOTION_TO_EXPRESSION,
  ANIMATION_TO_BEHAVIOR,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  PRESET_ACTIONS,
} from './avatar/presets'

// 对话
export { createDialogueService, DialogueApiError, type DialogueService } from './dialogue/service'
export { createDialogueOrchestrator, type DialogueOrchestrator, type DialogueHandleOptions } from './dialogue/orchestrator'
export { getFallbackResponse } from './dialogue/fallback'

// 视觉
export { createVisionService, type VisionService } from './vision/service'
export { mapFaceToEmotion, analyzeFaceFeatures } from './vision/mapper'

// 性能
export { createFPSMonitor, type FPSMonitor } from './performance/fps-monitor'
export { createStateDebouncer, createDebouncedUpdater, type StateDebouncer } from './performance/state-debouncer'
export { createVisibilityOptimizer, type VisibilityOptimizer } from './performance/visibility-optimizer'
