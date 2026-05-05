import { useVoiceInteraction } from '../hooks/useVoiceInteraction';
import { Mic, MicOff, Volume2, VolumeX, Play } from 'lucide-react';

interface VoiceInteractionPanelProps {
  onTranscript: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export default function VoiceInteractionPanel({
  onTranscript,
  onSpeak,
}: VoiceInteractionPanelProps) {
  const voice = useVoiceInteraction({
    onTranscript,
    onSpeak,
  });

  const testVoice = () => {
    voice.speak('您好！这是数字人语音交互系统的测试。');
  };

  if (!voice.isSupported) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-200">
          <VolumeX size={20} />
          <span className="font-medium">浏览器不支持语音功能</span>
        </div>
        <p className="text-sm text-yellow-300 mt-2">
          请使用支持 Web Speech API 的现代浏览器，如 Chrome、Edge 或 Safari。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">语音交互</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${voice.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}
          ></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {voice.isRecording ? '录音中' : '待机'}
          </span>
        </div>
      </div>

      {/* 语音识别控制 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={voice.toggleRecording}
            aria-label={voice.isRecording ? '停止录音' : '开始录音'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              voice.isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {voice.isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{voice.isRecording ? '停止录音' : '开始录音'}</span>
          </button>

          <button
            onClick={voice.toggleMute}
            aria-label={voice.isMuted ? '取消静音' : '静音'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              voice.isMuted
                ? 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {voice.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{voice.isMuted ? '取消静音' : '静音'}</span>
          </button>
        </div>

        {/* 识别结果 */}
        {voice.transcript && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">识别结果:</div>
            <div className="text-gray-800 dark:text-gray-100">{voice.transcript}</div>
          </div>
        )}
      </div>

      {/* 语音合成控制 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200">语音合成设置</h4>
          <button
            onClick={testVoice}
            aria-label="测试语音"
            className="flex items-center space-x-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
          >
            <Play size={14} />
            <span>测试</span>
          </button>
        </div>

        {/* 语音选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            语音选择
          </label>
          <select
            value={voice.voice?.name || ''}
            onChange={(e) => {
              const selectedVoice = voice.availableVoices.find((v) => v.name === e.target.value);
              voice.setVoice(selectedVoice || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {voice.availableVoices.map((v) => (
              <option key={v.name} value={v.name} className="bg-gray-800 text-gray-100">
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* 音量控制 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            音量: {Math.round(voice.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voice.volume}
            onChange={(e) => voice.setVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 音调控制 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            音调: {voice.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voice.pitch}
            onChange={(e) => voice.setPitch(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 语速控制 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            语速: {voice.rate.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voice.rate}
            onChange={(e) => voice.setRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* 快速测试文本 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
          快速测试文本
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            '您好！我是数字人助手。',
            '今天天气真不错！',
            '有什么可以帮助您的吗？',
            '感谢您的使用！',
          ].map((text, index) => (
            <button
              key={index}
              onClick={() => voice.speak(text)}
              className="px-3 py-2 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded text-sm transition-colors text-left"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
