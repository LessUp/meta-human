import { describe, expect, it } from 'vitest';
import { findHealthyEndpoint, parseApiEndpoints } from '@/core/dialogue/endpointDiscovery';

describe('parseApiEndpoints', () => {
  it('normalizes and deduplicates the primary and fallback endpoints', () => {
    expect(
      parseApiEndpoints('http://localhost:8000/', 'http://backup:8000, http://localhost:8000/'),
    ).toEqual(['http://localhost:8000', 'http://backup:8000']);
  });
});

describe('findHealthyEndpoint', () => {
  it('returns the first healthy candidate and preserves the primary as fallback', async () => {
    const selected = await findHealthyEndpoint(
      ['http://primary:8000', 'http://backup:8000'],
      async (baseUrl) => baseUrl === 'http://backup:8000',
    );

    expect(selected).toBe('http://backup:8000');
  });
});
