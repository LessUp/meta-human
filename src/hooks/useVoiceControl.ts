import { useCallback } from 'react';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { asrService } from '@/core/audio/audioService';
import { digitalHumanEngine } from '@/core/avatar/DigitalHumanEngine';
import { toast } from 'sonner';

/**
 * 语音控制 Hook
 * 封装录音、语音命令和快捷动作逻辑
 */
export function useVoiceControl(onChatSend?: (text: string) => void) {
  const {
    isRecording,
    setRecording,
    toggleMute,
    isMuted,
  } = useDigitalHumanStore();

  // 录音开关
  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      asrService.stop();
      setRecording(false);
      toast.info('录音已停止');
    } else {
      const started = asrService.start();
      if (started) {
        toast.success('正在聆听...');
      }
    }
  }, [isRecording, setRecording]);

  // 语音命令 / 快捷动作
  const handleVoiceCommand = useCallback((command: string) => {
    switch (command) {
      case '打招呼':
        asrService.performGreeting();
        toast.success('执行打招呼动作');
        break;
      case '跳舞':
        asrService.performDance();
        toast.success('开始跳舞');
        break;
      case '说话':
        onChatSend?.('你好，请自我介绍一下');
        break;
      case '表情': {
        const expressions = ['smile', 'surprise', 'laugh'];
        const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
        digitalHumanEngine.setExpression(randomExpr);
        toast.success(`切换到 ${randomExpr} 表情`);
        setTimeout(() => digitalHumanEngine.setExpression('neutral'), 3000);
        break;
      }
      default:
        onChatSend?.(command);
    }
  }, [onChatSend]);

  // 静音切换（带 toast 提示）
  const handleToggleMute = useCallback(() => {
    toggleMute();
    toast.info(isMuted ? '已取消静音' : '已静音');
  }, [toggleMute, isMuted]);

  return {
    isRecording,
    isMuted,
    handleToggleRecording,
    handleVoiceCommand,
    handleToggleMute,
  };
}
