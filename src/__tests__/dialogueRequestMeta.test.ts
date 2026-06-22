import { describe, expect, it } from 'vitest';
import { buildDialogueRequestMeta } from '@/core/dialogue/dialogueRequestMeta';

describe('buildDialogueRequestMeta', () => {
  it('collects language, speech settings, and recent vision context', () => {
    const meta = buildDialogueRequestMeta({
      timestamp: 1_700_000_000_000,
      language: 'en',
      speech: {
        voiceName: 'English Voice',
        rate: 1.1,
        pitch: 0.9,
        volume: 0.7,
      },
      vision: {
        emotion: 'happy',
        motion: 'nod',
        updatedAt: 1_700_000_000_123,
      },
    });

    expect(meta).toEqual({
      timestamp: 1_700_000_000_000,
      language: 'en',
      speech: {
        voiceName: 'English Voice',
        rate: 1.1,
        pitch: 0.9,
        volume: 0.7,
      },
      vision: {
        emotion: 'happy',
        motion: 'nod',
        updatedAt: 1_700_000_000_123,
      },
    });
  });

  it('includes characterId when provided', () => {
    const meta = buildDialogueRequestMeta({
      timestamp: 1_700_000_000_000,
      language: 'zh-CN',
      speech: { voiceName: null, rate: 1, pitch: 1, volume: 0.8 },
      vision: null,
      characterId: 'serious-advisor',
    });

    expect(meta.characterId).toBe('serious-advisor');
  });

  it('omits characterId when not provided', () => {
    const meta = buildDialogueRequestMeta({
      timestamp: 1_700_000_000_000,
      language: 'zh-CN',
      speech: { voiceName: null, rate: 1, pitch: 1, volume: 0.8 },
      vision: null,
    });

    expect('characterId' in meta).toBe(false);
  });
});
