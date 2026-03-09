// AvatarSwitch — 根据 avatarType 显示 CyberAvatar 或 VRM 模型
// v2：支持加载进度/错误状态 + 闲置动画 URL 传递
import { useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import CyberAvatar from './CyberAvatar';
import VRMAvatar from './VRMAvatar';

export default function AvatarSwitch() {
  const { avatarType, vrmModelUrl } = useDigitalHumanStore();
  const [vrmProgress, setVrmProgress] = useState(0);
  const [vrmError, setVrmError] = useState<string | null>(null);
  const [vrmLoading, setVrmLoading] = useState(false);

  const handleProgress = useCallback((progress: number) => {
    setVrmProgress(progress);
    if (!vrmLoading) setVrmLoading(true);
  }, [vrmLoading]);

  const handleLoad = useCallback(() => {
    setVrmLoading(false);
    setVrmError(null);
    setVrmProgress(100);
  }, []);

  const handleError = useCallback((err: string) => {
    setVrmLoading(false);
    setVrmError(err);
    console.error('VRM 加载失败:', err);
  }, []);

  if (avatarType === 'vrm' && vrmModelUrl) {
    return (
      <>
        {/* 加载进度指示 */}
        {vrmLoading && (
          <Html center>
            <div className="flex flex-col items-center gap-2 select-none">
              <div className="w-40 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
                  style={{ width: `${vrmProgress}%` }}
                />
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                VRM {vrmProgress}%
              </span>
            </div>
          </Html>
        )}

        {/* 错误提示 */}
        {vrmError && !vrmLoading && (
          <Html center>
            <div className="px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 shadow-lg backdrop-blur-sm">
              VRM 加载失败，已回退内置模型
            </div>
          </Html>
        )}

        <VRMAvatar
          url={vrmModelUrl}
          onLoad={handleLoad}
          onError={handleError}
          onProgress={handleProgress}
        />

        {/* 若 VRM 加载失败，显示内置 CyberAvatar 作为回退 */}
        {vrmError && <CyberAvatar />}
      </>
    );
  }

  return <CyberAvatar />;
}
