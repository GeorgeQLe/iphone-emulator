# Todo — iPhone Emulator Workspace

> Project: Open-Source iPhone Emulator Harness
> Current phase: 12 of 12 — M11 Transport Native Capability Parity
> Source roadmap: `tasks/roadmap.md`
> Source spec: `specs/transport-native-capability-parity.md`
> Test strategy: tdd

## Phase 12: M11 Transport Native Capability Parity

**Status:** planned.

**Goal:** Make transport-backed automation support the same deterministic native capability controls and inspection surfaces as the current in-memory `app.native.*` namespace.

**Scope:**
- Add full current native automation parity for `Emulator.launch({ mode: "transport", ... })`, covering permissions, camera, photos, location, clipboard, files, share sheets, notifications, device snapshots, native events, and native artifacts.
- Route TypeScript transport native mutations through a generic native automation command boundary that maps to Swift's existing `RuntimeAutomationCommand.nativeAutomation(RuntimeNativeAutomationAction)` model.
- Keep native mutations serialized through the existing session command path and semantic revision gate so native state, semantic metadata, logs, events, and artifacts remain ordered consistently.
- Preserve deterministic fail-closed behavior for unsupported native capabilities, missing fixtures, stale revisions, post-close commands, malformed actions, and invalid sessions.
- Add fixture-vs-transport parity tests for representative native workflows and clone isolation.
- Update transport and native capability docs only where needed to clarify local deterministic parity, while keeping production WebSocket, hosted sessions, MCP, and host native service behavior out of scope.

**Acceptance Criteria:**
- Transport-backed `app.native.*` supports the full current fixture-mode native API surface.
- No supported transport native method throws `runtime transport native command is not implemented yet`.
- Native mutation methods route through a generic native automation command boundary.
- Native mutations use the existing semantic revision gate.
- Fixture-vs-transport parity tests pass for representative native workflows.
- Native records, logs, artifacts, semantic metadata, and permission state match fixture-mode behavior for equivalent inputs.
- Unsupported native capabilities remain fail-closed and absent from the public namespace.
- Documentation clearly states that parity is deterministic local transport parity, not host native access or production WebSocket support.

### Execution Profile
**Parallel mode:** research-only
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, security, docs/API conformance

**Subagent lanes:**
- Lane: native-api-parity-review
  - Agent: explorer
  - Role: reviewer
  - Mode: read-only
  - Scope: compare the fixture-mode `app.native.*` namespace against the transport-mode namespace and identify method, return-shape, clone-isolation, and missing-fixture behavior gaps before implementation.
  - Depends on: Step 12.1, Step 12.2
  - Deliverable: findings on parity gaps and test cases that should block green status.
- Lane: transport-command-boundary-review
  - Agent: explorer
  - Role: reviewer
  - Mode: read-only
  - Scope: review TypeScript `RuntimeTransportLike`/`RuntimeTransportClient` native command design against Swift `RuntimeAutomationCommand.nativeAutomation(RuntimeNativeAutomationAction)` and the existing semantic revision gate.
  - Depends on: Step 12.1, Step 12.3
  - Deliverable: findings on duplicated native schemas, stale-revision risks, lifecycle diagnostics, and API drift.
- Lane: docs-boundary-review
  - Agent: explorer
  - Role: docs-researcher
  - Mode: read-only
  - Scope: review `docs/live-runtime-transport.md`, `docs/native-capabilities.md`, and `specs/transport-native-capability-parity.md` for wording that could imply host native access, production WebSocket support, hosted sessions, or new native fidelity.
  - Depends on: Step 12.5
  - Deliverable: documentation wording risks and missing parity notes.

### Tests First
- [x] Step 12.1: Write failing native transport parity tests
  - Files: modify `packages/automation-sdk/src/transport.test.ts`, modify `packages/automation-sdk/src/index.test.ts`, and modify `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Add fixture-vs-transport assertions for permissions snapshot/request/set, camera capture, photo select, location current/update, clipboard read/write, file selection, share-sheet completion, notification authorization/schedule/deliver, device snapshot, native events, native artifacts, logs, semantic metadata, permission state, and clone isolation.
  - Add red-phase assertions that no supported transport native method throws `runtime transport native command is not implemented yet`.
  - Add stale semantic revision, post-close native command, missing session, malformed action, missing fixture, and unsupported native action assertions that expect structured diagnostics or deterministic native records rather than host fallback behavior.
  - Tests MUST fail at this point because transport-mode native mutation methods still throw the placeholder unsupported-native error and `RuntimeTransportLike` has no generic native automation command boundary.

### Implementation
- [ ] Step 12.2: Define TypeScript native transport action contracts and SDK namespace routing
  - Files: modify `packages/automation-sdk/src/types.ts`, modify `packages/automation-sdk/src/index.ts`, and modify `packages/automation-sdk/src/transport.ts`.
  - Add a JSON-compatible generic native automation action payload that maps one-to-one to the current Swift `RuntimeNativeAutomationAction` cases without adding one transport method per native operation.
  - Extend `RuntimeTransportLike` and `RuntimeTransportClient` with a generic native command method that sends `sessionID`, expected semantic revision, action type, and action payload through the existing command request path.
  - Replace transport-mode `unsupportedNativeTransportMethod()` usage with method-compatible `app.native.*` calls that preserve fixture-mode signatures and return shapes.
  - Keep read-only native inspection surfaces (`snapshot`, `current`, `read`, `device.snapshot`, `events`, `artifacts`) clone-safe and aligned with fixture-mode behavior.
- [ ] Step 12.3: Implement native action handling in the local in-memory transport test double
  - Files: modify `packages/automation-sdk/src/transport.ts` and modify `packages/automation-sdk/src/transport.test.ts`.
  - Apply native permission, camera, photos, location, clipboard, files, share sheet, notification, and device actions to the retained transport session using the same state, event, artifact, log, and semantic metadata conventions as `InMemoryEmulatorApp`.
  - Serialize native mutations through the current semantic revision model, increment snapshots for successful mutations where fixture mode records native revisions, and reject stale expected revisions with the existing `staleRevision` diagnostic.
  - Ensure returned sessions, native events, native artifacts, permission snapshots, clipboard reads, file selections, location snapshots, and device snapshots are cloned so caller mutation cannot corrupt retained transport state.
  - Preserve deterministic missing-fixture diagnostics and errors without attempting host native services.
- [ ] Step 12.4: Align Swift runtime transport native command coverage
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeSessionCoordinator.swift`, modify `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift` only if a Codable adapter is needed, modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift` only if mapping helpers are needed, and modify `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Verify `RuntimeSessionCoordinator` already routes `.nativeAutomation(RuntimeNativeAutomationAction)` through the same stale revision gate as other commands; add or tighten tests for all current native action cases and diagnostic branches.
  - Avoid a parallel Swift native command taxonomy; use the existing `RuntimeAutomationCommand.nativeAutomation` and `RuntimeNativeAutomationAction` contract as the canonical model.
  - Confirm native command responses publish inspectable events, logs, artifact records, semantic snapshot metadata, and session native state consistently.
- [ ] Step 12.5: Update examples and documentation for local native parity
  - Files: modify `examples/strict-mode-baseline/live-transport-example.ts`, modify `README.md` only if the example command summary needs parity wording, modify `docs/live-runtime-transport.md`, and modify `docs/native-capabilities.md`.
  - Extend the live transport example with representative native calls across permissions, camera/photos fixtures, location, clipboard, files, share sheet, notifications, device snapshot, native events, and native artifacts.
  - Document that transport mode now supports the current deterministic `app.native.*` controls while still using local session records, fixture outputs, logs, artifacts, and semantic metadata.
  - State explicitly that this parity does not add host camera, photos, clipboard, files, notifications, sensors, haptics, production WebSocket, hosted sessions, or MCP behavior.

### Green
- [ ] Step 12.6: Run focused parity validation
  - Files: no intended source edits unless validation exposes missing package wiring or real regressions.
  - Run `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `swift test`, and `npx tsx examples/strict-mode-baseline/live-transport-example.ts`.
  - Confirm transport-mode native tests fail before implementation and pass after implementation, including clone isolation, stale revision, post-close, missing fixture, and unsupported action cases.
- [ ] Step 12.7: Run full workspace regression validation
  - Files: no intended source edits unless validation exposes missing package wiring or real regressions.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run build`, `npx tsx examples/strict-mode-baseline/automation-example.ts`, and `npx tsx examples/strict-mode-baseline/live-transport-example.ts`.
- [ ] Step 12.8: Refactor native parity boundaries if needed while keeping tests green
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/types.ts`, `packages/automation-sdk/src/transport.ts`, `packages/runtime-host/Sources/RuntimeHost/Transport/**`, `packages/runtime-host/Sources/RuntimeHost/Automation/**`, `docs/live-runtime-transport.md`, and `docs/native-capabilities.md` only as needed.
  - Re-read fixture-mode native implementation, transport-mode native routing, Swift native command routing, tests, examples, and docs together. Only refactor if there is concrete duplicated native action vocabulary, fixture-vs-transport return drift, hidden mutable state, diagnostic ambiguity, or documentation overclaiming.

### Milestone: M11 Transport Native Capability Parity
**Acceptance Criteria:**
- [ ] Transport-backed `app.native.*` supports the full current fixture-mode native API surface.
- [ ] No supported transport native method throws `runtime transport native command is not implemented yet`.
- [ ] Native mutation methods route through a generic native automation command boundary.
- [ ] Native mutations use the existing semantic revision gate.
- [ ] Fixture-vs-transport parity tests pass for representative native workflows.
- [ ] Native records, logs, artifacts, semantic metadata, and permission state match fixture-mode behavior for equivalent inputs.
- [ ] Unsupported native capabilities remain fail-closed and absent from the public namespace.
- [ ] Documentation clearly states that parity is deterministic local transport parity, not host native access or production WebSocket support.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: [fill in when complete]
- Tech debt / follow-ups: [fill in when complete]
- Ready for next phase: [fill in when complete]
