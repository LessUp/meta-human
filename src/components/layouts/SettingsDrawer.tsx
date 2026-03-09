import React, { useState } from "react";
import { Settings, X, Upload, User } from "lucide-react";
import { useDigitalHumanStore } from "@/store/digitalHumanStore";
import { digitalHumanEngine } from "@/core/avatar/DigitalHumanEngine";
import ControlPanel from "@/components/panels/ControlPanel";
import ExpressionControlPanel from "@/components/panels/ExpressionControlPanel";
import BehaviorControlPanel from "@/components/panels/BehaviorControlPanel";
import VoiceInteractionPanel from "@/components/panels/VoiceInteractionPanel";
import VisionMirrorPanel from "@/components/panels/VisionMirrorPanel";
import { toast } from "sonner";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  onToggleRecording: () => void;
  onVoiceCommand: (command: string) => void;
  onChatSend: (text: string) => void;
}

const TABS = [
  { key: "basic", label: "基础" },
  { key: "expression", label: "表情" },
  { key: "behavior", label: "行为" },
  { key: "vision", label: "视觉" },
  { key: "voice", label: "语音" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * 右侧设置抽屉面板
 * 参考 airi 的 settings page 模式，将所有控制面板组织在标签页中
 */
export default function SettingsDrawer({
  open,
  onClose,
  onPlayPause,
  onReset,
  onToggleRecording,
  onVoiceCommand,
  onChatSend,
}: SettingsDrawerProps) {
  const {
    isPlaying,
    isRecording,
    isMuted,
    autoRotate,
    currentExpression,
    currentBehavior,
    avatarType,
    setVrmModelUrl,
    toggleMute,
    toggleAutoRotate,
  } = useDigitalHumanStore();

  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  const handleExpressionChange = (expression: string, intensity: number) => {
    digitalHumanEngine.setExpression(expression);
    digitalHumanEngine.setExpressionIntensity(intensity);
  };

  const handleBehaviorChange = (
    behavior: string,
    params: Record<string, unknown>,
  ) => {
    digitalHumanEngine.setBehavior(behavior, params);
  };

  return (
    <div
      className={`absolute top-0 right-0 h-full w-80 sm:w-96 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 z-30 transform transition-transform duration-500 ease-out shadow-xl ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 md:p-6 h-full flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-lg font-medium text-slate-800 dark:text-white/90 flex items-center gap-2">
            <Settings className="w-4 h-4" /> 控制系统
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-gray-400" />
          </button>
        </div>

        {/* 标签导航 */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {activeTab === "basic" && (
            <BasicTab
              isPlaying={isPlaying}
              isRecording={isRecording}
              isMuted={isMuted}
              autoRotate={autoRotate}
              avatarType={avatarType}
              onPlayPause={onPlayPause}
              onReset={onReset}
              onToggleRecording={onToggleRecording}
              onToggleMute={toggleMute}
              onToggleAutoRotate={toggleAutoRotate}
              onVoiceCommand={onVoiceCommand}
              onSetVrmModelUrl={setVrmModelUrl}
            />
          )}
          {activeTab === "expression" && (
            <ExpressionControlPanel
              currentExpression={currentExpression}
              onExpressionChange={handleExpressionChange}
            />
          )}
          {activeTab === "behavior" && (
            <BehaviorControlPanel
              currentBehavior={currentBehavior}
              onBehaviorChange={handleBehaviorChange}
            />
          )}
          {activeTab === "vision" && <VisionTab />}
          {activeTab === "voice" && (
            <div className="space-y-4">
              <VoiceInteractionPanel
                onTranscript={(text) => onChatSend(text)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 基础控制标签页
 */
function BasicTab({
  isPlaying,
  isRecording,
  isMuted,
  autoRotate,
  avatarType,
  onPlayPause,
  onReset,
  onToggleRecording,
  onToggleMute,
  onToggleAutoRotate,
  onVoiceCommand,
  onSetVrmModelUrl,
}: {
  isPlaying: boolean;
  isRecording: boolean;
  isMuted: boolean;
  autoRotate: boolean;
  avatarType: string;
  onPlayPause: () => void;
  onReset: () => void;
  onToggleRecording: () => void;
  onToggleMute: () => void;
  onToggleAutoRotate: () => void;
  onVoiceCommand: (cmd: string) => void;
  onSetVrmModelUrl: (url: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/5">
        <ControlPanel
          isPlaying={isPlaying}
          isRecording={isRecording}
          isMuted={isMuted}
          autoRotate={autoRotate}
          onPlayPause={onPlayPause}
          onReset={onReset}
          onToggleRecording={onToggleRecording}
          onToggleMute={onToggleMute}
          onToggleAutoRotate={onToggleAutoRotate}
          onVoiceCommand={onVoiceCommand}
        />
      </div>

      {/* VRM 模型切换 */}
      <div className="bg-white/80 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/5 space-y-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-white/80 flex items-center gap-2">
          <User className="w-4 h-4" /> 角色模型
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onSetVrmModelUrl(null)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
              avatarType === "cyber"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            内置角色
          </button>
          <label
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
              avatarType === "vrm"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
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
                  onSetVrmModelUrl(url);
                  toast.success(`已加载 VRM 模型: ${file.name}`);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {avatarType === "vrm" && (
          <p className="text-xs text-green-500 dark:text-green-400">
            VRM 模型已加载，表情和动作已自动映射
          </p>
        )}
        <p className="text-xs text-slate-400 dark:text-white/30">
          支持 VRM 格式（.vrm），可从{" "}
          <a
            href="https://hub.vroid.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            VRoid Hub
          </a>{" "}
          或{" "}
          <a
            href="https://booth.pm/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            BOOTH
          </a>{" "}
          获取免费模型
        </p>
      </div>
    </div>
  );
}

/**
 * 视觉标签页
 */
function VisionTab() {
  return (
    <div className="text-sm text-slate-500 dark:text-gray-400 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-white/5">
      视觉镜像模块需要摄像头权限
      <VisionMirrorPanel
        onEmotionChange={(emotion) => {
          if (emotion === "happy") {
            digitalHumanEngine.setExpression("smile");
          } else if (emotion === "surprised") {
            digitalHumanEngine.setExpression("surprise");
          } else {
            digitalHumanEngine.setExpression("neutral");
          }
          digitalHumanEngine.setEmotion(emotion);
        }}
        onHeadMotion={(motion) => {
          digitalHumanEngine.playAnimation(motion);
          toast(`检测到动作: ${motion}`, { icon: "📸" });
        }}
      />
    </div>
  );
}
