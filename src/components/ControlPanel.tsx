import React from 'react';
import { Play, Pause, RotateCcw, Settings, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

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
  const voiceCommands = [
    { command: '打招呼', label: '打招呼' },
    { command: '跳舞', label: '跳舞' },
    { command: '说话', label: '说话' },
    { command: '表情', label: '表情' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">数字人控制面板</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">{isRecording ? '录音中' : '待机'}</span>
        </div>
      </div>

      {/* 播放控制 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">播放控制</h3>
        <div className="flex space-x-2">
          <button
            onClick={onPlayPause}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? '暂停' : '播放'}</span>
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            <span>重置</span>
          </button>
          
          <button
            onClick={onToggleAutoRotate}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              autoRotate 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            <Settings size={16} />
            <span>自动旋转</span>
          </button>
        </div>
      </div>

      {/* 语音交互 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">语音交互</h3>
        <div className="flex space-x-2">
          <button
            onClick={onToggleRecording}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isRecording ? '停止录音' : '开始录音'}</span>
          </button>
          
          <button
            onClick={onToggleMute}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isMuted 
                ? 'bg-gray-300 hover:bg-gray-400 text-gray-700' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? '取消静音' : '静音'}</span>
          </button>
        </div>
      </div>

      {/* 快速命令 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">快速命令</h3>
        <div className="grid grid-cols-2 gap-2">
          {voiceCommands.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => onVoiceCommand(cmd.command)}
              className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm transition-colors"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 状态信息 */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">状态信息</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>连接状态:</span>
            <span className="text-green-600">在线</span>
          </div>
          <div className="flex justify-between">
            <span>语音识别:</span>
            <span className="text-blue-600">就绪</span>
          </div>
          <div className="flex justify-between">
            <span>语音合成:</span>
            <span className="text-blue-600">就绪</span>
          </div>
        </div>
      </div>
    </div>
  );
}