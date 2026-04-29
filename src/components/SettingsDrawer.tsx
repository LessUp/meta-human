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
      {show && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="设置面板"
        className={`fixed inset-y-0 right-0 z-40 h-[100dvh] w-full max-w-full border-l border-white/10 bg-black/85 backdrop-blur-xl transition-transform duration-500 ease-out sm:w-80 md:w-96 ${show ? 'translate-x-0' : 'pointer-events-none translate-x-full'}`}
      >
        <div className="flex h-full flex-col p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-medium text-white/90">
              <Settings className="h-4 w-4" /> Control Systems
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
                aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-gray-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <button
                onClick={onClose}
                aria-label="关闭设置"
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-white/5 p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => onTabChange(tab)}
                className={`min-w-[4.5rem] flex-1 rounded-md px-2 py-2 text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            aria-label={activeTab}
            className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-1 sm:pr-2"
          >
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
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
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                Vision Mirror Module requires camera access.
                <VisionMirrorPanel
                  onEmotionChange={(emotion) => {
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
