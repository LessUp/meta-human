/**
 * 语音命令处理 Hook。
 *
 * 使用 VoiceCommandExecutor 处理语音命令。
 */

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useEngine, useASR, useTTS } from '@/services';
import { VoiceCommandExecutor } from '@/core/voiceCommand';

interface UseVoiceCommandHandlerOptions {
  onChatSend?: (text: string) => void;
}

export function useVoiceCommandHandler(options: UseVoiceCommandHandlerOptions = {}) {
  const engine = useEngine();
  const asr = useASR();
  const tts = useTTS();
  const { onChatSend } = options;

  // Create executor once, not on every call
  const executor = useMemo(
    () =>
      new VoiceCommandExecutor({
        systemControls: {
          play: () => engine.play(),
          pause: () => engine.pause(),
          reset: () => engine.reset(),
          setMuted: () => {
            /* Not applicable in this context */
          },
        },
        avatarControls: {
          setEmotion: (e) => engine.setEmotion(e),
          setExpression: (e) => engine.setExpression(e),
          setAnimation: (a) => engine.playAnimation(a),
          setBehavior: (b) => engine.setBehavior(b),
          speak: (text) => {
            void tts.speak(text).catch(() => undefined);
          },
        },
        onUnhandled: (text) => {
          onChatSend?.(text);
        },
      }),
    [engine, tts, onChatSend],
  );

  const handleVoiceCommand = useCallback(
    (command: string) => {
      const handled = executor.execute(command);

      if (!handled) {
        // Command was not recognized, already handled by onUnhandled
        return;
      }

      // Show toast notifications for specific commands
      const result = executor.parse(command);
      if (result.action) {
        switch (result.action.type) {
          case 'greeting':
            asr.performGreeting();
            toast.success('执行打招呼动作');
            break;
          case 'dance':
            asr.performDance();
            toast.success('开始跳舞');
            break;
          case 'expression':
            toast.success(`切换到 ${result.action.expression} 表情`);
            break;
          case 'speak':
            toast.success('开始说话');
            break;
          default:
            break;
        }
      }
    },
    [executor, asr],
  );

  return {
    handleVoiceCommand,
  };
}
