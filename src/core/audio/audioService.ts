import { useDigitalHumanStore } from '../../store/digitalHumanStore';

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
