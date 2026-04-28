## Why

MetaHuman Engine already has a solid modular architecture, but the first implementation phase is still held back by foundational UX and diagnostics gaps: streamed replies are not truly incremental on the server path, chat history is lost on refresh, and runtime telemetry is only partially surfaced. These issues make later work on realism, realtime voice, and agent behavior build on an unreliable base.

## What Changes

- Refine dialogue streaming so `/v1/chat/stream` emits user-visible reply tokens incrementally while preserving the final `{ replyText, emotion, action }` contract.
- Persist bounded chat history locally so the active session survives refresh until the user explicitly starts a new session.
- Expand runtime observability by formalizing connection, transport, render, model-load, and chat latency signals in the existing state/UI surfaces.
- Keep all changes within the existing browser-first and graceful-degradation architecture; no new runtime services or vendor integrations are introduced in this phase.

## Capabilities

### New Capabilities
- `observability/runtime`: Runtime diagnostics and telemetry are exposed consistently to the application and existing status surfaces.

### Modified Capabilities
- `behavior/dialogue`: Streaming behavior, turn lifecycle, fallback handling, and token timing requirements are tightened.
- `state/stores`: Chat session persistence and observability-related state requirements are expanded.

## Impact

- Backend streaming logic in `server/app/services/dialogue.py`
- Frontend dialogue orchestration and streaming consumption in `src/core/dialogue/` and `src/hooks/useChatStream.ts`
- Session persistence in `src/store/chatSessionStore.ts`
- Telemetry state and status presentation in `src/store/systemStore.ts`, `src/components/TopHUD.tsx`, and `src/hooks/useConnectionHealth.ts`
- Related tests across dialogue, store, and UI behavior
