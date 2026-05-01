# Spec Drift Report

Date: 2026-04-30
Mode: fix all
Canonical spec: `specs/open-source-iphone-emulator.md`
Archived snapshot: `docs/history/archive/2026-04-30/114510/specs/open-source-iphone-emulator.md`

## Summary

- Errors: 0
- Warnings resolved by spec clarification: 7
- Info findings resolved by added baseline coverage: 2
- Verified claims sampled: 12

No code changes were made. The fix updates the canonical spec to distinguish full v1 intent from the current fixture-backed baseline.

## Resolved Warnings

### Complete v1 scope was written as current capability

Spec quote: "UI primitives: text, image, button, text field, list, stack layouts, navigation stack, modal sheet, tab view, alerts."

Code evidence:

- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:42` implements `Text`.
- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:56` implements `Button`.
- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:70` implements `TextField`.
- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:86` implements `List`.
- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:104` implements `VStack`.
- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:122` implements `HStack`.
- `packages/swift-sdk/Sources/StrictModeSDK/View.swift:140` implements `NavigationStack`.
- `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:7` implements `Modal`.
- `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:34` implements `TabView`.
- `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:61` implements `Alert`.

Resolution: Added a "Current Implementation Baseline" section that lists implemented primitives and explicitly calls out missing image support.

### Automation transport was presented as JSON-RPC/WebSocket plus MCP

Spec quote: "Automation Protocol: JSON-RPC over WebSocket, with a Playwright-flavored TypeScript SDK and MCP server."

Code evidence:

- `packages/automation-sdk/src/index.ts:101` implements an in-memory `Emulator.launch`.
- `packages/automation-sdk/src/index.ts:103` restricts launch to `strict-mode-baseline`.
- `packages/automation-sdk/src/types.ts:71` defines fixture-backed launch options.

Resolution: Added current baseline language that the TypeScript SDK is in-memory and fixture-backed, with JSON-RPC/WebSocket and MCP still not implemented.

### TypeScript public API sketch used unsupported launch fields

Spec quote: `projectPath: "./fixtures/TodoApp", mode: "strict"`

Code evidence:

- `packages/automation-sdk/src/types.ts:71` defines `RuntimeAutomationLaunchOptions`.
- `packages/automation-sdk/src/types.ts:72` requires `appIdentifier`.
- `packages/automation-sdk/src/types.ts:73` requires `fixtureName`.

Resolution: Updated TypeScript examples to use `appIdentifier`, `fixtureName`, and `nativeCapabilities`.

### Swift public API sketch used unsupported package and macro names

Spec quote: `import IPhoneHarness`, `@HarnessApp`, and `HarnessScene`

Code evidence:

- `Package.swift:11` exposes the `StrictModeSDK` library.
- `packages/swift-sdk/Sources/StrictModeSDK/App.swift:3` defines the current `App` protocol.
- `packages/swift-sdk/Sources/StrictModeSDK/Scene.swift:3` defines the current `Scene` protocol.

Resolution: Updated the Swift example to use `import StrictModeSDK`, `struct TodoApp: App`, and the current semantic-tree lowering pattern.

### Native manifest example did not match the runtime schema

Spec quote: `"requiredCapabilities": ["camera", "location", "notifications"]`

Code evidence:

- `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift:1` defines structured manifest fields.
- `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift:53` defines `RuntimeNativeCapabilityRequirement`.
- `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift:69` defines `RuntimeNativeCapabilityMock`.

Resolution: Replaced the manifest example with the current structured schema.

### Native capability taxonomy was broader than action support

Spec quote: "Sensors and haptics | Deterministic event records and logs before any visual or physical simulation."

Code evidence:

- `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift:39` includes `sensors`.
- `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift:40` includes `haptics`.
- `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift:73` defines native automation actions.
- `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift:87` omits sensors and haptics from current supported automation actions.

Resolution: Added baseline language that sensors and haptics exist in the manifest taxonomy but do not yet have first-class automation actions.

### Screenshots were implied to be real image captures

Spec quote: `await app.screenshot({ path: "todo.png" });`

Code evidence:

- `packages/automation-sdk/src/index.ts:203` creates screenshot metadata.
- `packages/automation-sdk/src/index.ts:207` sets `byteCount: 0`.

Resolution: Added explicit "not yet implemented" language for real screenshot bytes.

## Verified Claims

- Root Swift package exposes `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore`: `Package.swift:11`, `Package.swift:15`, `Package.swift:19`.
- Browser renderer draws an iPhone-like shell and semantic surface: `packages/browser-renderer/src/renderTree.ts:15`, `packages/browser-renderer/src/renderTree.ts:23`, `packages/browser-renderer/src/renderTree.ts:64`.
- Renderer supports modal and alert overlays from semantic state: `packages/browser-renderer/src/renderTree.ts:99`, `packages/browser-renderer/src/renderTree.ts:103`.
- Diagnostics report unsupported imports, symbols, modifiers, lifecycle hooks, and platform APIs: `packages/diagnostics/Sources/DiagnosticsCore/DiagnosticsTypes.swift:182`.
- Compatibility matrix has explicit supported, partial, unsupported, and deferred entries: `packages/diagnostics/Sources/DiagnosticsCore/DiagnosticsTypes.swift:171`.
- Runtime automation commands include tap, fill, type, wait, query, inspect, semantic snapshot, screenshot, logs, network request recording, and native automation: `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift:245`.

## Remaining Work

The unresolved items are product work, not spec contradictions:

- Compile arbitrary Swift source packages into runnable harness sessions from the TypeScript SDK.
- Add real JSON-RPC/WebSocket transport and MCP server.
- Add browser/Wasm runtime target when runtime boundaries are stable.
- Add image view, swipe/scroll automation, state/bindings, environment values, storage APIs, and real screenshot bytes.
- Integrate source analysis so native capability manifests can be derived automatically from arbitrary packages.

