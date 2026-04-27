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
**Status:** current.

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

## Phase 6: M4 Reports, Migration Helpers, and React Native Evaluation

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

**Parallelization:** agent-team
**Coordination Notes:** This phase spans reports, migration strategy, and a separate runtime ecosystem. It is better suited to isolated worktrees or a dedicated agent team once the core harness is stable.
