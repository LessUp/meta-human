import { create } from 'zustand';

interface DigitalHumanState {
  // 模型状态
  isPlaying: boolean;
  autoRotate: boolean;
  currentAnimation: string;
  
  // 语音状态
  isRecording: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  
  // 行为状态
  currentEmotion: string;
  currentExpression: string;
  expressionIntensity: number;
  
  // 系统状态
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 动作
  setPlaying: (playing: boolean) => void;
  setAutoRotate: (rotate: boolean) => void;
  setAnimation: (animation: string) => void;
  setRecording: (recording: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setEmotion: (emotion: string) => void;
  setExpression: (expression: string) => void;
  setExpressionIntensity: (intensity: number) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 控制方法
  play: () => void;
  pause: () => void;
  reset: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
  toggleAutoRotate: () => void;
}

export const useDigitalHumanStore = create<DigitalHumanState>((set, get) => ({
  // 初始状态
  isPlaying: false,
  autoRotate: false,
  currentAnimation: 'idle',
  isRecording: false,
  isMuted: false,
  isSpeaking: false,
  currentEmotion: 'neutral',
  currentExpression: 'neutral',
  expressionIntensity: 0.8,
  isConnected: true,
  isLoading: false,
  error: null,
  
  // 状态设置方法
  setPlaying: (playing) => set({ isPlaying: playing }),
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
  setAnimation: (animation) => set({ currentAnimation: animation }),
  setRecording: (recording) => set({ isRecording: recording }),
  setMuted: (muted) => set({ isMuted: muted }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  setExpression: (expression) => set({ currentExpression: expression }),
  setExpressionIntensity: (intensity) => set({ expressionIntensity: intensity }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // 控制方法
  play: () => {
    set({ isPlaying: true });
    console.log('数字人播放');
  },
  
  pause: () => {
    set({ isPlaying: false });
    console.log('数字人暂停');
  },
  
  reset: () => {
    set({ 
      isPlaying: false,
      currentAnimation: 'idle',
      currentEmotion: 'neutral',
      currentExpression: 'neutral',
      expressionIntensity: 0.8
    });
    console.log('数字人重置');
  },
  
  startRecording: () => {
    set({ isRecording: true });
    console.log('开始录音');
    
    // 模拟录音超时
    setTimeout(() => {
      if (get().isRecording) {
        get().stopRecording();
      }
    }, 10000); // 10秒后自动停止
  },
  
  stopRecording: () => {
    set({ isRecording: false });
    console.log('停止录音');
  },
  
  toggleMute: () => {
    const { isMuted } = get();
    set({ isMuted: !isMuted });
    console.log(`音频${isMuted ? '取消静音' : '静音'}`);
  },
  
  toggleAutoRotate: () => {
    const { autoRotate } = get();
    set({ autoRotate: !autoRotate });
    console.log(`自动旋转${autoRotate ? '关闭' : '开启'}`);
  }
}));
