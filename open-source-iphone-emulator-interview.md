# Open-Source iPhone Emulator Harness — Interview Log

**Date:** 2026-04-27
**Skill:** `$spec-interview`
**Initial draft:** User asked whether the iPhone simulator could be built from scratch without non-open-source or commercially restricted dependencies, by mocking an iPhone environment and accepting a Swift codebase.

## Turn 1 — Feasibility and Product Reframe

**Question/claim explored:** Can we emulate an iPhone from scratch and accept Swift codebases without proprietary dependencies?

**Research summary:** Swift is open source and can run outside Apple platforms, but iOS frameworks such as UIKit, SwiftUI, WebKit-on-iOS, and the official simulator runtime are proprietary or Apple-platform-bound. Running arbitrary iOS apps unchanged is therefore not feasible under the open-source-only constraint.

**Recommendation:** Reframe from "real iPhone simulator" to "open-source iPhone-like Swift app harness." The harness should test app behavior, UI state, navigation, networking, and approximate visuals rather than claim exact iOS fidelity.

**User response:** Accepted the recommendation.

## Turn 2 — Compatibility Level

**Question:** Should the product accept arbitrary existing Swift iOS apps and fail gracefully when unsupported APIs appear, or require apps to be written against a new open-source harness SDK?

**User response:** "Yes and both."

**Decision:** Use two modes:

- **Strict mode:** first-class apps written against the open-source harness SDK.
- **Compatibility mode:** best-effort ingestion of existing Swift codebases, prioritizing plain Swift and a SwiftUI subset, with structured unsupported-API diagnostics.

## Turn 3 — Runtime and Fidelity

**Question:** Should the first runtime target be browser-based WebAssembly, local/server process, or both with server first? Should visual fidelity or behavioral testability lead?

**Recommendation:** Start with a server/local process first, using the open-source Swift toolchain. Prioritize behavioral testability and semantic UI inspection, while providing approximate iPhone visual rendering in a browser shell.

**User response:** Agreed.

## Turn 4 — Project Layout

**Question/decision:** User asked to create a new directory named `iphone-emulator` and work from there.

**Decision:** Created `iphone-emulator/` as an isolated workspace under the existing repository.

## Turn 5 — React Native

**Question:** How would React Native fit into this?

**Recommendation:** React Native is a strong future compatibility lane because JavaScript app logic and much of the renderer abstraction are open-source, but native modules remain the hard part. Defer it until the Swift harness runtime and UI tree stabilize.

**User response:** Asked to add it to the spec as deferred.

**Decision:** React Native compatibility is explicitly deferred. Future support would run the JS bundle in a controlled runtime, mock native modules, render the RN view tree into the same iPhone-like surface, reuse the same automation API, and report unsupported native modules.

## Coverage Checkpoint

Covered so far:

- Open-source-only constraint and why real iOS emulation is out of scope.
- Product reframe to an iPhone-like Swift app harness.
- Dual strict/compatibility mode strategy.
- Server/local process as first runtime target.
- Behavioral testability plus approximate visual rendering.
- React Native as a deferred compatibility lane.

Areas still worth validating before implementation:

- Exact SwiftUI subset for v1.
- Whether UIKit source adapters should appear in v1 diagnostics only or limited shims.
- Runtime host implementation language.
- Browser renderer technology.
- Package layout and milestone sequencing.

## Deviations From Initial Draft

- The initial idea implied an iPhone emulator capable of accepting Swift iOS code. The spec now avoids claiming real iOS compatibility and instead defines a lawful, open-source harness with explicit compatibility limits.
- React Native was added as future scope, not v1, because it introduces a second runtime and native-module compatibility problem.
