import React, { useState, useEffect, useRef, useCallback } from 'react';
import DigitalHumanViewer from '../components/DigitalHumanViewer.enhanced';
import ControlPanel from '../components/ControlPanel';
import VoiceInteractionPanel from '../components/VoiceInteractionPanel.dark';
import VisionMirrorPanel from '../components/VisionMirrorPanel';
import ExpressionControlPanel from '../components/ExpressionControlPanel.new';
import BehaviorControlPanel from '../components/BehaviorControlPanel.new';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { ttsService, asrService } from '../core/audio/audioService';
import { digitalHumanEngine } from '../core/avatar/DigitalHumanEngine';
import { sendUserInput, checkServerHealth } from '../core/dialogue/dialogueService';
import { handleDialogueResponse } from '../core/dialogue/dialogueOrchestrator';
import { usePageVisibility } from '../hooks/usePerformance';
import { Toaster, toast } from 'sonner';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import { Mic, MessageSquare, Settings, Activity, X, Radio, AlertCircle, Wifi, WifiOff, RefreshCw, RotateCcw, Sun, Moon, Upload, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function AdvancedDigitalHumanPage() {
  const {
    isPlaying,
    isRecording,
    isMuted,
    autoRotate,
    currentExpression,
    currentBehavior,
    isSpeaking,
    isLoading,
    error,
    connectionStatus,
    chatHistory,
    sessionId,
    performanceMetrics,
    avatarType,
    setVrmModelUrl,
    setRecording,
    toggleMute,
    toggleAutoRotate,
    addChatMessage,
    clearError,
    setConnectionStatus,
    initSession
  } = useDigitalHumanStore();

  const { isDark, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPageActive, setIsPageActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 页面可见性优化
  const { onPause, onResume } = usePageVisibility();

  // 页面隐藏时暂停非必要处理
  useEffect(() => {
    const unsubscribePause = onPause(() => {
      setIsPageActive(false);
      // 暂停语音识别
      if (isRecording) {
        asrService.stop();
      }
    });

    const unsubscribeResume = onResume(() => {
      setIsPageActive(true);
    });

    return () => {
      unsubscribePause();
      unsubscribeResume();
    };
  }, [onPause, onResume, isRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // 初始化：检查服务器连接
  useEffect(() => {
    const checkConnection = async () => {
      const result = await checkServerHealth();
      setConnectionStatus(result.healthy ? 'connected' : 'disconnected');
      if (!result.healthy) {
        toast.warning('服务器连接不稳定，部分功能可能受限');
      }
    };
    checkConnection();

    // 定期检查连接状态
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [setConnectionStatus]);

  // 自动清除错误
  useEffect(() => {
    if (error) {
      errorTimeoutRef.current = setTimeout(() => {
        clearError();
      }, 5000);
    }
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error, clearError]);

  // --- Event Handlers ---
  const handleModelLoad = useCallback((_model: unknown) => {
    toast.success('数字人接口已上线');
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      digitalHumanEngine.pause();
      toast.info('已暂停');
    } else {
      digitalHumanEngine.play();
      toast.success('已播放');
    }
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    digitalHumanEngine.reset();
    toast.info('系统已重置');
  }, []);

  const handleChatSend = useCallback(async (text?: string) => {
    const content = (text ?? chatInput).trim();
    if (!content || isChatLoading) return;

    // 添加用户消息到 store
    addChatMessage('user', content);
    if (!text) setChatInput('');

    setIsChatLoading(true);
    try {
      const res = await sendUserInput({
        userText: content,
        sessionId: sessionId,
        meta: { timestamp: Date.now() }
      });

      await handleDialogueResponse(res, {
        isMuted,
        speakWith: (textToSpeak) => ttsService.speak(textToSpeak),
      });

    } catch (err: unknown) {
      console.error('发送消息失败:', err);
      // 错误已在 dialogueService 中处理，这里只需通知
      const message = err instanceof Error ? err.message : '发送失败，请重试';
      toast.error(message);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, sessionId, isMuted, addChatMessage]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      asrService.stop();
      setRecording(false);
      toast.info('录音已停止');
    } else {
      const started = asrService.start();
      if (started) {
        toast.success('正在聆听...');
      }
    }
  }, [isRecording, setRecording]);

  const handleExpressionChange = useCallback((expression: string, intensity: number) => {
    digitalHumanEngine.setExpression(expression);
    digitalHumanEngine.setExpressionIntensity(intensity);
  }, []);

  const handleBehaviorChange = useCallback((behavior: string, params: Record<string, unknown>) => {
    digitalHumanEngine.setBehavior(behavior, params);
  }, []);

  // Quick Actions 处理
  const handleVoiceCommand = useCallback((command: string) => {
    switch (command) {
      case '打招呼':
        asrService.performGreeting();
        toast.success('执行打招呼动作');
        break;
      case '跳舞':
        asrService.performDance();
        toast.success('开始跳舞');
        break;
      case '说话':
        handleChatSend('你好，请自我介绍一下');
        break;
      case '表情': {
        const expressions = ['smile', 'surprise', 'laugh'];
        const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
        digitalHumanEngine.setExpression(randomExpr);
        toast.success(`切换到 ${randomExpr} 表情`);
        setTimeout(() => digitalHumanEngine.setExpression('neutral'), 3000);
        break;
      }
      default:
        // 将命令作为对话发送
        handleChatSend(command);
    }
  }, [handleChatSend]);

  // 重新连接服务器
  const handleReconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    toast.loading('正在重新连接...');
    const result = await checkServerHealth();
    setConnectionStatus(result.healthy ? 'connected' : 'error');
    if (result.healthy) {
      toast.success('连接成功');
    } else {
      toast.error('连接失败，请稍后重试');
    }
  }, [setConnectionStatus]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // 空格：播放/暂停
          e.preventDefault();
          handlePlayPause();
          break;
        case 'r': // R：重置
          if (!e.ctrlKey && !e.metaKey) {
            handleReset();
          }
          break;
        case 'm': // M：静音切换
          toggleMute();
          toast.info(isMuted ? '已取消静音' : '已静音');
          break;
        case 'v': // V：录音切换
          handleToggleRecording();
          break;
        case 's': // S：设置面板
          if (!e.ctrlKey && !e.metaKey) {
            setShowSettings(prev => !prev);
          }
          break;
        case 'escape': // ESC：关闭设置面板
          setShowSettings(false);
          break;
        case '1': // 1：打招呼
          handleVoiceCommand('打招呼');
          break;
        case '2': // 2：跳舞
          handleVoiceCommand('跳舞');
          break;
        case '3': // 3：说话
          handleVoiceCommand('说话');
          break;
        case '4': // 4：表情
          handleVoiceCommand('表情');
          break;
        case '5': // 5：鞠躬
          digitalHumanEngine.performBow();
          toast('鞠躬', { icon: '🙇' });
          break;
        case '6': // 6：拍手
          digitalHumanEngine.performClap();
          toast('拍手', { icon: '👏' });
          break;
        case '7': // 7：点赞
          digitalHumanEngine.performThumbsUp();
          toast('点赞', { icon: '👍' });
          break;
        case '8': // 8：欢呼
          digitalHumanEngine.performCheer();
          toast('欢呼', { icon: '🎉' });
          break;
        case '9': // 9：耸肩
          digitalHumanEngine.performShrug();
          toast('耸肩', { icon: '🤷' });
          break;
        case '0': // 0：张望
          digitalHumanEngine.playAnimation('lookAround');
          toast('张望', { icon: '👀' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleReset, handleToggleRecording, handleVoiceCommand, isMuted, toggleMute]);

  // --- UI Components ---

  return (
    <div className="relative w-screen h-screen bg-slate-100 dark:bg-black overflow-hidden font-sans text-slate-800 dark:text-white selection:bg-blue-500/30">
      <Toaster position="top-center" theme={isDark ? 'dark' : 'light'} />

      {/* Background 3D Viewer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/60 dark:from-black/40 dark:via-transparent dark:to-black/80 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-transparent dark:from-blue-900/20 dark:via-black/0 dark:to-black/0 z-0 pointer-events-none" />
        <DigitalHumanViewer
          autoRotate={autoRotate}
          showControls={false}
          isDark={isDark}
          onModelLoad={handleModelLoad}
        />
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-light tracking-widest uppercase text-slate-700 dark:text-blue-100/80 flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-pulse" />
            MetaHuman <span className="text-xs bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded text-blue-600 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30">CORE 1.0</span>
          </h1>
          <div className="mt-2 flex space-x-4 text-xs text-slate-500 dark:text-gray-400 font-mono">
            <span className="flex items-center gap-1">
              {connectionStatus === 'connected' ? (
                <><Wifi className="w-3 h-3 text-green-400" /> <span className="text-green-400">在线</span></>
              ) : connectionStatus === 'connecting' ? (
                <><RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" /> <span className="text-yellow-400">连接中</span></>
              ) : (
                <><WifiOff className="w-3 h-3 text-red-400" /> <span className="text-red-400">离线</span></>
              )}
            </span>
            <span>行为: <span className="text-blue-400">{currentBehavior}</span></span>
            <span>会话: <span className="text-purple-400">{chatHistory.length}条</span></span>
            <span>FPS: <span className={performanceMetrics.fps >= 30 ? 'text-green-400' : 'text-yellow-400'}>{performanceMetrics.fps}</span></span>
            {!isPageActive && <span className="text-yellow-400">⏸ 已暂停</span>}
          </div>
        </div>

        <div className="pointer-events-auto flex space-x-3">
          {connectionStatus !== 'connected' && (
            <button
              onClick={handleReconnect}
              className="p-3 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 hover:bg-yellow-500/30 transition-all active:scale-95"
              title="重新连接"
            >
              <RefreshCw className={`w-5 h-5 text-yellow-400 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => {
              initSession();
              setChatInput('');
              toast.success('已开启新会话');
            }}
            className="p-3 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm dark:shadow-none"
            title="新会话"
          >
            <RotateCcw className="w-5 h-5 text-slate-600 dark:text-white/80" />
          </button>
          <KeyboardShortcutsHelp />
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm dark:shadow-none"
            title={isDark ? '切换浅色模式' : '切换深色模式'}
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm dark:shadow-none"
          >
            <Settings className="w-5 h-5 text-slate-600 dark:text-white/80" />
          </button>
        </div>
      </div>

      {/* Right Settings Drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-80 sm:w-96 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 z-30 transform transition-transform duration-500 ease-out shadow-xl ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-medium text-slate-800 dark:text-white/90 flex items-center gap-2">
              <Settings className="w-4 h-4" /> 控制系统
            </h2>
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg mb-6 overflow-x-auto">
            {[{key:'basic',label:'基础'},{key:'expression',label:'表情'},{key:'behavior',label:'行为'},{key:'vision',label:'视觉'},{key:'voice',label:'语音'}].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="bg-white/80 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                  <ControlPanel
                    isPlaying={isPlaying}
                    isRecording={isRecording}
                    isMuted={isMuted}
                    autoRotate={autoRotate}
                    onPlayPause={handlePlayPause}
                    onReset={handleReset}
                    onToggleRecording={handleToggleRecording}
                    onToggleMute={toggleMute}
                    onToggleAutoRotate={toggleAutoRotate}
                    onVoiceCommand={handleVoiceCommand}
                  />
                </div>

                {/* VRM 模型切换 */}
                <div className="bg-white/80 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/5 space-y-3">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-white/80 flex items-center gap-2">
                    <User className="w-4 h-4" /> 角色模型
                  </h3>

                  {/* 模型类型切换 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVrmModelUrl(null)}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        avatarType === 'cyber'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      内置角色
                    </button>
                    <label
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                        avatarType === 'vrm'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      加载 VRM
                      <input
                        type="file"
                        accept=".vrm"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setVrmModelUrl(url);
                            toast.success(`已加载 VRM 模型: ${file.name}`);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {avatarType === 'vrm' && (
                    <p className="text-xs text-green-500 dark:text-green-400">
                      VRM 模型已加载，表情和动作已自动映射
                    </p>
                  )}

                  <p className="text-xs text-slate-400 dark:text-white/30">
                    支持 VRM 格式（.vrm），可从{' '}
                    <a href="https://hub.vroid.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">VRoid Hub</a>
                    {' '}或{' '}
                    <a href="https://booth.pm/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">BOOTH</a>
                    {' '}获取免费模型
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'expression' && (
              <ExpressionControlPanel
                currentExpression={currentExpression}
                onExpressionChange={handleExpressionChange}
              />
            )}
            {activeTab === 'behavior' && (
              <BehaviorControlPanel
                currentBehavior={currentBehavior}
                onBehaviorChange={handleBehaviorChange}
              />
            )}
            {activeTab === 'vision' && (
              <div className="text-sm text-slate-500 dark:text-gray-400 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5">
                视觉镜像模块需要摄像头权限
                <VisionMirrorPanel
                  onEmotionChange={(emotion) => {
                    if (emotion === 'happy') {
                      digitalHumanEngine.setExpression('smile');
                    } else if (emotion === 'surprised') {
                      digitalHumanEngine.setExpression('surprise');
                    } else {
                      digitalHumanEngine.setExpression('neutral');
                    }
                    digitalHumanEngine.setEmotion(emotion);
                  }}
                  onHeadMotion={(motion) => {
                    digitalHumanEngine.playAnimation(motion);
                    toast(`检测到动作: ${motion}`, { icon: '📸' });
                  }}
                />
              </div>
            )}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <VoiceInteractionPanel
                  onTranscript={(text) => handleChatSend(text)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Chat Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
        {/* Chat Bubbles Overlay (Above Dock) */}
        <div className="mb-6 w-full max-h-[40vh] overflow-y-auto space-y-3 pr-4 mask-gradient-bottom custom-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-slate-300 dark:text-white/20" />
              </div>
              <p className="text-slate-400 dark:text-white/25 text-sm">发送消息或使用语音开始对话</p>
              <p className="text-slate-300 dark:text-white/15 text-xs">按 <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-[10px]">V</kbd> 快速开始录音</p>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div
                  className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm backdrop-blur-md border shadow-sm ${msg.role === 'user'
                    ? 'bg-blue-600 border-blue-500/50 text-white rounded-br-none'
                    : 'bg-white/90 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-100 rounded-bl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`bg-white/80 dark:bg-black/60 backdrop-blur-2xl border rounded-2xl p-2 pl-4 flex items-center gap-3 shadow-lg shadow-slate-200/50 dark:shadow-blue-900/20 ring-1 ring-slate-100 dark:ring-white/5 transition-colors ${isLoading ? 'border-blue-500/50' : 'border-slate-200 dark:border-white/10'
          }`}>
          <div className={`p-2 rounded-lg transition-colors ${isLoading ? 'bg-gradient-to-tr from-yellow-500 to-orange-500' :
            isSpeaking ? 'bg-gradient-to-tr from-green-500 to-emerald-500' :
              'bg-gradient-to-tr from-blue-500 to-purple-500'
            }`}>
            <Radio className={`w-5 h-5 text-white ${isSpeaking || isLoading ? 'animate-pulse' : ''}`} />
          </div>

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isChatLoading && !isRecording && handleChatSend()}
            placeholder={isLoading ? '思考中...' : isRecording ? '正在聆听...' : '输入消息与数字人互动...'}
            disabled={isLoading || isRecording}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-sm h-10 disabled:cursor-not-allowed"
          />

          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={handleToggleRecording}
              disabled={isLoading || isChatLoading}
              className={`p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/70 hover:text-slate-700 dark:hover:text-white'
                }`}
              title={isRecording ? '停止录音' : '开始录音'}
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleChatSend()}
              disabled={!chatInput.trim() || isChatLoading || isLoading}
              className="p-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-slate-600 dark:text-white transition-colors"
              title="发送消息"
            >
              {isChatLoading || isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-300 dark:border-white/30 border-t-slate-600 dark:border-t-white rounded-full animate-spin" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-3 px-4 py-2 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="p-1 hover:bg-red-500/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .mask-gradient-bottom { -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%); }
      `}</style>
    </div>
  );
}
