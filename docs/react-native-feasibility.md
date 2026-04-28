# React Native Feasibility Evaluation

React Native should remain a deferred research and adapter lane, not a near-term implementation phase. The current strict-mode runtime, semantic UI tree, browser renderer, automation SDK, deterministic network fixtures, device metadata, and artifact records are useful foundations, but they are not yet enough to execute React Native code or model native module behavior with the same deterministic contract the project requires.

## Decision

Keep React Native out of the next implementation phase.

The recommended path is to first finish the live runtime-to-renderer transport and session coordination for strict-mode apps. After that boundary is stable, React Native can be reconsidered as a separate compatibility adapter that lowers a constrained React Native subset into the existing semantic tree and automation contracts.

## Current Project Baseline

The project currently has:

- A Swift-owned `StrictModeSDK` that lowers project-owned app declarations into `RuntimeHost.SemanticUITree`.
- A `RuntimeHost` session model with semantic tree snapshots, lifecycle state, deterministic device metadata, runtime logs, semantic snapshot artifacts, render/screenshot metadata, and HAR-like network records.
- A diagnostics-led compatibility mode for a small SwiftUI-inspired subset.
- A browser renderer that mounts a checked-in semantic tree fixture into an iPhone-like DOM surface and produces deterministic DOM render metadata.
- A TypeScript automation SDK that mirrors the runtime contract in memory for fixture-backed launch, locators, interaction, semantic inspection, logs, route fixtures, request records, screenshots, and artifact bundles.

The project does not yet have:

- JSON-RPC or WebSocket transport between Swift, the browser renderer, and the automation SDK.
- A live runtime-to-browser session loop.
- A JavaScript execution environment for app code.
- A React reconciler host config.
- A native module mocking contract.
- A real pixel artifact pipeline.

## JS Runtime Strategy

React Native would require a JavaScript runtime boundary before any app code can execute. The likely open-source choices are JavaScriptCore, Hermes, or a Node/V8-based development host. Each choice adds a different integration cost:

| Runtime option | Fit | Concern |
| --- | --- | --- |
| JavaScriptCore | Conceptually close to Apple platform JavaScript hosting and available as open-source technology. | Packaging and cross-platform embedding need careful validation outside Apple-proprietary assumptions. |
| Hermes | Aligned with React Native's open-source runtime direction. | Adds a larger toolchain and bytecode/runtime surface than the project currently needs. |
| Node or V8 host | Practical for early adapter experiments and test orchestration. | Not representative of mobile React Native runtime behavior and may blur the product contract. |

The strict-mode runtime is currently Swift-first. Adding React Native before transport exists would force the project to solve JavaScript hosting, bundle loading, module resolution, and session coordination at the same time. That is too much new infrastructure for the current phase.

## Native Module Mocking

React Native apps commonly depend on native modules for storage, networking, device state, navigation, sensors, permissions, images, and platform services. This project can support deterministic substitutes for some of those through existing runtime concepts:

| React Native dependency | Existing project fit | Required adapter work |
| --- | --- | --- |
| Network requests | Good fit with `RuntimeNetworkFixture` and request records. | Provide a JS-facing fetch/XMLHttpRequest bridge that records through runtime artifacts. |
| Device metadata | Good fit with `RuntimeDeviceSettings`. | Expose deterministic locale, clock, viewport, color scheme, geolocation, and network state to JS. |
| Logs | Good fit with runtime automation logs. | Capture JS console and native-module logs into `RuntimeArtifactBundle.logs`. |
| Storage | No current model. | Define deterministic fixture-backed storage before supporting app code that expects persistence. |
| Permissions and sensors | No current model beyond static device metadata. | Add explicit mock contracts, not platform shims. |
| Native UI modules | Poor fit today. | Require semantic adapters or unsupported diagnostics. |

Native module support should be fail-closed. Unsupported modules should produce structured compatibility diagnostics or adapter errors rather than partial hidden behavior.

## Renderer Integration

The current browser renderer consumes `SemanticUITree` and renders deterministic DOM. React Native has its own component model and style system, so the practical adapter would not run native views. It would translate a constrained React Native element tree into the existing semantic tree roles:

- `Text` to semantic `text`
- `Pressable`, `Button`, or touchable primitives to semantic `button`
- `TextInput` to semantic `textField`
- `View` and simple flex containers to semantic `vStack` or `hStack` only where ordering is deterministic
- Lists to semantic `list` only after a stable item contract exists
- Modal, tabs, alerts, and navigation only through explicit project-owned scene metadata

The renderer should remain semantic-tree-driven. Building a React Native renderer directly in the DOM would duplicate the browser renderer and weaken the shared automation contract.

## Semantic Tree Reuse

Semantic tree reuse is the strongest reason to keep React Native as a future adapter rather than a parallel runtime. The existing `SemanticUITree`, `UITreeScene`, `UITreeNode`, roles, labels, values, identifiers, and metadata are already what automation consumes.

The missing work is an adapter contract that can:

- Build deterministic semantic identifiers from React Native props or explicit test IDs.
- Preserve user-visible labels and input values.
- Represent supported navigation, modal, tab, and alert state as project-owned scene metadata.
- Reject unsupported style-only or native-only behavior unless it has semantic value.
- Produce the same artifact and automation surfaces as strict-mode apps.

This should be developed after strict-mode live sessions prove the semantic tree can drive a real renderer loop.

## Automation SDK Reuse

The TypeScript automation SDK is reusable if React Native lowers into the same runtime session model. Existing APIs such as `Emulator.launch`, `getByText`, `getByRole`, `getByTestId`, `semanticTree`, `logs`, `route`, `request`, `screenshot`, and `artifacts` can remain stable.

React Native would need new launch options, likely separate from strict-mode fixtures:

- A bundle or entry module reference.
- A supported adapter mode or compatibility profile.
- Native module fixture definitions.
- Optional initial props.
- Device and network settings using the existing `RuntimeDeviceSettings` and fixture contracts.

The SDK should not grow React Native-specific locator semantics unless the semantic tree proves that the current role/text/test-ID model is insufficient.

## Network, Device, and Artifact Compatibility

The existing artifact model maps well to React Native evaluation:

| Area | Compatibility assessment |
| --- | --- |
| Network fixtures | Strong fit for deterministic JS fetch and request recording. |
| Device settings | Strong fit for static environment inputs and artifact metadata. |
| Semantic snapshots | Strong fit if the adapter lowers to `SemanticUITree`. |
| Logs | Strong fit if JS console/native-module logs are captured. |
| Render artifacts | Partial fit until live renderer sessions and real pixel captures exist. |
| Screenshots | Currently placeholder metadata only, so React Native visual parity cannot be evaluated yet. |

React Native should not be used to justify real-device or iOS-fidelity claims. It would still run inside the project's open-source, iPhone-like harness constraints.

## Packaging Complexity

React Native would add a significant package and toolchain surface:

- JavaScript runtime selection and distribution.
- Metro or an alternative bundling pipeline.
- React and React Native dependency management.
- Host config or adapter code for supported primitives.
- Native module mock registry.
- Source maps and stack trace handling.
- Cross-language transport between JS, Swift runtime state, browser renderer state, and TypeScript automation.

This complexity is larger than the current browser renderer or automation SDK. It should be isolated behind a separate package once the core strict-mode transport exists, not mixed into the current runtime host.

## Major Risks

- Scope creep from "React Native subset" into broad mobile app compatibility.
- Native module behavior becoming implicit and non-deterministic.
- Styling/layout expectations exceeding the semantic renderer's current purpose.
- Toolchain weight slowing the core strict-mode harness.
- Confusion between iPhone-like testing and iOS/React Native fidelity.
- Duplicate renderer paths if React Native is rendered directly instead of lowered to `SemanticUITree`.
- Premature API commitments before live strict-mode transport and sessions are stable.

## Recommendation

React Native should remain deferred research. It should become a future implementation phase only after the project completes strict-mode live session transport and proves that semantic tree snapshots, renderer updates, automation commands, artifacts, network fixtures, and device settings work through one integrated runtime loop.

A future React Native phase should start with a red-phase adapter contract, not runtime scaffolding. The first contract should require a tiny React Native-like fixture to lower into `SemanticUITree`, expose deterministic test IDs and labels to the existing automation SDK, route fetch calls through network fixtures, capture JS logs into runtime logs, and fail closed on unsupported native modules.
