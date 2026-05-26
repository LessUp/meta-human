import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderMock = vi.fn();

vi.mock('react-dom/client', () => ({
  createRoot: () => ({
    render: renderMock,
  }),
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
}));

describe('main entry redirect restore', () => {
  beforeEach(() => {
    vi.resetModules();
    renderMock.mockReset();
    sessionStorage.clear();
    window.location.hash = '';
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('clears malformed redirect payloads and warns instead of retrying forever', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem('spa_redirect', '{bad json');

    await import('../main.tsx');

    expect(sessionStorage.getItem('spa_redirect')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
