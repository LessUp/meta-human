// voiceStore — 录音/静音/语音合成状态
// 参考 AIRI 领域分离设计
import { create } from 'zustand';

interface VoiceState {
  isRecording: boolean;
  isMuted: boolean;
  isSpeaking: boolean;

  setRecording: (recording: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isRecording: false,
  isMuted: false,
  isSpeaking: false,

  setRecording: (recording) => set({ isRecording: recording }),
  setMuted: (muted) => set({ isMuted: muted }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  startRecording: () => {
    set({ isRecording: true });
    // 录音超时保护（30秒）
    setTimeout(() => {
      if (get().isRecording) {
        get().stopRecording();
      }
    }, 30000);
  },

  stopRecording: () => set({ isRecording: false }),

  toggleMute: () => set({ isMuted: !get().isMuted }),
}));
