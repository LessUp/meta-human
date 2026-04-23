# Emotion System

Specification for the avatar's emotional expression system.

## Overview

The emotion system maps dialogue responses to avatar facial expressions and behaviors.

## Emotion Types

The system SHALL support the following emotion types:

| Emotion | Description | Expression Mapping |
|---------|-------------|-------------------|
| `neutral` | Default calm state | neutral |
| `happy` | Positive emotion | smile |
| `surprised` | Unexpected reaction | surprise |
| `sad` | Negative emotion | sad |
| `angry` | Strong negative emotion | angry |

## Expression Types

The system SHALL support the following facial expressions:

- `neutral` — Default expression
- `smile` — Happy expression
- `laugh` — Amused expression
- `surprise` — Shocked expression
- `sad` — Downcast expression
- `angry` — Frustrated expression
- `blink` — Eye blink
- `eyebrow_raise` — Raised eyebrows
- `eye_blink` — Deliberate eye close
- `mouth_open` — Open mouth
- `head_nod` — Nodding motion

## Emotion-Expression Mapping

The system SHALL map emotions to expressions as follows:

```typescript
EMOTION_TO_EXPRESSION = {
  neutral: 'neutral',
  happy: 'smile',
  surprised: 'surprise',
  sad: 'sad',
  angry: 'angry',
}
```

## Expression Intensity

The system SHALL support expression intensity control:

- Default intensity: 0.8
- Valid range: 0.0 to 1.0
- Intensity affects blend shape weights

## Behavior Types

The system SHALL support the following behavior types:

| Behavior | Description | Duration |
|----------|-------------|----------|
| `idle` | Default state | Continuous |
| `greeting` | Initial greeting | 3s |
| `listening` | Active listening | Continuous |
| `thinking` | Processing state | 3s |
| `speaking` | Active speech | Variable |
| `excited` | High energy state | Variable |
| `wave` | Waving gesture | 3s |
| `greet` | Greeting gesture | 3s |
| `nod` | Nodding gesture | 2s |
| `shakeHead` | Head shake gesture | 2s |
| `dance` | Dancing animation | 6s |
| `waveHand` | Hand wave | Variable |
| `raiseHand` | Raised hand | Variable |

## Animation-Behavior Mapping

The system SHALL map animations to behaviors:

```typescript
ANIMATION_TO_BEHAVIOR = {
  wave: 'greeting',
  greet: 'greeting',
  nod: 'listening',
  shakeHead: 'idle',
  dance: 'excited',
  think: 'thinking',
  speak: 'speaking',
}
```

## API Response Emotion Field

The backend API SHALL return an `emotion` field in chat responses:

```typescript
interface ChatResponse {
  replyText: string;
  emotion: 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
  action: 'idle' | 'wave' | 'greet' | 'think' | 'nod' | 'shakeHead' | 'dance' | 'speak';
}
```

## State Management

The emotion state SHALL be managed in `digitalHumanStore`:

```typescript
interface EmotionState {
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  expressionIntensity: number;
  currentBehavior: BehaviorType;
}
```

## Actions

The store SHALL provide the following actions:

- `setEmotion(emotion)` — Update current emotion
- `setExpression(expression)` — Update current expression
- `setExpressionIntensity(intensity)` — Update expression intensity
- `setBehavior(behavior)` — Update current behavior

## Vision-Based Emotion Detection

The vision module MAY map face landmarks to emotions:

- Face landmarks detected via MediaPipe Face Mesh
- `visionMapper.mapFaceToEmotion(landmarks)` returns `{ emotion, motion }`
- Detected emotions can trigger avatar responses
