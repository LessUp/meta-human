/**
 * 高级数字人控制器 Hook。
 *
 * 协调播放控制、会话管理、语音命令等子 hooks。
 * 注意：聊天流和键盘快捷键已移到各自的位置。
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useSystemStore } from '@/store/systemStore';
import { useEngine, useASR } from '@/core/services';
import { usePlaybackController } from './usePlaybackController';
import { useSessionManager } from './useSessionManager';
import { useVoiceCommandHandler } from './useVoiceCommandHandler';
import type { UserEmotion } from '@/core/vision/visionMapper';

export function useAdvancedDigitalHumanController() {
  // 子 hooks
  const playback = usePlaybackController();
  const session = useSessionManager();

  // 直接访问 store
  const autoRotate = useDigitalHumanStore((s) => s.autoRotate);
  const toggleAutoRotate = useDigitalHumanStore((s) => s.toggleAutoRotate);
  const toggleMute = useDigitalHumanStore((s) => s.toggleMute);
  const setRecording = useDigitalHumanStore((s) => s.setRecording);
  const error = useSystemStore((s) => s.error);
  const clearError = useSystemStore((s) => s.clearError);
  const setConnectionStatus = useSystemStore((s) => s.setConnectionStatus);
  const setError = useSystemStore((s) => s.setError);

  // 服务
  const engine = useEngine();
  const asr = useASR();

  // 本地状态
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 错误自动清除
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(id);
  }, [error, clearError]);

  // 引擎清理
  useEffect(() => {
    return () => {
      engine.dispose();
    };
  }, [engine]);

  // 模型加载回调
  const handleModelLoad = useCallback(() => {
    // toast.success('数字人接口已上线');
  }, []);

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
      engine.setEmotion(emotion);
    },
    [engine],
  );

  // 头部动作
  const handleHeadMotion = useCallback(
    (motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand') => {
      engine.playAnimation(motion);
    },
    [engine],
  );

  // 设置面板控制
  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

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
      handleModelLoad,
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
      handleModelLoad,
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
