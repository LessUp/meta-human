// 类型定义 — 从 digitalHumanStore.ts 提取
// 参考 AIRI 项目，将类型独立管理

// ============================================================
// 表情/情绪/行为类型
// ============================================================

export type EmotionType = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';

export type ExpressionType =
  | 'neutral' | 'smile' | 'laugh' | 'surprise' | 'sad' | 'angry'
  | 'blink' | 'eyebrow_raise' | 'eye_blink' | 'mouth_open' | 'head_nod';

export type BehaviorType =
  | 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'excited'
  | 'wave' | 'greet' | 'think' | 'nod' | 'shakeHead' | 'dance' | 'speak'
  | 'waveHand' | 'raiseHand' | 'bow' | 'clap' | 'thumbsUp' | 'headTilt'
  | 'shrug' | 'lookAround' | 'cheer' | 'sleep' | 'crossArms' | 'point';

// ============================================================
// 连接/模型类型
// ============================================================

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export type AvatarType = 'cyber' | 'vrm';

// ============================================================
// 数据接口
// ============================================================

export interface ErrorItem {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: number;
  dismissable: boolean;
  autoHideMs?: number;
}

export interface ConnectionDetails {
  lastConnectedAt: number | null;
  lastErrorAt: number | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface PerformanceMetrics {
  fps: number;
  lastFrameTime: number;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}
