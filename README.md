# iPhone Emulator Workspace

This repository is building an open-source iPhone-like app harness for Swift code. The current Phase 10 milestone adds high-level native automation controls for agent workflows on top of the strict-mode semantic tree, deterministic browser preview surface, agent-facing artifacts, fixture-backed automation SDK, compatibility diagnostics, browser IDE demo, and native capability registry.

## First Green Run

Use this path to prove the current local harness works end to end:

```sh
swift test
npm --prefix packages/automation-sdk test
npm --prefix packages/browser-renderer test
npx tsx examples/strict-mode-baseline/automation-example.ts
```

First success means:

- Swift runtime, diagnostics, and strict-mode contracts pass.
- The automation SDK launches the `strict-mode-baseline` fixture in memory.
- The example records semantic state, logs, route fixture records, screenshot metadata, device metadata, and native capability artifacts.
- The browser renderer can render the checked-in semantic fixture and native preview cards deterministically.

Run the full validation matrix before shipping changes:

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
```

The root `package.json` does not define a root `npm test` script. Use the package-specific commands above.

## Current Package Shape

The current repository is a local-first developer workspace, not a hosted product or installable simulator service.

- SwiftPM package: `IPhoneEmulatorWorkspace`, exposing `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore`.
- npm workspaces: `@iphone-emulator/automation-sdk` and `@iphone-emulator/browser-renderer`.
- Example fixture: `examples/strict-mode-baseline`.
- Public docs: strict-mode migration, compatibility matrix, native capability registry, and CI fixture recipe.

Current value comes from deterministic fixture execution and inspectable artifacts. The automation SDK is in-memory and fixture-backed; the browser renderer mounts checked-in semantic fixtures; screenshots are metadata records; native capability APIs append deterministic records rather than touching host native services.

For CI usage, start with [`docs/ci-fixture-recipe.md`](docs/ci-fixture-recipe.md).

## Goals

- Provide a lawful, open-source harness for building and testing iPhone-like app flows without depending on Apple-proprietary runtimes.
- Define a strict-mode Swift SDK that exposes a narrow, explicit surface the project can implement end to end.
- Build a runtime host, browser renderer, diagnostics layer, and automation SDK in phases, with contracts locked down by tests before behavior expands.

## Non-Goals

- This project is not iOS, UIKit, SwiftUI, WebKit, or Xcode Simulator.
- This project does not aim for binary compatibility with Apple frameworks or simulator fidelity.
- This project still does not implement iOS fidelity, Apple runtime compatibility, protocol transport, or a live runtime-to-browser session layer.

## Modes

### Strict Mode

Strict mode is the primary execution model for this repository. Code in this mode targets the project-owned `StrictModeSDK` surface directly and is expected to stay within the symbols exported by the harness.

Strict mode is still intentionally narrow. The public entry points lower fixture apps into a project-owned semantic UI tree rather than attempting broad SwiftUI or UIKit compatibility.

### Compatibility Mode

Compatibility mode is now available as a diagnostics-led v1 surface for analyzing plain Swift source and a narrow SwiftUI-inspired subset. Its purpose is to produce structured diagnostics first and only lower code into the strict runtime model when the source stays inside the documented supported subset.

The current v1 surface is intentionally small and fail-closed. It supports `import SwiftUI` plus the first lowering path for `VStack`, `Text`, `Button`, and `@State`, and it reports structured diagnostics for unsupported imports, platform APIs, lifecycle hooks, modifiers, and bridge symbols such as `UIKit`, `UIApplication`, `UIViewControllerRepresentable`, `.onAppear`, and `.padding`.

## Open-Source-Only Constraint

The harness is designed to remain implementable with open-source tooling and project-owned runtime pieces. Work in this repository should avoid assumptions that require Apple-private simulator internals, proprietary frameworks, or closed runtime components.

## Current Phase Status

The workspace currently provides:

- `StrictModeSDK` entry points for strict-mode `App`, `Scene`, layout primitives, navigation, alerts, and state, plus lowering hooks that produce the shared semantic tree contract.
- `RuntimeHost` value types for semantic UI tree snapshots, fixture loading, lifecycle metadata, and retained tree inspection.
- `RuntimeHost` automation protocol types and an in-memory fixture coordinator that can launch the strict baseline fixture, resolve semantic queries, apply deterministic `tap` and `fill` updates, and expose artifact bundles with screenshot placeholders, semantic snapshots, logs, device metadata, and HAR-like network records.
- `DiagnosticsCore` compatibility contracts, a lightweight source analyzer, a documented v1 compatibility matrix, and a narrow supported-subset lowering path that emits the shared runtime tree when analysis succeeds without unsupported diagnostics.
- Native capability manifest and mock service contracts through `RuntimeNativeCapabilityManifest`, `RuntimeNativeCapabilityID`, `RuntimeNativePermissionState`, `RuntimeNativeCapabilityRequirement`, `RuntimeNativeCapabilityMock`, `RuntimeNativeCapabilityEvent`, `RuntimeNativeUnsupportedSymbol`, `RuntimeNativeCapabilityArtifactOutput`, `RuntimeNativeCapabilityState`, and native capability event/artifact records.
- Deterministic mock state for permission prompts/results, fixture-backed camera captures, photo picker selections, scripted location updates, clipboard read/write records, keyboard/input traits, file picker selections, share sheet records, and local notification scheduling/delivery records.
- Diagnostics-side `nativeCapabilityGuidance` for recognized native API requests, with deterministic manifest-field suggestions and fail-closed handling for APIs with no capability contract.
- `@iphone-emulator/browser-renderer`, a local TypeScript/Vite renderer that mounts a checked-in semantic tree fixture into a deterministic iPhone-like browser shell, can derive stable DOM render metadata for captures, and renders browser-only native mock plus native agent-flow preview cards from illustrative strict-mode declarations.
- `@iphone-emulator/automation-sdk`, a local TypeScript package that exposes `Emulator.launch`, native capability manifest launch options, high-level `app.native.*` controls, native mock state/event inspection, locator queries by text/role/test ID, semantic tree inspection, log retrieval, screenshot placeholder metadata, route fixtures, request records, device options, and artifact bundle retrieval through an in-memory fixture client.
- SwiftPM and Vitest coverage that locks the current tree-generation, runtime automation, renderer behavior, and SDK surface before later phases add transport or live session coordination.

## Workspace Layout

- `packages/swift-sdk` for the strict-mode Swift SDK package
- `packages/runtime-host` for the runtime host package
- `packages/diagnostics` for the diagnostics package
- `packages/browser-renderer` for the future browser renderer package
- `packages/automation-sdk` for the current TypeScript automation SDK package
- `examples` for fixture apps and usage sketches
- `tests` for non-SwiftPM test assets when later phases need them

## Example

See [`examples/strict-mode-baseline`](examples/strict-mode-baseline) for the current strict-mode fixture path. For compatibility-mode fixtures and current limitations, see [`Tests/fixtures/compatibility`](Tests/fixtures/compatibility), [`docs/compatibility-matrix.md`](docs/compatibility-matrix.md), and [`docs/strict-mode-migration.md`](docs/strict-mode-migration.md). For native capability manifests and mock-fidelity boundaries, see [`docs/native-capabilities.md`](docs/native-capabilities.md). For CI artifact retention, see [`docs/ci-fixture-recipe.md`](docs/ci-fixture-recipe.md). The Swift example shows the intended declaration shape, the runtime host exposes the semantic tree snapshot and automation surface, the browser renderer mounts the checked-in fixture used for deterministic browser previews, and the automation sample demonstrates the current TypeScript SDK flow.

## Validation

The current validation surface is:

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

Compatibility-mode validation currently relies on:

```sh
swift test --filter DiagnosticsCoreContractTests
swift test --filter RuntimeHostContractTests
```

## Automation SDK Example

The current automation SDK mirrors the fixture-backed runtime contract rather than a live browser or device transport. A representative flow looks like:

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
    requiredCapabilities: [
      {
        id: "camera",
        permissionState: "prompt",
        strictModeAlternative:
          "Use a deterministic camera fixture instead of live capture.",
      },
      {
        id: "photos",
        permissionState: "granted",
        strictModeAlternative:
          "Use photo picker fixtures instead of reading the host photo library.",
      },
      {
        id: "location",
        permissionState: "granted",
        strictModeAlternative:
          "Script deterministic coordinates instead of using CoreLocation.",
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
        capability: "photos",
        identifier: "recent-library-pick",
        payload: {
          fixtureName: "recent-library",
          assetIdentifiers: "profile-photo,receipt-photo",
          mediaTypes: "image",
        },
      },
      {
        capability: "location",
        identifier: "initial-location",
        payload: {
          latitude: "40.7128",
          longitude: "-74.0060",
          accuracyMeters: "25",
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
        capability: "files",
        identifier: "document-picker",
        payload: {
          selectedFiles: "Fixtures/profile.pdf,Fixtures/receipt.pdf",
          contentTypes: "com.adobe.pdf,public.image",
          allowsMultipleSelection: "true",
        },
      },
      {
        capability: "shareSheet",
        identifier: "share-receipt",
        payload: {
          activityType: "com.apple.UIKit.activity.Mail",
          items: "Fixtures/profile.pdf,Summary",
          completionState: "completed",
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
  },
});

await app.route("https://example.test/profile", {
  id: "profile-fixture",
  status: 200,
  headers: { "content-type": "application/json" },
  body: { name: "Taylor" },
});

await app.getByText("Save").tap();
await app.getByRole("textField", { text: "Name" }).fill("Taylor");

await app.native.permissions.request("camera");
await app.native.camera.capture("front-camera-still");
await app.native.photos.select("recent-library-pick");
await app.native.permissions.set("location", "denied");
const deniedLocation = await app.native.location.current();
await app.native.clipboard.write("Copied by agent");
const clipboardRead = await app.native.clipboard.read();
await app.native.notifications.requestAuthorization();
await app.native.notifications.schedule("profile-reminder");

const request = await app.request("https://example.test/profile");
const field = await app.getByTestId("name-field").inspect();
const tree = await app.semanticTree();
const logs = await app.logs();
const screenshot = await app.screenshot("baseline-after-save");
const artifacts = await app.artifacts();
const session = await app.session();
const nativeEvents = await app.native.events();

console.log(field.value, tree.scene.alertPayload?.title, logs);
console.log(request.response.status, screenshot.viewport, artifacts.networkRecords.length);
console.log(
  session.nativeCapabilityState.permissions.camera.resolvedState,
  deniedLocation.diagnostic?.code,
  clipboardRead.text,
  nativeEvents.map((event) => event.name),
  artifacts.nativeCapabilityRecords.length
);

await app.close();
```

## Current Limitations

- The browser renderer mounts a checked-in fixture tree from `packages/browser-renderer/src/fixtureTree.ts`; it does not yet consume runtime-exported snapshots directly.
- There is no JSON-RPC or WebSocket transport between Swift and the browser renderer yet.
- The automation SDK is in-memory only. It mirrors the runtime contract and fixture behavior locally; it does not yet speak to a live Swift host, browser process, or real device.
- Runtime updates are fixture-scoped and deterministic; live interaction, multi-session coordination, and transport-backed automation hooks are deferred to later phases.
- Screenshot support is limited to placeholder metadata (`name`, `kind`, `format`, `byteCount`, `viewport`) until a later phase adds a real pixel artifact pipeline.
- Renderer capture support currently produces deterministic DOM render metadata, not native screenshots or video.
- Network fixtures are deterministic in-memory route records. They do not perform live HTTP calls.
- Device settings are reflected as launch/session metadata and artifact viewport metadata. They do not emulate OS simulator behavior.
- Compatibility mode is scanner-based rather than compiler-integrated. It only lowers the first documented SwiftUI-inspired subset and otherwise returns diagnostics instead of attempting broad SwiftUI or UIKit emulation.
- Native capability manifests and `app.native.*` controls drive deterministic mock records for supported services. They do not access live host permissions, live device state, native framework behavior, host files, host clipboard, camera hardware, photo libraries, notification delivery, or live network resources by default.
- The browser native preview is illustrative source lowering only. It renders deterministic native mock and agent-flow cards from the demo project; it is not live Swift execution or host native behavior.
- The automation SDK exposes native mock state/events through session and artifact inspection plus high-level deterministic `app.native.*` controls.
