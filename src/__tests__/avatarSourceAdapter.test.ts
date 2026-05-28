import { describe, expect, it, vi } from 'vitest';
import {
  getAvatarDisplayName,
  getAvatarStatusLabel,
  getAvatarViewerModelUrl,
  revokeCustomAvatarObjectUrl,
} from '@/core/avatar/avatarSourceAdapter';

describe('avatarSourceAdapter', () => {
  it('returns a viewer model url only for custom avatar sources', () => {
    expect(getAvatarViewerModelUrl({ kind: 'procedural' })).toBeUndefined();
    expect(
      getAvatarViewerModelUrl({
        kind: 'custom',
        fileName: 'hero.glb',
        modelUrl: 'blob:hero',
      }),
    ).toBe('blob:hero');
  });

  it('builds the user-facing avatar display name from the source', () => {
    expect(getAvatarDisplayName({ kind: 'procedural' })).toBe('内置程序化头像');
    expect(
      getAvatarDisplayName({
        kind: 'custom',
        fileName: 'hero.glb',
        modelUrl: 'blob:hero',
      }),
    ).toBe('hero.glb');
  });

  it('maps avatar load status to a reusable label', () => {
    expect(getAvatarStatusLabel('ready')).toBe('已就绪');
    expect(getAvatarStatusLabel('idle')).toBe('等待加载');
    expect(getAvatarStatusLabel('error')).toBe('加载失败，已回退');
  });

  it('revokes object urls only for custom avatar sources', () => {
    const revoke = vi.fn();

    revokeCustomAvatarObjectUrl({ kind: 'procedural' }, revoke);
    revokeCustomAvatarObjectUrl(
      {
        kind: 'custom',
        fileName: 'hero.glb',
        modelUrl: 'blob:hero',
      },
      revoke,
    );

    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:hero');
  });
});
