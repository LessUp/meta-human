import { mapFaceToEmotion, UserEmotion } from './visionMapper';
import { loggers } from '../../lib/logger';

type EmotionCallback = (emotion: UserEmotion) => void;
type MotionCallback = (motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand') => void;
type ErrorCallback = (error: string) => void;
type StatusCallback = (status: VisionStatus) => void;

export type VisionStatus = 'idle' | 'initializing' | 'running' | 'error' | 'no_camera';

export interface VisionServiceCallbacks {
  onEmotion?: EmotionCallback;
  onMotion?: MotionCallback;
  onError?: ErrorCallback;
  onStatusChange?: StatusCallback;
}

const logger = loggers.vision;

type Landmark = { x: number; y: number; z: number };
type FaceMeshResultsLike = { multiFaceLandmarks?: Landmark[][] };

type PoseLandmark = { x: number; y: number };
type PoseResultsLike = { poseLandmarks?: PoseLandmark[] };

type MediaPipeModelLike = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: unknown) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
};

type FaceMeshModuleLike = {
  FaceMesh: new (options: { locateFile: (file: string) => string }) => MediaPipeModelLike;
};

type PoseModuleLike = {
  Pose: new (options: { locateFile: (file: string) => string }) => MediaPipeModelLike;
};

// MediaPipe face landmark indices - these are standard indices for specific facial features
const FACE_LANDMARK_INDICES = {
  LEFT_EYE: 33,
  RIGHT_EYE: 263,
  NOSE: 1,
  FOREHEAD: 10,
  CHIN: 152,
  MIN_LANDMARKS_REQUIRED: 300,
} as const;

// MediaPipe pose landmark indices
const POSE_LANDMARK_INDICES = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  MIN_LANDMARKS_REQUIRED: 17,
} as const;

// Motion detection thresholds
const MOTION_THRESHOLDS = {
  NOD: 0.04,
  SHAKE_HEAD: 0.04,
  YAW_TOLERANCE: 0.02,
  RAISE_HAND: 0.05,
  WAVE_HAND: 0.06,
  RAISE_HISTORY_COUNT: 10,
  HISTORY_WINDOW: 20,
  MOTION_COOLDOWN_MS: 800,
  MIN_HISTORY_FOR_MOTION: 10,
} as const;

// Camera configuration
const CAMERA_CONFIG = {
  FACING_MODE: 'user',
  WIDTH: 640,
  HEIGHT: 480,
  FRAME_RATE: 30,
} as const;

// FPS calculation
const FPS_INTERVAL_MS = 1000;

class VisionService {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private running = false;
  private status: VisionStatus = 'idle';
  private faceMesh: MediaPipeModelLike | null = null;
  private pose: MediaPipeModelLike | null = null;
  private callbacks: VisionServiceCallbacks = {};
  private yawHistory: number[] = [];
  private pitchHistory: number[] = [];
  private leftWristXHistory: number[] = [];
  private rightWristXHistory: number[] = [];
  private lastUpperBodyMotionTime = 0;
  private frameCount = 0;
  private lastFpsTime = 0;
  private fps = 0;
  private rafId: number | null = null;

  getStatus(): VisionStatus {
    return this.status;
  }

  getFps(): number {
    return this.fps;
  }

  isRunning(): boolean {
    return this.running;
  }

  private setStatus(status: VisionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private handleError(message: string, error?: unknown): void {
    logger.error(message, error);
    this.setStatus('error');
    this.callbacks.onError?.(message);
  }

  // 检查摄像头权限
  async checkCameraPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted' || result.state === 'prompt';
    } catch {
      // 某些浏览器不支持权限查询
      return true;
    }
  }

  async start(
    videoElement: HTMLVideoElement,
    onEmotion: EmotionCallback,
    onMotion?: MotionCallback,
  ): Promise<boolean> {
    // 如果已经在运行，只更新回调
    if (this.running) {
      this.callbacks.onEmotion = onEmotion;
      if (onMotion) {
        this.callbacks.onMotion = onMotion;
      }
      return true;
    }

    this.video = videoElement;
    this.callbacks.onEmotion = onEmotion;
    this.callbacks.onMotion = onMotion;
    this.setStatus('initializing');

    // 检查浏览器支持
    if (!navigator.mediaDevices?.getUserMedia) {
      this.handleError('浏览器不支持摄像头访问，请使用 Chrome 或 Firefox');
      this.setStatus('no_camera');
      return false;
    }

    // 获取摄像头权限
    const cameraSuccess = await this.initializeCamera(videoElement);
    if (!cameraSuccess) {
      return false;
    }

    // 初始化人脸检测模型
    await this.initializeFaceMesh();

    // 初始化姿态检测模型
    await this.initializePose();

    // 检查是否有至少一个模型加载成功
    if (this.faceMesh || this.pose) {
      this.running = true;
      this.setStatus('running');
      this.lastFpsTime = performance.now();
      this.loop();
      return true;
    } else {
      this.handleError('视觉模型加载失败，请刷新页面重试');
      return false;
    }
  }

  // 初始化摄像头
  private async initializeCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: CAMERA_CONFIG.FACING_MODE,
          width: { ideal: CAMERA_CONFIG.WIDTH },
          height: { ideal: CAMERA_CONFIG.HEIGHT },
          frameRate: { ideal: CAMERA_CONFIG.FRAME_RATE },
        },
        audio: false,
      });
      this.stream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      return true;
    } catch (error: unknown) {
      const errorMessage = this.getCameraErrorMessage(error);
      this.handleError(errorMessage, error);
      this.setStatus('no_camera');
      return false;
    }
  }

  // 初始化人脸检测模型
  private async initializeFaceMesh(): Promise<void> {
    try {
      const mod = (await import('@mediapipe/face_mesh')) as unknown as FaceMeshModuleLike;
      const FaceMesh = mod.FaceMesh;
      this.faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.faceMesh.onResults((results: unknown) => {
        const emotion = mapFaceToEmotion(results);
        if (this.callbacks.onEmotion) {
          this.callbacks.onEmotion(emotion);
        }
        const landmarks = this.getFaceLandmarks(results);
        const motion = this.detectHeadMotion(landmarks);
        if (motion && this.callbacks.onMotion) {
          this.callbacks.onMotion(motion);
        }
      });
    } catch (error) {
      logger.warn('人脸检测模型加载失败，部分功能可能受限', error);
      // 不阻止继续运行，因为可能只是模型加载问题
    }
  }

  // 初始化姿态检测模型
  private async initializePose(): Promise<void> {
    try {
      const poseMod = (await import('@mediapipe/pose')) as unknown as PoseModuleLike;
      const Pose = poseMod.Pose;
      this.pose = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      this.pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.pose.onResults((results: unknown) => {
        const upperMotion = this.detectUpperBodyMotion(results);
        if (upperMotion && this.callbacks.onMotion) {
          this.callbacks.onMotion(upperMotion);
        }
      });
    } catch (error) {
      logger.warn('姿态检测模型加载失败，手势识别功能将不可用', error);
    }
  }

  // 获取摄像头错误的友好消息
  private getCameraErrorMessage(error: unknown): string {
    const errorName = error instanceof DOMException ? error.name : '';
    const errorMessages: Record<string, string> = {
      NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
      NotFoundError: '未检测到摄像头设备，请确保摄像头已连接',
      NotReadableError: '摄像头被其他应用占用，请关闭其他使用摄像头的程序',
      OverconstrainedError: '摄像头不支持请求的分辨率',
      SecurityError: '安全限制：请通过 HTTPS 访问或在本地运行',
      AbortError: '摄像头访问被中断',
    };
    const msg = error instanceof Error ? error.message : String(error);
    return errorMessages[errorName] || `摄像头访问失败: ${msg || errorName}`;
  }

  private async loop(): Promise<void> {
    if (!this.running || !this.video || (!this.faceMesh && !this.pose)) {
      return;
    }

    // FPS 计算
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= FPS_INTERVAL_MS) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    try {
      if (this.faceMesh) {
        await this.faceMesh.send({ image: this.video });
      }
      if (this.pose) {
        await this.pose.send({ image: this.video });
      }
    } catch (error) {
      // 单帧错误不影响继续运行，但需要记录以便调试
      logger.debug('Single frame error:', error);
    }

    // Only schedule next frame if still running
    if (this.running) {
      this.rafId = requestAnimationFrame(() => {
        void this.loop();
      });
    }
  }

  stop(): void {
    this.running = false;

    // Cancel any pending animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.setStatus('idle');

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.faceMesh = null;
    this.pose = null;
    this.callbacks = {};
    this.yawHistory = [];
    this.pitchHistory = [];
    this.leftWristXHistory = [];
    this.rightWristXHistory = [];
    this.lastUpperBodyMotionTime = 0;
    this.frameCount = 0;
    this.fps = 0;
  }

  private getFaceLandmarks(results: unknown): Landmark[] | undefined {
    if (!results || typeof results !== 'object') {
      return undefined;
    }
    // Type guard to check if results has the expected shape
    const typed = results as FaceMeshResultsLike;
    if (!('multiFaceLandmarks' in typed)) {
      return undefined;
    }
    const landmarks = typed.multiFaceLandmarks?.[0];
    if (!Array.isArray(landmarks)) {
      return undefined;
    }
    return landmarks;
  }

  private getPoseLandmarks(results: unknown): PoseLandmark[] | undefined {
    if (!results || typeof results !== 'object') {
      return undefined;
    }
    // Type guard to check if results has the expected shape
    const typed = results as PoseResultsLike;
    if (!('poseLandmarks' in typed)) {
      return undefined;
    }
    const landmarks = typed.poseLandmarks;
    if (!Array.isArray(landmarks)) {
      return undefined;
    }
    return landmarks;
  }

  private computeHeadPose(
    landmarks: Landmark[] | undefined,
  ): { yaw: number; pitch: number } | null {
    if (!landmarks || landmarks.length < FACE_LANDMARK_INDICES.MIN_LANDMARKS_REQUIRED) {
      return null;
    }
    const leftEye = landmarks[FACE_LANDMARK_INDICES.LEFT_EYE];
    const rightEye = landmarks[FACE_LANDMARK_INDICES.RIGHT_EYE];
    const nose = landmarks[FACE_LANDMARK_INDICES.NOSE];
    const forehead = landmarks[FACE_LANDMARK_INDICES.FOREHEAD];
    const chin = landmarks[FACE_LANDMARK_INDICES.CHIN];
    if (!leftEye || !rightEye || !nose || !forehead || !chin) {
      return null;
    }
    const centerX = (leftEye.x + rightEye.x) / 2;
    const yaw = nose.x - centerX;
    const midY = (forehead.y + chin.y) / 2;
    const pitch = nose.y - midY;
    return { yaw, pitch };
  }

  private detectHeadMotion(landmarks: Landmark[] | undefined): 'nod' | 'shakeHead' | null {
    const pose = this.computeHeadPose(landmarks);
    if (!pose) {
      return null;
    }
    const { yaw, pitch } = pose;
    this.yawHistory.push(yaw);
    this.pitchHistory.push(pitch);
    if (this.yawHistory.length > MOTION_THRESHOLDS.HISTORY_WINDOW) {
      this.yawHistory.shift();
    }
    if (this.pitchHistory.length > MOTION_THRESHOLDS.HISTORY_WINDOW) {
      this.pitchHistory.shift();
    }
    if (
      this.yawHistory.length < MOTION_THRESHOLDS.MIN_HISTORY_FOR_MOTION ||
      this.pitchHistory.length < MOTION_THRESHOLDS.MIN_HISTORY_FOR_MOTION
    ) {
      return null;
    }
    const yawMin = Math.min(...this.yawHistory);
    const yawMax = Math.max(...this.yawHistory);
    const pitchMin = Math.min(...this.pitchHistory);
    const pitchMax = Math.max(...this.pitchHistory);
    const yawRange = yawMax - yawMin;
    const pitchRange = pitchMax - pitchMin;
    if (pitchRange > MOTION_THRESHOLDS.NOD && yawRange < MOTION_THRESHOLDS.YAW_TOLERANCE) {
      this.yawHistory = [];
      this.pitchHistory = [];
      return 'nod';
    }
    if (yawRange > MOTION_THRESHOLDS.SHAKE_HEAD && pitchRange < MOTION_THRESHOLDS.YAW_TOLERANCE) {
      this.yawHistory = [];
      this.pitchHistory = [];
      return 'shakeHead';
    }
    return null;
  }

  private detectUpperBodyMotion(results: unknown): 'raiseHand' | 'waveHand' | null {
    const landmarks = this.getPoseLandmarks(results);
    if (!landmarks || landmarks.length < POSE_LANDMARK_INDICES.MIN_LANDMARKS_REQUIRED) {
      return null;
    }

    const leftShoulder = landmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER];
    const leftWrist = landmarks[POSE_LANDMARK_INDICES.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARK_INDICES.RIGHT_WRIST];

    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
      return null;
    }

    const raiseThreshold = 0.05;
    let handRaised = false;

    if (leftWrist.y < leftShoulder.y - raiseThreshold) {
      handRaised = true;
      this.leftWristXHistory.push(leftWrist.x);
    } else {
      this.leftWristXHistory = [];
    }

    if (rightWrist.y < rightShoulder.y - raiseThreshold) {
      handRaised = true;
      this.rightWristXHistory.push(rightWrist.x);
    } else {
      this.rightWristXHistory = [];
    }

    if (!handRaised) {
      return null;
    }

    if (this.leftWristXHistory.length > 20) {
      this.leftWristXHistory.shift();
    }
    if (this.rightWristXHistory.length > 20) {
      this.rightWristXHistory.shift();
    }

    const now = performance.now();
    if (now - this.lastUpperBodyMotionTime < 800) {
      return null;
    }

    const waveThreshold = 0.06;
    const leftRange =
      this.leftWristXHistory.length >= 5
        ? Math.max(...this.leftWristXHistory) - Math.min(...this.leftWristXHistory)
        : 0;
    const rightRange =
      this.rightWristXHistory.length >= 5
        ? Math.max(...this.rightWristXHistory) - Math.min(...this.rightWristXHistory)
        : 0;

    if (leftRange > waveThreshold || rightRange > waveThreshold) {
      this.leftWristXHistory = [];
      this.rightWristXHistory = [];
      this.lastUpperBodyMotionTime = now;
      return 'waveHand';
    }

    const raiseHistoryThreshold = 10;
    if (
      this.leftWristXHistory.length >= raiseHistoryThreshold ||
      this.rightWristXHistory.length >= raiseHistoryThreshold
    ) {
      this.leftWristXHistory = [];
      this.rightWristXHistory = [];
      this.lastUpperBodyMotionTime = now;
      return 'raiseHand';
    }

    return null;
  }
}

export const visionService = new VisionService();
