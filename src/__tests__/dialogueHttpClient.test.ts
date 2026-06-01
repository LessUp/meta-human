import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DialogueApiError,
  normalizeDialogueError,
  sendDialogueHttpRequest,
  sendDialogueStreamRequest,
} from '../core/dialogue/dialogueHttpClient';

const originalFetch = global.fetch;

describe('dialogueHttpClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('parses chat response payload', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        replyText: 'hi',
        emotion: 'happy',
        action: 'wave',
      }),
    } as Response);

    await expect(
      sendDialogueHttpRequest(
        {
          userText: 'hello',
        },
        {
          endpoint: 'http://localhost:8000',
          timeout: 5000,
        },
      ),
    ).resolves.toEqual({
      replyText: 'hi',
      emotion: 'happy',
      action: 'wave',
    });
  });

  it('throws retryable DialogueApiError on 500 response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      body: null,
      json: async () => ({}),
    } as Response);

    await expect(
      sendDialogueHttpRequest(
        { userText: 'hello' },
        {
          endpoint: 'http://localhost:8000',
          timeout: 5000,
        },
      ),
    ).rejects.toMatchObject({
      name: 'DialogueApiError',
      status: 500,
      isRetryable: true,
    });
  });

  it('normalizes fetch errors to retryable DialogueApiError', () => {
    const normalized = normalizeDialogueError(new TypeError('fetch failed'));
    expect(normalized).toBeInstanceOf(DialogueApiError);
    expect((normalized as DialogueApiError).isRetryable).toBe(true);
  });

  it('requires stream response body for SSE requests', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: null,
      json: async () => ({}),
    } as Response);

    await expect(
      sendDialogueStreamRequest(
        { userText: 'hello' },
        {
          endpoint: 'http://localhost:8000',
          timeout: 5000,
        },
      ),
    ).rejects.toMatchObject({
      name: 'DialogueApiError',
      isRetryable: true,
    });
  });
});
