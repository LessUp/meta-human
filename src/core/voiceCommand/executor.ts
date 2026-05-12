/**
 * Voice command executor.
 *
 * The deep module for voice commands - single entry point for all voice command execution.
 * Consolidates routing logic from voiceCommandProcessor.ts and voiceCommands.ts.
 */

import { loggers } from '../../lib/logger';
import { parseVoiceCommand } from './parser';
import { PresetActionRunner } from './presetActions';
import type {
  VoiceCommandResult,
  VoiceCommandExecutorDeps,
  SystemControls,
  AvatarControls,
} from './types';

const logger = loggers.audio;

/**
 * Execute voice commands.
 *
 * This is the main entry point for voice command handling.
 * It parses the input, routes to the appropriate handler, and executes.
 *
 * @example
 * ```typescript
 * const executor = new VoiceCommandExecutor({
 *   systemControls: { play, pause, reset, setMuted },
 *   avatarControls: { setEmotion, setExpression, setAnimation, setBehavior, speak },
 *   onUnhandled: (text) => sendToDialogue(text),
 * });
 *
 * const handled = executor.execute('打招呼'); // true
 * const handled = executor.execute('你好'); // false (not a command)
 * ```
 */
export class VoiceCommandExecutor {
  private readonly systemControls: SystemControls;
  private readonly avatarControls: AvatarControls;
  private readonly presetRunner: PresetActionRunner;
  private readonly onUnhandled?: (text: string) => void;

  constructor(deps: VoiceCommandExecutorDeps) {
    this.systemControls = deps.systemControls;
    this.avatarControls = deps.avatarControls;
    this.presetRunner = new PresetActionRunner(deps.avatarControls);
    this.onUnhandled = deps.onUnhandled;
  }

  /**
   * Execute a voice command.
   *
   * @param input - The voice input text
   * @returns true if a command was matched and executed
   */
  execute(input: string): boolean {
    const result = parseVoiceCommand(input);

    if (!result.matched || !result.action) {
      this.onUnhandled?.(input);
      return false;
    }

    return this.executeAction(result.action);
  }

  /**
   * Parse input without executing.
   * Useful for preview or validation.
   */
  parse(input: string): VoiceCommandResult {
    return parseVoiceCommand(input);
  }

  /**
   * Get the preset action runner.
   * Useful for direct preset action invocation.
   */
  get presetActions(): PresetActionRunner {
    return this.presetRunner;
  }

  /**
   * Clear any pending timers (e.g., expression resets).
   * Call when aborting or disposing.
   */
  abort(): void {
    this.presetRunner.clearTimers();
  }

  private executeAction(action: VoiceCommandResult['action']): boolean {
    if (!action) return false;

    switch (action.type) {
      case 'play':
        this.systemControls.play();
        logger.info('Voice command: play');
        return true;

      case 'pause':
        this.systemControls.pause();
        logger.info('Voice command: pause');
        return true;

      case 'reset':
        this.systemControls.reset();
        logger.info('Voice command: reset');
        return true;

      case 'mute':
        this.systemControls.setMuted(true);
        logger.info('Voice command: mute');
        return true;

      case 'unmute':
        this.systemControls.setMuted(false);
        logger.info('Voice command: unmute');
        return true;

      case 'greeting':
        this.presetRunner.greeting();
        return true;

      case 'dance':
        this.presetRunner.dance();
        return true;

      case 'nod':
        this.presetRunner.nod();
        return true;

      case 'shakeHead':
        this.presetRunner.shakeHead();
        return true;

      case 'speak':
        // The 'speak' command triggers TTS directly
        this.avatarControls.speak(action.text);
        logger.info('Voice command: speak');
        return true;

      case 'expression':
        // Expression command - set expression and schedule reset
        this.avatarControls.setExpression(action.expression);
        this.presetRunner.scheduleExpressionReset(action.expression);
        logger.info(`Voice command: expression (${action.expression})`);
        return true;

      default:
        return false;
    }
  }
}

/**
 * Create a VoiceCommandExecutor with the given dependencies.
 * Convenience factory function.
 */
export function createVoiceCommandExecutor(deps: VoiceCommandExecutorDeps): VoiceCommandExecutor {
  return new VoiceCommandExecutor(deps);
}
