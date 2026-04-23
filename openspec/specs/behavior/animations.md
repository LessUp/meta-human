# Animation System

Specification for the avatar's animation system.

## Overview

The animation system controls avatar movements, gestures, and transitions.

## Animation Types

The system SHALL support the following animations:

| Animation | Description | Duration |
|-----------|-------------|----------|
| `idle` | Default standing pose | Continuous |
| `wave` | Waving gesture | 3000ms |
| `greet` | Greeting gesture | 3000ms |
| `nod` | Head nod | 2000ms |
| `shakeHead` | Head shake | 2000ms |
| `dance` | Dancing motion | 6000ms |
| `think` | Thinking pose | 3000ms |
| `speak` | Speaking animation | Variable |

## Animation Durations

The system SHALL define animation durations:

```typescript
ANIMATION_DURATIONS = {
  wave: 3000,
  greet: 3000,
  nod: 2000,
  shakeHead: 2000,
  dance: 6000,
  think: 3000,
  speak: 0,     // Variable duration
  idle: 0,      // Continuous
}
```

## Animation Triggers

Animations SHALL be triggered by:

1. **API Response** — `action` field in ChatResponse
2. **User Interaction** — Control panel buttons
3. **Vision Detection** — Face/pose landmarks mapped to motions
4. **Speech** — Lip sync during TTS playback

## Animation State

The system SHALL track animation state:

```typescript
interface AnimationState {
  isPlaying: boolean;
  currentAnimation: string;
  autoRotate: boolean;
}
```

## DigitalHumanEngine

The `DigitalHumanEngine` SHALL provide an imperative API:

```typescript
interface DigitalHumanEngine {
  // Animation control
  perform(options: { emotion?, action? }): void;
  playAnimation(name: string): void;
  stopAnimation(): void;

  // Expression control
  setEmotion(emotion: EmotionType): void;
  setExpression(expression: ExpressionType): void;
  setExpressionIntensity(intensity: number): void;

  // Lifecycle
  pause(): void;
  resume(): void;
  reset(): void;
}
```

## Animation Blending

The system SHOULD support smooth transitions:

- Cross-fade between animations
- Blend shape interpolation for expressions
- Interrupt handling for immediate transitions

## Performance Considerations

The system SHALL optimize animations based on device tier:

- High: Full animation quality, smooth blending
- Medium: Reduced blend complexity
- Low: Simple animations, no blending

## Auto-Rotate

The system SHALL support auto-rotation:

- Camera rotates around avatar when enabled
- User can toggle via control panel
- State tracked in `autoRotate` boolean

## Lip Sync

The system MAY support lip sync during speech:

- `speak` animation synchronized with TTS
- Mouth movements match phonemes
- Disabled when muted
