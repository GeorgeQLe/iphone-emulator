# Todo — iPhone Emulator Workspace

> Current phase: 8 of 10 — M7 Native Capability Registry and Manifest
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tdd

## Phase 8: M7 Native Capability Registry and Manifest

**Status:** planned.

**Goal:** Define the deterministic native capability model that lets the harness simulate native functionality requested by source code without claiming real iOS behavior.

**Scope:**
- Add a native capability taxonomy for permissions, camera/photos, location, network, clipboard, keyboard/input, files/share sheet, notifications, device environment, sensors, and haptics.
- Define capability manifests that list required capabilities, configured mocks, permission states, scripted events, unsupported symbols, and artifact outputs.
- Extend diagnostics so recognized native API requests either map to a capability contract or fail closed with adaptation guidance.
- Document the distinction between mock native capability support and real native framework fidelity.

**Acceptance Criteria:**
- The spec and docs define what a supported native capability must include before implementation.
- Runtime and automation contracts have typed manifest shapes, even if most capabilities are initially unsupported.
- Unsupported native APIs produce structured diagnostics with suggested strict-mode mock alternatives.
- No capability depends on live host permissions, live device state, or live network access by default.

### Execution Profile
**Parallel mode:** research-only
**Integration owner:** main agent
**Conflict risk:** medium
**Review gates:** capability taxonomy coherence, diagnostics/API conformance, deterministic defaults, docs accuracy

**Subagent lanes:**
- Lane: capability-taxonomy
  - Agent: explorer
  - Role: read-only researcher
  - Mode: read
  - Scope: inspect existing runtime, diagnostics, automation, and docs surfaces for places where native capability taxonomy terms must align.
  - Owns: none
  - Must not edit: all files
  - Depends on: none
  - Deliverable: recommended capability categories, naming constraints, and likely contract touchpoints.
- Lane: diagnostics-contract
  - Agent: explorer
  - Role: read-only researcher
  - Mode: read
  - Scope: inspect `DiagnosticsCore` compatibility report and fixture tests for the narrowest native API diagnostic extension path.
  - Owns: none
  - Must not edit: all files
  - Depends on: none
  - Deliverable: suggested red-phase diagnostics assertions and implementation files.

### Tests First
- [x] Step 8.1: Write failing runtime and diagnostics contracts for native capability manifests
  - Files: modify `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`; add fixtures under `tests/fixtures/compatibility/` only if needed.
  - Add red-phase assertions for typed capability manifest shapes, deterministic mock/default values, unsupported symbol mapping to capability guidance, and fail-closed behavior for unrecognized native APIs.
  - Implementation plan: first inspect existing runtime automation/device settings types and compatibility analyzer tests. Add the smallest contract tests that name the future manifest types and diagnostics output without implementing them. Keep tests focused on value shapes and source analysis, not real host permissions or native device behavior.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift test --filter DiagnosticsCoreContractTests`; failures are expected in this red phase and should be limited to missing native capability symbols or diagnostics fields.

### Implementation
- [x] Step 8.2: Add runtime native capability manifest value types
  - Files: create `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`; modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift` and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Define explicit value types for capability identifiers, permission states, configured mocks, scripted events, unsupported symbols, artifact outputs, and deterministic defaults.
  - Implementation plan: align naming with existing runtime automation launch/device setting types. Keep manifests serializable value data with no host permission probing, no live network access, and no side effects. Thread the manifest into launch/session configuration only where the existing automation contract needs to carry it.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [x] Step 8.3: Extend diagnostics with recognized native API capability guidance
  - Files: modify `packages/diagnostics-core/Sources/DiagnosticsCore/DiagnosticsCore.swift`, compatibility fixtures under `tests/fixtures/compatibility/`, and `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`.
  - Map recognized native API requests to native capability guidance and keep unrecognized native APIs fail-closed with structured unsupported diagnostics.
  - Implementation plan: extend the existing compatibility analyzer rather than creating a second diagnostics engine. Add a compact native API mapping table for camera/photos, location, network, clipboard, notifications, files/share sheet, sensors, haptics, and device environment where source symbols are currently detectable. Preserve existing diagnostic ordering and source-location behavior.
  - Current context from Step 8.2: runtime manifest types now live in `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`, and `RuntimeAutomationLaunchConfiguration`/`RuntimeAutomationSession` carry `nativeCapabilities` with an empty deterministic default. `swift build` passes. `swift test --filter RuntimeHostContractTests` currently stops during test compilation on the intended Step 8.3 red-phase diagnostics failures because `CompatibilityDiagnostic.nativeCapabilityGuidance` and related native guidance value types are not implemented yet.
  - Next implementation detail: add the diagnostics-side native guidance type surface before attempting analyzer mappings so the full test target compiles, then wire recognized API symbols to guidance while leaving unknown native APIs as structured fail-closed diagnostics.
  - Validation focus: run `swift test --filter DiagnosticsCoreContractTests` and `swift build`.
- [ ] Step 8.4: Surface capability manifest shapes through the automation SDK contract
  - Files: modify `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/index.test.ts`, and package-local types only if extraction is warranted.
  - Add launch option and inspection types that mirror the runtime manifest shape while remaining deterministic and fixture-backed.
  - Implementation plan: extend the in-memory `Emulator.launch` options and session inspection surface with native capability manifest data. Do not implement real native service behavior in this phase; only preserve and expose configured manifest state consistently with runtime contracts.
  - Current context from Step 8.3: diagnostics native capability guidance now lives in `packages/diagnostics/Sources/DiagnosticsCore/DiagnosticsTypes.swift`. `UnsupportedPlatformAPIDiagnostic` exposes `nativeCapabilityGuidance`, and the analyzer maps detected native API symbols to `RuntimeNativeCapabilityID` values for camera, location, photos, network, clipboard, notifications, files, share sheet, sensors, haptics, device environment, plus fail-closed `.unsupported` guidance for `LAContext.evaluatePolicy`.
  - Next implementation detail: mirror the Swift `RuntimeNativeCapabilityManifest` shape from `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift` into TypeScript types, add `nativeCapabilities?: RuntimeNativeCapabilityManifest` to `RuntimeAutomationLaunchOptions`, carry a deterministic default manifest into `RuntimeAutomationSession`, clone it in session snapshots, and add SDK tests that configured mocks, scripted events, unsupported symbols, and permission defaults survive launch/inspection without live host access.
  - Validation focus: run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- [ ] Step 8.5: Document the native capability registry and mock-fidelity boundary
  - Files: update `README.md`; create or modify docs under `docs/` such as `docs/native-capabilities.md`; update `examples/strict-mode-baseline/README.md` only if the example needs capability setup context.
  - Describe the capability taxonomy, manifest fields, unsupported/native API diagnostic behavior, deterministic mock constraints, and the distinction from real iOS/native framework fidelity.
  - Implementation plan: keep docs aligned with the exact runtime/automation type names and diagnostics categories implemented in Steps 8.2-8.4. Avoid promising live host permissions, real device state, or real native framework fidelity.
  - Validation focus: run the relevant Swift and TypeScript validation touched by docs examples if snippets compile; otherwise no code validation is required for docs-only edits.

### Green
- [ ] Step 8.6: Add regression coverage for manifest defaults and native diagnostics
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`, and `packages/automation-sdk/test/emulator.test.ts`.
  - Cover deterministic default manifests, explicit configured mocks, permission states, unsupported symbol records, diagnostics guidance for recognized native APIs, and automation SDK launch/inspection parity.
  - Implementation plan: add focused regression tests that protect the newly implemented value contracts and source-analysis mappings without introducing end-to-end native service behavior reserved for Phase 9.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, and `npm --prefix packages/automation-sdk test`.
- [ ] Step 8.7: Run full validation across Swift, browser renderer, and automation SDK
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- [ ] Step 8.8: Refactor native capability boundaries if needed while keeping validation green
  - Files: modify runtime native capability types, diagnostics capability mapping, automation SDK types, and docs only as needed.
  - Keep native capability manifest data separate from concrete native service mock implementations so Phase 9 can add services without rewriting contracts.
  - Implementation plan: re-read the runtime manifest types, diagnostics mapping, automation SDK launch surface, and docs together. Only refactor if there is concrete duplication, type drift, or premature service behavior in the manifest layer; otherwise complete this as a documented no-op boundary review.
  - Validation focus: reuse the Step 8.7 validation surface after source changes. If the review is no-op, no validation rerun is required beyond documenting that Step 8.7 already proved the phase green.

### Milestone: M7 Native Capability Registry and Manifest
**Acceptance Criteria:**
- [ ] The spec and docs define what a supported native capability must include before implementation.
- [ ] Runtime and automation contracts have typed manifest shapes, even if most capabilities are initially unsupported.
- [ ] Unsupported native APIs produce structured diagnostics with suggested strict-mode mock alternatives.
- [ ] No capability depends on live host permissions, live device state, or live network access by default.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
