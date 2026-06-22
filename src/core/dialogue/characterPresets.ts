import type { AvatarAction, EmotionType } from '../avatar/avatarContract';

export interface CharacterPreset {
  id: string;
  name: string;
  description: string;
  defaultEmotion: EmotionType;
  defaultAction: AvatarAction;
}

/**
 * 内置角色预设。
 * 后端 examples/backend-python 维护对应的 system prompt 映射，
 * 前端只携带 characterId，不直接传 system prompt（避免注入）。
 */
export const CHARACTER_PRESETS: readonly CharacterPreset[] = [
  {
    id: 'lively-assistant',
    name: '活泼助手',
    description: '轻松友好、语气积极，适合通用对话场景',
    defaultEmotion: 'happy',
    defaultAction: 'wave',
  },
  {
    id: 'serious-advisor',
    name: '严肃顾问',
    description: '稳重克制、注重准确，适合知识/咨询场景',
    defaultEmotion: 'neutral',
    defaultAction: 'nod',
  },
  {
    id: 'cute-companion',
    name: '可爱萌系',
    description: '俏皮可爱、多用表情，适合娱乐陪伴场景',
    defaultEmotion: 'happy',
    defaultAction: 'greet',
  },
  {
    id: 'pro-service',
    name: '专业客服',
    description: '礼貌规范、简洁高效，适合服务接待场景',
    defaultEmotion: 'neutral',
    defaultAction: 'greet',
  },
] as const;

export const DEFAULT_CHARACTER_ID = 'lively-assistant';

export function getCharacterPreset(id: string): CharacterPreset {
  return CHARACTER_PRESETS.find((preset) => preset.id === id) ?? CHARACTER_PRESETS[0];
}

export function isValidCharacterId(id: string): boolean {
  return CHARACTER_PRESETS.some((preset) => preset.id === id);
}
