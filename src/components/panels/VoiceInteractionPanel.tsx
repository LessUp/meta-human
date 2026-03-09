// VoiceInteractionPanel — 语音交互面板
// 重构自 VoiceInteractionPanel.dark.tsx，使用共享 widgets
import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play } from 'lucide-react';
import { ttsService, asrService } from '@/core/audio/audioService';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import PanelHeader from '@/components/widgets/PanelHeader';
import Slider from '@/components/widgets/Slider';

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
    if (hasSpeechSynthesis) loadVoices();
    return () => { asrService.stop(); };
  }, []);

  const loadVoices = () => {
    const voices = ttsService.getVoices();
    setAvailableVoices(voices);
    const chineseVoice = voices.find(v => v.lang.includes('zh'));
    setVoice(chineseVoice || voices[0] || null);
  };

  const toggleRecording = () => {
    if (!isSupported) return;
    if (isRecording) {
      asrService.stop();
      setRecording(false);
    } else {
      asrService.start({
        mode: 'dictation',
        onResult: (text: string) => { setTranscript(text); onTranscript(text); }
      });
    }
  };

  const speakText = (text: string) => {
    if (isMuted) return;
    ttsService.speakWithOptions(text, { lang: 'zh-CN', volume, pitch, rate, voiceName: voice?.name });
    onSpeak?.(text);
  };

  const testVoice = () => { speakText('您好！这是数字人语音交互系统的测试。'); };

  if (!isSupported) {
    return (
      <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-yellow-400">
          <VolumeX size={20} />
          <span className="font-medium text-sm">浏览器不支持语音功能</span>
        </div>
        <p className="text-xs text-yellow-400/70 mt-2">请使用支持 Web Speech API 的现代浏览器，如 Chrome、Edge 或 Safari。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeader title="语音交互">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-white/20'}`} />
          <span className="text-xs text-slate-500 dark:text-white/60">{isRecording ? '录音中' : '待机'}</span>
        </div>
      </PanelHeader>

      {/* 语音识别控制 */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">语音识别</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all text-sm ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-900/50'
                : 'bg-white/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isRecording ? '停止录音' : '开始录音'}</span>
          </button>
          <button
            onClick={() => toggleMute()}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all text-sm border ${
              isMuted
                ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/5'
                : 'bg-purple-500/20 text-purple-500 dark:text-purple-400 border-purple-500/50'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? '取消静音' : '静音'}</span>
          </button>
        </div>

        {transcript && (
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3">
            <div className="text-xs text-slate-400 dark:text-white/40 mb-1">识别结果:</div>
            <div className="text-sm text-slate-800 dark:text-white/90">{transcript}</div>
          </div>
        )}
      </div>

      {/* 语音合成设置 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">语音合成设置</h4>
          <button onClick={testVoice} className="flex items-center space-x-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs transition-colors">
            <Play size={12} /><span>测试</span>
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-500 dark:text-white/50 mb-1.5">语音选择</label>
          <select
            value={voice?.name || ''}
            onChange={(e) => setVoice(availableVoices.find(v => v.name === e.target.value) || null)}
            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white/90 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
          >
            {availableVoices.map((v) => (
              <option key={v.name} value={v.name} className="bg-gray-900 text-white">{v.name} ({v.lang})</option>
            ))}
          </select>
        </div>

        {/* 滑块控制 — 使用共享 Slider */}
        <div className="space-y-3">
          <Slider label="音量" value={volume} onChange={setVolume} />
          <Slider label="音调" value={pitch} min={0.5} max={2} onChange={setPitch} format={(v) => v.toFixed(1)} />
          <Slider label="语速" value={rate} min={0.5} max={2} onChange={setRate} format={(v) => v.toFixed(1)} />
        </div>
      </div>

      {/* 快速测试 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">快速测试</h4>
        <div className="grid grid-cols-2 gap-2">
          {['您好！我是数字人助手。', '今天天气真不错！', '有什么可以帮助您的吗？', '感谢您的使用！'].map((text, i) => (
            <button key={i} onClick={() => speakText(text)} className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20 rounded-lg text-xs transition-colors text-left truncate">
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
