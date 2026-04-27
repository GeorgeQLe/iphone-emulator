# iPhone Emulator Workspace

This repository is building an open-source iPhone-like app harness for Swift code. The current Phase 3 milestone adds a fixture-backed automation SDK on top of the strict-mode semantic tree and deterministic browser preview surface.

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

Compatibility mode is a planned later phase for analyzing plain Swift and a narrow SwiftUI-inspired subset. Its purpose is to produce structured diagnostics and, only where feasible, guide code toward strict mode.

Compatibility mode is not implemented in the current scaffold. The current repository work remains focused on strict-mode declarations, semantic tree generation, and deterministic fixture rendering.

## Open-Source-Only Constraint

The harness is designed to remain implementable with open-source tooling and project-owned runtime pieces. Work in this repository should avoid assumptions that require Apple-private simulator internals, proprietary frameworks, or closed runtime components.

## Current Phase Status

Phase 3 currently provides:

- `StrictModeSDK` entry points for strict-mode `App`, `Scene`, layout primitives, navigation, alerts, and state, plus lowering hooks that produce the shared semantic tree contract.
- `RuntimeHost` value types for semantic UI tree snapshots, fixture loading, lifecycle metadata, and retained tree inspection.
- `RuntimeHost` automation protocol types and an in-memory fixture coordinator that can launch the strict baseline fixture, resolve semantic queries, apply deterministic `tap` and `fill` updates, and expose logs plus screenshot placeholder metadata.
- `DiagnosticsCore` placeholder diagnostics contracts for later compatibility analysis work.
- `@iphone-emulator/browser-renderer`, a local TypeScript/Vite renderer that mounts a checked-in semantic tree fixture into a deterministic iPhone-like browser shell.
- `@iphone-emulator/automation-sdk`, a local TypeScript package that exposes `Emulator.launch`, locator queries by text/role/test ID, semantic tree inspection, log retrieval, and screenshot placeholder metadata through an in-memory fixture client.
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

See [`examples/strict-mode-baseline`](examples/strict-mode-baseline) for the current strict-mode fixture path. The Swift example shows the intended declaration shape, the runtime host exposes the semantic tree snapshot and automation surface, the browser renderer mounts the checked-in fixture used for deterministic browser previews, and the automation sample demonstrates the current TypeScript SDK flow.

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

## Automation SDK Example

The current automation SDK mirrors the fixture-backed runtime contract rather than a live browser or device transport. A representative flow looks like:

```ts
import { Emulator } from "@iphone-emulator/automation-sdk";

const app = await Emulator.launch({
  appIdentifier: "FixtureApp",
  fixtureName: "strict-mode-baseline",
});

await app.getByText("Save").tap();
await app.getByRole("textField", { text: "Name" }).fill("Taylor");

const field = await app.getByTestId("name-field").inspect();
const tree = await app.semanticTree();
const logs = await app.logs();

console.log(field.value, tree.scene.alertPayload?.title, logs);

await app.close();
```

## Current Limitations

- The browser renderer mounts a checked-in fixture tree from `packages/browser-renderer/src/fixtureTree.ts`; it does not yet consume runtime-exported snapshots directly.
- There is no JSON-RPC or WebSocket transport between Swift and the browser renderer yet.
- The automation SDK is in-memory only. It mirrors the runtime contract and fixture behavior locally; it does not yet speak to a live Swift host, browser process, or real device.
- Runtime updates are fixture-scoped and deterministic; live interaction, multi-session coordination, and transport-backed automation hooks are deferred to later phases.
- Screenshot support is limited to placeholder metadata (`name`, `format`, `byteCount`) until a later phase adds a real artifact pipeline.
