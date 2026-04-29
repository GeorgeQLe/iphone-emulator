# Strict Mode Baseline Example

This example shows the current strict-mode fixture path from Swift declarations to semantic snapshots, deterministic browser preview metadata, and the in-memory automation SDK artifact workflow.

## Files In This Example

- `BaselineExampleApp.swift` shows the intended strict-mode declaration shape for an app and a small catalog of currently supported primitives.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeAppLoader.swift` is the runtime entry point that lowers a fixture closure into a `RuntimeTreeSnapshot`.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeTreeSnapshot.swift` defines the retained snapshot shape the runtime bridge and future automation layers will inspect.
- `../../packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift` applies deterministic fixture-backed automation commands over the retained snapshot.
- `../../packages/runtime-host/Sources/RuntimeHost/Artifacts/RuntimeArtifactTypes.swift` defines screenshot/render metadata, semantic snapshot artifacts, log bundle entries, and network request records.
- `../../packages/runtime-host/Sources/RuntimeHost/Network/RuntimeNetworkFixture.swift` defines deterministic network fixture and request/response record shapes.
- `../../packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift` defines deterministic native capability manifest shapes for fixture-backed native requests.
- `../../docs/native-capabilities.md` documents the capability taxonomy, manifest fields, diagnostics guidance, and mock-fidelity boundary.
- `../../packages/browser-renderer/src/fixtureTree.ts` is the checked-in semantic tree fixture currently rendered in the browser.
- `../../packages/browser-renderer/src/main.ts` mounts that fixture into the deterministic iPhone-like browser shell.
- `../../packages/browser-renderer/src/renderArtifacts.ts` derives deterministic DOM render metadata for renderer captures.
- `automation-example.ts` demonstrates the current `@iphone-emulator/automation-sdk` surface against the same strict baseline fixture.

## Current Flow

1. A strict-mode app is declared against `StrictModeSDK`, as shown in `BaselineExampleApp.swift`.
2. The runtime host accepts fixture lowering closures through `RuntimeAppLoader.loadFixture(...)` and stores the result as a `RuntimeTreeSnapshot`.
3. The runtime automation coordinator and `@iphone-emulator/automation-sdk` reuse that same semantic contract to launch an in-memory fixture session, query elements by text/role/test ID, and apply deterministic `tap` and `fill` updates.
4. The browser renderer currently previews a checked-in `SemanticUITree` fixture that mirrors the same contract shape used by the runtime host.
5. The renderer mounts that fixture into an inspectable browser surface with stable semantic roles, identifiers, and state metadata.
6. Artifact APIs expose deterministic screenshot placeholder metadata, semantic snapshots, logs, network request records, and launch-time device settings for agent workflows.
7. Native capability manifests can be carried through launch/session inspection as deterministic fixture data, but this example does not execute native services.

## Automation Walkthrough

The checked-in automation sample shows the current intended user flow:

```ts
import { Emulator } from "@iphone-emulator/automation-sdk";

const app = await Emulator.launch({
  appIdentifier: "FixtureApp",
  fixtureName: "strict-mode-baseline",
  device: {
    viewport: { width: 393, height: 852, scale: 3 },
    colorScheme: "dark",
    locale: "en_US",
    clock: {
      frozenAtISO8601: "2026-04-28T12:00:00Z",
      timeZone: "America/New_York",
    },
    geolocation: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracyMeters: 25,
    },
    network: {
      isOnline: true,
      latencyMilliseconds: 20,
      downloadKbps: 12000,
    },
  },
  nativeCapabilities: {
    requiredCapabilities: [],
    configuredMocks: [],
    scriptedEvents: [],
    unsupportedSymbols: [],
    artifactOutputs: [],
  },
});

await app.route("https://example.test/profile", {
  id: "profile-fixture",
  status: 200,
  headers: { "content-type": "application/json" },
  body: { name: "Jordan" },
});

await app.getByText("Save").tap();
await app.getByRole("textField", { text: "Name" }).fill("Jordan");

const request = await app.request("https://example.test/profile");
const field = await app.getByTestId("name-field").inspect();
const tree = await app.semanticTree();
const logs = await app.logs();
const screenshot = await app.screenshot("baseline-after-save");
const artifacts = await app.artifacts();

console.log(field.value);
console.log(tree.scene.alertPayload?.title);
console.log(logs.map((entry) => entry.message));
console.log(request.response.status);
console.log(screenshot.viewport);
console.log(artifacts.networkRecords.length);

await app.close();
```

What this flow currently guarantees:

- `Emulator.launch(...)` opens a deterministic in-memory session for the `strict-mode-baseline` fixture.
- `getByText`, `getByRole`, and `getByTestId` resolve against stable semantic labels, roles, values, and identifiers from the retained tree.
- `tap()` mutates the button interaction state deterministically and updates the alert payload to `Done`.
- `fill()` updates the target text field value and records a log entry.
- `route()` installs deterministic in-memory response fixtures and `request()` records HAR-like request/response metadata without live network traffic.
- Launch `device` settings are retained on the session and reflected in screenshot placeholder viewport metadata.
- Launch `nativeCapabilities` settings are retained as deterministic manifest data for inspection and diagnostics alignment.
- `semanticTree()`, `inspect()`, `logs()`, `screenshot()`, and `artifacts()` expose the same fixture-backed session state without requiring a transport layer.

This example is intentionally limited:

- It demonstrates the declaration, snapshot, and in-memory automation contract, not a live Swift-to-browser execution pipeline.
- It does not claim SwiftUI or UIKit compatibility.
- It stays within the project-owned strict-mode, semantic tree, and fixture automation contracts exported today.
- Screenshot artifacts are metadata placeholders, not captured pixels.
- Renderer artifacts are deterministic DOM metadata, not native simulator screenshots or video.
- Device settings are metadata reflected by the runtime and SDK; they do not emulate OS simulator fidelity.
- Native capability manifests are fixture contracts; they do not access live host permissions, device state, native frameworks, or live network resources by default.

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
- Network fixtures are route records in the in-memory SDK/runtime contract; they do not issue real HTTP requests.
- Native capability manifests are retained and inspectable, but concrete native service mock behavior is not implemented in this example.
