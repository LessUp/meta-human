import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalFetch = global.fetch;

describe('dialogueService endpoint discovery', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', 'http://primary:8000');
    vi.stubEnv('VITE_API_BASE_URL_FALLBACKS', 'http://backup:8000');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('checks fallback health endpoints when the primary endpoint is unavailable', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('primary down'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: null,
        json: async () => ({}),
      } as Response);

    const { checkServerHealth } = await import('@/core/dialogue/dialogueService');
    const healthy = await checkServerHealth();

    expect(healthy).toBe(true);
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBe(
      'http://primary:8000/health',
    );
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[0]).toBe(
      'http://backup:8000/health',
    );
  });

  it('retries chat requests against the fallback endpoint after a primary network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: null,
        json: async () => ({
          replyText: 'backup reply',
          emotion: 'neutral',
          action: 'idle',
        }),
      } as Response);

    const { sendUserInput } = await import('@/core/dialogue/dialogueService');
    const { useSystemStore } = await import('@/store/systemStore');
    const result = await sendUserInput({ userText: 'hello' }, { maxRetries: 0 });

    expect(result.connectionStatus).toBe('connected');
    expect(result.response.replyText).toBe('backup reply');
    expect(
      (
        useSystemStore.getState() as unknown as {
          connectionDiagnostics: { activeEndpoint?: string; failoverCount?: number };
        }
      ).connectionDiagnostics,
    ).toMatchObject({
      activeEndpoint: 'http://backup:8000',
      failoverCount: 1,
    });
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBe(
      'http://primary:8000/v1/chat',
    );
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[0]).toBe(
      'http://backup:8000/v1/chat',
    );
  });

  it('retries streaming requests against the fallback endpoint after a primary network failure', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'token', content: 'backup' })}\n\n`),
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done', replyText: 'backup', emotion: 'neutral', action: 'idle' })}\n\n`,
          ),
        );
        controller.close();
      },
    });

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: stream,
      } as Response);

    const { streamUserInput } = await import('@/core/dialogue/dialogueService');
    const tokens: string[] = [];

    for await (const token of streamUserInput({ userText: 'hello' }, { maxRetries: 0 })) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['backup']);
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBe(
      'http://primary:8000/v1/chat/stream',
    );
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[0]).toBe(
      'http://backup:8000/v1/chat/stream',
    );
  });
});
