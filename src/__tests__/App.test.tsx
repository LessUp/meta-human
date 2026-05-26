import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';

const createServicesMock = vi.fn();

vi.mock('@/core/createServices', () => ({
  createServices: () => createServicesMock(),
}));

vi.mock('@/pages/LandingPage', () => ({
  default: () => <div data-testid="landing-page" />,
}));

vi.mock('@/pages/AdvancedDigitalHumanPage', () => ({
  default: () => <div data-testid="advanced-page" />,
}));

function buildServices() {
  return {
    engine: { dispose: vi.fn() },
    tts: { dispose: vi.fn() },
    asr: { dispose: vi.fn() },
    dialogue: { reset: vi.fn() },
  };
}

describe('App routing', () => {
  beforeEach(() => {
    createServicesMock.mockReset();
    createServicesMock.mockReturnValue(buildServices());
    window.location.hash = '#/';
  });

  it('does not create app services for the landing route', async () => {
    render(<App />);

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
    await waitFor(() => expect(createServicesMock).not.toHaveBeenCalled());
  });

  it('creates app services for the app route', async () => {
    window.location.hash = '#/app';

    render(<App />);

    expect(await screen.findByTestId('advanced-page')).toBeInTheDocument();
    await waitFor(() => expect(createServicesMock).toHaveBeenCalledTimes(1));
  });
});
