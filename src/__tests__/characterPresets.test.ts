import { describe, expect, it } from 'vitest';
import {
  CHARACTER_PRESETS,
  DEFAULT_CHARACTER_ID,
  getCharacterPreset,
  isValidCharacterId,
} from '@/core/dialogue/characterPresets';

describe('characterPresets', () => {
  it('ships at least 4 built-in presets', () => {
    expect(CHARACTER_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('each preset has unique id and non-empty name/description', () => {
    const ids = new Set<string>();
    for (const preset of CHARACTER_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
    }
  });

  it('default character id is valid and exists in presets', () => {
    expect(isValidCharacterId(DEFAULT_CHARACTER_ID)).toBe(true);
    const preset = getCharacterPreset(DEFAULT_CHARACTER_ID);
    expect(preset.id).toBe(DEFAULT_CHARACTER_ID);
  });

  it('getCharacterPreset returns matching preset for known id', () => {
    const preset = getCharacterPreset('serious-advisor');
    expect(preset.id).toBe('serious-advisor');
  });

  it('getCharacterPreset falls back to first preset for unknown id', () => {
    const preset = getCharacterPreset('nonexistent-character');
    expect(preset.id).toBe(CHARACTER_PRESETS[0].id);
  });

  it('isValidCharacterId returns false for empty/unknown', () => {
    expect(isValidCharacterId('')).toBe(false);
    expect(isValidCharacterId('fake-character')).toBe(false);
  });
});
