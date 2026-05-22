import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const createServicesMock = vi.fn();
const disposeMock = vi.fn();
const resetMock = vi.fn();

vi.mock('@/core/createServices', () => ({
  createServices: () => createServicesMock(),
}));

describe('ServicesProvider', () => {
  afterEach(() => {
    createServicesMock.mockReset();
    disposeMock.mockReset();
    resetMock.mockReset();
  });

  it('disposes provider-owned services on unmount', async () => {
    createServicesMock.mockReturnValue({
      engine: {
        dispose: disposeMock,
      },
      tts: {
        dispose: disposeMock,
      },
      asr: {
        dispose: disposeMock,
      },
      dialogue: {
        reset: resetMock,
      },
    });

    const { ServicesProvider } = await import('@/core/ServicesProvider');
    const { unmount } = render(
      <ServicesProvider>
        <div>child</div>
      </ServicesProvider>,
    );

    unmount();

    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(disposeMock).toHaveBeenCalledTimes(3);
  });
});
