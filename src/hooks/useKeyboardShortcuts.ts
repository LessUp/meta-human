import { useEffect } from 'react';
import { digitalHumanEngine } from '@/core/avatar/DigitalHumanEngine';
import { toast } from 'sonner';

interface KeyboardShortcutsOptions {
  onPlayPause: () => void;
  onReset: () => void;
  onToggleRecording: () => void;
  onToggleMute: () => void;
  onToggleSettings: () => void;
  onVoiceCommand: (command: string) => void;
}

/**
 * 键盘快捷键 Hook
 * 将快捷键绑定逻辑从页面中完全解耦
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const {
    onPlayPause,
    onReset,
    onToggleRecording,
    onToggleMute,
    onToggleSettings,
    onVoiceCommand,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 输入框中不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'r':
          if (!e.ctrlKey && !e.metaKey) onReset();
          break;
        case 'm':
          onToggleMute();
          break;
        case 'v':
          onToggleRecording();
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) onToggleSettings();
          break;
        case 'escape':
          onToggleSettings();
          break;
        case '1':
          onVoiceCommand('打招呼');
          break;
        case '2':
          onVoiceCommand('跳舞');
          break;
        case '3':
          onVoiceCommand('说话');
          break;
        case '4':
          onVoiceCommand('表情');
          break;
        case '5':
          digitalHumanEngine.performBow();
          toast('鞠躬', { icon: '🙇' });
          break;
        case '6':
          digitalHumanEngine.performClap();
          toast('拍手', { icon: '👏' });
          break;
        case '7':
          digitalHumanEngine.performThumbsUp();
          toast('点赞', { icon: '👍' });
          break;
        case '8':
          digitalHumanEngine.performCheer();
          toast('欢呼', { icon: '🎉' });
          break;
        case '9':
          digitalHumanEngine.performShrug();
          toast('耸肩', { icon: '🤷' });
          break;
        case '0':
          digitalHumanEngine.playAnimation('lookAround');
          toast('张望', { icon: '👀' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onReset, onToggleRecording, onToggleMute, onToggleSettings, onVoiceCommand]);
}
