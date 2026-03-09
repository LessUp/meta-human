/**
 * 视觉服务（重构版）
 *
 * 从原 visionService.ts 重构，去除对 Zustand store 的直接依赖。
 * 通过 StoreBridge + EventBus 与外部通信。
 */

import type {
  UserEmotion,
  UserMotion,
  VisionStatus,
  VisionCallbacks,
  VisionServiceConfig,
  StoreBridge,
} from '../types'
import { coreEvents } from '../events'
import { mapFaceToEmotion } from './mapper'

// ============================================================
// MediaPipe 类型
// ============================================================

type Landmark = { x: number; y: number; z: number }
type FaceMeshResultsLike = { multiFaceLandmarks?: Landmark[][] }
type PoseLandmark = { x: number; y: number }
type PoseResultsLike = { poseLandmarks?: PoseLandmark[] }

type MediaPipeModelLike = {
  setOptions: (options: Record<string, unknown>) => void
  onResults: (callback: (results: unknown) => void) => void
  send: (input: { image: HTMLVideoElement }) => Promise<void>
}

type FaceMeshModuleLike = {
  FaceMesh: new (options: { locateFile: (file: string) => string }) => MediaPipeModelLike
}

type PoseModuleLike = {
  Pose: new (options: { locateFile: (file: string) => string }) => MediaPipeModelLike
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_CONFIG: VisionServiceConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  emotionDebounceMs: 500,
  motionCooldownMs: 800,
  targetFps: 30,
}

// ============================================================
// 服务选项
// ============================================================

export interface VisionServiceOptions {
  store: StoreBridge
  config?: Partial<VisionServiceConfig>
}

/**
 * 创建视觉服务（工厂函数模式）
 */
export function createVisionService(options: VisionServiceOptions) {
  const { store } = options
  const config: VisionServiceConfig = { ...DEFAULT_CONFIG, ...options.config }

  // 内部状态
  let video: HTMLVideoElement | null = null
  let stream: MediaStream | null = null
  let running = false
  let status: VisionStatus = 'idle'
  let faceMesh: MediaPipeModelLike | null = null
  let pose: MediaPipeModelLike | null = null
  let callbacks: VisionCallbacks = {}

  // 运动检测历史
  let yawHistory: number[] = []
  let pitchHistory: number[] = []
  let leftWristXHistory: number[] = []
  let rightWristXHistory: number[] = []
  let lastUpperBodyMotionTime = 0

  // FPS 统计
  let frameCount = 0
  let lastFpsTime = 0
  let fps = 0

  // 情绪防抖
  let lastEmotionTime = 0
  let lastEmotion: UserEmotion | null = null
  let emotionStableCount = 0

  // 动作冷却
  let lastMotionTime = 0
  let lastMotion: string | null = null

  // ============================================================
  // 内部工具方法
  // ============================================================

  function setStatus(newStatus: VisionStatus): void {
    status = newStatus
    callbacks.onStatusChange?.(newStatus)
    coreEvents.emit('vision:status:change', { status: newStatus })
  }

  function handleError(message: string, error?: unknown): void {
    console.error(message, error)
    setStatus('error')
    callbacks.onError?.(message)
    store.addError(message)
    coreEvents.emit('vision:error', { error: message })
  }

  function delayMs(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function debounceEmotion(emotion: UserEmotion): UserEmotion | null {
    const now = performance.now()
    if (lastEmotion === emotion) {
      emotionStableCount++
    } else {
      emotionStableCount = 1
      lastEmotion = emotion
    }
    if (now - lastEmotionTime < config.emotionDebounceMs) {
      return null
    }
    if (emotionStableCount >= 3) {
      lastEmotionTime = now
      return emotion
    }
    return null
  }

  function shouldEmitMotion(motion: string): boolean {
    const now = performance.now()
    if (now - lastMotionTime < config.motionCooldownMs) {
      return false
    }
    if (motion === lastMotion && now - lastMotionTime < config.motionCooldownMs * 2) {
      return false
    }
    lastMotionTime = now
    lastMotion = motion
    return true
  }

  function getCameraErrorMessage(error: unknown): string {
    const err = error as { name?: string; message?: string }
    const errorName = err.name || ''
    const errorMessages: Record<string, string> = {
      NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
      NotFoundError: '未检测到摄像头设备，请确保摄像头已连接',
      NotReadableError: '摄像头被其他应用占用，请关闭其他使用摄像头的程序',
      OverconstrainedError: '摄像头不支持请求的分辨率',
      SecurityError: '安全限制：请通过 HTTPS 访问或在本地运行',
      AbortError: '摄像头访问被中断',
    }
    return errorMessages[errorName] || `摄像头访问失败: ${err.message || errorName}`
  }

  // ============================================================
  // 面部/姿态关键点提取
  // ============================================================

  function getFaceLandmarks(results: unknown): Landmark[] | undefined {
    if (!results || typeof results !== 'object') return undefined
    const typed = results as FaceMeshResultsLike
    const landmarks = typed.multiFaceLandmarks?.[0]
    return Array.isArray(landmarks) ? landmarks : undefined
  }

  function getPoseLandmarks(results: unknown): PoseLandmark[] | undefined {
    if (!results || typeof results !== 'object') return undefined
    const typed = results as PoseResultsLike
    const landmarks = typed.poseLandmarks
    return Array.isArray(landmarks) ? landmarks : undefined
  }

  function computeHeadPose(landmarks: Landmark[] | undefined): { yaw: number; pitch: number } | null {
    if (!landmarks || landmarks.length < 300) return null
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    const nose = landmarks[1]
    const forehead = landmarks[10]
    const chin = landmarks[152]
    if (!leftEye || !rightEye || !nose || !forehead || !chin) return null
    const centerX = (leftEye.x + rightEye.x) / 2
    const yaw = nose.x - centerX
    const midY = (forehead.y + chin.y) / 2
    const pitch = nose.y - midY
    return { yaw, pitch }
  }

  function detectHeadMotion(landmarks: Landmark[] | undefined): 'nod' | 'shakeHead' | null {
    const headPose = computeHeadPose(landmarks)
    if (!headPose) return null
    const { yaw, pitch } = headPose
    yawHistory.push(yaw)
    pitchHistory.push(pitch)
    if (yawHistory.length > 20) yawHistory.shift()
    if (pitchHistory.length > 20) pitchHistory.shift()
    if (yawHistory.length < 10 || pitchHistory.length < 10) return null
    const yawMin = Math.min(...yawHistory)
    const yawMax = Math.max(...yawHistory)
    const pitchMin = Math.min(...pitchHistory)
    const pitchMax = Math.max(...pitchHistory)
    const yawRange = yawMax - yawMin
    const pitchRange = pitchMax - pitchMin
    const nodThreshold = 0.04
    const shakeThreshold = 0.04
    const tolerance = 0.02
    if (pitchRange > nodThreshold && yawRange < tolerance) {
      yawHistory = []
      pitchHistory = []
      return 'nod'
    }
    if (yawRange > shakeThreshold && pitchRange < tolerance) {
      yawHistory = []
      pitchHistory = []
      return 'shakeHead'
    }
    return null
  }

  function detectUpperBodyMotion(results: unknown): 'raiseHand' | 'waveHand' | null {
    const landmarks = getPoseLandmarks(results)
    if (!landmarks || landmarks.length < 17) return null
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return null
    const raiseThreshold = 0.05
    let handRaised = false
    if (leftWrist.y < leftShoulder.y - raiseThreshold) {
      handRaised = true
      leftWristXHistory.push(leftWrist.x)
    } else {
      leftWristXHistory = []
    }
    if (rightWrist.y < rightShoulder.y - raiseThreshold) {
      handRaised = true
      rightWristXHistory.push(rightWrist.x)
    } else {
      rightWristXHistory = []
    }
    if (!handRaised) return null
    if (leftWristXHistory.length > 20) leftWristXHistory.shift()
    if (rightWristXHistory.length > 20) rightWristXHistory.shift()
    const now = performance.now()
    if (now - lastUpperBodyMotionTime < config.motionCooldownMs) return null
    const waveThreshold = 0.06
    const leftRange = leftWristXHistory.length >= 5 ? Math.max(...leftWristXHistory) - Math.min(...leftWristXHistory) : 0
    const rightRange = rightWristXHistory.length >= 5 ? Math.max(...rightWristXHistory) - Math.min(...rightWristXHistory) : 0
    if (leftRange > waveThreshold || rightRange > waveThreshold) {
      leftWristXHistory = []
      rightWristXHistory = []
      lastUpperBodyMotionTime = now
      return 'waveHand'
    }
    const raiseHistoryThreshold = 10
    if (leftWristXHistory.length >= raiseHistoryThreshold || rightWristXHistory.length >= raiseHistoryThreshold) {
      leftWristXHistory = []
      rightWristXHistory = []
      lastUpperBodyMotionTime = now
      return 'raiseHand'
    }
    return null
  }

  // ============================================================
  // 模型加载
  // ============================================================

  async function loadModelsWithRetry(): Promise<{
    faceMesh: MediaPipeModelLike | null
    pose: MediaPipeModelLike | null
  }> {
    let fm: MediaPipeModelLike | null = null
    let p: MediaPipeModelLike | null = null

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        const mod = (await import('@mediapipe/face_mesh')) as unknown as FaceMeshModuleLike
        fm = new mod.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        })
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        break
      } catch (error) {
        console.warn(`人脸检测模型加载失败 (尝试 ${attempt + 1}/${config.maxRetries}):`, error)
        if (attempt < config.maxRetries - 1) {
          await delayMs(config.retryDelay * Math.pow(2, attempt))
        }
      }
    }

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        const poseMod = (await import('@mediapipe/pose')) as unknown as PoseModuleLike
        p = new poseMod.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        })
        p.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        break
      } catch (error) {
        console.warn(`姿态检测模型加载失败 (尝试 ${attempt + 1}/${config.maxRetries}):`, error)
        if (attempt < config.maxRetries - 1) {
          await delayMs(config.retryDelay * Math.pow(2, attempt))
        }
      }
    }

    return { faceMesh: fm, pose: p }
  }

  // ============================================================
  // 检测循环
  // ============================================================

  async function loop(): Promise<void> {
    if (!running || !video || (!faceMesh && !pose)) return
    frameCount++
    const now = performance.now()
    if (now - lastFpsTime >= 1000) {
      fps = frameCount
      frameCount = 0
      lastFpsTime = now
    }
    try {
      if (faceMesh) await faceMesh.send({ image: video })
      if (pose) await pose.send({ image: video })
    } catch {
      /* 忽略单帧错误 */
    }
    if (running) requestAnimationFrame(() => { void loop() })
  }

  // ============================================================
  // 重置内部状态
  // ============================================================

  function resetState(): void {
    yawHistory = []
    pitchHistory = []
    leftWristXHistory = []
    rightWristXHistory = []
    lastUpperBodyMotionTime = 0
    frameCount = 0
    fps = 0
    lastEmotionTime = 0
    lastEmotion = null
    emotionStableCount = 0
    lastMotionTime = 0
    lastMotion = null
  }

  // ============================================================
  // 公共 API
  // ============================================================

  return {
    /**
     * 获取当前状态
     */
    getStatus(): VisionStatus {
      return status
    },

    /**
     * 获取当前 FPS
     */
    getFps(): number {
      return fps
    },

    /**
     * 是否正在运行
     */
    isRunning(): boolean {
      return running
    },

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<VisionServiceConfig>): void {
      Object.assign(config, newConfig)
    },

    /**
     * 检查摄像头权限
     */
    async checkCameraPermission(): Promise<boolean> {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        return result.state === 'granted' || result.state === 'prompt'
      } catch {
        return true
      }
    },

    /**
     * 启动视觉服务
     */
    async start(
      videoElement: HTMLVideoElement,
      onEmotion: (emotion: UserEmotion) => void,
      onMotion?: (motion: UserMotion) => void,
    ): Promise<boolean> {
      if (running) {
        callbacks.onEmotion = onEmotion
        if (onMotion) callbacks.onMotion = onMotion
        return true
      }

      video = videoElement
      callbacks.onEmotion = onEmotion
      callbacks.onMotion = onMotion
      setStatus('initializing')

      if (!navigator.mediaDevices?.getUserMedia) {
        handleError('浏览器不支持摄像头访问，请使用 Chrome 或 Firefox')
        setStatus('no_camera')
        return false
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: config.targetFps },
          },
          audio: false,
        })
        stream = mediaStream
        videoElement.srcObject = mediaStream
        await videoElement.play()
      } catch (error) {
        const errorMessage = getCameraErrorMessage(error)
        handleError(errorMessage, error)
        setStatus('no_camera')
        return false
      }

      const models = await loadModelsWithRetry()
      faceMesh = models.faceMesh
      pose = models.pose

      if (faceMesh) {
        faceMesh.onResults((results: unknown) => {
          const emotion = mapFaceToEmotion(results)
          const debouncedEmotion = debounceEmotion(emotion)
          if (debouncedEmotion && callbacks.onEmotion) {
            callbacks.onEmotion(debouncedEmotion)
            coreEvents.emit('vision:emotion:detected', { emotion: debouncedEmotion })
          }
          const landmarks = getFaceLandmarks(results)
          const motion = detectHeadMotion(landmarks)
          if (motion && shouldEmitMotion(motion) && callbacks.onMotion) {
            callbacks.onMotion(motion)
            coreEvents.emit('vision:motion:detected', { motion })
          }
        })
      }

      if (pose) {
        pose.onResults((results: unknown) => {
          const upperMotion = detectUpperBodyMotion(results)
          if (upperMotion && shouldEmitMotion(upperMotion) && callbacks.onMotion) {
            callbacks.onMotion(upperMotion)
            coreEvents.emit('vision:motion:detected', { motion: upperMotion })
          }
        })
      }

      if (faceMesh || pose) {
        running = true
        setStatus('running')
        lastFpsTime = performance.now()
        loop()
        return true
      } else {
        handleError('视觉模型加载失败，请刷新页面重试')
        return false
      }
    },

    /**
     * 停止视觉服务
     */
    stop(): void {
      running = false
      setStatus('idle')
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
      if (video) {
        video.srcObject = null
        video = null
      }
      faceMesh = null
      pose = null
      callbacks = {}
      resetState()
    },

    /**
     * 销毁服务
     */
    dispose(): void {
      this.stop()
    },
  }
}

export type VisionService = ReturnType<typeof createVisionService>
