import { describe, it, expect, vi } from 'vitest';
import {
  parseVoiceCommand,
  executeVoiceCommandAction,
  processVoiceCommand,
  type VoiceCommandAction,
} from '../core/audio/voiceCommandProcessor';

describe('parseVoiceCommand', () => {
  // System control commands
  it('matches "播放" (play)', () => {
    const result = parseVoiceCommand('播放');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'play' });
  });

  it('matches "开始" (start) as play', () => {
    const result = parseVoiceCommand('开始');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'play' });
  });

  it('matches "暂停" (pause)', () => {
    const result = parseVoiceCommand('暂停');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'pause' });
  });

  it('matches "停止" (stop) as pause', () => {
    const result = parseVoiceCommand('停止');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'pause' });
  });

  it('matches "重置" (reset)', () => {
    const result = parseVoiceCommand('重置');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'reset' });
  });

  it('matches "复位" as reset', () => {
    const result = parseVoiceCommand('复位');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'reset' });
  });

  it('matches "静音" (mute)', () => {
    const result = parseVoiceCommand('静音');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'mute' });
  });

  it('matches "取消静音" (unmute)', () => {
    const result = parseVoiceCommand('取消静音');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'unmute' });
  });

  // Quick action commands
  it('matches "打招呼" (greeting)', () => {
    const result = parseVoiceCommand('打招呼');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'greeting' });
  });

  it('matches "问好" as greeting', () => {
    const result = parseVoiceCommand('问好');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'greeting' });
  });

  it('matches "跳舞" (dance)', () => {
    const result = parseVoiceCommand('跳舞');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'dance' });
  });

  it('matches "点头" (nod)', () => {
    const result = parseVoiceCommand('点头');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'nod' });
  });

  it('matches "摇头" (shakeHead)', () => {
    const result = parseVoiceCommand('摇头');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'shakeHead' });
  });

  // Non-matching commands
  it('returns false for unknown command', () => {
    const result = parseVoiceCommand('你好世界');
    expect(result.matched).toBe(false);
    expect(result.action).toBeUndefined();
  });

  it('returns false for empty string', () => {
    const result = parseVoiceCommand('');
    expect(result.matched).toBe(false);
  });

  it('returns false for whitespace only', () => {
    const result = parseVoiceCommand('   ');
    expect(result.matched).toBe(false);
  });

  // Case and whitespace handling
  it('handles leading/trailing whitespace', () => {
    const result = parseVoiceCommand('  播放  ');
    expect(result.matched).toBe(true);
    expect(result.action).toEqual({ type: 'play' });
  });

  it('handles uppercase (though Chinese has no case)', () => {
    // This is mainly for documentation - Chinese doesn't have case
    const result = parseVoiceCommand('播放');
    expect(result.matched).toBe(true);
  });

  // Partial matches should not work
  it('does not match partial command "播放音乐"', () => {
    const result = parseVoiceCommand('播放音乐');
    expect(result.matched).toBe(false);
  });

  it('does not match partial command "请播放"', () => {
    const result = parseVoiceCommand('请播放');
    expect(result.matched).toBe(false);
  });
});

describe('executeVoiceCommandAction', () => {
  it('executes play action', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const action: VoiceCommandAction = { type: 'play' };
    const result = executeVoiceCommandAction(action, state);
    expect(result).toBe(true);
    expect(state.play).toHaveBeenCalledTimes(1);
  });

  it('executes pause action', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const action: VoiceCommandAction = { type: 'pause' };
    const result = executeVoiceCommandAction(action, state);
    expect(result).toBe(true);
    expect(state.pause).toHaveBeenCalledTimes(1);
  });

  it('executes reset action', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const action: VoiceCommandAction = { type: 'reset' };
    const result = executeVoiceCommandAction(action, state);
    expect(result).toBe(true);
    expect(state.reset).toHaveBeenCalledTimes(1);
  });

  it('executes mute action', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const action: VoiceCommandAction = { type: 'mute' };
    const result = executeVoiceCommandAction(action, state);
    expect(result).toBe(true);
    expect(state.setMuted).toHaveBeenCalledWith(true);
  });

  it('executes unmute action', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const action: VoiceCommandAction = { type: 'unmute' };
    const result = executeVoiceCommandAction(action, state);
    expect(result).toBe(true);
    expect(state.setMuted).toHaveBeenCalledWith(false);
  });

  it('executes greeting action with preset handler', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const greeting = vi.fn();
    const action: VoiceCommandAction = { type: 'greeting' };
    const result = executeVoiceCommandAction(action, state, { greeting });
    expect(result).toBe(true);
    expect(greeting).toHaveBeenCalledTimes(1);
  });

  it('returns false for greeting action without preset handler', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const action: VoiceCommandAction = { type: 'greeting' };
    const result = executeVoiceCommandAction(action, state);
    expect(result).toBe(false);
  });

  it('executes dance action with preset handler', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const dance = vi.fn();
    const action: VoiceCommandAction = { type: 'dance' };
    const result = executeVoiceCommandAction(action, state, { dance });
    expect(result).toBe(true);
    expect(dance).toHaveBeenCalledTimes(1);
  });

  it('executes nod action with preset handler', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const nod = vi.fn();
    const action: VoiceCommandAction = { type: 'nod' };
    const result = executeVoiceCommandAction(action, state, { nod });
    expect(result).toBe(true);
    expect(nod).toHaveBeenCalledTimes(1);
  });

  it('executes shakeHead action with preset handler', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const shakeHead = vi.fn();
    const action: VoiceCommandAction = { type: 'shakeHead' };
    const result = executeVoiceCommandAction(action, state, { shakeHead });
    expect(result).toBe(true);
    expect(shakeHead).toHaveBeenCalledTimes(1);
  });
});

describe('processVoiceCommand', () => {
  it('parses and executes play command', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const result = processVoiceCommand('播放', state);
    expect(result).toBe(true);
    expect(state.play).toHaveBeenCalledTimes(1);
  });

  it('parses and executes greeting command with preset', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const greeting = vi.fn();
    const result = processVoiceCommand('打招呼', state, { greeting });
    expect(result).toBe(true);
    expect(greeting).toHaveBeenCalledTimes(1);
  });

  it('returns false for unknown command', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const result = processVoiceCommand('你好', state);
    expect(result).toBe(false);
  });

  it('returns false for greeting without preset handler', () => {
    const state = { play: vi.fn(), pause: vi.fn(), reset: vi.fn(), setMuted: vi.fn() };
    const result = processVoiceCommand('打招呼', state);
    expect(result).toBe(false);
  });
});
