# Compatibility Matrix

This repository's compatibility mode is intentionally diagnostics-led. It analyzes plain Swift source, reports structured compatibility gaps with file/line data where possible, and only lowers code into the shared runtime model when the source stays inside the current supported subset.

## Version

- Matrix version: `v1`
- Analyzer entry point: `DiagnosticsCore.CompatibilityAnalyzer`
- Runtime handoff: `CompatibilityAnalysis.loweredTree`

## Supported

| Area | Status | Notes |
| --- | --- | --- |
| `import SwiftUI` | supported | Allowed import for the current compatibility subset. |
| `Text` | supported | Recognized as part of the first lowering-ready fixture path. |
| `Button` | supported | Recognized as part of the first lowering-ready fixture path. |
| `@State` | supported | Accepted as part of the first lowering-ready fixture path. |

## Partially Supported

| Area | Status | Notes |
| --- | --- | --- |
| `VStack` | partial | Supported only for the first checked-in lowering path used by `SupportedSubsetFixture.swift`. |

## Unsupported

| Area | Status | Notes |
| --- | --- | --- |
| `import UIKit` | unsupported | Reported as an unsupported import with adaptation guidance to move to `StrictModeSDK` primitives. |
| `UIViewControllerRepresentable` | unsupported | Reported as an unsupported bridge symbol with guidance to move imperative bridge code behind a strict-mode adapter. |
| `UIApplication` | unsupported | Reported as a platform API diagnostic with guidance to use strict-mode environment and runtime controls instead. |
| `.padding()` | unsupported | Reported as an unsupported modifier with guidance to replace it with explicit strict-mode layout containers or spacing metadata. |

## Deferred

| Area | Status | Notes |
| --- | --- | --- |
| `.onAppear` and lifecycle behavior | deferred | Lifecycle hooks remain diagnostics-only in `v1`; no runtime lowering path exists yet. |
| Broader SwiftUI surface | deferred | Stacks, modifiers, state models, and controls beyond the first fixture subset are out of scope for this phase. |
| Apple runtime fidelity | deferred | UIKit, iOS lifecycle behavior, and simulator fidelity remain explicit non-goals. |

## Fixtures

- `Tests/fixtures/compatibility/SupportedSubsetFixture.swift` proves the current supported lowering path for `SwiftUI`, `VStack`, `Text`, `Button`, and `@State`.
- `Tests/fixtures/compatibility/UnsupportedImportsFixture.swift` proves unsupported-import diagnostics for `UIKit`.
- `Tests/fixtures/compatibility/UnsupportedLifecycleFixture.swift` proves source-linked guidance for `.onAppear` and `.padding()`.

## Migration Guidance

- Replace `UIKit` imports with project-owned `StrictModeSDK` primitives.
- Move `UIViewControllerRepresentable` or similar imperative bridge code behind strict-mode adapters rather than expecting direct compatibility shims.
- Replace `UIApplication` usage with explicit runtime/environment controls owned by the harness.
- Move `.onAppear` work into explicit runtime lifecycle adapters when that surface exists.
- Replace `.padding()` with explicit strict-mode layout containers or spacing metadata.

## Validation

Use these commands to validate the current compatibility lane:

```sh
swift test --filter DiagnosticsCoreContractTests
swift test --filter RuntimeHostContractTests
```

The full Swift workspace validation remains part of Phase 4 Step 4.8:

```sh
swift test
swift build
```
