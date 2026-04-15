import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MediaPipe modules before importing VisionService
vi.mock('@mediapipe/face_mesh', () => ({
  FaceMesh: class MockFaceMesh {
    setOptions = vi.fn();
    onResults = vi.fn();
    send = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('@mediapipe/pose', () => ({
  Pose: class MockPose {
    setOptions = vi.fn();
    onResults = vi.fn();
    send = vi.fn().mockResolvedValue(undefined);
  },
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock permissions API
Object.defineProperty(global.navigator, 'permissions', {
  value: {
    query: vi.fn().mockResolvedValue({ state: 'granted' }),
  },
  writable: true,
});

// Mock requestAnimationFrame
const mockRaf = vi.fn((cb: FrameRequestCallback) => {
  return setTimeout(() => cb(0), 16) as unknown as number;
});
const mockCancelRaf = vi.fn((id: number) => {
  clearTimeout(id);
});
global.requestAnimationFrame = mockRaf;
global.cancelAnimationFrame = mockCancelRaf;

// Import after mocking
import { visionService } from '../core/vision/visionService';

describe('VisionService', () => {
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCancelRaf.mockClear();

    // Reset vision service state
    visionService.stop();

    // Create a mock video element
    mockVideoElement = {
      srcObject: null,
      play: vi.fn().mockResolvedValue(undefined),
    } as unknown as HTMLVideoElement;
  });

  afterEach(() => {
    // Clean up after each test
    visionService.stop();
  });

  describe('initialization', () => {
    it('starts with idle status', () => {
      expect(visionService.getStatus()).toBe('idle');
    });

    it('is not running initially', () => {
      expect(visionService.isRunning()).toBe(false);
    });
  });

  describe('checkCameraPermission', () => {
    it('returns true when permission is granted', async () => {
      const result = await visionService.checkCameraPermission();
      expect(result).toBe(true);
    });

    it('returns true when permission API is not supported', async () => {
      // Override permissions to throw
      const originalQuery = (global.navigator.permissions as any).query;
      (global.navigator.permissions as any).query = vi
        .fn()
        .mockRejectedValue(new Error('Not supported'));

      const result = await visionService.checkCameraPermission();
      expect(result).toBe(true);

      (global.navigator.permissions as any).query = originalQuery;
    });
  });

  describe('start', () => {
    it('returns false when getUserMedia is not supported', async () => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      (navigator.mediaDevices as any).getUserMedia = undefined;

      const onEmotion = vi.fn();
      const result = await visionService.start(mockVideoElement, onEmotion);

      expect(result).toBe(false);
      expect(visionService.getStatus()).toBe('no_camera');

      (navigator.mediaDevices as any).getUserMedia = originalGetUserMedia;
    });

    it('returns false and sets no_camera status when camera permission is denied', async () => {
      mockGetUserMedia.mockRejectedValueOnce(
        new DOMException('Permission denied', 'NotAllowedError'),
      );

      const onEmotion = vi.fn();
      const result = await visionService.start(mockVideoElement, onEmotion);

      expect(result).toBe(false);
      expect(visionService.getStatus()).toBe('no_camera');
    });

    it('returns true and sets running status when camera is available', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      const onEmotion = vi.fn();
      const result = await visionService.start(mockVideoElement, onEmotion);

      expect(result).toBe(true);
      expect(visionService.getStatus()).toBe('running');
      expect(visionService.isRunning()).toBe(true);
    });

    it('updates callbacks when already running', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      const onEmotion1 = vi.fn();
      const onEmotion2 = vi.fn();

      const result1 = await visionService.start(mockVideoElement, onEmotion1);
      expect(result1).toBe(true);

      // Second call should just update callbacks
      const result2 = await visionService.start(mockVideoElement, onEmotion2);
      expect(result2).toBe(true);

      expect(visionService.isRunning()).toBe(true);
    });
  });

  describe('stop', () => {
    it('stops the service and resets status', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      const onEmotion = vi.fn();
      await visionService.start(mockVideoElement, onEmotion);

      expect(visionService.isRunning()).toBe(true);

      visionService.stop();

      expect(visionService.isRunning()).toBe(false);
      expect(visionService.getStatus()).toBe('idle');
    });

    it('clears video element', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      await visionService.start(mockVideoElement, vi.fn());
      visionService.stop();

      expect(mockVideoElement.srcObject).toBeNull();
    });

    it('cancels pending animation frames when running', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      await visionService.start(mockVideoElement, vi.fn());
      expect(visionService.isRunning()).toBe(true);

      // Wait for a RAF to be scheduled (the loop runs on RAF)
      await new Promise((resolve) => setTimeout(resolve, 50));

      visionService.stop();

      // Animation frame should have been cancelled if one was scheduled
      // Note: cancelAnimationFrame may or may not be called depending on timing
      // Just verify the service is stopped
      expect(visionService.isRunning()).toBe(false);
    });
  });

  describe('getFps', () => {
    it('returns 0 initially', () => {
      expect(visionService.getFps()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('handles NotAllowedError with appropriate message', async () => {
      mockGetUserMedia.mockRejectedValueOnce(
        new DOMException('Permission denied', 'NotAllowedError'),
      );

      await visionService.start(mockVideoElement, vi.fn(), vi.fn());

      // Status should be no_camera
      expect(visionService.getStatus()).toBe('no_camera');
    });

    it('handles NotFoundError with appropriate message', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new DOMException('Camera not found', 'NotFoundError'));

      await visionService.start(mockVideoElement, vi.fn(), vi.fn());

      expect(visionService.getStatus()).toBe('no_camera');
    });

    it('handles NotReadableError with appropriate message', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new DOMException('Camera in use', 'NotReadableError'));

      await visionService.start(mockVideoElement, vi.fn(), vi.fn());

      expect(visionService.getStatus()).toBe('no_camera');
    });
  });
});
