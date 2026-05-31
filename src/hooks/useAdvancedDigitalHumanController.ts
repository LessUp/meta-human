/**
 * 高级数字人控制器 Hook。
 *
 * 协调播放控制、会话管理、语音命令等子 hooks。
 * 注意：聊天流已移到页面层，键盘快捷键在此处理。
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useSystemStore } from '@/store/systemStore';
import { useEngine, useASR } from '@/services';
import { usePlaybackController } from './usePlaybackController';
import { useSessionManager } from './useSessionManager';
import { useVoiceCommandHandler } from './useVoiceCommandHandler';
import type { UserEmotion } from '@/core/vision/visionMapper';
import { requestImmersiveArSession } from '@/core/performance/arSession';
import { revokeCustomAvatarObjectUrl } from '@/core/avatar/avatarSourceAdapter';

export function useAdvancedDigitalHumanController() {
  // 子 hooks
  const playback = usePlaybackController();
  const session = useSessionManager();

  // 直接访问 store
  const autoRotate = useDigitalHumanStore((s) => s.autoRotate);
  const toggleAutoRotate = useDigitalHumanStore((s) => s.toggleAutoRotate);
  const toggleMute = useDigitalHumanStore((s) => s.toggleMute);
  const setRecording = useDigitalHumanStore((s) => s.setRecording);
  const avatarSource = useDigitalHumanStore((s) => s.avatarSource);
  const setCustomAvatar = useDigitalHumanStore((s) => s.setCustomAvatar);
  const activateProceduralAvatar = useDigitalHumanStore((s) => s.useProceduralAvatar);
  const setAvatarLoadState = useDigitalHumanStore((s) => s.setAvatarLoadState);
  const recordVisionEmotion = useDigitalHumanStore((s) => s.recordVisionEmotion);
  const recordVisionMotion = useDigitalHumanStore((s) => s.recordVisionMotion);
  const error = useSystemStore((s) => s.error);
  const clearError = useSystemStore((s) => s.clearError);
  const setConnectionStatus = useSystemStore((s) => s.setConnectionStatus);
  const setError = useSystemStore((s) => s.setError);
  const immersiveMode = useSystemStore((s) => s.immersiveMode);
  const immersiveSession = useSystemStore((s) => s.immersiveSession);
  const startImmersiveAr = useSystemStore((s) => s.startImmersiveAr);
  const setImmersiveSession = useSystemStore((s) => s.setImmersiveSession);
  const clearImmersiveSession = useSystemStore((s) => s.clearImmersiveSession);

  // 服务
  const engine = useEngine();
  const asr = useASR();

  // 本地状态
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 设置面板控制
  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            toggleSettings();
          }
          break;
        case 'escape':
          closeSettings();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSettings, closeSettings]);

  // 错误自动清除
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(id);
  }, [error, clearError]);

  // 模型加载回调
  const handleModelLoad = useCallback(() => {
    setAvatarLoadState('ready');
  }, [setAvatarLoadState]);

  const handleAvatarUpload = useCallback(
    (file: File) => {
      const nextModelUrl = URL.createObjectURL(file);
      revokeCustomAvatarObjectUrl(avatarSource, URL.revokeObjectURL);
      setCustomAvatar({
        modelUrl: nextModelUrl,
        fileName: file.name,
      });
      setAvatarLoadState('idle');
      toast.success('已切换到自定义头像');
    },
    [avatarSource, setAvatarLoadState, setCustomAvatar],
  );

  const handleUseBuiltInAvatar = useCallback(() => {
    revokeCustomAvatarObjectUrl(avatarSource, URL.revokeObjectURL);
    activateProceduralAvatar();
    setAvatarLoadState('ready');
    toast.success('已切换到内置头像');
  }, [activateProceduralAvatar, avatarSource, setAvatarLoadState]);

  const handleAvatarLoad = useCallback(
    (model: unknown) => {
      if (
        model &&
        typeof model === 'object' &&
        'type' in model &&
        (model as { type: unknown }).type === 'procedural-fallback'
      ) {
        const error =
          'error' in model && typeof (model as { error?: unknown }).error === 'string'
            ? (model as { error: string }).error
            : '自定义头像加载失败';
        revokeCustomAvatarObjectUrl(avatarSource, URL.revokeObjectURL);
        activateProceduralAvatar();
        setAvatarLoadState('error', error);
        setError(error);
        return;
      }

      handleModelLoad();
    },
    [activateProceduralAvatar, avatarSource, handleModelLoad, setAvatarLoadState, setError],
  );

  const handleToggleImmersiveAr = useCallback(async () => {
    if (immersiveMode === 'ar-active' && immersiveSession) {
      await immersiveSession.end();
      clearImmersiveSession();
      toast.info('已退出 AR 模式');
      return;
    }

    startImmersiveAr();

    try {
      const session = await requestImmersiveArSession();
      session.addEventListener('end', () => {
        clearImmersiveSession();
      });
      setImmersiveSession(session);
      toast.success('已进入 AR 模式');
    } catch (error) {
      const message = error instanceof Error ? error.message : '进入 AR 模式失败';
      clearImmersiveSession(message);
      setError(message);
      toast.info(message);
    }
  }, [
    clearImmersiveSession,
    immersiveMode,
    immersiveSession,
    setError,
    setImmersiveSession,
    startImmersiveAr,
  ]);

  // 录音控制
  const handleToggleRecording = useCallback(() => {
    const isRecording = useDigitalHumanStore.getState().isRecording;
    if (isRecording) {
      asr.stop();
      setRecording(false);
      toast.info('录音已停止');
      return;
    }

    const started = asr.start();
    if (started) {
      setRecording(true);
      toast.success('正在聆听...');
    }
  }, [asr, setRecording]);

  // 表情控制
  const handleExpressionChange = useCallback(
    (expression: string, intensity: number) => {
      engine.setExpression(expression);
      engine.setExpressionIntensity(intensity);
    },
    [engine],
  );

  // 行为控制
  const handleBehaviorChange = useCallback(
    (behavior: string, params: Record<string, unknown>) => {
      engine.setBehavior(behavior, params);
    },
    [engine],
  );

  // 情绪控制
  const handleEmotionChange = useCallback(
    (emotion: UserEmotion) => {
      recordVisionEmotion(emotion);
      engine.setEmotion(emotion);
    },
    [engine, recordVisionEmotion],
  );

  // 头部动作
  const handleHeadMotion = useCallback(
    (motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand') => {
      recordVisionMotion(motion);
      engine.playAnimation(motion);
    },
    [engine, recordVisionMotion],
  );

  // 语音命令处理（需要外部传入 handleChatSend）
  const { handleVoiceCommand } = useVoiceCommandHandler();

  return useMemo(
    () => ({
      // 来自子 hooks
      ...playback,
      ...session,

      // 本地状态
      activeTab,
      autoRotate,
      showSettings,

      // 回调
      closeSettings,
      handleBehaviorChange,
      handleEmotionChange,
      handleExpressionChange,
      handleHeadMotion,
      handleToggleImmersiveAr,
      handleAvatarLoad,
      handleAvatarUpload,
      handleModelLoad: handleAvatarLoad,
      handleUseBuiltInAvatar,
      handleToggleRecording,
      handleVoiceCommand,
      setActiveTab,
      toggleAutoRotate,
      toggleMute,
      toggleSettings,

      // 服务访问（供 useChatStream 使用）
      setConnectionStatus,
      setError,
      clearError,
    }),
    [
      playback,
      session,
      activeTab,
      autoRotate,
      showSettings,
      closeSettings,
      handleBehaviorChange,
      handleEmotionChange,
      handleExpressionChange,
      handleHeadMotion,
      handleToggleImmersiveAr,
      handleAvatarLoad,
      handleAvatarUpload,
      handleUseBuiltInAvatar,
      handleToggleRecording,
      handleVoiceCommand,
      toggleAutoRotate,
      toggleMute,
      toggleSettings,
      setConnectionStatus,
      setError,
      clearError,
    ],
  );
}
