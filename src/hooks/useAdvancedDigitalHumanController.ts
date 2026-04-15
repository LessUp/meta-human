import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';
import { asrService } from '../core/audio';
import { digitalHumanEngine } from '../core/avatar';
import { clearRemoteSession } from '../core/dialogue/dialogueService';
import { executeVoiceCommand } from '../lib/voiceCommands';
import { useChatStream } from './useChatStream';
import { useConnectionHealth } from './useConnectionHealth';

export function useAdvancedDigitalHumanController() {
  const { isPlaying, autoRotate, setRecording, toggleMute, toggleAutoRotate, initSession } =
    useDigitalHumanStore();
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
    isMuted: useDigitalHumanStore.getState().isMuted,
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
    const isRecording = useDigitalHumanStore.getState().isRecording;
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
  }, [setRecording]);

  const handleExpressionChange = useCallback((expression: string, intensity: number) => {
    digitalHumanEngine.setExpression(expression);
    digitalHumanEngine.setExpressionIntensity(intensity);
  }, []);

  const handleBehaviorChange = useCallback((behavior: string, params: Record<string, unknown>) => {
    digitalHumanEngine.setBehavior(behavior, params);
  }, []);

  const handleVoiceCommand = useCallback(
    (command: string) => {
      executeVoiceCommand(command, {
        onGreeting: () => {
          asrService.performGreeting();
          toast.success('执行打招呼动作');
        },
        onDance: () => {
          asrService.performDance();
          toast.success('开始跳舞');
        },
        onSpeak: () => {
          handleChatSend('你好，请自我介绍一下');
        },
        onExpression: (expression) => {
          digitalHumanEngine.setExpression(expression);
          toast.success(`切换到 ${expression} 表情`);
        },
        onDefault: (cmd) => {
          handleChatSend(cmd);
        },
      });
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

      // Get current state values at event time to avoid stale closures
      const currentIsMuted = useDigitalHumanStore.getState().isMuted;
      const currentIsRecording = useDigitalHumanStore.getState().isRecording;

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
          // Use the fresh value from getState() for accurate toast
          toast.info(currentIsMuted ? '已取消静音' : '已静音');
          break;
        case 'v':
          if (currentIsRecording) {
            asrService.stop();
            setRecording(false);
            toast.info('录音已停止');
          } else {
            const started = asrService.start();
            if (started) {
              toast.success('正在聆听...');
            }
          }
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
    handleVoiceCommand,
    setRecording,
    toggleMute,
    toggleSettings,
  ]);

  // Memoize the returned object to prevent unnecessary re-renders of consumers
  return useMemo(
    () => ({
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
    }),
    [
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
      setChatInput,
      showSettings,
      toggleMute,
      toggleSettings,
      toggleAutoRotate,
    ],
  );
}
