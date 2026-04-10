import React from 'react';
import { Play, Pause, RotateCcw, Settings, Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useDigitalHumanStore, type ConnectionStatus } from '../store/digitalHumanStore';

interface ControlPanelProps {
  isPlaying: boolean;
  isRecording: boolean;
  isMuted: boolean;
  autoRotate: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onToggleRecording: () => void;
  onToggleMute: () => void;
  onToggleAutoRotate: () => void;
  onVoiceCommand: (command: string) => void;
}

// 连接状态显示配置
const connectionStatusConfig: Record<ConnectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected: { label: '在线', color: 'text-green-400', icon: <Wifi className="w-3 h-3" /> },
  connecting: { label: '连接中', color: 'text-yellow-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  disconnected: { label: '离线', color: 'text-gray-400', icon: <WifiOff className="w-3 h-3" /> },
  error: { label: '错误', color: 'text-red-400', icon: <WifiOff className="w-3 h-3" /> },
};

export default function ControlPanel({
  isPlaying,
  isRecording,
  isMuted,
  autoRotate,
  onPlayPause,
  onReset,
  onToggleRecording,
  onToggleMute,
  onToggleAutoRotate,
  onVoiceCommand
}: ControlPanelProps) {
  // 从 store 获取状态
  const { connectionStatus, isSpeaking, currentBehavior } = useDigitalHumanStore();
  const statusConfig = connectionStatusConfig[connectionStatus];
  
  const voiceCommands = [
    { command: '打招呼', label: '👋 Say Hello' },
    { command: '跳舞', label: '💃 Dance' },
    { command: '说话', label: '🗣️ Speak' },
    { command: '表情', label: '😊 Emote' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <h2 className="text-lg font-medium text-white">控制面板</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-white/20'
            }`}
          ></div>
          <span className="text-xs text-white/60">{isRecording ? '录音进行中' : '空闲'}</span>
        </div>
      </div>

      {/* Playback Control */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">播放控制</h3>
        <div className="flex gap-2">
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? '暂停' : '播放'}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${
              isPlaying
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span className="text-sm">{isPlaying ? '暂停' : '播放'}</span>
          </button>

          <button
            onClick={onReset}
            aria-label="重置"
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
          >
            <RotateCcw size={16} />
          </button>
        </div>
         <button
            onClick={onToggleAutoRotate}
            aria-label="自动旋转摄像机"
            aria-pressed={autoRotate}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all text-sm border ${
              autoRotate
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            <Settings size={14} />
            <span>自动旋转摄像机</span>
          </button>
      </div>

      {/* Audio Control */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">语音交互</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={onToggleRecording}
            aria-label={isRecording ? '停止录音' : '开始录音'}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-900/50'
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span className="text-sm">{isRecording ? '停止录音' : '开始录音'}</span>
          </button>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? '取消静音' : '静音'}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all border ${
              isMuted
                ? 'bg-white/10 text-white/60 border-white/5'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="text-sm">{isMuted ? '取消静音' : '静音'}</span>
          </button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">快速命令</h3>
        <div className="grid grid-cols-2 gap-2">
          {voiceCommands.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => onVoiceCommand(cmd.command)}
              aria-label={`快速命令: ${cmd.label}`}
              className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs transition-colors text-left truncate"
            >
              {cmd.command}
            </button>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-black/40 rounded-xl p-4 space-y-3 border border-white/5">
        <h3 className="text-xs font-semibold text-white/40 uppercase">状态信息</h3>
        <div className="text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/60">连接状态</span>
            <span className={`flex items-center gap-1.5 ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">语音引擎</span>
            <span className={isSpeaking ? 'text-green-400' : 'text-blue-400'}>
              {isSpeaking ? '播放中' : '就绪'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">当前行为</span>
            <span className="text-purple-400 font-mono uppercase">{currentBehavior}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">录音状态</span>
            <span className={isRecording ? 'text-red-400' : 'text-white/40'}>
              {isRecording ? '录音中' : '待机'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
