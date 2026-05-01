# Devtool Docs Audit

Date: 2026-05-01
Project: iPhone Emulator Workspace
Scope: README, public docs, strict-mode examples, specs, and current task queue.

## Findings

### P0: None

No docs blocker appears severe enough to prevent a motivated contributor from running the current local harness. The first-green path is visible in `README.md`, the strict-mode example README, and the CI fixture recipe.

### P1: Current-status language is stale after Phase 11 completion

Evidence:

- `README.md` still says "The current Phase 11 milestone is adding..." even though `tasks/roadmap.md` and `tasks/todo.md` mark Phase 11 complete on 2026-05-01.
- `specs/open-source-iphone-emulator.md` and `specs/drift-report.md` predate the latest Phase 11 completion commits and still frame the baseline as before the local live transport completion.

Impact:

Developers can run the right commands, but the product state is harder to trust because the main narrative lags the implementation. This is especially costly for a devtool where adoption depends on knowing which surfaces are real and which are deferred.

Recommended fix:

- Run `$spec-drift fix all`.
- Update README status language from "current Phase 11 milestone is adding" to "current local baseline includes".
- Refresh the spec baseline to include the completed deterministic local transport mode while keeping production WebSocket, MCP, hosted sessions, and real iOS fidelity deferred.

### P1: Diagnostic vocabulary has one stale public-doc reference

Evidence:

- `docs/live-runtime-transport.md` correctly lists the shared diagnostic codes: `connectionFailure`, `timeout`, `unsupportedCommand`, `protocolViolation`, and `staleRevision`.
- `docs/ci-fixture-recipe.md` still says "Local transport command fails with `close`" in Common Failures.

Impact:

Users writing CI assertions may assert a diagnostic code that no longer exists. The correct post-close behavior is now a structured `protocolViolation` with `sessionID`.

Recommended fix:

- Update the CI recipe common-failure row to use `protocolViolation` for post-close commands.
- Consider adding a small "diagnostic code source of truth" note that points from CI docs to `docs/live-runtime-transport.md`.

### P1: API reference is scattered across examples and source paths

Evidence:

- README includes a long automation example and links to conceptual docs, but there is no focused API reference for:
  - `Emulator.launch` fixture mode versus transport mode.
  - Locator methods and query semantics.
  - `app.native.*` controls.
  - artifact/log/network/session inspection methods.
  - Swift `StrictModeSDK` primitives and current compatibility analyzer entry points.
- `examples/strict-mode-baseline/README.md` lists many source files, which is useful for contributors but not a stable public API map.

Impact:

Developers can copy the example, but they must read source or tests to understand the supported SDK surface. This slows adoption after first green run and makes accidental overclaims more likely.

Recommended fix:

- Add `docs/api-reference.md` or split references by package:
  - `docs/automation-sdk-api.md`
  - `docs/strict-mode-sdk-api.md`
  - `docs/runtime-transport-api.md`
- Keep each reference explicit about current deterministic/local behavior and deferred hosted/native fidelity.

### P1: Troubleshooting exists, but it is CI-centered rather than developer-journey-centered

Evidence:

- `docs/ci-fixture-recipe.md` has a strong Common Failures table for fixture and local transport failures.
- README does not link a general troubleshooting section near First Green Run.
- There is no troubleshooting coverage for setup issues such as missing npm install, Node version mismatch, Swift toolchain mismatch, Vite large-chunk warning expectations, or package-specific command confusion.

Impact:

The docs help once a user is already thinking in CI artifact terms, but a local evaluator hitting setup friction may not discover the relevant guidance.

Recommended fix:

- Add a `docs/troubleshooting.md` page.
- Link it from README immediately after First Green Run.
- Include setup, command, fixture, locator, transport diagnostic, native fixture, and known-warning sections.

### P2: Quickstart is command-clear but lacks prerequisites and expected output

Evidence:

- README provides a concise First Green Run command block.
- The docs do not state expected Node/npm/Swift versions near the quickstart.
- The quickstart says what first success means, but it does not show a short expected-output sample or expected test counts.

Impact:

Experienced contributors can infer the environment, but external developers may not know whether failures are environmental or product regressions.

Recommended fix:

- Add prerequisites near First Green Run:
  - macOS with open-source Swift toolchain compatible with the repo.
  - Node/npm version expectation.
  - `npm ci` before package commands.
- Add a compact "expected success shape" section with current Swift/Vitest test counts and the accepted Vite large-chunk warning.

### P2: Migration guidance is useful but not yet tied to a runnable report workflow

Evidence:

- `docs/strict-mode-migration.md` explains how to read `CompatibilityReport` fields.
- `docs/compatibility-matrix.md` names `DiagnosticsCore.CompatibilityAnalyzer`.
- There is no developer-facing command or script that runs compatibility analysis against an arbitrary source path and emits a report.

Impact:

The migration docs describe the model well, but developers cannot yet follow a CLI-style migration path without writing Swift test harness code or reading internals.

Recommended fix:

- Add a small compatibility report example, even if it is currently a test-driven recipe.
- When implementation allows, add a CLI/script entry point and update the migration guide around that command.

### P2: Proof artifacts are described but not checked in as sample outputs

Evidence:

- `docs/ci-fixture-recipe.md` recommends artifact names and includes an artifact writer snippet.
- The repo does not include a sample artifact bundle directory or golden JSON output from the strict-mode baseline example.

Impact:

Teams can create proof artifacts, but they cannot inspect a canonical expected artifact shape before running the harness.

Recommended fix:

- Add `examples/strict-mode-baseline/artifacts/README.md` or `docs/examples/strict-mode-baseline-artifacts.md` with abbreviated sample JSON shapes.
- Avoid committing large generated outputs; use small redacted/trimmed examples for semantic tree, logs, artifact bundle, native events, and transport diagnostic.

## Quickstart Clarity

Strengths:

- The first-green command sequence is prominent and minimal.
- README clearly warns that root `npm test` is not the validation path.
- The strict-mode example README repeats the shortest command path.

Gaps:

- Prerequisites are implied rather than stated.
- `npm ci` is shown in CI docs but not in the local first-green path.
- README status language is stale after Phase 11 completion.

## Examples

Strengths:

- `automation-example.ts` covers fixture-backed automation, network fixtures, device settings, native capability controls, logs, artifacts, and close.
- `live-transport-example.ts` demonstrates the local transport-backed mode separately from fixture mode.
- Example docs are careful not to claim live Swift execution, real iOS, UIKit, or native-service fidelity.

Gaps:

- Examples print values but do not write sample artifacts by default.
- There is no smallest possible TypeScript example separate from the comprehensive native-capability flow.
- There is no example for compatibility analysis output.

## API Reference

Strengths:

- Source paths are named for important runtime, renderer, and SDK files.
- TypeScript examples expose the intended usage shape.
- Native capability docs list manifest payload keys and current mock services.

Gaps:

- No dedicated public API reference page exists.
- Swift strict-mode API docs are conceptual rather than reference-oriented.
- Automation SDK method coverage is discoverable mostly through examples and tests.

## Troubleshooting

Strengths:

- CI fixture recipe has concrete failure rows for locator, route, native fixture, location, unsupported command, and stale revision issues.
- Live transport docs define structured diagnostic codes.

Gaps:

- One stale `close` diagnostic row remains in CI docs.
- General local setup troubleshooting is missing.
- Known accepted warnings are recorded in task history but not easy to find from README.

## Migration Paths

Strengths:

- Strict-mode migration guide clearly explains unsupported imports, platform APIs, lifecycle hooks, modifiers, state, fixtures, and non-goals.
- Compatibility matrix is explicit about supported, partial, unsupported, and deferred surfaces.

Gaps:

- No standalone compatibility-report command exists yet.
- Migration docs do not include a full before/after migration example from SwiftUI subset to strict mode.

## Missing Proof Artifacts

Priority proof artifacts to add:

- First-green local run transcript with current test counts.
- Trimmed `artifact-bundle.json` sample.
- Trimmed `native-events.json` sample.
- Trimmed `transport-diagnostic.json` sample showing `protocolViolation` post-close behavior.
- Compatibility analyzer sample report for a supported and unsupported fixture.

## Recommended Documentation Queue

1. `$spec-drift fix all` to refresh canonical spec and fix stale status/diagnostic references.
2. Add general troubleshooting docs and link them from README.
3. Add focused API reference docs for automation SDK, strict-mode SDK, and runtime transport.
4. Add small proof-artifact examples for CI review.
5. Add compatibility analysis report walkthrough once a command/script exists.
