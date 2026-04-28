# Strict-Mode Migration Guide

This guide maps common Swift and SwiftUI-era patterns to the project-owned strict-mode surface that exists today. It is migration planning guidance, not a compatibility shim or codemod contract.

Strict mode is the primary supported path. Compatibility mode should be used to analyze existing Swift source, group unsupported APIs, and produce adaptation hints before rewriting code against `StrictModeSDK`.

## Migration Workflow

1. Run compatibility analysis against the source you want to move.
2. Review `CompatibilityReport.summary` for total diagnostics, affected files, counts by category, severity, and support level.
3. Review `CompatibilityReport.unsupportedGroups` to batch fixes by unsupported imports, symbols, platform APIs, lifecycle hooks, and modifiers.
4. Use `CompatibilityReport.migrationSummary.nextActions` as the ordered checklist for strict-mode adaptation.
5. Rewrite the code to target `StrictModeSDK`, then validate that it lowers into a `RuntimeHost.SemanticUITree`.

The report output is deterministic so migration work can be planned file-by-file or category-by-category without depending on CLI rendering.

## Current Strict-Mode Surface

The supported strict-mode app path is intentionally narrow:

| Need | Current strict-mode surface |
| --- | --- |
| App entry | `StrictModeSDK.App` with `makeSemanticTree(appIdentifier:)` |
| Scene entry | `Modal`, `TabView`, and `Alert` scenes |
| Text | `Text` |
| Buttons | `Button` |
| Text entry | `TextField` |
| Lists | `List` |
| Layout | `VStack`, `HStack`, and `NavigationStack` |
| Local state marker | `State` |
| Runtime output | `RuntimeHost.SemanticUITree` and `RuntimeTreeSnapshot` |
| Automation fixtures | `RuntimeAutomationCoordinator` and `@iphone-emulator/automation-sdk` |
| Network fixtures | `RuntimeNetworkFixture` and request records |
| Device metadata | `RuntimeDeviceSettings` |

Anything outside this surface should be treated as unsupported unless the compatibility matrix says otherwise.

## Unsupported Imports

| Existing pattern | Strict-mode direction |
| --- | --- |
| `import UIKit` | Remove the import and model screens with `StrictModeSDK` views and scenes. |
| `import WebKit` | Replace embedded web views with strict-mode renderable state, deterministic fixtures, or a project-owned renderer integration in a later phase. |
| Apple framework imports used only for model code | Move platform-independent model logic into plain Swift types and keep UI/runtime interaction behind strict-mode declarations. |

The analyzer currently reports `UIKit` as an unsupported import. Documentation may mention `WebKit` as a migration category, but broad framework detection is not a complete compiler-integrated scan yet.

## Unsupported Symbols and Bridges

| Existing pattern | Strict-mode direction |
| --- | --- |
| `UIViewControllerRepresentable` | Replace imperative bridge code with a strict-mode adapter that emits semantic tree nodes or deterministic runtime state. |
| `UIView`, `UIViewController`, or UIKit delegate objects | Convert user-visible state into strict-mode views and move side effects into explicit runtime or fixture controls. |
| Custom native controls | Represent the observable behavior as semantic roles, labels, values, identifiers, and metadata first. Add renderer support only after the semantic contract is stable. |

Strict mode does not host UIKit or SwiftUI components. The useful migration unit is the behavior the harness can inspect and automate, not the original platform object.

## Platform APIs

| Existing pattern | Strict-mode direction |
| --- | --- |
| `UIApplication.shared.open` | Replace with explicit runtime environment controls or app-level intent state that automation can inspect. |
| Direct device, locale, clock, geolocation, or network queries | Pass deterministic `RuntimeDeviceSettings` at launch and read them through runtime/session metadata. |
| Live HTTP side effects in UI code | Use deterministic `RuntimeNetworkFixture` route records and inspect request records. |

The runtime is fixture-backed and deterministic. It should not depend on live device state or live network traffic for test behavior.

## Lifecycle Hooks

| Existing pattern | Strict-mode direction |
| --- | --- |
| `.onAppear` | Move work into an explicit strict-mode lifecycle adapter or launch/session setup step when that surface exists. |
| View disappearance or task hooks | Model the relevant state transition explicitly through runtime actions or fixture setup. |
| Implicit platform lifecycle work | Prefer deterministic inputs to the runtime host over callbacks from an OS simulator. |

Lifecycle hooks are deferred in compatibility mode. They should produce migration diagnostics, not hidden behavior.

## Modifiers and Layout

| Existing pattern | Strict-mode direction |
| --- | --- |
| `.padding()` | Replace with explicit strict-mode layout containers or spacing metadata once the strict surface supports the needed layout information. |
| Presentation-only SwiftUI modifiers | Keep only semantic state that the runtime and automation SDK need to inspect. |
| Complex layout stacks | Start with `VStack`, `HStack`, `List`, and `NavigationStack`; add semantic metadata only when tests require it. |

The renderer approximates an iPhone-like surface from the semantic tree. It is not a SwiftUI layout engine.

## State and Data Flow

| Existing pattern | Strict-mode direction |
| --- | --- |
| `@State` in the supported subset | Keep simple local state concepts, then lower observable values into the semantic tree. |
| `@ObservedObject`, `@EnvironmentObject`, or Combine-heavy UI state | Convert the state needed by the test into explicit fixture data or runtime session state. |
| Async model loading | Use deterministic fixtures and request records rather than live services. |

For migration planning, keep the first strict-mode target small: a fixture app that can produce a stable semantic tree and deterministic automation session.

## Deterministic Fixtures

Use fixtures when the original app depends on platform or service behavior:

- Keep source examples under `Tests/fixtures/compatibility/` when they document analyzer behavior.
- Use strict-mode examples under `examples/strict-mode-baseline/` when they demonstrate supported app shape.
- Prefer stable semantic identifiers for automation queries.
- Replace live network calls with route fixtures and request-record assertions.
- Pass viewport, color scheme, locale, clock, geolocation, and network metadata through launch device settings.

## Non-Goals

Migration should not attempt to preserve these behaviors:

- UIKit compatibility
- SwiftUI runtime compatibility
- WebKit embedding
- Xcode Simulator behavior
- Native-device fidelity
- Apple-private runtime or simulator internals
- Pixel-perfect iOS rendering

The project goal is an open-source, iPhone-like harness with deterministic semantic inspection and automation, not an iOS clone.

## Validation

Run the focused diagnostics contract tests after changing compatibility guidance or referencing report fields:

```sh
swift test --filter DiagnosticsCoreContractTests
```

Run broader validation when docs, examples, or public type names change across packages:

```sh
swift test
swift build
npm --prefix packages/browser-renderer run typecheck
npm --prefix packages/browser-renderer test
npm --prefix packages/browser-renderer run build
npm --prefix packages/automation-sdk run typecheck
npm --prefix packages/automation-sdk test
npm --prefix packages/automation-sdk run build
```
