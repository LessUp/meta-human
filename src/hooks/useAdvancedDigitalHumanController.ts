import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';
import { asrService } from '../core/audio';
import { digitalHumanEngine } from '../core/avatar';
import { clearRemoteSession } from '../core/dialogue/dialogueService';
import { useChatStream } from './useChatStream';
import { useConnectionHealth } from './useConnectionHealth';

export function useAdvancedDigitalHumanController() {
  const {
    isPlaying,
    isRecording,
    isMuted,
    autoRotate,
    setRecording,
    toggleMute,
    toggleAutoRotate,
    initSession,
  } = useDigitalHumanStore();
  const sessionId = useChatSessionStore((s) => s.sessionId);
  const error = useSystemStore((s) => s.error);
  const clearError = useSystemStore((s) => s.clearError);
  const setConnectionStatus = useSystemStore((s) => s.setConnectionStatus);
  const setError = useSystemStore((s) => s.setError);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { reconnect } = useConnectionHealth();

  const { chatInput, setChatInput, isChatLoading, handleChatSend } = useChatStream({
    sessionId,
    isMuted,
    onConnectionChange: (status) => setConnectionStatus(status),
    onClearError: () => clearError(),
    onError: (msg) => setError(msg),
  });

  useEffect(() => {
    if (!error) return;

    const id = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(id);
  }, [error, clearError]);

  useEffect(() => {
    return () => {
      digitalHumanEngine.dispose();
    };
  }, []);

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
      return;
    }

    const started = asrService.start();
    if (started) {
      toast.success('正在聆听...');
    }
  }, [isRecording, setRecording]);

  const handleExpressionChange = useCallback((expression: string, intensity: number) => {
    digitalHumanEngine.setExpression(expression);
    digitalHumanEngine.setExpressionIntensity(intensity);
  }, []);

  const handleBehaviorChange = useCallback((behavior: string, params: Record<string, unknown>) => {
    digitalHumanEngine.setBehavior(behavior, params);
  }, []);

  const handleVoiceCommand = useCallback(
    (command: string) => {
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
    },
    [handleChatSend],
  );

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    initSession();
    setChatInput('');
    toast.success('已开启新会话');
    void clearRemoteSession(oldSessionId);
  }, [sessionId, initSession, setChatInput]);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

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
          if (!e.ctrlKey && !e.metaKey) toggleSettings();
          break;
        case 'escape':
          closeSettings();
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
  }, [
    closeSettings,
    handlePlayPause,
    handleReset,
    handleToggleRecording,
    handleVoiceCommand,
    isMuted,
    toggleMute,
    toggleSettings,
  ]);

  return {
    activeTab,
    autoRotate,
    chatInput,
    closeSettings,
    handleBehaviorChange,
    handleChatSend,
    handleExpressionChange,
    handleModelLoad,
    handleNewSession,
    handlePlayPause,
    handleReset,
    handleToggleRecording,
    handleVoiceCommand,
    isChatLoading,
    reconnect,
    setActiveTab,
    setChatInput,
    showSettings,
    toggleMute,
    toggleSettings,
    toggleAutoRotate,
  };
}
