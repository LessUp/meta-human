/**
 * Device Capability Detection System
 *
 * Detects device GPU/CPU performance and provides adaptive quality settings
 * for 3D rendering optimization.
 */

import { loggers } from '../../lib/logger';

const logger = loggers.core;

export type DeviceTier = 'low' | 'medium' | 'high';

export interface DeviceCapabilities {
  /** Performance tier based on hardware detection */
  tier: DeviceTier;
  /** Whether the device supports WebGL 2.0 */
  supportsWebGL2: boolean;
  /** Estimated GPU memory in MB (approximate) */
  estimatedGPUMemoryMB: number;
  /** Device pixel ratio (physical pixels / CSS pixels) */
  devicePixelRatio: number;
  /** Recommended DPR range for renderer */
  recommendedDPR: [number, number];
  /** Whether to enable shadows */
  enableShadows: boolean;
  /** Recommended particle count for effects */
  particleCount: number;
  /** Whether to enable post-processing effects */
  enablePostProcessing: boolean;
  /** Maximum shadow map size */
  maxShadowMapSize: number;
  /** Whether to use reduced motion */
  prefersReducedMotion: boolean;
  /** Timestamp of capability detection */
  detectedAt: number;
}

// Default capabilities for SSR/contexts without GPU
const DEFAULT_CAPABILITIES: DeviceCapabilities = {
  tier: 'medium',
  supportsWebGL2: true,
  estimatedGPUMemoryMB: 512,
  devicePixelRatio: 1,
  recommendedDPR: [1, 1.5],
  enableShadows: true,
  particleCount: 50,
  enablePostProcessing: false,
  maxShadowMapSize: 1024,
  prefersReducedMotion: false,
  detectedAt: Date.now(),
};

let cachedCapabilities: DeviceCapabilities | null = null;

/**
 * Detect WebGL support and versions
 */
function detectWebGLSupport(): { supported: boolean; version: 1 | 2 | null } {
  if (typeof window === 'undefined') {
    return { supported: false, version: null };
  }

  const canvas = document.createElement('canvas');

  // Try WebGL 2 first
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    return { supported: true, version: 2 };
  }

  // Fall back to WebGL 1
  const gl1 =
    canvas.getContext('webgl') ||
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  if (gl1) {
    return { supported: true, version: 1 };
  }

  return { supported: false, version: null };
}

/**
 * Estimate GPU memory based on renderer string and heuristics
 */
function estimateGPUMemory(gl: WebGLRenderingContext): number {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) {
    // No debug info available, use conservative estimate
    return 512;
  }

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;

  // Mobile GPU detection
  const isMobile =
    /(Mali|Adreno|PowerVR|Apple GPU)/i.test(renderer) ||
    /(Qualcomm|ARM|Imagination)/i.test(vendor);

  // Integrated vs Discrete GPU heuristics
  const isIntegrated =
    /(Intel|Microsoft Basic Render)/i.test(renderer) && !/(Iris|Arc)/i.test(renderer);

  if (isMobile) {
    // Mobile GPUs typically have less memory
    if (/Mali-G[0-5][0-9]|Adreno [0-5][0-9][0-9]/i.test(renderer)) {
      return 1024; // Lower-end mobile
    }
    return 2048; // Higher-end mobile
  }

  if (isIntegrated) {
    return 2048; // Integrated graphics
  }

  // Discrete GPUs
  if (/(NVIDIA|AMD|RTX|GTX|Radeon)/i.test(renderer)) {
    return 4096; // Conservative estimate for discrete
  }

  return 2048; // Default
}

/**
 * Detect device performance tier
 */
function detectDeviceTier(
  webglVersion: number | null,
  gpuMemoryMB: number,
  dpr: number,
): DeviceTier {
  // Low-end indicators
  if (
    webglVersion === 1 ||
    gpuMemoryMB < 1024 ||
    (dpr < 2 && gpuMemoryMB < 2048) ||
    (typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4)
  ) {
    return 'low';
  }

  // High-end indicators
  if (webglVersion === 2 && gpuMemoryMB >= 4096 && dpr >= 2) {
    return 'high';
  }

  return 'medium';
}

/**
 * Get tier-based quality settings
 */
function getTierSettings(tier: DeviceTier): Partial<DeviceCapabilities> {
  switch (tier) {
    case 'low':
      return {
        recommendedDPR: [1, 1.2],
        enableShadows: false,
        particleCount: 20,
        enablePostProcessing: false,
        maxShadowMapSize: 512,
      };
    case 'medium':
      return {
        recommendedDPR: [1, 1.5],
        enableShadows: true,
        particleCount: 50,
        enablePostProcessing: false,
        maxShadowMapSize: 1024,
      };
    case 'high':
      return {
        recommendedDPR: [1, 2],
        enableShadows: true,
        particleCount: 100,
        enablePostProcessing: true,
        maxShadowMapSize: 2048,
      };
  }
}

/**
 * Check if user prefers reduced motion
 */
function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Return cached if available
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return DEFAULT_CAPABILITIES;
  }

  try {
    const { supported, version } = detectWebGLSupport();

    if (!supported) {
      logger.warn('WebGL not supported, using fallback capabilities');
      cachedCapabilities = {
        ...DEFAULT_CAPABILITIES,
        supportsWebGL2: false,
        tier: 'low',
        detectedAt: Date.now(),
      };
      return cachedCapabilities;
    }

    // Create temporary canvas for detailed detection
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);

    if (!gl) {
      logger.warn('Could not get WebGL context');
      cachedCapabilities = DEFAULT_CAPABILITIES;
      return cachedCapabilities;
    }

    const gpuMemory = estimateGPUMemory(gl);
    const dpr = window.devicePixelRatio || 1;
    const tier = detectDeviceTier(version, gpuMemory, dpr);
    const tierSettings = getTierSettings(tier);

    cachedCapabilities = {
      tier,
      supportsWebGL2: version === 2,
      estimatedGPUMemoryMB: gpuMemory,
      devicePixelRatio: dpr,
      recommendedDPR: tierSettings.recommendedDPR!,
      enableShadows: tierSettings.enableShadows!,
      particleCount: tierSettings.particleCount!,
      enablePostProcessing: tierSettings.enablePostProcessing!,
      maxShadowMapSize: tierSettings.maxShadowMapSize!,
      prefersReducedMotion: getPrefersReducedMotion(),
      detectedAt: Date.now(),
    };

    logger.info('Device capabilities detected:', {
      tier,
      gpuMemoryMB: gpuMemory,
      dpr,
      supportsWebGL2: version === 2,
    });

    return cachedCapabilities;
  } catch (error) {
    logger.error('Error detecting device capabilities:', error);
    cachedCapabilities = DEFAULT_CAPABILITIES;
    return cachedCapabilities;
  }
}

/**
 * Get cached capabilities or detect new ones
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (!cachedCapabilities) {
    return detectDeviceCapabilities();
  }
  return cachedCapabilities;
}

/**
 * Force re-detection of device capabilities
 */
export function refreshDeviceCapabilities(): DeviceCapabilities {
  cachedCapabilities = null;
  return detectDeviceCapabilities();
}

/**
 * Check if device matches minimum tier requirement
 */
export function meetsMinimumTier(requiredTier: DeviceTier): boolean {
  const tiers: Record<DeviceTier, number> = { low: 0, medium: 1, high: 2 };
  const current = getDeviceCapabilities();
  return tiers[current.tier] >= tiers[requiredTier];
}

/**
 * Get adaptive quality based on current performance
 * This can be called periodically to adjust quality based on FPS
 */
export function getAdaptiveQuality(currentFPS: number): {
  shouldReduceQuality: boolean;
  shouldIncreaseQuality: boolean;
  recommendedTier: DeviceTier;
} {
  const caps = getDeviceCapabilities();

  // FPS thresholds for quality adjustment
  const REDUCE_THRESHOLD = 30; // Reduce quality if below 30 FPS
  const INCREASE_THRESHOLD = 55; // Can increase quality if consistently above 55 FPS

  let recommendedTier = caps.tier;

  if (currentFPS < REDUCE_THRESHOLD) {
    // Recommend lower tier
    if (caps.tier === 'high') recommendedTier = 'medium';
    else if (caps.tier === 'medium') recommendedTier = 'low';

    return {
      shouldReduceQuality: true,
      shouldIncreaseQuality: false,
      recommendedTier,
    };
  }

  if (currentFPS > INCREASE_THRESHOLD && caps.tier !== 'high') {
    // Could try higher tier if performance allows
    if (caps.tier === 'low') recommendedTier = 'medium';
    else if (caps.tier === 'medium') recommendedTier = 'high';

    return {
      shouldReduceQuality: false,
      shouldIncreaseQuality: true,
      recommendedTier,
    };
  }

  return {
    shouldReduceQuality: false,
    shouldIncreaseQuality: false,
    recommendedTier: caps.tier,
  };
}

// Listen for reduced motion preference changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', (e) => {
    if (cachedCapabilities) {
      cachedCapabilities.prefersReducedMotion = e.matches;
    }
  });
}
