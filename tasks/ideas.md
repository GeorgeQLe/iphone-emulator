# Ideas

## Brainstorm - 2026-05-01

### Hours

- **Add a setup doctor command** - `README.md` lists a long validation matrix, but there is still no single environment check for Swift, Node/npm, workspace installs, and the accepted Vite large-chunk warning. `$spec-interview setup doctor command`
- **Publish a transport-native capability parity note** - `TransportEmulatorApp` currently routes only permission snapshot, device snapshot, and event inspection through transport while most `app.native.*` actions return unsupported helpers despite fixture mode supporting richer native controls. `$spec-interview transport native capability parity`
- **Add live-session event replay fixtures** - `RuntimeTransportSessionCoordinator` retains ordered transport events, and `RuntimeLiveSessionAdapter` can apply snapshots, but there is no checked-in replay file that renderer contributors can use without launching the Swift runtime. `$spec-interview live session replay fixtures`
- **Document diagnostics-to-strict-mode rewrites as copy-paste patches** - `DiagnosticsCore` emits source locations, categories, and suggested adaptations, but examples stop short of showing before/after strict-mode rewrites for common unsupported SwiftUI/UIKit cases. `$spec-interview compatibility rewrite examples`

### Days

- **Create a first-party strict-mode template gallery** - Research recommends strict-form and native-agent templates, while the repo has one rich baseline example; add focused templates for form, navigation, network, native mocks, and compatibility diagnostics. `$spec-interview strict mode template gallery`
- **Add an MCP tool server over the transport client** - The spec names MCP as a future agent boundary, and the TypeScript SDK now has `RuntimeTransportClient`; a thin local MCP server could expose launch, locator, inspect, artifact, network, and close tools without inventing new semantics. `$spec-interview local MCP transport server`
- **Build artifact export bundles for CI review** - The runtime and SDK expose logs, semantic snapshots, network records, native records, and screenshot metadata, but there is no standard JSON bundle layout or CLI/script that writes these records for PR artifact retention. `$spec-interview CI artifact export bundle`
- **Add source package intake diagnostics** - The spec still targets arbitrary Swift source packages, while the current SDK launches only the `strict-mode-baseline` fixture; a package scanner could produce compatibility/native manifest reports before runnable support exists. `$spec-interview Swift package intake diagnostics`

### Weeks

- **Implement real local WebSocket transport service** - The transport vocabulary is JSON-RPC/WebSocket-shaped, but the working path is deterministic in-memory; a local service would validate process boundaries, lifecycle cleanup, connection diagnostics, and future hosted-session assumptions. `$spec-interview local WebSocket runtime service`
- **Add a Swift package compile-and-run strict-mode path** - Current strict-mode runtime behavior is fixture-backed; compiling a user-supplied SwiftPM package into a harness session would move from examples toward the spec's external app adoption goal. `$spec-interview compile and run strict mode packages`
- **Ship renderer pixel artifact capture with semantic correlation** - Screenshot support currently returns deterministic metadata, while adoption and monetization docs identify real artifact retention as a later gate; browser-side captures correlated to semantic revisions would make failures easier to review without claiming native fidelity. `$spec-interview renderer pixel artifact capture`
- **Design hosted-session pilot economics and retention model** - `tasks/record-todo.md` gates hosted-session unit economics on a future pilot, and Phase 11 now provides local transport; define the pilot data model for run minutes, artifact size, retention, parallelism, and support cost before any Team Cloud roadmap. `$spec-interview hosted session pilot economics`

## Brainstorm - 2026-05-03

### Hours

- **Add a focused automation SDK API reference** - `research/devtool-docs-audit.md` flags that `Emulator.launch`, locators, `app.native.*`, artifacts, logs, routes, and transport mode are still discoverable mostly through examples and tests. `$spec-interview automation SDK API reference`
- **Create a compatibility report sample output page** - `docs/strict-mode-migration.md` explains report fields, but there is no checked-in compact supported/unsupported report example a migration user can inspect without writing Swift test harness code. `$spec-interview compatibility report sample output`
- **Document native action extension rules** - `specs/drift-report.md` notes duplicated TypeScript native transition logic, and `specs/open-source-iphone-emulator.md` says future native additions need cross-runtime tests; a short contributor rule page would reduce schema drift. `$spec-interview native action extension rules`

### Days

- **Build a deterministic compatibility report CLI** - `DiagnosticsCore.CompatibilityAnalyzer` already powers tests and migration docs, but users have no command that scans an arbitrary Swift source path and emits grouped diagnostics plus strict-mode adaptation hints. `$spec-interview compatibility report CLI`
- **Add local transport replay and diff tooling** - `RuntimeSessionCoordinator` and the browser live-session adapter already model ordered revisions, events, diagnostics, and artifacts, but there is no tool that records a transport session and diffs replayed semantic/native/artifact state for debugging regressions. `$spec-interview transport replay diff tooling`
- **Expand strict-mode UI primitives with image and scroll contracts** - `specs/open-source-iphone-emulator.md` lists image view and swipe/scroll automation as unimplemented v1 scope while the renderer and automation layers already have stable semantic primitive patterns. `$spec-interview image and scroll strict-mode contracts`
- **Add storage and environment value contracts** - The main spec still names storage APIs, environment values, observable state, and bindings as v1 gaps, and the current runtime already centralizes deterministic device, network, clock, and semantic metadata state. `$spec-interview storage environment state contracts`

### Weeks

- **Implement source-derived native capability manifests** - Diagnostics can recognize native API symbols and the runtime/SDK can execute explicit manifests, but there is no end-to-end analyzer path that derives manifest requirements from arbitrary package source before launch. `$spec-interview source derived native capability manifests`
- **Design browser/Wasm runtime target boundaries** - `specs/open-source-iphone-emulator.md` still lists a browser/Wasm runtime target as deferred, and the current renderer/live-session split provides enough contracts to specify which runtime pieces could move client-side without host native or iOS claims. `$spec-interview browser wasm runtime target`
- **Prototype deterministic sensors and haptics records** - `RuntimeNativeCapabilityID` already includes `sensors` and `haptics`, while docs keep them fail-closed; a scoped records-only contract could cover motion samples and haptic intents without host hardware access. `$spec-interview deterministic sensors haptics records`
