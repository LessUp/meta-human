import { useVisionMirror } from '../hooks/useVisionMirror';
import type { UserEmotion } from '../core/vision/visionMapper';
import { Camera, CameraOff, ScanFace, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VisionMirrorPanelProps {
  onEmotionChange: (emotion: UserEmotion) => void;
  onHeadMotion?: (motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand') => void;
}

// 情感颜色映射
const EMOTION_COLORS: Record<UserEmotion, string> = {
  neutral: 'text-blue-400',
  happy: 'text-green-400',
  surprised: 'text-yellow-400',
  sad: 'text-indigo-400',
  angry: 'text-red-400',
};

// 情感图标/标签
const EMOTION_LABELS: Record<UserEmotion, string> = {
  neutral: '😐 中性',
  happy: '😊 开心',
  surprised: '😮 惊讶',
  sad: '😢 悲伤',
  angry: '😠 愤怒',
};

export default function VisionMirrorPanel({
  onEmotionChange,
  onHeadMotion,
}: VisionMirrorPanelProps) {
  const vision = useVisionMirror({
    onEmotionChange,
    onHeadMotion: (motion) => {
      toast.info(`检测到动作: ${motion}`);
      onHeadMotion?.(motion);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">视觉镜像</h3>
        <div className="flex items-center space-x-3">
          {vision.isCameraOn && vision.fps > 0 && (
            <span className="text-[10px] text-white/40 font-mono">{vision.fps} FPS</span>
          )}
          <div className="flex items-center space-x-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                vision.isLoading
                  ? 'bg-yellow-500 animate-pulse'
                  : vision.isCameraOn
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-white/20'
              }`}
            />
            <span className="text-xs text-white/60">
              {vision.isLoading ? '启动中' : vision.isCameraOn ? 'LIVE' : '离线'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 shadow-inner">
        {/* 加载状态 */}
        {vision.isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
            <Loader2 size={32} className="text-blue-400 animate-spin mb-2" />
            <span className="text-xs text-white/60">正在启动摄像头...</span>
          </div>
        )}

        {/* 错误状态 */}
        {vision.error && !vision.isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 z-10">
            <AlertCircle size={32} className="text-red-400 mb-2" />
            <span className="text-xs text-red-300 text-center px-4">{vision.error}</span>
          </div>
        )}

        {/* 离线状态 */}
        {!vision.isCameraOn && !vision.isLoading && !vision.error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
            <ScanFace size={48} className="mb-2" />
            <span className="text-xs uppercase tracking-widest">摄像头未开启</span>
          </div>
        )}

        <video
          ref={vision.videoRef}
          className={`w-full h-full object-cover transition-opacity ${vision.isCameraOn ? 'opacity-100' : 'opacity-0'} transform scale-x-[-1]`}
          autoPlay
          playsInline
          muted
        />

        {vision.isCameraOn && (
          <>
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white/80 border border-white/10">
              AI 追踪中
            </div>
            {vision.lastMotion && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500/80 backdrop-blur rounded-full text-xs text-white font-medium animate-fade-in-up">
                检测到: {vision.lastMotion.toUpperCase()}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-white/60">
          检测情感:
          <span className={`ml-2 font-medium ${EMOTION_COLORS[vision.currentEmotion]}`}>
            {EMOTION_LABELS[vision.currentEmotion]}
          </span>
        </div>

        <button
          onClick={vision.toggleCamera}
          disabled={vision.isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
            vision.isCameraOn
              ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
          }`}
          aria-label={vision.isCameraOn ? '关闭摄像头' : '开启摄像头'}
        >
          {vision.isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : vision.isCameraOn ? (
            <CameraOff size={14} />
          ) : (
            <Camera size={14} />
          )}
          <span>
            {vision.isLoading ? '启动中...' : vision.isCameraOn ? '关闭摄像头' : '开启摄像头'}
          </span>
        </button>
      </div>
    </div>
  );
}
