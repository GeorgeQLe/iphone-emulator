# Transport Native Capability Parity Interview

## Assumptions Manifest

### Source Context

- `[from codebase]` Project type is `devtool` with the `devtool` pack enabled in `.agents/project.json`.
- `[from spec]` The canonical product is an open-source iPhone-like Swift app harness for deterministic agent testing, not an iOS Simulator replacement.
- `[from research]` Devtool research frames the next adoption gate around live runtime transport and transport-backed automation while preserving deterministic fixture semantics.
- `[from codebase]` Existing docs already describe native capability mocks and local live runtime transport, but there is no dedicated implementation spec for "transport native capability parity."

### Implementation Goal

- `[inferred]` This spec should make buildable a parity layer where transport-backed automation supports the same native capability controls and inspection surfaces as fixture-backed/in-memory automation.
- `[from codebase]` Current native surfaces include permissions, camera, photos, location, clipboard, keyboard input, files, share sheets, notifications, device environment snapshots, native events, and native artifacts.
- `[inferred]` The primary success criterion is not adding new native fidelity; it is preventing behavior divergence between fixture mode and transport mode.

### Technical Foundation

- `[from codebase]` Stack is SwiftPM for runtime/diagnostics/SDK contracts and npm TypeScript packages for browser renderer and automation SDK.
- `[from codebase]` Transport vocabulary is JSON-RPC/WebSocket-shaped, but the working implementation is local and in memory.
- `[from codebase]` `createWebSocketRuntimeTransport({ url })` is currently a placeholder that fails rather than connecting.
- `[from codebase]` The TypeScript SDK already has transport-backed launch and a `TransportEmulatorApp`, but transport native command execution appears incomplete or partially delegated.

### Integration Risk

- `[from codebase]` This work touches shared contracts across `packages/runtime-host`, `packages/automation-sdk`, and possibly `packages/browser-renderer`.
- `[inferred]` The riskiest breakage is mode divergence: tests that pass in fixture mode but fail or produce different artifacts/events in transport mode.
- `[inferred]` The spec should explicitly avoid expanding native capability fidelity, because that would blur the project's deterministic mock boundary.

### Data Model

- `[from codebase]` Native state persists per session as manifest, permission state, native capability state, native events, and artifact bundle records.
- `[from codebase]` Native capability records are deterministic JSON-compatible values with revisions.
- `[inferred]` No database or durable server-side storage is required for this feature; persistence remains session-local and artifact/export oriented.
- `[inferred]` Migration means contract alignment and tests, not schema migration.

### API And Contract Surface

- `[from codebase]` Existing SDK namespaces include `app.native.permissions`, `camera`, `photos`, `location`, `clipboard`, `files`, `shareSheet`, `notifications`, `device`, `events`, and `artifacts`.
- `[from codebase]` Transport methods currently include `native.device.snapshot` and `native.events`.
- `[inferred]` The missing contract is likely a transport command family for native mutations such as permission request/set, camera capture, photo select, location update/current, clipboard read/write, file select, share completion, and notification schedule/deliver.
- `[inferred]` Swift transport envelopes should preserve the current fail-closed diagnostic style for unsupported or malformed native commands.

### Operational Requirements

- `[from spec]` Native capabilities must not use host camera, host permissions, host clipboard, host files, real notifications, sensors, haptics, or live native framework behavior.
- `[from codebase]` Transport/session errors should be structured diagnostics such as protocol violation, stale revision, unsupported command, timeout, or connection failure.
- `[inferred]` Native commands should be serialized through the same session coordinator/revision model as UI commands.
- `[inferred]` Observability should come from logs, native capability records, semantic metadata, and artifact bundles rather than screenshots or live device state.
- `[inferred]` Test coverage should compare fixture mode and transport mode for equivalent native behavior.

### User Review

User confirmed the manifest with: "ok proceed".

High-signal correction: none.

## Questions Asked

### Question 1: Parity Scope

Asked:

> First decision: how strict should parity be for this spec?

Options presented:

- Full current API parity, recommended: every current in-memory `app.native.*` method works in transport mode.
- Mutation-only parity: implement only the methods currently throwing in transport mode.
- Capability-by-capability rollout: ship permissions/clipboard/location first, then camera/photos/files/share/notifications.

Recommendation:

Define parity as method-for-method behavioral equivalence for the existing `app.native.*` namespace across fixture mode and transport mode, backed by shared tests.

User response:

> yes continue

Chosen direction:

Full current API parity, with direct fixture-vs-transport parity tests as the acceptance bar.

### Question 2: Transport Command Shape

Asked:

> Next decision: should transport native commands be modeled as one generic transport method or many named methods?

Options presented:

- Generic `native.command` / `nativeAutomation` transport action, recommended.
- Separate transport methods per action.
- Both ergonomic named methods plus generic fallback.

Recommendation:

Use one generic command boundary in the transport protocol, with typed action payloads that map to Swift's existing `RuntimeAutomationCommand.nativeAutomation(RuntimeNativeAutomationAction)`.

User response:

> I agree with your recommendation

Chosen direction:

Use a generic native command boundary and keep it on the existing semantic revision gate.

### Question 3: WebSocket And Service Scope

Asked:

> Next decision: how far should this spec go on actual WebSocket/native command delivery?

Recommendation:

Keep this spec focused on transport-backed parity through the existing local transport client and in-memory transport test double, while defining the wire-shaped contract so a future WebSocket transport can implement it later. Keep production WebSocket server, hosted sessions, remote scheduling, and MCP server out of scope.

User response:

> I agree with your recommendation

Chosen direction:

Real WebSocket/service implementation remains out of scope. Docs updates should clarify the new parity boundary where needed.

### Coverage Checkpoint

Presented:

- Goal: full current API parity for transport-backed `app.native.*`, matching existing in-memory behavior.
- Scope boundary: parity only, not broader native fidelity or new native services.
- Transport contract: generic native automation command mapped to Swift's existing native action model.
- Revision model: existing semantic revision gate.
- Testing: direct fixture-vs-transport parity tests.
- WebSocket/server: production WebSocket, hosted sessions, remote scheduling, and MCP server out of scope.
- Docs: update transport/native docs only where needed to clarify parity and boundaries.

User response:

> all looks reasonable to me

## Significant Deviations From Initial Draft

There was no formal draft document for this specific feature. The initial prompt was "transport native capability parity."

Significant clarifications:

- "Parity" was narrowed to current in-memory `app.native.*` behavior, not broader native capability roadmap parity.
- Transport native work was scoped to local transport parity, not production WebSocket or service implementation.
- Generic native command dispatch was selected to align with Swift's existing `RuntimeNativeAutomationAction` model.
- Direct fixture-vs-transport tests were made part of the acceptance bar to reduce mode divergence risk.

## Closing Summary

The completed spec makes transport native capability parity implementation-ready while preserving the project's deterministic mock boundary. The main implementation work should happen in the TypeScript automation SDK transport path and local transport test double, with Swift runtime contracts treated as the canonical native action model unless implementation discovers a concrete gap.
