# Todo — iPhone Emulator Workspace

> Current phase: 10 of 10 — M9 Native Capability Automation and Agent Flows
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tdd

## Phase 10: M9 Native Capability Automation and Agent Flows

**Status:** planned.

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

### Execution Profile
**Parallel mode:** implementation-safe
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** capability contract coherence, deterministic behavior, tests, docs/API conformance, renderer UX

**Subagent lanes:**
- Lane: runtime-native-control-contract
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: define value-level runtime native control command/event contracts and keep them tied to deterministic `RuntimeNativeCapabilityState` records rather than host framework calls.
  - Owns: `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/**`, `packages/runtime-host/Sources/RuntimeHost/Automation/**`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`
  - Must not edit: `packages/automation-sdk/**`, `packages/browser-renderer/**`, `packages/diagnostics/**`, `docs/**`, `examples/**`, `tasks/**`
  - Depends on: Step 10.1
  - Deliverable: runtime contract patch and focused Swift validation output.
- Lane: automation-native-api
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: implement the high-level TypeScript `app.native.*` automation namespace, clone-safe native state mutations, event inspection, and artifacts.
  - Owns: `packages/automation-sdk/src/**`
  - Must not edit: `packages/runtime-host/**`, `packages/browser-renderer/**`, `packages/diagnostics/**`, `docs/**`, `examples/**`, `tasks/**`
  - Depends on: Step 10.1, Step 10.2
  - Deliverable: automation SDK patch and package validation output.
- Lane: native-agent-flow-preview
  - Agent: worker
  - Role: implementer
  - Mode: write
  - Scope: update browser preview, examples, and documentation so generated-app native mock flows match the SDK story without claiming live Swift or host native behavior.
  - Owns: `packages/browser-renderer/src/**`, `docs/**`, `README.md`, `examples/strict-mode-baseline/**`
  - Must not edit: `packages/runtime-host/**`, `packages/automation-sdk/**`, `packages/diagnostics/**`, `tasks/**`
  - Depends on: Step 10.3, Step 10.4, Step 10.5
  - Deliverable: renderer/docs/examples patch and validation output.

### Tests First
- [ ] Step 10.1: Write failing native automation API contracts for agent flows
  - Files: modify `packages/automation-sdk/src/index.test.ts`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where needed.
  - Add red-phase assertions for the future `app.native.*` namespace: permission snapshot/request/set controls; fixture-backed camera capture and photo picker selection controls; current/scripted location inspection and permission-denial behavior; clipboard read/write; file picker and share sheet records; notification authorization/schedule/delivery records; device environment snapshot controls; native event/artifact/log inspection after UI interaction; clone isolation; and absence of controls for fail-closed unsupported services such as biometrics, health, speech, sensors, and haptics.
  - Runtime red contract: name any value-level native automation command/event shapes needed to keep runtime and SDK vocabulary aligned, but do not require live host permission prompts, camera/photos/files/clipboard/sensors/haptics, live notification delivery, live network access, or the Apple simulator runtime.
  - SDK red contract: launch with the representative Phase 9 manifest, run a UI flow, use `app.native.permissions`, `app.native.camera`, `app.native.photos`, `app.native.location`, `app.native.clipboard`, `app.native.files`, `app.native.shareSheet`, `app.native.notifications`, and `app.native.device`, then assert session state, `nativeCapabilityEvents()`, and `artifacts.nativeCapabilityRecords` reflect deterministic changes.
  - Browser red contract: extend the illustrative preview/compiler tests only enough to prove the demo can show the same native flow story as the SDK, with stable `tree.nativePreview` values and `data-native-capability` cards.
  - Current context from Phase 9: `RuntimeNativeCapabilityManifest` remains declaration-only; `RuntimeNativeCapabilityState` derives deterministic mock state, logs, semantic metadata, artifact records, and normalized `inspectionEvents`; `RuntimeAutomationSession.nativeCapabilityEvents` now mirrors SDK-style `native.permission.*`, `native.fixture.*`, and `native.event.*` records; the TypeScript SDK exposes launch/session/event/artifact inspection but intentionally has no `app.native.*` namespace yet; browser renderer native preview is illustrative source lowering only.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`; failures are expected in this red phase and should be limited to the missing native automation controls or preview-flow symbols.

### Implementation
- [ ] Step 10.2: Add runtime native automation command and event contract values
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityState.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Define deterministic value records for native automation actions such as permission request/set, camera capture, photo selection, location update, clipboard read/write, file selection, share sheet completion, notification schedule/delivery, and device environment snapshot.
  - Implementation plan: keep these as runtime contract and state-transition records only. They must append inspectable native events/logs/artifacts and update semantic metadata where applicable, but must not invoke native frameworks or introduce live host behavior.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [ ] Step 10.3: Add the high-level `app.native.*` namespace to the automation SDK
  - Files: modify `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.ts`, and `packages/automation-sdk/src/index.test.ts`.
  - Add typed controller namespaces for `permissions`, `camera`, `photos`, `location`, `clipboard`, `files`, `shareSheet`, `notifications`, and `device`, with clone-safe return values and event/artifact updates.
  - Implementation plan: build on the existing in-memory `Emulator` session and Phase 9 launch manifest state. The namespace should mutate only deterministic SDK session state and records; live transport to a Swift host remains deferred until a later transport phase.
  - Validation focus: run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- [ ] Step 10.4: Implement permission, camera/photo, and location native controls
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.test.ts`, and runtime native contract files only if Step 10.2 leaves missing value shapes.
  - Add deterministic permission request/set behavior, camera capture fixture retrieval, photo picker selection retrieval, location snapshot/update scripting, and location permission denial records.
  - Implementation plan: derive defaults from `nativeCapabilities`, use manifest fixture identifiers as stable lookup keys, append normalized native events, and update artifacts without reading host camera, photo library, or location services.
  - Validation focus: run focused automation SDK tests and `swift test --filter RuntimeHostContractTests` if runtime files change.
- [ ] Step 10.5: Implement clipboard, file/share sheet, notifications, and device environment controls
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.test.ts`, and runtime native contract files only if Step 10.2 leaves missing value shapes.
  - Add deterministic clipboard read/write APIs, file picker selection inspection, share sheet completion inspection, notification authorization/schedule/delivery APIs, and device environment snapshot inspection.
  - Implementation plan: preserve Phase 9 artifact/log/event naming where possible. Unsupported sensor, haptic, health, speech, and biometric services should remain diagnostics/unsupported records, not high-level controls.
  - Validation focus: run focused automation SDK tests and `swift test --filter RuntimeHostContractTests` if runtime files change.
- [ ] Step 10.6: Update browser preview, docs, and examples for agent-native flows
  - Files: modify `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/demoProject.test.ts`, `packages/browser-renderer/src/renderTree.test.ts`, `examples/strict-mode-baseline/automation-example.ts`, `examples/strict-mode-baseline/README.md`, `docs/native-capabilities.md`, and `README.md`.
  - Demonstrate a representative agent flow that configures mocks, interacts with UI, uses `app.native.*`, inspects native events/artifacts, and stays honest about browser-only preview state.
  - Implementation plan: update the browser demo only as illustrative source lowering. Do not imply live Swift execution, real device behavior, or host native framework fidelity.
  - Validation focus: run browser renderer typecheck/test/build, automation SDK typecheck/test/build, and `npx tsx examples/strict-mode-baseline/automation-example.ts`.

### Green
- [ ] Step 10.7: Add end-to-end regression coverage for native agent workflows
  - Files: extend `packages/automation-sdk/src/index.test.ts`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts`.
  - Cover a representative strict-mode agent journey that combines UI interaction, network fixtures, native permission/camera/photo/location/clipboard/file/share/notification controls, semantic state inspection, logs, and artifact retrieval.
  - Include negative assertions that unsupported native services still fail closed and that the SDK does not silently invent controls for unsupported capability IDs.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`.
- [ ] Step 10.8: Run full validation across Swift, browser renderer, automation SDK, and examples
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run build`, and `npx tsx examples/strict-mode-baseline/automation-example.ts`.
  - Validation focus: inspect warnings as well as failures. Existing Vite large-chunk warnings for Monaco/editor assets can be accepted only if no renderer bundling behavior changed in this phase.
- [ ] Step 10.9: Refactor native automation boundaries if needed while keeping validation green
  - Files: modify runtime native contract types, automation SDK native controller helpers, browser preview helpers, docs, and examples only as needed.
  - Keep the high-level `app.native.*` controls separate from manifest declaration types, diagnostics guidance, and browser-only preview lowering.
  - Implementation plan: re-read the runtime native control values, SDK controller namespace, browser preview state, docs/examples, and unsupported diagnostics together. Only refactor if there is concrete duplication, type drift, hidden live-host behavior, or unclear API ownership.
  - Validation focus: reuse Step 10.8 validation after source changes. If the review is no-op, no validation rerun is required beyond documenting that Step 10.8 already proved the phase green.

### Milestone: M9 Native Capability Automation and Agent Flows
**Acceptance Criteria:**
- [ ] An agent can configure native mocks, run a flow, inspect capability state, and retrieve artifacts using the TypeScript SDK.
- [ ] Example flows cover at least camera/photo, location permission denial, clipboard, and notification scheduling.
- [ ] Browser demo and automation SDK tell the same story about capability state and semantic output.
- [ ] Full Swift, browser renderer, and automation SDK validation pass.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
