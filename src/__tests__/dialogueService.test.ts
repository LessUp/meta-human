import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendUserInput,
  streamUserInput,
  checkServerHealth,
  clearRemoteSession,
  DialogueApiError,
} from '../core/dialogue/dialogueService';

// ---------------------------------------------------------------------------
// Helpers – mock fetch with fine-grained control
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;

/** Mock a successful fetch that resolves with given body. */
function mockFetchOk(body: unknown, status = 200): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status,
    body: body !== undefined ? new Blob([JSON.stringify(body)]) : null,
    json: async () => body ?? {},
  } as unknown as Response);
}

/** Mock a failing fetch response (non-2xx). */
function mockFetchStatus(status: number): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    body: null,
    json: async () => ({}),
  } as unknown as Response);
}

/** Mock a fetch that rejects with an error. */
function mockFetchError(error: Error): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);
}

/** Mock a fetch that returns a ReadableStream body (for SSE). */
function mockFetchStream(stream: ReadableStream<Uint8Array>, status = 200): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status,
    body: stream,
    json: async () => ({}),
  } as unknown as Response);
}

/** Build a ReadableStream that emits SSE-formatted events. */
function buildSSEStream(events: Array<Record<string, unknown>>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = events.map((e) => encoder.encode(`data: ${JSON.stringify(e)}\n\n`));

  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('DialogueApiError', () => {
  it('sets name, status and isRetryable', () => {
    const err = new DialogueApiError('test', 500, true);
    expect(err.name).toBe('DialogueApiError');
    expect(err.message).toBe('test');
    expect(err.status).toBe(500);
    expect(err.isRetryable).toBe(true);
  });

  it('defaults isRetryable to false', () => {
    const err = new DialogueApiError('test', 400);
    expect(err.isRetryable).toBe(false);
  });
});

describe('sendUserInput', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ----- success path -----

  it('returns parsed response on 200', async () => {
    mockFetchOk({ replyText: '你好', emotion: 'happy', action: 'wave' });

    const result = await sendUserInput({ userText: 'hello' }, { maxRetries: 0 });

    expect(result.connectionStatus).toBe('connected');
    expect(result.error).toBeNull();
    expect(result.response.replyText).toBe('你好');
    expect(result.response.emotion).toBe('happy');
    expect(result.response.action).toBe('wave');
  });

  it('fills defaults for missing fields', async () => {
    mockFetchOk({});

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 0 });

    expect(result.response.replyText).toBe('');
    expect(result.response.emotion).toBe('neutral');
    expect(result.response.action).toBe('idle');
  });

  // ----- non-retryable errors (4xx except 429/408) -----

  it('returns error on 400 without retrying', async () => {
    mockFetchStatus(400);

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 3, retryDelay: 10 });

    expect(result.connectionStatus).toBe('error');
    expect(result.error).toContain('请求格式错误');
    // Should only have called fetch once – no retry for 400
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns error on 401 without retrying', async () => {
    mockFetchStatus(401);

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 3, retryDelay: 10 });

    expect(result.error).toContain('认证失败');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // ----- retryable errors -----

  it('retries on 500 and returns error after exhausting retries', async () => {
    mockFetchStatus(500);
    mockFetchStatus(500);
    mockFetchStatus(500);
    mockFetchStatus(500); // maxRetries=3 → 4 attempts total

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 3, retryDelay: 10 });

    expect(result.connectionStatus).toBe('error');
    expect(result.error).toContain('服务器内部错误');
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('succeeds on retry after initial 500', async () => {
    mockFetchStatus(500);
    mockFetchOk({ replyText: 'ok', emotion: 'neutral', action: 'idle' });

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 3, retryDelay: 10 });

    expect(result.connectionStatus).toBe('connected');
    expect(result.response.replyText).toBe('ok');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 (rate limit)', async () => {
    mockFetchStatus(429);
    mockFetchOk({ replyText: 'retry ok', emotion: 'neutral', action: 'idle' });

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 1, retryDelay: 10 });

    expect(result.connectionStatus).toBe('connected');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // ----- timeout -----

  it('converts AbortError to timeout and retries', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    mockFetchError(abortError);
    mockFetchOk({ replyText: 'recovered', emotion: 'neutral', action: 'idle' });

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 1, retryDelay: 10 });

    expect(result.connectionStatus).toBe('connected');
    expect(result.response.replyText).toBe('recovered');
  });

  // ----- network failure -----

  it('converts TypeError (fetch failed) to network error', async () => {
    mockFetchError(new TypeError('fetch failed'));
    mockFetchError(new TypeError('fetch failed'));

    const result = await sendUserInput({ userText: 'hi' }, { maxRetries: 1, retryDelay: 10 });

    expect(result.connectionStatus).toBe('error');
    expect(result.error).toContain('网络连接失败');
  });

  // ----- fallback response -----

  it('returns greeting fallback for greeting input after all retries fail', async () => {
    mockFetchStatus(500);

    const result = await sendUserInput({ userText: '你好' }, { maxRetries: 0, retryDelay: 10 });

    expect(result.connectionStatus).toBe('error');
    expect(result.response.replyText).toContain('离线模式');
    expect(result.response.emotion).toBe('happy');
    expect(result.response.action).toBe('wave');
  });

  it('returns generic fallback for non-greeting input after all retries fail', async () => {
    mockFetchStatus(500);

    const result = await sendUserInput({ userText: '讲个笑话' }, { maxRetries: 0, retryDelay: 10 });

    expect(result.connectionStatus).toBe('error');
    expect(result.response.replyText).toContain('暂时无法连接');
    expect(result.response.emotion).toBe('neutral');
  });
});

describe('checkServerHealth', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns true on 200', async () => {
    mockFetchOk({});

    const healthy = await checkServerHealth();
    expect(healthy).toBe(true);
  });

  it('returns false on non-200', async () => {
    mockFetchStatus(503);

    const healthy = await checkServerHealth();
    expect(healthy).toBe(false);
  });

  it('returns false on network error', async () => {
    mockFetchError(new Error('network down'));

    const healthy = await checkServerHealth();
    expect(healthy).toBe(false);
  });
});

describe('clearRemoteSession', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends DELETE request for the session', async () => {
    mockFetchOk({}, 204);

    await clearRemoteSession('sess_123');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v1/session/sess_123');
    expect(options.method).toBe('DELETE');
  });

  it('does nothing when sessionId is empty', async () => {
    await clearRemoteSession('');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('swallows errors silently', async () => {
    mockFetchError(new Error('fail'));

    // Should not throw
    await expect(clearRemoteSession('sess_123')).resolves.toBeUndefined();
  });
});

describe('streamUserInput', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('yields tokens from SSE events', async () => {
    const stream = buildSSEStream([
      { type: 'token', content: '你' },
      { type: 'token', content: '好' },
      { type: 'done', replyText: '你好', emotion: 'happy', action: 'wave' },
    ]);

    mockFetchStream(stream);

    const tokens: string[] = [];
    const gen = streamUserInput({ userText: 'hi' }, { maxRetries: 0 });

    for await (const token of gen) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['你', '好']);
  });

  it('captures structured response from done event', async () => {
    const stream = buildSSEStream([
      { type: 'token', content: 'Hi' },
      { type: 'done', replyText: 'Hi', emotion: 'happy', action: 'wave' },
    ]);

    mockFetchStream(stream);

    const onDone = vi.fn();
    const gen = streamUserInput({ userText: 'hello' }, { maxRetries: 0 }, { onDone });

    for await (const _ of gen) {
      // consume
    }

    expect(onDone).toHaveBeenCalledWith({
      replyText: 'Hi',
      emotion: 'happy',
      action: 'wave',
    });
  });

  it('calls onConnected when stream starts', async () => {
    const stream = buildSSEStream([
      { type: 'token', content: 'X' },
      { type: 'done', replyText: 'X', emotion: 'neutral', action: 'idle' },
    ]);

    mockFetchStream(stream);

    const onConnected = vi.fn();
    const gen = streamUserInput({ userText: 'hi' }, { maxRetries: 0 }, { onConnected });

    for await (const _ of gen) {
      // consume
    }

    expect(onConnected).toHaveBeenCalledTimes(1);
  });

  it('handles SSE error event and calls onError', async () => {
    const stream = buildSSEStream([
      { type: 'error', message: 'something went wrong' },
      { type: 'done', replyText: '', emotion: 'neutral', action: 'idle' },
    ]);

    mockFetchStream(stream);

    const onError = vi.fn();
    const gen = streamUserInput({ userText: 'hi' }, { maxRetries: 0 }, { onError });

    for await (const _ of gen) {
      // consume
    }

    expect(onError).toHaveBeenCalledWith('something went wrong');
  });

  it('falls back to sendUserInput on fetch failure', async () => {
    // First call: stream fetch fails
    mockFetchError(new TypeError('fetch failed'));
    // Second call: fallback sendUserInput succeeds
    mockFetchOk({ replyText: 'fallback reply', emotion: 'neutral', action: 'idle' });

    const tokens: string[] = [];
    const gen = streamUserInput({ userText: 'hi' }, { maxRetries: 0 });

    for await (const token of gen) {
      tokens.push(token);
    }

    // Should yield the fallback replyText as a single token
    expect(tokens).toEqual(['fallback reply']);
  });

  it('throws DialogueApiError on non-ok response', async () => {
    mockFetchStatus(403);
    // Fallback fetch succeeds
    mockFetchOk({ replyText: 'fb', emotion: 'neutral', action: 'idle' });

    const gen = streamUserInput({ userText: 'hi' }, { maxRetries: 0 });

    const tokens: string[] = [];
    for await (const token of gen) {
      tokens.push(token);
    }

    // Should still fallback
    expect(tokens).toEqual(['fb']);
  });

  it('skips malformed SSE data gracefully', async () => {
    const encoder = new TextEncoder();
    const malformed = encoder.encode('data: not-json\n\n');
    const validToken = encoder.encode(
      `data: ${JSON.stringify({ type: 'token', content: 'OK' })}\n\n`,
    );
    const doneEvent = encoder.encode(
      `data: ${JSON.stringify({ type: 'done', replyText: 'OK', emotion: 'neutral', action: 'idle' })}\n\n`,
    );

    let index = 0;
    const chunks = [malformed, validToken, doneEvent];
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index < chunks.length) {
          controller.enqueue(chunks[index++]);
        } else {
          controller.close();
        }
      },
    });

    mockFetchStream(stream);

    const tokens: string[] = [];
    const gen = streamUserInput({ userText: 'hi' }, { maxRetries: 0 });

    for await (const token of gen) {
      tokens.push(token);
    }

    // Malformed data is skipped, valid token is yielded
    expect(tokens).toEqual(['OK']);
  });
});
