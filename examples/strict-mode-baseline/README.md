# Strict Mode Baseline Example

This example shows the current strict-mode fixture path from Swift declarations to semantic snapshots, deterministic browser preview metadata, native mock service records, and the in-memory automation SDK artifact workflow.

## Files In This Example

- `BaselineExampleApp.swift` shows the intended strict-mode declaration shape for an app and a small catalog of currently supported primitives.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeAppLoader.swift` is the runtime entry point that lowers a fixture closure into a `RuntimeTreeSnapshot`.
- `../../packages/runtime-host/Sources/RuntimeHost/RuntimeTreeSnapshot.swift` defines the retained snapshot shape the runtime bridge and future automation layers will inspect.
- `../../packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift` applies deterministic fixture-backed automation commands over the retained snapshot.
- `../../packages/runtime-host/Sources/RuntimeHost/Artifacts/RuntimeArtifactTypes.swift` defines screenshot/render metadata, semantic snapshot artifacts, log bundle entries, and network request records.
- `../../packages/runtime-host/Sources/RuntimeHost/Network/RuntimeNetworkFixture.swift` defines deterministic network fixture and request/response record shapes.
- `../../packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift` defines deterministic native capability manifest shapes for fixture-backed native requests.
- `../../packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityState.swift` derives deterministic native mock state, events, logs, semantic metadata, diagnostics, and artifact records from manifests.
- `../../docs/native-capabilities.md` documents the capability taxonomy, supported mock services, manifest payload keys, diagnostics guidance, renderer preview behavior, and mock-fidelity boundary.
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
6. Artifact APIs expose deterministic screenshot placeholder metadata, semantic snapshots, logs, network request records, native capability records, and launch-time device settings for agent workflows.
7. Native capability manifests derive deterministic permission, camera/photo, location, clipboard, keyboard/input, file, share sheet, and notification mock records for inspection. They do not execute live native services.

## Automation Walkthrough

The checked-in automation sample shows the current intended user flow:

```ts
import { Emulator } from "@iphone-emulator/automation-sdk";

const nativeCapabilities = {
  requiredCapabilities: [
    {
      id: "camera",
      permissionState: "prompt",
      strictModeAlternative:
        "Use a deterministic camera fixture instead of live capture.",
    },
    {
      id: "notifications",
      permissionState: "prompt",
      strictModeAlternative:
        "Record notification schedules instead of using a platform notification center.",
    },
  ],
  configuredMocks: [
    {
      capability: "camera",
      identifier: "front-camera-still",
      payload: {
        result: "granted",
        fixtureName: "profile-photo",
        mediaType: "image",
        outputPath: "Fixtures/profile-photo.heic",
      },
    },
    {
      capability: "clipboard",
      identifier: "clipboard",
      payload: { initialText: "Draft profile notes" },
    },
    {
      capability: "keyboardInput",
      identifier: "name-entry",
      payload: {
        focusedElementID: "name-field",
        keyboardType: "default",
        returnKey: "done",
        isVisible: "true",
      },
    },
    {
      capability: "notifications",
      identifier: "notification-permission",
      payload: { result: "granted" },
    },
  ],
  scriptedEvents: [
    {
      capability: "location",
      name: "location-update",
      atRevision: 2,
      payload: {
        latitude: "40.7134",
        longitude: "-74.0059",
        accuracyMeters: "18",
      },
    },
    {
      capability: "clipboard",
      name: "clipboard-write",
      atRevision: 3,
      payload: { text: "Updated profile notes" },
    },
    {
      capability: "notifications",
      name: "notification-scheduled",
      atRevision: 4,
      payload: {
        identifier: "profile-reminder",
        title: "Profile Reminder",
        body: "Review the saved profile.",
        trigger: "2026-04-28T12:15:00Z",
      },
    },
  ],
  unsupportedSymbols: [],
  artifactOutputs: [],
};

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
  nativeCapabilities,
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
const session = await app.session();
const nativeEvents = await app.nativeCapabilityEvents();

console.log(field.value);
console.log(tree.scene.alertPayload?.title);
console.log(logs.map((entry) => entry.message));
console.log(request.response.status);
console.log(screenshot.viewport);
console.log(artifacts.networkRecords.length);
console.log(session.nativeCapabilityState.permissions.camera.resolvedState);
console.log(nativeEvents.map((event) => event.name));
console.log(artifacts.nativeCapabilityRecords.length);

await app.close();
```

What this flow currently guarantees:

- `Emulator.launch(...)` opens a deterministic in-memory session for the `strict-mode-baseline` fixture.
- `getByText`, `getByRole`, and `getByTestId` resolve against stable semantic labels, roles, values, and identifiers from the retained tree.
- `tap()` mutates the button interaction state deterministically and updates the alert payload to `Done`.
- `fill()` updates the target text field value and records a log entry.
- `route()` installs deterministic in-memory response fixtures and `request()` records HAR-like request/response metadata without live network traffic.
- Launch `device` settings are retained on the session and reflected in screenshot placeholder viewport metadata.
- Launch `nativeCapabilities` settings are retained, cloned, and used to derive deterministic native mock state, event records, logs, semantic metadata, diagnostics, and artifact records.
- `semanticTree()`, `inspect()`, `logs()`, `screenshot()`, and `artifacts()` expose the same fixture-backed session state without requiring a transport layer.
- `session.nativeCapabilityState`, `session.nativeCapabilityEvents`, `app.nativeCapabilityEvents()`, and `artifacts.nativeCapabilityRecords` expose native mock inspection data without adding the future Phase 10 `app.native.*` control API.

This example is intentionally limited:

- It demonstrates the declaration, snapshot, and in-memory automation contract, not a live Swift-to-browser execution pipeline.
- It does not claim SwiftUI or UIKit compatibility.
- It stays within the project-owned strict-mode, semantic tree, and fixture automation contracts exported today.
- Screenshot artifacts are metadata placeholders, not captured pixels.
- Renderer artifacts are deterministic DOM metadata, not native simulator screenshots or video.
- Device settings are metadata reflected by the runtime and SDK; they do not emulate OS simulator fidelity.
- Native capability mock records are fixture contracts; they do not access live host permissions, device state, host files, host clipboard, camera hardware, photo libraries, native frameworks, notification delivery, or live network resources by default.

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
- Native capability mocks are deterministic records only. They are inspectable through session, log, semantic tree, and artifact surfaces, but they do not execute live native services or provide iOS simulator fidelity.
- The high-level `app.native.*` automation API is not part of this phase.
