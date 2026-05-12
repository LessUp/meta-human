/**
 * @deprecated Use VoiceCommandExecutor from '@/core/voiceCommand' instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

import { asrService, ttsService, digitalHumanEngine } from '../core/services';
import type { ExpressionType } from '../store/digitalHumanStore';

export interface VoiceCommandHandlers {
  onGreeting?: () => void;
  onDance?: () => void;
  onSpeak?: (text: string) => void;
  onExpression?: (expression: ExpressionType) => void;
  onDefault?: (command: string) => void;
}

let expressionResetTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * @deprecated Use VoiceCommandExecutor.execute() instead.
 * Execute a voice command with customizable handlers.
 */
export function executeVoiceCommand(command: string, handlers: VoiceCommandHandlers = {}): void {
  // Clear any pending reset timer to avoid stale callbacks
  if (expressionResetTimer) {
    clearTimeout(expressionResetTimer);
    expressionResetTimer = null;
  }

  switch (command) {
    case '打招呼':
      handlers.onGreeting?.();
      break;
    case '跳舞':
      handlers.onDance?.();
      break;
    case '说话':
      handlers.onSpeak?.('您好！有什么可以帮助您的吗？');
      break;
    case '表情': {
      const expressions: ExpressionType[] = ['smile', 'surprise', 'laugh'];
      const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      handlers.onExpression?.(randomExpr);
      // Reset to neutral after 3 seconds
      expressionResetTimer = setTimeout(() => {
        handlers.onExpression?.('neutral');
        expressionResetTimer = null;
      }, 3000);
      break;
    }
    default:
      handlers.onDefault?.(command);
  }
}

/**
 * @deprecated Use VoiceCommandExecutor with explicit dependencies instead.
 * Default voice command handlers for the main digital human page.
 */
export function getDefaultVoiceCommandHandlers(): VoiceCommandHandlers {
  return {
    onGreeting: () => {
      asrService.performGreeting();
    },
    onDance: () => {
      asrService.performDance();
    },
    onSpeak: (text) => {
      void ttsService.speak(text).catch(() => undefined);
    },
    onExpression: (expression) => {
      digitalHumanEngine.setExpression(expression);
    },
    onDefault: (command) => {
      void ttsService.speak(`收到命令: ${command}`).catch(() => undefined);
    },
  };
}
