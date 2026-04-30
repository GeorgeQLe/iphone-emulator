# Devtool Positioning

## Positioning Summary

This project should be positioned as an open-source, iPhone-like harness for deterministic Swift app-flow testing by agents and developers. It is a pre-simulator, fixture-backed testing and migration layer, not an iOS simulator, UIKit/SwiftUI runtime, WebKit host, or device farm.

The sharpest concise positioning:

> An open-source iPhone-like app harness for agents: deterministic Swift-style fixtures, semantic UI inspection, native mock records, network fixtures, and artifact-rich automation without Apple simulator dependencies.

## Primary Category

| Category option | Fit | Why |
| --- | --- | --- |
| iOS simulator alternative | Poor | Creates incorrect expectations around real iOS, UIKit, SwiftUI, WebKit, binary compatibility, and pixel fidelity. |
| Mobile test automation framework | Partial | The automation SDK is useful, but current sessions are in-memory fixtures rather than live app/device sessions. |
| Agent app harness | Strong | Semantic inspection, deterministic artifacts, network/native fixtures, and Playwright-style controls map directly to agent workflows. |
| Swift migration and diagnostics tool | Secondary | Compatibility diagnostics help migration, but strict-mode deterministic testing is the core path. |
| Browser preview for Swift-like apps | Secondary | The browser renderer is useful, but the product value is broader than preview. |

Recommended category language: **agent app harness** or **deterministic mobile-like harness**, with "iPhone-like" used descriptively and not as a simulator claim.

## Alternatives

| Alternative | Developer chooses it when | This project wins when | This project should concede when |
| --- | --- | --- | --- |
| Xcode Simulator / real iOS devices | They need iOS fidelity, UIKit/SwiftUI behavior, WebKit, screenshots, device hardware, or App Store binary realism. | They need open-source, deterministic, inspectable pre-simulator behavior for agents and CI fixtures. | The test depends on real platform behavior, rendering fidelity, or hardware/native APIs. |
| Mobile device cloud | They need many real devices, OS versions, screenshots/videos, and production release confidence. | They need cheap local deterministic checks before device-cloud runs. | The buyer wants hosted real-device coverage today. |
| Playwright/browser-only testing | They test web apps or browser-rendered surfaces. | They need Swift-style app declarations, semantic mobile-like UI tree, native mock records, and fixture-backed mobile workflows. | The app is a web app and browser fidelity is enough. |
| XCTest / native iOS UI tests | They already have real iOS app targets and Mac/iOS infrastructure. | They want a portable open-source harness for early agent evaluation or migration diagnostics. | Existing XCTest coverage depends on platform behavior. |
| SwiftUI previews | They need developer-time visual previews inside Apple tooling. | They need automated semantic inspection, logs, network/native fixtures, and agent-readable artifacts. | The job is UI iteration inside Xcode. |
| Homegrown fixture harness | They need a narrow internal test tool. | They want shared package boundaries, diagnostics, native mock taxonomy, and an automation SDK. | Internal needs are simpler than adopting the repo. |
| React Native / cross-platform runtimes | They target JS/RN app stacks. | They are working with Swift-style flows or need deterministic semantic contracts for agents. | The app is primarily React Native and needs JS/native-module fidelity now. |

## Unique Workflow Advantages

| Advantage | Why it matters | Current proof |
| --- | --- | --- |
| Semantic-first automation | Agents can inspect roles, labels, values, IDs, and state instead of guessing from pixels. | `Emulator.launch`, locators, `semanticTree()`, `inspect()`. |
| Deterministic fixture state | CI and agents can reproduce flows without host device, live network, live time, or OS permissions. | Route fixtures, device settings, native capability manifests. |
| Native behavior as records | Camera/photos/location/clipboard/files/share/notifications become inspectable events/artifacts, not hidden host calls. | `app.native.*`, native capability state/events/artifacts. |
| Fail-closed compatibility | Unsupported Apple APIs produce diagnostics rather than pretending to work. | Compatibility matrix and diagnostics contracts. |
| Open-source-only runtime posture | Avoids proprietary simulator/runtime coupling. | README/spec non-goals and package architecture. |
| Multi-surface artifact loop | Failures can include semantic snapshots, logs, network records, screenshot metadata, and native records. | Automation SDK and runtime artifact bundle. |

## Ecosystem Fit

| Ecosystem | Fit statement |
| --- | --- |
| SwiftPM | Natural development surface for strict-mode SDK, runtime host, and diagnostics packages. |
| Node/TypeScript | Natural automation and browser-renderer surface through npm workspaces, Vite, Vitest, and TypeScript. |
| Agent platforms | Strong conceptual fit once a tool/server boundary exists; current SDK already models agent-friendly inspection. |
| CI | Good fit for deterministic fixture checks, but docs need a CI recipe and artifact retention guidance. |
| Existing iOS teams | Useful as a pre-simulator layer and migration diagnostic aid, not a replacement for real simulator/device validation. |
| Open-source contributors | Package boundaries and contract tests are good foundations; contributor guide is still missing. |

## Trust Claims

Use these claims because the current repo supports them:

- Deterministic strict-mode fixtures can be automated through a TypeScript SDK.
- The harness exposes semantic UI state, logs, route records, device metadata, screenshot placeholder metadata, and native capability records.
- Native capabilities are explicit fixture contracts and high-level deterministic SDK controls.
- Compatibility mode is diagnostics-led and fail-closed for unsupported Apple APIs.
- The project avoids Apple proprietary simulator/runtime dependencies.

Avoid these claims until future work lands:

- Runs real iOS apps.
- Replaces Xcode Simulator or device-cloud testing.
- Supports broad SwiftUI/UIKit compatibility.
- Produces real native screenshots or videos.
- Drives live Swift/browser sessions through transport.
- Accesses host camera, clipboard, files, notification center, sensors, haptics, or device APIs.
- Installs as a stable external package for production app repos.

## Switching Cost

| From | Switching cost | Recommended wedge |
| --- | --- | --- |
| Xcode Simulator/XCTest | High for existing native tests because platform semantics differ. | Do not replace; add deterministic pre-simulator fixtures for agent-evaluable flows. |
| Manual simulator QA | Moderate because fixture flows must be encoded. | Start with one strict-mode form/native flow and artifact checklist. |
| Browser-only automation | Moderate if workflows are already web-based. | Use this only when Swift-style/native mock semantics matter. |
| Homegrown scripts | Low to moderate if scripts already model fixtures. | Offer stronger semantic/artifact/native capability conventions. |
| No automated mobile-like checks | Low for first fixture, higher for meaningful coverage. | First-green-run plus strict-mode templates. |
| Existing Swift app code | High if expecting full compatibility. | Use diagnostics to scope rewrite work; migrate one screen or flow first. |

## Concise Copy Options

### One-Liner

Open-source, iPhone-like app harness for deterministic agent testing of Swift-style flows.

### Short Paragraph

This harness lets agents and developers run Swift-style app flows in a deterministic, inspectable iPhone-like environment. It favors semantic UI state, fixture-backed network/native behavior, logs, and artifacts over simulator fidelity, so teams can catch behavior regressions before reaching for real iOS simulators or devices.

### README Positioning Block

Use this project when you need an open-source, deterministic app harness for Swift-style flows that agents can inspect and automate. Do not use it as an iOS simulator replacement: it does not run UIKit, SwiftUI, WebKit, App Store binaries, host native services, or real devices. The value is stable semantic automation, fixture-backed network/native mocks, compatibility diagnostics, and artifact-rich debugging.

### Buyer-Framed Statement

For agent platform, QA, and mobile infrastructure teams, this project provides a portable pre-simulator layer for deterministic mobile-like flow checks. It reduces reliance on brittle screenshot-only automation for early feedback while preserving a clear boundary: real iOS fidelity still belongs in simulator or device testing.

## Naming Guidance

The working repository name is understandable internally, but public copy should avoid making "emulator" the main promise. Prefer:

- "iPhone-like app harness"
- "deterministic Swift app harness"
- "agent app harness for Swift-style flows"
- "pre-simulator mobile-like testing layer"

Avoid:

- "iOS emulator"
- "Simulator replacement"
- "SwiftUI runtime"
- "UIKit-compatible"
- "device cloud"

## Positioning Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| "Emulator" overpromises | Developers may expect real iOS behavior. | Lead with harness and deterministic testing language. |
| Agent value sounds abstract | Users may not see why semantic state matters. | Show proof artifacts from the automation example. |
| Strict-mode sounds like a rewrite tax | Swift developers may bounce. | Position strict mode as the reliable fixture path and compatibility diagnostics as migration help. |
| Placeholder screenshots weaken trust | Visual QA buyers may dismiss it. | Emphasize artifact-rich debugging and avoid visual fidelity claims. |
| In-memory SDK appears incomplete | Platform teams need live sessions. | Be explicit that transport-backed sessions are the next adoption gate. |

## Recommended Positioning Work

1. Update public-facing README language to use "iPhone-like app harness" more prominently than "emulator."
2. Add a short "Use this when / Do not use this when" section to reduce simulator expectation mismatch.
3. Add a proof-artifact screenshot or console-output excerpt showing semantic/log/network/native records.
4. Reconcile the main spec so public API sketches match the completed Phase 10 SDK shape.
5. Keep roadmap language centered on live runtime-to-renderer transport before broader compatibility or native fidelity claims.

## Follow-Up Work

- Run `$devtool-monetization` to decide packaging, hosted service, OSS/commercial split, and team adoption boundaries.
- Keep `$spec-drift fix all` queued because public spec language now lags the implemented automation and native capability surface.
- After the research queue, promote README positioning and first-green-run documentation into executable docs tasks.
