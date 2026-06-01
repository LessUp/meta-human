import { describe, expect, it } from 'vitest';
import { normalizeDialogueRequestPayload } from '../core/dialogue/dialoguePayload';

describe('normalizeDialogueRequestPayload', () => {
  it('derives messages from userText when messages are missing', () => {
    const payload = normalizeDialogueRequestPayload({
      userText: '你好',
    });

    expect(payload.messages).toEqual([{ role: 'user', content: '你好' }]);
  });

  it('derives userText from latest user message when userText is empty', () => {
    const payload = normalizeDialogueRequestPayload({
      userText: '   ',
      messages: [
        { role: 'assistant', content: 'hi' },
        { role: 'user', content: ' latest question ' },
      ],
    });

    expect(payload.userText).toBe('latest question');
  });

  it('merges context into metadata and meta aliases', () => {
    const payload = normalizeDialogueRequestPayload({
      userText: 'hello',
      context: { locale: 'zh-CN' },
      metadata: { channel: 'web' },
    });

    expect(payload.metadata).toMatchObject({
      channel: 'web',
      context: { locale: 'zh-CN' },
    });
    expect(payload.meta).toEqual(payload.metadata);
  });
});
