import React from 'react';
import { Settings, X, Sun, Moon } from 'lucide-react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { digitalHumanEngine } from '../core/avatar';
import { toast } from 'sonner';
import { useFocusTrap, useTheme } from '../hooks';
import ControlPanel from './ControlPanel';
import ExpressionControlPanel from './ExpressionControlPanel';
import BehaviorControlPanel from './BehaviorControlPanel';
import VisionMirrorPanel from './VisionMirrorPanel';
import VoiceInteractionPanel from './VoiceInteractionPanel';

interface SettingsDrawerProps {
  show: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  // Callbacks forwarded from parent
  onPlayPause: () => void;
  onReset: () => void;
  onToggleRecording: () => void;
  onToggleMute: () => void;
  onToggleAutoRotate: () => void;
  onVoiceCommand: (cmd: string) => void;
  onChatSend: (text?: string) => void;
  onExpressionChange: (expression: string, intensity: number) => void;
  onBehaviorChange: (behavior: string, params: Record<string, unknown>) => void;
}

const TABS = ['basic', 'expression', 'behavior', 'vision', 'voice'] as const;

export default function SettingsDrawer({
  show,
  activeTab,
  onTabChange,
  onClose,
  onPlayPause,
  onReset,
  onToggleRecording,
  onToggleMute,
  onToggleAutoRotate,
  onVoiceCommand,
  onChatSend,
  onExpressionChange,
  onBehaviorChange,
}: SettingsDrawerProps) {
  const isPlaying = useDigitalHumanStore((s) => s.isPlaying);
  const isRecording = useDigitalHumanStore((s) => s.isRecording);
  const isMuted = useDigitalHumanStore((s) => s.isMuted);
  const autoRotate = useDigitalHumanStore((s) => s.autoRotate);
  const currentExpression = useDigitalHumanStore((s) => s.currentExpression);
  const currentBehavior = useDigitalHumanStore((s) => s.currentBehavior);

  const drawerRef = useFocusTrap<HTMLDivElement>(show, activeTab);
  const { toggleTheme, isDark } = useTheme();

  return (
    <>
      {/* Mobile backdrop */}
      {show && <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={onClose} />}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="设置面板"
        className={`absolute top-0 right-0 h-full w-full sm:w-80 md:w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 z-30 transform transition-transform duration-500 ease-out ${show ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-medium text-white/90 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Control Systems
            </h2>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              onClick={onClose}
              aria-label="关闭设置"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            role="tablist"
            className="flex space-x-1 bg-white/5 p-1 rounded-lg mb-6 overflow-x-auto"
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => onTabChange(tab)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all capitalize ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div
            role="tabpanel"
            aria-label={activeTab}
            className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar"
          >
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
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
              </div>
            )}
            {activeTab === 'expression' && (
              <ExpressionControlPanel
                currentExpression={currentExpression}
                onExpressionChange={onExpressionChange}
              />
            )}
            {activeTab === 'behavior' && (
              <BehaviorControlPanel
                currentBehavior={currentBehavior}
                onBehaviorChange={onBehaviorChange}
              />
            )}
            {activeTab === 'vision' && (
              <div className="text-sm text-gray-400 p-4 border border-white/10 rounded-xl bg-white/5">
                Vision Mirror Module requires camera access.
                <VisionMirrorPanel
                  onEmotionChange={(emotion) => {
                    // setEmotion 内部通过 EMOTION_TO_EXPRESSION 映射自动设置对应表情
                    digitalHumanEngine.setEmotion(emotion);
                  }}
                  onHeadMotion={(motion) => {
                    digitalHumanEngine.playAnimation(motion);
                    toast(`Motion Detected: ${motion}`, { icon: '📸' });
                  }}
                />
              </div>
            )}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <VoiceInteractionPanel onTranscript={(text) => onChatSend(text)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
