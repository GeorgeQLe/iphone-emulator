# Open-Source iPhone Emulator Harness — Specification

## 1. Overview

Build an open-source-only iPhone-like emulator harness for agent-driven testing of Swift applications. The product does not run real iOS, does not use Apple's proprietary simulator runtime, and does not claim pixel-perfect UIKit or Safari fidelity. Instead, it provides a deterministic Swift runtime, an iPhone-like UI surface, and a Playwright-style automation API that lets agents and developers test app behavior, navigation, state changes, forms, networking, and approximate visual output.

Positioning: "An open-source iPhone-like app harness for agents." It is a parallel track to a real iOS Simulator service, optimized for portability, inspectability, and licensing clarity rather than exact device fidelity.

## 2. Goals and Non-goals

### Goals

- Accept Swift source packages and compile them with the open-source Swift toolchain.
- Provide a first-class emulator SDK for apps written directly against the harness.
- Provide best-effort SwiftUI-subset compatibility for existing Swift codebases.
- Render an iPhone-like interactive surface in the browser.
- Expose a semantic UI tree and Playwright-style automation API for agents.
- Run deterministically in a local or server process without Apple proprietary runtime dependencies.
- Report unsupported Apple APIs clearly with source locations and suggested shim/adaptation paths.

### Non-goals

- Running arbitrary `.ipa` files or App Store apps.
- Running real iOS, UIKit, SwiftUI, WebKit, CoreAnimation, or the Xcode Simulator runtime.
- Pixel-perfect iOS rendering.
- Full binary compatibility with Apple frameworks.
- Real-device hardware behavior.
- React Native compatibility in v1.

## 3. Product Modes

### Strict Mode

Strict mode is the reliable v1 path. Apps are written against an open-source `IPhoneHarness` Swift SDK that exposes supported UI, navigation, lifecycle, storage, networking, and device simulation APIs.

Strict mode optimizes for deterministic agent testing, complete runtime control, and low ambiguity. It should be the default mode for examples, templates, CI, and documentation.

### Compatibility Mode

Compatibility mode ingests existing Swift codebases and attempts to run a supported subset. It prioritizes plain Swift business logic and a SwiftUI-like declarative UI subset. Unsupported imports, symbols, modifiers, lifecycle hooks, or platform APIs are surfaced as structured diagnostics.

Compatibility mode is explicitly best-effort. It should help teams migrate or test parts of an iOS app without pretending to be a replacement for Apple's simulator.

## 4. Primary Users and Jobs

| User | Job |
|---|---|
| AI coding agent | Launch an app harness, perform user flows, inspect semantic UI state, capture screenshots, and report failures. |
| Swift app developer | Test core app flows without a Mac-only Apple simulator dependency. |
| Product engineer | Build deterministic fixture apps for CI and agent evaluation. |
| Framework contributor | Add compatibility shims for more SwiftUI/UIKit-like APIs. |

## 5. Architecture

```
Swift source/package
        |
        v
Open-source Swift toolchain
        |
        v
Harness runtime process  <--- JSON-RPC/WebSocket ---> SDK / MCP / tests
        |
        +--> UI tree engine
        +--> state/lifecycle engine
        +--> network/storage/device shims
        +--> diagnostic analyzer
        |
        v
Browser renderer: iPhone shell + DOM/canvas surface + semantic inspector
```

### Components

- **Swift Harness SDK**: open-source Swift package used by strict-mode apps.
- **Compatibility Layer**: source-level adapters and shims for a SwiftUI-inspired subset, with later UIKit-inspired adapters where practical.
- **Runtime Host**: local/server process that loads compiled Swift modules, manages app lifecycle, state, and I/O.
- **Renderer**: browser UI that draws an iPhone-like shell and renders the harness UI tree.
- **Automation Protocol**: JSON-RPC over WebSocket, with a Playwright-flavored TypeScript SDK and MCP server.
- **Diagnostics Engine**: static/source analysis plus runtime errors for unsupported APIs.

## 6. v1 Scope

- Runtime target: server/local process first.
- Language target: open-source Swift toolchain.
- App model: strict-mode apps using the harness SDK.
- Compatibility target: plain Swift logic plus SwiftUI-subset source compatibility.
- UI primitives: text, image, button, text field, list, stack layouts, navigation stack, modal sheet, tab view, alerts.
- State primitives: observable state, bindings, environment values, app lifecycle events.
- Device simulation: viewport sizes, dark/light mode, locale, clock, geolocation, network fixtures.
- Network: mocked HTTP routes, fixture responses, HAR-like request log.
- Automation: tap, type, swipe/scroll, wait for element, inspect tree, screenshot, collect logs.
- Diagnostics: unsupported import/symbol report with file/line where possible.

## 7. Deferred Scope

### React Native Compatibility

React Native is a good future compatibility lane because its JavaScript app logic and renderer abstractions are open-source and already separate many app concerns from platform-specific iOS APIs. It should be deferred until the Swift harness runtime and UI tree are stable.

Future React Native support would:

- Run the app's JavaScript bundle in a controlled JS runtime.
- Provide mocked React Native native modules.
- Render the React Native view tree into the same iPhone-like browser surface.
- Reuse the same Playwright-style automation API and semantic inspector.
- Report unsupported native modules clearly.

The main risk is custom native iOS modules. Those would require adapters, mocks, or explicit unsupported diagnostics.

### Other Deferred Items

- UIKit-source compatibility beyond small surface adapters.
- Browser/Wasm runtime target.
- Pixel-fidelity theming.
- Native module marketplace for compatibility shims.
- Cloud-hosted multi-tenant service.

## 8. Public API Sketch

### Swift Strict-Mode App

```swift
import IPhoneHarness

@HarnessApp
struct TodoApp {
    var body: some HarnessScene {
        NavigationStack {
            List {
                Text("Inbox")
                Button("Add") {
                    // mutate app state
                }
            }
        }
    }
}
```

### TypeScript Automation

```ts
import { Emulator } from "@iphone-emulator/sdk";

const app = await Emulator.launch({
  projectPath: "./fixtures/TodoApp",
  mode: "strict",
});

await app.getByText("Add").tap();
await app.getByRole("textbox", { name: "Title" }).fill("Buy milk");
await app.screenshot({ path: "todo.png" });
await app.close();
```

## 9. Compatibility Strategy

- Prefer source-level compatibility over binary compatibility.
- Maintain a documented compatibility matrix by framework area.
- Treat unsupported APIs as product output, not crashes.
- Add shims only when they preserve deterministic behavior and can be tested.
- Keep the harness SDK canonical; compatibility shims should lower into the same UI tree/runtime model.

## 10. Risks

- **Expectation mismatch**: users may expect real iOS. Mitigation: product copy must say "iPhone-like harness," not "iOS simulator."
- **SwiftUI complexity**: SwiftUI semantics are large and proprietary. Mitigation: start with an explicit subset and compatibility diagnostics.
- **Visual fidelity pressure**: approximate rendering may not satisfy design QA. Mitigation: optimize for behavioral/agent testing first.
- **Native API gaps**: existing apps often use Apple-only frameworks. Mitigation: structured unsupported reports and migration guides.

## 11. Recommended Milestones

- **M0**: repo scaffold, strict-mode Swift SDK, runtime host, static diagnostics skeleton.
- **M1**: UI tree engine, browser renderer, Playwright-style TS SDK.
- **M2**: SwiftUI-subset compatibility for common view/layout/state primitives.
- **M3**: agent artifacts: screenshots, semantic snapshots, logs, network fixtures.
- **M4**: compatibility reports, migration helpers, and expanded device simulation.
- **M5**: evaluate React Native compatibility lane.
