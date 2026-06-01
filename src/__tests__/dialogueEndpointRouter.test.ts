import { describe, expect, it } from 'vitest';
import { DialogueEndpointRouter } from '../core/dialogue/dialogueEndpointRouter';

describe('DialogueEndpointRouter', () => {
  it('uses the first endpoint as primary by default', () => {
    const router = new DialogueEndpointRouter(['http://primary:8000', 'http://backup:8000']);
    expect(router.selectPrimaryEndpoint()).toBe('http://primary:8000');
  });

  it('moves to fallback when active endpoint fails', () => {
    const router = new DialogueEndpointRouter(['http://primary:8000', 'http://backup:8000']);
    const routing = router.reportFailure('http://primary:8000');

    expect(routing).toEqual({
      activeEndpoint: 'http://backup:8000',
      didFailover: true,
    });
    expect(router.selectPrimaryEndpoint()).toBe('http://backup:8000');
  });

  it('prioritizes explicit endpoint when available', () => {
    const router = new DialogueEndpointRouter([
      'http://primary:8000',
      'http://backup:8000',
      'http://third:8000',
    ]);

    expect(router.getCandidateEndpoints('http://third:8000')).toEqual([
      'http://third:8000',
      'http://primary:8000',
      'http://backup:8000',
    ]);
  });

  it('switches active endpoint when a non-primary endpoint succeeds', () => {
    const router = new DialogueEndpointRouter(['http://primary:8000', 'http://backup:8000']);
    const routing = router.reportSuccess('http://backup:8000');

    expect(routing).toEqual({
      activeEndpoint: 'http://backup:8000',
      didFailover: true,
    });
  });
});
