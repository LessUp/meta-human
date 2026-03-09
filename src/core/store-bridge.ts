/**
 * MetaHuman Core - Store 桥接层
 *
 * 将 Zustand store 适配为 StoreBridge 接口，
 * 使核心模块完全解耦于具体的状态管理实现。
 * 参考 airi 项目的依赖注入模式。
 */

import type { StoreBridge } from './types'
import { useDigitalHumanStore } from '../store/digitalHumanStore'

/**
 * 创建基于 Zustand 的 StoreBridge 实现
 */
export function createZustandBridge(): StoreBridge {
  const getState = () => useDigitalHumanStore.getState()

  return {
    // 读取状态
    getEmotion: () => getState().currentEmotion,
    getBehavior: () => getState().currentBehavior,
    getExpression: () => getState().currentExpression,
    isPlaying: () => getState().isPlaying,
    isSpeaking: () => getState().isSpeaking,
    isMuted: () => getState().isMuted,
    isLoading: () => getState().isLoading,
    getSessionId: () => getState().sessionId,

    // 写入状态
    setEmotion: (emotion) => getState().setEmotion(emotion),
    setExpression: (expression) => getState().setExpression(expression),
    setExpressionIntensity: (intensity) => getState().setExpressionIntensity(intensity),
    setBehavior: (behavior) => getState().setBehavior(behavior),
    setAnimation: (animation) => getState().setAnimation(animation),
    setPlaying: (playing) => getState().setPlaying(playing),
    setSpeaking: (speaking) => getState().setSpeaking(speaking),
    setRecording: (recording) => getState().setRecording(recording),
    setLoading: (loading) => getState().setLoading(loading),
    setConnectionStatus: (status) => getState().setConnectionStatus(status),
    setConnectionDetails: (details) => getState().setConnectionDetails(details),

    // 消息与错误
    addChatMessage: (role, text) => getState().addChatMessage(role, text),
    addError: (message) => getState().addError(message),
    clearError: () => getState().clearError(),

    // 性能
    updatePerformanceMetrics: (metrics) => getState().updatePerformanceMetrics(metrics),

    // 控制
    play: () => getState().play(),
    pause: () => getState().pause(),
    reset: () => getState().reset(),
  }
}

// ============================================================
// 全局桥接实例（惰性初始化）
// ============================================================

let _bridge: StoreBridge | null = null

/**
 * 获取全局 StoreBridge 实例
 */
export function getStoreBridge(): StoreBridge {
  if (!_bridge) {
    _bridge = createZustandBridge()
  }
  return _bridge
}

/**
 * 注入自定义 StoreBridge（用于测试或替换实现）
 */
export function setStoreBridge(bridge: StoreBridge): void {
  _bridge = bridge
}

/**
 * 重置桥接实例
 */
export function resetStoreBridge(): void {
  _bridge = null
}
