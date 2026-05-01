# Live Runtime Transport

This guide documents the current local live runtime-to-renderer transport path. It is a deterministic development contract between the Swift runtime host, the browser renderer live-session adapter, and the TypeScript automation SDK.

The transport vocabulary uses JSON-RPC/WebSocket terminology because the public boundary is shaped as request, response, and event envelopes. The checked-in implementation is local and in memory today. It does not start a production WebSocket service, a hosted session cloud, a real iOS simulator, WebKit, UIKit, SwiftUI, or host native services.

## Modes

| Mode | Entry point | Purpose |
| --- | --- | --- |
| Fixture mode | `Emulator.launch({ fixtureName: "strict-mode-baseline" })` | Fast in-memory SDK tests and CI artifact checks with no transport client. |
| Live local transport mode | `Emulator.launch({ mode: "transport", transport })` | Exercises the same high-level SDK concepts through an explicit transport client. |
| Renderer demo mode | `mountRenderer(..., { mode: "demo" })` | Browser-only illustrative source lowering and preview cards. |
| Renderer live mode | `createRuntimeLiveSession(...)` / `RuntimeLiveSessionAdapter` | Applies semantic snapshots and diagnostics from a live session stream. |
| Hosted/session-cloud mode | Deferred | Not implemented. Documentation should not imply remote scheduling, multi-tenant retention, or production WebSocket availability. |

Fixture mode and live local transport mode intentionally share semantic tree, locator, artifact, network, device, and native capability concepts. They differ in where commands travel: fixture mode calls the in-memory SDK app directly, while transport mode routes launch, inspect, interaction, artifact, network, native-device, and close operations through `RuntimeTransportClient`.

## Transport Contract

The Swift runtime contract is defined in `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift`.

Transport envelopes are:

- `request`: launch, command, inspect session, or close.
- `response`: launched, command completed, inspected, closed, or failed.
- `event`: session opened, semantic tree updated, logs updated, artifact bundle updated, session closed, or diagnostic.

The TypeScript SDK transport surface is defined in `packages/automation-sdk/src/transport.ts`.

The current method vocabulary includes:

| Method | Result |
| --- | --- |
| `launch` | Opens one deterministic runtime session and returns a session descriptor/session state. |
| `inspectSession` / `session` | Returns retained session metadata, current semantic snapshot, device settings, artifacts, logs, and native capability state. |
| `locator.inspect` | Resolves a semantic query and returns a matching node. |
| `locator.tap` / `locator.fill` | Applies serialized interaction commands and increments the semantic revision when state changes. |
| `semanticTree` | Returns the current semantic UI tree. |
| `screenshot` | Records deterministic screenshot metadata, not pixels. |
| `logs` | Returns runtime log entries retained for the session. |
| `artifacts` | Returns render metadata, semantic snapshots, logs, network request records, and native capability records. |
| `network.route` / `network.request` | Installs and inspects deterministic route fixtures and HAR-like request records. |
| `native.device.snapshot` | Returns launch-time device settings retained by the session. |
| `native.events` | Returns deterministic native capability records. |
| `close` | Closes the current session and rejects later commands with a structured diagnostic. |

The placeholder `createWebSocketRuntimeTransport({ url })` exists only to reserve the transport shape. It currently raises `RuntimeTransportConnectionError` rather than connecting to a service.

## Session Lifecycle

The local lifecycle is deliberately narrow:

1. `connect`
2. `launch`
3. zero or more serialized commands and inspection calls
4. semantic/log/artifact event publication
5. `close`
6. transport disconnect

Only one local in-memory session is coordinated at a time. The runtime coordinator rejects duplicate launch, missing-session command, missing-session inspection, and invalid close attempts with protocol diagnostics.

Commands are serialized through one coordinator per session. Each state-changing command carries an expected semantic revision on the Swift side. A command whose expected revision does not match the retained snapshot revision returns a `staleRevision` diagnostic instead of applying the change.

Renderer live mode follows the same ordering rule. `RuntimeLiveSessionAdapter.applySnapshot(...)` accepts increasing revisions, updates the preview in `live` mode, and reports stale snapshots as diagnostics without replacing the current tree.

## Diagnostics

Transport and live-renderer failures are structured records. They are product output, not incidental thrown strings.

| Code | Meaning | Typical payload fields |
| --- | --- | --- |
| `connectionFailure` | A transport cannot connect or is not connected. | `url`, `method` |
| `timeout` | A request exceeded the client timeout. | `method`, `sessionID` |
| `unsupportedCommand` | The command is outside the current local contract. | `command` |
| `protocolViolation` | The envelope, session, query target, lifecycle state, invalid close, or post-close command is invalid. | `sessionID`, `nodeID`, `envelope` |
| `staleRevision` | A command or snapshot arrived for an older semantic revision. | `currentRevision`, `expectedRevision`, `receivedRevision` |

The SDK maps diagnostics to typed errors:

- `RuntimeTransportConnectionError`
- `RuntimeTransportTimeoutError`
- `RuntimeTransportProtocolError`

The renderer maps live-session diagnostics to `RuntimeLiveSessionDiagnosticError` when `throwIfFailed()` is called. Diagnostics are also rendered into the preview container with `data-live-diagnostic-code` and a `.live-session-diagnostic` status element.

## Inspectable Records

A live local session keeps the same review surfaces as fixture mode:

- semantic snapshots through `semanticTree()` and `artifacts().semanticSnapshots`
- runtime logs through `logs()` and `artifacts().logs`
- screenshot/render metadata through `screenshot()` and `artifacts().renderArtifacts`
- route fixture request records through `request()` and `artifacts().networkRecords`
- launch device settings through `session()` and `app.native.device.snapshot()`
- native capability records through `session()`, `app.native.events()`, and `artifacts().nativeCapabilityRecords`

These records are deterministic JSON-compatible values. Screenshot entries remain metadata placeholders. Native capability entries remain mock records. Network records remain fixture records unless a later phase explicitly adds a live network boundary.

## Examples

Fixture-backed example:

```sh
npx tsx examples/strict-mode-baseline/automation-example.ts
```

Live local transport example:

```sh
npx tsx examples/strict-mode-baseline/live-transport-example.ts
```

The live example demonstrates launch, locator fill/tap, semantic inspection, screenshot metadata, logs, route fixtures, artifact inspection, device inspection, unsupported-command diagnostics, and clean close through `RuntimeTransportClient` and `createInMemoryRuntimeTransport`.

## Validation

Run the focused live transport checks with:

```sh
npm --prefix packages/automation-sdk test
npm --prefix packages/browser-renderer test
npx tsx examples/strict-mode-baseline/live-transport-example.ts
```

Run the full workspace validation before shipping runtime, renderer, SDK, or example changes:

```sh
swift test
swift build
npm --prefix packages/browser-renderer run typecheck
npm --prefix packages/browser-renderer test
npm --prefix packages/browser-renderer run build
npm --prefix packages/automation-sdk run typecheck
npm --prefix packages/automation-sdk test
npm --prefix packages/automation-sdk run build
npx tsx examples/strict-mode-baseline/automation-example.ts
npx tsx examples/strict-mode-baseline/live-transport-example.ts
```

Use `docs/ci-fixture-recipe.md` for fixture-first CI. Add the live transport example as an extra smoke step only when the job is meant to validate the local transport boundary as well as fixture behavior.

## Current Boundaries

- Local-only: no hosted session scheduler or remote runtime pool exists.
- Deterministic: commands, revisions, logs, artifacts, network fixtures, device settings, and native capability records are retained values.
- Fail-closed: unsupported commands, protocol mismatches, stale revisions, timeouts, connection failures, and post-close commands surface diagnostics.
- Renderer-separated: demo/source-lowering mode and live snapshot mode are separate paths.
- Open-source-only: the transport does not depend on Apple-proprietary simulator internals or native framework behavior.
