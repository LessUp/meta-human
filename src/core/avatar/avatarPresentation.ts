export type EmotionType = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
export type ExpressionType =
  | 'neutral'
  | 'smile'
  | 'laugh'
  | 'surprise'
  | 'sad'
  | 'angry'
  | 'blink'
  | 'eyebrow_raise'
  | 'eye_blink'
  | 'mouth_open'
  | 'head_nod';
export type BehaviorType =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'wave'
  | 'greet'
  | 'think'
  | 'nod'
  | 'shakeHead'
  | 'dance'
  | 'speak'
  | 'waveHand'
  | 'raiseHand'
  | 'bow'
  | 'clap'
  | 'thumbsUp'
  | 'headTilt'
  | 'shrug'
  | 'lookAround'
  | 'cheer'
  | 'sleep'
  | 'crossArms'
  | 'point';
export type AvatarType = 'cyber' | 'vrm';

export const AVATAR_POSE_INTENTS = [
  'idle',
  'greeting',
  'listening',
  'thinking',
  'speaking',
  'excited',
] as const;
export type AvatarPoseIntent = (typeof AVATAR_POSE_INTENTS)[number];

export const AVATAR_GESTURE_CUES = [
  'wave',
  'greet',
  'think',
  'nod',
  'shakeHead',
  'dance',
  'speak',
  'waveHand',
  'raiseHand',
  'bow',
  'clap',
  'thumbsUp',
  'headTilt',
  'shrug',
  'lookAround',
  'cheer',
  'sleep',
  'crossArms',
  'point',
] as const;
export type AvatarGestureCue = (typeof AVATAR_GESTURE_CUES)[number];

export interface AvatarPresentation {
  mood: EmotionType;
  poseIntent: AvatarPoseIntent;
  facialCue: ExpressionType;
  gestureCue: AvatarGestureCue | null;
  intensity: number;
  avatarType: AvatarType;
  isSpeaking: boolean;
  isRecording: boolean;
}

export interface AvatarCommand {
  mood?: EmotionType;
  poseIntent?: AvatarPoseIntent;
  facialCue?: ExpressionType;
  gestureCue?: AvatarGestureCue | null;
  intensity?: number;
  speaking?: boolean;
}

export interface AvatarPresentationState {
  avatarType: AvatarType;
  currentAnimation: string;
  currentBehavior: BehaviorType;
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  expressionIntensity: number;
  isRecording: boolean;
  isSpeaking: boolean;
}

export const EMOTION_TO_EXPRESSION: Record<EmotionType, ExpressionType> = {
  neutral: 'neutral',
  happy: 'smile',
  surprised: 'surprise',
  sad: 'sad',
  angry: 'angry',
};

export const VALID_EMOTIONS: EmotionType[] = ['neutral', 'happy', 'surprised', 'sad', 'angry'];
export const VALID_EXPRESSIONS: ExpressionType[] = [
  'neutral',
  'smile',
  'laugh',
  'surprise',
  'sad',
  'angry',
  'blink',
  'eyebrow_raise',
  'eye_blink',
  'mouth_open',
  'head_nod',
];
export const VALID_BEHAVIORS: BehaviorType[] = [
  'idle',
  'greeting',
  'listening',
  'thinking',
  'speaking',
  'excited',
  'wave',
  'greet',
  'think',
  'nod',
  'shakeHead',
  'dance',
  'speak',
  'waveHand',
  'raiseHand',
  'bow',
  'clap',
  'thumbsUp',
  'headTilt',
  'shrug',
  'lookAround',
  'cheer',
  'sleep',
  'crossArms',
  'point',
];
export const ANIMATION_DURATIONS: Record<string, number> = {
  idle: 0,
  greeting: 3000,
  listening: 2000,
  thinking: 3000,
  speaking: 0,
  excited: 4000,
  wave: 3000,
  greet: 3000,
  think: 3000,
  nod: 2000,
  shakeHead: 2000,
  dance: 6000,
  speak: 0,
  waveHand: 3000,
  raiseHand: 3000,
  bow: 3000,
  clap: 3000,
  thumbsUp: 3000,
  headTilt: 2500,
  shrug: 2500,
  lookAround: 4000,
  cheer: 4000,
  sleep: 5000,
  crossArms: 3000,
  point: 3000,
};

const BEHAVIOR_TO_POSE_INTENT: Record<BehaviorType, AvatarPoseIntent> = {
  idle: 'idle',
  greeting: 'greeting',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  excited: 'excited',
  wave: 'greeting',
  greet: 'greeting',
  think: 'thinking',
  nod: 'listening',
  shakeHead: 'idle',
  dance: 'excited',
  speak: 'speaking',
  waveHand: 'greeting',
  raiseHand: 'greeting',
  bow: 'idle',
  clap: 'idle',
  thumbsUp: 'idle',
  headTilt: 'idle',
  shrug: 'idle',
  lookAround: 'idle',
  cheer: 'excited',
  sleep: 'idle',
  crossArms: 'idle',
  point: 'idle',
};

const GESTURE_CUE_TO_BEHAVIOR: Record<AvatarGestureCue, BehaviorType> = {
  wave: 'greeting',
  greet: 'greeting',
  think: 'thinking',
  nod: 'listening',
  shakeHead: 'idle',
  dance: 'excited',
  speak: 'speaking',
  waveHand: 'greeting',
  raiseHand: 'greeting',
  bow: 'bow',
  clap: 'clap',
  thumbsUp: 'thumbsUp',
  headTilt: 'headTilt',
  shrug: 'shrug',
  lookAround: 'lookAround',
  cheer: 'cheer',
  sleep: 'sleep',
  crossArms: 'crossArms',
  point: 'point',
};

export function clampExpressionIntensity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function isAvatarPoseIntent(value: string): value is AvatarPoseIntent {
  return (AVATAR_POSE_INTENTS as readonly string[]).includes(value);
}

export function isAvatarGestureCue(value: string): value is AvatarGestureCue {
  return (AVATAR_GESTURE_CUES as readonly string[]).includes(value);
}

export function resolvePoseIntent(behavior: BehaviorType, isSpeaking = false): AvatarPoseIntent {
  if (isSpeaking) {
    return 'speaking';
  }

  return BEHAVIOR_TO_POSE_INTENT[behavior] ?? 'idle';
}

export function resolveGestureCue(animation: string, behavior: BehaviorType): AvatarGestureCue | null {
  if (isAvatarGestureCue(animation)) {
    return animation;
  }

  if (isAvatarGestureCue(behavior)) {
    return behavior;
  }

  return null;
}

export function poseIntentToBehavior(poseIntent: AvatarPoseIntent): BehaviorType {
  switch (poseIntent) {
    case 'greeting':
      return 'greeting';
    case 'listening':
      return 'listening';
    case 'thinking':
      return 'thinking';
    case 'speaking':
      return 'speaking';
    case 'excited':
      return 'excited';
    case 'idle':
    default:
      return 'idle';
  }
}

export function gestureCueToBehavior(gestureCue: AvatarGestureCue): BehaviorType {
  return GESTURE_CUE_TO_BEHAVIOR[gestureCue];
}

export function applyAvatarCommand(
  state: AvatarPresentationState,
  command: AvatarCommand
): Partial<AvatarPresentationState> {
  const nextEmotion = command.mood ?? state.currentEmotion;
  const nextExpression = command.facialCue ?? state.currentExpression;
  const nextIntensity =
    command.intensity === undefined
      ? state.expressionIntensity
      : clampExpressionIntensity(command.intensity);
  const nextSpeaking = command.speaking ?? state.isSpeaking;
  const nextBehavior = command.gestureCue
    ? gestureCueToBehavior(command.gestureCue)
    : command.poseIntent
      ? poseIntentToBehavior(command.poseIntent)
      : nextSpeaking
        ? 'speaking'
        : state.currentBehavior;
  const nextAnimation = command.gestureCue ?? state.currentAnimation;

  return {
    currentEmotion: nextEmotion,
    currentExpression: nextExpression,
    expressionIntensity: nextIntensity,
    currentBehavior: nextBehavior,
    currentAnimation: nextAnimation,
    isSpeaking: nextSpeaking,
  };
}

export function behaviorToAvatarCommand(behavior: BehaviorType): AvatarCommand {
  return {
    poseIntent: resolvePoseIntent(behavior),
    gestureCue: isAvatarGestureCue(behavior) ? behavior : null,
  };
}

type AvatarPresentationSource = AvatarPresentationState;

export function selectAvatarPresentation(state: AvatarPresentationSource): AvatarPresentation {
  return {
    mood: state.currentEmotion,
    poseIntent: resolvePoseIntent(state.currentBehavior, state.isSpeaking),
    facialCue:
      state.currentExpression === 'neutral'
        ? EMOTION_TO_EXPRESSION[state.currentEmotion] ?? 'neutral'
        : state.currentExpression,
    gestureCue: resolveGestureCue(state.currentAnimation, state.currentBehavior),
    intensity: clampExpressionIntensity(state.expressionIntensity ?? 0.8),
    avatarType: state.avatarType,
    isSpeaking: state.isSpeaking,
    isRecording: state.isRecording,
  };
}
