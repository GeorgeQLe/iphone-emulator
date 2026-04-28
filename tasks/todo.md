# Todo

## Priority Task Queue

- [x] `$ship-end --no-deploy` - configured `origin` and pushed the initial `main` commit to `https://github.com/GeorgeQLe/iphone-emulator.git` on 2026-04-27 14:22:55 EDT.
- [x] Phase 1 completed on 2026-04-27 after confirming the current `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore` package split is the smallest coherent scaffold and re-running `swift test` plus `swift build`.
- [x] Phase 2 completed on 2026-04-27 after aligning the renderer-side scene-kind contract with `RuntimeHost`, re-running the full Swift and browser-renderer validation surface, and confirming the UI tree and browser boundary needs no broader cleanup before automation work begins.
- [x] Phase 3 completed on 2026-04-27 after confirming the runtime automation value types and the in-memory automation SDK remain the smallest coherent pre-transport boundary, with the full Swift, renderer, and automation validation surface already green.
- [x] Phase 4 completed on 2026-04-27 after deriving compatibility previews from the runtime-lowered tree, confirming the diagnostics/runtime boundary remains clean, and re-running the Swift validation surface.

## Phase 5: M3 Agent Artifacts, Fixtures, and Device Simulation
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
- [x] Step 5.1: Write failing contract tests for artifact records, network fixtures, and device simulation settings.
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`; add TypeScript red-phase tests under `packages/automation-sdk/test/` only if the public SDK surface can be specified without implementation churn.
  - Add assertions for screenshot/render artifact metadata, semantic snapshot records, runtime log bundles, HAR-like request/response records, deterministic network fixture lookup, and launch-time device settings.
  - Keep the red phase focused on deterministic value shapes and fixture behavior rather than real browser screenshots or live network traffic.
  - Completed on 2026-04-27 with expected red-phase failures:
    - `swift test --filter RuntimeHostContractTests` fails on missing `RuntimeArtifactBundle`, render artifact, network fixture/request/response/record, device settings, artifact-bundle session, snapshot device, and network command symbols.
    - `npm --prefix packages/automation-sdk test` fails on the newly specified `app.route` API, while the existing representative SDK flow still passes.

### Implementation
- [ ] Step 5.2: Implement runtime artifact bundle and deterministic capture placeholders.
  - Files: add `packages/runtime-host/Sources/RuntimeHost/Artifacts/RuntimeArtifactTypes.swift`; modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift` and `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`; extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Reuse existing semantic tree snapshots and log entries instead of inventing a parallel runtime record model.
  - Artifact capture should remain deterministic placeholders until browser screenshot plumbing exists.
  - Next execution plan:
    - Add `RuntimeArtifactTypes.swift` with `RuntimeArtifactBundle`, `RuntimeRenderArtifactMetadata`, render kind, and `RuntimeSemanticSnapshotArtifact` matching the Step 5.1 red contract.
    - Add device value types in the runtime automation layer or a nearby runtime-owned file so artifact viewport metadata and launch settings share one `RuntimeDeviceViewport` model.
    - Extend `RuntimeAutomationSession` with `artifactBundle` and `device`, and extend `RuntimeTreeSnapshot` only if device metadata needs to be reflected in retained runtime state.
    - Extend `RuntimeAutomationLaunchConfiguration` with defaulted `device` and `networkFixtures` arguments to preserve existing launch call sites.
    - Update `RuntimeAutomationCoordinator` launch, screenshot, semantic snapshot, and log handling so the bundle records deterministic placeholder artifacts without attempting real screenshot capture.
    - Run `swift test --filter RuntimeHostContractTests`; expected progress is eliminating artifact/device compile errors while network command behavior may remain red until Step 5.3 if kept intentionally deferred.
- [ ] Step 5.3: Add network fixture and HAR-like request recording support in the runtime layer.
  - Files: add `packages/runtime-host/Sources/RuntimeHost/Network/RuntimeNetworkFixture.swift`; modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`; extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`; add checked-in fixtures under `Tests/fixtures/network/` if useful.
  - Implement mocked route lookup and request/response records without live network calls.
  - Preserve deterministic ordering and inspectable payload metadata for later reporting.
- [ ] Step 5.4: Add launch-time device simulation settings to runtime sessions.
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Cover viewport sizes, color scheme, locale, clock, geolocation, and network state as explicit value types.
  - Keep simulation as metadata reflected in runtime/session state; do not attempt real OS simulator behavior.
- [ ] Step 5.5: Surface artifacts, network fixtures, and device settings in the TypeScript automation SDK.
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/test/emulator.test.ts`, and related package-local types if present.
  - Extend the in-memory `Emulator` client with artifact retrieval, mocked route configuration, request-record inspection, and launch device options aligned with the runtime contracts.
  - Keep the API Playwright-style where the existing SDK already sets that precedent.
- [ ] Step 5.6: Add browser renderer support for deterministic render artifact metadata.
  - Files: modify `packages/browser-renderer/src/` renderer entry points and `packages/browser-renderer/test/` coverage; update renderer fixtures only if artifact state needs a checked-in semantic tree sample.
  - Produce deterministic render/capture metadata that can be consumed by the SDK without requiring native screenshot capture.
  - Keep the browser shell visual behavior stable for existing tests.
- [ ] Step 5.7: Expand examples and docs for agent artifact workflows.
  - Files: update `README.md`; add or modify docs under `docs/`; extend `examples/strict-mode-baseline/automation-example.ts` or nearby example files.
  - Document screenshot/render placeholders, semantic snapshots, logs, network fixtures, and device settings with exact validation commands.
  - Avoid claiming full simulator fidelity or production screenshot support.

### Green
- [ ] Step 5.8: Add regression tests covering end-to-end artifact, network fixture, and device simulation flows.
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/automation-sdk/test/emulator.test.ts`, and `packages/browser-renderer/test/` only where needed.
  - Cover a representative strict-mode automation flow that produces artifacts, records a mocked network interaction, and reflects launch device settings.
  - Keep assertions structural and deterministic.
- [ ] Step 5.9: Run full validation across Swift, browser renderer, and automation SDK.
  - Files: no intended source edits; update package scripts or config only if validation wiring is missing after implementation.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- [ ] Step 5.10: Refactor artifact, network, and device simulation boundaries if needed while keeping tests green.
  - Re-read the runtime artifact types, network fixture records, automation SDK surface, and browser renderer metadata before changing file boundaries.
  - Keep refactors limited to clarifying ownership between runtime state, renderer metadata, and SDK client APIs.

### Milestone: M3 Agent Artifacts, Fixtures, and Device Simulation
**Acceptance Criteria:**
- [ ] Automation runs can produce screenshot/render artifacts, semantic snapshots, logs, and network request records.
- [ ] Network fixtures are deterministic and inspectable.
- [ ] Device simulation settings can be configured per launch and reflected in runtime behavior.
- [ ] Example agent workflows demonstrate form entry, navigation, state changes, and network mocking.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet.
- Tech debt / follow-ups: none yet
- Ready for next phase: no
