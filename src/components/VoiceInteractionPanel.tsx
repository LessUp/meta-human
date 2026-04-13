import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play } from 'lucide-react';
import { ttsService, asrService } from '../core/audio/audioService';
import { useDigitalHumanStore } from '../store/digitalHumanStore';

interface VoiceInteractionPanelProps {
  onTranscript: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export default function VoiceInteractionPanel({ onTranscript, onSpeak }: VoiceInteractionPanelProps) {
  const { isRecording, isMuted, setRecording, toggleMute } = useDigitalHumanStore();
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // 初始化语音识别和合成
  useEffect(() => {
    // 检查浏览器支持
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;

    setIsSupported(hasSpeechRecognition && hasSpeechSynthesis);

    if (hasSpeechSynthesis) {
      loadVoices();
    }

    return () => {
      asrService.stop();
    };
  }, []);

  // 加载语音
  const loadVoices = () => {
    const voices = ttsService.getVoices();
    setAvailableVoices(voices);

    // 优先选择中文语音
    const chineseVoice = voices.find(v => v.lang.includes('zh'));
    if (chineseVoice) {
      setVoice(chineseVoice);
    } else if (voices.length > 0) {
      setVoice(voices[0]);
    }
  };

  // 开始/停止录音
  const toggleRecording = () => {
    if (!isSupported) return;

    if (isRecording) {
      asrService.stop();
      setRecording(false);
    } else {
      asrService.start({
        mode: 'dictation',
        onResult: (text: string) => {
          setTranscript(text);
          onTranscript(text);
        }
      });
    }
  };

  // 语音合成
  const speakText = (text: string) => {
    if (isMuted) return;

    ttsService.speak(text, {
      lang: 'zh-CN',
      volume,
      pitch,
      rate,
      voiceName: voice?.name
    });

    onSpeak?.(text);
  };

  // 测试语音
  const testVoice = () => {
    speakText('您好！这是数字人语音交互系统的测试。');
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-yellow-300">
          <VolumeX size={20} />
          <span className="font-medium">浏览器不支持语音功能</span>
        </div>
        <p className="text-sm text-yellow-400/70 mt-2">
          请使用支持 Web Speech API 的现代浏览器，如 Chrome、Edge 或 Safari。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">语音交互</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-xs text-white/60">{isRecording ? '录音中' : '待机'}</span>
        </div>
      </div>

      {/* 语音识别控制 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleRecording}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-sm ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isRecording ? '停止录音' : '开始录音'}</span>
          </button>

          <button
            onClick={toggleMute}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-sm border ${
              isMuted
                ? 'bg-white/5 text-white/40 border-white/10'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? '取消静音' : '静音'}</span>
          </button>
        </div>

        {/* 识别结果 */}
        {transcript && (
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-white/40 mb-1">识别结果:</div>
            <div className="text-white/80 text-sm">{transcript}</div>
          </div>
        )}
      </div>

      {/* 语音合成控制 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">语音合成</span>
          <button
            onClick={testVoice}
            className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs transition-colors border border-green-500/30"
          >
            <Play size={14} />
            <span>测试</span>
          </button>
        </div>

        {/* 语音选择 */}
        <div>
          <label className="block text-xs text-white/40 mb-1">语音选择</label>
          <select
            value={voice?.name || ''}
            onChange={(e) => {
              const selectedVoice = availableVoices.find(v => v.name === e.target.value);
              setVoice(selectedVoice || null);
            }}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            {availableVoices.map((v) => (
              <option key={v.name} value={v.name} className="bg-gray-900 text-white">
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* 音量控制 */}
        <div>
          <label className="block text-xs text-white/40 mb-1">
            音量: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* 音调控制 */}
        <div>
          <label className="block text-xs text-white/40 mb-1">
            音调: {pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* 语速控制 */}
        <div>
          <label className="block text-xs text-white/40 mb-1">
            语速: {rate.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* 快速测试文本 */}
      <div className="space-y-3">
        <label className="text-xs text-white/40">快速测试文本</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            '您好！我是数字人助手。',
            '今天天气真不错！',
            '有什么可以帮助您的吗？',
            '感谢您的使用！'
          ].map((text, index) => (
            <button
              key={index}
              onClick={() => speakText(text)}
              className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300/80 border border-blue-500/20 rounded-lg text-xs transition-colors text-left"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
