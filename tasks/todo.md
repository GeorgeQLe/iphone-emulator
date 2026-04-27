# Todo

## Priority Task Queue

- [ ] `$ship-end --no-deploy` - configure a Git remote and push the initial `main` commit before continuing task work because `git remote -v` returned no remotes after initial commit creation on 2026-04-27 14:17:17 EDT.

## Phase 1: M0 Repo Scaffold and Strict Runtime Skeleton
> Test strategy: tdd

### Execution Profile
**Parallel mode:** serial
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, docs/API conformance

**Subagent lanes:** none

### Tests First
- Step 1.1: Create failing scaffold validation tests for the expected repository layout and package manifests.
  - Files: create `tests/scaffold.test.*` or the nearest conventional test path after selecting the project test runner.
  - Cover required directories for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
  - Cover required package or workspace manifest presence.
  - Tests MUST fail before the scaffold exists.
- Step 1.2: Create failing tests for the strict-mode SDK contract skeleton.
  - Files: create tests under the SDK package test path selected in Step 1.1.
  - Cover app declaration, scene, text, button, text field, list, stack layout, navigation, modal, tab, alert, and state entry-point symbols.
  - Tests MUST fail until SDK symbols exist.
- Step 1.3: Create failing tests for runtime host and diagnostics entry points.
  - Files: create tests under runtime and diagnostics package test paths.
  - Cover app lifecycle entry points, future protocol boundary placeholder, unsupported import diagnostics, unsupported symbol diagnostics, and source-location shape.
  - Tests MUST fail until runtime and diagnostics skeletons exist.

### Implementation
- Step 1.4: Select and add the root workspace/package structure for this multi-language harness.
  - Files: create root package/workspace manifest files, `README.md`, and package directories for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
- Step 1.5: Implement the strict-mode Swift SDK skeleton.
  - Files: create SDK package source files for app declarations, scenes, core views, navigation primitives, state primitives, and public API exports.
- Step 1.6: Implement the runtime host skeleton.
  - Files: create runtime package source files for lifecycle, app loading placeholder, UI tree handoff placeholder, logs, and future JSON-RPC/WebSocket boundary.
- Step 1.7: Implement the diagnostics skeleton.
  - Files: create diagnostics package source files for unsupported import reports, unsupported symbol reports, source-location data structures, and suggested adaptation messages.
- Step 1.8: Add baseline docs and examples for positioning and strict-mode usage.
  - Files: update `README.md`; create example strict-mode app files and docs explaining goals, non-goals, strict mode, compatibility mode, and open-source-only constraints.

### Green
- Step 1.9: Run the selected test suite and verify all Phase 1 tests pass.
- Step 1.10: Run formatting, linting, or build checks available for the chosen toolchain.
- Step 1.11: Refactor names and package boundaries if needed while keeping tests green.

### Milestone: M0 Repo Scaffold and Strict Runtime Skeleton
**Acceptance Criteria:**
- [ ] The repo has a clear package layout for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
- [ ] Strict-mode SDK types compile or are represented by enforceable scaffolding with documented intended contracts.
- [ ] Runtime host and diagnostics modules have concrete entry points and tests or smoke checks appropriate for the chosen tooling.
- [ ] The project README states goals, non-goals, strict mode, compatibility mode, and open-source-only constraints.
- [ ] No compatibility shims beyond diagnostics skeleton are implemented in this phase.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
