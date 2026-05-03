# Transport Native Capability Parity

## Overview

Transport-backed automation must support the same deterministic native capability surface as the current in-memory `app.native.*` automation namespace. The goal is parity, not new native fidelity: a flow that uses native mocks in fixture mode should behave the same when launched through the local runtime transport path.

This keeps the harness honest about its boundary. Native capabilities remain deterministic records, fixture outputs, semantic metadata, logs, and artifacts. They do not access host camera, files, clipboard, notifications, sensors, haptics, permissions, iOS frameworks, or real device state.

The existing Swift runtime already models native automation as `RuntimeAutomationCommand.nativeAutomation(RuntimeNativeAutomationAction)`. The TypeScript transport app currently exposes native inspection surfaces, but mutation methods such as permission requests, camera capture, location updates, clipboard writes, file selection, share completion, and notification scheduling still fail with `runtime transport native command is not implemented yet`. This spec closes that mode gap.

## Goals

- Make transport-backed `Emulator.launch({ mode: "transport", ... })` support the full current `app.native.*` API surface.
- Preserve method-for-method behavioral equivalence with in-memory fixture mode for existing native automation controls.
- Route TypeScript native commands through a generic native automation transport command that maps to Swift's existing `RuntimeNativeAutomationAction` model.
- Keep native mutations serialized through the current session command path and semantic revision gate.
- Ensure native actions update the same surfaces in both modes: session native state, native events, native artifact records, logs, and semantic metadata.
- Add direct fixture-vs-transport parity tests for representative native flows.
- Document the local transport parity boundary without implying production WebSocket, hosted session, MCP, or host native service support.

## Non-Goals

- Adding new native capability categories beyond the current `app.native.*` surface.
- Implementing real iOS, UIKit, SwiftUI runtime, WebKit, CoreLocation, AVFoundation, Photos, notifications, file picker, share sheet, sensors, haptics, or host OS behavior.
- Implementing production WebSocket transport, hosted session scheduling, multi-tenant retention, or an MCP server.
- Adding durable persistence or a database for native records.
- Replacing the current deterministic manifest, event, artifact, and diagnostic model.
- Changing compatibility mode native diagnostics except where docs need to explain the transport parity boundary.

## Detailed Design

### Architecture

Transport native parity extends the existing local transport stack:

- `TransportEmulatorApp` keeps the ergonomic TypeScript `app.native.*` namespace.
- `RuntimeTransportLike` gains a generic native automation command method or equivalent command dispatch surface.
- `RuntimeTransportClient` serializes native action payloads through the same command path used for UI interactions.
- `createInMemoryRuntimeTransport` applies native actions to its retained session so transport-mode tests exercise the same behavior as in-memory mode.
- The Swift canonical model remains `RuntimeAutomationCommand.nativeAutomation(RuntimeNativeAutomationAction)`.

The public TypeScript API remains method-oriented. The transport boundary is action-oriented.

Example TypeScript usage remains unchanged:

```ts
await app.native.permissions.request("camera");
await app.native.camera.capture("front-camera-still");
await app.native.location.update({ latitude: 34.0522, longitude: -118.2437, accuracyMeters: 10 });
await app.native.clipboard.write("Copied profile");
await app.native.notifications.schedule("profile-reminder");
const events = await app.native.events();
const artifacts = await app.native.artifacts();
```

Internally, those calls should send typed native action payloads such as:

```ts
{
  kind: "nativeAutomation",
  action: {
    type: "writeClipboard",
    identifier: "automation",
    text: "Copied profile"
  }
}
```

The exact TypeScript discriminant names can follow existing local style, but the action set must map one-to-one to the current Swift `RuntimeNativeAutomationAction` cases.

### Native Action Surface

Transport mode must support the current native automation namespace:

| Namespace | Methods |
| --- | --- |
| `permissions` | `snapshot`, `request`, `set` |
| `camera` | `capture` |
| `photos` | `select` |
| `location` | `current`, `update` |
| `clipboard` | `read`, `write` |
| `files` | `select` |
| `shareSheet` | `complete` |
| `notifications` | `requestAuthorization`, `schedule`, `deliver` |
| `device` | `snapshot` |
| root native namespace | `events`, `artifacts` |

Read methods may inspect the retained session where appropriate. Mutation methods must route through the generic native automation command boundary so they participate in revision checks, event/log/artifact publication, and diagnostics consistently.

### Revision And Ordering

Native mutations must use the existing semantic revision gate rather than a separate native revision gate.

Reasoning:

- Native actions can update semantic metadata on the UI tree root.
- Native actions append logs and artifact records.
- The Swift automation coordinator already increments snapshot revision when native actions are applied.
- A single revision model is easier for live renderer ordering and stale-command diagnostics.

If a native mutation arrives with a stale expected revision, transport mode must return the existing `staleRevision` diagnostic shape.

### Session State And Artifacts

After a successful native mutation, transport-backed sessions must expose the same observable effects as fixture mode:

- `session().nativeCapabilityState`
- `session().nativeCapabilityEvents`
- `nativeCapabilityEvents()`
- `native.events()`
- `native.artifacts()`
- `artifacts().nativeCapabilityRecords`
- `logs()`
- semantic tree root metadata

Returned objects must be cloned or otherwise protected from caller mutation, matching fixture-mode behavior.

### Diagnostics

Transport native parity must preserve fail-closed behavior:

- Unknown native action type returns `unsupportedCommand` or `protocolViolation`, depending on whether the envelope is recognized.
- Missing session, closed session, malformed payload, wrong node/session target, or invalid lifecycle returns `protocolViolation`.
- Stale revision returns `staleRevision`.
- Missing configured native fixtures must produce deterministic native diagnostics and records, not host fallback behavior.
- Unsupported capabilities such as biometrics, health, speech, sensors, and haptics remain absent from the public native namespace unless a later spec defines full deterministic contracts.

### Documentation Updates

Implementation should update `docs/live-runtime-transport.md` and `docs/native-capabilities.md` only as needed to state:

- transport mode now supports parity for the current deterministic `app.native.*` controls;
- parity is local transport parity, not production WebSocket or hosted service support;
- native controls still mutate deterministic records and do not call host native services.

The new spec remains the canonical planning artifact for this work.

## Data Model

No durable data migration is required.

The feature uses existing session-local data:

- `RuntimeNativeCapabilityManifest`
- `RuntimeNativeCapabilityState`
- `RuntimeNativeCapabilityEventRecord`
- `RuntimeNativeCapabilityArtifactOutput`
- `RuntimeArtifactBundle.nativeCapabilityRecords`
- `RuntimeAutomationLogEntry`
- semantic tree metadata

TypeScript transport action payloads must be JSON-compatible and must preserve string-map payload conventions where they cross existing native manifest or artifact boundaries.

## API And Contract Surface

### TypeScript SDK

`TransportEmulatorApp.createNativeAutomationNamespace()` must stop throwing `runtime transport native command is not implemented yet` for supported native methods.

`RuntimeTransportLike` should expose one generic native action command method, or the existing command mechanism should be extended so `RuntimeTransportClient` can send native actions without adding one transport method per native operation.

The ergonomic `app.native.*` method signatures should remain compatible with current fixture-mode signatures.

### Runtime Transport

The transport command should carry:

- `sessionID`
- expected semantic revision
- native action type
- action payload

The response should expose the same result concept as the Swift runtime: native capability events plus updated inspectable session state through subsequent `session()`, `artifacts()`, `logs()`, and `semanticTree()` calls.

### Swift Runtime

Swift remains the canonical action contract through `RuntimeNativeAutomationAction`.

Implementation may add mapping helpers or Codable adapters, but should avoid a parallel native command taxonomy that diverges from:

- `.requestPermission`
- `.setPermission`
- `.captureCamera`
- `.selectPhoto`
- `.updateLocation`
- `.readClipboard`
- `.writeClipboard`
- `.selectFiles`
- `.completeShareSheet`
- `.scheduleNotification`
- `.deliverNotification`
- `.snapshotDeviceEnvironment`

## Security And Privacy

Native transport parity must not access host native resources.

All native behavior must remain deterministic and session-local:

- no host permission prompts;
- no host camera or photo library access;
- no host clipboard read/write;
- no host file picker;
- no live local notifications;
- no host sensor or haptic usage;
- no live network calls unless a later explicit network boundary allows them.

Native payloads and artifacts should remain JSON-compatible fixture/test data. If future implementation introduces external transport processes, the same native payloads should be treated as test artifacts and scrubbed according to CI artifact policy, but that is outside this spec's implementation scope.

## Edge Cases

- A native mutation after `close()` returns a `protocolViolation` diagnostic.
- A native mutation with a stale semantic revision returns `staleRevision` and does not update native events, logs, artifacts, or semantic metadata.
- A permission request for a capability without a manifest requirement uses the same deterministic default behavior as fixture mode.
- A granted camera or photos permission without a configured fixture emits the existing missing-fixture diagnostic behavior.
- Location update while permission is denied mirrors fixture-mode diagnostics and state behavior.
- Clipboard read before any configured or written value returns the same empty/default result as fixture mode.
- File and share-sheet selection with missing fixture identifiers emits deterministic diagnostics rather than host UI.
- Notification schedule/deliver for unknown identifiers follows fixture-mode record creation behavior.
- Returned native events/artifacts/session snapshots are cloned so caller mutation cannot corrupt retained session state.
- Unsupported capability namespaces remain undefined rather than partially implemented.

## Test Plan

- Add transport-mode tests for every supported `app.native.*` method currently covered in fixture-mode tests.
- Add direct fixture-vs-transport parity tests for a representative native workflow covering:
  - permission request and set;
  - camera capture;
  - photo selection;
  - location current and update;
  - clipboard read and write;
  - file selection;
  - share-sheet completion;
  - notification authorization, schedule, and delivery;
  - device snapshot;
  - native events and artifact records.
- Assert parity on event names, key payload fields, artifact record names, permission snapshots, semantic metadata, and clone isolation.
- Add stale revision coverage for a native mutation through the generic transport command.
- Add post-close native command coverage.
- Add malformed or unsupported native action coverage.
- Keep Swift runtime contract tests for `RuntimeNativeAutomationAction` and `RuntimeAutomationCommand.nativeAutomation`.
- Run focused validation:

```sh
npm --prefix packages/automation-sdk test
swift test
```

- Run full workspace validation before shipping:

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

## Acceptance Criteria

- Transport-backed `app.native.*` supports the full current fixture-mode native API surface.
- No supported transport native method throws `runtime transport native command is not implemented yet`.
- Native mutation methods route through a generic native automation command boundary.
- Native mutations use the existing semantic revision gate.
- Fixture-vs-transport parity tests pass for representative native workflows.
- Native records, logs, artifacts, semantic metadata, and permission state match fixture-mode behavior for equivalent inputs.
- Unsupported native capabilities remain fail-closed and absent from the public namespace.
- Documentation clearly states that parity is deterministic local transport parity, not host native access or production WebSocket support.

## Open Questions

- What exact TypeScript discriminant naming should be used for native action payloads?
- Should parity helpers live in `transport.ts`, `index.ts`, or a shared native automation module to reduce duplication with fixture mode?
- Should the local in-memory transport test double reuse existing fixture-mode native helpers directly, or intentionally maintain a separate implementation to catch contract drift?

## Assumptions & Risks

- Confirmed: `[inferred]` This spec targets parity with current in-memory `app.native.*` behavior, not a broader native roadmap. Risk if wrong: implementation would under-scope new native capability work.
- Confirmed: `[inferred]` Full current API parity is the acceptance bar. Risk if wrong: a phased rollout might be preferable for schedule control.
- Confirmed: `[inferred]` Direct fixture-vs-transport parity tests are required. Risk if wrong: tests may be more coupled than desired, but they provide the strongest guard against mode divergence.
- Confirmed: `[inferred]` A generic native command boundary is preferred over one transport method per native action. Risk if wrong: debugging wire-level traffic may be less immediately readable.
- Confirmed: `[inferred]` Native mutations should use the semantic revision gate. Risk if wrong: native-only actions could be blocked by unrelated semantic updates, but one revision model keeps ordering and renderer state coherent.
- Confirmed: `[inferred]` Production WebSocket/service implementation is out of scope. Risk if wrong: users expecting remote transport would still not have an executable service boundary.
- Confirmed: `[inferred]` Docs updates should clarify parity and boundaries during implementation. Risk if wrong: stale docs could keep implying transport native mutations are unsupported.
- `[from codebase]` Swift native automation action contracts already exist. Risk if wrong: implementation may need a deeper Swift contract phase before TypeScript parity work.
- `[from codebase]` Transport mode currently has native read surfaces but incomplete mutation surfaces. Risk if wrong: the spec may duplicate work already completed elsewhere.
