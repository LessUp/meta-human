// AvatarSwitch — 根据 avatarType 显示 CyberAvatar 或 VRM 模型
// 从 DigitalHumanViewer.enhanced.tsx 提取
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import CyberAvatar from './CyberAvatar';
import VRMAvatar from './VRMAvatar';

export default function AvatarSwitch() {
  const { avatarType, vrmModelUrl } = useDigitalHumanStore();

  if (avatarType === 'vrm' && vrmModelUrl) {
    return (
      <VRMAvatar
        url={vrmModelUrl}
        onLoad={(vrm) => console.log('VRM 模型已加载:', vrm.meta)}
        onError={(err) => console.error('VRM 加载失败:', err)}
      />
    );
  }

  return <CyberAvatar />;
}
