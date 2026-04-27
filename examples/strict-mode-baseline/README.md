# Strict Mode Baseline Example

This example shows the current Phase 2 strict-mode fixture path from Swift declarations to the semantic renderer preview.

## Files In This Example

- `BaselineExampleApp.swift` shows the intended strict-mode declaration shape for an app and a small catalog of currently supported primitives.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeAppLoader.swift` is the runtime entry point that lowers a fixture closure into a `RuntimeTreeSnapshot`.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeTreeSnapshot.swift` defines the retained snapshot shape the runtime bridge and future automation layers will inspect.
- `../../packages/browser-renderer/src/fixtureTree.ts` is the checked-in semantic tree fixture currently rendered in the browser.
- `../../packages/browser-renderer/src/main.ts` mounts that fixture into the deterministic iPhone-like browser shell.

## Current Flow

1. A strict-mode app is declared against `StrictModeSDK`, as shown in `BaselineExampleApp.swift`.
2. The runtime host accepts fixture lowering closures through `RuntimeAppLoader.loadFixture(...)` and stores the result as a `RuntimeTreeSnapshot`.
3. The browser renderer currently previews a checked-in `SemanticUITree` fixture that mirrors the same contract shape used by the runtime host.
4. The renderer mounts that fixture into an inspectable browser surface with stable semantic roles, identifiers, and state metadata.

This example is intentionally limited:

- It demonstrates the declaration and fixture contract, not a live Swift-to-browser execution pipeline.
- It does not claim SwiftUI or UIKit compatibility.
- It stays within the project-owned strict-mode and semantic tree contracts exported today.

## Local Validation

Run the current renderer and runtime checks with:

```sh
swift test
npm --prefix packages/browser-renderer run typecheck
npm --prefix packages/browser-renderer test
npm --prefix packages/browser-renderer run build
```

## Current Limitations

- The renderer fixture is checked in under `packages/browser-renderer/src/fixtureTree.ts`; it is not yet generated directly from `BaselineExampleApp.swift`.
- There is no live runtime session, transport layer, or browser-side state sync in this phase.
- Automation hooks, screenshots, and interactive runtime updates are planned for later milestones.
