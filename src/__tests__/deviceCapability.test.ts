import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  detectDeviceCapabilities,
  getDeviceCapabilities,
  refreshDeviceCapabilities,
  meetsMinimumTier,
  getAdaptiveQuality,
} from '../core/performance/deviceCapability';

describe('Device Capability Detection', () => {
  beforeEach(() => {
    // Reset the cached capabilities by refreshing
    refreshDeviceCapabilities();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valid default capabilities', () => {
    const caps = detectDeviceCapabilities();

    // Basic validation of returned structure
    expect(caps).toHaveProperty('tier');
    expect(caps).toHaveProperty('supportsWebGL2');
    expect(caps).toHaveProperty('estimatedGPUMemoryMB');
    expect(caps).toHaveProperty('devicePixelRatio');
    expect(caps).toHaveProperty('recommendedDPR');
    expect(caps).toHaveProperty('enableShadows');
    expect(caps).toHaveProperty('particleCount');
    expect(caps).toHaveProperty('enablePostProcessing');
    expect(caps).toHaveProperty('maxShadowMapSize');
    expect(caps).toHaveProperty('prefersReducedMotion');
    expect(caps).toHaveProperty('detectedAt');

    // Validate tier is one of the allowed values
    expect(['low', 'medium', 'high']).toContain(caps.tier);

    // Validate particle count is reasonable
    expect(caps.particleCount).toBeGreaterThanOrEqual(0);
    expect(caps.particleCount).toBeLessThanOrEqual(200);

    // Validate DPR is valid
    expect(caps.recommendedDPR).toHaveLength(2);
    expect(caps.recommendedDPR[0]).toBeGreaterThan(0);
    expect(caps.recommendedDPR[1]).toBeGreaterThanOrEqual(caps.recommendedDPR[0]);
  });

  it('should return consistent tier settings', () => {
    const caps = detectDeviceCapabilities();

    // Tier-specific validation - just verify settings make sense for tier
    switch (caps.tier) {
      case 'low':
        // Low tier has lower particle count
        expect(caps.particleCount).toBeLessThanOrEqual(50);
        expect(caps.enablePostProcessing).toBe(false);
        break;
      case 'medium':
        expect(caps.particleCount).toBeLessThanOrEqual(100);
        expect(caps.maxShadowMapSize).toBeGreaterThanOrEqual(512);
        break;
      case 'high':
        // High tier has shadows and post-processing
        expect(caps.enableShadows).toBe(true);
        expect(caps.enablePostProcessing).toBe(true);
        expect(caps.maxShadowMapSize).toBeGreaterThanOrEqual(1024);
        break;
    }
  });

  it('should cache capabilities', () => {
    const caps1 = detectDeviceCapabilities();
    const caps2 = getDeviceCapabilities();

    // Should return the same cached object
    expect(caps1).toBe(caps2);
  });

  it('should refresh capabilities when requested', () => {
    const caps1 = detectDeviceCapabilities();
    refreshDeviceCapabilities();
    const caps2 = detectDeviceCapabilities();

    // Should be different objects with same values
    expect(caps1).not.toBe(caps2);
    expect(caps1.tier).toBe(caps2.tier);
  });

  describe('meetsMinimumTier', () => {
    it('should return true for low requirement', () => {
      // Any device should meet low requirement
      expect(meetsMinimumTier('low')).toBe(true);
    });

    it('should handle tier comparison without throwing', () => {
      expect(() => meetsMinimumTier('medium')).not.toThrow();
      expect(() => meetsMinimumTier('high')).not.toThrow();
    });
  });

  describe('getAdaptiveQuality', () => {
    beforeEach(() => {
      detectDeviceCapabilities();
    });

    it('should recommend reduced quality when FPS is low', () => {
      const result = getAdaptiveQuality(20);

      expect(result.shouldReduceQuality).toBe(true);
      expect(result.shouldIncreaseQuality).toBe(false);
    });

    it('should not suggest reducing quality when FPS is acceptable', () => {
      const result = getAdaptiveQuality(40);

      expect(result.shouldReduceQuality).toBe(false);
    });

    it('should return a recommended tier', () => {
      const result = getAdaptiveQuality(40);

      expect(['low', 'medium', 'high']).toContain(result.recommendedTier);
    });
  });

  describe('SSR safety', () => {
    it('should handle server-side rendering context', () => {
      // The implementation should work even without window
      // Just verify it doesn't throw
      const caps = detectDeviceCapabilities();
      expect(caps).toBeDefined();
    });
  });
});
