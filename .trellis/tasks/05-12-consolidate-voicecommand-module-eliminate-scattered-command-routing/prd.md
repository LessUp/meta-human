# PRD: Consolidate VoiceCommand Module

## Problem Statement

Voice command logic is scattered across 5 files with 3 independent command routing systems:

1. `voiceCommandProcessor.ts` - `processVoiceCommand()` with system + preset commands
2. `voiceCommands.ts` - `executeVoiceCommand()` with different command set (说话, 表情)
3. `getDefaultVoiceCommandHandlers()` - third routing layer
4. `ASRService.performGreeting/Dance/Nod/ShakeHead()` - preset action implementations
5. `useVoiceCommandHandler.ts` - hook wrapper with another routing

**Consequences:**

- Same operations (greeting, dance) implemented in multiple places
- Command sets are inconsistent between routers
- Understanding voice commands requires tracing 5 files
- Tests must mock entire dialogue stack to test ASRService

## Solution

Create a **deep VoiceCommand module** with a single seam:

```
src/core/voiceCommand/
├── index.ts              # Public exports
├── types.ts              # VoiceCommandAction, VoiceCommandResult
├── parser.ts             # Pure parsing logic (moved from voiceCommandProcessor.ts)
├── presetActions.ts      # PresetActionRunner class
└── executor.ts           # VoiceCommandExecutor (the deep module)
```

### Module Interface

```typescript
// executor.ts - the deep module
export class VoiceCommandExecutor {
  constructor(
    private readonly deps: {
      systemControls: SystemControls;
      presetActions: PresetActionRunner;
      onUnhandled?: (text: string) => void;
    },
  ) {}

  // Single entry point - deep interface
  execute(text: string): boolean;

  // For advanced use
  parse(text: string): VoiceCommandResult;
}
```

### PresetActionRunner

Extract preset action orchestration from ASRService:

```typescript
export class PresetActionRunner {
  constructor(
    private readonly deps: {
      setEmotion: (e: EmotionType) => void;
      setExpression: (e: ExpressionType) => void;
      setAnimation: (a: string) => void;
      setBehavior: (b: BehaviorType) => void;
      speak: (text: string) => void;
    },
  ) {}

  greeting(): void;
  dance(): void;
  nod(): void;
  shakeHead(): void;
}
```

### Migration Path

1. Create `src/core/voiceCommand/` directory structure
2. Move pure parsing logic to `parser.ts`
3. Create `PresetActionRunner` from ASRService methods
4. Create `VoiceCommandExecutor` consolidating all routing
5. Update ASRService to use VoiceCommandExecutor
6. Update useVoiceCommandHandler to use VoiceCommandExecutor
7. Deprecate `src/lib/voiceCommands.ts`
8. Remove deprecated code after migration verified

## Success Criteria

- [ ] Single command routing system (VoiceCommandExecutor)
- [ ] All command types handled consistently (system + preset + unhandled)
- [ ] Preset actions extracted from ASRService
- [ ] ASRService no longer imports `processVoiceCommand` directly
- [ ] `voiceCommands.ts` deprecated or removed
- [ ] Tests can mock VoiceCommandExecutor interface
- [ ] No change to user-visible behavior

## Files Changed

| File                                      | Action                                      |
| ----------------------------------------- | ------------------------------------------- |
| `src/core/voiceCommand/index.ts`          | Create                                      |
| `src/core/voiceCommand/types.ts`          | Create                                      |
| `src/core/voiceCommand/parser.ts`         | Create (move from voiceCommandProcessor.ts) |
| `src/core/voiceCommand/presetActions.ts`  | Create                                      |
| `src/core/voiceCommand/executor.ts`       | Create                                      |
| `src/core/audio/audioService.ts`          | Modify (use VoiceCommandExecutor)           |
| `src/hooks/useVoiceCommandHandler.ts`     | Modify (use VoiceCommandExecutor)           |
| `src/lib/voiceCommands.ts`                | Deprecate                                   |
| `src/core/audio/voiceCommandProcessor.ts` | Deprecate                                   |

## Risks

- Behavior drift during migration - mitigate with existing tests
- Breaking changes to external consumers - none expected (internal refactor)
