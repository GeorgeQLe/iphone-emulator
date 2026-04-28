# iPhone Emulator Workspace

This repository is building an open-source iPhone-like app harness for Swift code. The current Phase 5 milestone adds agent-facing artifacts, deterministic network fixtures, and launch-time device metadata on top of the strict-mode semantic tree, deterministic browser preview surface, and fixture-backed automation SDK.

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

Phase 5 currently provides:

- `StrictModeSDK` entry points for strict-mode `App`, `Scene`, layout primitives, navigation, alerts, and state, plus lowering hooks that produce the shared semantic tree contract.
- `RuntimeHost` value types for semantic UI tree snapshots, fixture loading, lifecycle metadata, and retained tree inspection.
- `RuntimeHost` automation protocol types and an in-memory fixture coordinator that can launch the strict baseline fixture, resolve semantic queries, apply deterministic `tap` and `fill` updates, and expose artifact bundles with screenshot placeholders, semantic snapshots, logs, device metadata, and HAR-like network records.
- `DiagnosticsCore` compatibility contracts, a lightweight source analyzer, a documented v1 compatibility matrix, and a narrow supported-subset lowering path that emits the shared runtime tree when analysis succeeds without unsupported diagnostics.
- `@iphone-emulator/browser-renderer`, a local TypeScript/Vite renderer that mounts a checked-in semantic tree fixture into a deterministic iPhone-like browser shell and can derive stable DOM render metadata for captures.
- `@iphone-emulator/automation-sdk`, a local TypeScript package that exposes `Emulator.launch`, locator queries by text/role/test ID, semantic tree inspection, log retrieval, screenshot placeholder metadata, route fixtures, request records, device options, and artifact bundle retrieval through an in-memory fixture client.
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

See [`examples/strict-mode-baseline`](examples/strict-mode-baseline) for the current strict-mode fixture path. For compatibility-mode fixtures and current limitations, see [`Tests/fixtures/compatibility`](Tests/fixtures/compatibility), [`docs/compatibility-matrix.md`](docs/compatibility-matrix.md), and [`docs/strict-mode-migration.md`](docs/strict-mode-migration.md). The Swift example shows the intended declaration shape, the runtime host exposes the semantic tree snapshot and automation surface, the browser renderer mounts the checked-in fixture used for deterministic browser previews, and the automation sample demonstrates the current TypeScript SDK flow.

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
});

await app.route("https://example.test/profile", {
  id: "profile-fixture",
  status: 200,
  headers: { "content-type": "application/json" },
  body: { name: "Taylor" },
});

await app.getByText("Save").tap();
await app.getByRole("textField", { text: "Name" }).fill("Taylor");

const request = await app.request("https://example.test/profile");
const field = await app.getByTestId("name-field").inspect();
const tree = await app.semanticTree();
const logs = await app.logs();
const screenshot = await app.screenshot("baseline-after-save");
const artifacts = await app.artifacts();

console.log(field.value, tree.scene.alertPayload?.title, logs);
console.log(request.response.status, screenshot.viewport, artifacts.networkRecords.length);

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
