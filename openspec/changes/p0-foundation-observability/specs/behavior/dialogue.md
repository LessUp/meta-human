## ADDED Requirements

### Requirement: Streamed dialogue yields visible reply text incrementally
The system SHALL emit `token` events from the streaming dialogue path as soon as user-visible reply text becomes available, without waiting for the entire response to complete.

#### Scenario: Reply text arrives progressively
- **WHEN** a user sends a message through the streaming dialogue flow
- **THEN** the client receives one or more `token` events before the final `done` event is emitted

#### Scenario: Final metadata remains authoritative
- **WHEN** the streaming dialogue flow completes successfully
- **THEN** the final `done` event includes the authoritative `replyText`, `emotion`, and `action` fields used to finalize the turn

### Requirement: Dialogue turn lifecycle remains cancellation-safe
The system SHALL preserve cancellation, fallback, and turn-finalization semantics while streaming incrementally.

#### Scenario: User aborts an in-flight stream
- **WHEN** the current dialogue turn is cancelled before completion
- **THEN** the streaming request stops emitting additional tokens and the turn is finalized without leaving the client in a permanently loading state

#### Scenario: Streaming path fails mid-turn
- **WHEN** the streaming backend encounters an error after the turn has started
- **THEN** the system surfaces an error state and still completes the turn using the existing graceful-degradation path

### Requirement: Token timing reflects real stream progress
The system SHALL treat first-token timing as the first successfully surfaced reply token from the streaming path.

#### Scenario: First token metric is recorded from stream output
- **WHEN** the first visible reply token is surfaced to the client
- **THEN** the first-token performance trace is recorded at that point and not after the final response completes
