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
      currentExpression: 'neutral'
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

// 语音合成服务
export class TTSService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[];
  
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();
  }
  
  private loadVoices() {
    this.voices = this.synth.getVoices();
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }
  
  speak(text: string, lang: string = 'zh-CN') {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // 选择中文语音
    const chineseVoice = this.voices.find(voice => voice.lang.includes('zh'));
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    
    utterance.onstart = () => {
      useDigitalHumanStore.getState().setSpeaking(true);
    };
    
    utterance.onend = () => {
      useDigitalHumanStore.getState().setSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('语音合成错误:', event);
      useDigitalHumanStore.getState().setSpeaking(false);
      useDigitalHumanStore.getState().setError('语音合成失败');
    };
    
    this.synth.speak(utterance);
  }
  
  stop() {
    this.synth.cancel();
    useDigitalHumanStore.getState().setSpeaking(false);
  }
}

// 语音识别服务
export class ASRService {
  private recognition: any;
  private isSupported: boolean;
  
  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (this.isSupported) {
      this.initRecognition();
    }
  }
  
  private initRecognition() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'zh-CN';
    
    this.recognition.onstart = () => {
      console.log('语音识别开始');
    };
    
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('识别结果:', transcript);
      this.processVoiceCommand(transcript);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      useDigitalHumanStore.getState().setRecording(false);
      useDigitalHumanStore.getState().setError('语音识别失败: ' + event.error);
    };
    
    this.recognition.onend = () => {
      console.log('语音识别结束');
      useDigitalHumanStore.getState().setRecording(false);
    };
  }
  
  start() {
    if (!this.isSupported) {
      console.warn('浏览器不支持语音识别');
      useDigitalHumanStore.getState().setError('浏览器不支持语音识别功能');
      return;
    }
    
    try {
      this.recognition.start();
      useDigitalHumanStore.getState().setRecording(true);
    } catch (error) {
      console.error('启动语音识别失败:', error);
      useDigitalHumanStore.getState().setRecording(false);
      useDigitalHumanStore.getState().setError('启动语音识别失败');
    }
  }
  
  stop() {
    if (this.recognition && this.isSupported) {
      this.recognition.stop();
    }
  }
  
  private processVoiceCommand(command: string) {
    const store = useDigitalHumanStore.getState();
    
    // 基本命令处理
    if (command.includes('播放') || command.includes('开始')) {
      store.play();
    } else if (command.includes('暂停') || command.includes('停止')) {
      store.pause();
    } else if (command.includes('重置')) {
      store.reset();
    } else if (command.includes('打招呼') || command.includes('问好')) {
      this.performGreeting();
    } else if (command.includes('跳舞')) {
      this.performDance();
    } else if (command.includes('说话')) {
      this.performSpeaking();
    } else if (command.includes('表情')) {
      this.performExpression();
    } else {
      // 未知命令，使用TTS回复
      const tts = new TTSService();
      tts.speak(`我没有理解您的指令：${command}`);
    }
  }
  
  private performGreeting() {
    const store = useDigitalHumanStore.getState();
    store.setEmotion('happy');
    store.setExpression('smile');
    
    const tts = new TTSService();
    tts.speak('您好！很高兴见到您！');
    
    // 3秒后恢复中性状态
    setTimeout(() => {
      store.setEmotion('neutral');
      store.setExpression('neutral');
    }, 3000);
  }
  
  private performDance() {
    const store = useDigitalHumanStore.getState();
    store.setAnimation('dance');
    
    const tts = new TTSService();
    tts.speak('让我为您跳一支舞！');
    
    // 5秒后恢复待机状态
    setTimeout(() => {
      store.setAnimation('idle');
    }, 5000);
  }
  
  private performSpeaking() {
    const tts = new TTSService();
    tts.speak('我正在说话，有什么可以帮助您的吗？');
  }
  
  private performExpression() {
    const expressions = ['smile', 'surprise', 'sad', 'angry', 'neutral'];
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    
    const store = useDigitalHumanStore.getState();
    store.setExpression(randomExpression);
    
    const tts = new TTSService();
    tts.speak(`这是我的${randomExpression}表情！`);
    
    // 2秒后恢复中性表情
    setTimeout(() => {
      store.setExpression('neutral');
    }, 2000);
  }
}

// 初始化服务实例
export const ttsService = new TTSService();
export const asrService = new ASRService();