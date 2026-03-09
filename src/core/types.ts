/**
 * MetaHuman Core - 全局类型定义
 *
 * 集中管理所有模块共享的类型，避免重复定义和循环依赖。
 * 参考 airi 项目的 types.ts 分离模式。
 */

// ============================================================
// 通用工具类型
// ============================================================

/** 可销毁资源接口 */
export interface Disposable {
  dispose(): void
}

/** 日志接口（参考 airi LoggerLike） */
export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

/** 优先级等级 */
export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low'

// ============================================================
// 情感 / 表情 / 行为 类型（从 store 提取）
// ============================================================

export type EmotionType = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry'

export type ExpressionType =
  | 'neutral' | 'smile' | 'laugh' | 'surprise' | 'sad' | 'angry'
  | 'blink' | 'eyebrow_raise' | 'eye_blink' | 'mouth_open' | 'head_nod'

export type BehaviorType =
  | 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'excited'
  | 'wave' | 'greet' | 'think' | 'nod' | 'shakeHead' | 'dance' | 'speak'
  | 'waveHand' | 'raiseHand'
  | 'bow' | 'clap' | 'thumbsUp' | 'headTilt' | 'shrug'
  | 'lookAround' | 'cheer' | 'sleep' | 'crossArms' | 'point'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

export type AvatarType = 'cyber' | 'vrm'

// ============================================================
// 音频模块类型
// ============================================================

/** TTS 配置 */
export interface TTSConfig {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

/** ASR 回调 */
export interface ASRCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
  onTimeout?: () => void
}

/** ASR 配置 */
export interface ASRConfig {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  timeout?: number
}

/** ASR 启动选项 */
export interface ASRStartOptions {
  onResult?: (text: string) => void
  mode?: 'command' | 'dictation'
  timeout?: number
}

/** 语音管线意图行为 */
export type IntentBehavior = 'queue' | 'interrupt' | 'replace'

/** 语音管线意图选项 */
export interface SpeechIntentOptions {
  intentId?: string
  priority?: PriorityLevel | number
  ownerId?: string
  behavior?: IntentBehavior
}

/** 语音管线意图句柄 */
export interface SpeechIntentHandle {
  intentId: string
  priority: number
  ownerId?: string
  write(text: string): void
  end(): void
  cancel(reason?: string): void
}

/** 语音队列项 */
export interface SpeechQueueItem {
  text: string
  config: TTSConfig
  resolve: () => void
  reject: (error: Error) => void
}

// ============================================================
// 对话模块类型
// ============================================================

/** 对话请求载荷 */
export interface ChatRequestPayload {
  sessionId?: string
  userText: string
  meta?: Record<string, unknown>
}

/** 对话响应载荷 */
export interface ChatResponsePayload {
  replyText: string
  emotion: string
  action: string
}

/** 对话服务配置 */
export interface DialogueServiceConfig {
  maxRetries: number
  retryDelay: number
  timeout: number
  maxHistoryLength: number
}

// ============================================================
// 动画引擎类型
// ============================================================

/** 动画队列项 */
export interface AnimationQueueItem {
  name: string
  duration: number
  autoReset: boolean
  onComplete?: () => void
}

/** 动画选项 */
export interface AnimationOptions {
  duration?: number
  autoReset?: boolean
  blendDuration?: number
  onComplete?: () => void
}

/** 播放动画选项 */
export interface PlayAnimationOptions extends AnimationOptions {
  immediate?: boolean
}

// ============================================================
// 视觉模块类型
// ============================================================

/** 用户情绪 */
export type UserEmotion = 'happy' | 'neutral' | 'surprised' | 'sad' | 'angry'

/** 用户动作 */
export type UserMotion = 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand'

/** 视觉服务状态 */
export type VisionStatus = 'idle' | 'initializing' | 'running' | 'error' | 'no_camera'

/** 视觉服务配置 */
export interface VisionServiceConfig {
  maxRetries: number
  retryDelay: number
  emotionDebounceMs: number
  motionCooldownMs: number
  targetFps: number
}

/** 视觉服务回调 */
export interface VisionCallbacks {
  onEmotion?: (emotion: UserEmotion) => void
  onMotion?: (motion: UserMotion) => void
  onError?: (error: string) => void
  onStatusChange?: (status: VisionStatus) => void
}

// ============================================================
// 性能监控类型
// ============================================================

/** FPS 监控配置 */
export interface FPSMonitorConfig {
  sampleSize: number
  targetFPS: number
  warningThreshold: number
}

/** 状态防抖配置 */
export interface DebounceConfig {
  maxUpdatesPerSecond: number
  debounceInterval: number
}

/** 页面可见性配置 */
export interface VisibilityConfig {
  pauseDelay: number
  resumeDelay: number
}

/** 性能指标 */
export interface PerformanceMetrics {
  fps: number
  lastFrameTime: number
}

// ============================================================
// Store 桥接接口（解耦核心模块与 Zustand）
// ============================================================

/**
 * Store 桥接接口
 *
 * 核心模块通过此接口与 UI 状态交互，
 * 而不是直接导入 Zustand store，实现完全解耦。
 * 参考 airi 的依赖注入模式。
 */
export interface StoreBridge {
  // 读取状态
  getEmotion(): EmotionType
  getBehavior(): BehaviorType
  getExpression(): ExpressionType
  isPlaying(): boolean
  isSpeaking(): boolean
  isMuted(): boolean
  isLoading(): boolean
  getSessionId(): string

  // 写入状态
  setEmotion(emotion: EmotionType): void
  setExpression(expression: ExpressionType): void
  setExpressionIntensity(intensity: number): void
  setBehavior(behavior: BehaviorType): void
  setAnimation(animation: string): void
  setPlaying(playing: boolean): void
  setSpeaking(speaking: boolean): void
  setRecording(recording: boolean): void
  setLoading(loading: boolean): void
  setConnectionStatus(status: ConnectionStatus): void
  setConnectionDetails(details: Record<string, unknown>): void

  // 消息与错误
  addChatMessage(role: 'user' | 'assistant', text: string): void
  addError(message: string): void
  clearError(): void

  // 性能
  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void

  // 控制
  play(): void
  pause(): void
  reset(): void
}
