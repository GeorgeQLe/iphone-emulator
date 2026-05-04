# Compatibility Report CLI

## Overview

A CLI tool that scans Swift source files or directories and emits grouped compatibility diagnostics, strict-mode adaptation hints, and a draft native capability manifest. The tool bridges the gap between "I have existing Swift code" and "what do I need to change to run it in the iPhone emulator harness."

The CLI has two layers: a Swift executable that imports `DiagnosticsCore` and does the analysis, and a thin TypeScript wrapper package (`@iphone-emulator/compatibility-cli`) that shells out to the Swift binary and exposes both a CLI entry point and a programmatic API.

## Goals

- Give developers a single command to assess how compatible their Swift codebase is with the harness.
- Surface unsupported imports, symbols, modifiers, lifecycle hooks, and platform APIs with file:line locations and actionable adaptation hints.
- Generate a draft `RuntimeNativeCapabilityManifest` from detected platform API usage so developers can immediately configure deterministic mocks.
- Provide both human-readable terminal output (category-grouped) and machine-readable JSON output for CI pipelines and agent consumption.
- Use meaningful exit codes so the CLI can serve as a CI gate.
- Expose the same analysis from TypeScript for programmatic integration in test scripts and CI workflows.

## Non-Goals

- Full Swift parser or compiler integration. The analyzer uses line-based pattern matching and heuristics.
- SwiftPM package resolution or target-aware scanning. The CLI scans .swift files in a directory tree.
- Binary analysis of compiled artifacts or .ipa files.
- WASM compilation of the Swift analyzer.
- Runtime host, automation SDK, browser renderer, or network dependencies.
- Compatibility mode execution — this is analysis only, not running the code.

## Detailed Design

### Swift Executable Target

A new SwiftPM executable target named `compatibility-report` in the existing workspace. It imports `DiagnosticsCore` as a library dependency.

#### Command Interface

```
compatibility-report <path> [--json] [--format text|json]
```

- `<path>`: a single `.swift` file or a directory to scan recursively.
- `--json`: shorthand for `--format json`.
- `--format`: output format, defaults to `text`.

#### Directory Scanning

When `<path>` is a directory:

1. Walk the directory tree recursively.
2. Collect all files ending in `.swift`.
3. Skip hidden directories (names starting with `.`), `.build`, and `Packages` directories.
4. Do not follow symlinks.
5. Pass each file to `CompatibilityAnalyzer.analyze(.sourceText(contents, file: relativePath))`.

When `<path>` is a single `.swift` file, analyze it directly.

#### Multi-File Aggregation

Individual per-file `CompatibilityAnalysis` results are merged into a single combined report:

- **Summary counts**: sum `totalCount` and `affectedFileCount` across files; merge `countsByCategory`, `countsBySeverity`, and `countsBySupportLevel` by summing values.
- **Unsupported groups**: group by `CompatibilityDiagnosticCategory` across all files. Within each group, deduplicate `unsupportedNames` (keep all unique names), collect all `locations`, and collect all unique `adaptationHints`.
- **Supported features**: union across all files (deduplicate by `(kind, name)`).
- **Migration summary**: derive from the merged unsupported groups using the existing `CompatibilityReport` logic.
- **Draft manifest**: aggregate all unique `NativeCapabilityGuidance` entries from platform API diagnostics, grouped by capability ID.

#### Exit Codes

| Code | Meaning |
| --- | --- |
| 0 | No unsupported diagnostics found. Source is clean or fully supported. |
| 1 | One or more unsupported diagnostics found. |
| 2 | CLI error: bad path, no .swift files found, unreadable files, invalid arguments. |

### Text Output Format

Default human-readable output, category-grouped:

```
Compatibility Report: <path>
Scanned: 12 files | Affected: 4 files

== Unsupported Imports ==
  UIKit (3 locations)
    src/Views/ProfileView.swift:1:8
    src/Views/SettingsView.swift:1:8
    src/Views/HomeView.swift:1:8
    Hint: Replace UIKit imports with StrictModeSDK primitives.

== Unsupported Symbols ==
  UIViewControllerRepresentable (1 location)
    src/Bridges/WebBridge.swift:15:20
    Hint: Move imperative bridge code behind a strict-mode adapter.

== Unsupported Platform APIs ==
  AVCaptureSession.startRunning (1 location)
    src/Camera/CameraManager.swift:42:9
    Hint: Declare deterministic native capability mocks in RuntimeNativeCapabilityManifest.
    Native capability: camera | Mock field: configuredMocks.camera

== Unsupported Modifiers ==
  padding (5 locations)
    src/Views/ProfileView.swift:24:5
    ...
    Hint: Replace padding with an explicit strict-mode layout container.

== Unsupported Lifecycle Hooks ==
  onAppear (2 locations)
    src/Views/HomeView.swift:18:5
    src/Views/SettingsView.swift:31:5
    Hint: Move onAppear work into an explicit strict-mode runtime lifecycle adapter.

== Supported Features ==
  SwiftUI (import), Text (view), VStack (layout), Button (view), State (state)

== Summary ==
  Total diagnostics: 12
  By category: imports=3, symbols=1, platformAPIs=1, modifiers=5, lifecycleHooks=2
  By support level: unsupported=5, deferred=7
  Migration ready: yes
  Primary recommendation: Replace unsupported Apple-only surfaces with strict-mode SDK primitives.

== Suggested Native Capability Manifest ==
{
  "requiredCapabilities": [
    {
      "id": "camera",
      "permissionState": "notDetermined",
      "strictModeAlternative": "Use deterministic camera fixture output."
    }
  ],
  "configuredMocks": [],
  "scriptedEvents": [],
  "unsupportedSymbols": [],
  "artifactOutputs": []
}
```

### JSON Output Format

Mirrors the Swift `CompatibilityAnalysis` structure with an additional top-level `draftManifest` key:

```json
{
  "report": {
    "matrix": { "version": "v1", "entries": [...] },
    "diagnostics": [...],
    "summary": {
      "totalCount": 12,
      "affectedFileCount": 4,
      "countsByCategory": { "imports": 3, ... },
      "countsBySeverity": { "error": 12 },
      "countsBySupportLevel": { "unsupported": 5, "deferred": 7 }
    },
    "unsupportedGroups": [...],
    "migrationSummary": {
      "isMigrationReady": true,
      "primaryRecommendation": "...",
      "nextActions": [...]
    }
  },
  "supportedFeatures": [...],
  "loweringPreview": null,
  "loweredTree": null,
  "draftManifest": {
    "requiredCapabilities": [...],
    "configuredMocks": [],
    "scriptedEvents": [],
    "unsupportedSymbols": [],
    "artifactOutputs": []
  },
  "scannedFiles": 12,
  "affectedFiles": ["src/Views/ProfileView.swift", ...]
}
```

### Draft Native Capability Manifest Generation

When the analyzer detects platform APIs with `NativeCapabilityGuidance`, the CLI aggregates them into a draft manifest:

1. Collect all unique `NativeCapabilityGuidance` entries from platform API diagnostics.
2. Group by `capability` ID.
3. For each capability with `requiresManifestMock == true`, create a `requiredCapabilities` entry with `permissionState: "notDetermined"` and `strictModeAlternative` derived from the `failClosedReason`.
4. For capabilities where `requiresManifestMock == false` (e.g., biometrics, HealthKit), add them to `unsupportedSymbols`.
5. Leave `configuredMocks`, `scriptedEvents`, and `artifactOutputs` empty as scaffolds for the developer to fill in.

### TypeScript Wrapper Package

New package at `packages/compatibility-cli/`.

#### CLI Entry Point

```
npx @iphone-emulator/compatibility-cli <path> [--json] [--swift-binary <path>]
```

- `--swift-binary`: optional path to the compiled `compatibility-report` binary. Defaults to looking for it at `.build/release/compatibility-report` or `.build/debug/compatibility-report` relative to the repo root.
- Spawns the Swift binary as a child process with `--json`, captures stdout, and either re-formats as text or passes JSON through.

#### Programmatic API

```ts
import { analyzeCompatibility } from "@iphone-emulator/compatibility-cli";

const result = await analyzeCompatibility({
  path: "./src",
  swiftBinaryPath: ".build/release/compatibility-report", // optional
});

console.log(result.report.summary.totalCount);
console.log(result.draftManifest);
```

Returns a typed `CompatibilityAnalysisResult` that mirrors the JSON output schema.

#### Package Structure

```
packages/compatibility-cli/
  package.json
  tsconfig.json
  src/
    index.ts          # programmatic API
    cli.ts            # bin entry point
    types.ts          # TypeScript types mirroring Swift output
  test/
    cli.test.ts       # bridge integration tests
  bin/
    compatibility-cli  # shell script or package.json bin entry
```

### SwiftPM Workspace Integration

Add a new executable target to the root `Package.swift`:

```swift
.executableTarget(
    name: "compatibility-report",
    dependencies: ["DiagnosticsCore"],
    path: "Sources/CompatibilityReport"
)
```

The executable source lives in `Sources/CompatibilityReport/main.swift` (or equivalent `@main` entry point).

## Edge Cases

- **Empty directory**: exit code 2 with message "No .swift files found in <path>."
- **Unreadable files**: skip unreadable files, emit a warning to stderr, continue scanning. Include the count of skipped files in the summary.
- **Clean codebase**: exit code 0 with a summary showing zero diagnostics. Text mode prints "No unsupported patterns found." JSON mode has empty diagnostics array.
- **Very large directories**: the analyzer is line-based pattern matching, so performance should be bounded by I/O. No parallelism needed for v1 — sequential file analysis is sufficient for typical Swift packages (hundreds of files).
- **Mixed supported/unsupported files**: aggregate correctly, showing both supported features and unsupported diagnostics in the same report.
- **Files with no Swift code**: `.swift` files that are empty or contain only comments produce zero diagnostics and zero supported features. They are counted in scanned files but not affected files.
- **Duplicate diagnostics across files**: the same unsupported name (e.g., `UIKit`) appearing in multiple files is deduplicated in unsupported group names but all locations are preserved.
- **Swift binary not found**: the TypeScript wrapper exits with a clear error message explaining how to build the Swift binary (`swift build -c release`).
- **Manifest with only unsupported capabilities**: if all detected platform APIs map to `.unsupported` capability (e.g., biometrics), the draft manifest has entries only in `unsupportedSymbols`, not `requiredCapabilities`.

## Test Plan

### Swift CLI Integration Tests

Add a new test target `CompatibilityReportCLITests` that:

1. **Fixture directory tests**: create checked-in fixture directories under `Tests/fixtures/cli/`:
   - `clean-project/`: directory with only supported Swift patterns. Expect exit code 0, zero diagnostics.
   - `mixed-project/`: directory with both supported and unsupported patterns across multiple files. Expect exit code 1, correct aggregated counts, correct category grouping.
   - `unsupported-only/`: directory with only unsupported patterns. Expect exit code 1, all categories populated.
   - `empty-dir/`: empty directory. Expect exit code 2.
   - `native-apis/`: directory with platform API usage triggering `NativeCapabilityGuidance`. Expect draft manifest with correct capability entries.
2. **JSON output tests**: verify JSON output parses to expected structure and matches Swift type shapes.
3. **Text output tests**: verify text output contains expected section headers, file:line locations, and hints.
4. **Aggregation tests**: verify multi-file deduplication, count merging, and supported feature union.

### TypeScript Bridge Tests

Add tests in `packages/compatibility-cli/test/`:

1. **CLI invocation test**: verify the bin entry spawns the Swift binary and returns results.
2. **Programmatic API test**: verify `analyzeCompatibility()` returns typed results.
3. **Error handling test**: verify clear error when Swift binary is missing or returns unexpected output.
4. **JSON parsing test**: verify the TypeScript types correctly deserialize the Swift JSON output.

### Upstream Compatibility

Existing `DiagnosticsCoreContractTests` remain unchanged. The CLI tests are additive.

## Acceptance Criteria

- Running `compatibility-report <directory>` recursively scans .swift files and prints a category-grouped report with file:line locations and adaptation hints.
- Running `compatibility-report <directory> --json` emits valid JSON that mirrors the Swift `CompatibilityAnalysis` structure plus a `draftManifest` key.
- The draft manifest includes `requiredCapabilities` entries for detected platform APIs with `NativeCapabilityGuidance` and `unsupportedSymbols` for APIs without harness capability contracts.
- Exit code 0 for clean source, 1 for diagnostics found, 2 for CLI errors.
- `npx @iphone-emulator/compatibility-cli <path>` invokes the Swift binary and returns equivalent output.
- `import { analyzeCompatibility } from "@iphone-emulator/compatibility-cli"` provides a typed programmatic API.
- Swift CLI integration tests pass against fixture directories.
- TypeScript bridge tests pass.
- No regressions in existing DiagnosticsCore, RuntimeHost, automation SDK, or browser renderer tests.

## Open Questions

- **Future: SwiftPM-aware scanning.** Should a future version parse `Package.swift` to identify source targets and their dependencies? This would make the scan more precise but adds parser complexity.
- **Future: incremental analysis.** Should the CLI cache results and only re-analyze changed files? Not needed for v1 given the fast line-based analysis.
- **Future: custom rule configuration.** Should users be able to add their own unsupported pattern rules or suppress known-good patterns? Useful for larger teams but adds config surface.
- **Severity granularity.** Currently all diagnostics are severity `.error`. Should the CLI distinguish warnings (e.g., `.padding` modifiers) from errors (e.g., `import UIKit`)? This would require upstream `DiagnosticsCore` changes.
- **Binary distribution.** Should the Swift binary be pre-built and distributed via npm (platform-specific binaries) or always built from source? Pre-built would improve DX for TypeScript-primary users.

## Assumptions & Risks

| Assumption | Source | Downstream risk if wrong |
| --- | --- | --- |
| The CLI is a Swift executable target in the existing SwiftPM workspace | `[inferred]` confirmed | If the SwiftPM workspace structure changes, the executable target wiring would need updating. |
| `CompatibilityAnalyzer` works on single-file input; directory scanning is new code | `[from codebase]` confirmed | Multi-file aggregation logic is new and must be tested against diverse directory layouts. |
| Line-based pattern matching is sufficient for useful diagnostics | `[from codebase]` confirmed | False positives (patterns in comments/strings) and false negatives (indirect API usage) will occur. Users must understand this is heuristic, not compiler-integrated. |
| The CLI does not need runtime host, automation SDK, or browser renderer | `[inferred]` confirmed | If future features require runtime analysis (e.g., actually running code to detect issues), the dependency boundary would need revisiting. |
| Shell-out bridge (TS spawns Swift binary) is the right integration model | `[inferred]` confirmed | Requires Swift toolchain to be installed and binary to be built. TypeScript-only users cannot use the tool without Swift. |
| Multi-file aggregation merges into one report, deduping by (name, category) | `[inferred]` confirmed | Information loss from deduplication could matter for large projects where the same unsupported API is used in very different contexts. All locations are preserved to mitigate this. |
| No persistent state or caching | `[inferred]` confirmed | Rescanning on every invocation is fine for small-to-medium projects but could be slow for very large monorepos. |
| JSON output mirrors Swift types directly | `[inferred]` confirmed | If Swift types change, the JSON schema changes. TypeScript types must be kept in sync manually or via codegen. |
| Draft manifest uses `permissionState: "notDetermined"` as default | `[inferred]` not explicitly confirmed | Developers may want a different default. The manifest is a draft scaffold, so this is a reasonable starting point. |
