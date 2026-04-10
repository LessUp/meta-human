import { describe, it, expect } from 'vitest';
import { mapFaceToEmotion, analyzeFaceFeatures } from '../core/vision/visionMapper';

// Helper to build a fake landmark array with specific values at key indices.
// MediaPipe Face Mesh uses ~468 landmarks. We build a minimal array.
function buildLandmarks(overrides: Record<number, { x: number; y: number; z: number }>): Array<{ x: number; y: number; z: number }> {
  const defaultLandmark = { x: 0.5, y: 0.5, z: 0 };
  const landmarks: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < 468; i++) {
    landmarks.push(overrides[i] ? { ...overrides[i] } : { ...defaultLandmark });
  }
  return landmarks;
}

function buildResults(overrides: Record<number, { x: number; y: number; z: number }>) {
  return { multiFaceLandmarks: [buildLandmarks(overrides)] };
}

describe('mapFaceToEmotion', () => {
  it('returns neutral for null/undefined input', () => {
    expect(mapFaceToEmotion(null)).toBe('neutral');
    expect(mapFaceToEmotion(undefined)).toBe('neutral');
    expect(mapFaceToEmotion({})).toBe('neutral');
  });

  it('returns neutral for empty landmarks', () => {
    expect(mapFaceToEmotion({ multiFaceLandmarks: [[]] })).toBe('neutral');
  });

  it('returns neutral for insufficient landmarks (< 400)', () => {
    const short = Array.from({ length: 100 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    expect(mapFaceToEmotion({ multiFaceLandmarks: [short] })).toBe('neutral');
  });

  it('returns neutral for default (flat) face landmarks', () => {
    const result = mapFaceToEmotion(buildResults({}));
    expect(result).toBe('neutral');
  });

  it('detects happy from mouth corner pull up', () => {
    // Mouth corners pulled up: cornerY < mouthCenterY → cornerPull > 0
    // landmarks: 61 (leftMouth), 291 (rightMouth), 13 (upperLip), 14 (lowerLip)
    const result = mapFaceToEmotion(buildResults({
      61:  { x: 0.3, y: 0.58, z: 0 },  // leftMouth - pulled up
      291: { x: 0.7, y: 0.58, z: 0 },  // rightMouth - pulled up
      13:  { x: 0.5, y: 0.60, z: 0 },  // upperLip
      14:  { x: 0.5, y: 0.62, z: 0 },  // lowerLip
    }));
    expect(result).toBe('happy');
  });

  it('detects surprised from wide eyes and open mouth', () => {
    // Wide eyes: upper/lower far apart relative to inner/outer → eyeOpenness > 0.35
    // Open mouth: upperLip/lowerLip far apart relative to mouth width → openness > 0.06
    const result = mapFaceToEmotion(buildResults({
      159: { x: 0.37, y: 0.30, z: 0 },  // leftEyeUpper
      145: { x: 0.37, y: 0.50, z: 0 },  // leftEyeLower
      133: { x: 0.35, y: 0.40, z: 0 },  // leftEyeInner
      33:  { x: 0.39, y: 0.40, z: 0 },  // leftEyeOuter
      386: { x: 0.63, y: 0.30, z: 0 },  // rightEyeUpper
      374: { x: 0.63, y: 0.50, z: 0 },  // rightEyeLower
      362: { x: 0.61, y: 0.40, z: 0 },  // rightEyeInner
      263: { x: 0.65, y: 0.40, z: 0 },  // rightEyeOuter
      61:  { x: 0.35, y: 0.65, z: 0 },  // leftMouth
      291: { x: 0.65, y: 0.65, z: 0 },  // rightMouth
      13:  { x: 0.5, y: 0.60, z: 0 },   // upperLip
      14:  { x: 0.5, y: 0.80, z: 0 },   // lowerLip (wide open)
    }));
    expect(result).toBe('surprised');
  });

  it('detects angry from brow lowered and mouth corners down', () => {
    // browPosition < -0.02: eyebrowInner.y > eyeUpper.y (brow pushed down)
    // cornerPull < -0.01: mouth corners below center
    // Eyes must be narrow (eyeOpenness <= 0.35) to avoid surprised detection
    const result = mapFaceToEmotion(buildResults({
      159: { x: 0.37, y: 0.39, z: 0 },  // leftEyeUpper
      145: { x: 0.37, y: 0.41, z: 0 },  // leftEyeLower
      133: { x: 0.34, y: 0.40, z: 0 },  // leftEyeInner
      33:  { x: 0.42, y: 0.40, z: 0 },  // leftEyeOuter (wide)
      386: { x: 0.63, y: 0.39, z: 0 },  // rightEyeUpper
      374: { x: 0.63, y: 0.41, z: 0 },  // rightEyeLower
      362: { x: 0.58, y: 0.40, z: 0 },  // rightEyeInner
      263: { x: 0.66, y: 0.40, z: 0 },  // rightEyeOuter (wide)
      107: { x: 0.37, y: 0.43, z: 0 },  // leftEyebrowInner (below eyeUpper = brow down)
      336: { x: 0.63, y: 0.43, z: 0 },  // rightEyebrowInner (below eyeUpper = brow down)
      61:  { x: 0.35, y: 0.75, z: 0 },  // leftMouth (pulled down)
      291: { x: 0.65, y: 0.75, z: 0 },  // rightMouth (pulled down)
      13:  { x: 0.5, y: 0.65, z: 0 },   // upperLip
      14:  { x: 0.5, y: 0.67, z: 0 },   // lowerLip
    }));
    expect(result).toBe('angry');
  });

  it('detects sad from mouth corners down and brows up', () => {
    // cornerPull < -0.015 AND browPosition > 0.01
    // Eyes must be narrow to avoid surprised detection
    const result = mapFaceToEmotion(buildResults({
      159: { x: 0.37, y: 0.39, z: 0 },  // leftEyeUpper
      145: { x: 0.37, y: 0.41, z: 0 },  // leftEyeLower
      133: { x: 0.34, y: 0.40, z: 0 },  // leftEyeInner
      33:  { x: 0.42, y: 0.40, z: 0 },  // leftEyeOuter (wide)
      386: { x: 0.63, y: 0.39, z: 0 },  // rightEyeUpper
      374: { x: 0.63, y: 0.41, z: 0 },  // rightEyeLower
      362: { x: 0.58, y: 0.40, z: 0 },  // rightEyeInner
      263: { x: 0.66, y: 0.40, z: 0 },  // rightEyeOuter (wide)
      107: { x: 0.37, y: 0.20, z: 0 },  // leftEyebrowInner (raised)
      336: { x: 0.63, y: 0.20, z: 0 },  // rightEyebrowInner (raised)
      61:  { x: 0.35, y: 0.80, z: 0 },  // leftMouth (pulled down a lot)
      291: { x: 0.65, y: 0.80, z: 0 },  // rightMouth (pulled down a lot)
      13:  { x: 0.5, y: 0.70, z: 0 },   // upperLip
      14:  { x: 0.5, y: 0.72, z: 0 },   // lowerLip
    }));
    expect(result).toBe('sad');
  });
});

describe('analyzeFaceFeatures', () => {
  it('returns null for null input', () => {
    expect(analyzeFaceFeatures(null)).toBeNull();
  });

  it('returns null for insufficient landmarks', () => {
    const short = { multiFaceLandmarks: [Array.from({ length: 100 }, () => ({ x: 0.5, y: 0.5, z: 0 }))] };
    expect(analyzeFaceFeatures(short)).toBeNull();
  });

  it('returns feature values for valid input', () => {
    const features = analyzeFaceFeatures(buildResults({
      159: { x: 0.37, y: 0.30, z: 0 },
      145: { x: 0.37, y: 0.40, z: 0 },
      133: { x: 0.35, y: 0.35, z: 0 },
      33:  { x: 0.39, y: 0.35, z: 0 },
      386: { x: 0.63, y: 0.30, z: 0 },
      374: { x: 0.63, y: 0.40, z: 0 },
      362: { x: 0.61, y: 0.35, z: 0 },
      263: { x: 0.65, y: 0.35, z: 0 },
      107: { x: 0.37, y: 0.25, z: 0 },
      336: { x: 0.63, y: 0.25, z: 0 },
      61:  { x: 0.35, y: 0.60, z: 0 },
      291: { x: 0.65, y: 0.60, z: 0 },
      13:  { x: 0.5, y: 0.55, z: 0 },
      14:  { x: 0.5, y: 0.65, z: 0 },
    }));

    expect(features).not.toBeNull();
    expect(typeof features!.eyeOpenness).toBe('number');
    expect(typeof features!.browPosition).toBe('number');
    expect(typeof features!.mouthOpenness).toBe('number');
    expect(typeof features!.mouthCornerPull).toBe('number');
  });
});
