/**
 * Voice command types.
 *
 * Centralized type definitions for the voice command system.
 */

import type { EmotionType, ExpressionType, BehaviorType } from '../../store/digitalHumanStore';

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
  | { type: 'shakeHead' }
  | { type: 'speak'; text: string }
  | { type: 'expression'; expression: ExpressionType };

/**
 * Result of parsing a voice command.
 */
export interface VoiceCommandResult {
  action?: VoiceCommandAction;
  matched: boolean;
}

/**
 * System controls for voice commands.
 * Controls playback, mute, and reset functionality.
 */
export interface SystemControls {
  play(): void;
  pause(): void;
  reset(): void;
  setMuted(muted: boolean): void;
}

/**
 * Avatar controls for preset actions.
 * Used by PresetActionRunner to orchestrate animations.
 */
export interface AvatarControls {
  setEmotion(emotion: EmotionType): void;
  setExpression(expression: ExpressionType): void;
  setAnimation(animation: string): void;
  setBehavior(behavior: BehaviorType): void;
  speak(text: string): void;
}

/**
 * Dependencies for VoiceCommandExecutor.
 */
export interface VoiceCommandExecutorDeps {
  systemControls: SystemControls;
  avatarControls: AvatarControls;
  /** Called when no command matches */
  onUnhandled?: (text: string) => void;
}
