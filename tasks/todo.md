# Todo

## Priority Task Queue

- [x] `$ship-end --no-deploy` - configured `origin` and pushed the initial `main` commit to `https://github.com/GeorgeQLe/iphone-emulator.git` on 2026-04-27 14:22:55 EDT.
- [x] Phase 1 completed on 2026-04-27 after confirming the current `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore` package split is the smallest coherent scaffold and re-running `swift test` plus `swift build`.

## Phase 2: M1 UI Tree Engine and Browser Renderer
> Test strategy: tests-after

### Execution Profile
**Parallel mode:** research-only
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, docs/API conformance, UX

**Subagent lanes:**
- Lane: ui-tree-contract-research
  - Agent: explorer
  - Role: explorer
  - Mode: read-only
  - Scope: inspect the existing strict-mode SDK and runtime placeholders to recommend the narrowest semantic UI tree contract for Phase 2.
  - Depends on: none
  - Deliverable: a short contract recommendation covering tree nodes, stable identifiers, and runtime handoff boundaries.
- Lane: renderer-shell-research
  - Agent: explorer
  - Role: explorer
  - Mode: read-only
  - Scope: inspect the browser-renderer placeholder package and recommend the minimum shell structure needed for a deterministic iPhone-like surface in the browser.
  - Depends on: none
  - Deliverable: a short package-layout recommendation for the renderer shell, fixture bootstrapping, and semantic metadata hooks.

### Implementation
- [x] Step 2.1: Define the semantic UI tree contract shared by `StrictModeSDK`, `RuntimeHost`, and the renderer.
  - Files: create `packages/runtime-host/Sources/RuntimeHost/UITree/` types for semantic nodes, roles, view identifiers, navigation state, modal state, tab state, and alert payloads; modify `packages/swift-sdk/Sources/StrictModeSDK/` to introduce the minimum protocols or builders needed to lower strict-mode declarations into that tree.
  - Keep the contract narrow and deterministic. Prefer project-owned value types over early protocol abstraction so the renderer and automation work can share a stable serialized shape later.
  - Update `Package.swift` only if additional source folders or target dependencies are required; avoid introducing new packages in this phase.
- [x] Step 2.2: Connect the runtime host placeholder APIs to produce and retain semantic UI tree snapshots for strict-mode fixtures.
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/RuntimeAppLoader.swift`, `RuntimeTreeBridge.swift`, and related new support files under `packages/runtime-host/Sources/RuntimeHost/`.
  - Extend the compile-only placeholders into behavior-light fixtures that can load a known strict-mode app declaration, derive a semantic tree snapshot, and expose stable identifiers without adding protocol transport or automation concerns yet.
  - If the current `StrictModeSDK` skeleton needs additional compile-time hooks for fixture lowering, add the smallest surface necessary and keep the public API explicit.
  - Implementation plan:
    1. Add a typed runtime snapshot wrapper in `RuntimeHost` that stores `appIdentifier`, the current `SemanticUITree`, and any lightweight lifecycle metadata needed for fixture inspection.
    2. Replace the placeholder `RuntimeAppLoader` string-only shape with a generic or closure-based loader that can accept a strict-mode fixture app and immediately lower it through `App.makeSemanticTree(...)`.
    3. Replace the placeholder `RuntimeTreeBridge.lastRenderedTreeIdentifier` with retained tree snapshot state plus small query helpers for the latest root identifier, navigation state, modal state, and alert payload.
    4. Keep the implementation fixture-scoped: no JSON-RPC transport, no async session management, and no renderer coupling in this step.
    5. Add focused runtime-host tests for fixture loading and retained snapshot inspection before moving on to renderer work.
  - Completed on 2026-04-27 by adding `RuntimeTreeSnapshot`, rewriting `RuntimeAppLoader` around fixture-lowering closures to avoid package cycles, replacing `RuntimeTreeBridge` placeholder state with retained snapshot queries, and extending the runtime-host contract tests to cover strict-mode fixture loading plus snapshot inspection.
- [ ] Step 2.3: Build the browser renderer package shell that can render a semantic tree inside an iPhone-like browser frame.
  - Files: update `packages/browser-renderer/package.json`; create `packages/browser-renderer/src/` entry points, render helpers, styles, and fixture bootstrap code; add any local config files needed to run renderer tests or builds.
  - Focus on a deterministic shell with semantic markup for the currently supported primitives: text, button, text field, list, stacks, navigation, modal, tab view, and alerts.
  - Keep the visual system intentionally simple but structured so later device simulation and automation hooks can extend it without rewrites.
  - Implementation plan:
    1. Choose the smallest browser package toolchain that can expose repeatable local `build` and `test` commands from `packages/browser-renderer/package.json` without introducing a monorepo-wide frontend framework.
    2. Create a fixture bootstrap entry that imports a checked-in semantic tree fixture and mounts the renderer into a deterministic app root with viewport metadata for the eventual iPhone-like frame.
    3. Add renderer primitives and semantic markup for the currently supported UI tree roles, keeping styling and DOM structure stable enough for later snapshot-style assertions.
    4. Build the iPhone-like shell, including a constrained viewport, surface chrome, and semantic hooks that make renderer output inspectable without coupling to automation transport yet.
    5. Add at least one focused renderer test or smoke check in the selected toolchain before moving on to docs/examples in Step 2.4.
- [ ] Step 2.4: Add fixture examples and developer documentation for the Phase 2 rendering path.
  - Files: update `README.md`; expand `examples/strict-mode-baseline/`; add renderer usage notes under `examples/` or `docs/` if a new doc path is needed.
  - Document how a strict-mode fixture app flows from SDK declaration through runtime tree generation into the browser renderer, including current limitations and any manual steps needed to preview the renderer locally.

### Green
- [ ] Step 2.5: Add regression tests covering semantic tree generation and renderer output for a fixed strict-mode fixture.
  - Files: create `Tests/RuntimeHostSemanticTreeTests/` and any renderer-side tests under `packages/browser-renderer/` such as `src/**/*.test.ts` or the nearest conventional test path selected for the package.
  - Cover tree structure, stable semantic identifiers, navigation or modal state shape, and deterministic renderer output for a known fixture viewport.
  - Prefer snapshots or structured assertions that are stable under the intended Phase 2 renderer shell.
- [ ] Step 2.6: Run the full validation surface for the combined Swift and browser-renderer toolchains.
  - Files: no intended source edits; update package scripts or config only if validation wiring is still missing after implementation.
  - Run the relevant Swift and Node test/build commands selected by the implementation. Confirm the renderer package exposes repeatable local validation commands before closing the phase.
- [ ] Step 2.7: Refactor the UI tree and renderer boundary if needed while keeping the new tests green.
  - Re-read the semantic tree contract and renderer package entry points before changing names or file boundaries.
  - Keep refactors limited to simplifying the shared contract, reducing duplication, or clarifying ownership between runtime and renderer. Do not widen scope into automation protocol or compatibility analysis work.

### Milestone: M1 UI Tree Engine and Browser Renderer
**Acceptance Criteria:**
- [ ] A strict-mode fixture app can produce a semantic UI tree through the runtime host.
- [ ] The browser renderer displays the fixture app in an iPhone-like surface.
- [ ] Supported UI primitives render with stable structure and accessible semantic metadata.
- [ ] Renderer behavior is deterministic for a fixed fixture and viewport.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
