# Strict Mode Baseline Example

This example shows the current Phase 3 strict-mode fixture path from Swift declarations to semantic snapshots, deterministic browser preview, and the in-memory automation SDK.

## Files In This Example

- `BaselineExampleApp.swift` shows the intended strict-mode declaration shape for an app and a small catalog of currently supported primitives.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeAppLoader.swift` is the runtime entry point that lowers a fixture closure into a `RuntimeTreeSnapshot`.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeTreeSnapshot.swift` defines the retained snapshot shape the runtime bridge and future automation layers will inspect.
- `../../packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift` applies deterministic fixture-backed automation commands over the retained snapshot.
- `../../packages/browser-renderer/src/fixtureTree.ts` is the checked-in semantic tree fixture currently rendered in the browser.
- `../../packages/browser-renderer/src/main.ts` mounts that fixture into the deterministic iPhone-like browser shell.
- `automation-example.ts` demonstrates the current `@iphone-emulator/automation-sdk` surface against the same strict baseline fixture.

## Current Flow

1. A strict-mode app is declared against `StrictModeSDK`, as shown in `BaselineExampleApp.swift`.
2. The runtime host accepts fixture lowering closures through `RuntimeAppLoader.loadFixture(...)` and stores the result as a `RuntimeTreeSnapshot`.
3. The runtime automation coordinator and `@iphone-emulator/automation-sdk` reuse that same semantic contract to launch an in-memory fixture session, query elements by text/role/test ID, and apply deterministic `tap` and `fill` updates.
4. The browser renderer currently previews a checked-in `SemanticUITree` fixture that mirrors the same contract shape used by the runtime host.
5. The renderer mounts that fixture into an inspectable browser surface with stable semantic roles, identifiers, and state metadata.

## Automation Walkthrough

The checked-in automation sample shows the current intended user flow:

```ts
import { Emulator } from "@iphone-emulator/automation-sdk";

const app = await Emulator.launch({
  appIdentifier: "FixtureApp",
  fixtureName: "strict-mode-baseline",
});

await app.getByText("Save").tap();
await app.getByRole("textField", { text: "Name" }).fill("Jordan");

const field = await app.getByTestId("name-field").inspect();
const tree = await app.semanticTree();
const logs = await app.logs();

console.log(field.value);
console.log(tree.scene.alertPayload?.title);
console.log(logs.map((entry) => entry.message));

await app.close();
```

What this flow currently guarantees:

- `Emulator.launch(...)` opens a deterministic in-memory session for the `strict-mode-baseline` fixture.
- `getByText`, `getByRole`, and `getByTestId` resolve against stable semantic labels, roles, values, and identifiers from the retained tree.
- `tap()` mutates the button interaction state deterministically and updates the alert payload to `Done`.
- `fill()` updates the target text field value and records a log entry.
- `semanticTree()`, `inspect()`, `logs()`, and `screenshot()` expose the same fixture-backed session state without requiring a transport layer.

This example is intentionally limited:

- It demonstrates the declaration, snapshot, and in-memory automation contract, not a live Swift-to-browser execution pipeline.
- It does not claim SwiftUI or UIKit compatibility.
- It stays within the project-owned strict-mode, semantic tree, and fixture automation contracts exported today.

## Local Validation

Run the current renderer and runtime checks with:

```sh
swift test
swift build
npm --prefix packages/browser-renderer run typecheck
npm --prefix packages/browser-renderer test
npm --prefix packages/browser-renderer run build
npm --prefix packages/automation-sdk run typecheck
npm --prefix packages/automation-sdk test
npm --prefix packages/automation-sdk run build
```

## Current Limitations

- The renderer fixture is checked in under `packages/browser-renderer/src/fixtureTree.ts`; it is not yet generated directly from `BaselineExampleApp.swift`.
- There is no live runtime session, transport layer, or browser-side state sync in this phase.
- The automation SDK runs entirely in memory against a deterministic fixture; it does not yet connect to a live Swift runtime or browser session.
- Screenshot support is limited to placeholder metadata rather than real image capture.
