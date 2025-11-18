import { mapFaceToEmotion, UserEmotion } from './visionMapper';

type EmotionCallback = (emotion: UserEmotion) => void;

class VisionService {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private running = false;
  private faceMesh: any = null;
  private onEmotion: EmotionCallback | null = null;

  async start(videoElement: HTMLVideoElement, onEmotion: EmotionCallback): Promise<void> {
    if (this.running) {
      this.onEmotion = onEmotion;
      return;
    }
    this.video = videoElement;
    this.onEmotion = onEmotion;
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      this.stream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (error) {
      console.error('无法访问摄像头', error);
      return;
    }

    try {
      const mod: any = await import('@mediapipe/face_mesh');
      const FaceMesh = mod.FaceMesh;
      this.faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.faceMesh.onResults((results: any) => {
        const emotion = mapFaceToEmotion(results);
        if (this.onEmotion) {
          this.onEmotion(emotion);
        }
      });
      this.running = true;
      this.loop();
    } catch (error) {
      console.error('初始化视觉模型失败', error);
    }
  }

  private async loop(): Promise<void> {
    if (!this.running || !this.video || !this.faceMesh) {
      return;
    }
    try {
      await this.faceMesh.send({ image: this.video });
    } catch {
    }
    if (this.running) {
      requestAnimationFrame(() => {
        void this.loop();
      });
    }
  }

  stop(): void {
    this.running = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.faceMesh = null;
    this.onEmotion = null;
  }
}

export const visionService = new VisionService();
