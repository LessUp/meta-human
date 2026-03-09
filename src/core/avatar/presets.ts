/**
 * 预设动作配置
 *
 * 从 DigitalHumanEngine 中拆分，集中管理所有预设组合动作的配置。
 * 新增动作时只需在此文件添加配置，无需修改引擎核心。
 */

import type { EmotionType, ExpressionType, BehaviorType } from '../types'

// ============================================================
// 表情与情感映射
// ============================================================

export const EMOTION_TO_EXPRESSION: Record<EmotionType, ExpressionType> = {
  neutral: 'neutral',
  happy: 'smile',
  surprised: 'surprise',
  sad: 'sad',
  angry: 'angry',
}

// ============================================================
// 动画 → 行为映射
// ============================================================

export const ANIMATION_TO_BEHAVIOR: Record<string, BehaviorType> = {
  wave: 'greeting',
  greet: 'greeting',
  nod: 'listening',
  shakeHead: 'idle',
  dance: 'excited',
  think: 'thinking',
  speak: 'speaking',
  bow: 'bow',
  clap: 'clap',
  thumbsUp: 'thumbsUp',
  headTilt: 'headTilt',
  shrug: 'shrug',
  lookAround: 'lookAround',
  cheer: 'cheer',
  sleep: 'sleep',
  crossArms: 'crossArms',
  point: 'point',
}

// ============================================================
// 验证集合
// ============================================================

export const VALID_EXPRESSIONS: ExpressionType[] = [
  'neutral', 'smile', 'laugh', 'surprise', 'sad', 'angry',
  'blink', 'eyebrow_raise', 'eye_blink', 'mouth_open', 'head_nod',
]

export const VALID_EMOTIONS: EmotionType[] = [
  'neutral', 'happy', 'surprised', 'sad', 'angry',
]

export const VALID_BEHAVIORS: BehaviorType[] = [
  'idle', 'greeting', 'listening', 'thinking', 'speaking', 'excited',
  'wave', 'greet', 'think', 'nod', 'shakeHead', 'dance', 'speak',
  'waveHand', 'raiseHand',
  'bow', 'clap', 'thumbsUp', 'headTilt', 'shrug',
  'lookAround', 'cheer', 'sleep', 'crossArms', 'point',
]

// ============================================================
// 预设组合动作定义
// ============================================================

export interface PresetAction {
  /** 预设名称 */
  name: string
  /** 设置的情感 */
  emotion: EmotionType
  /** 设置的表情（可选，默认由情感映射） */
  expression?: ExpressionType
  /** 播放的动画 */
  animation: string
  /** 是否自动恢复 */
  autoReset?: boolean
}

/**
 * 预设组合动作注册表
 *
 * 新增预设动作只需在此添加配置项。
 */
export const PRESET_ACTIONS: Record<string, PresetAction> = {
  greeting: {
    name: '打招呼',
    emotion: 'happy',
    animation: 'wave',
  },
  thinking: {
    name: '思考',
    emotion: 'neutral',
    animation: 'think',
  },
  listening: {
    name: '聆听',
    emotion: 'neutral',
    animation: 'nod',
    autoReset: false,
  },
  bow: {
    name: '鞠躬',
    emotion: 'neutral',
    animation: 'bow',
  },
  clap: {
    name: '拍手',
    emotion: 'happy',
    animation: 'clap',
  },
  thumbsUp: {
    name: '竖大拇指',
    emotion: 'happy',
    animation: 'thumbsUp',
  },
  cheer: {
    name: '欢呼',
    emotion: 'happy',
    expression: 'laugh',
    animation: 'cheer',
  },
  shrug: {
    name: '耸肩',
    emotion: 'surprised',
    animation: 'shrug',
  },
  sleep: {
    name: '睡觉',
    emotion: 'neutral',
    expression: 'sad',
    animation: 'sleep',
  },
}
