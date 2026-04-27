# Todo

## Priority Task Queue

- [x] `$ship-end --no-deploy` - configured `origin` and pushed the initial `main` commit to `https://github.com/GeorgeQLe/iphone-emulator.git` on 2026-04-27 14:22:55 EDT.
- [x] Phase 1 completed on 2026-04-27 after confirming the current `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore` package split is the smallest coherent scaffold and re-running `swift test` plus `swift build`.
- [x] Phase 2 completed on 2026-04-27 after aligning the renderer-side scene-kind contract with `RuntimeHost`, re-running the full Swift and browser-renderer validation surface, and confirming the UI tree and browser boundary needs no broader cleanup before automation work begins.

## Phase 3: M1 Automation SDK and Semantic Inspection
> Test strategy: tdd

### Execution Profile
**Parallel mode:** research-only
**Integration owner:** main agent
**Conflict risk:** high
**Review gates:** correctness, tests, docs/API conformance

**Subagent lanes:**
- Lane: protocol-shape-research
  - Agent: explorer
  - Role: explorer
  - Mode: read-only
  - Scope: inspect the current `RuntimeHost` snapshot APIs and Phase 3 spec language to recommend the smallest automation protocol envelope that can cover launch, element lookup, interactions, logs, and snapshot inspection without locking in transport details too early.
  - Depends on: none
  - Deliverable: a short recommendation for request/response message shapes, error handling, and stable semantic query fields.
- Lane: automation-sdk-surface-research
  - Agent: explorer
  - Role: explorer
  - Mode: read-only
  - Scope: inspect the browser renderer fixture coverage, the `packages/automation-sdk` placeholder, and the roadmap API examples to recommend the minimum TypeScript package surface needed for a Playwright-style fixture runner in this phase.
  - Depends on: none
  - Deliverable: a short recommendation for SDK entry points, locator ergonomics, and the lightest local Node toolchain that supports repeatable tests.

### Tests First
- [x] Step 3.1: Write failing contract tests for the automation protocol and SDK surface.
  - Files: expand `tests/RuntimeHostContractTests/RuntimeHostContractTests.swift`; create automation SDK tests under `packages/automation-sdk/` such as `src/index.test.ts` or `test/**/*.test.ts`; update `packages/automation-sdk/package.json` and local TypeScript/Vitest config only as needed to run those tests.
  - Add Swift-side contract tests for a runtime automation session value, protocol request/response envelopes, semantic query lookup, and deterministic fixture command handling.
  - Add TypeScript-side failing tests that lock the intended Phase 3 user surface: `Emulator.launch(...)`, `app.close()`, locator lookup by text and role, `tap()`, `fill()`, semantic tree inspection, and log collection.
  - The new tests must fail initially because the runtime automation types and automation SDK entry points do not exist yet.

### Implementation
- [x] Step 3.2: Define the runtime automation protocol and session state in `RuntimeHost`.
  - Files: create automation support files under `packages/runtime-host/Sources/RuntimeHost/Automation/` for launch configuration, session identity, semantic query types, command enums, response payloads, and protocol errors; update `Package.swift` only if target wiring changes are needed.
  - Keep the transport layer abstract at the value-type level: Phase 3 needs stable request/response shapes that could later travel over JSON-RPC or WebSocket, but this step should not require a live server yet.
  - Model only the commands the roadmap promises for this phase: launch/close, tap, fill/type, wait/query, semantic snapshot inspection, screenshot placeholder metadata, and log retrieval.
  - Next execution plan:
    - Add an `Automation/` folder under `RuntimeHost` with value-only types for session identity, launch configuration, semantic queries, commands, events, logs, screenshot metadata, and protocol errors.
    - Make the command/result enums `Codable`, `Hashable`, and `Sendable` so the Swift contract matches the eventual SDK transport seam without introducing server code yet.
    - Implement only the initializer and case shapes needed to make the new `RuntimeHostContractTests` compile and pass before moving to fixture-backed runtime behavior in Step 3.3.
- [x] Step 3.3: Implement deterministic runtime automation handling over fixture-backed snapshots.
  - Files: modify `packages/runtime-host/Sources/RuntimeHost/RuntimeAppLoader.swift`, `RuntimeTreeBridge.swift`, `RuntimeTreeSnapshot.swift`, and add any new runtime automation coordinator files under `packages/runtime-host/Sources/RuntimeHost/Automation/`.
  - Add the smallest runtime session coordinator that can launch a strict-mode fixture app, retain the latest semantic tree snapshot, resolve semantic queries by text/role/stable identifier, and apply deterministic fixture-scoped interaction updates for tap and fill commands.
  - Keep the scope fixture-driven and synchronous where possible. Do not add browser transport, async multiplexing, or compatibility-mode concerns in this step.
- [x] Step 3.4: Build the TypeScript automation SDK package around the runtime contract.
  - Files: update `packages/automation-sdk/package.json`; create `packages/automation-sdk/src/` entry points, locator helpers, session client types, fixture transport stubs, and any local TypeScript/Vitest config files needed for repeatable `typecheck`, `test`, and `build` commands.
  - Expose a narrow Playwright-style surface that matches the roadmap example closely: `Emulator.launch`, `close`, `getByText`, `getByRole`, locator `tap`, locator `fill`, semantic snapshot access, and log retrieval.
  - Use a local in-memory transport/client seam for this phase so the SDK can exercise the runtime automation contract before a real JSON-RPC or WebSocket server exists.
  - Next execution plan:
    - Implement `packages/automation-sdk/src/index.ts` with `Emulator.launch` returning a fixture-backed session object that mirrors the current `RuntimeAutomationCoordinator` surface and baseline fixture behavior.
    - Add locator helpers for `getByText`, `getByRole`, and `getByTestId`, with `tap`, `fill`, and `inspect` implemented against an in-memory semantic tree plus deterministic logs/screenshot placeholders.
    - Wire `package.json` scripts and any small TypeScript config gaps so `npm --prefix packages/automation-sdk run typecheck`, `test`, and `build` all execute locally before expanding end-to-end examples in Step 3.5.
- [x] Step 3.5: Add fixture-driven automation examples and developer documentation.
  - Files: update `README.md`; expand `examples/strict-mode-baseline/README.md`; add example automation usage under `examples/strict-mode-baseline/` or `packages/automation-sdk/` if a checked-in sample script clarifies the supported API.
  - Document the end-to-end Phase 3 flow from strict-mode fixture declaration through runtime automation session launch into the TypeScript SDK, including the exact local commands to validate the automation package.
  - Call out the current limitations explicitly: in-memory transport only, fixture-scoped state updates, no live browser session coordination, and screenshot support limited to placeholder metadata or stubbed hooks until later phases.
  - Next execution plan:
    - Update the root `README.md` Phase 3 status and validation section to include the new `@iphone-emulator/automation-sdk` package, its local commands, and the current in-memory-only transport limitations.
    - Expand `examples/strict-mode-baseline/README.md` with a concrete automation walkthrough that starts from the strict fixture, launches `Emulator`, queries by text/role/test ID, performs `tap` and `fill`, and inspects the semantic tree plus logs.
    - Add a checked-in sample script under `packages/automation-sdk/` or `examples/strict-mode-baseline/` that mirrors the documented flow closely enough to serve as a copy-paste starting point for Step 3.6 regression coverage.

### Green
- [x] Step 3.6: Run regression tests covering representative automation flows and semantic inspection.
  - Files: extend the Swift and TypeScript test suites created earlier; add fixture-specific assertions only where they improve Phase 3 acceptance coverage without making the API brittle.
  - Cover a representative end-to-end flow where a TypeScript-side test launches a fixture app, finds elements by text and role, performs `tap` and `fill`, inspects the updated semantic tree, and retrieves logs or placeholder screenshot metadata.
  - Keep assertions structural and deterministic: prefer stable semantic identifiers, explicit role/text expectations, and small serialized payload checks over large snapshots.
  - Next execution plan:
    - Extend `packages/automation-sdk/src/index.test.ts` with one representative end-to-end automation flow that asserts deterministic tree updates, appended log messages, and screenshot placeholder metadata after `tap` and `fill`.
    - Add or expand `tests/RuntimeHostContractTests/RuntimeHostContractTests.swift` coverage only where it strengthens the shared query/update contract without duplicating the TypeScript-side scenario assertions.
    - Keep assertions focused on stable identifiers, roles, alert payload state, field values, and short log payloads rather than large serialized tree snapshots.
- [x] Step 3.7: Run the full validation surface for the Swift workspace, browser renderer, and automation SDK.
  - Files: no intended source edits; update package scripts or config only if validation wiring is still missing after implementation.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, and the matching `packages/automation-sdk` `typecheck`/`test`/`build` commands introduced in this phase.
  - Inspect warnings as well as failures. Do not close the phase with missing SDK validation wiring.
- [ ] Step 3.8: Refactor the runtime and SDK boundary if needed while keeping the new tests green.
  - Re-read the runtime automation value types and TypeScript SDK entry points before changing names or file boundaries.
  - Keep refactors limited to clarifying ownership between the runtime contract and SDK client, reducing duplication, or tightening deterministic semantic query semantics. Do not widen scope into browser transport or compatibility diagnostics work.
  - If no meaningful cleanup is justified after the validation run, record this as an intentional no-op boundary review rather than introducing churn.
  - Next execution plan:
    - Re-read `packages/runtime-host/Sources/RuntimeHost/Automation/` and `packages/automation-sdk/src/` together, looking specifically for duplicated query semantics, redundant placeholder types, or naming mismatches that make the runtime contract harder for the SDK to mirror.
    - If a small boundary cleanup is justified, keep the write scope narrow and rerun only the affected validation commands plus a final full pass if shared types move or rename.
    - If the current split is already the smallest coherent boundary, record Step 3.8 as an intentional no-op review, then mark the remaining milestone acceptance criteria complete for the phase.

### Milestone: M1 Automation SDK and Semantic Inspection
**Acceptance Criteria:**
- [ ] A TypeScript test can launch a fixture app and interact with supported UI primitives.
- [ ] Semantic queries can find elements by text, role, and stable identifiers.
- [ ] Automation commands update runtime state deterministically.
- [ ] Logs and semantic snapshots are available through the SDK.
- [x] All phase tests pass.
- [x] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
