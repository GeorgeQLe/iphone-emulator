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

**Parallelization:** agent-team
**Coordination Notes:** This phase spans reports, migration strategy, and a separate runtime ecosystem. It is better suited to isolated worktrees or a dedicated agent team once the core harness is stable.

> Test strategy: tdd

### Execution Profile
**Parallel mode:** agent-team
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** report usefulness, migration guidance quality, React Native feasibility rigor, roadmap accuracy

**Agent-team lanes:**
- Lane: compatibility-reporting
  - Scope: expand diagnostics report output and tests around summaries, grouped unsupported APIs, and actionable migration hints.
  - Candidate owns: `packages/diagnostics/**`, `Tests/DiagnosticsCoreContractTests/**`, compatibility docs.
- Lane: migration-guidance
  - Scope: document strict-mode migration helpers and mappings from unsupported Swift/SwiftUI patterns to harness alternatives.
  - Candidate owns: `docs/**`, `README.md`, `Tests/fixtures/compatibility/**` only if fixtures are needed.
- Lane: react-native-evaluation
  - Scope: research and document React Native feasibility across JS runtime, native module mocking, renderer integration, automation reuse, and major risks.
  - Candidate owns: evaluation docs and roadmap recommendations.

### Next Local Action
- [ ] Step 6.1: Run this phase in isolated worktrees or a dedicated agent team.
  - This phase should not be executed in one shared local tree because its execution profile is `agent-team`.
  - Before implementation, create a file-level plan that assigns disjoint ownership for compatibility reporting, migration guidance, and React Native evaluation lanes.
  - Keep main-agent responsibilities limited to integration, final validation, task docs, history, and shipping.

**On Completion:**
- Deviations from plan: none yet.
- Tech debt / follow-ups: none yet.
- Ready for next phase: no.
