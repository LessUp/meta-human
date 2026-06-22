import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSystemStore } from '@/store/systemStore';
import {
  applyRuntimeApiEndpoints,
  resetRuntimeApiEndpoints,
  resetDialogueServiceRoutingForTests,
} from '@/core/dialogue/dialogueService';

describe('RuntimeApiConfig: systemStore persistence', () => {
  beforeEach(() => {
    useSystemStore.getState().setRuntimeApiConfig(null);
    localStorage.clear();
  });

  it('setRuntimeApiConfig persists to localStorage', () => {
    useSystemStore.getState().setRuntimeApiConfig({
      baseUrl: 'http://override:9000',
      fallbacks: 'http://backup:9000',
    });

    const raw = localStorage.getItem('metahuman_runtime_api_config');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.baseUrl).toBe('http://override:9000');
    expect(parsed.fallbacks).toBe('http://backup:9000');
  });

  it('setRuntimeApiConfig(null) clears localStorage', () => {
    useSystemStore.getState().setRuntimeApiConfig({
      baseUrl: 'http://override:9000',
      fallbacks: '',
    });
    useSystemStore.getState().setRuntimeApiConfig(null);

    expect(localStorage.getItem('metahuman_runtime_api_config')).toBeNull();
    expect(useSystemStore.getState().runtimeApiConfig).toBeNull();
  });
});

describe('applyRuntimeApiEndpoints: dialogueService routing', () => {
  beforeEach(() => {
    resetDialogueServiceRoutingForTests();
  });

  afterEach(() => {
    resetDialogueServiceRoutingForTests();
  });

  it('applyRuntimeApiEndpoints switches active endpoint', async () => {
    applyRuntimeApiEndpoints('http://runtime-host:8000');

    // checkServerHealth 会尝试访问 runtime-host，我们只验证它会发起请求
    // 用 fetch mock 捕获 URL
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));

    await import('@/core/dialogue/dialogueService').then((m) => m.checkServerHealth());

    const calledUrl = fetchSpy.mock.calls[0]?.[0];
    expect(String(calledUrl)).toContain('http://runtime-host:8000');

    fetchSpy.mockRestore();
  });

  it('resetRuntimeApiEndpoints restores env default', async () => {
    applyRuntimeApiEndpoints('http://runtime-host:8000');
    resetRuntimeApiEndpoints();

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));

    await import('@/core/dialogue/dialogueService').then((m) => m.checkServerHealth());

    const calledUrl = fetchSpy.mock.calls[0]?.[0];
    // env 默认是 http://localhost:8000
    expect(String(calledUrl)).toContain('localhost:8000');
    expect(String(calledUrl)).not.toContain('runtime-host');

    fetchSpy.mockRestore();
  });

  it('applyRuntimeApiEndpoints with empty string is no-op', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));

    applyRuntimeApiEndpoints('');
    await import('@/core/dialogue/dialogueService').then((m) => m.checkServerHealth());

    const calledUrl = fetchSpy.mock.calls[0]?.[0];
    expect(String(calledUrl)).toContain('localhost:8000');

    fetchSpy.mockRestore();
  });
});
