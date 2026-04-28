## 1. OpenSpec alignment

- [ ] 1.1 Review the P0 proposal, design, and spec deltas against the current dialogue, store, and HUD implementation
- [ ] 1.2 Confirm the implementation scope stays limited to streaming, persistence, and runtime observability

## 2. Backend streaming reliability

- [ ] 2.1 Refactor `server/app/services/dialogue.py` so `/v1/chat/stream` emits visible reply tokens incrementally
- [ ] 2.2 Preserve final `done` payload semantics for `replyText`, `emotion`, and `action`
- [ ] 2.3 Add or update backend tests covering incremental tokens, cancellation, and fallback behavior

## 3. Frontend streaming lifecycle

- [ ] 3.1 Update frontend stream consumption so first-token timing reflects actual streamed output
- [ ] 3.2 Preserve assistant placeholder lifecycle, loading cleanup, and abort behavior during streaming failures
- [ ] 3.3 Add or update frontend tests for streamed token handling and turn finalization

## 4. Session history persistence

- [ ] 4.1 Extend `src/store/chatSessionStore.ts` to persist bounded chat history alongside the session identifier
- [ ] 4.2 Clear persisted history deterministically when a new session starts
- [ ] 4.3 Add store tests covering refresh restore, malformed storage, and reset behavior

## 5. Runtime observability surfacing

- [ ] 5.1 Extend `src/store/systemStore.ts` and related hooks with the required diagnostics while preserving selector-friendly updates
- [ ] 5.2 Surface high-signal metrics in existing status UI such as `TopHUD.tsx`
- [ ] 5.3 Add tests for runtime metrics and status rendering behavior

## 6. Verification

- [ ] 6.1 Run lint, typecheck, and relevant tests for dialogue, stores, and status UI
- [ ] 6.2 Update any directly affected docs or spec references revealed during implementation
