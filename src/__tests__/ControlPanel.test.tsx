import { Profiler } from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ControlPanel from '@/components/ControlPanel';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useSystemStore } from '@/store/systemStore';

describe('ControlPanel', () => {
  beforeEach(() => {
    useDigitalHumanStore.getState().reset();
    useDigitalHumanStore.setState({
      isSpeaking: false,
      currentBehavior: 'idle',
      currentEmotion: 'neutral',
    });
    useSystemStore.setState({
      connectionStatus: 'connected',
      isConnected: true,
    });
  });

  it('does not rerender for unrelated digital human store updates', async () => {
    const onRender = vi.fn();

    render(
      <Profiler id="control-panel" onRender={onRender}>
        <ControlPanel
          isPlaying={false}
          isRecording={false}
          isMuted={false}
          autoRotate={false}
          onPlayPause={vi.fn()}
          onReset={vi.fn()}
          onToggleRecording={vi.fn()}
          onToggleMute={vi.fn()}
          onToggleAutoRotate={vi.fn()}
          onVoiceCommand={vi.fn()}
        />
      </Profiler>,
    );

    expect(onRender).toHaveBeenCalledTimes(1);

    await act(async () => {
      useDigitalHumanStore.getState().setEmotion('happy');
    });

    expect(onRender).toHaveBeenCalledTimes(1);
  });
});
