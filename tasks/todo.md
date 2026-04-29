# Todo — iPhone Emulator Workspace

> Current phase: 9 of 10 — M8 First Mock Native Services
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tdd

## Phase 9: M8 First Mock Native Services

**Status:** planned.

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
- [x] Step 9.1: Write failing native service contracts for permissions, fixture outputs, events, and artifacts
  - Files: modify `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`, `packages/automation-sdk/src/index.test.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where needed.
  - Add red-phase assertions for permission prompt state, deterministic camera/photo fixture outputs, scripted location events, clipboard state, keyboard/input traits, file/share sheet records, notification scheduling records, native capability event logs, artifact bundle records, SDK launch/inspection parity, renderer preview state, and diagnostics that still fail closed for unsupported native services.
  - Implementation plan: build directly on the Phase 8 manifest contracts. Tests should name the future runtime value types and SDK inspection shapes, but should not depend on host permissions, real camera/photos/files/clipboard/sensors/haptics, live notification delivery, or live network access. Keep Phase 10's high-level `app.native.*` API out of scope; this phase should prove configured mock services and event inspection through existing launch/session/artifact surfaces.
  - Current context from Phase 8: native capability manifest data lives in `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`, is carried through `RuntimeAutomationLaunchConfiguration` and `RuntimeAutomationSession`, is mirrored in `packages/automation-sdk/src/types.ts`, and is documented in `docs/native-capabilities.md`. Diagnostics native guidance already maps recognized native API requests to manifest fields and fails closed for unsupported biometrics.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`; failures are expected in this red phase and should be limited to missing native service state/API/preview symbols.

### Implementation
- [x] Step 9.2: Add runtime native service state and event records
  - Files: create `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityState.swift` or equivalent; modify `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Define deterministic state and event records for permission prompts/results, fixture outputs, location updates, clipboard values, keyboard traits, file/share sheet selections, notification scheduling/delivery records, and capability artifact/log references.
  - Implementation plan: keep state serializable and fixture-backed. Derive initial state only from `RuntimeNativeCapabilityManifest` and launch configuration. Append native capability events to runtime logs and `RuntimeArtifactBundle` records without executing real native services.
  - Current red context from Step 9.1: `RuntimeHostContractTests.runtimeNativeServiceRedContractExposesMockStateEventsAndArtifacts` now expects launched sessions to expose reflected `nativeCapabilityState` and `nativeCapabilityEvents`, artifact bundles to expose reflected `nativeCapabilityRecords`, runtime logs named `native.permission.camera.prompt`, `native.fixture.camera.front-camera-still`, `native.event.location.location-update`, and `native.event.notifications.notification-scheduled`, and semantic root metadata keys `native.camera.fixture`, `native.keyboard.focusedElementID`, and `native.notification.trip-reminder`. This step should satisfy the runtime red contract only; SDK event inspection, diagnostics unsupported-service mapping, and browser preview red tests remain later phase work.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [ ] Step 9.3: Implement first runtime mocks for permissions, camera/photos, and location
  - Files: modify runtime native capability files under `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add deterministic permission state/prompt transitions, fixture-backed camera capture and photo picker outputs, and location state/scripted event handling.
  - Implementation plan: use manifest `requiredCapabilities`, `configuredMocks`, and `scriptedEvents` as the only service inputs. Unsupported or missing fixtures should produce structured runtime records and diagnostics-style adaptation text rather than falling back to host behavior.
  - Current context from Step 9.2: launch now derives `RuntimeNativeCapabilityState` from `RuntimeNativeCapabilityManifest`, exposes `nativeCapabilityState` and `nativeCapabilityEvents` on `RuntimeAutomationSession`, emits native capability log messages, adds `nativeCapabilityRecords` to `RuntimeArtifactBundle`, and mirrors selected native metadata onto the semantic root. This step should build on those records by modeling permission prompt/result transitions, camera/photo fixture output semantics, and location event handling without adding live host behavior or Phase 10 high-level SDK APIs.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [ ] Step 9.4: Implement runtime mocks for clipboard, keyboard/input, files/share sheet, and notifications
  - Files: modify runtime native capability files under `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add deterministic clipboard read/write state, keyboard/input trait records, file picker and share sheet records, and local notification authorization/schedule/delivery records.
  - Implementation plan: preserve the Phase 8 boundary by implementing mock service records only, not native framework behavior. Reflect records through semantic state and artifacts where the existing runtime tree can represent them; otherwise keep them as inspectable native capability events.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [ ] Step 9.5: Surface native mock state and events through the automation SDK
  - Files: modify `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/index.test.ts`, and package-local helper types only if extraction is warranted.
  - Mirror runtime native service state/event shapes, preserve configured launch mocks, expose deterministic native event inspection through session/artifact surfaces, and keep the SDK clone-isolation guarantees added in Phase 8.
  - Implementation plan: extend the in-memory `Emulator` with native mock state derived from `nativeCapabilities`, but do not add the final Phase 10 `app.native.*` control namespace yet. Keep launch inputs, session snapshots, artifacts, and native event records deeply cloned.
  - Validation focus: run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- [ ] Step 9.6: Add browser preview UI for deterministic native capability states
  - Files: modify `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where preview behavior requires it.
  - Add preview states for permission prompts, camera/photo fixture outcomes, keyboard visibility/input traits, file/share sheet records, and notification records where applicable.
  - Implementation plan: keep browser preview behavior illustrative and deterministic. Reuse the existing semantic preview and artifact panels; avoid claiming live Swift execution or real native framework/device fidelity.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
- [ ] Step 9.7: Document first mock native services and update fixture examples
  - Files: update `README.md`, `docs/native-capabilities.md`, and `examples/strict-mode-baseline/README.md`; update `examples/strict-mode-baseline/automation-example.ts` only if the SDK example can demonstrate inspection without Phase 10 APIs.
  - Document supported mock services, manifest payload keys, deterministic defaults, event/artifact records, renderer preview behavior, and unsupported-service fail-closed behavior.
  - Implementation plan: distinguish the newly supported deterministic mock services from unsupported native framework fidelity. Include exact validation commands and keep the Phase 10 high-level automation API as future work.
  - Validation focus: run package/type validation only if examples or code snippets change; otherwise docs-only validation can reuse the prior green source checks.

### Green
- [ ] Step 9.8: Add regression coverage for native mock service flows
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`, `packages/automation-sdk/src/index.test.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts`.
  - Cover a representative strict-mode flow that configures permissions, camera/photo fixtures, location events, clipboard state, keyboard traits, file/share sheet records, and notification records, then inspects runtime logs, semantic state, artifact records, SDK snapshots, and renderer preview output.
  - Implementation plan: keep tests fixture-only and deterministic. Include unsupported native service assertions so new mocks do not weaken diagnostics fail-closed behavior.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`.
- [ ] Step 9.9: Run full validation across Swift, browser renderer, and automation SDK
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
  - Validation focus: inspect warnings as well as failures. Existing Vite large-chunk warnings for Monaco/editor assets can be accepted only if no renderer bundling behavior changed in this phase.
- [ ] Step 9.10: Refactor native mock service boundaries if needed while keeping validation green
  - Files: modify runtime native capability service types, automation SDK native service types, browser renderer native preview helpers, and docs only as needed.
  - Keep deterministic mock services separate from manifest declarations and from the Phase 10 high-level automation API namespace.
  - Implementation plan: re-read the runtime native service state, automation SDK state/inspection surface, browser preview state, diagnostics fail-closed behavior, and docs together. Only refactor if there is concrete duplication, type drift, premature Phase 10 API behavior, or accidental live host dependency.
  - Validation focus: reuse Step 9.9 validation after source changes. If the review is no-op, no validation rerun is required beyond documenting that Step 9.9 already proved the phase green.

### Milestone: M8 First Mock Native Services
**Acceptance Criteria:**
- [ ] Strict-mode fixture apps can request supported native capabilities and receive deterministic mock results.
- [ ] Automation can configure mock state at launch and inspect capability events after interaction.
- [ ] Runtime artifacts include native capability logs and records.
- [ ] Unsupported native services still fail closed with diagnostics.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
