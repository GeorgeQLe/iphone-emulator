# Todo

## Priority Task Queue

- [x] `$ship-end --no-deploy` - configured `origin` and pushed the initial `main` commit to `https://github.com/GeorgeQLe/iphone-emulator.git` on 2026-04-27 14:22:55 EDT.
- [x] Phase 1 completed on 2026-04-27 after confirming the current `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore` package split is the smallest coherent scaffold and re-running `swift test` plus `swift build`.
- [x] Phase 2 completed on 2026-04-27 after aligning the renderer-side scene-kind contract with `RuntimeHost`, re-running the full Swift and browser-renderer validation surface, and confirming the UI tree and browser boundary needs no broader cleanup before automation work begins.
- [x] Phase 3 completed on 2026-04-27 after confirming the runtime automation value types and the in-memory automation SDK remain the smallest coherent pre-transport boundary, with the full Swift, renderer, and automation validation surface already green.
- [x] Phase 4 completed on 2026-04-27 after deriving compatibility previews from the runtime-lowered tree, confirming the diagnostics/runtime boundary remains clean, and re-running the Swift validation surface.
- [x] Phase 5 completed on 2026-04-28 after confirming the runtime artifact/network/device value types, TypeScript automation SDK surface, and browser renderer DOM artifact metadata remain cleanly separated, with the full Swift, browser renderer, and automation SDK validation surface green.

## Phase 6: M4 Reports, Migration Helpers, and React Native Evaluation

**Goal:** Improve compatibility reporting, provide migration guidance, and evaluate the deferred React Native compatibility lane.

**Scope:**
- Expand compatibility reports with summary output, actionable migration hints, and unsupported API grouping.
- Add helper docs or codemod-style suggestions for moving existing Swift code toward strict mode.
- Evaluate React Native feasibility against the stabilized runtime and renderer.
- Decide whether React Native should become a future implementation phase, remain deferred, or be dropped.

**Acceptance Criteria:**
- [x] Compatibility reports are useful as product output for migration planning.
- [x] Migration guidance maps unsupported APIs to strict SDK alternatives where practical.
- [x] React Native evaluation covers JS runtime, native module mocking, renderer integration, automation reuse, and major risks.
- [x] The roadmap is updated with the next appropriate phase or research direction after the evaluation.

**Parallelization:** serial
**Coordination Notes:** This phase was originally scoped for an agent team, but the current execution environment is running it serially. Keep each step narrow, finish the diagnostics/reporting surface before documentation, and treat React Native as a written evaluation unless the roadmap is explicitly changed.

> Test strategy: tdd

### Execution Profile
**Parallel mode:** serial
**Integration owner:** main agent
**Conflict risk:** medium
**Review gates:** report usefulness, migration guidance quality, React Native feasibility rigor, roadmap accuracy

### Tests First
- [x] Step 6.1: Write failing compatibility report contract tests for migration-ready output.
  - Files: extend `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`; add or update compatibility fixtures under `Tests/fixtures/compatibility/` only if the tests need clearer unsupported API examples.
  - Specify report-level output for migration planning: grouped unsupported imports/symbols/platform APIs/lifecycle hooks/modifiers, severity totals, support-level summaries, and actionable strict-mode adaptation hints.
  - Keep the red phase focused on value shapes and deterministic ordering, not CLI rendering or full codemod behavior.
  - Expected validation: `swift test --filter DiagnosticsCoreContractTests` should fail on missing report fields or helper APIs only.

### Implementation
- [x] Step 6.2: Implement expanded compatibility report summaries and grouped diagnostics.
  - Files: modify `packages/diagnostics/Sources/DiagnosticsCore/DiagnosticsTypes.swift` and focused diagnostics tests.
  - Preserve existing analyzer behavior while adding deterministic report fields for grouped unsupported APIs, migration hints, and summary totals.
  - Avoid adding a command-line reporter in this step unless the tests prove the core value surface needs it.
  - Run `swift test --filter DiagnosticsCoreContractTests`, then `swift test` and `swift build` if shared diagnostics types changed.

- [x] Step 6.3: Add strict-mode migration guidance docs.
  - Files: update `README.md` only if it needs a short pointer; add or update focused docs under `docs/`.
  - Map common unsupported Swift/SwiftUI patterns to current strict-mode SDK alternatives: app lifecycle, views, navigation, state, unsupported platform APIs, and deterministic fixtures.
  - Be explicit about non-goals: no UIKit/SwiftUI/WebKit/Xcode Simulator compatibility and no native-device fidelity.
  - Run validation relevant to docs and examples; at minimum run `swift test --filter DiagnosticsCoreContractTests` if docs reference generated or tested diagnostics fields.
  - Implementation plan:
    1. Re-read the compatibility matrix/docs and current `CompatibilityReport` value surface so the guidance uses only implemented diagnostics fields.
    2. Add a focused `docs/strict-mode-migration.md` covering unsupported imports, symbols, platform APIs, lifecycle hooks, modifiers, supported strict-mode alternatives, and deterministic fixture guidance.
    3. Add a short README pointer only if the current README lacks a discoverable compatibility/migration docs link.
    4. Validate documentation references against the tested diagnostics fields with `swift test --filter DiagnosticsCoreContractTests`; run broader Swift validation only if examples or public type names change.

- [x] Step 6.4: Evaluate React Native feasibility against the stabilized runtime.
  - Files: add a focused evaluation document under `docs/`; update `tasks/roadmap.md` only if the evaluation changes the next planned direction.
  - Cover JS runtime needs, native module mocking, renderer integration, semantic tree reuse, automation SDK reuse, network/device/artifact compatibility, packaging complexity, and major risks.
  - Decide one of: future implementation phase, deferred research, or dropped from near-term scope.
  - Keep this as product/architecture evaluation; do not scaffold React Native runtime code in this step.
  - Implementation plan:
    1. Re-read `README.md`, `docs/compatibility-matrix.md`, `docs/strict-mode-migration.md`, the runtime semantic tree and automation artifact types, browser renderer fixture/render artifact helpers, and automation SDK public surface.
    2. Add `docs/react-native-feasibility.md` with sections for JS runtime strategy, native module mocking, renderer integration, semantic tree reuse, automation SDK reuse, network/device/artifact compatibility, packaging complexity, risks, and recommendation.
    3. Keep the recommendation product/architecture-only: choose future implementation phase, deferred research, or dropped near-term scope without adding React Native runtime code.
    4. Update `tasks/roadmap.md` only if the recommendation changes the planned direction or adds/removes a future phase.
    5. Validate docs against current implemented contracts; run `swift test --filter DiagnosticsCoreContractTests` if the evaluation references compatibility report fields, and run broader validation only if public type names or examples change.

- [x] Step 6.5: Update roadmap with the post-evaluation decision.
  - Files: modify `tasks/roadmap.md` and `tasks/todo.md`; optionally update `README.md` if the project positioning changes.
  - Record whether React Native becomes a later phase, remains deferred, or is explicitly dropped.
  - Ensure the roadmap's next phase or research direction matches the evaluation document.
  - Implementation plan:
    1. Re-read `docs/react-native-feasibility.md`, the Phase 6 acceptance criteria in `tasks/todo.md`, and the future-phase section of `tasks/roadmap.md`.
    2. Update `tasks/roadmap.md` so the project direction explicitly reflects the Step 6.4 decision: React Native remains deferred as a later research/adapter lane until strict-mode live transport and session coordination are stable.
    3. If the roadmap's next planned phase already points at strict-mode transport/session work, preserve that direction and add only the minimum note needed to prevent React Native from being treated as immediate scope.
    4. Update `tasks/todo.md` to mark this step complete and keep the Phase 6 acceptance criteria aligned with the roadmap decision.
    5. Update `README.md` only if the roadmap decision changes user-facing project positioning; otherwise leave product docs untouched.
    6. Run docs/task validation by inspecting the changed roadmap/todo diff. Run code validation only if public examples, package names, or code references change.

### Green
- [x] Step 6.6: Run full validation across Swift, browser renderer, and automation SDK.
  - Files: no intended source edits; update validation wiring only if a missing script blocks verification.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
  - Inspect output for warnings and either fix, explicitly accept, or report them.

- [x] Step 6.7: Refactor report, docs, and roadmap boundaries if needed while keeping tests green.
  - Re-read the diagnostics report types, migration guidance docs, React Native evaluation, and roadmap decision together.
  - Keep this an intentional no-op if the final split is clear; otherwise apply only narrow naming, organization, or duplicate-content cleanup.
  - Rerun any affected focused validation, then rerun the full Step 6.6 validation surface before marking the phase complete.
  - Implementation plan:
    1. Re-read `packages/diagnostics/Sources/DiagnosticsCore/DiagnosticsTypes.swift`, `docs/strict-mode-migration.md`, `docs/react-native-feasibility.md`, the Phase 6 roadmap section, and the Phase 6 checklist together.
    2. Decide whether the compatibility report value surface, migration guidance, React Native evaluation, and roadmap decision are already cleanly separated. Treat the step as an intentional no-op if there is no real naming, organization, or duplication issue.
    3. If cleanup is justified, keep edits narrow and limited to report/docs/task boundary clarity; do not add new compatibility analyzer behavior, CLI rendering, codemods, or React Native runtime scaffolding in this step.
    4. Run focused validation for any changed surface first, then rerun the full Step 6.6 validation surface before marking the step complete.

**On Completion:**
- Deviations from plan: Step 6.7 was an intentional no-op after re-reading the diagnostics report types, migration guide, React Native feasibility evaluation, and roadmap decision together; the boundaries were already clean.
- Tech debt / follow-ups: React Native remains deferred until strict-mode live transport and session coordination are stable.
- Ready for next phase: no further implementation phases are currently queued in `tasks/roadmap.md`; run the priority documentation queue before planning new build work.
