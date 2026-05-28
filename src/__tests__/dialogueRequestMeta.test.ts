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
});
