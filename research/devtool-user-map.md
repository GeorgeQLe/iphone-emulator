# Devtool User Map

## Product Context

This project is an open-source iPhone-like app harness for agent-driven testing of Swift applications. Its strongest current value is deterministic behavior: strict-mode Swift app declarations lower into a project-owned semantic UI tree, the browser renderer mounts an iPhone-like surface, and the TypeScript automation SDK exposes fixture-backed inspection, interaction, artifacts, network records, and device metadata.

The product should be understood as a developer tool for behavior, migration, and automation work, not as an iOS simulator replacement. The audience map below assumes the current post-Phase 6 baseline: strict mode is the reliable path, compatibility mode is diagnostics-led, React Native is deferred research, and live runtime-to-renderer transport is the next likely implementation direction.

## Developer Users

| User | Primary job | Success moment | Product surface |
| --- | --- | --- | --- |
| AI coding agent | Launch an app harness, exercise flows, inspect semantic state, and report reproducible failures. | A flow can be run deterministically with semantic snapshots, logs, network records, and screenshot or render metadata. | `@iphone-emulator/automation-sdk`, semantic tree, artifact bundle, fixture apps. |
| Swift app developer | Build or adapt a small app flow without relying on Apple simulator runtime dependencies. | A strict-mode fixture compiles, lowers to `SemanticUITree`, and can be automated through stable locators. | `StrictModeSDK`, `RuntimeHost`, migration guide, examples. |
| Product engineer | Encode representative product workflows for CI, agent evaluation, and regression checks. | A checked-in fixture catches a behavior regression without live device, network, or clock state. | Strict-mode examples, route fixtures, device settings, automation SDK. |
| QA automation engineer | Add repeatable mobile-like flow checks to CI and triage failures from artifacts. | A failed run includes enough tree, log, request, and render metadata to debug without rerunning locally. | Automation SDK, artifact bundle, renderer metadata, logs. |
| Platform/tooling engineer | Integrate the harness into a broader developer platform or agent test service. | A stable process boundary can run sessions, route commands, and preserve deterministic outputs. | Runtime host, future JSON-RPC/WebSocket transport, package boundaries. |
| Compatibility contributor | Expand supported SwiftUI-inspired source patterns without weakening fail-closed diagnostics. | A new subset lowers into the same semantic tree with tests and documented support status. | `DiagnosticsCore`, compatibility matrix, strict-mode migration docs. |
| Renderer contributor | Improve browser presentation while preserving the semantic automation contract. | A UI primitive renders more clearly without changing locator semantics or deterministic metadata. | Browser renderer, `SemanticUITree` contract, render artifact tests. |

## Economic Buyers

| Buyer | Buying reason | Evaluation question | Likely proof needed |
| --- | --- | --- | --- |
| Head of Developer Experience | Reduce friction for agent-assisted app development and mobile-like testing. | Can teams get useful feedback without every run requiring a Mac simulator stack? | Quickstart, CI examples, deterministic failure artifacts, clear non-goals. |
| Engineering manager for mobile/platform | Improve repeatability of early app-flow tests and migration planning. | Does this catch useful behavior regressions before simulator or device testing? | Fixture examples, compatibility reports, migration guide, validation matrix. |
| QA/Release lead | Add stable mobile-like regression checks that are easier to triage. | Are failures reproducible, artifact-rich, and cheap to run in CI? | Artifact bundles, request logs, semantic snapshots, test reports. |
| AI tools/platform lead | Provide agents with an inspectable app harness rather than brittle screenshot-only automation. | Can agents operate through semantic locators and structured state? | Automation SDK examples, agent workflow docs, MCP or protocol roadmap. |
| Open-source program or legal stakeholder | Avoid proprietary runtime coupling and unclear simulator redistribution. | Is the project explicit about Apple runtime non-goals and open-source-only constraints? | README positioning, spec non-goals, dependency review, compatibility docs. |

## Champions

| Champion | Why they advocate | Enablement needed |
| --- | --- | --- |
| Agent workflow owner | The harness gives agents stable semantic handles and deterministic artifacts. | End-to-end examples showing form entry, navigation, network mocking, and artifact inspection. |
| Mobile test infrastructure engineer | The project can occupy a lightweight pre-simulator testing layer. | CI recipes, package-level validation commands, failure triage examples. |
| Swift developer migrating app logic | Diagnostics and strict-mode guidance make unsupported Apple APIs explicit. | Compatibility reports with grouped migration hints and strict-mode rewrite examples. |
| OSS contributor interested in runtimes | The architecture has clear package seams and contract tests. | Contributor guide, issue labels by package, compatibility expansion rules. |

## Maintainers And Operators

| Stakeholder | Operational responsibility | Risk to manage |
| --- | --- | --- |
| Core maintainer | Keep strict-mode SDK, runtime host, renderer, and automation SDK contracts aligned. | Scope creep into iOS fidelity or broad compatibility shims. |
| Release maintainer | Validate SwiftPM packages, browser renderer, and automation SDK before publishing changes. | Multi-language test drift and undocumented validation gaps. |
| Documentation maintainer | Keep positioning, compatibility limits, and migration advice consistent. | Users mistaking the harness for iOS, UIKit, SwiftUI, WebKit, or Xcode Simulator. |
| CI operator | Run deterministic tests and preserve artifacts for failure analysis. | Fixture state becoming implicit or environment-dependent. |
| Future service operator | Host runtime sessions and renderer sessions if the project becomes a server tool. | Session isolation, artifact retention, and transport-level reliability. |

## Core Use Cases

| Use case | User | Current fit | Missing or next dependency |
| --- | --- | --- | --- |
| Agent runs a strict-mode fixture and inspects state | AI coding agent | Strong | Live transport would remove the current in-memory-only SDK limitation. |
| CI validates a deterministic form and network flow | QA automation engineer | Strong for fixture-backed flows | Real pixel artifacts and broader examples would improve triage. |
| Developer rewrites an app screen into strict mode | Swift app developer | Moderate | More strict-mode templates and migration examples. |
| Compatibility scan groups unsupported SwiftUI/UIKit patterns | Swift app developer | Moderate | More analyzer coverage and report-oriented CLI/docs. |
| Browser renderer previews a semantic tree | Product engineer | Moderate | Runtime-exported snapshot ingestion and session synchronization. |
| Platform team embeds the harness in an agent service | Platform/tooling engineer | Early | JSON-RPC/WebSocket transport, process lifecycle, and artifact storage contracts. |
| Contributor adds a supported UI primitive | Compatibility or renderer contributor | Moderate | Contribution docs that explain contract-test expectations across packages. |

## Adoption Blockers

| Blocker | Affected audience | Why it matters | Mitigation direction |
| --- | --- | --- | --- |
| Simulator expectation mismatch | Buyers, Swift developers, QA leads | Users may expect real iOS, UIKit, SwiftUI, WebKit, or Xcode Simulator behavior. | Keep product copy explicit: iPhone-like harness for deterministic agent testing, not an iOS simulator. |
| Strict-mode rewrite cost | Swift app developers, product engineers | The most reliable path requires targeting the project-owned SDK. | Provide templates, before/after migration examples, and compatibility reports that rank rewrite work. |
| In-memory automation only | Platform/tooling engineers, agent workflow owners | Current SDK does not speak to a live Swift host or browser session. | Prioritize live runtime-to-renderer transport and session coordination. |
| Placeholder screenshots | QA leads, product engineers | Visual triage is limited without real pixel capture. | Add a real artifact pipeline after transport and renderer sessions are stable. |
| Narrow compatibility subset | Swift app developers, compatibility contributors | Existing apps often use unsupported Apple-only APIs. | Treat diagnostics as product output and grow support only through tested semantic lowering. |
| Multi-package validation burden | Maintainers, contributors | Swift and TypeScript packages can drift without clear validation discipline. | Keep validation commands canonical and add contributor-facing package ownership docs. |
| Legal/licensing confusion | Economic buyers, OSS stakeholders | The value depends on avoiding proprietary runtime assumptions. | Continue documenting open-source-only constraints and non-goals in every onboarding path. |

## Segmentation Priority

1. AI coding agents and agent workflow owners are the sharpest early segment because the semantic tree, deterministic artifacts, and fixture-backed SDK directly match their needs.
2. Platform/tooling and QA automation engineers are the best second segment because they can use the harness as a repeatable pre-simulator layer in CI.
3. Swift app developers are important but need more strict-mode examples and migration help before the project feels low-friction.
4. Compatibility and renderer contributors become more important once the core transport loop is stable and package ownership is easier to explain.

## Follow-Up Work

- Create the queued integration map to define the exact surfaces between SwiftPM modules, renderer, automation SDK, and future live transport.
- Create the queued DX journey to turn this user map into install, first-run, first-test, and failure-triage improvements.
- Keep the next implementation roadmap centered on strict-mode live runtime-to-renderer transport before expanding compatibility lanes.
