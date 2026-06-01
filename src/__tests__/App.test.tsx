import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';

const { servicesProviderRenderSpy } = vi.hoisted(() => ({
  servicesProviderRenderSpy: vi.fn(),
}));

vi.mock('@/services', () => ({
  ServicesProvider: ({ children }: { children: ReactNode }) => {
    servicesProviderRenderSpy();
    return <div data-testid="services-provider">{children}</div>;
  },
}));

vi.mock('@/pages/LandingPage', () => ({
  default: () => <div data-testid="landing-page" />,
}));

vi.mock('@/pages/AdvancedDigitalHumanPage', () => ({
  default: () => <div data-testid="advanced-page" />,
}));

describe('App routing', () => {
  beforeEach(() => {
    servicesProviderRenderSpy.mockReset();
    window.location.hash = '#/';
  });

  it('does not render the app services provider for the landing route', async () => {
    render(<App />);

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
    await waitFor(() => expect(servicesProviderRenderSpy).not.toHaveBeenCalled());
  });

  it('renders the app services provider for the app route', async () => {
    window.location.hash = '#/app';

    render(<App />);

    expect(await screen.findByTestId('advanced-page')).toBeInTheDocument();
    expect(await screen.findByTestId('services-provider')).toBeInTheDocument();
    await waitFor(() => expect(servicesProviderRenderSpy).toHaveBeenCalledTimes(1));
  });
});
