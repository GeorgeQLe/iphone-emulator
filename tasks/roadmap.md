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

## Phase 7: M6 Browser IDE Demo and Interactive Preview Loop
**Status:** complete on 2026-04-29.

**Goal:** Turn the renderer demo into a credible browser-based IDE harness that shows the intended agent/codegen workflow.

**Scope:**
- Provide a Monaco-based mock project editor with strict-mode source, agent test code, and README context.
- Lower supported strict-mode declarations into a semantic UI tree for live preview.
- Make preview interactions stateful: text input, keyboard, buttons, focus, and semantic inspector updates.
- Show diagnostics and render/artifact metadata in the same browser surface.
- Keep the demo honest: source lowering is illustrative until the live Swift runtime transport exists.

**Acceptance Criteria:**
- A user can edit the mock strict-mode app and see the iPhone-like preview update.
- A user can interact with the preview and see semantic state/artifact metadata update.
- The demo distinguishes mocked source lowering from real Swift execution.
- Browser renderer typecheck, tests, and build pass.

**Parallelization:** serial
**Coordination Notes:** This phase touches the browser renderer entrypoint, demo styling, and semantic preview state. Keep implementation integrated until the demo interaction model stabilizes.

> Test strategy: tests-after

### Execution Profile
**Parallel mode:** serial
**Integration owner:** main agent
**Conflict risk:** medium
**Review gates:** correctness, tests, docs/API conformance, UX

**Subagent lanes:** none

### Implementation
- Step 7.1: Stabilize the browser IDE demo shell around the current renderer package
  - Files: modify `packages/browser-renderer/index.html`, `packages/browser-renderer/package.json`, `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/vite-env.d.ts`, `packages/browser-renderer/tsconfig.json`, `package-lock.json`
  - Ensure Monaco loads through Vite, the demo has a local `dev` script, file selection works, and the shell clearly presents editor, preview, diagnostics, and inspector panes.
- Step 7.2: Define the mock project and source-to-semantic lowering surface
  - Files: create or modify `packages/browser-renderer/src/demoProject.ts`
  - Represent mock strict-mode Swift, agent test, and README files; parse the supported illustrative declarations into `SemanticUITree`; produce diagnostics for unsupported framework imports and empty supported surfaces.
- Step 7.3: Make preview interactions stateful inside the iPhone-like renderer
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/styles.ts`, `packages/browser-renderer/src/demoStyles.ts`
  - Support editable text fields, focus styling, mock keyboard display, keyboard insert/delete/done behavior, and semantic inspector updates after input changes.
- Step 7.4: Keep the demo honest about mocked source lowering versus live Swift execution
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/demoStyles.ts`, `README.md` or `examples/strict-mode-baseline/README.md` if a doc note is needed
  - Surface copy or diagnostics that explain the demo is a browser IDE loop over illustrative strict-mode lowering until live Swift runtime transport exists.
- Step 7.5: Polish responsive layout and preview ergonomics
  - Files: modify `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/styles.ts`
  - Ensure the editor, preview, keyboard, diagnostics, and inspector remain usable on desktop and narrower viewports without overlapping content.

### Green
- Step 7.6: Write regression tests covering the demo compiler and interactive renderer behavior
  - Files: create or modify `packages/browser-renderer/src/demoProject.test.ts`, `packages/browser-renderer/src/renderTree.test.ts`, and only test helpers if needed
  - Cover semantic tree generation from the mock strict-mode source, unsupported import diagnostics, editable text field rendering, and keyboard/input state update behavior where practical in jsdom.
- Step 7.7: Run browser renderer validation
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring
  - Run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
- Step 7.8: Refactor demo boundaries if needed while keeping validation green
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/demoStyles.ts`, and `packages/browser-renderer/src/renderTree.ts` only as needed
  - Keep demo-specific code separated from reusable renderer behavior so later native capability phases can reuse the renderer contracts.

### Milestone: M6 Browser IDE Demo and Interactive Preview Loop
**Acceptance Criteria:**
- [ ] A user can edit the mock strict-mode app and see the iPhone-like preview update.
- [ ] A user can interact with the preview and see semantic state/artifact metadata update.
- [ ] The demo distinguishes mocked source lowering from real Swift execution.
- [ ] Browser renderer typecheck, tests, and build pass.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: Step 7.8 completed as an intentional no-op boundary review; no demo or renderer refactor was justified after the audit.
- Tech debt / follow-ups: live Swift runtime transport remains future work; the browser demo continues to label source lowering as illustrative.
- Ready for next phase: yes

## Phase 8: M7 Native Capability Registry and Manifest
**Status:** complete on 2026-04-29.

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

**Parallelization:** research-only
**Coordination Notes:** Capability taxonomy and diagnostics should be designed centrally before implementation splits by capability area.

**On Completion:**
- Deviations from plan: Step 8.8 completed as an intentional no-op boundary review; no runtime, diagnostics, SDK, renderer, or documentation source refactor was justified.
- Tech debt / follow-ups: concrete mock native service behavior remains intentionally deferred to Phase 9.
- Ready for next phase: yes

## Phase 9: M8 First Mock Native Services
**Status:** complete on 2026-04-29.

**Goal:** Implement the first useful deterministic native mocks for app flows that agents commonly need to exercise.

**Scope:**
- Add permission state and prompt simulation.
- Add fixture-backed camera capture and photo picker outputs.
- Add deterministic location state and scripted location events.
- Add clipboard, keyboard/input traits, file picker/share sheet records, and local notification scheduling records.
- Surface capability events through runtime logs, semantic state, and artifact bundles.
- Add browser preview UI for permission prompts, pickers, camera/photo outcomes, keyboard state, and notification records where applicable.

**Acceptance Criteria:**
- Strict-mode fixture apps can request supported native capabilities and receive deterministic mock results.
- Automation can configure mock state at launch and inspect capability events after interaction.
- Runtime artifacts include native capability logs and records.
- Unsupported native services still fail closed with diagnostics.

**Parallelization:** implementation-safe
**Coordination Notes:** Capability implementations can be split once the manifest and runtime event contracts are stable. Shared chokepoints are runtime capability types, automation SDK launch options, and renderer semantic UI effects.

> Test strategy: tdd

### Execution Profile
**Parallel mode:** implementation-safe
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** capability contract coherence, deterministic behavior, tests, docs/API conformance, renderer UX

**Subagent lanes:**
- Lane: runtime-native-services
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: implement runtime native capability state, permission/prompt simulation, mock service event records, artifact/log integration, and focused Swift tests after the red contracts exist.
  - Owns: `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/**`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`
  - Must not edit: `packages/automation-sdk/**`, `packages/browser-renderer/**`, `packages/diagnostics/**`, `docs/**`, `examples/**`, `tasks/**`
  - Depends on: Step 9.1
  - Deliverable: runtime native service implementation patch and focused Swift validation output.
- Lane: automation-native-services
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: expose configured native mock state and native event inspection through the TypeScript automation SDK without adding the final Phase 10 high-level `app.native.*` API family.
  - Owns: `packages/automation-sdk/src/**`
  - Must not edit: `packages/runtime-host/**`, `packages/browser-renderer/**`, `packages/diagnostics/**`, `docs/**`, `examples/**`, `tasks/**`
  - Depends on: Step 9.2, Step 9.3, Step 9.4
  - Deliverable: automation SDK patch and package validation output.
- Lane: renderer-native-preview
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: add browser demo preview states for deterministic permission prompts, pickers, camera/photo outcomes, keyboard state, and notification records using the existing semantic preview model.
  - Owns: `packages/browser-renderer/src/**`
  - Must not edit: `packages/runtime-host/**`, `packages/automation-sdk/**`, `packages/diagnostics/**`, `docs/**`, `examples/**`, `tasks/**`
  - Depends on: Step 9.2
  - Deliverable: browser renderer patch and package validation output.

### Tests First
- Step 9.1: Write failing native service contracts for permissions, fixture outputs, events, and artifacts
  - Files: modify `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`, `packages/automation-sdk/src/index.test.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where needed.
  - Add red-phase assertions for permission prompt state, deterministic camera/photo fixture outputs, scripted location events, clipboard state, keyboard/input traits, file/share sheet records, notification scheduling records, native capability event logs, artifact bundle records, SDK launch/inspection parity, renderer preview state, and diagnostics that still fail closed for unsupported native services.
  - Implementation plan: build directly on the Phase 8 manifest contracts. Tests should name the future runtime value types and SDK inspection shapes, but should not depend on host permissions, real camera/photos/files/clipboard/sensors/haptics, live notification delivery, or live network access. Keep Phase 10's high-level `app.native.*` API out of scope; this phase should prove configured mock services and event inspection through existing launch/session/artifact surfaces.
  - Current context from Phase 8: native capability manifest data lives in `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`, is carried through `RuntimeAutomationLaunchConfiguration` and `RuntimeAutomationSession`, is mirrored in `packages/automation-sdk/src/types.ts`, and is documented in `docs/native-capabilities.md`. Diagnostics native guidance already maps recognized native API requests to manifest fields and fails closed for unsupported biometrics.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`; failures are expected in this red phase and should be limited to missing native service state/API/preview symbols.

### Implementation
- Step 9.2: Add runtime native service state and event records
  - Files: create `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityState.swift` or equivalent; modify `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Define deterministic state and event records for permission prompts/results, fixture outputs, location updates, clipboard values, keyboard traits, file/share sheet selections, notification scheduling/delivery records, and capability artifact/log references.
  - Implementation plan: keep state serializable and fixture-backed. Derive initial state only from `RuntimeNativeCapabilityManifest` and launch configuration. Append native capability events to runtime logs and `RuntimeArtifactBundle` records without executing real native services.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- Step 9.3: Implement first runtime mocks for permissions, camera/photos, and location
  - Files: modify runtime native capability files under `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add deterministic permission state/prompt transitions, fixture-backed camera capture and photo picker outputs, and location state/scripted event handling.
  - Implementation plan: use manifest `requiredCapabilities`, `configuredMocks`, and `scriptedEvents` as the only service inputs. Unsupported or missing fixtures should produce structured runtime records and diagnostics-style adaptation text rather than falling back to host behavior.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- Step 9.4: Implement runtime mocks for clipboard, keyboard/input, files/share sheet, and notifications
  - Files: modify runtime native capability files under `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add deterministic clipboard read/write state, keyboard/input trait records, file picker and share sheet records, and local notification authorization/schedule/delivery records.
  - Implementation plan: preserve the Phase 8 boundary by implementing mock service records only, not native framework behavior. Reflect records through semantic state and artifacts where the existing runtime tree can represent them; otherwise keep them as inspectable native capability events.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- Step 9.5: Surface native mock state and events through the automation SDK
  - Files: modify `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/index.test.ts`, and package-local helper types only if extraction is warranted.
  - Mirror runtime native service state/event shapes, preserve configured launch mocks, expose deterministic native event inspection through session/artifact surfaces, and keep the SDK clone-isolation guarantees added in Phase 8.
  - Implementation plan: extend the in-memory `Emulator` with native mock state derived from `nativeCapabilities`, but do not add the final Phase 10 `app.native.*` control namespace yet. Keep launch inputs, session snapshots, artifacts, and native event records deeply cloned.
  - Validation focus: run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- Step 9.6: Add browser preview UI for deterministic native capability states
  - Files: modify `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where preview behavior requires it.
  - Add preview states for permission prompts, camera/photo fixture outcomes, keyboard visibility/input traits, file/share sheet records, and notification records where applicable.
  - Implementation plan: keep browser preview behavior illustrative and deterministic. Reuse the existing semantic preview and artifact panels; avoid claiming live Swift execution or real native framework/device fidelity.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
- Step 9.7: Document first mock native services and update fixture examples
  - Files: update `README.md`, `docs/native-capabilities.md`, and `examples/strict-mode-baseline/README.md`; update `examples/strict-mode-baseline/automation-example.ts` only if the SDK example can demonstrate inspection without Phase 10 APIs.
  - Document supported mock services, manifest payload keys, deterministic defaults, event/artifact records, renderer preview behavior, and unsupported-service fail-closed behavior.
  - Implementation plan: distinguish the newly supported deterministic mock services from unsupported native framework fidelity. Include exact validation commands and keep the Phase 10 high-level automation API as future work.
  - Validation focus: run package/type validation only if examples or code snippets change; otherwise docs-only validation can reuse the prior green source checks.

### Green
- Step 9.8: Add regression coverage for native mock service flows
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`, `packages/automation-sdk/src/index.test.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts`.
  - Cover a representative strict-mode flow that configures permissions, camera/photo fixtures, location events, clipboard state, keyboard traits, file/share sheet records, and notification records, then inspects runtime logs, semantic state, artifact records, SDK snapshots, and renderer preview output.
  - Implementation plan: keep tests fixture-only and deterministic. Include unsupported native service assertions so new mocks do not weaken diagnostics fail-closed behavior.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`.
- Step 9.9: Run full validation across Swift, browser renderer, and automation SDK
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
  - Validation focus: inspect warnings as well as failures. Existing Vite large-chunk warnings for Monaco/editor assets can be accepted only if no renderer bundling behavior changed in this phase.
- Step 9.10: Refactor native mock service boundaries if needed while keeping validation green
  - Files: modify runtime native capability service types, automation SDK native service types, browser renderer native preview helpers, and docs only as needed.
  - Keep deterministic mock services separate from manifest declarations and from the Phase 10 high-level automation API namespace.
  - Implementation plan: re-read the runtime native service state, automation SDK state/inspection surface, browser preview state, diagnostics fail-closed behavior, and docs together. Only refactor if there is concrete duplication, type drift, premature Phase 10 API behavior, or accidental live host dependency.
  - Validation focus: reuse Step 9.9 validation after source changes. If the review is no-op, no validation rerun is required beyond documenting that Step 9.9 already proved the phase green.

### Milestone: M8 First Mock Native Services
**Acceptance Criteria:**
- [x] Strict-mode fixture apps can request supported native capabilities and receive deterministic mock results.
- [x] Automation can configure mock state at launch and inspect capability events after interaction.
- [x] Runtime artifacts include native capability logs and records.
- [x] Unsupported native services still fail closed with diagnostics.
- [x] All phase tests pass.
- [x] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: Step 9.10 tightened Swift runtime native inspection events to match the SDK contract instead of remaining a no-op boundary review.
- Tech debt / follow-ups: implement the high-level `app.native.*` automation API and native capability agent flows in Phase 10.
- Ready for next phase: yes

## Phase 10: M9 Native Capability Automation and Agent Flows
**Status:** complete on 2026-04-30.

**Goal:** Make native capability simulation useful to agents through high-level automation APIs and end-to-end examples.

**Scope:**
- Add `app.native.*` automation APIs for permissions, camera/photos, location, clipboard, files, notifications, and device environment.
- Add agent workflow examples that combine UI interaction, native mocks, network fixtures, semantic inspection, and artifacts.
- Add tests for native capability setup, interaction, inspection, and unsupported diagnostics.
- Update docs to show how a browser IDE or agentic codegen tool should configure mocks for generated apps.

**Acceptance Criteria:**
- An agent can configure native mocks, run a flow, inspect capability state, and retrieve artifacts using the TypeScript SDK.
- Example flows cover at least camera/photo, location permission denial, clipboard, and notification scheduling.
- Browser demo and automation SDK tell the same story about capability state and semantic output.
- Full Swift, browser renderer, and automation SDK validation pass.

**Parallelization:** implementation-safe
**Coordination Notes:** SDK APIs, runtime records, and examples can be split by capability area after the shared manifest/event model is implemented.
