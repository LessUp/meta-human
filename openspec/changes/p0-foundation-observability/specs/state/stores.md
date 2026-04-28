## ADDED Requirements

### Requirement: Chat session history persists across refreshes
The chat session store SHALL persist the active session history in local browser storage so the user can refresh the page without losing the current conversation.

#### Scenario: Refresh restores recent history
- **WHEN** a user refreshes the application during an active session
- **THEN** the previously stored session identifier and bounded recent chat history are restored into the chat session store

#### Scenario: New session clears persisted history
- **WHEN** the user explicitly starts a new session
- **THEN** the chat session store resets the active history in memory and replaces the persisted session history with an empty conversation

### Requirement: Persisted session state remains safe to load
The chat session store SHALL ignore or reset invalid persisted data without breaking application startup.

#### Scenario: Persisted payload is malformed
- **WHEN** the application loads and the persisted chat history cannot be parsed into valid message records
- **THEN** the store falls back to an empty chat history and continues startup without throwing a fatal error

### Requirement: Runtime telemetry state remains selector-friendly
The system store SHALL expose runtime observability state in focused slices that preserve the existing selector-based update pattern.

#### Scenario: Optional metrics are absent
- **WHEN** runtime diagnostics such as draw calls, model size, or first-token timing are not yet available
- **THEN** the system store keeps nullable values without forcing downstream consumers to render invalid placeholders
