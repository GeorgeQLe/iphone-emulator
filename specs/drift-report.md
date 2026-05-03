# Spec Drift Report

Date: 2026-05-03
Mode: fix
Canonical specs:

- `specs/open-source-iphone-emulator.md`
- `specs/transport-native-capability-parity.md`

Archived snapshots:

- `docs/history/archive/2026-05-03/193500/specs/open-source-iphone-emulator.md`
- `docs/history/archive/2026-05-03/193500/specs/transport-native-capability-parity.md`
- `docs/history/archive/2026-05-03/193500/specs/drift-report.md`

## Summary

- Errors: 0
- Warnings resolved by spec clarification: 2
- Info findings: 0
- Verified claims sampled: 18

No code changes were made. The fix updates the specs and report to reflect the Phase 12 transport native parity implementation shipped on 2026-05-03.

## Resolved Warnings

### Transport native parity spec still described native mutations as unimplemented

Spec quote: "The TypeScript transport app currently exposes native inspection surfaces, but mutation methods such as permission requests, camera capture, location updates, clipboard writes, file selection, share completion, and notification scheduling still fail with `runtime transport native command is not implemented yet`."

Code evidence:

- `packages/automation-sdk/src/index.ts:216` builds the transport `app.native.*` namespace.
- `packages/automation-sdk/src/index.ts:220` routes permission requests through native automation actions.
- `packages/automation-sdk/src/index.ts:225` routes camera capture through native automation actions.
- `packages/automation-sdk/src/index.ts:245` routes clipboard read/write through native automation actions.
- `packages/automation-sdk/src/index.ts:254` routes file selection through native automation actions.
- `packages/automation-sdk/src/index.ts:261` routes share-sheet completion through native automation actions.
- `packages/automation-sdk/src/index.ts:269` routes notification authorization/schedule/deliver through native automation actions.
- `packages/automation-sdk/src/transport.test.ts:205` verifies representative fixture-vs-transport native parity.

Resolution: Updated `specs/transport-native-capability-parity.md` and the current implementation baseline in `specs/open-source-iphone-emulator.md` to state that transport native parity is implemented for the current public `app.native.*` surface.

### Transport native parity spec overstated native mutation log parity

Spec quote: "Ensure native actions update the same surfaces in both modes: session native state, native events, native artifact records, logs, and semantic metadata."

Code evidence:

- `packages/automation-sdk/src/transport.ts:1277` appends native capability events for transport native records.
- `packages/automation-sdk/src/transport.ts:1278` appends native artifact records for transport native records.
- `packages/automation-sdk/src/transport.ts:1279` increments the retained semantic snapshot revision for successful native records.
- `packages/automation-sdk/src/transport.test.ts:278` verifies transport logs remain runtime logs after the native parity flow.
- `packages/automation-sdk/src/index.test.ts:1847` verifies native behavior through native event records.
- `packages/automation-sdk/src/index.test.ts:1863` verifies native behavior through native artifact records.

Resolution: Clarified `specs/transport-native-capability-parity.md` so native event/artifact records and retained session state are the canonical TypeScript parity surfaces. Session logs remain runtime logs and are not used as transport-only native mutation records.

## Verified Claims

- Transport launch remains available through `RuntimeTransportLaunchOptions`: `packages/automation-sdk/src/types.ts:68`.
- `RuntimeTransportLike` exposes a generic native automation command boundary: `packages/automation-sdk/src/types.ts:105`.
- Read-only current location inspection is outside the generic native action taxonomy: `packages/automation-sdk/src/types.ts:110`, `packages/automation-sdk/src/index.ts:233`.
- The TypeScript native action taxonomy matches the Swift mutation/event cases and excludes `currentLocation`: `packages/automation-sdk/src/types.ts:461`.
- Transport native actions carry expected semantic revision through `RuntimeTransportClient.nativeAutomation`: `packages/automation-sdk/src/transport.ts:192`.
- Stale native commands return `staleRevision` with `expectedRevision` and `currentRevision`: `packages/automation-sdk/src/transport.ts:578`.
- Supported native action parsing rejects unknown native actions fail-closed: `packages/automation-sdk/src/transport.ts:792`.
- Successful native records update retained events, artifact records, and semantic revision: `packages/automation-sdk/src/transport.ts:1277`.
- Missing native fixtures preserve deterministic diagnostic records and reject through the public SDK namespace: `packages/automation-sdk/src/index.ts:347`, `packages/automation-sdk/src/transport.test.ts:326`.
- Fixture-vs-transport parity coverage exercises permissions, camera/photos, location, clipboard, files, share sheet, notifications, device snapshot, native events, native artifacts, logs, and clone isolation: `packages/automation-sdk/src/transport.test.ts:205`.
- Transport-mode namespace coverage asserts every supported public native method and unsupported namespace absence: `packages/automation-sdk/src/index.test.ts:116`.
- End-to-end transport SDK coverage verifies native session state, events, artifacts, and unsupported controls: `packages/automation-sdk/src/index.test.ts:1767`.
- Live transport docs state deterministic local native parity and explicitly exclude host native services, production WebSocket, hosted sessions, and MCP: `docs/live-runtime-transport.md:19`.
- Native capability docs state fixture and local transport mode expose the same current `app.native.*` controls without host native access: `docs/native-capabilities.md:5`.

## Remaining Work

The unresolved items are product work, not spec contradictions:

- Compile arbitrary Swift source packages into runnable harness sessions from the TypeScript SDK.
- Add a production WebSocket runtime service and MCP server.
- Add browser/Wasm runtime target when runtime boundaries are stable.
- Add image view, swipe/scroll automation, state/bindings, environment values, storage APIs, and real screenshot bytes.
- Integrate source analysis so native capability manifests can be derived automatically from arbitrary packages.
- Consider extracting shared TypeScript native parity helpers if future native action additions make the local transport test double too duplicative.

## Downstream Impact

`tasks/todo.md` should remove the completed R1 drift-refresh item. No `$reconcile-research` follow-up is required because the update is limited to implementation baseline and parity contract wording; research documents already describe the devtool project context rather than exact Phase 12 code shape.
