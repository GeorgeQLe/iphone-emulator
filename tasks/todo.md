# Todo — iPhone Emulator Workspace

> Current phase: 10 of 10 — M9 Native Capability Automation and Agent Flows
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tdd

## Priority Documentation Todo

- [x] `$devtool-integration-map` - created `research/devtool-integration-map.md` because the enabled devtool pack expected this research output and it was missing.
- [x] `$devtool-dx-journey` - created `research/devtool-dx-journey.md` because the enabled devtool pack expected this research output and it was missing.
- [x] `$devtool-adoption` - created `research/devtool-adoption.md` because the enabled devtool pack expected this research output and it was missing.
- [x] `$devtool-positioning` - created `research/devtool-positioning.md` because the enabled devtool pack expected this research output and it was missing.
- [x] `$devtool-monetization` - created `research/devtool-monetization.md` because the enabled devtool pack expected this research output and it was missing.
- [x] `$spec-drift fix all` - reconciled `specs/open-source-iphone-emulator.md` because the latest implementation commit was newer than the spec (`2026-04-30 10:33:56 -0400` vs `2026-04-28 15:43:06 -0400`).
- [x] Add README first-green-run and current-packaging language so the free local harness value is obvious and bounded.
- [x] Add a CI fixture recipe with artifact retention guidance as the first team-conversion proof.

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
- [x] Step 10.1: Write failing native automation API contracts for agent flows
  - Files: modify `packages/automation-sdk/src/index.test.ts`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts` only where needed.
  - Add red-phase assertions for the future `app.native.*` namespace: permission snapshot/request/set controls; fixture-backed camera capture and photo picker selection controls; current/scripted location inspection and permission-denial behavior; clipboard read/write; file picker and share sheet records; notification authorization/schedule/delivery records; device environment snapshot controls; native event/artifact/log inspection after UI interaction; clone isolation; and absence of controls for fail-closed unsupported services such as biometrics, health, speech, sensors, and haptics.
  - Runtime red contract: name any value-level native automation command/event shapes needed to keep runtime and SDK vocabulary aligned, but do not require live host permission prompts, camera/photos/files/clipboard/sensors/haptics, live notification delivery, live network access, or the Apple simulator runtime.
  - SDK red contract: launch with the representative Phase 9 manifest, run a UI flow, use `app.native.permissions`, `app.native.camera`, `app.native.photos`, `app.native.location`, `app.native.clipboard`, `app.native.files`, `app.native.shareSheet`, `app.native.notifications`, and `app.native.device`, then assert session state, `nativeCapabilityEvents()`, and `artifacts.nativeCapabilityRecords` reflect deterministic changes.
  - Browser red contract: extend the illustrative preview/compiler tests only enough to prove the demo can show the same native flow story as the SDK, with stable `tree.nativePreview` values and `data-native-capability` cards.
  - Current context from Phase 9: `RuntimeNativeCapabilityManifest` remains declaration-only; `RuntimeNativeCapabilityState` derives deterministic mock state, logs, semantic metadata, artifact records, and normalized `inspectionEvents`; `RuntimeAutomationSession.nativeCapabilityEvents` now mirrors SDK-style `native.permission.*`, `native.fixture.*`, and `native.event.*` records; the TypeScript SDK exposes launch/session/event/artifact inspection but intentionally has no `app.native.*` namespace yet; browser renderer native preview is illustrative source lowering only.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`; failures are expected in this red phase and should be limited to the missing native automation controls or preview-flow symbols.
  - Status: completed on 2026-04-29 as a red phase. Added runtime contract coverage for `RuntimeNativeAutomationAction`, `RuntimeAutomationCommand.nativeAutomation`, and `RuntimeAutomationResponse.Result.nativeCapabilityEvents`; SDK coverage for future `app.native.*` agent workflow controls and clone isolation; and browser compiler/renderer coverage for native agent flow preview state, device environment cards, and unsupported-control cards.
  - Validation: `swift test --filter RuntimeHostContractTests` fails as expected on missing `RuntimeNativeAutomationAction`, `RuntimeAutomationCommand.nativeAutomation`, and `RuntimeAutomationResponse.Result.nativeCapabilityEvents`; `npm --prefix packages/automation-sdk test` fails as expected only on missing `app.native.permissions`; `npm --prefix packages/browser-renderer test` fails as expected only on missing `nativePreview.automationFlow`, `deviceEnvironment`, `unsupportedControls`, and `data-native-flow`/`data-native-capability` rendering for those preview records.

### Implementation
- [x] Step 10.2: Add runtime native automation command and event contract values
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityState.swift`, and `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Define deterministic value records for native automation actions such as permission request/set, camera capture, photo selection, location update, clipboard read/write, file selection, share sheet completion, notification schedule/delivery, and device environment snapshot.
  - Implementation plan: keep these as runtime contract and state-transition records only. They must append inspectable native events/logs/artifacts and update semantic metadata where applicable, but must not invoke native frameworks or introduce live host behavior.
  - Current red context from Step 10.1: implement `RuntimeNativeAutomationAction` with at least `requestPermission(capability:)`, `supportedCapabilities`, `canonicalEventNames`, and `eventRecord(revision:)`; add `RuntimeAutomationCommand.nativeAutomation(_:)`; add `RuntimeAutomationResponse.Result.nativeCapabilityEvents(_:)`; preserve canonical event names `native.permission.camera.request`, `native.permission.location.set`, `native.camera.capture.front-camera-still`, `native.photos.selection.recent-library-pick`, `native.location.update.automation`, `native.clipboard.read.automation`, `native.clipboard.write.automation`, `native.files.selection.document-picker`, `native.shareSheet.complete.share-receipt`, `native.notifications.schedule.profile-reminder`, `native.notifications.deliver.profile-reminder`, and `native.deviceEnvironment.snapshot`.
  - Validation focus: run `swift test --filter RuntimeHostContractTests` and `swift build`.
  - Status: completed on 2026-04-30. Added `RuntimeNativeAutomationAction`, `.nativeAutomation`, and `.nativeCapabilityEvents` value contracts; wired the runtime coordinator to append canonical native automation events/logs, refresh native artifacts and semantic metadata, and keep the behavior deterministic without host framework calls; added coordinator regression coverage for permission, camera, location, clipboard, notification, and device environment actions.
  - Validation: `swift test --filter RuntimeHostContractTests` passed with 28 runtime host contract tests; `swift build` passed cleanly with no warnings.
- [x] Step 10.3: Add the high-level `app.native.*` namespace to the automation SDK
  - Files: modify `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.ts`, and `packages/automation-sdk/src/index.test.ts`.
  - Add typed controller namespaces for `permissions`, `camera`, `photos`, `location`, `clipboard`, `files`, `shareSheet`, `notifications`, and `device`, with clone-safe return values and event/artifact updates.
  - Implementation plan: build on the existing in-memory `Emulator` session and Phase 9 launch manifest state. The namespace should mutate only deterministic SDK session state and records; live transport to a Swift host remains deferred until a later transport phase.
  - Current context from Step 10.2: the Swift runtime now exposes value-only native automation actions and canonical event names for permission request/set, camera capture, photo selection, location update, clipboard read/write, file selection, share sheet completion, notification schedule/delivery, and device environment snapshots. The TypeScript SDK should mirror the same deterministic vocabulary in memory for now; do not introduce transport coupling to the Swift coordinator in this step.
  - Validation focus: run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
  - Status: completed on 2026-04-30. Added exported native automation namespace/controller types and wired `EmulatorApp.native` in the in-memory SDK for permissions, camera, photos, location, clipboard, files, share sheet, notifications, device snapshots, native events, and native artifacts. The implementation mutates deterministic SDK session state only, appends canonical native records, preserves clone-safe inspection, and keeps unsupported controls such as biometrics, health, speech, sensors, and haptics absent from the namespace.
  - Validation: `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build` passed with no warnings.
- [x] Step 10.4: Harden permission, camera/photo, and location native controls
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.test.ts`, and runtime native contract files only if Step 10.2 leaves missing value shapes.
  - Add or tighten deterministic permission request/set behavior, camera capture fixture retrieval, photo picker selection retrieval, location snapshot/update scripting, and location permission denial records.
  - Current context from Step 10.3: the broad `app.native.*` namespace and representative flow already exist in the automation SDK and pass package validation. Re-read the new SDK implementation against the Step 10.1 red contract and add focused assertions or fixes for permission defaulting, fixture lookup failures, location-denial diagnostics, state mutation, clone isolation, and artifact/event naming rather than duplicating the namespace scaffold.
  - Implementation plan: derive defaults from `nativeCapabilities`, use manifest fixture identifiers as stable lookup keys, append normalized native events, and update artifacts without reading host camera, photo library, or location services.
  - Validation focus: run focused automation SDK tests and `swift test --filter RuntimeHostContractTests` if runtime files change.
  - Status: completed on 2026-04-30. Hardened SDK permission requests so deterministic prompt results are consumed into permission state, aligned permission set behavior with value-level runtime semantics, added permission-state payloads to camera/photo fixture actions, and made missing camera/photo fixtures plus location permission denial append inspectable diagnostic native events/artifacts. Added focused SDK coverage for undeclared permission defaults, fixture lookup failures, location denial diagnostics, location update state, clone isolation, and event naming. No runtime files changed.
  - Validation: `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run typecheck`, and `npm --prefix packages/automation-sdk run build` passed cleanly with no warnings. `swift test --filter RuntimeHostContractTests` was not run because Step 10.4 did not modify runtime files.
- [x] Step 10.5: Implement clipboard, file/share sheet, notifications, and device environment controls
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/index.test.ts`, and runtime native contract files only if Step 10.2 leaves missing value shapes.
  - Add deterministic clipboard read/write APIs, file picker selection inspection, share sheet completion inspection, notification authorization/schedule/delivery APIs, and device environment snapshot inspection.
  - Current context from Step 10.4: the SDK now consumes deterministic permission prompt results on `app.native.permissions.request`, clears prompt results on `permissions.set`, includes resolved permission state in camera/photo action payloads, and appends normalized `native.diagnostic.<capability>.<code>` records for missing camera/photo fixtures and denied location reads. The broad Step 10.3 clipboard, files, share sheet, notifications, and device controllers exist and pass validation, but still need the same focused hardening pass.
  - Implementation plan: re-read the current `app.native.clipboard`, `files`, `shareSheet`, `notifications`, and `device` methods against the Step 10.1 red contract. Add focused assertions before implementation for clipboard read/write mutation and clone isolation, missing file/share fixtures, share completion state mutation, notification authorization state/schedule/delivery records, device snapshot event/artifact payloads, and absence of unsupported sensor, haptic, health, speech, and biometric high-level controls. Preserve Phase 9 artifact/log/event naming where possible and keep unsupported services as diagnostics/unsupported records, not high-level controls.
  - Validation focus: run focused automation SDK tests and `swift test --filter RuntimeHostContractTests` if runtime files change.
  - Status: completed on 2026-04-30. Hardened the SDK clipboard, file picker, share sheet, notification, and device environment controllers. Missing file/share fixtures now append normalized diagnostic native records before throwing, notification authorization consumes deterministic prompt results into permission state, share sheet completion mutates inspectable state, clipboard/file/share/device returns remain clone-safe, and unsupported biometric/health/speech/sensor/haptic controls remain absent from `app.native`.
  - Validation: `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run typecheck`, and `npm --prefix packages/automation-sdk run build` passed cleanly with no warnings. `swift test --filter RuntimeHostContractTests` was not run because Step 10.5 did not modify runtime files.
- [x] Step 10.6: Update browser preview, docs, and examples for agent-native flows
  - Files: modify `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/types.ts`, `packages/browser-renderer/src/styles.ts`, `packages/browser-renderer/src/demoProject.test.ts`, `examples/strict-mode-baseline/automation-example.ts`, `examples/strict-mode-baseline/README.md`, `docs/native-capabilities.md`, and `README.md`.
  - Demonstrate a representative agent flow that configures mocks, interacts with UI, uses `app.native.*`, inspects native events/artifacts, and stays honest about browser-only preview state.
  - Current context from Step 10.5: the automation SDK now has focused coverage and deterministic behavior for permission/camera/photo/location plus clipboard read/write state, file picker selection inspection, share sheet completion state, notification authorization/schedule/delivery records, device environment snapshot events/artifacts, missing fixture diagnostics for camera/photos/files/shareSheet, and clone-safe native event/artifact/session inspection. No Swift runtime files changed in Steps 10.3 through 10.5.
  - Implementation plan: update the browser demo only as illustrative source lowering. Do not imply live Swift execution, real device behavior, or host native framework fidelity.
  - Validation focus: run browser renderer typecheck/test/build, automation SDK typecheck/test/build, and `npx tsx examples/strict-mode-baseline/automation-example.ts`.
  - Status: completed on 2026-04-30. Added typed browser native agent-flow preview state, source lowering for `Native*` automation declarations, DOM cards for agent flow/device environment/unsupported controls, and a coherent bundled browser demo with matching launch-time native fixtures. Updated the strict-mode automation example and docs to show `app.native.*` controls for camera/photo fixtures, location denial diagnostics, clipboard, files/share sheet, notification authorization/schedule/delivery, device snapshots, native events, and native artifacts while preserving the browser-only/live-native boundary.
  - Validation: `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run build`, and `npx tsx examples/strict-mode-baseline/automation-example.ts` passed. The renderer build emitted the existing Vite large-chunk warning for Monaco/editor assets; accepted as unchanged bundling behavior because no renderer bundling configuration changed.

### Green
- [x] Step 10.7: Add end-to-end regression coverage for native agent workflows
  - Files: extend `packages/automation-sdk/src/index.test.ts`, `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/browser-renderer/src/demoProject.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts`.
  - Cover a representative strict-mode agent journey that combines UI interaction, network fixtures, native permission/camera/photo/location/clipboard/file/share/notification controls, semantic state inspection, logs, and artifact retrieval.
  - Include negative assertions that unsupported native services still fail closed and that the SDK does not silently invent controls for unsupported capability IDs.
  - Current context from Step 10.6: the SDK already has focused controller coverage and the browser demo/docs now show a representative native agent flow. Browser `NativePreviewState` now has top-level `automationFlow`, `deviceEnvironment`, and `unsupportedControls`; source lowering recognizes `NativePermissionRequest`, `NativePermissionSet`, `NativeCameraCapture`, `NativePhotoSelection`, `NativeLocationRead`, `NativeClipboardRead/Write`, `NativeFileSelection`, `NativeShareCompletion`, `NativeNotificationAuthorizationRequest`, `NativeNotificationSchedule/Delivery`, `NativeDeviceEnvironmentSnapshot`, and `UnsupportedNativeControl`. The strict-mode executable example now exercises `app.native.*` controls and passed with 20 native artifact records.
  - Implementation plan: add green-phase end-to-end assertions rather than duplicating the focused hardening tests. In the SDK test, launch the representative manifest, install a network fixture, perform UI `tap`/`fill`, drive all high-level native controls, then assert semantic tree, logs, route records, native state, native event names, artifact names, clone isolation, and absence of unsupported controls in one journey. In Swift runtime tests, add coverage that value-level native automation actions and native capability events can coexist with UI/session artifacts without host framework calls. In browser tests, assert the bundled demo/source lowering and renderer output tell the same camera/photo, denied location, clipboard, notification, device, and unsupported-control story as the SDK.
  - Validation focus: run `swift test --filter RuntimeHostContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test`.
  - Status: completed on 2026-04-30. Added green end-to-end regression coverage for a strict-mode native agent workflow across the TypeScript SDK, Swift runtime contracts, and browser preview tests. The new coverage combines UI interaction, a deterministic network fixture, native permission/camera/photo/location/clipboard/file/share/notification/device controls, semantic inspection, logs, artifacts, clone isolation, browser preview cards, and negative unsupported-control assertions without adding live host framework behavior.
  - Validation: `swift test --filter RuntimeHostContractTests`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/browser-renderer test` passed cleanly with no warnings after updating browser expectations to match the existing preview contract.
- [x] Step 10.8: Run full validation across Swift, browser renderer, automation SDK, and examples
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run build`, and `npx tsx examples/strict-mode-baseline/automation-example.ts`.
  - Current context from Step 10.7: focused green regression coverage now passes for the native agent workflow across Swift runtime contracts, automation SDK, and browser renderer tests. The new SDK regression launches the representative manifest, installs a network fixture, performs UI `tap`/`fill`, drives all high-level `app.native.*` controls, asserts semantic/log/network/native state, artifact/event names, clone isolation, and unsupported-control absence. Swift runtime coverage proves value-level native automation actions coexist with UI, network, screenshot, semantic metadata, logs, and native artifact state without host framework calls. Browser tests prove bundled demo source lowering and rendered preview cards tell the same camera/photo, denied-location, clipboard, notification, device, and unsupported-control story.
  - Implementation plan: run each validation command serially, inspect zero-exit output for warnings, and only edit source/config if a command exposes missing package wiring or a real regression. Treat the existing Vite large-chunk warning for Monaco/editor assets as accepted only if it is the same unchanged warning documented in Step 10.6.
  - Validation focus: inspect warnings as well as failures. Existing Vite large-chunk warnings for Monaco/editor assets can be accepted only if no renderer bundling behavior changed in this phase.
  - Status: completed on 2026-04-30. Full Swift, browser renderer, automation SDK, and strict-mode example validation passed without requiring source or package wiring changes.
  - Validation: `swift test` passed with 48 Swift tests, `swift build` passed, `npm --prefix packages/browser-renderer run typecheck` passed, `npm --prefix packages/browser-renderer test` passed with 13 tests, `npm --prefix packages/browser-renderer run build` passed, `npm --prefix packages/automation-sdk run typecheck` passed, `npm --prefix packages/automation-sdk test` passed with 12 tests, `npm --prefix packages/automation-sdk run build` passed, and `npx tsx examples/strict-mode-baseline/automation-example.ts` passed with 20 native capability artifact records. The renderer build emitted Vite's existing large-chunk warning for Monaco/editor assets; accepted as unchanged bundling behavior because this validation-only step made no renderer bundling changes.
- [x] Step 10.9: Refactor native automation boundaries if needed while keeping validation green
  - Files: modify runtime native contract types, automation SDK native controller helpers, browser preview helpers, docs, and examples only as needed.
  - Keep the high-level `app.native.*` controls separate from manifest declaration types, diagnostics guidance, and browser-only preview lowering.
  - Implementation plan: re-read the runtime native control values, SDK controller namespace, browser preview state, docs/examples, and unsupported diagnostics together. Only refactor if there is concrete duplication, type drift, hidden live-host behavior, or unclear API ownership.
  - Validation focus: reuse Step 10.8 validation after source changes. If the review is no-op, no validation rerun is required beyond documenting that Step 10.8 already proved the phase green.
  - Status: completed on 2026-04-30 as an intentional no-op boundary review. Re-read the runtime native automation value records, TypeScript SDK `app.native.*` namespace, browser native preview/source-lowering helpers, docs, and strict-mode example together. No concrete duplication, type drift, hidden live-host behavior, or unclear API ownership justified a source refactor.
  - Validation: no source validation rerun was needed because Step 10.9 changed no runtime, SDK, renderer, docs, or example source files. Reused the Step 10.8 full green validation surface.

### Milestone: M9 Native Capability Automation and Agent Flows
**Acceptance Criteria:**
- [x] An agent can configure native mocks, run a flow, inspect capability state, and retrieve artifacts using the TypeScript SDK.
- [x] Example flows cover at least camera/photo, location permission denial, clipboard, and notification scheduling.
- [x] Browser demo and automation SDK tell the same story about capability state and semantic output.
- [x] Full Swift, browser renderer, and automation SDK validation pass.
- [x] All phase tests pass.
- [x] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: Step 10.9 completed as an intentional no-op boundary review because the native automation ownership boundaries remained coherent after the full green validation pass.
- Tech debt / follow-ups: live Swift/browser transport and host-backed native behavior remain intentionally out of scope; native controls are deterministic in-memory/runtime contract records only.
- Ready for next phase: no further implementation phase is currently queued; refresh research/spec/task docs before adding new build phases.
