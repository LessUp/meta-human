/**
 * Voice command module.
 *
 * Single entry point for voice command handling.
 * Consolidates parsing, routing, and execution.
 */

export { VoiceCommandExecutor, createVoiceCommandExecutor } from './executor';
export { PresetActionRunner } from './presetActions';
export { parseVoiceCommand } from './parser';
export type {
  VoiceCommandAction,
  VoiceCommandResult,
  SystemControls,
  AvatarControls,
  VoiceCommandExecutorDeps,
} from './types';
