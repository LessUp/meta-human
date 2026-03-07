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

    ttsService.speakWithOptions(text, {
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
      <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-yellow-400">
          <VolumeX size={20} />
          <span className="font-medium text-sm">浏览器不支持语音功能</span>
        </div>
        <p className="text-xs text-yellow-400/70 mt-2">
          请使用支持 Web Speech API 的现代浏览器，如 Chrome、Edge 或 Safari。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="text-lg font-medium text-white">语音交互</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-xs text-white/60">{isRecording ? '录音中' : '待机'}</span>
        </div>
      </div>

      {/* 语音识别控制 */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">语音识别</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all text-sm ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-900/50'
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isRecording ? '停止录音' : '开始录音'}</span>
          </button>

          <button
            onClick={() => toggleMute()}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all text-sm border ${
              isMuted
                ? 'bg-white/10 text-white/60 border-white/5'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? '取消静音' : '静音'}</span>
          </button>
        </div>

        {/* 识别结果 */}
        {transcript && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/40 mb-1">识别结果:</div>
            <div className="text-sm text-white/90">{transcript}</div>
          </div>
        )}
      </div>

      {/* 语音合成控制 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">语音合成设置</h4>
          <button
            onClick={testVoice}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs transition-colors"
          >
            <Play size={12} />
            <span>测试</span>
          </button>
        </div>

        {/* 语音选择 */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">语音选择</label>
          <select
            value={voice?.name || ''}
            onChange={(e) => {
              const selectedVoice = availableVoices.find(v => v.name === e.target.value);
              setVoice(selectedVoice || null);
            }}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/90 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
          >
            {availableVoices.map((v) => (
              <option key={v.name} value={v.name} className="bg-gray-900 text-white">
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* 滑块控制 */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">音量</label>
              <span className="text-xs font-mono text-blue-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">音调</label>
              <span className="text-xs font-mono text-blue-400">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.5" max="2" step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">语速</label>
              <span className="text-xs font-mono text-blue-400">{rate.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.5" max="2" step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 快速测试文本 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">快速测试</h4>
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
              className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs transition-colors text-left truncate"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
