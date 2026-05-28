export async function requestImmersiveArSession(
  navigatorLike: Navigator = navigator,
): Promise<XRSession> {
  const xr = (
    navigatorLike as Navigator & {
      xr?: {
        requestSession?: (mode: string, options?: XRSessionInit) => Promise<XRSession>;
      };
    }
  ).xr;

  if (!xr?.requestSession) {
    throw new Error('当前设备不支持 WebXR AR');
  }

  return xr.requestSession('immersive-ar', {
    requiredFeatures: ['local-floor'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: typeof document !== 'undefined' ? { root: document.body } : undefined,
  });
}
