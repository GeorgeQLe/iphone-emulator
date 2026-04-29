# Todo — iPhone Emulator Workspace

> Current phase: 7 of 10 — M6 Browser IDE Demo and Interactive Preview Loop
> Source roadmap: `tasks/roadmap.md`
> Test strategy: tests-after

## Phase 7: M6 Browser IDE Demo and Interactive Preview Loop

**Status:** complete.

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
- [x] Step 7.3: Make preview interactions stateful inside the iPhone-like renderer
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/renderTree.ts`, `packages/browser-renderer/src/styles.ts`, `packages/browser-renderer/src/demoStyles.ts`
  - Support editable text fields, focus styling, mock keyboard display, keyboard insert/delete/done behavior, and semantic inspector updates after input changes.
- [x] Step 7.4: Keep the demo honest about mocked source lowering versus live Swift execution
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/demoStyles.ts`, `README.md` or `examples/strict-mode-baseline/README.md` if a doc note is needed
  - Surface copy or diagnostics that explain the demo is a browser IDE loop over illustrative strict-mode lowering until live Swift runtime transport exists.
- [x] Step 7.5: Polish responsive layout and preview ergonomics
  - Files: modify `packages/browser-renderer/src/demoStyles.ts`, `packages/browser-renderer/src/styles.ts`
  - Ensure the editor, preview, keyboard, diagnostics, and inspector remain usable on desktop and narrower viewports without overlapping content.

### Green
- [x] Step 7.6: Write regression tests covering the demo compiler and interactive renderer behavior
  - Files: create or modify `packages/browser-renderer/src/demoProject.test.ts`, `packages/browser-renderer/src/renderTree.test.ts`, and only test helpers if needed
  - Cover semantic tree generation from the mock strict-mode source, unsupported import diagnostics, editable text field rendering, and keyboard/input state update behavior where practical in jsdom.
- [x] Step 7.7: Run browser renderer validation
  - Files: no intended source edits unless validation exposes missing package or TypeScript wiring
  - Run `npm --prefix packages/browser-renderer run typecheck`, `npm --prefix packages/browser-renderer test`, and `npm --prefix packages/browser-renderer run build`.
- [x] Step 7.8: Refactor demo boundaries if needed while keeping validation green
  - Files: modify `packages/browser-renderer/src/main.ts`, `packages/browser-renderer/src/demoProject.ts`, `packages/browser-renderer/src/demoStyles.ts`, and `packages/browser-renderer/src/renderTree.ts` only as needed
  - Result: completed as a no-op boundary review. `main.ts` remains the demo shell and preview-state owner, `demoProject.ts` remains the illustrative lowering owner, `demoStyles.ts` remains package-local demo styling, and `renderTree.ts` remains the reusable semantic tree renderer.
  - Validation: no source changes were made, so the Step 7.7 green browser renderer validation surface was reused.

### Milestone: M6 Browser IDE Demo and Interactive Preview Loop
**Acceptance Criteria:**
- [x] A user can edit the mock strict-mode app and see the iPhone-like preview update.
- [x] A user can interact with the preview and see semantic state/artifact metadata update.
- [x] The demo distinguishes mocked source lowering from real Swift execution.
- [x] Browser renderer typecheck, tests, and build pass.
- [x] All phase tests pass.
- [x] No regressions in previous phase tests.

**On Completion:**
- Deviations from plan: Step 7.8 completed as an intentional no-op boundary review; no demo or renderer refactor was justified after the audit.
- Tech debt / follow-ups: live Swift runtime transport remains future work; the browser demo continues to label source lowering as illustrative.
- Ready for next phase: yes
