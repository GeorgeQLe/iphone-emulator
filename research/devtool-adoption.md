# Devtool Adoption Plan

## Product Context

This project is best adopted today as a deterministic fixture and agent-evaluation harness for Swift-like app flows, not as a general iOS simulator. The strongest adoption wedge is the ability for agents, QA automation engineers, and platform teams to run inspectable mobile-like flows with semantic state, logs, network records, device metadata, and native capability mock records.

Adoption work should make the current local-first path easier to trust while avoiding premature external promises. Live runtime-to-renderer transport, package publishing, MCP/server integration, and real pixel artifacts are future adoption gates.

## Adoption Loops

| Loop | Audience | Trigger | Proof of value | Current readiness |
| --- | --- | --- | --- | --- |
| Agent fixture loop | AI coding agents and agent workflow owners | Need a stable mobile-like app flow an agent can inspect. | Run strict-mode automation example and inspect semantic/log/network/native artifacts. | Strong for in-repo fixtures. |
| CI regression loop | QA automation and platform engineers | Need repeatable pre-simulator checks. | CI run produces deterministic records without host device, live network, or OS permissions. | Moderate; needs CI recipe and artifact guidance. |
| Migration diagnostics loop | Swift developers and mobile teams | Need to understand unsupported APIs before rewriting. | Compatibility diagnostics identify unsupported imports/symbols and strict-mode alternatives. | Moderate; needs report-oriented examples. |
| Contributor expansion loop | OSS contributors | Want to add UI primitives, diagnostics, or native mock contracts. | Contract tests show where to add behavior and how to validate it. | Moderate; needs contributor guide. |
| Demo/preview loop | Product engineers and evaluators | Want to see iPhone-like preview and state inspection. | Browser demo renders fixture and native preview cards. | Moderate; live runtime sync still missing. |

## Examples To Create Or Strengthen

| Example | Purpose | Minimum contents | Priority |
| --- | --- | --- | --- |
| First green run | Fast activation for new users. | One command, expected output, and explanation of semantic/log/network/native artifact values. | Highest |
| CI fixture flow | Prove repeatable automation. | Script that runs automation example and preserves JSON/text artifact output. | High |
| Strict-mode form template | Reduce rewrite friction. | Small form with text field, button, alert, semantic identifiers, and automation test. | High |
| Native mock template | Show deterministic native-service setup. | Camera/photo fixture, location denial, clipboard, notification schedule, event/artifact assertions. | High |
| Compatibility diagnostic fixture | Make migration value concrete. | Unsupported SwiftUI/UIKit source plus expected diagnostics and strict-mode rewrite hint. | Medium |
| Renderer preview fixture | Help renderer contributors. | Semantic tree input, expected DOM hooks, render metadata, native preview card assertions. | Medium |
| Transport contract preview | Prepare future adoption gate. | Spec-only example of session launch/update/inspect messages over JSON-RPC/WebSocket. | Later |

## Templates

| Template | Target user | Files it should include |
| --- | --- | --- |
| `templates/strict-form-flow` | Swift app developer or agent workflow author | Strict-mode Swift fixture, automation test, README, validation command. |
| `templates/native-agent-flow` | AI agent/platform team | Launch manifest, native capability mocks, automation script, expected event/artifact names. |
| `templates/ci-fixture-check` | QA/platform engineer | npm script or shell script, artifact output directory convention, failure triage README. |
| `templates/compatibility-report` | Swift migration user | Input Swift fixture, expected diagnostics, migration notes, strict-mode rewrite sketch. |
| `templates/contributor-package-change` | OSS contributor | Package ownership checklist, test command mapping, docs update checklist. |

Templates should remain repo-local until the package install story is stable. They should avoid implying published SDK/package availability.

## Proof Artifacts

Adoption should lead with concrete evidence rather than product claims.

| Proof artifact | Shows | How to produce today |
| --- | --- | --- |
| Semantic snapshot excerpt | Agents can inspect app state without screenshot guessing. | `app.semanticTree()` from automation example. |
| Locator interaction log | Actions mutate deterministic fixture state. | `app.logs()` after `tap()` and `fill()`. |
| Network request record | CI can test network behavior without live HTTP. | `app.route(...)` plus `app.request(...)`. |
| Native capability event list | Native flows are deterministic records. | `app.native.events()` after camera/photo/location/clipboard/notification controls. |
| Artifact bundle summary | A failed run has structured debugging data. | `app.artifacts()` from strict-mode example. |
| Compatibility diagnostic output | Unsupported APIs fail closed with guidance. | `swift test --filter DiagnosticsCoreContractTests` fixtures or a future report command. |
| Renderer DOM hook capture | Preview is inspectable and stable. | Browser renderer tests for semantic hooks and native preview cards. |

## Community Channels

| Channel | Role | Timing |
| --- | --- | --- |
| GitHub README and examples | Primary adoption surface before package publishing. | Now |
| GitHub issues with package labels | Contributor routing for SDK/runtime/renderer/diagnostics/docs. | After contributor guide |
| Discussions or roadmap issues | Collect use cases and clarify simulator non-goals. | After first external users |
| Example gallery in repo | Show supported patterns and proof artifacts. | Before broad outreach |
| Short demo videos/screenshots | Explain browser preview and artifact review. | After first-green-run docs and CI recipe |
| Agent integration notes | Help agent platforms use semantic artifacts. | After transport/MCP direction is chosen |

The community loop should stay anchored in GitHub until the project has a live-session adoption gate. External community work is premature if users cannot reproduce the core path quickly.

## Activation Metrics

| Metric | What it proves | Collection mode |
| --- | --- | --- |
| Time to first green run | Setup and quickstart are understandable. | Manual dogfood or scripted smoke run. |
| First-run command success rate | Toolchain prerequisites are documented well. | Future CI/example telemetry or manual issue tagging. |
| Automation example completion | Users can run the core fixture flow. | `npx tsx examples/strict-mode-baseline/automation-example.ts` output. |
| Artifact review completion | Users understand the value beyond placeholder screenshots. | Checklist in example docs. |
| Diagnostic-to-rewrite completion | Compatibility docs help migration. | Manual review of diagnostic fixture walkthrough. |
| Contributor PR validation pass rate | Package ownership and validation docs are clear. | Maintainer review and CI once added. |
| Repeat fixture additions | Teams are adopting the pattern for more flows. | Count new examples/templates/fixtures over time. |

## Trust Builders

| Trust need | Current asset | Missing asset |
| --- | --- | --- |
| Legal/runtime clarity | README non-goals and open-source-only constraint. | Repeated setup/quickstart disclaimer for no simulator fidelity. |
| Determinism | Tests and fixture-backed SDK. | CI recipe showing same outputs across runs. |
| Debuggability | Semantic/log/network/native artifact surfaces. | Artifact review checklist and example output snapshot. |
| Contributor safety | Contract tests across Swift and TypeScript packages. | Package ownership and validation guide. |
| Migration honesty | Compatibility matrix and diagnostics docs. | End-to-end diagnostic report example. |
| Roadmap credibility | Phase history and research queue. | Updated spec that reflects Phase 10 reality. |

## Adoption Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Users expect iOS simulator fidelity | Misuse and disappointment. | Keep "iPhone-like deterministic harness" in every adoption artifact. |
| Quickstart feels too large | Users fail before seeing value. | Add one-command first-green-run path with expected output. |
| Artifact value is abstract | Placeholder screenshots weaken perceived value. | Show semantic/log/network/native records as primary proof. |
| In-memory SDK is mistaken for live transport | Platform teams overestimate readiness. | Label current SDK as in-memory in adoption examples. |
| Strict-mode rewrite cost slows app teams | Swift developers defer trying it. | Add strict-mode form/native templates and compatibility diagnostic walkthroughs. |
| Contributor changes break cross-package contracts | Maintenance burden grows. | Add contributor guide and package-specific validation matrix. |

## Recommended Adoption Work

1. Add README first-green-run instructions with expected output from the strict-mode automation example.
2. Add a repo-local CI fixture recipe that runs the automation example and captures artifact summaries.
3. Add a troubleshooting page for toolchain setup, missing native fixtures, unsupported diagnostics, and accepted renderer build warnings.
4. Add strict-mode and native-agent-flow templates under `examples/` or `templates/`.
5. Add a contributor guide with package ownership, validation commands, and docs update expectations.
6. Reconcile the main spec before planning external packaging or community outreach.
7. Defer broad adoption pushes until live runtime-to-renderer transport and transport-backed automation SDK mode are designed.

## Follow-Up Work

- Run `$devtool-positioning` to sharpen the public framing against iOS Simulator, browser-only previews, Playwright, and mobile test clouds.
- Keep `$devtool-monetization` queued for packaging, hosted service, and open-source/commercial boundary thinking.
- Promote README first-green-run, troubleshooting, CI fixture recipe, and contributor guide work into `tasks/todo.md` after the research queue is complete or after `$spec-drift fix all` reconciles the public contract.
