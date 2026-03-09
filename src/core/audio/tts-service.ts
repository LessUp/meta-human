/**
 * TTS 语音合成服务
 *
 * 从原 audioService.ts 拆分，去除对 Zustand store 的直接依赖。
 * 通过 StoreBridge + EventBus 与外部通信。
 */

import type { TTSConfig, SpeechQueueItem, StoreBridge } from '../types'
import { coreEvents } from '../events'

/** TTS 服务配置 */
export interface TTSServiceOptions {
  store: StoreBridge
  config?: TTSConfig
}

/**
 * 创建 TTS 服务（工厂函数模式，参考 airi createPlaybackManager）
 */
export function createTTSService(options: TTSServiceOptions) {
  const { store } = options
  const synth = window.speechSynthesis
  let voices: SpeechSynthesisVoice[] = []
  let config: Required<TTSConfig> = {
    lang: options.config?.lang ?? 'zh-CN',
    rate: options.config?.rate ?? 1.0,
    pitch: options.config?.pitch ?? 1.0,
    volume: options.config?.volume ?? 0.8,
  }
  let isInitialized = false
  const speechQueue: SpeechQueueItem[] = []
  let isProcessingQueue = false

  // 加载语音列表
  function loadVoices(): void {
    const loadVoiceList = () => {
      voices = synth.getVoices()
      isInitialized = voices.length > 0
    }
    loadVoiceList()
    if (!isInitialized) {
      synth.onvoiceschanged = loadVoiceList
    }
  }

  loadVoices()

  // 立即播放语音（内部方法）
  function speakImmediate(text: string, speakConfig: Required<TTSConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speakConfig.lang
      utterance.rate = speakConfig.rate
      utterance.pitch = speakConfig.pitch
      utterance.volume = speakConfig.volume

      // 选择合适的语音
      const preferredVoice = voices.find(voice =>
        voice.lang.includes(speakConfig.lang.split('-')[0]),
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        store.setSpeaking(true)
        store.setBehavior('speaking')
        coreEvents.emit('audio:tts:start', { text })
      }

      utterance.onend = () => {
        // 只有队列为空时才重置状态
        if (speechQueue.length === 0) {
          store.setSpeaking(false)
          store.setBehavior('idle')
        }
        coreEvents.emit('audio:tts:end', { text })
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('语音合成错误:', event)
        store.setSpeaking(false)
        store.setBehavior('idle')
        store.addError(`语音合成失败: ${event.error}`)
        coreEvents.emit('audio:tts:error', { error: event.error })
        reject(new Error(event.error))
      }

      synth.speak(utterance)
    })
  }

  // 处理语音队列
  async function processQueue(): Promise<void> {
    if (isProcessingQueue || speechQueue.length === 0) {
      return
    }

    isProcessingQueue = true

    while (speechQueue.length > 0) {
      const item = speechQueue.shift()!
      try {
        await speakImmediate(item.text, item.config as Required<TTSConfig>)
        item.resolve()
      } catch (error) {
        item.reject(error as Error)
      }
    }

    isProcessingQueue = false
  }

  return {
    /**
     * 更新 TTS 配置
     */
    updateConfig(newConfig: Partial<TTSConfig>): void {
      config = { ...config, ...newConfig } as Required<TTSConfig>
    },

    /**
     * 获取可用语音列表
     */
    getVoices(): SpeechSynthesisVoice[] {
      return voices
    },

    /**
     * 检查浏览器是否支持语音合成
     */
    isSupported(): boolean {
      return 'speechSynthesis' in window
    },

    /**
     * 是否正在播放语音
     */
    isSpeaking(): boolean {
      return synth.speaking || isProcessingQueue
    },

    /**
     * 获取队列长度
     */
    getQueueLength(): number {
      return speechQueue.length
    },

    /**
     * 清空队列
     */
    clearQueue(): void {
      speechQueue.forEach(item => {
        item.reject(new Error('Queue cleared'))
      })
      speechQueue.length = 0
      synth.cancel()
      isProcessingQueue = false
      store.setSpeaking(false)
      store.setBehavior('idle')
    },

    /**
     * 语音合成（支持队列）
     */
    speak(text: string, speakConfig?: Partial<TTSConfig>): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!text.trim()) {
          resolve()
          return
        }

        const mergedConfig = { ...config, ...speakConfig }

        speechQueue.push({
          text,
          config: mergedConfig,
          resolve,
          reject,
        })

        if (!isProcessingQueue) {
          processQueue()
        }
      })
    },

    /**
     * 停止播放
     */
    stop(): void {
      speechQueue.forEach(item => {
        item.reject(new Error('Queue cleared'))
      })
      speechQueue.length = 0
      synth.cancel()
      isProcessingQueue = false
      store.setSpeaking(false)
      store.setBehavior('idle')
    },

    /**
     * 暂停播放
     */
    pause(): void {
      synth.pause()
    },

    /**
     * 恢复播放
     */
    resume(): void {
      synth.resume()
    },

    /**
     * 销毁服务
     */
    dispose(): void {
      speechQueue.forEach(item => {
        item.reject(new Error('Service disposed'))
      })
      speechQueue.length = 0
      synth.cancel()
      isProcessingQueue = false
    },
  }
}

export type TTSService = ReturnType<typeof createTTSService>
