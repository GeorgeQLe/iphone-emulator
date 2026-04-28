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
- [ ] Compatibility reports are useful as product output for migration planning.
- [ ] Migration guidance maps unsupported APIs to strict SDK alternatives where practical.
- [ ] React Native evaluation covers JS runtime, native module mocking, renderer integration, automation reuse, and major risks.
- [ ] The roadmap is updated with the next appropriate phase or research direction after the evaluation.

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
- [ ] Step 6.2: Implement expanded compatibility report summaries and grouped diagnostics.
  - Files: modify `packages/diagnostics/Sources/DiagnosticsCore/DiagnosticsTypes.swift` and focused diagnostics tests.
  - Preserve existing analyzer behavior while adding deterministic report fields for grouped unsupported APIs, migration hints, and summary totals.
  - Avoid adding a command-line reporter in this step unless the tests prove the core value surface needs it.
  - Run `swift test --filter DiagnosticsCoreContractTests`, then `swift test` and `swift build` if shared diagnostics types changed.

- [ ] Step 6.3: Add strict-mode migration guidance docs.
  - Files: update `README.md` only if it needs a short pointer; add or update focused docs under `docs/`.
  - Map common unsupported Swift/SwiftUI patterns to current strict-mode SDK alternatives: app lifecycle, views, navigation, state, unsupported platform APIs, and deterministic fixtures.
  - Be explicit about non-goals: no UIKit/SwiftUI/WebKit/Xcode Simulator compatibility and no native-device fidelity.
  - Run validation relevant to docs and examples; at minimum run `swift test --filter DiagnosticsCoreContractTests` if docs reference generated or tested diagnostics fields.

- [ ] Step 6.4: Evaluate React Native feasibility against the stabilized runtime.
  - Files: add a focused evaluation document under `docs/`; update `tasks/roadmap.md` only if the evaluation changes the next planned direction.
  - Cover JS runtime needs, native module mocking, renderer integration, semantic tree reuse, automation SDK reuse, network/device/artifact compatibility, packaging complexity, and major risks.
  - Decide one of: future implementation phase, deferred research, or dropped from near-term scope.
  - Keep this as product/architecture evaluation; do not scaffold React Native runtime code in this step.

- [ ] Step 6.5: Update roadmap with the post-evaluation decision.
  - Files: modify `tasks/roadmap.md` and `tasks/todo.md`; optionally update `README.md` if the project positioning changes.
  - Record whether React Native becomes a later phase, remains deferred, or is explicitly dropped.
  - Ensure the roadmap's next phase or research direction matches the evaluation document.

### Green
- [ ] Step 6.6: Run full validation across Swift, browser renderer, and automation SDK.
  - Files: no intended source edits; update validation wiring only if a missing script blocks verification.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
  - Inspect output for warnings and either fix, explicitly accept, or report them.

- [ ] Step 6.7: Refactor report, docs, and roadmap boundaries if needed while keeping tests green.
  - Re-read the diagnostics report types, migration guidance docs, React Native evaluation, and roadmap decision together.
  - Keep this an intentional no-op if the final split is clear; otherwise apply only narrow naming, organization, or duplicate-content cleanup.
  - Rerun any affected focused validation, then rerun the full Step 6.6 validation surface before marking the phase complete.

**On Completion:**
- Deviations from plan: none yet.
- Tech debt / follow-ups: Step 6.2 must implement the red-phase `CompatibilityReport` surface now specified by Step 6.1: `summary.affectedFileCount`, `summary.countsBySupportLevel`, deterministic `unsupportedGroups`, and `migrationSummary` next actions.
- Ready for next phase: no.
