# Todo — iPhone Emulator Workspace

> Current phase: 7 of 10 — M6 Browser IDE Demo and Interactive Preview Loop
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tests-after

## Phase 7: M6 Browser IDE Demo and Interactive Preview Loop

**Status:** planned.

**Goal:** Turn the renderer demo into a credible browser-based IDE harness that shows the intended agent/codegen workflow.

**Scope:**
- Provide a Monaco-based mock project editor with strict-mode source, agent test code, and README context.
- Lower supported strict-mode declarations into a semantic UI tree for live preview.
- Make preview interactions stateful: text input, keyboard, buttons, focus, and semantic inspector updates.
- Show diagnostics and render/artifact metadata in the same browser surface.
- Keep the demo honest: source lowering is illustrative until the live Swift runtime transport exists.

**Acceptance Criteria:**
- A user can edit the mock strict-mode app and see the iPhone-like preview update.
- A user can interact with the preview and see semantic state/artifact metadata update.
- The demo distinguishes mocked source lowering from real Swift execution.
- Browser renderer typecheck, tests, and build pass.

### Execution Profile
**Parallel mode:** serial
**Integration owner:** main agent
**Conflict risk:** medium
**Review gates:** correctness, tests, docs/API conformance, UX

**Subagent lanes:** none

### Implementation
- [x] Step 7.1: Stabilize the browser IDE demo shell around the current renderer package
  - Files: modify `packages/browser-renderer/index.html`, `packages/browser-renderer/package.json`, `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/vite-env.d.ts`, `packages/browser-renderer/tsconfig.json`, `package-lock.json`
  - Ensure Monaco loads through Vite, the demo has a local `dev` script, file selection works, and the shell clearly presents editor, preview, diagnostics, and inspector panes.
- [x] Step 7.2: Define the mock project and source-to-semantic lowering surface
  - Files: create or modify `packages/browser-renderer/src/demoProject.ts`
  - Represent mock strict-mode Swift, agent test, and README files; parse the supported illustrative declarations into `SemanticUITree`; produce diagnostics for unsupported framework imports and empty supported surfaces.
  - Implementation plan: audit the existing `demoProjectFiles` and `compileDemoProject` helpers, then tighten `demoProject.ts` as the single owner for mock project content, supported declaration parsing, deterministic node IDs, and compiler diagnostics. Keep the lowering deliberately illustrative and package-local; do not move reusable renderer behavior into the demo compiler.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck` after the change, and defer broader regression coverage to Step 7.6 unless Step 7.2 changes public renderer contracts.
- [x] Step 7.3: Make preview interactions stateful inside the iPhone-like renderer
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/styles.ts`, `packages/browser-renderer/src/demoStyles.ts`
  - Support editable text fields, focus styling, mock keyboard display, keyboard insert/delete/done behavior, and semantic inspector updates after input changes.
  - Implementation plan: trace the current `wirePreviewInteractions`, `renderTextFieldNode`, and keyboard helpers, then make text field state updates flow through the rendered node metadata without re-running the demo compiler. Keep persistent preview-only input state in `main.ts`; keep reusable DOM affordances such as node IDs, focus hooks, and text field attributes in `renderTree.ts`; keep visual keyboard and focus treatment in package-local style modules. Preserve deterministic inspector output after each text mutation.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck` and `npm --prefix packages/browser-renderer test`; run `npm --prefix packages/browser-renderer run build` if style or Vite-facing entry code changes are non-trivial.
- [x] Step 7.4: Keep the demo honest about mocked source lowering versus live Swift execution
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/demoStyles.ts`, `README.md` or `examples/strict-mode-baseline/README.md` if a doc note is needed
  - Surface copy or diagnostics that explain the demo is a browser IDE loop over illustrative strict-mode lowering until live Swift runtime transport exists.
  - Implementation plan: audit the existing sidebar/footer, preview header, diagnostics copy, and mock project README text for places that imply live Swift execution. Add a concise browser-visible execution-mode indicator and, if needed, a non-error diagnostic emitted by `compileDemoProject` that labels the current path as illustrative source lowering rather than runtime execution. Keep this as demo copy/metadata only; do not change semantic tree contracts or renderer behavior.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build` because this step touches browser-facing demo code/copy.
- [x] Step 7.5: Polish responsive layout and preview ergonomics
  - Files: modify `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/styles.ts`
  - Ensure the editor, preview, keyboard, diagnostics, and inspector remain usable on desktop and narrower viewports without overlapping content.
  - Implementation plan: audit the current CSS grid breakpoints, phone-shell scaling, keyboard placement, diagnostics area, and inspector sizing in `demoStyles.ts` and reusable renderer dimensions in `styles.ts`. Tighten responsive constraints so the editor, preview stage, keyboard, diagnostics, and inspector remain visible and non-overlapping on desktop, tablet-width, and mobile-width viewports. Prefer package-local CSS changes over renderer contract changes unless a reusable renderer style is clearly responsible for overflow.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build` because this step changes browser-facing layout CSS.

### Green
- [x] Step 7.6: Write regression tests covering the demo compiler and interactive renderer behavior
  - Files: create or modify `packages/browser-renderer/src/demoProject.test.ts`, `packages/browser-renderer/src/renderTree.test.ts`, and only test helpers if needed
  - Cover semantic tree generation from the mock strict-mode source, unsupported import diagnostics, editable text field rendering, and keyboard/input state update behavior where practical in jsdom.
  - Implementation plan: add focused Vitest coverage for `compileDemoProject` using the bundled mock strict-mode source and a small unsupported-import sample, asserting deterministic semantic root structure, execution-mode metadata, and diagnostics. Extend `renderTree.test.ts` with DOM-level assertions for text field metadata, editable input values, focusable controls, and renderer-owned node IDs. For keyboard/input state, prefer testing the public rendered DOM affordances that `main.ts` wires to instead of exporting demo-only internals; only extract a tiny package-local helper if jsdom cannot cover an interaction without coupling to the full Monaco shell.
  - Validation focus: run `npm --prefix packages/browser-renderer run typecheck` and `npm --prefix packages/browser-renderer test` after adding the tests; run `npm --prefix packages/browser-renderer run build` if test helper extraction touches Vite-facing source.
- [ ] Step 7.7: Run browser renderer validation
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring
  - Run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
- [ ] Step 7.8: Refactor demo boundaries if needed while keeping validation green
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/demoStyles.ts`, and `packages/browser-renderer/src/renderTree.ts` only as needed
  - Keep demo-specific code separated from reusable renderer behavior so later native capability phases can reuse the renderer contracts.

### Milestone: M6 Browser IDE Demo and Interactive Preview Loop
**Acceptance Criteria:**
- [ ] A user can edit the mock strict-mode app and see the iPhone-like preview update.
- [ ] A user can interact with the preview and see semantic state/artifact metadata update.
- [ ] The demo distinguishes mocked source lowering from real Swift execution.
- [ ] Browser renderer typecheck, tests, and build pass.
- [ ] All phase tests pass.
- [ ] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: none yet
- Tech debt / follow-ups: none yet
- Ready for next phase: no
