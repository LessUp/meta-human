/**
 * Voice command processor.
 *
 * Pure logic for mapping voice commands to actions.
 * This module has no I/O dependencies and can be unit tested in isolation.
 */

import { loggers } from '../../lib/logger';

const logger = loggers.audio;

/**
 * All possible voice command actions.
 */
export type VoiceCommandAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'mute' }
  | { type: 'unmute' }
  | { type: 'greeting' }
  | { type: 'dance' }
  | { type: 'nod' }
  | { type: 'shakeHead' };

/**
 * Result of parsing a voice command.
 * - `action`: the matched action (if any)
 * - `matched`: whether a command was matched
 */
export interface VoiceCommandResult {
  action?: VoiceCommandAction;
  matched: boolean;
}

/**
 * Parse a voice command string and return the corresponding action.
 *
 * @param command - The voice input text (already lowercased/trimmed)
 * @returns The parsed result with action and matched status
 */
export function parseVoiceCommand(command: string): VoiceCommandResult {
  const trimmed = command.trim().toLowerCase();

  // System control commands — exact match only
  if (trimmed === '播放' || trimmed === '开始') {
    return { action: { type: 'play' }, matched: true };
  }
  if (trimmed === '暂停' || trimmed === '停止') {
    return { action: { type: 'pause' }, matched: true };
  }
  if (trimmed === '重置' || trimmed === '复位') {
    return { action: { type: 'reset' }, matched: true };
  }
  if (trimmed === '取消静音') {
    return { action: { type: 'unmute' }, matched: true };
  }
  if (trimmed === '静音') {
    return { action: { type: 'mute' }, matched: true };
  }

  // Quick action commands — exact match only
  if (trimmed === '打招呼' || trimmed === '问好') {
    return { action: { type: 'greeting' }, matched: true };
  }
  if (trimmed === '跳舞') {
    return { action: { type: 'dance' }, matched: true };
  }
  if (trimmed === '点头') {
    return { action: { type: 'nod' }, matched: true };
  }
  if (trimmed === '摇头') {
    return { action: { type: 'shakeHead' }, matched: true };
  }

  return { matched: false };
}

/**
 * Execute a voice command action against a state adapter.
 *
 * @param action - The action to execute
 * @param state - The state adapter to mutate
 * @param presets - Optional preset action handlers (for greeting, dance, etc.)
 * @returns true if the action was executed
 */
export function executeVoiceCommandAction(
  action: VoiceCommandAction,
  state: {
    play: () => void;
    pause: () => void;
    reset: () => void;
    setMuted: (muted: boolean) => void;
  },
  presets?: {
    greeting?: () => void;
    dance?: () => void;
    nod?: () => void;
    shakeHead?: () => void;
  },
): boolean {
  switch (action.type) {
    case 'play':
      state.play();
      logger.info('Voice command: play');
      return true;
    case 'pause':
      state.pause();
      logger.info('Voice command: pause');
      return true;
    case 'reset':
      state.reset();
      logger.info('Voice command: reset');
      return true;
    case 'mute':
      state.setMuted(true);
      logger.info('Voice command: mute');
      return true;
    case 'unmute':
      state.setMuted(false);
      logger.info('Voice command: unmute');
      return true;
    case 'greeting':
      if (presets?.greeting) {
        presets.greeting();
        logger.info('Voice command: greeting');
        return true;
      }
      return false;
    case 'dance':
      if (presets?.dance) {
        presets.dance();
        logger.info('Voice command: dance');
        return true;
      }
      return false;
    case 'nod':
      if (presets?.nod) {
        presets.nod();
        logger.info('Voice command: nod');
        return true;
      }
      return false;
    case 'shakeHead':
      if (presets?.shakeHead) {
        presets.shakeHead();
        logger.info('Voice command: shakeHead');
        return true;
      }
      return false;
    default:
      return false;
  }
}

/**
 * Parse and execute a voice command in one step.
 *
 * @param command - The voice input text
 * @param state - The state adapter for system commands
 * @param presets - Optional preset action handlers
 * @returns true if a command was matched and executed
 */
export function processVoiceCommand(
  command: string,
  state: {
    play: () => void;
    pause: () => void;
    reset: () => void;
    setMuted: (muted: boolean) => void;
  },
  presets?: {
    greeting?: () => void;
    dance?: () => void;
    nod?: () => void;
    shakeHead?: () => void;
  },
): boolean {
  const result = parseVoiceCommand(command);
  if (!result.matched || !result.action) {
    return false;
  }
  return executeVoiceCommandAction(result.action, state, presets);
}
