## ADDED Requirements

### Requirement: Runtime health is surfaced through existing app state
The system SHALL expose connection status, active transport mode, chat latency, render metrics, and model-load metrics through the runtime observability state.

#### Scenario: Connection check updates runtime state
- **WHEN** the application probes backend health or reconnects explicitly
- **THEN** the runtime observability state reflects the latest connection status and resolved transport mode

#### Scenario: Render and model metrics are available to the UI
- **WHEN** render performance or model loading metrics are recorded
- **THEN** those metrics are available to existing UI surfaces without requiring a separate telemetry subsystem

### Requirement: High-signal diagnostics are visible in status surfaces
The system SHALL surface compact runtime diagnostics in existing UI status surfaces so operators can inspect the current session without opening developer tools.

#### Scenario: A completed chat turn exposes latency information
- **WHEN** a streamed or non-streamed dialogue turn finishes
- **THEN** the status surface can display first-token and full-response timing if those values were recorded

#### Scenario: Runtime metrics are missing
- **WHEN** diagnostics have not yet been collected for the current session
- **THEN** the status surface renders gracefully without showing misleading values

### Requirement: Errors are observable without becoming fatal
The system SHALL preserve graceful degradation while making transport and runtime failures observable to the user and application state.

#### Scenario: Backend becomes unavailable
- **WHEN** connection health checks fail
- **THEN** the runtime observability state transitions to a degraded status and the user receives a non-fatal signal that some functionality is limited
