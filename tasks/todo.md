# Todo

## Priority Task Queue

- [x] `$ship-end --no-deploy` - configured `origin` and pushed the initial `main` commit to `https://github.com/GeorgeQLe/iphone-emulator.git` on 2026-04-27 14:22:55 EDT.
- [x] Phase 1 completed on 2026-04-27 after confirming the current `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore` package split is the smallest coherent scaffold and re-running `swift test` plus `swift build`.
- [x] Phase 2 completed on 2026-04-27 after aligning the renderer-side scene-kind contract with `RuntimeHost`, re-running the full Swift and browser-renderer validation surface, and confirming the UI tree and browser boundary needs no broader cleanup before automation work begins.
- [x] Phase 3 completed on 2026-04-27 after confirming the runtime automation value types and the in-memory automation SDK remain the smallest coherent pre-transport boundary, with the full Swift, renderer, and automation validation surface already green.

## Phase 4: M2 SwiftUI-Subset Compatibility Diagnostics
> Test strategy: tdd

### Execution Profile
**Parallel mode:** research-only
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, docs/API conformance

**Subagent lanes:**
- Lane: compatibility-matrix-research
  - Agent: explorer
  - Role: explorer
  - Mode: read-only
  - Scope: inspect the spec, current strict-mode SDK, and runtime UI tree to recommend the smallest v1 SwiftUI-subset compatibility matrix that can truthfully distinguish supported lowering paths from diagnostics-only gaps.
  - Depends on: none
  - Deliverable: a short recommendation for supported imports, view/layout/state primitives, and the first explicitly unsupported framework areas that should produce diagnostics.
- Lane: diagnostics-scan-research
  - Agent: explorer
  - Role: explorer
  - Mode: read-only
  - Scope: inspect `DiagnosticsCore`, existing SwiftPM tests, and candidate fixture shapes to recommend the lightest analyzer surface that can report unsupported imports, symbols, modifiers, and lifecycle hooks with stable source locations.
  - Depends on: none
  - Deliverable: a short recommendation for analyzer entry points, report types, and fixture/test organization.

### Tests First
- [ ] Step 4.1: Write failing diagnostics contract tests for compatibility reports, matrix metadata, and analyzer entry points.
  - Files: extend `tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`; create any new focused diagnostics fixtures under `examples/compatibility-fixtures/` or `tests/fixtures/` if the analyzer needs checked-in source inputs; update `Package.swift` only if a new SwiftPM test target becomes necessary.
  - Add failing assertions for a structured compatibility report value, a documented compatibility matrix surface, analyzer results for unsupported imports and symbols, and summary counts grouped by category or severity.
  - Keep the red-phase tests focused on deterministic public API shape and report contents rather than parser implementation details.
- [ ] Step 4.2: Write failing tests for the first supported compatibility fixture and adaptation guidance path.
  - Files: extend `tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift` or create a dedicated compatibility-mode contract suite under `tests/`; add representative Swift source fixtures that exercise both a supported SwiftUI-inspired subset and explicitly unsupported APIs.
  - Add one failing test that proves a narrow supported fixture can pass analysis without unsupported diagnostics and expose enough structured output to lower into the existing semantic tree/runtime model later in the phase.
  - Add one failing test that proves unsupported lifecycle hooks, platform APIs, or modifiers produce source-linked diagnostics with suggested strict-mode adaptations.

### Implementation
- [ ] Step 4.3: Define the diagnostics-core compatibility report, matrix, and analyzer contract types.
  - Files: expand `packages/diagnostics/Sources/DiagnosticsCore/` with value types for report summaries, diagnostic categories/severity, compatibility matrix entries, analyzer inputs, and analyzer outputs; update `Package.swift` only if target wiring changes are required.
  - Keep the surface value-oriented and deterministic. This step should establish the public contract without committing to a full parser architecture.
  - Next execution plan:
    - Add report and matrix types that make supported, partially supported, unsupported, and deferred compatibility areas explicit.
    - Define analyzer entry points that can accept Swift source text or fixture file paths and return structured diagnostics plus support summaries.
    - Keep adaptation guidance as project-owned suggestion text rather than opaque parser errors.
- [ ] Step 4.4: Implement a lightweight source analyzer for unsupported imports, symbols, modifiers, lifecycle hooks, and platform APIs.
  - Files: add analyzer implementation files under `packages/diagnostics/Sources/DiagnosticsCore/`; add checked-in Swift compatibility fixtures under `examples/compatibility-fixtures/` or `tests/fixtures/` as needed.
  - Start with deterministic source scanning for the first narrow slice rather than a broad compiler plugin or full AST integration.
  - The analyzer must report stable source locations and preserve enough context for later migration reporting.
  - Next execution plan:
    - Detect the first explicitly unsupported imports such as `UIKit` and other Apple-only framework entry points.
    - Detect a bounded set of unsupported symbols or modifiers that are outside the current strict-mode or compatibility subset.
    - Return grouped diagnostics with suggested strict-mode adaptations where the mapping is already clear.
- [ ] Step 4.5: Add the first supported SwiftUI-subset lowering or compatibility handoff path into the existing runtime model.
  - Files: modify `packages/swift-sdk/Sources/StrictModeSDK/`, `packages/runtime-host/Sources/RuntimeHost/`, and `packages/diagnostics/Sources/DiagnosticsCore/` only where needed to prove the supported subset path; add fixture sources under `examples/compatibility-fixtures/`.
  - Keep scope narrow: support only the smallest fixture subset that cleanly lowers into the existing semantic tree contract and can be defended by tests.
  - Do not widen into general SwiftUI coverage, UIKit shims, or transport work.
  - Next execution plan:
    - Choose one representative compatibility fixture that uses only supported subset primitives already close to the strict-mode model.
    - Reuse the existing semantic UI tree and runtime snapshot structures rather than inventing a second rendering model.
    - Fail closed when unsupported APIs are present so compatibility mode remains diagnostics-led.
- [ ] Step 4.6: Document the v1 compatibility matrix, limitations, and migration guidance.
  - Files: update `README.md`; add a dedicated compatibility document such as `docs/compatibility-matrix.md` if needed; expand `examples/compatibility-fixtures/README.md` or nearby fixture docs.
  - Document which imports, symbols, layouts, state primitives, and lifecycle hooks are supported, partially supported, unsupported, or deferred in Phase 4.
  - Include exact validation commands and explicit limitations so the compatibility lane does not overclaim simulator fidelity.

### Green
- [ ] Step 4.7: Add regression tests covering supported and unsupported compatibility fixtures.
  - Files: extend the diagnostics and runtime test suites created earlier; add fixture-specific assertions only where they improve acceptance coverage without overfitting to parser internals.
  - Cover one supported fixture that passes analysis and lowers into the shared runtime model, plus unsupported fixtures that produce stable source-linked diagnostics and adaptation guidance.
  - Keep assertions structural and deterministic: prefer import names, symbol names, categories, line/column data, and compact support summaries over large serialized reports.
- [ ] Step 4.8: Run the full validation surface for the Swift workspace plus any compatibility-specific tooling introduced in this phase.
  - Files: no intended source edits; update package scripts or config only if validation wiring is still missing after implementation.
  - Run `swift test`, `swift build`, and any compatibility-focused commands added during this phase. Re-run the browser renderer and automation SDK validation commands only if shared contracts or docs/examples they consume changed.
- [ ] Step 4.9: Refactor the compatibility and diagnostics boundary if needed while keeping the new tests green.
  - Re-read the diagnostics report types, supported subset handoff path, and any new compatibility fixtures before changing names or file boundaries.
  - Keep refactors limited to clarifying ownership between diagnostics analysis, supported-subset lowering, and the existing runtime contract. Do not widen scope into device simulation, network fixtures, or React Native evaluation.
  - Next execution plan:
    - Inspect `packages/diagnostics/Sources/DiagnosticsCore/`, the supported compatibility fixture path, and any runtime handoff helpers for duplicated semantics or confusing ownership.
    - If no meaningful simplification is justified, record Step 4.9 as an intentional no-op review rather than forcing churn.
    - If a narrow cleanup is justified, keep the write scope small and rerun only the affected validation commands before the final full pass.

### Milestone: M2 SwiftUI-Subset Compatibility Diagnostics
**Acceptance Criteria:**
- [ ] Compatibility mode can analyze a representative existing Swift codebase fixture.
- [ ] Unsupported Apple-only APIs produce structured diagnostics instead of crashes.
- [ ] Supported subset examples lower into the strict runtime model.
- [ ] The compatibility matrix documents supported, partially supported, unsupported, and deferred areas.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
