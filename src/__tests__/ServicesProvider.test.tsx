import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServicesProvider, useDialogue } from '@/services';
import type { Services } from '@/core/services';
import type { ServiceComposition } from '@/core/serviceComposition';

function buildServices(overrides: Partial<Services> = {}): Services {
  return {
    engine: {
      dispose: vi.fn(),
    } as unknown as Services['engine'],
    tts: {
      dispose: vi.fn(),
    } as unknown as Services['tts'],
    asr: {
      dispose: vi.fn(),
    } as unknown as Services['asr'],
    dialogue: {
      abortPendingTurn: vi.fn(),
      isTurnPending: vi.fn(() => false),
      reset: vi.fn(),
      runDialogueTurn: vi.fn(),
      runDialogueTurnStream: vi.fn(),
    } as unknown as Services['dialogue'],
    ...overrides,
  };
}

describe('ServicesProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates provider-owned lifecycle cleanup to the composition seam', () => {
    const composition: ServiceComposition = {
      services: buildServices(),
      dispose: vi.fn(),
    };
    const createComposition = vi.fn(() => composition);

    const { unmount } = render(
      <ServicesProvider createComposition={createComposition}>
        <div>child</div>
      </ServicesProvider>,
    );

    expect(createComposition).toHaveBeenCalledTimes(1);

    unmount();

    expect(composition.dispose).toHaveBeenCalledTimes(1);
  });

  it('does not recreate a provider-owned composition on parent rerender', () => {
    const firstComposition: ServiceComposition = {
      services: buildServices(),
      dispose: vi.fn(),
    };
    const secondComposition: ServiceComposition = {
      services: buildServices(),
      dispose: vi.fn(),
    };
    const createComposition = vi
      .fn<() => ServiceComposition>()
      .mockReturnValueOnce(firstComposition)
      .mockReturnValueOnce(secondComposition);

    function Parent({ version }: { version: number }) {
      return (
        <ServicesProvider createComposition={() => createComposition()}>
          <div>{version}</div>
        </ServicesProvider>
      );
    }

    const { rerender, unmount } = render(<Parent version={1} />);

    expect(createComposition).toHaveBeenCalledTimes(1);

    rerender(<Parent version={2} />);

    expect(createComposition).toHaveBeenCalledTimes(1);
    expect(firstComposition.dispose).not.toHaveBeenCalled();
    expect(secondComposition.dispose).not.toHaveBeenCalled();

    unmount();

    expect(firstComposition.dispose).toHaveBeenCalledTimes(1);
    expect(secondComposition.dispose).not.toHaveBeenCalled();
  });

  it('exposes provider-owned dialogue runtime through service hooks', () => {
    const dialogue = {
      abortPendingTurn: vi.fn(),
      isTurnPending: vi.fn(() => false),
      reset: vi.fn(),
      runDialogueTurn: vi.fn(),
      runDialogueTurnStream: vi.fn(),
    } as unknown as Services['dialogue'];
    const createComposition = vi.fn(() => ({
      services: buildServices({ dialogue }),
      dispose: vi.fn(),
    }));
    const captured = { current: null as unknown };

    function Consumer() {
      captured.current = useDialogue();
      return null;
    }

    render(
      <ServicesProvider createComposition={createComposition}>
        <Consumer />
      </ServicesProvider>,
    );

    expect(captured.current).toBe(dialogue);
  });

  it('does not dispose externally provided composition on unmount', () => {
    const composition: ServiceComposition = {
      services: buildServices(),
      dispose: vi.fn(),
    };

    const { unmount } = render(
      <ServicesProvider composition={composition}>
        <div>child</div>
      </ServicesProvider>,
    );

    unmount();

    expect(composition.dispose).not.toHaveBeenCalled();
  });
});
