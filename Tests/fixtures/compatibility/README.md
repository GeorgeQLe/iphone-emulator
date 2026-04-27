# Compatibility Fixtures

These fixtures define the current `v1` compatibility-mode contract surface.

- `SupportedSubsetFixture.swift` is the only lowering-ready compatibility fixture today. It proves the narrow supported subset: `import SwiftUI`, `VStack`, `Text`, `Button`, and `@State`.
- `UnsupportedImportsFixture.swift` proves that Apple-only framework imports such as `UIKit` produce structured diagnostics instead of crashing analysis.
- `UnsupportedLifecycleFixture.swift` proves that unsupported lifecycle hooks and modifiers such as `.onAppear` and `.padding()` produce source-linked adaptation guidance.

Use `swift test --filter DiagnosticsCoreContractTests` to validate the analyzer-facing diagnostics contract and `swift test --filter RuntimeHostContractTests` to validate the supported-subset runtime handoff.
