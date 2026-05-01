# Todo — iPhone Emulator Workspace

> Current phase: 11 of 11 — M10 Live Runtime-to-Renderer Transport and Session Coordination
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tdd

## Priority Documentation Todo

- [x] `$devtool-docs-audit` - create `research/devtool-docs-audit.md` because the enabled devtool pack expects this research output and it is missing.
- [ ] `$spec-drift fix all` - update `specs/drift-report.md` and any stale specs because latest implementation commit `3d449e0` at 2026-05-01T11:41:48-04:00 is newer than `specs/open-source-iphone-emulator.md` at 2026-04-30T11:46:12-04:00 and `specs/drift-report.md` at 2026-04-30T11:46:45-04:00.

## Phase 11: M10 Live Runtime-to-Renderer Transport and Session Coordination

**Status:** complete on 2026-05-01.

**Goal:** Replace the current fixture-only browser and automation loop with a deterministic live session path that connects the Swift runtime host, browser renderer, and TypeScript automation SDK through an explicit transport boundary.

**Scope:**
- Define and implement a JSON-RPC/WebSocket transport contract for launching sessions, streaming semantic UI tree updates, sending automation commands, collecting runtime responses, and closing sessions deterministically.
- Add runtime host session coordination for lifecycle, revision ordering, command serialization, logs, artifacts, network fixture records, device settings, and native capability records.
- Connect the browser renderer to live runtime session updates while preserving the existing illustrative demo mode as a separate fallback path.
- Add a transport-backed TypeScript automation SDK mode that can drive a live runtime session while keeping the current in-memory fixture mode available for fast local tests.
- Add session diagnostics for connection failures, protocol errors, unsupported commands, stale revisions, timeout behavior, and clean shutdown.
- Update docs and examples to distinguish fixture-backed mode, live local transport mode, and deferred hosted/session-cloud behavior.

**Acceptance Criteria:**
- A strict-mode baseline app can run through one live local runtime-to-renderer session using the open-source Swift runtime host and browser renderer.
- The browser renderer receives semantic UI tree updates from the runtime transport and reflects deterministic interaction state without relying on illustrative source lowering.
- The TypeScript automation SDK can launch, inspect, interact with, and close a transport-backed runtime session using the same high-level automation concepts as fixture mode.
- Logs, semantic snapshots, screenshot/render metadata, network fixture records, device settings, and native capability records remain inspectable through the transport-backed session.
- Protocol and session failures produce structured diagnostics instead of hangs, silent state drift, or host-specific behavior.
- Existing fixture-backed tests and examples continue to pass, with docs clearly explaining which mode each command exercises.

### Execution Profile
**Parallel mode:** research-only
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, security, performance, docs/API conformance, UX

**Subagent lanes:**
- Lane: protocol-contract-review
  - Agent: explorer
  - Role: reviewer
  - Mode: read-only
  - Scope: review the proposed runtime transport message schema, session lifecycle states, revision ordering, and diagnostic vocabulary against existing runtime automation commands, artifacts, network records, device settings, and native capability records.
  - Depends on: Step 11.1, Step 11.2
  - Deliverable: findings on missing protocol cases, ambiguous ordering, or type drift before implementation proceeds past runtime coordination.
- Lane: renderer-live-session-review
  - Agent: explorer
  - Role: reviewer
  - Mode: read-only
  - Scope: review browser renderer live-session integration points and identify how to preserve fixture/demo mode while consuming transport snapshots.
  - Depends on: Step 11.2, Step 11.4
  - Deliverable: findings on mode separation, UI state risks, and renderer test gaps.
- Lane: automation-transport-review
  - Agent: explorer
  - Role: reviewer
  - Mode: read-only
  - Scope: review TypeScript automation SDK transport-backed mode against existing in-memory fixture behavior and high-level automation/native APIs.
  - Depends on: Step 11.2, Step 11.5
  - Deliverable: findings on API compatibility, close/error semantics, timeout behavior, and regression coverage.

### Tests First
- [x] Step 11.1: Write failing live transport and session coordination contracts
  - Files: modify `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, create `packages/automation-sdk/src/transport.test.ts`, modify `packages/automation-sdk/src/index.test.ts`, create `packages/browser-renderer/src/liveSession.test.ts`, and modify `packages/browser-renderer/src/renderTree.test.ts` only where needed.
  - Add Swift red-phase assertions for transport launch, command serialization, semantic revision streaming, stale revision rejection, structured protocol errors, deterministic close, and session artifact/log/native/network/device inspection.
  - Add TypeScript SDK red-phase assertions that a transport-backed app exposes the same high-level launch, locator, semantic tree, screenshot metadata, logs, artifacts, network, native, and close concepts as fixture mode while surfacing connection, timeout, unsupported command, and protocol errors as structured diagnostics.
  - Add renderer red-phase assertions that live session snapshots can update the rendered tree independently from illustrative source lowering and that demo mode remains available as a separate fallback path.
  - Tests MUST fail at this point because the JSON-RPC/WebSocket transport boundary, live session coordinator, renderer live adapter, and SDK transport client do not exist yet.

### Implementation
- [x] Step 11.2: Define shared transport message and diagnostic contracts
  - Files: create `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeTransportTypes.swift`, modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationTypes.swift`, create `packages/automation-sdk/src/transport.ts`, modify `packages/automation-sdk/src/types.ts`, and update `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Define request, response, event, and error envelopes for launch, command, semantic tree update, artifact/log/native/network/device inspection, close, timeout, unsupported command, protocol violation, stale revision, and connection failure cases.
  - Keep the schema value-level and deterministic; do not introduce hosted/session-cloud behavior or host-specific native framework calls.
  - Start from the Step 11.1 red failures: add the missing Swift `RuntimeTransport*` value types and descriptor/diagnostic enums, add the missing SDK `transport.ts` client/error/type surface, and export shared transport-mode launch option types without implementing live session coordination yet.
  - Preserve existing fixture-mode behavior while making the new tests compile far enough to fail on unimplemented coordinator/client behavior reserved for Steps 11.3 through 11.5.
- [x] Step 11.3: Implement runtime host session coordinator over the transport contract
  - Files: create `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeSessionCoordinator.swift`, create `packages/runtime-host/Sources/RuntimeHost/Transport/RuntimeInMemoryTransport.swift`, modify `packages/runtime-host/Sources/RuntimeHost/Automation/RuntimeAutomationCoordinator.swift`, modify `packages/runtime-host/Sources/RuntimeHost/ProtocolBoundaryPlaceholder.swift`, and extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`.
  - Serialize commands through one coordinator per session, increment and stream revisions deterministically, retain semantic snapshots through `RuntimeTreeBridge`, preserve logs/artifacts/network records/device settings/native capability records, and return structured diagnostics for invalid lifecycle transitions.
  - Starting point: `RuntimeTransportTypes.swift` now contains the shared envelope/diagnostic/descriptor contract and a first coordinator façade that delegates to `RuntimeAutomationCoordinator` for the current in-memory live contract tests. Promote this into dedicated `RuntimeSessionCoordinator.swift` and `RuntimeInMemoryTransport.swift` files, then separate protocol I/O from session state without changing the public `RuntimeTransport*` value vocabulary.
- [x] Step 11.4: Add a browser renderer live-session adapter while preserving demo mode
  - Files: create `packages/browser-renderer/src/liveSession.ts`, create `packages/browser-renderer/src/liveSession.test.ts`, modify `packages/browser-renderer/src/main.ts`, modify `packages/browser-renderer/src/renderTree.ts`, modify `packages/browser-renderer/src/types.ts`, modify `packages/browser-renderer/src/demoProject.ts`, and modify `packages/browser-renderer/src/demoStyles.ts` only if mode controls or status styles are needed.
  - Add a live session input path that accepts transport semantic tree snapshots and revision/status events, updates the iPhone-like preview deterministically, displays structured session diagnostics, and keeps illustrative source lowering clearly separate from live runtime mode.
  - Starting point: Step 11.3 split the Swift transport value vocabulary from runtime session state. `RuntimeTransportSessionCoordinator` now emits `sessionOpened`, semantic tree, logs, artifact bundle, and close events over the local in-memory transport. Renderer work should consume the same semantic tree snapshots and structured diagnostics while preserving the existing demo/source-lowering entry point as a separate mode.
- [x] Step 11.5: Add transport-backed mode to the TypeScript automation SDK
  - Files: modify `packages/automation-sdk/src/index.ts`, `packages/automation-sdk/src/types.ts`, create `packages/automation-sdk/src/transport.ts`, create `packages/automation-sdk/src/transport.test.ts`, and update `packages/automation-sdk/package.json` only if a test/build entry needs to include the new module.
  - Keep the existing in-memory fixture mode available. Add a transport client abstraction that can launch a runtime session, send locator/interact/inspect/screenshot/log/artifact/network/native commands, subscribe to semantic revisions, enforce timeouts, and close cleanly.
  - Starting point: Step 11.4 added `RuntimeLiveSessionAdapter` in `packages/browser-renderer/src/liveSession.ts`, renderer-local live snapshot/diagnostic types, and explicit `fixture`/`demo`/`live` mode tagging on `mountRenderer`. SDK work should align its transport diagnostic vocabulary with those renderer diagnostics while preserving the current fixture-backed `Emulator.launch` behavior and high-level locator/native APIs.
- [x] Step 11.6: Add local live-session fixture and integration example
  - Files: modify `examples/strict-mode-baseline/automation-example.ts`, add `examples/strict-mode-baseline/live-transport-example.ts`, modify `examples/strict-mode-baseline/README.md`, and update `README.md`.
  - Demonstrate fixture mode and live local transport mode as separate examples, with the live path driving one strict-mode baseline session from launch through UI interaction, semantic inspection, artifact/log/native/network inspection, and close.
  - Starting point: Step 11.5 now routes `Emulator.launch({ mode: "transport" })` through a dedicated `TransportEmulatorApp` backed by `RuntimeTransportClient` RPC methods instead of mutating a local fixture app. `createInMemoryRuntimeTransport` provides the deterministic local live transport for examples and supports launch, locator inspect/tap/fill, semantic tree, screenshot, logs, artifacts, network route/request, native device snapshot, close diagnostics, and timeout/unsupported/protocol diagnostics. Keep the existing `automation-example.ts` fixture-backed path unchanged and add `live-transport-example.ts` as the separate transport-mode demonstration.
- [x] Step 11.7: Add session diagnostics documentation and examples
  - Files: update `README.md`, create or modify `docs/live-runtime-transport.md`, and update `docs/ci-fixture-recipe.md`.
  - Document local-only transport behavior, JSON-RPC/WebSocket terminology, deterministic session lifecycle, structured diagnostics, fixture versus live mode, deferred hosted/session-cloud behavior, and validation commands.
  - Completed on 2026-05-01: added `docs/live-runtime-transport.md`, linked it from `README.md`, and updated `docs/ci-fixture-recipe.md` with optional local transport smoke coverage and diagnostic artifact guidance.

### Green
- [x] Step 11.8: Add end-to-end regression coverage for the live local session path
  - Files: extend `Tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`, `packages/automation-sdk/src/transport.test.ts`, `packages/browser-renderer/src/liveSession.test.ts`, and `packages/browser-renderer/src/renderTree.test.ts`.
  - Cover a strict-mode baseline session that launches through the runtime coordinator, streams a semantic tree to the renderer, performs tap/fill/query/screenshot/log/artifact/network/native commands through the SDK transport mode, rejects a stale revision, reports one protocol error, and closes without leaking session state.
  - Completed on 2026-05-01: added Swift runtime in-memory transport coverage for launch/events/interactions/records/diagnostics/close, SDK transport coverage for one strict-mode local live session plus unsupported/protocol/close diagnostics, renderer live-session coverage for accepted/stale revisions, and render-tree coverage that live mode stays separate from fixture/demo mode.
- [x] Step 11.9: Run full validation across Swift, browser renderer, automation SDK, and examples
  - Files: no intended source edits unless validation exposes missing package wiring or real regressions.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run build`, `npx tsx examples/strict-mode-baseline/automation-example.ts`, and `npx tsx examples/strict-mode-baseline/live-transport-example.ts`.
  - Completed on 2026-05-01: all listed Swift, browser renderer, automation SDK, and strict-mode example validation commands passed. The browser renderer Vite build emitted the existing large-chunk warning for Monaco/editor assets; accepted as unchanged bundling behavior for this validation-only step.
- [x] Step 11.10: Refactor transport, session, renderer, and SDK boundaries if needed while keeping tests green
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/Transport/**`, `packages/runtime-host/Sources/RuntimeHost/Automation/**`, `packages/automation-sdk/src/**`, `packages/browser-renderer/src/**`, `README.md`, and `docs/live-runtime-transport.md` only as needed.
  - Re-read the runtime transport schema, session coordinator, SDK transport client, renderer live adapter, docs, and examples together. Only refactor if there is concrete type drift, duplicated message vocabulary, unclear fixture/live mode ownership, hidden nondeterminism, or diagnostic ambiguity.
  - Completed on 2026-05-01: aligned the SDK, renderer, tests, and transport docs with the Swift shared diagnostic vocabulary by removing the extra `close` diagnostic code and treating post-close commands as `protocolViolation` records carrying `sessionID`.

### Milestone: M10 Live Runtime-to-Renderer Transport and Session Coordination
**Acceptance Criteria:**
- [x] A strict-mode baseline app can run through one live local runtime-to-renderer session using the open-source Swift runtime host and browser renderer.
- [x] The browser renderer receives semantic UI tree updates from the runtime transport and reflects deterministic interaction state without relying on illustrative source lowering.
- [x] The TypeScript automation SDK can launch, inspect, interact with, and close a transport-backed runtime session using the same high-level automation concepts as fixture mode.
- [x] Logs, semantic snapshots, screenshot/render metadata, network fixture records, device settings, and native capability records remain inspectable through the transport-backed session.
- [x] Protocol and session failures produce structured diagnostics instead of hangs, silent state drift, or host-specific behavior.
- [x] Existing fixture-backed tests and examples continue to pass, with docs clearly explaining which mode each command exercises.
- [x] All phase tests pass.
- [x] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: no hosted or production WebSocket service was added; the live path remains deterministic local in-memory transport as planned for M10.
- Tech debt / follow-ups: Vite still emits the existing Monaco/editor large-chunk warning during renderer builds; accepted as unchanged bundling behavior.
- Ready for next phase: yes
