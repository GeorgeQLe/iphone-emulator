# Spec Drift Report

Date: 2026-05-01
Mode: fix all
Canonical spec: `specs/open-source-iphone-emulator.md`
Archived snapshots:

- `docs/history/archive/2026-05-01/131848/specs/open-source-iphone-emulator.md`
- `docs/history/archive/2026-05-01/131848/specs/drift-report.md`

## Summary

- Errors: 0
- Warnings resolved by spec clarification: 3
- Info findings resolved by baseline coverage: 1
- Verified claims sampled: 14

No code changes were made. The fix updates the canonical spec to reflect the Phase 11 local live transport implementation while preserving the distinction between local in-memory transport and deferred production WebSocket/MCP service work.

## Resolved Warnings

### Current implementation baseline omitted live local transport

Spec quote: "As of the April 30, 2026 drift audit, the repository implements an early fixture-backed baseline rather than the complete v1 scope above."

Code evidence:

- `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift:1` defines request, response, and event transport envelopes.
- `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeSessionCoordinator.swift:14` handles launch, command, inspect, and close requests.
- `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeInMemoryTransport.swift:1` implements the local in-memory transport connection.
- `packages/automation-sdk/src/types.ts:79` defines `RuntimeTransportLaunchOptions`.
- `packages/automation-sdk/src/index.ts:124` routes transport launch options through `TransportEmulatorApp`.

Resolution: Updated the current baseline to say the repo now has fixture-backed mode plus a deterministic local live transport path.

### Spec treated all JSON-RPC/WebSocket transport as unimplemented

Spec quote: "A real JSON-RPC/WebSocket transport or MCP server."

Code evidence:

- `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift:7` defines launch, command, inspect-session, and close requests.
- `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift:68` defines session-opened, semantic-tree, logs, artifact, close, and diagnostic events.
- `packages/automation-sdk/src/transport.ts:85` implements `RuntimeTransportClient`.
- `packages/automation-sdk/src/transport.ts:102` launches through the transport client.

Resolution: Clarified that the working transport uses JSON-RPC/WebSocket-shaped envelopes locally and in memory, while production WebSocket service and MCP server remain unimplemented.

### TypeScript public API sketch imported a non-existent package name

Spec quote: `import { Emulator } from "@iphone-emulator/sdk";`

Code evidence:

- `packages/automation-sdk/package.json:2` names the package `@iphone-emulator/automation-sdk`.
- `packages/automation-sdk/src/index.ts:106` exports `RuntimeTransportClient`, transport errors, and local transport helpers.
- `packages/automation-sdk/src/index.ts:124` exports `Emulator`.

Resolution: Updated the example import to `@iphone-emulator/automation-sdk` and added a transport-mode example.

## Resolved Info

### Browser renderer live adapter was undocumented in the spec baseline

Spec quote: "Renderer: browser UI that draws an iPhone-like shell and renders the harness UI tree."

Code evidence:

- `packages/browser-renderer/src/liveSession.ts:29` defines `RuntimeLiveSessionAdapter`.
- `packages/browser-renderer/src/liveSession.ts:42` applies live semantic snapshots.
- `packages/browser-renderer/src/liveSession.ts:46` reports stale revisions without replacing the current tree.
- `packages/browser-renderer/src/liveSession.ts:59` records live renderer mode and session metadata.

Resolution: Added current baseline language for the renderer live-session adapter and its demo/live separation.

## Verified Claims

- Root Swift package exposes `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore`: `Package.swift:11`, `Package.swift:15`, `Package.swift:19`.
- Strict-mode primitives include text, button, text field, list, stack layouts, navigation stack, modal, tab view, and alert: `packages/swift-sdk/Sources/StrictModeSDK/View.swift:42`, `packages/swift-sdk/Sources/StrictModeSDK/View.swift:56`, `packages/swift-sdk/Sources/StrictModeSDK/View.swift:70`, `packages/swift-sdk/Sources/StrictModeSDK/View.swift:86`, `packages/swift-sdk/Sources/StrictModeSDK/View.swift:104`, `packages/swift-sdk/Sources/StrictModeSDK/View.swift:122`, `packages/swift-sdk/Sources/StrictModeSDK/View.swift:140`, `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:7`, `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:34`, `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:61`.
- Runtime transport diagnostics include connection failure, timeout, unsupported command, protocol violation, and stale revision: `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift:102`.
- TypeScript transport diagnostics use the same code vocabulary: `packages/automation-sdk/src/transport.ts:19`.
- Screenshot support remains metadata-oriented: `packages/automation-sdk/src/types.ts:156`, `packages/automation-sdk/src/transport.ts:370`.

## Remaining Work

The unresolved items are product work, not spec contradictions:

- Compile arbitrary Swift source packages into runnable harness sessions from the TypeScript SDK.
- Add a production WebSocket runtime service and MCP server.
- Add browser/Wasm runtime target when runtime boundaries are stable.
- Add image view, swipe/scroll automation, state/bindings, environment values, storage APIs, and real screenshot bytes.
- Integrate source analysis so native capability manifests can be derived automatically from arbitrary packages.

## Downstream Impact

`README.md` had one stale current-limitation line that still described the renderer as fixture-only; it was updated to mention the live-session adapter. `docs/live-runtime-transport.md` and `tasks/roadmap.md` already describe the local live transport as implemented and production hosted/WebSocket service as deferred. No `$reconcile-research` follow-up is required from this drift fix.
