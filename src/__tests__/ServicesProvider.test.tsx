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

  it('exposes provider-owned dialogue runtime through service hooks', async () => {
    const dialogue = {
      abortPendingTurn: vi.fn(),
      isTurnPending: vi.fn(() => false),
      reset: resetMock,
      runDialogueTurn: vi.fn(),
      runDialogueTurnStream: vi.fn(),
    };

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
      dialogue,
    });

    const { ServicesProvider, useDialogue } = await import('@/core/services');
    const captured = { current: null as unknown };

    function Consumer() {
      captured.current = useDialogue();
      return null;
    }

    render(
      <ServicesProvider>
        <Consumer />
      </ServicesProvider>,
    );

    expect(captured.current).toBe(dialogue);
  });
});
