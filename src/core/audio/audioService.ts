import { runDialogueTurn } from '../dialogue/dialogueOrchestrator';

// TTS 配置接口
export interface TTSConfig {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Callbacks for TTS state changes.
 * Decouples TTSService from any specific store.
 */
export interface TTSCallbacks {
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onError?: (message: string) => void;
}

/**
 * State accessor for ASRService.
 * Decouples ASRService from any specific store.
 */
export interface ASRStateAdapter {
  setRecording(recording: boolean): void;
  setBehavior(behavior: string): void;
  setSpeaking(speaking: boolean): void;
  setError(message: string): void;
  setEmotion(emotion: string): void;
  setExpression(expression: string): void;
  setAnimation(animation: string): void;
  play(): void;
  pause(): void;
  reset(): void;
  setMuted(muted: boolean): void;
  /** Whether currently muted (for dialogue send). */
  isMuted: boolean;
  /** Current session ID (for dialogue send). */
  sessionId: string;
  /** Current behavior (for thinking reset check). */
  currentBehavior: string;
  /** Add a message to chat history (for voice-initiated dialogue turns). */
  addChatMessage?: (role: 'user' | 'assistant', text: string, isStreaming?: boolean) => number | null;
  /** Update an existing chat message (for voice-initiated dialogue turns). */
  updateChatMessage?: (id: number, updates: Partial<{ text: string; isStreaming: boolean }>) => void;
}

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }>;
type SpeechRecognitionResultListLike = ArrayLike<SpeechRecognitionResultLike>;

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultListLike;
  resultIndex?: number;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// 语音合成服务
export class TTSService {
  private synth: SpeechSynthesis | null;
  private voices: SpeechSynthesisVoice[];
  private config: TTSConfig;
  private isInitialized: boolean = false;
  private callbacks: TTSCallbacks;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(config: TTSConfig = {}, callbacks: TTSCallbacks = {}) {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
    this.voices = [];
    this.config = {
      lang: config.lang ?? 'zh-CN',
      rate: config.rate ?? 1.0,
      pitch: config.pitch ?? 1.0,
      volume: config.volume ?? 0.8,
    };
    this.callbacks = callbacks;
    this.loadVoices();
  }

  private loadVoices(): void {
    if (!this.synth) {
      this.isInitialized = false;
      this.voices = [];
      return;
    }

    const loadVoiceList = () => {
      this.voices = this.synth!.getVoices();
      this.isInitialized = this.voices.length > 0;
    };

    loadVoiceList();
    if (!this.isInitialized) {
      this.synth.onvoiceschanged = loadVoiceList;
    }
  }

  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  isSupported(): boolean {
    return !!this.synth;
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  speak(text: string, config?: Partial<TTSConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
        const message = '浏览器不支持语音合成功能';
        this.callbacks.onError?.(message);
        reject(new Error(message));
        return;
      }

      if (this.synth.speaking) {
        this.cancelCurrentUtterance();
        this.synth.cancel();
      }

      const mergedConfig = { ...this.config, ...config };
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = mergedConfig.lang!;
      utterance.rate = mergedConfig.rate!;
      utterance.pitch = mergedConfig.pitch!;
      utterance.volume = mergedConfig.volume!;

      // 选择合适的语音
      const preferredVoice = this.voices.find(voice =>
        voice.lang.includes(mergedConfig.lang!.split('-')[0])
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.callbacks.onSpeakStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.callbacks.onSpeakEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        console.error('语音合成错误:', event);
        this.callbacks.onError?.(`语音合成失败: ${event.error}`);
        reject(new Error(event.error));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  speakWithOptions(
    text: string,
    options: { lang?: string; rate?: number; pitch?: number; volume?: number; voiceName?: string } = {}
  ) {
    const {
      lang = 'zh-CN',
      rate = 1.0,
      pitch = 1.0,
      volume = 0.8,
      voiceName,
    } = options;

    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      this.callbacks.onError?.('浏览器不支持语音合成功能');
      return;
    }

    if (this.synth.speaking) {
      this.cancelCurrentUtterance();
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // 选择中文语音或指定语音
    let selectedVoice: SpeechSynthesisVoice | undefined;
    if (voiceName) {
      selectedVoice = this.voices.find((voice) => voice.name === voiceName);
    }
    if (!selectedVoice) {
      selectedVoice = this.voices.find(voice => voice.lang.includes('zh'));
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      this.callbacks.onSpeakStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.callbacks.onSpeakEnd?.();
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      console.error('语音合成错误:', event);
      this.callbacks.onError?.('语音合成失败');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /** Nullify handlers on the current utterance so cancel() won't fire onerror. */
  private cancelCurrentUtterance(): void {
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
  }

  stop(): void {
    this.cancelCurrentUtterance();
    this.synth?.cancel();
    this.callbacks.onSpeakEnd?.();
  }

  pause(): void {
    this.synth?.pause();
  }

  resume(): void {
    this.synth?.resume();
  }
}

// ASR 回调接口
export interface ASRCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// ASR 配置接口
export interface ASRConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

type ASRStartOptions = {
  onResult?: (text: string) => void;
  mode?: 'command' | 'dictation';
};

// 语音识别服务
export class ASRService {
  private recognition: SpeechRecognitionLike | null = null;
  private isSupportedFlag: boolean;
  private callbacks: ASRCallbacks = {};
  private config: ASRConfig;
  private sendToBackend: boolean = true;
  private tts: TTSService;
  private state: ASRStateAdapter;
  private onResultCallback: ((text: string) => void) | null = null;
  private mode: 'command' | 'dictation' = 'command';
  private pendingRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private presetTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(config: ASRConfig = {}, state: ASRStateAdapter, tts: TTSService) {
    this.isSupportedFlag = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    this.config = {
      lang: config.lang ?? 'zh-CN',
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives ?? 1,
    };
    this.state = state;
    this.tts = tts;

    if (this.isSupportedFlag && typeof window !== 'undefined') {
      this.initRecognition();
    }
  }

  setCallbacks(callbacks: ASRCallbacks): void {
    this.callbacks = callbacks;
  }

  setSendToBackend(send: boolean): void {
    this.sendToBackend = send;
  }

  checkSupport(): boolean {
    return this.isSupportedFlag;
  }

  private initRecognition(): void {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor; SpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
      || (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.lang;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onstart = () => {
      this.state.setBehavior('listening');
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalTranscript = '';
      let interimTranscript = '';

      const startIndex = event.resultIndex ?? 0;
      for (let i = startIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript ?? '';
        if ((event.results[i] as unknown as { isFinal?: boolean })?.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 通知临时结果
      if (interimTranscript) {
        this.callbacks.onTranscript?.(interimTranscript, false);
      }

      // 处理最终结果
      if (finalTranscript) {
        this.callbacks.onTranscript?.(finalTranscript, true);
        if (this.onResultCallback) {
          this.onResultCallback(finalTranscript);
        }
        if (this.mode === 'command') {
          void this.processVoiceInput(finalTranscript);
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error('语音识别错误:', event.error);
      const errorMsg = this.getErrorMessage(event.error);
      this.state.setRecording(false);
      this.state.setBehavior('idle');
      this.state.setError(errorMsg);
      this.callbacks.onError?.(errorMsg);
    };

    this.recognition.onend = () => {
      this.state.setRecording(false);
      this.state.setBehavior('idle');
      this.callbacks.onEnd?.();
    };
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音，请重试',
      'audio-capture': '无法访问麦克风，请检查权限',
      'not-allowed': '麦克风权限被拒绝',
      'network': '网络错误，请检查连接',
      'aborted': '语音识别被中断',
      'language-not-supported': '不支持当前语言',
    };
    return errorMessages[error] || `语音识别失败: ${error}`;
  }

  private speakSafely(text: string): void {
    void this.tts.speak(text).catch(() => undefined);
  }

  start(options?: ASRStartOptions): boolean {
    if (!this.isSupportedFlag) {
      console.warn('浏览器不支持语音识别');
      this.state.setError('浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
      return false;
    }

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      this.state.setError('语音识别初始化失败');
      return false;
    }

    if (this.pendingRestartTimer) {
      clearTimeout(this.pendingRestartTimer);
      this.pendingRestartTimer = null;
    }

    this.onResultCallback = options?.onResult ?? null;
    this.mode = options?.mode ?? 'command';

    try {
      this.recognition.start();
      this.state.setRecording(true);
      return true;
    } catch (error: unknown) {
      console.error('启动语音识别失败:', error);
      this.state.setRecording(false);

      // 处理已经在运行的情况
      if (error instanceof Error && error.message?.includes('already started')) {
        this.recognition.stop();
        this.pendingRestartTimer = setTimeout(() => {
          this.pendingRestartTimer = null;
          this.start(options);
        }, 100);
        return true;
      }

      this.state.setError('启动语音识别失败');
      return false;
    }
  }

  stop(): void {
    this.clearPresetTimers();
    if (this.pendingRestartTimer) {
      clearTimeout(this.pendingRestartTimer);
      this.pendingRestartTimer = null;
    }
    if (this.recognition && this.isSupportedFlag) {
      try {
        this.recognition.stop();
      } catch (e) {
        // 忽略停止错误
      }
    }
    this.onResultCallback = null;
    this.mode = 'command';
  }

  abort(): void {
    this.clearPresetTimers();
    if (this.pendingRestartTimer) {
      clearTimeout(this.pendingRestartTimer);
      this.pendingRestartTimer = null;
    }
    if (this.recognition && this.isSupportedFlag) {
      try {
        this.recognition.abort();
      } catch (e) {
        // 忽略中断错误
      }
    }
    this.state.setRecording(false);
    this.state.setBehavior('idle');
  }

  // 处理语音输入 - 整合本地命令和后端对话
  private async processVoiceInput(text: string): Promise<void> {
    // 首先检查是否是本地命令
    const isLocalCommand = this.tryLocalCommand(text);

    // 如果不是本地命令且启用了后端发送，则发送到对话服务
    if (!isLocalCommand && this.sendToBackend) {
      await this.sendToDialogueService(text);
    }
  }

  // 尝试执行本地命令，返回是否匹配到命令
  private tryLocalCommand(command: string): boolean {
    const trimmed = command.trim().toLowerCase();

    // System control commands — exact match only
    if (trimmed === '播放' || trimmed === '开始') {
      this.state.play();
      return true;
    }
    if (trimmed === '暂停' || trimmed === '停止') {
      this.state.pause();
      return true;
    }
    if (trimmed === '重置' || trimmed === '复位') {
      this.state.reset();
      return true;
    }
    if (trimmed === '取消静音') {
      this.state.setMuted(false);
      return true;
    }
    if (trimmed === '静音') {
      this.state.setMuted(true);
      return true;
    }

    // Quick action commands — exact match only
    if (trimmed === '打招呼' || trimmed === '问好') {
      this.performGreeting();
      return true;
    }
    if (trimmed === '跳舞') {
      this.performDance();
      return true;
    }
    if (trimmed === '点头') {
      this.performNod();
      return true;
    }
    if (trimmed === '摇头') {
      this.performShakeHead();
      return true;
    }

    return false;
  }

  // 发送到对话服务
  private async sendToDialogueService(text: string): Promise<void> {
    try {
      await runDialogueTurn(text, {
        sessionId: this.state.sessionId,
        isMuted: this.state.isMuted,
        speakWith: (textToSpeak) => this.tts.speak(textToSpeak),
        onAddUserMessage: (t) => {
          this.state.addChatMessage?.('user', t);
        },
        onAddAssistantMessage: (replyText) => {
          this.state.addChatMessage?.('assistant', replyText);
        },
        onResetBehavior: () => {
          if (this.state.currentBehavior === 'thinking') {
            this.tts.stop();
          }
        },
      });
    } catch (error: unknown) {
      console.error('对话服务错误:', error);
      this.state.setError('对话服务暂时不可用，请稍后重试');
      this.state.setBehavior('idle');
    }
  }

  private clearPresetTimers(): void {
    this.presetTimers.forEach(clearTimeout);
    this.presetTimers = [];
  }

  private schedulePresetReset(fn: () => void, delay: number): void {
    this.presetTimers.push(setTimeout(fn, delay));
  }

  // 预设动作：打招呼
  performGreeting(): void {
    this.state.setEmotion('happy');
    this.state.setExpression('smile');
    this.state.setBehavior('greeting');
    this.state.setAnimation('wave');

    this.speakSafely('您好！很高兴见到您！有什么可以帮助您的吗？');

    this.schedulePresetReset(() => {
      this.state.setEmotion('neutral');
      this.state.setExpression('neutral');
      this.state.setBehavior('idle');
      this.state.setAnimation('idle');
    }, 4000);
  }

  // 预设动作：跳舞
  performDance(): void {
    this.state.setAnimation('dance');
    this.state.setBehavior('excited');
    this.state.setEmotion('happy');

    this.speakSafely('让我为您跳一支舞！');

    this.schedulePresetReset(() => {
      this.state.setAnimation('idle');
      this.state.setBehavior('idle');
      this.state.setEmotion('neutral');
    }, 6000);
  }

  // 预设动作：点头
  performNod(): void {
    this.state.setAnimation('nod');
    this.state.setBehavior('listening');

    this.speakSafely('好的，我明白了。');

    this.schedulePresetReset(() => {
      this.state.setAnimation('idle');
      this.state.setBehavior('idle');
    }, 2000);
  }

  // 预设动作：摇头
  performShakeHead(): void {
    this.state.setAnimation('shakeHead');

    this.speakSafely('不太确定呢。');

    this.schedulePresetReset(() => {
      this.state.setAnimation('idle');
    }, 2000);
  }
}
