# Devtool DX Journey

## Product Context

This project is a developer tool for deterministic iPhone-like Swift app testing. The current experience is strongest for contributors and agent workflow authors working inside the repo: SwiftPM and npm workspace commands validate the runtime, renderer, diagnostics, and automation SDK, while the strict-mode baseline example demonstrates fixture-backed automation and native capability records.

The product is not yet packaged for external app teams. There is no live Swift-to-browser transport, no published package install path, no MCP/server boundary, and no real pixel artifact pipeline. The DX journey should therefore separate the current contributor path from the future external-user path.

## Journey Summary

| Stage | Current experience | Main friction | DX priority |
| --- | --- | --- | --- |
| Discovery | README clearly states open-source iPhone-like harness, strict mode, compatibility diagnostics, and non-goals. | The name and domain can still imply simulator fidelity. | Keep non-goals and deterministic-agent positioning above the fold. |
| Install | Clone repo, install Swift and Node/npm, use local workspaces. | No single setup script or environment check. | Add a smoke setup command before external promotion. |
| Quickstart | README and strict-mode example show the automation SDK flow. | Example is long and assumes repo context. | Add a minimal "first green run" path with expected output. |
| First success | Run validation and `npx tsx examples/strict-mode-baseline/automation-example.ts`. | Success criteria are scattered across README, example docs, and history. | Define one canonical first-success command and output snippet. |
| Error recovery | Unsupported APIs produce diagnostics; validation commands are explicit. | Toolchain failures, npm install issues, and SwiftPM/package drift are not triaged in docs. | Add troubleshooting for install, build, diagnostics, and fixture failures. |
| Production adoption | Deterministic artifacts, native mocks, network fixtures, and semantic inspection map well to CI and agents. | In-memory-only SDK and checked-in renderer fixture block real app/session adoption. | Treat CI fixture usage as the near-term adoption path; defer live-session claims. |
| Team rollout | Package boundaries and validation commands are clear for contributors. | No contributor ownership guide, release process, or package stability policy. | Add contribution and package ownership docs before broad team use. |
| Retention | Research queue points toward integration, DX, adoption, positioning, monetization, and spec drift. | No recurring docs-health or example freshness loop. | Add a docs/example freshness check after the research queue is complete. |

## Install Journey

### Current Path

1. Clone the repository.
2. Ensure Swift and Node/npm are installed.
3. Install npm dependencies from the repository root.
4. Run Swift validation with `swift test` and `swift build`.
5. Run package-local TypeScript validation for `packages/browser-renderer` and `packages/automation-sdk`.

### Developer Questions

| Question | Current answer | Gap |
| --- | --- | --- |
| What do I need installed? | README implies Swift and npm by showing commands. | No explicit version or environment check. |
| Do I need Xcode or iOS Simulator? | README says the project does not depend on Apple proprietary runtimes. | This should be repeated in setup. |
| Do I install from npm/SwiftPM or clone the repo? | Current path is repo clone. | External package install path is not ready. |
| How do I know setup succeeded? | Run the validation matrix. | Too many commands for first success. |

### Improvements

- Add a `scripts/smoke-install.sh` or equivalent setup check that verifies Swift, Node/npm, npm dependencies, and one focused Swift/npm test.
- Add README setup prerequisites with minimum supported Swift and Node versions once confirmed.
- Keep package publishing out of the quickstart until API stability and live transport are clearer.

## Quickstart Journey

### Current Path

The quickstart is effectively the strict-mode baseline example:

1. Read `examples/strict-mode-baseline/README.md`.
2. Run the automation example with `npx tsx examples/strict-mode-baseline/automation-example.ts`.
3. Inspect console output for semantic state, logs, request records, native capability records, and artifact counts.

### First Success Definition

A developer has reached first success when they can run one deterministic fixture flow and see:

- A semantic field value after `fill()`.
- A deterministic alert/state update after `tap()`.
- A route fixture request record.
- A screenshot placeholder metadata record.
- Native capability event names and artifact count.
- No live iOS, host device, host permission, or live network dependency.

### Friction

- The first-success path is buried below a large README example.
- The example output is not documented as a compact expected-output block.
- The distinction between in-memory SDK and future live transport is clear but repeated late.

### Improvements

- Add a short "First green run" section near the top of README with exactly one command and abbreviated expected output.
- Add a smaller quickstart fixture or shrink the displayed example while linking to the full native-capability version.
- Add a "what just happened" paragraph that names semantic tree, route fixture, native mock records, and artifact bundle.

## Debugging And Error Recovery

| Failure mode | Current support | Needed recovery path |
| --- | --- | --- |
| Swift toolchain missing or incompatible | Validation commands fail directly. | Setup check should print install/version guidance. |
| npm dependencies missing | Package commands fail. | Quickstart should say when to run `npm install`. |
| SwiftPM contract test failure | Tests identify package-level contracts. | Docs should map major suites to package areas. |
| Browser renderer test/build failure | Package scripts exist. | Troubleshooting should mention Vite large-chunk warning is accepted when unchanged. |
| Automation SDK fixture failure | Vitest coverage and example expose deterministic records. | Add common fixture mismatch examples for locators, routes, and native mocks. |
| Unsupported Swift/API behavior | Compatibility diagnostics and docs exist. | Add an error-recovery path from diagnostic category to strict-mode rewrite guidance. |
| Native mock fixture missing | SDK/runtime append diagnostics for missing fixtures. | Document how to fix `missingFixture` by adding `configuredMocks` payloads. |
| User expects iOS fidelity | README non-goals are clear. | Troubleshooting should explicitly redirect to real simulator/device testing for fidelity needs. |

## Production Adoption Journey

### Near-Term Production Fit

The credible near-term production workflow is CI or agent evaluation over checked-in strict-mode fixtures:

1. Maintain strict-mode fixture apps for important flows.
2. Configure deterministic network routes, device settings, and native capability manifests.
3. Run TypeScript automation flows in CI.
4. Preserve logs, semantic snapshots, request records, screenshot metadata, and native capability records.
5. Use compatibility diagnostics separately to estimate migration work for existing Swift code.

### Not Yet Production-Ready

The project should not yet promise:

- Live Swift app session automation.
- Runtime-to-browser state synchronization.
- Real screenshot/video capture.
- Published package install for external app repositories.
- iOS, UIKit, SwiftUI, WebKit, or simulator fidelity.
- Host native permissions, camera, files, clipboard, notifications, or device behavior.

### Adoption Gate

The next adoption gate is live runtime-to-renderer transport with a transport-backed automation SDK mode. Until that exists, production language should frame the harness as a deterministic fixture and agent-evaluation layer.

## Team Rollout Journey

| Team role | Needs before rollout | Current state |
| --- | --- | --- |
| Agent workflow owner | One example flow that agents can adapt and inspect. | Mostly present through automation SDK and native example. |
| QA automation engineer | CI recipe, artifact retention guidance, and failure triage docs. | Partially present; CI recipe missing. |
| Swift developer | Strict-mode templates and compatibility migration guidance. | Migration docs exist; templates are thin. |
| Platform engineer | Process/session protocol and service boundary. | Not yet implemented. |
| Contributor | Package ownership map and validation expectations. | Package layout is clear; contributor guide missing. |
| Maintainer | Release/versioning policy and public API stability rules. | Not yet defined. |

## Retention Journey

Developers are likely to return when the harness gives them deterministic, inspectable failures that are cheaper to understand than screenshot-only automation. Retention depends on making the artifact loop obvious:

- Semantic tree answers what the app state is.
- Logs explain what actions happened.
- Network records explain fixture interactions.
- Native capability records explain mocked permission/native-service state.
- Renderer metadata explains what the browser preview rendered.

The current docs show these pieces, but retention would improve if the example output were structured as an artifact review checklist.

## DX Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Quickstart overload | The representative example is useful but dense. | Split first run from full native-capability walkthrough. |
| Product expectation mismatch | Users may expect a simulator. | Keep "iPhone-like harness" and non-goals in every onboarding path. |
| Toolchain ambiguity | Swift/npm setup varies by machine and CI image. | Add setup check and version guidance. |
| In-memory limitation surprise | Users may expect SDK to drive a live browser. | Label current SDK mode as in-memory in quickstart and examples. |
| Artifact value not obvious | Placeholder screenshots may look underwhelming. | Emphasize semantic/log/network/native artifacts as the primary value. |
| Contributor drift | Multi-language packages can diverge. | Add ownership/validation docs and keep a canonical command matrix. |

## Recommended DX Work

1. Add a README "First green run" section with one command, expected output, and a short explanation.
2. Add setup prerequisites and a smoke setup command for Swift, Node/npm, and package validation.
3. Add troubleshooting docs for missing fixtures, unsupported diagnostics, toolchain failures, and accepted renderer build warnings.
4. Add a CI fixture recipe that preserves semantic, log, network, screenshot metadata, and native capability artifacts.
5. Add a contributor guide that maps package ownership to validation commands.
6. Keep live transport and transport-backed automation as the next implementation direction before promising external production adoption.

## Follow-Up Work

- Run `$devtool-adoption` to turn the DX journey into examples, templates, CI proof artifacts, and community/adoption loops.
- Keep `$spec-drift fix all` queued because the main spec predates the completed native automation surface.
- Consider adding the README first-green-run and troubleshooting docs as immediate documentation implementation work after the research queue is complete.
