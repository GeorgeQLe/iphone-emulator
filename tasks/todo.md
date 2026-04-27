# Todo

## Priority Task Queue

- [x] `$ship-end --no-deploy` - configured `origin` and pushed the initial `main` commit to `https://github.com/GeorgeQLe/iphone-emulator.git` on 2026-04-27 14:22:55 EDT.

## Phase 1: M0 Repo Scaffold and Strict Runtime Skeleton
> Test strategy: tdd

### Execution Profile
**Parallel mode:** serial
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, docs/API conformance

**Subagent lanes:** none

### Tests First
- [x] Step 1.1: Create failing scaffold validation tests for the expected repository layout and package manifests.
  - Files: create `tests/scaffold.test.*` or the nearest conventional test path after selecting the project test runner.
  - Cover required directories for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
  - Cover required package or workspace manifest presence.
  - Tests MUST fail before the scaffold exists.
- [x] Step 1.2: Create failing tests for the strict-mode SDK contract skeleton.
  - Files: create tests under the SDK package test path selected in Step 1.1.
  - Cover app declaration, scene, text, button, text field, list, stack layout, navigation, modal, tab, alert, and state entry-point symbols.
  - Tests MUST fail until SDK symbols exist.
  - Use the SwiftPM test harness introduced in Step 1.1 and add a dedicated SDK contract suite under `Tests/`.
  - Assert the presence of the strict-mode public entry points by symbol or module import rather than by file existence.
  - Keep the test surface limited to contract shape only; runtime behavior belongs to later steps.
- [x] Step 1.3: Create failing tests for runtime host and diagnostics entry points.
  - Files: create tests under runtime and diagnostics package test paths.
  - Cover app lifecycle entry points, future protocol boundary placeholder, unsupported import diagnostics, unsupported symbol diagnostics, and source-location shape.
  - Tests MUST fail until runtime and diagnostics skeletons exist.
  - Use dedicated SwiftPM test suites under `Tests/` and assert missing contracts by importing planned future modules such as `RuntimeHost` and `DiagnosticsCore`.
  - Split coverage so runtime tests focus on lifecycle and protocol-boundary placeholders, while diagnostics tests focus on unsupported-import reports, unsupported-symbol reports, suggested adaptations, and source-location structs.

### Implementation
- [x] Step 1.4: Select and add the root workspace/package structure for this multi-language harness.
  - Files: create root package/workspace manifest files, `README.md`, and package directories for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
  - Extend the root `Package.swift` from test-only harness to workspace manifest with library targets for the future Swift modules and test-support utilities retained.
  - Create placeholder package manifests under `packages/swift-sdk`, `packages/runtime-host`, and `packages/diagnostics`, plus Node package manifests for `packages/browser-renderer` and `packages/automation-sdk`.
  - Create the required directory scaffold without implementing runtime behavior yet; this step is limited to package/workspace structure and placeholder manifests needed to unblock later green work.
  - Status: completed on 2026-04-27 after the root workspace manifest, package directories, nested package manifests, placeholder module source files, and baseline `README.md` scaffold were added.
  - Add a baseline `README.md` stub only if needed to describe the workspace layout; deeper product positioning remains Step 1.8.
- [x] Step 1.5: Implement the strict-mode Swift SDK skeleton.
  - Files: create SDK package source files for app declarations, scenes, core views, navigation primitives, state primitives, and public API exports.
  - Start in `packages/swift-sdk/Sources/StrictModeSDK/` and keep the public surface limited to the symbols asserted by `Tests/StrictModeSDKContractTests/StrictModeSDKContractTests.swift`.
  - Prefer minimal compile-time skeleton types and exports only; do not add behavior that belongs to the later UI tree or renderer phases.
  - Re-run `swift test` after wiring the SDK symbols. Expected remaining failures after Step 1.5 are confined to `RuntimeHostContractTests` and `DiagnosticsCoreContractTests`.
  - Status: completed on 2026-04-27 after replacing the SDK placeholder with minimal compile-only public entry points for `App`, `Scene`, `View`, `Text`, `Button`, `TextField`, `List`, `VStack`, `HStack`, `NavigationStack`, `Modal`, `TabView`, `Alert`, and `State`.
- [x] Step 1.6: Implement the runtime host skeleton.
  - Files: create runtime package source files for lifecycle, app loading placeholder, UI tree handoff placeholder, logs, and future JSON-RPC/WebSocket boundary.
  - Start in `packages/runtime-host/Sources/RuntimeHost/` and replace the placeholder with the exact public symbols asserted by `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`: `RuntimeAppLifecycle`, `RuntimeAppLoader`, `RuntimeTreeBridge`, `RuntimeLogSink`, and `ProtocolBoundaryPlaceholder`.
  - Keep all runtime types behavior-light and dependency-free. This step is limited to contract-shaping types and public exports, not real app execution, renderer integration, or protocol transport.
  - Re-run `swift test` after wiring the runtime symbols. Expected remaining failures after Step 1.6 should be confined to `DiagnosticsCoreContractTests`.
  - Status: completed on 2026-04-27 after replacing the runtime placeholder with compile-only public contract types for lifecycle state, app loading, tree bridging, log sink levels, and protocol-boundary transport placeholders. `swift test` now fails only in `DiagnosticsCoreContractTests`, matching the step expectation.
- [x] Step 1.7: Implement the diagnostics skeleton.
  - Files: create diagnostics package source files for unsupported import reports, unsupported symbol reports, source-location data structures, and suggested adaptation messages.
  - Start in `packages/diagnostics/Sources/DiagnosticsCore/` and replace the placeholder with the exact public symbols asserted by `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`: `UnsupportedImportDiagnostic`, `UnsupportedSymbolDiagnostic`, `SuggestedAdaptation`, and `SourceLocation`.
  - Keep the diagnostics types compile-only and structured. Prefer immutable stored properties for import names, symbol names, adaptation text, and file/line/column data, without implementing parser or analyzer behavior yet.
  - Re-run `swift test` after wiring the diagnostics symbols. Expected remaining work after Step 1.7 is documentation/examples plus the full green validation pass in Steps 1.8 through 1.11.
  - Status: completed on 2026-04-27 after replacing the diagnostics placeholder with compile-only public types for source locations, suggested adaptations, unsupported imports, and unsupported symbols. `swift test` passes across all current suites, and the strict-mode contract test warning was removed by switching protocol existential references to `any App` and `any Scene`.
- [ ] Step 1.8: Add baseline docs and examples for positioning and strict-mode usage.
  - Files: update `README.md`; create example strict-mode app files and docs explaining goals, non-goals, strict mode, compatibility mode, and open-source-only constraints.
  - Implementation plan for next session: expand `README.md` with concise sections for project goals, explicit non-goals around Apple frameworks and simulator parity, strict-mode expectations, compatibility-mode intent, and the open-source-only constraint; add a minimal strict-mode example app under `examples/`; and include enough usage notes for a fresh reader to understand the repository layout and current scope before Phase 1 green validation.

### Green
- [ ] Step 1.9: Run the selected test suite and verify all Phase 1 tests pass.
- [ ] Step 1.10: Run formatting, linting, or build checks available for the chosen toolchain.
- [ ] Step 1.11: Refactor names and package boundaries if needed while keeping tests green.

### Milestone: M0 Repo Scaffold and Strict Runtime Skeleton
**Acceptance Criteria:**
- [ ] The repo has a clear package layout for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
- [ ] Strict-mode SDK types compile or are represented by enforceable scaffolding with documented intended contracts.
- [ ] Runtime host and diagnostics modules have concrete entry points and tests or smoke checks appropriate for the chosen tooling.
- [ ] The project README states goals, non-goals, strict mode, compatibility mode, and open-source-only constraints.
- [ ] Example strict-mode app docs exist and match the baseline public SDK skeleton.
- [ ] No compatibility shims beyond diagnostics skeleton are implemented in this phase.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
