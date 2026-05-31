/**
 * 播放控制 Hook。
 *
 * 管理数字人的播放、暂停、重置操作。
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useEngine } from '@/services';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

export function usePlaybackController() {
  const engine = useEngine();
  const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      engine.pause();
      toast.info('已暂停');
    } else {
      engine.play();
      toast.success('已播放');
    }
  }, [isPlaying, engine]);

  const handleReset = useCallback(() => {
    engine.reset();
    toast.info('系统已重置');
  }, [engine]);

  return {
    isPlaying,
    handlePlayPause,
    handleReset,
  };
}
