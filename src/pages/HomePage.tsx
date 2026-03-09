import React, { useState, useCallback, useEffect } from "react";
import { useDigitalHumanStore } from "@/store/digitalHumanStore";
import { digitalHumanEngine } from "@/core/avatar/DigitalHumanEngine";
import { asrService } from "@/core/audio/audioService";
import { usePageVisibility } from "@/hooks/usePerformance";
import { useChat } from "@/hooks/useChat";
import { useConnection } from "@/hooks/useConnection";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoError } from "@/hooks/useAutoError";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

import StageLayout from "@/components/layouts/StageLayout";
import StageHeader from "@/components/layouts/StageHeader";
import MobileHeader from "@/components/layouts/MobileHeader";
import SettingsDrawer from "@/components/layouts/SettingsDrawer";
import InteractiveArea from "@/components/layouts/InteractiveArea";
import MobileInteractiveArea from "@/components/layouts/MobileInteractiveArea";
import DigitalHumanViewer from "@/components/viewer/DigitalHumanViewer";
import useIsMobile from "@/hooks/useMediaQuery";

/**
 * 首页 — 数字人交互主界面
 *
 * 参考 airi 项目的 index.vue 架构，将页面作为薄编排器：
 * - 逻辑全部提取到 hooks（useChat, useConnection, useVoiceControl, useKeyboardShortcuts）
 * - UI 拆分为布局组件（StageLayout, StageHeader, SettingsDrawer）
 * - 交互区域按设备分离（InteractiveArea / MobileInteractiveArea）
 * - 3D 场景作为全屏背景层
 */
export default function HomePage() {
  const { isPlaying, isRecording, autoRotate } = useDigitalHumanStore();
  const { isDark } = useTheme();

  // --- 组合 Hooks ---
  const {
    chatInput,
    setChatInput,
    isChatLoading,
    messagesEndRef,
    handleChatSend,
    clearInput,
  } = useChat();

  const { handleReconnect } = useConnection();
  const { handleToggleRecording, handleVoiceCommand, handleToggleMute } =
    useVoiceControl(handleChatSend);
  const { error, clearError } = useAutoError();

  // --- 本地 UI 状态 ---
  const [showSettings, setShowSettings] = useState(false);
  const [isPageActive, setIsPageActive] = useState(true);
  const isMobile = useIsMobile();

  // --- 播放/暂停/重置 ---
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      digitalHumanEngine.pause();
      toast.info("已暂停");
    } else {
      digitalHumanEngine.play();
      toast.success("已播放");
    }
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    digitalHumanEngine.reset();
    toast.info("系统已重置");
  }, []);

  const handleModelLoad = useCallback((_model: unknown) => {
    toast.success("数字人接口已上线");
  }, []);

  // --- 页面可见性优化 ---
  const { onPause, onResume } = usePageVisibility();

  useEffect(() => {
    const unsubPause = onPause(() => {
      setIsPageActive(false);
      if (isRecording) asrService.stop();
    });
    const unsubResume = onResume(() => {
      setIsPageActive(true);
    });
    return () => {
      unsubPause();
      unsubResume();
    };
  }, [onPause, onResume, isRecording]);

  // --- 键盘快捷键 ---
  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onReset: handleReset,
    onToggleRecording: handleToggleRecording,
    onToggleMute: handleToggleMute,
    onToggleSettings: () => setShowSettings((prev) => !prev),
    onVoiceCommand: handleVoiceCommand,
  });

  // --- 共享的交互区域 props ---
  const interactiveProps = {
    chatInput,
    onChatInputChange: setChatInput,
    onChatSend: () => handleChatSend(),
    onToggleRecording: handleToggleRecording,
    isChatLoading,
    messagesEndRef,
    error,
    onDismissError: clearError,
  };

  return (
    <StageLayout>
      {/* 全屏 3D 背景 */}
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

      {/* 头部 HUD — 响应式切换 */}
      {isMobile ? (
        <MobileHeader onToggleSettings={() => setShowSettings((s) => !s)} />
      ) : (
        <StageHeader
          onReconnect={handleReconnect}
          onToggleSettings={() => setShowSettings((s) => !s)}
          showSettings={showSettings}
        />
      )}

      {/* 设置抽屉 */}
      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onToggleRecording={handleToggleRecording}
        onVoiceCommand={handleVoiceCommand}
        onChatSend={(text) => handleChatSend(text)}
      />

      {/* 交互区域 — 响应式切换 */}
      {isMobile ? (
        <MobileInteractiveArea {...interactiveProps} />
      ) : (
        <InteractiveArea {...interactiveProps} />
      )}
    </StageLayout>
  );
}
