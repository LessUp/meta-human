/**
 * 对话编排器（重构版）
 *
 * 从原 dialogueOrchestrator.ts 重构，去除对 Zustand store 的直接依赖。
 * 协调对话响应的情感设置、动画播放和语音合成。
 */

import type {
  ChatResponsePayload,
  BehaviorType,
  EmotionType,
  StoreBridge,
} from '../types'
import { coreEvents } from '../events'
import { VALID_EMOTIONS, VALID_BEHAVIORS } from '../avatar/presets'
import type { DigitalHumanEngine } from '../avatar/engine'

// ============================================================
// 编排器配置
// ============================================================

export interface OrchestratorOptions {
  store: StoreBridge
  engine: DigitalHumanEngine
}

export interface DialogueHandleOptions {
  isMuted?: boolean
  speakWith?: (text: string) => Promise<void> | void
  addAssistantMessage?: boolean
  waitForSpeech?: boolean
  transitionDuration?: number
}

// ============================================================
// 内部验证工具
// ============================================================

function validateEmotion(emotion: string): EmotionType {
  if (VALID_EMOTIONS.includes(emotion as EmotionType)) {
    return emotion as EmotionType
  }
  console.warn(`无效的情感值: ${emotion}, 使用默认 neutral`)
  return 'neutral'
}

function validateAction(action: string): BehaviorType {
  if (VALID_BEHAVIORS.includes(action as BehaviorType)) {
    return action as BehaviorType
  }
  console.warn(`无效的动作值: ${action}, 使用默认 idle`)
  return 'idle'
}

function logStateTransition(from: string, to: string, type: string): void {
  if (import.meta.env.DEV) {
    console.debug(`[Orchestrator] ${type}: ${from} → ${to}`)
  }
}

/**
 * 创建对话编排器
 */
export function createDialogueOrchestrator(options: OrchestratorOptions) {
  const { store, engine } = options

  // ============================================================
  // 状态转换管理
  // ============================================================

  async function transitionState(
    fromState: BehaviorType,
    toState: BehaviorType,
    duration: number = 300,
  ): Promise<void> {
    logStateTransition(fromState, toState, 'behavior')

    if (duration > 0 && fromState !== toState) {
      await new Promise(resolve => setTimeout(resolve, duration))
    }

    store.setBehavior(toState)
  }

  // ============================================================
  // 公共 API
  // ============================================================

  return {
    /**
     * 处理对话响应
     *
     * 协调情感设置、动画播放和语音合成的完整流程。
     */
    async handleResponse(
      res: ChatResponsePayload,
      handleOptions: DialogueHandleOptions = {},
    ): Promise<void> {
      const {
        isMuted = false,
        speakWith,
        addAssistantMessage = true,
        waitForSpeech = true,
        transitionDuration = 0,
      } = handleOptions

      // 1. 添加助手消息到聊天历史
      if (addAssistantMessage && res.replyText) {
        store.addChatMessage('assistant', res.replyText)
      }

      // 2. 验证并设置情感
      const validEmotion = validateEmotion(res.emotion)
      const prevEmotion = store.getEmotion()
      logStateTransition(prevEmotion, validEmotion, 'emotion')
      engine.setEmotion(validEmotion)

      // 3. 验证并设置动作
      const validAction = validateAction(res.action)
      if (validAction !== 'idle') {
        const prevBehavior = store.getBehavior()
        logStateTransition(prevBehavior, validAction, 'action')
        engine.playAnimation(validAction, !waitForSpeech)
      }

      // 4. 语音合成（如果未静音）
      if (res.replyText && !isMuted && speakWith) {
        store.setBehavior('speaking')

        try {
          await speakWith(res.replyText)
        } catch (error) {
          console.error('语音合成失败:', error)
        }

        if (waitForSpeech) {
          await transitionState('speaking', 'idle', transitionDuration)
          engine.setEmotion('neutral')
        }
      } else if (isMuted) {
        // 静音时：更新视觉状态但跳过语音
        if (validAction !== 'idle') {
          setTimeout(() => {
            store.setBehavior('idle')
            store.setEmotion('neutral')
          }, 3000)
        }
      }
    },

    /**
     * 处理用户情绪输入（来自视觉服务）
     */
    handleUserEmotion(emotion: string): void {
      if (store.isSpeaking() || store.isLoading()) return

      const validEmotion = validateEmotion(emotion)
      engine.setEmotion(validEmotion)
    },

    /**
     * 处理用户动作输入（来自视觉服务）
     */
    handleUserMotion(motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand'): void {
      if (store.isSpeaking() || store.isLoading()) return

      const motionToAnimation: Record<string, string> = {
        nod: 'nod',
        shakeHead: 'shakeHead',
        waveHand: 'wave',
        raiseHand: 'greet',
      }

      const animation = motionToAnimation[motion]
      if (animation) {
        engine.playAnimation(animation)
      }
    },

    /**
     * 等待动画完成
     */
    waitForAnimationComplete(): Promise<void> {
      return engine.waitForCurrentAnimation()
    },

    /**
     * 销毁编排器
     */
    dispose(): void {
      // 编排器无需特殊清理
    },
  }
}

export type DialogueOrchestrator = ReturnType<typeof createDialogueOrchestrator>
