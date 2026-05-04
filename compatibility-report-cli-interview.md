# Compatibility Report CLI — Interview Log

## Context

- **Interviewer:** Claude (spec-interview skill)
- **Date:** 2026-05-03 to 2026-05-04
- **Source idea:** tasks/ideas.md, "Build a deterministic compatibility report CLI" (Days-sized, brainstorm 2026-05-03)
- **Existing codebase:** `DiagnosticsCore.CompatibilityAnalyzer` analyzes single Swift source files; `CompatibilityReport` has summary, unsupportedGroups, and migrationSummary; no CLI entry point exists.

## Assumptions Manifest

Presented before interview questions. User confirmed overall project goals align with the manifest framing.

### Source Context
- `[from spec]` Main spec (§4, §6, §10) names compatibility reports as product output for migration planning.
- `[from codebase]` `DiagnosticsCore.CompatibilityAnalyzer` already analyzes single Swift source files or fixture paths.
- `[from research]` `devtool-user-map.md` identifies "Swift developer migrating app logic" as a champion.
- `[from research]` `devtool-dx-journey.md` flags no single setup/scan command for external users.

### Implementation Goal
- `[from spec]` Ship a CLI command that scans Swift source paths and emits grouped diagnostics plus adaptation hints.
- `[inferred]` The CLI is a Swift executable target in the existing SwiftPM workspace. **Confirmed with modification:** user chose "Both: Swift core + thin TS wrapper."

### Technical Foundation
- `[from codebase]` `CompatibilityAnalyzer` works on single-file input. Directory scanning is new.
- `[from codebase]` `CompatibilityReport` already has summary, unsupportedGroups, and migrationSummary.
- `[inferred]` The CLI reuses `DiagnosticsCore` as a library dependency. **Confirmed.**

### Integration Risk
- `[inferred]` New executable target should not break existing library targets. **Confirmed.**
- `[inferred]` CLI does not need runtime host, automation SDK, or browser renderer. **Confirmed.**

### Data Model
- `[from codebase]` Diagnostic types are Sendable and Hashable value types.
- `[inferred]` Multi-file scanning aggregates per-file results. **Confirmed.**
- `[inferred]` No persistent state. **Confirmed.**

### API and Contract Surface
- `[inferred]` Human-readable text default + --json flag. **Confirmed.**
- `[inferred]` Exit code 0/1/2 semantics. **Confirmed.**

### Operational Requirements
- `[inferred]` No network access, no host permissions. **Confirmed.**
- `[from codebase]` Line-based pattern matching, not a full Swift parser. **Confirmed.**

### User Corrections
- User clarified overall project vision: mirroring native capabilities, functionality, and look for iPhone app testing with Playwright-style automation. Manifest was confirmed to align with this.

## Interview Turns

### Turn 1: CLI Language, Input Scope, Output Grouping

**Questions asked:**
1. Swift executable vs Node/TypeScript CLI vs both?
2. Directory recursive scan vs SwiftPM-aware vs single file?
3. Category-grouped vs file-grouped vs summary-first output?

**Options presented with pros/cons:**
- CLI language: Swift (zero reimplementation, same toolchain) vs Node (matches TS ecosystem but risks drift) vs Both (best of both, more surface area)
- Input: Directory scan (simple, works with any layout) vs SwiftPM-aware (more precise, more complex) vs Single file (simplest)
- Grouping: Category (matches migration workflow) vs File (better for file-by-file) vs Summary+category (best for triage)

**User selections:**
- Both: Swift core + thin TS wrapper
- Directory recursive scan
- Group by category

### Turn 2: Bridge Model, Manifest Output, TS Package Location

**Questions asked:**
1. How should TS wrapper invoke Swift binary?
2. Should CLI produce a draft native capability manifest?
3. Where should the TS wrapper package live?

**Options presented with pros/cons:**
- Bridge: Shell out with --json (simple, no IPC) vs WASM (no Swift requirement, complex build) vs Shared file (avoids stdout limits)
- Manifest: Generate draft (bridges analysis to mocking) vs Diagnostics only vs Opt-in with --manifest flag
- Package: New packages/compatibility-cli (clean separation) vs Subcommand in automation-sdk (fewer packages) vs Generic packages/cli (future-proof)

**User selections:**
- Shell out to Swift binary with --json
- Yes, generate draft manifest (always)
- New packages/compatibility-cli

### Turn 3: JSON Schema, Scan Boundaries, Exit Codes

**Questions asked:**
1. Mirror Swift types vs CLI-optimized flat schema for JSON?
2. How to handle non-Swift files, hidden dirs, symlinks?
3. What exit code semantics?

**Options presented with pros/cons:**
- JSON: Mirror Swift (one canonical schema) vs Flat (more ergonomic for shell scripts)
- Scan: Skip non-.swift/hidden/.build/symlinks (safe defaults) vs Scan everything (simpler) vs Configurable patterns (most flexible)
- Exit codes: 0/1/2 (CI-friendly) vs 0/1 (simpler) vs 0/1/2/3 (most granular)

**User selections:**
- Mirror Swift types directly
- Skip non-.swift, hidden dirs, .build, and symlinks
- 0=no issues, 1=diagnostics found, 2=error

### Turn 4: Manifest Delivery, TS API Surface, Test Strategy

**Questions asked:**
1. How to deliver the draft manifest in output?
2. CLI-only bin, programmatic API, or both for the TS wrapper?
3. What test strategy?

**Options presented with pros/cons:**
- Manifest: Embedded in JSON + text section (always visible) vs Separate file with --manifest-out (clean output) vs Both
- TS API: Both bin + programmatic (most useful) vs CLI only (simplest) vs Programmatic only (unusual)
- Testing: Swift integration + TS bridge (comprehensive) vs Swift only (trust TS wrapper) vs E2E TS only (requires Swift in test env)

**User selections:**
- Embedded in JSON + printed section in text mode
- Both: bin entry + programmatic API
- Swift CLI integration tests + TS bridge tests

### Turn 5: Aggregation Model, Roadmap Fit

**Questions asked:**
1. How to aggregate multi-file results?
2. Where does this fit in the roadmap?

**Options presented with pros/cons:**
- Aggregation: Merge into one report, dedup by (name, category) (clean summary) vs Concatenate per-file (verbose) vs Two-level summary+detail (most informative, more complex)
- Roadmap: Standalone spec, sequenced later (no scope creep) vs Add to Phase 12 (risk: high-conflict phase) vs New Phase 13 (dedicated CLI tools phase)

**User selections:**
- Merge into one report, dedup by (name, category)
- Standalone spec, sequenced later

### Coverage Checkpoint

Presented structured summary covering: implementation goals, architecture, input model, output format, aggregation, testing, scope, and non-goals.

**User response:** "Looks complete, write the spec."

## Significant Deviations from Original Idea

The original idea in `tasks/ideas.md` described only a Swift-side CLI. The interview expanded scope to include:
- A thin TypeScript wrapper package (`packages/compatibility-cli`) with both CLI and programmatic API
- Draft native capability manifest generation from detected platform APIs
- Multi-file aggregation with deduplication logic
- Structured exit code semantics for CI integration

The original idea's core intent (scan arbitrary Swift source, emit grouped diagnostics + strict-mode hints) is preserved.
