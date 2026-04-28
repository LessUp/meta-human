## Context

The codebase already exposes a strong foundation for P0 work:

- `dialogueOrchestrator.ts` and `useChatStream.ts` already track first-token and completion timing, but those metrics are only meaningful if the backend truly streams visible reply text.
- `systemStore.ts` already models connection, chat performance, render performance, and model-load metrics, and `TopHUD.tsx` already renders a subset of them.
- `chatSessionStore.ts` persists only `sessionId`, so a page refresh breaks conversation continuity even when the backend session still exists.

The phase goal is to make the current engine feel reliable before any larger realism or agent-platform work is attempted.

## Goals / Non-Goals

**Goals:**
- Deliver true incremental reply streaming without breaking the existing final response shape.
- Preserve bounded chat history locally across refreshes and clear it deterministically on new session.
- Make runtime diagnostics a first-class part of the existing system state and HUD surfaces.
- Stay within current framework patterns: Zustand stores, service-to-store coordination, graceful fallback, and minimal re-rendering.

**Non-Goals:**
- Introducing humanoid avatar formats such as VRM
- Replacing browser TTS/ASR with new speech providers or local inference
- Migrating to LiveKit, MCP-driven tooling, or a new agent runtime
- Redesigning the settings/UI layout beyond small telemetry surfacing changes

## Decisions

### 1. Preserve the SSE contract, but make token events meaningful

**Decision:** Keep the current `token` / `error` / `done` SSE event types, but refactor the backend stream path so `token` events contain visible `replyText` progress instead of waiting for the entire model response to complete.

**Rationale:** The frontend parser already understands these event types, so preserving the contract minimizes client churn. A backend-side incremental extractor or controlled reply-text streaming path is less risky than introducing a new transport or response shape in P0.

**Alternatives considered:**
- **Stream raw model JSON fragments to the client:** rejected because the UI expects natural-language text, not partial JSON.
- **Add a second model pass just for metadata:** rejected for P0 because it adds latency, cost, and architectural complexity.

### 2. Persist chat history in the existing chat session store

**Decision:** Extend `chatSessionStore` to persist bounded `chatHistory` in browser storage next to `sessionId`, with explicit reset on `initSession()` and defensive handling for malformed storage.

**Rationale:** This keeps session continuity responsibilities in the store that already owns session identity and message history. It also avoids introducing a separate persistence service or cross-store synchronization layer.

**Alternatives considered:**
- **Persist in a new storage helper module only:** rejected because it would duplicate state ownership.
- **Persist full history on the backend only:** rejected for P0 because the immediate problem is refresh continuity in the current browser app.

### 3. Extend observability through existing state and UI surfaces

**Decision:** Build P0 observability on top of `systemStore`, `TopHUD`, and `useConnectionHealth` rather than adding a new diagnostics subsystem.

**Rationale:** The state model and HUD already carry transport mode, connection status, and chat timings. Extending them is aligned with existing patterns and keeps observability close to where the app already reads runtime state.

**Alternatives considered:**
- **Add a new telemetry service with its own store:** rejected as over-engineering for P0.
- **Keep telemetry only in logs/tests:** rejected because the product goal is to make runtime health visible in the app itself.

### 4. Keep P0 dependency-free at runtime

**Decision:** Use the existing Zustand middleware package and current app infrastructure; do not introduce new client or server dependencies for this phase.

**Rationale:** P0 is meant to stabilize the current baseline, not expand the platform surface area. Existing tooling is sufficient for local persistence, streaming orchestration, and telemetry.

## Risks / Trade-offs

- **[Incremental reply extraction from structured model output can be brittle] → Mitigation:** keep a buffered fallback path and add targeted tests around partially received chunks, malformed fragments, and final metadata delivery.
- **[Persisted history can grow unbounded or become stale] → Mitigation:** cap stored message count and clear persisted history on explicit new-session creation.
- **[Additional telemetry can clutter the HUD] → Mitigation:** expose only compact, high-signal metrics and render optional values conditionally.
- **[P0 might accidentally expand into avatar or speech upgrades] → Mitigation:** keep proposal/spec scope limited to dialogue, state persistence, and runtime observability.

## Migration Plan

1. Land OpenSpec artifacts for the P0 scope and use them as the implementation contract.
2. Refactor backend streaming first so frontend token timing becomes meaningful.
3. Add session persistence to `chatSessionStore` with backward-compatible handling for the existing `metahuman_session_id`.
4. Extend observability state/UI surfaces and wire them into existing connection and streaming flows.
5. Verify lint, typecheck, and tests before starting follow-on P1 work.

Rollback is straightforward because the phase does not introduce external services or schema migrations. If needed, revert the streaming refactor, drop the new persistence key(s), and fall back to the current in-memory behavior.

## Open Questions

- None blocking for planning. This phase assumes bounded local history retention (for example, the most recent ~100 messages) unless implementation reveals a stronger product constraint.
