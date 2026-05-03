# Open-Source iPhone Emulator Harness — Specification

## 1. Overview

Build an open-source-only iPhone-like emulator harness for agent-driven testing of Swift applications. The product does not run real iOS, does not use Apple's proprietary simulator runtime, and does not claim pixel-perfect UIKit or Safari fidelity. Instead, it provides a deterministic Swift runtime, an iPhone-like UI surface, a mock native capability layer, and a Playwright-style automation API that lets agents and developers test app behavior, navigation, state changes, forms, native-service interactions, networking, and approximate visual output.

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
- Detect native capability needs from strict-mode or compatibility-mode source and map them to explicit mocks, fixtures, permissions, events, logs, and artifacts.
- Simulate native functionality through deterministic capability contracts rather than hidden platform behavior.

### Non-goals

- Running arbitrary `.ipa` files or App Store apps.
- Running real iOS, UIKit, SwiftUI, WebKit, CoreAnimation, or the Xcode Simulator runtime.
- Pixel-perfect iOS rendering.
- Full binary compatibility with Apple frameworks.
- Real-device hardware behavior.
- Faithful native camera, sensor, notification, maps, contacts, Bluetooth, media, or filesystem behavior.
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
        +--> mock native capability registry
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
- **Native Capability Registry**: deterministic contracts for mockable native services such as permissions, camera, photos, location, contacts, notifications, clipboard, storage, sensors, haptics, maps, and share sheets.
- **Renderer**: browser UI that draws an iPhone-like shell and renders the harness UI tree.
- **Automation Protocol**: JSON-RPC over WebSocket, with a Playwright-flavored TypeScript SDK and MCP server.
- **Diagnostics Engine**: static/source analysis plus runtime errors for unsupported APIs.

### Native Capability Simulation

Native functionality is represented as explicit harness capabilities, not as reimplemented iOS frameworks. A capability defines:

- the strict-mode API surface that app code may call;
- the compatibility symbols that can be recognized from source;
- the launch-time mock configuration and default permission state;
- runtime events and state transitions;
- semantic UI effects such as permission prompts, pickers, sheets, maps, keyboards, or capture screens;
- automation SDK controls and inspection APIs;
- artifacts, logs, and unsupported diagnostics.

The runtime should fail closed. If code asks for a native service that has no deterministic capability contract, the harness should report an unsupported diagnostic instead of silently pretending the service exists.

## 6. v1 Scope

- Runtime target: server/local process first.
- Language target: open-source Swift toolchain.
- App model: strict-mode apps using the harness SDK.
- Compatibility target: plain Swift logic plus SwiftUI-subset source compatibility.
- UI primitives: text, image, button, text field, list, stack layouts, navigation stack, modal sheet, tab view, alerts.
- State primitives: observable state, bindings, environment values, app lifecycle events.
- Device simulation: viewport sizes, dark/light mode, locale, clock, geolocation, network fixtures.
- Native mocks: permission state, fixture-backed location, camera/photo selection, clipboard, keyboard/focus, file picker, local notification scheduling, and device orientation where represented by strict-mode contracts.
- Network: mocked HTTP routes, fixture responses, HAR-like request log.
- Automation: tap, type, swipe/scroll, wait for element, inspect tree, screenshot, collect logs.
- Diagnostics: unsupported import/symbol report with file/line where possible.

### Current Implementation Baseline

As of the May 1, 2026 drift audit, the repository implements a fixture-backed baseline plus a deterministic local live transport path rather than the complete v1 scope above.

Implemented strict-mode SDK primitives:

- `Text`, `Button`, `TextField`, `List`, `VStack`, `HStack`, and `NavigationStack` lower to semantic `UITreeNode` values.
- `Modal`, `TabView`, and `Alert` lower to semantic `UITreeScene` state.
- The root Swift package exposes `StrictModeSDK`, `RuntimeHost`, and `DiagnosticsCore`.

Implemented runtime and automation contracts:

- `RuntimeAppLoader` loads strict-mode or compatibility fixtures into retained `RuntimeTreeSnapshot` values.
- Runtime automation command and response envelopes cover launch, close, tap, fill, type, wait, query, inspect, semantic snapshot, screenshot metadata, logs, network request records, and native automation actions.
- The Swift runtime transport contract defines request, response, event, session descriptor, and diagnostic envelopes for local live sessions. The checked-in transport implementation is deterministic and in memory.
- The TypeScript automation SDK supports fixture-backed launch through `RuntimeAutomationLaunchOptions` with `appIdentifier`, `fixtureName`, optional `device`, and optional `nativeCapabilities`; only the `strict-mode-baseline` fixture is launchable through fixture mode.
- The TypeScript automation SDK also supports transport-backed launch through `RuntimeTransportLaunchOptions` with `mode: "transport"`, `appIdentifier`, `fixtureName`, a `RuntimeTransportLike` implementation, and optional device/native capability configuration.
- The TypeScript SDK exposes locators by role, text, and test id; artifact/log/session access; network route and request recording; screenshot metadata; semantic tree inspection; native automation namespaces; and exported local transport helpers.
- The browser renderer has a live-session adapter that applies semantic tree snapshots, tracks live session id/revision metadata, reports stale revisions as diagnostics, and keeps demo fallback mode separate from live mode.

Implemented diagnostics and compatibility contracts:

- `DiagnosticsCore` reports unsupported imports, symbols, modifiers, lifecycle hooks, and platform APIs with source locations and suggested adaptations.
- `CompatibilityMatrix.v1` marks the initial SwiftUI import as supported, `VStack` lowering as partial, UIKit platform APIs as unsupported, and lifecycle hooks as deferred.

Implemented native capability contracts:

- The runtime manifest records required capabilities, configured mocks, scripted events, unsupported symbols, and artifact outputs.
- Capability identifiers cover permissions, camera, photos, location, network, clipboard, keyboard input, files, share sheet, notifications, device environment, sensors, haptics, and unsupported APIs.
- Automation event support currently covers camera capture, photo selection, location update/current state, clipboard read/write, file selection, share sheet completion, notification scheduling/delivery, permission request/set, and device environment snapshot.
- Sensors and haptics are represented in the manifest taxonomy but do not yet have first-class automation actions.

Not yet implemented from the full v1 scope:

- Compiling arbitrary Swift source packages into runnable harness sessions from the TypeScript SDK.
- A production WebSocket transport service or MCP server. The current transport vocabulary uses JSON-RPC/WebSocket-shaped envelopes, but the working implementation is local and in memory.
- Browser/Wasm runtime target.
- Image view and swipe/scroll automation primitives.
- Full storage APIs, environment values, observable state/bindings beyond the current semantic fixture model.
- Real screenshot bytes; screenshots currently produce deterministic metadata records.
- End-to-end source analyzer integration that automatically derives native capability manifests from arbitrary packages.

## 7. Native Capability Model

The harness should maintain a native capability manifest for each source package or fixture. The manifest is derived from app declarations, compatibility analysis, and explicit launch configuration.

Example manifest:

```json
{
  "requiredCapabilities": [
    {
      "id": "camera",
      "permissionState": "granted",
      "strictModeAlternative": "Use deterministic camera fixture output."
    },
    {
      "id": "location",
      "permissionState": "denied",
      "strictModeAlternative": "Use scripted location fixtures."
    }
  ],
  "configuredMocks": [
    {
      "capability": "camera",
      "identifier": "front-camera-still",
      "payload": {
        "fixtureName": "fixtures/profile-photo.jpg"
      }
    }
  ],
  "scriptedEvents": [],
  "unsupportedSymbols": []
}
```

Initial capability categories:

| Capability | Simulation strategy |
| --- | --- |
| Permissions | Deterministic permission state, prompt UI, and automation controls. |
| Camera and photos | Fixture-backed capture or picker output with artifact records. |
| Location | Static or scripted coordinates, permission behavior, and location event logs. |
| Network | Mocked route fixtures, request/response records, and offline/latency metadata. |
| Clipboard | String/image fixture state readable and writable by automation. |
| Keyboard and text input | Focus, input traits, keyboard UI, and editable semantic state. |
| Files and share sheet | Fixture-backed file picker/export events and semantic sheet UI. |
| Notifications | Scheduled local notification records, prompt state, and delivery events. |
| Device environment | Viewport, orientation, color scheme, locale, clock, geolocation, and network state. |
| Sensors and haptics | Deterministic event records and logs before any visual or physical simulation. |

Native capability support should be expanded only when the capability has tests, deterministic configuration, automation access, and clear diagnostics for unsupported platform APIs.

## 8. Deferred Scope

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

## 9. Public API Sketch

### Swift Strict-Mode App

```swift
import StrictModeSDK

struct TodoApp: App {
    var body: some Scene {
        Modal {
            NavigationStack {
                List {
                    Text("Inbox")
                    Button("Add")
                }
            }
        }
    }
}
```

Future strict-mode syntax may add macros and mutation handlers, but the current contract is semantic-tree lowering through `StrictModeSDK.App`, `Scene`, and `View`.

```swift
let tree = TodoApp().makeSemanticTree(appIdentifier: "TodoApp")
```

The older conceptual shape remains the target authoring direction:

```swift
NavigationStack {
    List {
        Text("Inbox")
        Button("Add") {
            // mutate app state
        }
    }
}
```

The current runtime-representable equivalent is:

```swift
Modal {
    NavigationStack {
        List {
            Text("Inbox")
            Button("Add")
        }
    }
}
```

State mutation closures are not yet part of the strict-mode SDK surface.

### TypeScript Automation

```ts
import { Emulator } from "@iphone-emulator/automation-sdk";

const app = await Emulator.launch({
  appIdentifier: "TodoApp",
  fixtureName: "strict-mode-baseline",
});

await app.getByText("Add").tap();
await app.getByRole("textbox", { name: "Title" }).fill("Buy milk");
await app.screenshot({ path: "todo.png" });
await app.close();
```

The local live transport path uses the same high-level automation concepts through an explicit transport client:

```ts
import {
  Emulator,
  RuntimeTransportClient,
  createInMemoryRuntimeTransport,
} from "@iphone-emulator/automation-sdk";

const transport = new RuntimeTransportClient({
  transport: createInMemoryRuntimeTransport({
    fixtureName: "strict-mode-baseline",
  }),
});

const app = await Emulator.launch({
  mode: "transport",
  appIdentifier: "TodoApp",
  fixtureName: "strict-mode-baseline",
  transport,
});

await app.getByText("Add").tap();
const tree = await app.semanticTree();
await app.close();
```

### TypeScript Native Mock Configuration

```ts
const app = await Emulator.launch({
  appIdentifier: "ProfileApp",
  fixtureName: "strict-mode-baseline",
  nativeCapabilities: {
    requiredCapabilities: [
      {
        id: "camera",
        permissionState: "granted",
        strictModeAlternative: "Use deterministic camera fixture output.",
      },
      {
        id: "location",
        permissionState: "denied",
        strictModeAlternative: "Use scripted location fixtures.",
      },
    ],
    configuredMocks: [
      {
        capability: "camera",
        identifier: "front-camera-still",
        payload: {
          fixtureName: "fixtures/profile-photo.jpg",
        },
      },
    ],
    scriptedEvents: [],
    unsupportedSymbols: [],
    artifactOutputs: [],
  },
});

await app.getByText("Take Photo").tap();
const capture = await app.native.camera.capture("front-camera-still");
const permissions = await app.native.permissions.snapshot();
```

## 10. Compatibility Strategy

- Prefer source-level compatibility over binary compatibility.
- Maintain a documented compatibility matrix by framework area.
- Treat unsupported APIs as product output, not crashes.
- Add shims only when they preserve deterministic behavior and can be tested.
- Keep the harness SDK canonical; compatibility shims should lower into the same UI tree/runtime model.
- Treat native API compatibility as capability detection plus deterministic mocking. Recognized symbols should either map to a supported capability contract or produce a structured unsupported diagnostic.

## 11. Risks

- **Expectation mismatch**: users may expect real iOS. Mitigation: product copy must say "iPhone-like harness," not "iOS simulator."
- **SwiftUI complexity**: SwiftUI semantics are large and proprietary. Mitigation: start with an explicit subset and compatibility diagnostics.
- **Visual fidelity pressure**: approximate rendering may not satisfy design QA. Mitigation: optimize for behavioral/agent testing first.
- **Native API gaps**: existing apps often use Apple-only frameworks. Mitigation: structured unsupported reports and migration guides.
- **Mock fidelity creep**: every native mock can turn into an attempt to clone iOS. Mitigation: each capability must document its deterministic contract, non-goals, and unsupported behaviors.
- **Hidden nondeterminism**: native-like services can accidentally depend on real time, host files, live network, or browser permissions. Mitigation: all capability inputs should come from launch config, fixtures, or scripted events.

## 12. Recommended Milestones

- **M0**: repo scaffold, strict-mode Swift SDK, runtime host, static diagnostics skeleton.
- **M1**: UI tree engine, browser renderer, Playwright-style TS SDK.
- **M2**: SwiftUI-subset compatibility for common view/layout/state primitives.
- **M3**: agent artifacts: screenshots, semantic snapshots, logs, network fixtures.
- **M4**: compatibility reports, migration helpers, and expanded device simulation.
- **M5**: evaluate React Native compatibility lane.
- **M6**: live browser IDE demo with Monaco, editable preview state, and semantic artifact inspection.
- **M7**: native capability registry and manifest generation.
- **M8**: first deterministic native mocks for permissions, camera/photos, location, clipboard, keyboard, file picker, and notifications.
- **M9**: automation SDK native capability controls and end-to-end agent test flows.
