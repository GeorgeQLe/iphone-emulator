# Roadmap

## Phase 1: M0 Repo Scaffold and Strict Runtime Skeleton
**Status:** complete on 2026-04-27.

**Goal:** Establish the initial project structure and strict-mode foundation for the open-source iPhone-like Swift app harness.

**Scope:**
- Create the repository package layout for the Swift harness SDK, runtime host, diagnostics engine, browser renderer placeholder, TypeScript automation SDK placeholder, examples, and tests.
- Define the strict-mode Swift SDK skeleton for app declarations, scenes, basic views, navigation, and state entry points.
- Add the runtime host skeleton that can represent an app lifecycle and expose a future JSON-RPC/WebSocket boundary.
- Add the diagnostics skeleton for unsupported imports, symbols, and source-location reporting.
- Add baseline docs that explain the lawful positioning: iPhone-like harness, not iOS, UIKit, SwiftUI, WebKit, or Xcode Simulator.

**Acceptance Criteria:**
- The repo has a clear package layout for SDK, runtime, diagnostics, renderer, automation SDK, examples, and tests.
- Strict-mode SDK types compile or are represented by enforceable scaffolding with documented intended contracts.
- Runtime host and diagnostics modules have concrete entry points and tests or smoke checks appropriate for the chosen tooling.
- The project README states goals, non-goals, strict mode, compatibility mode, and open-source-only constraints.
- No compatibility shims beyond diagnostics skeleton are implemented in this phase.

**Parallelization:** serial
**Coordination Notes:** This phase defines shared package boundaries and naming conventions, so implementation should stay integrated until ownership surfaces are stable.

## Phase 2: M1 UI Tree Engine and Browser Renderer
**Status:** complete on 2026-04-27.

**Goal:** Turn strict-mode app declarations into a semantic UI tree and render that tree inside an iPhone-like browser surface.

**Scope:**
- Implement the initial UI tree model for text, image, button, text field, list, stack layouts, navigation stack, modal sheet, tab view, and alerts.
- Connect strict-mode SDK output to runtime UI tree updates.
- Build the browser renderer shell and render the supported UI tree primitives with approximate iPhone-like presentation.
- Add semantic identifiers and state snapshots that automation can consume later.

**Acceptance Criteria:**
- A strict-mode fixture app can produce a semantic UI tree through the runtime host.
- The browser renderer displays the fixture app in an iPhone-like surface.
- Supported UI primitives render with stable structure and accessible semantic metadata.
- Renderer behavior is deterministic for a fixed fixture and viewport.

**Parallelization:** implementation-safe
**Coordination Notes:** SDK/runtime UI tree work and browser renderer work can likely be separated by an explicit serialized UI tree contract. The contract itself is the shared chokepoint.

## Phase 3: M1 Automation SDK and Semantic Inspection
**Status:** complete on 2026-04-27.

**Goal:** Provide a Playwright-style TypeScript automation API over the runtime and renderer.

**Scope:**
- Define and implement the JSON-RPC/WebSocket automation protocol.
- Implement TypeScript SDK launch, close, tap, type/fill, swipe/scroll, wait, semantic tree inspection, screenshot placeholder or capture hook, and log collection.
- Add fixture-driven tests for representative user flows.
- Document automation API examples for strict-mode apps.

**Acceptance Criteria:**
- A TypeScript test can launch a fixture app and interact with supported UI primitives.
- Semantic queries can find elements by text, role, and stable identifiers.
- Automation commands update runtime state deterministically.
- Logs and semantic snapshots are available through the SDK.

**Parallelization:** research-only
**Coordination Notes:** Protocol shape, runtime behavior, SDK API, and test harness are tightly coupled. Parallel exploration can compare API designs, but implementation should remain integrated.

## Phase 4: M2 SwiftUI-Subset Compatibility Diagnostics
**Status:** complete on 2026-04-27.

**Goal:** Add best-effort compatibility handling for plain Swift logic and a documented SwiftUI-inspired subset, led by diagnostics rather than opaque failure.

**Scope:**
- Define the v1 SwiftUI-subset compatibility matrix.
- Implement source analysis for common unsupported imports, symbols, modifiers, lifecycle hooks, and platform APIs.
- Add initial source-level adapters only where they lower cleanly into the strict-mode UI tree.
- Produce structured diagnostics with file/line where possible and suggested harness adaptations.

**Acceptance Criteria:**
- Compatibility mode can analyze a representative existing Swift codebase fixture.
- Unsupported Apple-only APIs produce structured diagnostics instead of crashes.
- Supported subset examples lower into the strict runtime model.
- The compatibility matrix documents supported, partially supported, unsupported, and deferred areas.

**Parallelization:** research-only
**Coordination Notes:** Compatibility choices depend on strict runtime behavior and should avoid independent shim growth. Research can inventory likely SwiftUI subset APIs before implementation.

## Phase 5: M3 Agent Artifacts, Fixtures, and Device Simulation
**Status:** complete on 2026-04-28.

**Goal:** Make the harness useful for agent-driven testing through artifacts, network fixtures, and deterministic device simulation.

**Scope:**
- Add screenshots or rendered captures, semantic snapshots, logs, and HAR-like request records.
- Implement mocked HTTP routes and fixture responses.
- Add viewport sizes, dark/light mode, locale, clock, geolocation, and network state simulation.
- Expand example apps and tests around agent workflows.

**Acceptance Criteria:**
- Automation runs can produce screenshot/render artifacts, semantic snapshots, logs, and network request records.
- Network fixtures are deterministic and inspectable.
- Device simulation settings can be configured per launch and reflected in runtime behavior.
- Example agent workflows demonstrate form entry, navigation, state changes, and network mocking.

**Parallelization:** implementation-safe
**Coordination Notes:** Artifact capture, network fixtures, and device simulation can be owned separately if their runtime extension points are already stable.

> Test strategy: tdd

### Execution Profile
**Parallel mode:** implementation-safe
**Integration owner:** main agent
**Conflict risk:** medium
**Review gates:** correctness, tests, docs/API conformance, performance

**Subagent lanes:**
- Lane: artifact-contracts
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: define runtime artifact value types and Swift tests for screenshot/render metadata, semantic snapshots, logs, and HAR-like request records.
  - Owns: `packages/runtime-host/Sources/RuntimeHost/Artifacts/`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`
  - Must not edit: `packages/browser-renderer/**`, `packages/automation-sdk/**`, `tasks/**`
  - Depends on: none
  - Deliverable: runtime artifact contract patch and passing focused Swift tests.
- Lane: browser-renderer-artifacts
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: add browser renderer capture/fixture surfaces for deterministic render artifacts once the runtime artifact contract exists.
  - Owns: `packages/browser-renderer/src/**`, `packages/browser-renderer/test/**`, `packages/browser-renderer/package.json`
  - Must not edit: `packages/runtime-host/**`, `packages/automation-sdk/**`, `tasks/**`
  - Depends on: Step 5.2
  - Deliverable: renderer artifact patch and package validation output.
- Lane: automation-artifacts
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: expose artifact, network fixture, and device simulation controls through the TypeScript automation SDK after runtime contracts stabilize.
  - Owns: `packages/automation-sdk/src/**`, `packages/automation-sdk/test/**`, `packages/automation-sdk/package.json`
  - Must not edit: `packages/runtime-host/**`, `packages/browser-renderer/**`, `tasks/**`
  - Depends on: Step 5.2, Step 5.3, Step 5.4
  - Deliverable: automation SDK patch and package validation output.

### Tests First
- Step 5.1: Write failing contract tests for artifact records, network fixtures, and device simulation settings
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`; add TypeScript red-phase tests under `packages/automation-sdk/test/` only if the public SDK surface can be specified without implementation churn.
  - Add assertions for screenshot/render artifact metadata, semantic snapshot records, runtime log bundles, HAR-like request/response records, deterministic network fixture lookup, and launch-time device settings.
  - Keep the red phase focused on deterministic value shapes and fixture behavior rather than real browser screenshots or live network traffic.

### Implementation
- Step 5.2: Implement runtime artifact bundle and deterministic capture placeholders
  - Files: add `packages/runtime-host/Sources/RuntimeHost/Artifacts/RuntimeArtifactTypes.swift`; modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift` and `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`; extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Reuse existing semantic tree snapshots and log entries instead of inventing a parallel runtime record model.
- Step 5.3: Add network fixture and HAR-like request recording support in the runtime layer
  - Files: add `packages/runtime-host/Sources/RuntimeHost/Network/RuntimeNetworkFixture.swift`; modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`; extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`; add checked-in fixtures under `Tests/fixtures/network/` if useful.
  - Implement mocked route lookup and request/response records without live network calls.
- Step 5.4: Add launch-time device simulation settings to runtime sessions
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Cover viewport sizes, color scheme, locale, clock, geolocation, and network state as explicit value types.
- Step 5.5: Surface artifacts, network fixtures, and device settings in the TypeScript automation SDK
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/test/emulator.test.ts`, and related package-local types if present.
  - Extend the in-memory `Emulator` client with artifact retrieval, mocked route configuration, request-record inspection, and launch device options aligned with the runtime contracts.
- Step 5.6: Add browser renderer support for deterministic render artifact metadata
  - Files: modify `packages/browser-renderer/src/` renderer entry points and `packages/browser-renderer/test/` coverage; update renderer fixtures only if artifact state needs a checked-in semantic tree sample.
  - Produce deterministic render/capture metadata that can be consumed by the SDK without requiring native screenshot capture.
- Step 5.7: Expand examples and docs for agent artifact workflows
  - Files: update `README.md`; add or modify docs under `docs/`; extend `examples/strict-mode-baseline/automation-example.ts` or nearby example files.
  - Document screenshot/render placeholders, semantic snapshots, logs, network fixtures, and device settings with exact validation commands.

### Green
- Step 5.8: Add regression tests covering end-to-end artifact, network fixture, and device simulation flows
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/automation-sdk/test/emulator.test.ts`, and `packages/browser-renderer/test/` only where needed.
  - Cover a representative strict-mode automation flow that produces artifacts, records a mocked network interaction, and reflects launch device settings.
- Step 5.9: Run full validation across Swift, browser renderer, and automation SDK
  - Files: no intended source edits; update package scripts or config only if validation wiring is missing after implementation.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- Step 5.10: Refactor artifact, network, and device simulation boundaries if needed while keeping tests green
  - Re-read the runtime artifact types, network fixture records, automation SDK surface, and browser renderer metadata before changing file boundaries.

### Milestone: M3 Agent Artifacts, Fixtures, and Device Simulation
**Acceptance Criteria:**
- [ ] Automation runs can produce screenshot/render artifacts, semantic snapshots, logs, and network request records.
- [ ] Network fixtures are deterministic and inspectable.
- [ ] Device simulation settings can be configured per launch and reflected in runtime behavior.
- [ ] Example agent workflows demonstrate form entry, navigation, state changes, and network mocking.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no

## Phase 6: M4 Reports, Migration Helpers, and React Native Evaluation
**Status:** complete on 2026-04-28.

**Goal:** Improve compatibility reporting, provide migration guidance, and evaluate the deferred React Native compatibility lane.

**Scope:**
- Expand compatibility reports with summary output, actionable migration hints, and unsupported API grouping.
- Add helper docs or codemod-style suggestions for moving existing Swift code toward strict mode.
- Evaluate React Native feasibility against the stabilized runtime and renderer.
- Decide whether React Native should become a future implementation phase, remain deferred, or be dropped.

**Acceptance Criteria:**
- Compatibility reports are useful as product output for migration planning.
- Migration guidance maps unsupported APIs to strict SDK alternatives where practical.
- React Native evaluation covers JS runtime, native module mocking, renderer integration, automation reuse, and major risks.
- The roadmap is updated with the next appropriate phase or research direction after the evaluation.

**Post-Evaluation Decision:**
- React Native remains deferred research, not the next implementation phase.
- The next implementation direction remains strict-mode live runtime-to-renderer transport and session coordination.
- React Native should be reconsidered only after strict-mode live sessions prove one integrated loop for semantic tree updates, renderer updates, automation commands, artifacts, network fixtures, and device settings.
- A future React Native lane should start as a constrained adapter contract that lowers a small React Native-like subset into `SemanticUITree`, reuses the existing automation SDK semantics, routes JS network calls through deterministic fixtures, captures JS logs as runtime logs, and fails closed on unsupported native modules.

**Parallelization:** agent-team
**Coordination Notes:** This phase spans reports, migration strategy, and a separate runtime ecosystem. It is better suited to isolated worktrees or a dedicated agent team once the core harness is stable.

**On Completion:**
- Deviations from plan: Step 6.7 completed as an intentional no-op boundary review; no report, migration, React Native, or roadmap cleanup was needed beyond task archival.
- Tech debt / follow-ups: React Native remains deferred research until strict-mode live runtime-to-renderer transport and session coordination are stable.
- Ready for next phase: no further implementation phase is currently queued; refresh research/spec/task docs before adding new build phases.
