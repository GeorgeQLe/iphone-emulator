# Devtool Integration Map

## Product Context

This project is an open-source iPhone-like app harness for deterministic agent-driven testing of Swift app flows. It is not an iOS simulator replacement. The current integration surface is local-first: SwiftPM packages provide strict-mode SDK, runtime, and diagnostics contracts; npm workspace packages provide the browser renderer and TypeScript automation SDK; examples and docs bind the current fixture-backed workflow together.

The strongest near-term integration story is a pre-simulator developer and agent testing layer: compile or analyze supported Swift, lower supported app declarations into a semantic UI tree, render an iPhone-like preview, drive flows with a Playwright-style SDK, and inspect structured artifacts without Apple proprietary runtime dependencies.

## Integration Surfaces

| Surface | Current state | Primary consumers | Integration status |
| --- | --- | --- | --- |
| SwiftPM workspace | Root `Package.swift` plus `packages/swift-sdk`, `packages/runtime-host`, and `packages/diagnostics`. | Swift contributors, strict-mode app authors, compatibility contributors. | Implemented for local package development and contract tests. |
| Strict-mode Swift SDK | Project-owned app/view declarations that lower to `RuntimeHost.SemanticUITree`. | Swift app developers, example authors, future templates. | Implemented for the supported fixture path; narrow by design. |
| Runtime host | Value contracts for semantic trees, automation sessions, artifacts, network fixtures, device settings, and native capability state. | Automation SDK, future transport, contributors. | Implemented in memory; no live process transport yet. |
| Diagnostics core | Source analyzer and compatibility matrix for unsupported imports, SwiftUI-inspired subset support, and native capability guidance. | Migration users, compatibility contributors. | Implemented as scanner-led diagnostics; not compiler-integrated. |
| Browser renderer | Vite/TypeScript package rendering a checked-in semantic tree and native preview cards. | Browser demo users, renderer contributors, product demos. | Implemented for deterministic preview; not connected to live runtime snapshots. |
| TypeScript automation SDK | `@iphone-emulator/automation-sdk` with `Emulator.launch`, locators, route fixtures, artifacts, device settings, and `app.native.*`. | AI agents, QA automation, CI fixtures, docs examples. | Implemented in memory; no JSON-RPC/WebSocket transport. |
| Native capability manifests | Shared Swift/TypeScript taxonomy for permissions, camera/photos, location, clipboard, files, share sheets, notifications, and device environment. | Agent flow authors, compatibility diagnostics, automation SDK. | Implemented as deterministic records and high-level SDK controls; no host native access. |
| Examples and docs | Strict-mode baseline example, automation example, compatibility/native docs, root README. | First-run users, evaluators, contributors. | Implemented, but docs are likely behind implementation details in the main spec. |

## Ecosystem Assumptions

| Ecosystem | Assumption | Constraint |
| --- | --- | --- |
| Swift | Users can run an open-source Swift toolchain and SwiftPM tests locally or in CI. | The project must not require Xcode Simulator, UIKit, SwiftUI runtime, WebKit, or Apple-private APIs. |
| Node/TypeScript | Users can install npm dependencies and run Vite/Vitest/TypeScript package scripts. | Current npm workspace is local package oriented, not published-package oriented. |
| Browser | The renderer can use DOM/Vite/Monaco-style web tooling for an iPhone-like preview. | Browser preview is illustrative source lowering and DOM metadata, not native screenshots or live Swift execution. |
| CI | CI can run SwiftPM and npm validation commands. | Multi-language validation needs clear command grouping and artifact conventions before broad adoption. |
| Agent tooling | Agents can call TypeScript SDK APIs and inspect structured semantic/artifact data. | A future MCP or protocol server is needed before agents can control live sessions outside the in-memory SDK. |
| Mobile app migration | Existing Swift code can be scanned for supported subset use and unsupported symbols. | Compatibility mode remains best-effort; strict mode is the reliable path. |

## Setup Path Today

1. Install Swift and Node/npm.
2. Install npm workspace dependencies from the repository root.
3. Run Swift validation with `swift test` and `swift build`.
4. Run browser renderer validation with `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
5. Run automation SDK validation with `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, and `npm --prefix packages/automation-sdk run build`.
6. Run the strict-mode automation example with `npx tsx examples/strict-mode-baseline/automation-example.ts`.

This is enough for local contributors and agent evaluation fixtures. It is not yet enough for a hosted service, package consumer quickstart, or live browser session workflow.

## Required Future Integrations

| Integration | Why it matters | Minimum contract |
| --- | --- | --- |
| Runtime-to-renderer transport | Browser preview must consume live runtime snapshots instead of checked-in fixtures. | JSON-RPC or WebSocket session protocol carrying semantic tree updates, logs, artifacts, network records, and native capability events. |
| Automation SDK transport backend | Agents need to drive real runtime/browser sessions, not only in-memory fixtures. | Keep existing SDK semantics while adding a transport-backed `Emulator.launch` mode. |
| MCP or agent tool server | Agent platforms need a stable tool boundary for launch, interact, inspect, and artifact retrieval. | Thin server over the same transport/session model, without duplicating SDK behavior. |
| CI recipes | QA and platform teams need repeatable setup and failure artifacts. | Documented commands, expected outputs, artifact retention guidance, and unsupported-warning policy. |
| Package publishing | External users need installable Swift and TypeScript packages. | Versioned package names, release process, compatibility matrix, and public API stability rules. |
| Fixture/template gallery | Strict-mode rewrite cost drops when users start from examples. | Small templates for forms, navigation, network fixtures, native mocks, and compatibility diagnostics. |
| Spec and docs reconciliation | The implementation has advanced beyond the original spec. | `$spec-drift fix all` should reconcile public contracts before another build phase is planned. |

## Compatibility Constraints

| Constraint | Product impact | Integration guidance |
| --- | --- | --- |
| No Apple proprietary runtime | Keeps the project lawful and portable. | Avoid simulator, UIKit, SwiftUI runtime, WebKit, CoreAnimation, and binary compatibility claims. |
| Strict mode is canonical | Gives agents deterministic semantics and stable locators. | Integrations should target `StrictModeSDK` and `SemanticUITree` first. |
| Compatibility mode is diagnostics-led | Prevents unsupported Swift APIs from becoming hidden behavior. | Treat unsupported diagnostics as useful output, not setup failure. |
| Automation SDK is in-memory today | Good for examples and contracts, limited for real app sessions. | Do not market it as live runtime automation until transport exists. |
| Browser preview is fixture/source lowering | Good for demos, limited for runtime fidelity. | Keep preview cards and DOM metadata honest about non-native behavior. |
| Native capabilities are deterministic records | Excellent for agent flows, not host service access. | All native integrations should use launch manifests, fixtures, scripted events, or diagnostics. |
| Screenshots are placeholder metadata | Useful for artifact contract tests, weak for visual QA. | Real pixel artifacts should wait until live renderer sessions are stable. |

## Migration Risks

| Migration path | Risk | Mitigation |
| --- | --- | --- |
| Existing SwiftUI app to strict mode | Rewrite effort can feel high because strict mode is a project-owned SDK. | Provide before/after examples, ranked diagnostics, and small strict-mode templates. |
| Existing app to compatibility mode | Users may expect broad SwiftUI/UIKit support. | Keep compatibility matrix prominent and fail closed on unsupported imports/symbols. |
| In-memory SDK to transport-backed SDK | Behavior can diverge if transport semantics are designed separately. | Treat current SDK tests as the contract for transport-backed behavior. |
| Browser fixture preview to live renderer | State synchronization can introduce nondeterminism. | Define session update ordering, artifact revision IDs, and deterministic replay tests first. |
| Native mock records to richer capabilities | Mock fidelity can creep toward unsupported iOS emulation. | Require docs, tests, artifact records, and fail-closed diagnostics for every capability expansion. |
| Local repo workflow to published packages | Public API changes become more expensive. | Stabilize package names, versioning, and compatibility guarantees before publishing. |

## Integration Priorities

1. Reconcile spec and docs with the completed Phase 10 implementation so downstream integration promises match reality.
2. Design the live runtime-to-renderer transport around the existing semantic tree, artifact, network, device, and native capability records.
3. Add a transport-backed automation SDK mode that preserves current locator, artifact, and `app.native.*` behavior.
4. Document a CI recipe for strict-mode fixtures with full Swift/npm validation and artifact inspection.
5. Add package/template guidance only after the live session boundary is stable enough to avoid misleading external users.

## Follow-Up Work

- Run `$devtool-dx-journey` next to turn this map into install, first success, debugging, and failure-triage improvements.
- Keep `$spec-drift fix all` in the priority queue because `specs/open-source-iphone-emulator.md` predates the completed native automation work.
- When planning the next implementation phase, center it on transport/session coordination rather than expanding native fidelity or compatibility breadth.
