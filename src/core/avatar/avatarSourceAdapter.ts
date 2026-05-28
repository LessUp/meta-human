import type { AvatarLoadStatus, AvatarSource } from '@/store/digitalHumanStore';

export function getAvatarViewerModelUrl(avatarSource: AvatarSource): string | undefined {
  return avatarSource.kind === 'custom' ? avatarSource.modelUrl : undefined;
}

export function getAvatarDisplayName(avatarSource: AvatarSource): string {
  return avatarSource.kind === 'custom' ? avatarSource.fileName : '内置程序化头像';
}

export function getAvatarStatusLabel(status: AvatarLoadStatus): string {
  switch (status) {
    case 'ready':
      return '已就绪';
    case 'error':
      return '加载失败，已回退';
    default:
      return '等待加载';
  }
}

export function revokeCustomAvatarObjectUrl(
  avatarSource: AvatarSource,
  revokeObjectUrl: (url: string) => void,
): void {
  if (avatarSource.kind === 'custom') {
    revokeObjectUrl(avatarSource.modelUrl);
  }
}
