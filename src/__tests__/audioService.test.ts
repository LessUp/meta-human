import { describe, expect, it, vi } from 'vitest';

const moduleRunDialogueTurnMock = vi.fn((_: string, _options: unknown) => {
  throw new Error('ASRService should use injected dialogue runtime');
});

vi.mock('@/core/dialogue/dialogueOrchestrator', () => ({
  runDialogueTurn: (text: string, options: unknown) => moduleRunDialogueTurnMock(text, options),
}));

import { ASRService } from '@/core/audio/audioService';

describe('ASRService dialogue runtime', () => {
  it('routes backend dialogue through injected runtime', async () => {
    const dialogue = {
      runDialogueTurn: vi.fn().mockResolvedValue(undefined),
    };
    const state = {
      setRecording: vi.fn(),
      setBehavior: vi.fn(),
      setSpeaking: vi.fn(),
      setError: vi.fn(),
      setEmotion: vi.fn(),
      setExpression: vi.fn(),
      setAnimation: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
      setMuted: vi.fn(),
      isMuted: false,
      sessionId: 'session_test',
      currentBehavior: 'idle',
      addChatMessage: vi.fn(),
    };
    const tts = {
      speak: vi.fn().mockResolvedValue(undefined),
    };

    const TestableASRService = ASRService as unknown as new (...args: any[]) => ASRService;
    const asr = new TestableASRService({}, state, tts, dialogue);

    await (
      asr as unknown as { sendToDialogueService(text: string): Promise<void> }
    ).sendToDialogueService('你好');

    expect(dialogue.runDialogueTurn).toHaveBeenCalledWith(
      '你好',
      expect.objectContaining({
        sessionId: 'session_test',
        isMuted: false,
      }),
    );
    expect(moduleRunDialogueTurnMock).not.toHaveBeenCalled();
  });
});
