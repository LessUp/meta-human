import DigitalHumanViewer from '@/components/DigitalHumanViewer';
import TopHUD from '@/components/TopHUD';
import SettingsDrawer from '@/components/SettingsDrawer';
import ChatDock from '@/components/ChatDock';
import { useAdvancedDigitalHumanController } from '@/hooks/useAdvancedDigitalHumanController';

export default function AdvancedDigitalHumanPage() {
  const {
    activeTab,
    autoRotate,
    chatInput,
    closeSettings,
    handleBehaviorChange,
    handleChatSend,
    handleEmotionChange,
    handleExpressionChange,
    handleHeadMotion,
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
  } = useAdvancedDigitalHumanController();

  return (
    <div className="relative isolate h-[100dvh] min-h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-blue-500/30">
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
        onToggleSettings={toggleSettings}
        onReconnect={reconnect}
        onNewSession={handleNewSession}
      />

      <SettingsDrawer
        show={showSettings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={closeSettings}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onToggleRecording={handleToggleRecording}
        onToggleMute={toggleMute}
        onToggleAutoRotate={toggleAutoRotate}
        onVoiceCommand={handleVoiceCommand}
        onChatSend={handleChatSend}
        onExpressionChange={handleExpressionChange}
        onBehaviorChange={handleBehaviorChange}
        onEmotionChange={handleEmotionChange}
        onHeadMotion={handleHeadMotion}
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
