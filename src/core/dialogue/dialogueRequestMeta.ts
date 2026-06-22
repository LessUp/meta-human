import type { Language } from '@/lib/i18n';
import type { UserEmotion } from '@/core/vision/visionMapper';

export type DialogueVisionContext = {
  emotion: UserEmotion;
  motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand' | null;
  updatedAt: number | null;
};

export type DialogueSpeechContext = {
  voiceName: string | null;
  rate: number;
  pitch: number;
  volume: number;
};

export type DialogueRequestMetaInput = {
  timestamp: number;
  language: Language;
  speech: DialogueSpeechContext;
  vision: DialogueVisionContext | null;
  characterId?: string;
};

export function buildDialogueRequestMeta({
  timestamp,
  language,
  speech,
  vision,
  characterId,
}: DialogueRequestMetaInput): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    timestamp,
    language,
    speech: {
      voiceName: speech.voiceName,
      rate: speech.rate,
      pitch: speech.pitch,
      volume: speech.volume,
    },
    vision,
  };
  if (characterId) {
    meta.characterId = characterId;
  }
  return meta;
}
