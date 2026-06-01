/**
 * Voice command parser.
 *
 * Pure logic for mapping voice input to actions.
 * No I/O dependencies - can be unit tested in isolation.
 */

import type { ExpressionType } from '../avatar/avatarContract';
import type { VoiceCommandResult } from './types';

/**
 * Parse a voice command string and return the corresponding action.
 *
 * @param input - The voice input text
 * @returns The parsed result with action and matched status
 */
export function parseVoiceCommand(input: string): VoiceCommandResult {
  const trimmed = input.trim().toLowerCase();

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

  // Preset action commands — exact match only
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

  // Extended commands from voiceCommands.ts
  if (trimmed === '说话') {
    return { action: { type: 'speak', text: '您好！有什么可以帮助您的吗？' }, matched: true };
  }
  if (trimmed === '表情') {
    const expressions: ExpressionType[] = ['smile', 'surprise', 'laugh'];
    const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
    return { action: { type: 'expression', expression: randomExpr }, matched: true };
  }

  return { matched: false };
}
