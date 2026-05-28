import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface ImmersiveSessionBridgeProps {
  session: XRSession | null;
}

export function ImmersiveSessionBridge({ session }: ImmersiveSessionBridgeProps) {
  const { gl } = useThree();

  useEffect(() => {
    if (!session) {
      gl.xr.enabled = false;
      return;
    }

    gl.xr.enabled = true;
    void gl.xr.setSession(session);

    return () => {
      gl.xr.enabled = false;
    };
  }, [gl, session]);

  return null;
}
