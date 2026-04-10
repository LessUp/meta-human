import React, { useState, useEffect, useCallback } from 'react';
import DigitalHumanViewer from '../components/DigitalHumanViewer';
import TopHUD from '../components/TopHUD';
import SettingsDrawer from '../components/SettingsDrawer';
import ChatDock from '../components/ChatDock';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { asrService } from '../core/audio';
import { digitalHumanEngine } from '../core/avatar';
import { clearRemoteSession } from '../core/dialogue/dialogueService';
import { useChatStream } from '../hooks/useChatStream';
import { useConnectionHealth } from '../hooks/useConnectionHealth';
import { useIsMobile } from '../hooks';
import { Toaster, toast } from 'sonner';

export default function AdvancedDigitalHumanPage() {
  const {
    isPlaying,
    isRecording,
    isMuted,
    autoRotate,
    isLoading,
    error,
    sessionId,
    setRecording,
    toggleMute,
    toggleAutoRotate,
    clearError,
    setConnectionStatus,
    setError,
    initSession,
  } = useDigitalHumanStore();

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const isMobile = useIsMobile();

  const { reconnect } = useConnectionHealth();

  const { chatInput, setChatInput, isChatLoading, handleChatSend } = useChatStream({
    sessionId,
    isMuted,
    onConnectionChange: (status) => setConnectionStatus(status),
    onClearError: () => clearError(),
    onError: (msg) => setError(msg),
  });

  // 自动清除错误
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(id);
  }, [error, clearError]);

  // 组件卸载时清理引擎资源
  useEffect(() => {
    return () => { digitalHumanEngine.dispose(); };
  }, []);

  // --- Handlers ---
  const handleModelLoad = useCallback(() => {
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
        handleChatSend(command);
    }
  }, [handleChatSend]);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    initSession();
    setChatInput('');
    toast.success('已开启新会话');
    void clearRemoteSession(oldSessionId);
  }, [sessionId, initSession, setChatInput]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'r':
          if (!e.ctrlKey && !e.metaKey) handleReset();
          break;
        case 'm':
          toggleMute();
          toast.info(isMuted ? '已取消静音' : '已静音');
          break;
        case 'v':
          handleToggleRecording();
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) setShowSettings(prev => !prev);
          break;
        case 'escape':
          setShowSettings(false);
          break;
        case '1':
          handleVoiceCommand('打招呼');
          break;
        case '2':
          handleVoiceCommand('跳舞');
          break;
        case '3':
          handleVoiceCommand('说话');
          break;
        case '4':
          handleVoiceCommand('表情');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleReset, handleToggleRecording, handleVoiceCommand, isMuted, toggleMute]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white selection:bg-blue-500/30">
      <Toaster position="top-center" theme="dark" />

      {/* Background 3D Viewer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black/0 to-black/0 z-0 pointer-events-none" />
        <DigitalHumanViewer
          autoRotate={autoRotate}
          showControls={false}
          onModelLoad={handleModelLoad}
        />
      </div>

      <TopHUD
        onToggleSettings={() => setShowSettings(prev => !prev)}
        onReconnect={reconnect}
        onNewSession={handleNewSession}
      />

      <SettingsDrawer
        show={showSettings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setShowSettings(false)}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onToggleRecording={handleToggleRecording}
        onToggleMute={toggleMute}
        onToggleAutoRotate={toggleAutoRotate}
        onVoiceCommand={handleVoiceCommand}
        onChatSend={handleChatSend}
        onExpressionChange={handleExpressionChange}
        onBehaviorChange={handleBehaviorChange}
      />

      <ChatDock
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSend={handleChatSend}
        onToggleRecording={handleToggleRecording}
        isChatLoading={isChatLoading}
      />
    </div>
  );
}
