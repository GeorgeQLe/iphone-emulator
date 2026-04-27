# iPhone Emulator Workspace

This repository is building an open-source iPhone-like app harness for Swift code. Phase 1 establishes the package scaffold and strict-mode public contracts for the SDK, runtime host, and diagnostics modules.

## Goals

- Provide a lawful, open-source harness for building and testing iPhone-like app flows without depending on Apple-proprietary runtimes.
- Define a strict-mode Swift SDK that exposes a narrow, explicit surface the project can implement end to end.
- Build a runtime host, browser renderer, diagnostics layer, and automation SDK in phases, with contracts locked down by tests before behavior expands.

## Non-Goals

- This project is not iOS, UIKit, SwiftUI, WebKit, or Xcode Simulator.
- This project does not aim for binary compatibility with Apple frameworks or simulator fidelity.
- This phase does not implement renderer behavior, app execution, protocol transport, or compatibility shims beyond diagnostics skeletons.

## Modes

### Strict Mode

Strict mode is the primary execution model for this repository. Code in this mode targets the project-owned `StrictModeSDK` surface directly and is expected to stay within the symbols exported by the harness.

Phase 1 strict mode is intentionally minimal. The public entry points compile and are test-covered, but they do not yet provide meaningful runtime behavior or rendering.

### Compatibility Mode

Compatibility mode is a planned later phase for analyzing plain Swift and a narrow SwiftUI-inspired subset. Its purpose is to produce structured diagnostics and, only where feasible, guide code toward strict mode.

Compatibility mode is not implemented in the current scaffold. The only compatibility-adjacent work in Phase 1 is the diagnostics module contract that later phases will build on.

## Open-Source-Only Constraint

The harness is designed to remain implementable with open-source tooling and project-owned runtime pieces. Work in this repository should avoid assumptions that require Apple-private simulator internals, proprietary frameworks, or closed runtime components.

## Current Phase Status

Phase 1 currently provides:

- `StrictModeSDK` compile-time entry points for `App`, `Scene`, basic views, navigation primitives, alerts, and state.
- `RuntimeHost` placeholder types for lifecycle, loading, tree bridging, logging, and future protocol boundaries.
- `DiagnosticsCore` placeholder types for unsupported import/symbol reporting and source locations.
- SwiftPM contract tests that lock the current public surface before later phases add behavior.

## Workspace Layout

- `packages/swift-sdk` for the strict-mode Swift SDK package
- `packages/runtime-host` for the runtime host package
- `packages/diagnostics` for the diagnostics package
- `packages/browser-renderer` for the future browser renderer package
- `packages/automation-sdk` for the future TypeScript automation SDK package
- `examples` for fixture apps and usage sketches
- `tests` for non-SwiftPM test assets when later phases need them

## Example

See [`examples/strict-mode-baseline`](examples/strict-mode-baseline) for a minimal strict-mode usage sketch that matches the current SDK skeleton. The example demonstrates symbol shape only; it is not a runnable app emulator yet.

## Validation

The Phase 1 contract suites run with:

```sh
swift test
```
