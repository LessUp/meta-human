function normalizeApiEndpoint(url: string): string | null {
  const normalized = url.trim().replace(/\/+$/, '');
  if (!normalized) {
    return null;
  }

  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

export function parseApiEndpoints(primaryUrl: string, fallbackUrls = ''): string[] {
  const candidates = [primaryUrl, ...fallbackUrls.split(',')];
  const parsed = candidates
    .map((candidate) => normalizeApiEndpoint(candidate))
    .filter((candidate): candidate is string => candidate !== null);

  return Array.from(new Set(parsed));
}

export async function findHealthyEndpoint(
  candidates: string[],
  isHealthy: (baseUrl: string) => Promise<boolean>,
): Promise<string> {
  for (const candidate of candidates) {
    if (await isHealthy(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? 'http://localhost:8000';
}
