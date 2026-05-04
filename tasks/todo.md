# Todo — iPhone Emulator Workspace

> Project: Open-Source iPhone Emulator Harness
> Current phase: 13 of 13 — M12 Compatibility Report CLI
> Source roadmap: `tasks/roadmap.md`
> Source spec: `specs/compatibility-report-cli.md`
> Test strategy: tdd

## Phase 13: M12 Compatibility Report CLI

**Status:** not started

**Goal:** Give developers a single command to scan Swift source directories and assess compatibility with the harness, surfacing grouped diagnostics, strict-mode adaptation hints, and a draft native capability manifest.

**Scope:**
- Add a Swift executable target (`compatibility-report`) that imports `DiagnosticsCore`, recursively scans `.swift` files in a directory, aggregates per-file `CompatibilityAnalysis` results into one merged report, and emits category-grouped text or JSON output with meaningful exit codes.
- Generate a draft `RuntimeNativeCapabilityManifest` from detected platform API usage with `NativeCapabilityGuidance`.
- Add a TypeScript wrapper package (`packages/compatibility-cli`) with both a CLI bin entry and a programmatic `analyzeCompatibility()` API that shells out to the Swift binary with `--json`.
- Add Swift CLI integration tests against fixture directories and TypeScript bridge tests.
- Update docs and examples to show CLI usage for migration planning and CI gating.

**Acceptance Criteria:**
- `compatibility-report <directory>` recursively scans .swift files and prints a category-grouped report with file:line locations and adaptation hints.
- `compatibility-report <directory> --json` emits valid JSON mirroring the Swift `CompatibilityAnalysis` structure plus a `draftManifest` key.
- Draft manifest includes `requiredCapabilities` for detected platform APIs and `unsupportedSymbols` for APIs without capability contracts.
- Exit code 0 for clean source, 1 for diagnostics found, 2 for CLI errors.
- `npx @iphone-emulator/compatibility-cli <path>` invokes the Swift binary and returns equivalent output.
- `analyzeCompatibility()` programmatic API returns typed results from TypeScript.
- Swift CLI integration tests pass against fixture directories (clean, mixed, unsupported-only, empty, native-apis).
- TypeScript bridge tests pass.
- No regressions in existing DiagnosticsCore, RuntimeHost, automation SDK, or browser renderer tests.

### Execution Profile
**Parallel mode:** implementation-safe
**Integration owner:** main agent
**Conflict risk:** medium
**Review gates:** correctness, tests, docs/API conformance

**Subagent lanes:**
- Lane: swift-cli
  - Agent: general-purpose
  - Role: implementer
  - Mode: write
  - Scope: implement Swift executable target with directory scanning, multi-file aggregation, text/JSON output formatting, draft manifest generation, and exit codes.
  - Owns: `Sources/CompatibilityReport/**`, `Tests/CompatibilityReportTests/**`, `Tests/fixtures/cli/**`
  - Must not edit: `packages/**`, `tasks/**`, `docs/**`, `README.md`, `examples/**`
  - Depends on: Step 13.1
  - Deliverable: Swift executable patch, CLI fixture directories, and focused Swift test output.
- Lane: typescript-wrapper
  - Agent: general-purpose
  - Role: implementer
  - Mode: write
  - Scope: implement TypeScript wrapper package with CLI bin entry, programmatic API, types mirroring Swift JSON output, and bridge tests.
  - Owns: `packages/compatibility-cli/**`
  - Must not edit: `Sources/**`, `Tests/**`, `packages/automation-sdk/**`, `packages/browser-renderer/**`, `packages/runtime-host/**`, `packages/diagnostics/**`, `tasks/**`, `docs/**`, `README.md`
  - Depends on: Step 13.1
  - Deliverable: TypeScript package patch and package validation output.
- Lane: json-schema-review
  - Agent: general-purpose
  - Role: reviewer
  - Mode: read-only
  - Scope: review Swift JSON output and TypeScript types for schema alignment after both lanes complete.
  - Depends on: Step 13.3, Step 13.5
  - Deliverable: findings on schema drift between Swift Codable output and TypeScript types.

### Tests First
- [ ] Step 13.1: Write failing tests for CLI directory scanning, aggregation, output formatting, and exit codes
  - Files: create `Tests/CompatibilityReportTests/CompatibilityReportTests.swift`; create `Tests/fixtures/cli/clean-project/CleanApp.swift`; create `Tests/fixtures/cli/mixed-project/SupportedFile.swift`, `Tests/fixtures/cli/mixed-project/UnsupportedFile.swift`; create `Tests/fixtures/cli/unsupported-only/FullyUnsupported.swift`; create `Tests/fixtures/cli/native-apis/NativeAPIs.swift`; create `packages/compatibility-cli/test/cli.test.ts`.
  - Swift red-phase assertions: directory scanner finds `.swift` files while skipping hidden dirs, `.build`, `Packages`, and symlinks; multi-file aggregation merges summary counts, deduplicates unsupported group names while keeping all locations, unions supported features; JSON output matches expected structure with `draftManifest` key; text output contains expected section headers; exit code 0 for clean directory, 1 for diagnostics found, 2 for empty directory or bad path.
  - TypeScript red-phase assertions: `analyzeCompatibility()` returns a typed `CompatibilityAnalysisResult`; CLI bin invocation returns expected output; error handling for missing Swift binary.
  - Tests MUST fail at this point because the executable target, directory scanner, aggregator, output formatters, and TypeScript wrapper do not exist yet.
  - Add the executable target and test target to `Package.swift` in this step so Swift tests can reference the new module.

### Implementation
- [ ] Step 13.2: Implement Swift directory scanner and multi-file aggregator
  - Files: create `Sources/CompatibilityReport/main.swift`, create `Sources/CompatibilityReport/DirectoryScanner.swift`, create `Sources/CompatibilityReport/ReportAggregator.swift`; modify `Package.swift` to add the executable target and test target.
  - Implement recursive `.swift` file discovery with hidden dir/`.build`/`Packages`/symlink filtering. Implement multi-file aggregation: merge summary counts, deduplicate unsupported group names by category while preserving all locations, union supported features by `(kind, name)`, and derive combined migration summary.
  - Implementation plan: `DirectoryScanner` returns `[URL]` of `.swift` files. `ReportAggregator` takes `[CompatibilityAnalysis]` and produces a merged `CompatibilityReport`, merged `[CompatibilitySupportedFeature]`, and combined `[CompatibilityDiagnostic]` list. Keep the aggregator as a pure function over value types.
  - Validation focus: `swift build --target compatibility-report` should compile.
- [ ] Step 13.3: Implement JSON and text output formatters with draft manifest generation
  - Files: create `Sources/CompatibilityReport/JSONFormatter.swift`, create `Sources/CompatibilityReport/TextFormatter.swift`, create `Sources/CompatibilityReport/DraftManifestGenerator.swift`; modify `Sources/CompatibilityReport/main.swift` for argument parsing and exit codes.
  - Implement JSON output using `Codable` encoding that mirrors the `CompatibilityAnalysis` structure plus a top-level `draftManifest`, `scannedFiles`, and `affectedFiles`. Implement text output with category-grouped sections, file:line locations, adaptation hints, supported features summary, and a copy-pasteable draft manifest JSON block. Implement draft manifest generation: collect unique `NativeCapabilityGuidance` entries, group by capability ID, produce `requiredCapabilities` for `requiresManifestMock == true` with `permissionState: "notDetermined"`, and `unsupportedSymbols` for `requiresManifestMock == false`.
  - Implement exit code logic: 0 for zero diagnostics, 1 for one or more diagnostics, 2 for CLI errors (bad path, no `.swift` files, unreadable files, invalid arguments). Emit warnings to stderr for skipped files.
  - Validation focus: `swift build --target compatibility-report` and `.build/debug/compatibility-report Tests/fixtures/cli/mixed-project` should produce output.
- [ ] Step 13.4: Add CLI fixture directories for integration testing
  - Files: create `Tests/fixtures/cli/clean-project/CleanApp.swift` (supported-only SwiftUI subset); create `Tests/fixtures/cli/mixed-project/SupportedFile.swift` and `Tests/fixtures/cli/mixed-project/UnsupportedFile.swift`; create `Tests/fixtures/cli/unsupported-only/FullyUnsupported.swift` (UIKit, UIViewControllerRepresentable, platform APIs, lifecycle, modifiers); create `Tests/fixtures/cli/native-apis/NativeAPIs.swift` (platform APIs triggering NativeCapabilityGuidance for camera, location, clipboard, and one unsupported biometric API).
  - Implementation plan: reuse patterns from existing `Tests/fixtures/compatibility/` fixtures. Each fixture should exercise specific aggregation and output formatting behavior.
  - Validation focus: files are valid Swift source that the existing `CompatibilityAnalyzer` can process.
- [ ] Step 13.5: Implement TypeScript wrapper package with CLI bin and programmatic API
  - Files: create `packages/compatibility-cli/package.json`, `packages/compatibility-cli/tsconfig.json`, `packages/compatibility-cli/tsconfig.build.json`; create `packages/compatibility-cli/src/index.ts`, `packages/compatibility-cli/src/cli.ts`, `packages/compatibility-cli/src/types.ts`; update root `package.json` workspaces if needed.
  - Implement `types.ts` with TypeScript interfaces mirroring the Swift JSON output: `CompatibilityAnalysisResult`, `CompatibilityReport`, `Summary`, `UnsupportedGroup`, `MigrationSummary`, `CompatibilityDiagnostic`, `SourceLocation`, `SuggestedAdaptation`, `NativeCapabilityGuidance`, `DraftManifest`, `CompatibilitySupportedFeature`, `CompatibilityMatrix`.
  - Implement `index.ts` with `analyzeCompatibility({ path, swiftBinaryPath? })` that spawns the Swift binary with `--json`, captures stdout, parses JSON, and returns typed `CompatibilityAnalysisResult`. Handle missing binary, non-zero exit codes, and malformed output as typed errors.
  - Implement `cli.ts` as the bin entry that parses `<path>`, optional `--json` and `--swift-binary` flags, calls `analyzeCompatibility()`, and either passes JSON through or re-formats as text. Wire the bin entry in `package.json`.
  - Validation focus: `npm --prefix packages/compatibility-cli run typecheck` and `npm --prefix packages/compatibility-cli run build`.
- [ ] Step 13.6: Update docs and examples for CLI usage
  - Files: modify `README.md` to add a CLI usage section; modify `docs/strict-mode-migration.md` to reference the CLI as the first migration step; create or modify `docs/compatibility-cli.md` with full CLI reference, example output, and CI gating recipe.
  - Document both Swift binary and TypeScript wrapper usage. Show example text and JSON output. Document exit codes and CI integration patterns.
  - Validation focus: documentation-only; no Swift or TypeScript validation required unless code snippets change.

### Green
- [ ] Step 13.7: Run Swift CLI integration tests and TypeScript bridge tests
  - Files: extend `Tests/CompatibilityReportTests/CompatibilityReportTests.swift` and `packages/compatibility-cli/test/cli.test.ts` if coverage gaps exist after implementation.
  - Run `swift test --filter CompatibilityReportTests`, `npm --prefix packages/compatibility-cli run typecheck`, `npm --prefix packages/compatibility-cli test`, and `npm --prefix packages/compatibility-cli run build`.
  - Verify: clean-project fixture exits 0 with zero diagnostics; mixed-project exits 1 with correct aggregated counts; unsupported-only exits 1 with all categories; empty path exits 2; native-apis exits 1 with draft manifest containing correct capability entries; JSON output parses to valid TypeScript types; TypeScript programmatic API returns typed results.
- [ ] Step 13.8: Run full workspace regression validation
  - Files: no intended source edits unless validation exposes missing package wiring or real regressions.
  - Run `swift test`, `swift build`, `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, `npm --prefix packages/browser-renderer run build`, `npm --prefix packages/automation-sdk run typecheck`, `npm --prefix packages/automation-sdk test`, `npm --prefix packages/automation-sdk run build`, `npm --prefix packages/compatibility-cli run typecheck`, `npm --prefix packages/compatibility-cli test`, `npm --prefix packages/compatibility-cli run build`, `npx tsx examples/strict-mode-baseline/automation-example.ts`, and `npx tsx examples/strict-mode-baseline/live-transport-example.ts`.
- [ ] Step 13.9: Refactor CLI boundaries if needed while keeping tests green
  - Files: modify `Sources/CompatibilityReport/**`, `packages/compatibility-cli/src/**`, and docs only as needed.
  - Re-read the Swift CLI directory scanner, aggregator, formatters, draft manifest generator, TypeScript types, programmatic API, CLI bin, and docs together. Only refactor if there is concrete type drift between Swift JSON output and TypeScript types, duplicated aggregation logic, unclear text output formatting, or documentation that overclaims analyzer accuracy.

### Milestone: M12 Compatibility Report CLI
**Acceptance Criteria:**
- [ ] `compatibility-report <directory>` recursively scans .swift files and prints a category-grouped report with file:line locations and adaptation hints.
- [ ] `compatibility-report <directory> --json` emits valid JSON mirroring the Swift `CompatibilityAnalysis` structure plus a `draftManifest` key.
- [ ] Draft manifest includes `requiredCapabilities` for detected platform APIs and `unsupportedSymbols` for APIs without capability contracts.
- [ ] Exit code 0 for clean source, 1 for diagnostics found, 2 for CLI errors.
- [ ] `npx @iphone-emulator/compatibility-cli <path>` invokes the Swift binary and returns equivalent output.
- [ ] `analyzeCompatibility()` programmatic API returns typed results from TypeScript.
- [ ] Swift CLI integration tests pass against fixture directories (clean, mixed, unsupported-only, empty, native-apis).
- [ ] TypeScript bridge tests pass.
- [ ] No regressions in existing DiagnosticsCore, RuntimeHost, automation SDK, or browser renderer tests.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: [fill in when complete]
- Tech debt / follow-ups: [fill in when complete]
- Ready for next phase: [fill in when complete]
