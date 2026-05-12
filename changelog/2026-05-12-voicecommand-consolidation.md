# 2026-05-12: VoiceCommand Module Consolidation

## Summary

Consolidated scattered voice command logic into a single deep module (`src/core/voiceCommand/`).

## Changes

### New Files

- `src/core/voiceCommand/types.ts` - Centralized type definitions
- `src/core/voiceCommand/parser.ts` - Pure parsing logic (moved from voiceCommandProcessor.ts)
- `src/core/voiceCommand/presetActions.ts` - PresetActionRunner class (extracted from ASRService)
- `src/core/voiceCommand/executor.ts` - VoiceCommandExecutor (the deep module)
- `src/core/voiceCommand/index.ts` - Public exports

### Modified Files

- `src/core/audio/audioService.ts` - Uses VoiceCommandExecutor instead of processVoiceCommand
- `src/hooks/useVoiceCommandHandler.ts` - Uses VoiceCommandExecutor
- `src/__tests__/useAdvancedDigitalHumanController.test.tsx` - Added useTTS mock

### Deprecated Files

- `src/core/audio/voiceCommandProcessor.ts` - Marked as deprecated
- `src/lib/voiceCommands.ts` - Marked as deprecated

## Benefits

1. **Locality** - Voice command logic concentrated in one module
2. **Leverage** - Single interface for all voice command handling
3. **Testability** - VoiceCommandExecutor can be tested through its interface
4. **Clarity** - No more 3 different command routing systems

## Migration Guide

Replace:

```typescript
import { processVoiceCommand } from './voiceCommandProcessor';
```

With:

```typescript
import { VoiceCommandExecutor } from '@/core/voiceCommand';
const executor = new VoiceCommandExecutor({ systemControls, avatarControls, onUnhandled });
executor.execute(text);
```
