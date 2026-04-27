# iPhone Emulator Workspace

This repository is building an open-source iPhone-like app harness for Swift code. The current Phase 2 milestone turns strict-mode declarations into a semantic UI tree and renders a fixed fixture inside an iPhone-like browser surface.

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

Phase 2 currently provides:

- `StrictModeSDK` entry points for strict-mode `App`, `Scene`, layout primitives, navigation, alerts, and state, plus lowering hooks that produce the shared semantic tree contract.
- `RuntimeHost` value types for semantic UI tree snapshots, fixture loading, lifecycle metadata, and retained tree inspection.
- `DiagnosticsCore` placeholder diagnostics contracts for later compatibility analysis work.
- `@iphone-emulator/browser-renderer`, a local TypeScript/Vite renderer that mounts a checked-in semantic tree fixture into a deterministic iPhone-like browser shell.
- SwiftPM and Vitest coverage that locks the current tree-generation and renderer behavior before later phases add transport, live updates, or automation.

## Workspace Layout

- `packages/swift-sdk` for the strict-mode Swift SDK package
- `packages/runtime-host` for the runtime host package
- `packages/diagnostics` for the diagnostics package
- `packages/browser-renderer` for the future browser renderer package
- `packages/automation-sdk` for the future TypeScript automation SDK package
- `examples` for fixture apps and usage sketches
- `tests` for non-SwiftPM test assets when later phases need them

## Example

See [`examples/strict-mode-baseline`](examples/strict-mode-baseline) for the current strict-mode fixture path. The Swift example shows the intended declaration shape, the runtime host exposes the semantic tree snapshot surface, and the browser renderer mounts the checked-in fixture used for deterministic browser previews.

## Validation

The current validation surface is:

```sh
swift test
npm --prefix packages/browser-renderer run typecheck
npm --prefix packages/browser-renderer test
npm --prefix packages/browser-renderer run build
```

## Current Limitations

- The browser renderer mounts a checked-in fixture tree from `packages/browser-renderer/src/fixtureTree.ts`; it does not yet consume runtime-exported snapshots directly.
- There is no JSON-RPC or WebSocket transport between Swift and the browser renderer yet.
- Runtime updates are fixture-scoped and deterministic; live interaction, session management, and automation hooks are deferred to later phases.
