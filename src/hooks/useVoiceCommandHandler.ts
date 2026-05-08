/**
 * 语音命令处理 Hook。
 *
 * 处理语音命令的解析和执行。
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useEngine, useASR } from '@/core/services';
import { executeVoiceCommand } from '@/lib/voiceCommands';

interface UseVoiceCommandHandlerOptions {
  onChatSend?: (text: string) => void;
}

export function useVoiceCommandHandler(options: UseVoiceCommandHandlerOptions = {}) {
  const engine = useEngine();
  const asr = useASR();
  const { onChatSend } = options;

  const handleVoiceCommand = useCallback(
    (command: string) => {
      executeVoiceCommand(command, {
        onGreeting: () => {
          asr.performGreeting();
          toast.success('执行打招呼动作');
        },
        onDance: () => {
          asr.performDance();
          toast.success('开始跳舞');
        },
        onSpeak: () => {
          onChatSend?.('你好，请自我介绍一下');
        },
        onExpression: (expression) => {
          engine.setExpression(expression);
          toast.success(`切换到 ${expression} 表情`);
        },
        onDefault: (cmd) => {
          onChatSend?.(cmd);
        },
      });
    },
    [engine, asr, onChatSend],
  );

  return {
    handleVoiceCommand,
  };
}
