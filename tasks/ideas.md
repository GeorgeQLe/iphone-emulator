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
