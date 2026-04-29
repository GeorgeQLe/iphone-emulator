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
- [x] Step 9.3: Implement first runtime mocks for permissions, camera/photos, and location
  - Files: modify runtime native capability files under `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add deterministic permission state/prompt transitions, fixture-backed camera capture and photo picker outputs, and location state/scripted event handling.
  - Implementation plan: use manifest `requiredCapabilities`, `configuredMocks`, and `scriptedEvents` as the only service inputs. Unsupported or missing fixtures should produce structured runtime records and diagnostics-style adaptation text rather than falling back to host behavior.
  - Current context from Step 9.2: launch now derives `RuntimeNativeCapabilityState` from `RuntimeNativeCapabilityManifest`, exposes `nativeCapabilityState` and `nativeCapabilityEvents` on `RuntimeAutomationSession`, emits native capability log messages, adds `nativeCapabilityRecords` to `RuntimeArtifactBundle`, and mirrors selected native metadata onto the semantic root. This step should build on those records by modeling permission prompt/result transitions, camera/photo fixture output semantics, and location event handling without adding live host behavior or Phase 10 high-level SDK APIs.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [x] Step 9.4: Implement runtime mocks for clipboard, keyboard/input, files/share sheet, and notifications
  - Files: modify runtime native capability files under `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add deterministic clipboard read/write state, keyboard/input trait records, file picker and share sheet records, and local notification authorization/schedule/delivery records.
  - Implementation plan: preserve the Phase 8 boundary by implementing mock service records only, not native framework behavior. Reflect records through semantic state and artifacts where the existing runtime tree can represent them; otherwise keep them as inspectable native capability events.
  - Current context from Step 9.3: `RuntimeNativeCapabilityState` now exposes resolved permission prompt records, fixture-backed camera capture records, photo picker selection records, deterministic location state/scripted updates, diagnostic records for unsupported symbols and missing camera/photo fixtures, derived native logs, semantic metadata, and artifact records. Step 9.4 should extend the same manifest-derived state layer for clipboard, keyboard/input, files/share sheet, and notifications without adding live host framework behavior or Phase 10 high-level SDK controls.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
- [x] Step 9.5: Surface native mock state and events through the automation SDK
  - Files: modify `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/index.test.ts`, and package-local helper types only if extraction is warranted.
  - Mirror runtime native service state/event shapes, preserve configured launch mocks, expose deterministic native event inspection through session/artifact surfaces, and keep the SDK clone-isolation guarantees added in Phase 8.
  - Implementation plan: extend the in-memory `Emulator` with native mock state derived from `nativeCapabilities`, but do not add the final Phase 10 `app.native.*` control namespace yet. Keep launch inputs, session snapshots, artifacts, and native event records deeply cloned.
  - Current context from Step 9.4: the Swift runtime state now derives clipboard `initialText`/`currentText` plus read/write records from clipboard mocks and scripted events; keyboard input trait records from keyboard mocks; file selection `contentTypes` and `allowsMultipleSelection`; share sheet `completionState` and excluded activity types; and notification records with `authorizationState`, `body`, `trigger`, logs, artifacts, and semantic metadata. The SDK should mirror these as serializable session/artifact/inspection values from the existing TypeScript `nativeCapabilities` launch manifest, not by adding live native controls or the Phase 10 `app.native.*` API family.
  - Validation focus: run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
- [x] Step 9.6: Add browser preview UI for deterministic native capability states
  - Files: modify `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where preview behavior requires it.
  - Add preview states for permission prompts, camera/photo fixture outcomes, keyboard visibility/input traits, file/share sheet records, and notification records where applicable.
  - Implementation plan: keep browser preview behavior illustrative and deterministic. Reuse the existing semantic preview and artifact panels; avoid claiming live Swift execution or real native framework/device fidelity.
  - Current context from Step 9.5: the automation SDK now exports native capability state and record types, derives launch-time native mock state from `nativeCapabilities`, exposes `nativeCapabilityState` and `nativeCapabilityEvents` through cloned session inspection, includes `artifactBundle.nativeCapabilityRecords`, and adds `nativeCapabilityEvents()` without introducing the Phase 10 `app.native.*` control namespace. Browser preview work should consume the same manifest/state concepts for deterministic display only, not live native behavior.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
- [x] Step 9.7: Document first mock native services and update fixture examples
  - Files: update `README.md`, `docs/native-capabilities.md`, and `examples/strict-mode-baseline/README.md`; update `examples/strict-mode-baseline/automation-example.ts` only if the SDK example can demonstrate inspection without Phase 10 APIs.
  - Document supported mock services, manifest payload keys, deterministic defaults, event/artifact records, renderer preview behavior, and unsupported-service fail-closed behavior.
  - Implementation plan: distinguish the newly supported deterministic mock services from unsupported native framework fidelity. Include exact validation commands and keep the Phase 10 high-level automation API as future work.
  - Current context from Step 9.6: the browser renderer now has a `NativePreviewState` on `SemanticUITree`, the demo compiler extracts deterministic mock declarations such as `PermissionPrompt`, `CameraFixture`, `PhotoPickerFixture`, `LocationEvent`, `ClipboardFixture`, `KeyboardFixture`, `FilePickerFixture`, `ShareSheetFixture`, and `NotificationFixture`, and `mountRenderer` renders native preview cards with stable `data-native-capability` values for camera, photos, location, clipboard, keyboardInput, files, shareSheet, and notifications. The bundled browser demo source includes illustrative native mock declarations and the demo inspector includes the parsed `nativePreview`; this is browser-only preview state, not live Swift execution or host native framework behavior.
  - Validation focus: run package/type validation only if examples or code snippets change; otherwise docs-only validation can reuse the prior green source checks.

### Green
- [x] Step 9.8: Add regression coverage for native mock service flows
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `Tests/DiagnosticsCoreContractTests/DiagnosticsCoreContractTests.swift`, `packages/automation-sdk/src/index.test.ts`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts`.
  - Cover a representative strict-mode flow that configures permissions, camera/photo fixtures, location events, clipboard state, keyboard traits, file/share sheet records, and notification records, then inspects runtime logs, semantic state, artifact records, SDK snapshots, and renderer preview output.
  - Implementation plan: keep tests fixture-only and deterministic. Include unsupported native service assertions so new mocks do not weaken diagnostics fail-closed behavior.
  - Current context from Step 9.7: `docs/native-capabilities.md` now documents supported Phase 9 mock services, string payload keys, session/log/semantic/artifact inspection surfaces, browser preview declarations, and the deferred Phase 10 `app.native.*` boundary. The root README and `examples/strict-mode-baseline/automation-example.ts` include a representative manifest with camera prompt resolution, photo fixture output, initial and scripted location data, clipboard read/write events, keyboard traits, file picker and share sheet records, notification permission/scheduled/delivered events, and an unsupported biometric symbol. Use that manifest shape as the regression source of truth instead of inventing new live native behavior.
  - Runtime coverage plan: add one green test that launches the strict baseline fixture with the representative manifest and asserts resolved permission state, camera/photo fixture records, latest location metadata, clipboard current text, keyboard metadata, file/share sheet records, notification delivered state, native log names, `artifactBundle.nativeCapabilityRecords`, and semantic root metadata. Add or extend diagnostics coverage for unsupported native services such as biometric, health, speech, sensors, or haptics so fail-closed guidance remains intact.
  - Automation SDK coverage plan: add one green test that launches with the same representative manifest, mutates the original manifest after launch to verify clone isolation, inspects `session.nativeCapabilityState`, `session.nativeCapabilityEvents`, `app.nativeCapabilityEvents()`, and `artifacts.nativeCapabilityRecords`, and verifies no high-level `app.native` API exists.
  - Browser renderer coverage plan: add or extend demo compiler and renderer tests for the documented preview declarations, including stable `tree.nativePreview` values and rendered cards with `data-native-capability` values for `camera`, `photos`, `location`, `clipboard`, `keyboardInput`, `files`, `shareSheet`, and `notifications`.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`.
- [x] Step 9.9: Run full validation across Swift, browser renderer, and automation SDK
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
  - Current context from Step 9.8: representative native mock regression coverage now spans the Swift runtime contract, diagnostics fail-closed boundaries, automation SDK session/event/artifact inspection, and browser preview compiler/renderer output. The diagnostics analyzer also now explicitly maps `HKHealthStore.requestAuthorization` and `SFSpeechRecognizer.requestAuthorization` to unsupported fail-closed native capability guidance so health and speech APIs remain outside the Phase 9 mock contract. The focused Step 9.8 validation passed: `swift test --filter RuntimeHostContractTests`, `swift test --filter DiagnosticsCoreContractTests`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/browser-renderer test`, plus the two package `typecheck` commands.
  - Validation focus: inspect warnings as well as failures. Existing Vite large-chunk warnings for Monaco/editor assets can be accepted only if no renderer bundling behavior changed in this phase.
- [ ] Step 9.10: Refactor native mock service boundaries if needed while keeping validation green
  - Files: modify runtime native capability service types, automation SDK native service types, browser renderer native preview helpers, and docs only as needed.
  - Keep deterministic mock services separate from manifest declarations and from the Phase 10 high-level automation API namespace.
  - Implementation plan: re-read the runtime native service state, automation SDK state/inspection surface, browser preview state, diagnostics fail-closed behavior, and docs together. Only refactor if there is concrete duplication, type drift, premature Phase 10 API behavior, or accidental live host dependency.
  - Current context from Step 9.9: full validation passed with no source edits required. Commands run: `swift test` passed with 45 Swift tests, `swift build` passed, `npm --prefix packages/browser-renderer run typecheck` passed, `npm --prefix packages/browser-renderer test` passed with 9 tests, `npm --prefix packages/browser-renderer run build` passed, `npm --prefix packages/automation-sdk run typecheck` passed, `npm --prefix packages/automation-sdk test` passed with 8 tests, and `npm --prefix packages/automation-sdk run build` passed. The renderer build emitted Vite's existing large-chunk warning for Monaco/editor bundles; accepted as unchanged bundling behavior because Step 9.9 made no renderer source or build configuration changes.
  - Boundary review checklist: verify `RuntimeNativeCapabilityManifest` stays declaration-only; `RuntimeNativeCapabilityState` or equivalent owns derived deterministic mock records; runtime logs/artifact records are generated from fixture state, not host framework calls; automation SDK exposes launch/session/event/artifact inspection but no `app.native.*` controls; browser renderer preview state remains illustrative and deterministic; diagnostics continue to fail closed for unsupported native services such as biometrics, health, speech, sensors, and haptics.
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
