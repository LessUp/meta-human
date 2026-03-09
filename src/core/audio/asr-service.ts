/**
 * ASR 语音识别服务
 *
 * 从原 audioService.ts 拆分，去除对 Zustand store 的直接依赖。
 * 通过 StoreBridge + EventBus 与外部通信。
 */

import type { ASRConfig, ASRCallbacks, ASRStartOptions, StoreBridge } from '../types'
import { coreEvents } from '../events'

// ============================================================
// 浏览器 SpeechRecognition 类型（避免 @types/dom-speech-recognition 依赖）
// ============================================================

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }>
type SpeechRecognitionResultListLike = ArrayLike<SpeechRecognitionResultLike>

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultListLike
  resultIndex?: number
}

type SpeechRecognitionErrorEventLike = {
  error: string
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

/** ASR 服务配置 */
export interface ASRServiceOptions {
  store: StoreBridge
  config?: ASRConfig
}

/**
 * 创建 ASR 服务（工厂函数模式）
 */
export function createASRService(options: ASRServiceOptions) {
  const { store } = options
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

  let recognition: SpeechRecognitionLike | null = null
  let callbacks: ASRCallbacks = {}
  let onResultCallback: ((text: string) => void) | null = null
  let mode: 'command' | 'dictation' = 'command'
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let isRunning = false

  const config: Required<ASRConfig> = {
    lang: options.config?.lang ?? 'zh-CN',
    continuous: options.config?.continuous ?? false,
    interimResults: options.config?.interimResults ?? true,
    maxAlternatives: options.config?.maxAlternatives ?? 1,
    timeout: options.config?.timeout ?? 30000,
  }

  // ============================================================
  // 内部工具方法
  // ============================================================

  function getPermissionErrorMessage(error: { name?: string; message?: string }): string {
    const errorName = error.name || ''
    const messages: Record<string, string> = {
      NotAllowedError: '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风',
      NotFoundError: '未检测到麦克风设备，请确保麦克风已连接',
      NotReadableError: '麦克风被其他应用占用，请关闭其他使用麦克风的程序',
    }
    return messages[errorName] || `麦克风访问失败: ${error.message || errorName}`
  }

  function getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音，请重试',
      'audio-capture': '无法访问麦克风，请检查权限',
      'not-allowed': '麦克风权限被拒绝',
      'network': '网络错误，请检查连接',
      'aborted': '语音识别被中断',
      'language-not-supported': '不支持当前语言',
    }
    return errorMessages[error] || `语音识别失败: ${error}`
  }

  function setupTimeout(timeout: number): void {
    clearTimeoutTimer()
    timeoutId = setTimeout(() => {
      console.warn('语音识别超时')
      callbacks.onTimeout?.()
      coreEvents.emit('audio:asr:timeout')
      stop()
    }, timeout)
  }

  function resetTimeout(): void {
    if (timeoutId && config.timeout) {
      clearTimeoutTimer()
      setupTimeout(config.timeout)
    }
  }

  function clearTimeoutTimer(): void {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function cleanup(): void {
    clearTimeoutTimer()
    isRunning = false
    store.setRecording(false)
    store.setBehavior('idle')
  }

  // ============================================================
  // 初始化识别器
  // ============================================================

  function initRecognition(): void {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    recognition = new SpeechRecognition()

    recognition!.continuous = config.continuous
    recognition!.interimResults = config.interimResults
    recognition!.lang = config.lang
    recognition!.maxAlternatives = config.maxAlternatives

    recognition!.onstart = () => {
      isRunning = true
      store.setBehavior('listening')
      callbacks.onStart?.()
      coreEvents.emit('audio:asr:start')
    }

    recognition!.onresult = (event: SpeechRecognitionEventLike) => {
      resetTimeout()

      let finalTranscript = ''
      let interimTranscript = ''

      const startIndex = event.resultIndex ?? 0
      for (let i = startIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript ?? ''
        if ((event.results[i] as any)?.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript) {
        callbacks.onTranscript?.(interimTranscript, false)
        coreEvents.emit('audio:asr:result', { text: interimTranscript, isFinal: false })
      }

      if (finalTranscript) {
        callbacks.onTranscript?.(finalTranscript, true)
        coreEvents.emit('audio:asr:result', { text: finalTranscript, isFinal: true })
        onResultCallback?.(finalTranscript)
      }
    }

    recognition!.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error('语音识别错误:', event.error)
      const errorMsg = getErrorMessage(event.error)
      cleanup()
      store.addError(errorMsg)
      callbacks.onError?.(errorMsg)
      coreEvents.emit('audio:asr:error', { error: errorMsg })
    }

    recognition!.onend = () => {
      cleanup()
      callbacks.onEnd?.()
      coreEvents.emit('audio:asr:end')
    }
  }

  if (isSupported) {
    initRecognition()
  }

  // ============================================================
  // 公共 API
  // ============================================================

  function stop(): void {
    clearTimeoutTimer()

    if (recognition && isSupported) {
      try {
        recognition.stop()
      } catch {
        // 忽略停止错误
      }
    }

    onResultCallback = null
    mode = 'command'
    isRunning = false
    store.setRecording(false)
    store.setBehavior('idle')
  }

  return {
    /**
     * 设置回调
     */
    setCallbacks(newCallbacks: ASRCallbacks): void {
      callbacks = newCallbacks
    },

    /**
     * 检查浏览器是否支持语音识别
     */
    checkSupport(): boolean {
      return isSupported
    },

    /**
     * 检查麦克风权限
     */
    async checkPermission(): Promise<PermissionState> {
      try {
        const result = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        })
        return result.state
      } catch {
        return 'prompt'
      }
    },

    /**
     * 请求麦克风权限
     */
    async requestPermission(): Promise<boolean> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        return true
      } catch (error: any) {
        console.error('麦克风权限请求失败:', error)
        const errorMsg = getPermissionErrorMessage(error)
        store.addError(errorMsg)
        return false
      }
    },

    /**
     * 启动语音识别
     */
    async start(startOptions?: ASRStartOptions): Promise<boolean> {
      if (!isSupported) {
        console.warn('浏览器不支持语音识别')
        store.addError('浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器')
        return false
      }

      // 处理 double-start
      if (isRunning) {
        console.warn('语音识别已在运行，重用现有会话')
        onResultCallback = startOptions?.onResult ?? null
        mode = startOptions?.mode ?? 'command'
        return true
      }

      // 检查权限
      const permission = await this.checkPermission()
      if (permission === 'denied') {
        store.addError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风')
        return false
      }

      if (permission === 'prompt') {
        const granted = await this.requestPermission()
        if (!granted) return false
      }

      onResultCallback = startOptions?.onResult ?? null
      mode = startOptions?.mode ?? 'command'
      const timeout = startOptions?.timeout ?? config.timeout

      try {
        recognition!.start()
        store.setRecording(true)
        setupTimeout(timeout)
        return true
      } catch (error: any) {
        console.error('启动语音识别失败:', error)

        if (error.message?.includes('already started')) {
          isRunning = true
          return true
        }

        store.addError('启动语音识别失败')
        return false
      }
    },

    /**
     * 停止语音识别
     */
    stop,

    /**
     * 中断语音识别
     */
    abort(): void {
      clearTimeoutTimer()

      if (recognition && isSupported) {
        try {
          recognition.abort()
        } catch {
          // 忽略中断错误
        }
      }

      cleanup()
    },

    /**
     * 是否正在运行
     */
    isRunning(): boolean {
      return isRunning
    },

    /**
     * 获取当前模式
     */
    getMode(): 'command' | 'dictation' {
      return mode
    },

    /**
     * 销毁服务
     */
    dispose(): void {
      stop()
      recognition = null
      callbacks = {}
    },
  }
}

export type ASRService = ReturnType<typeof createASRService>
