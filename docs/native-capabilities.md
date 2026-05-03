# Native Capability Registry and Mock Services

The native capability registry is a deterministic contract layer for source that asks for native functionality. It does not provide iOS, UIKit, SwiftUI, CoreLocation, AVFoundation, Photos, notification, file picker, share sheet, sensor, haptic, clipboard, or host-device fidelity.

Fixture mode and local transport mode now expose the same current `app.native.*` controls and inspection surfaces for supported deterministic services. That parity is local session parity only: native actions are retained records, fixture outputs, logs, artifacts, and semantic metadata. They are not host native access, production WebSocket support, hosted sessions, MCP behavior, or simulator fidelity.

The registry lets the runtime, diagnostics layer, browser preview, and automation SDK agree on the same capability names, manifest fields, deterministic mock outputs, and fail-closed behavior. The first supported mock services are fixture-backed records for permissions, camera/photos, location, clipboard, keyboard/input traits, files, share sheets, and notifications.

For CI retention of native capability records alongside semantic trees, logs, route fixtures, screenshot metadata, and session state, see [`ci-fixture-recipe.md`](ci-fixture-recipe.md).

## Capability IDs

`RuntimeNativeCapabilityID` defines the current taxonomy:

| ID | Scope |
| --- | --- |
| `permissions` | Permission prompts and permission state fixtures. |
| `camera` | Camera capture requests and camera fixture references. |
| `photos` | Photo library or photo picker requests. |
| `location` | Location permission and location update requests. |
| `network` | Native networking requests that must route through deterministic fixtures. |
| `clipboard` | Clipboard read/write requests. |
| `keyboardInput` | Keyboard and input method behavior owned by the harness. |
| `files` | File picker and file import/export requests. |
| `shareSheet` | Share sheet presentation requests. |
| `notifications` | Notification authorization, scheduling, and delivery events. |
| `deviceEnvironment` | Device, application, and environment state requests. |
| `sensors` | Motion and sensor data requests. |
| `haptics` | Haptic feedback requests. |
| `unsupported` | Native API requests with no strict-mode capability contract. |

## Manifest Shape

Swift defines the manifest in `packages/runtime-host/Sources/RuntimeHost/NativeCapabilities/RuntimeNativeCapabilityManifest.swift`. TypeScript mirrors it in `packages/automation-sdk/src/types.ts`.

```ts
interface RuntimeNativeCapabilityManifest {
  requiredCapabilities: RuntimeNativeCapabilityRequirement[];
  configuredMocks: RuntimeNativeCapabilityMock[];
  scriptedEvents: RuntimeNativeCapabilityEvent[];
  unsupportedSymbols: RuntimeNativeUnsupportedSymbol[];
  artifactOutputs: RuntimeNativeCapabilityArtifactOutput[];
}
```

The deterministic default manifest is empty for every array. `RuntimeNativeCapabilityManifest.permissionState(for:)` returns `unsupported` when no explicit requirement is present. `Emulator.launch(...)` accepts `nativeCapabilities`, and `RuntimeAutomationSession.nativeCapabilities` exposes a cloned manifest for inspection.

## Manifest Fields

| Field | Swift/TypeScript type | Purpose |
| --- | --- | --- |
| `requiredCapabilities` | `RuntimeNativeCapabilityRequirement` | Lists requested capability IDs, their permission state, and the strict-mode alternative that explains how the source should adapt. |
| `configuredMocks` | `RuntimeNativeCapabilityMock` | Names deterministic mock payloads by capability and identifier. Payload values are string maps so fixtures remain serializable and stable. |
| `scriptedEvents` | `RuntimeNativeCapabilityEvent` | Scripts deterministic capability events at a runtime revision, such as location updates or notification delivery. |
| `unsupportedSymbols` | `RuntimeNativeUnsupportedSymbol` | Records native symbols that the harness cannot support, along with the capability bucket and adaptation guidance. |
| `artifactOutputs` | `RuntimeNativeCapabilityArtifactOutput` | Declares deterministic outputs produced by capability handling, such as fixture references, event logs, diagnostics, or semantic snapshots. |

## Permission States

`RuntimeNativePermissionState` uses explicit fixture states:

- `unsupported`
- `notRequested`
- `prompt`
- `granted`
- `denied`
- `restricted`

These states are manifest data. They must not trigger host permission prompts, read live device state, or depend on local operating-system settings.

## Supported Deterministic Mock Services

The supported mock services are deterministic records derived from `RuntimeNativeCapabilityManifest` and high-level `app.native.*` automation controls. They do not call native frameworks. Launch-time manifests provide fixtures and defaults; automation controls mutate the in-memory session state and append inspectable events/artifacts.

| Capability | Manifest inputs | Deterministic records |
| --- | --- | --- |
| `permissions` | `requiredCapabilities.permissionState`; optional matching `configuredMocks.payload.result` for `prompt` states. | Permission inspection, prompt records, prompt logs, and resolved state metadata. |
| `camera` | Permission requirement plus `configuredMocks.camera` with `fixtureName`; optional `mediaType` and `outputPath`. | Fixture output records, camera capture records, logs, semantic metadata, and artifact records. |
| `photos` | Permission requirement plus `configuredMocks.photos` with `fixtureName`; optional `assetIdentifiers` and `mediaTypes`. | Photo selection records, logs, semantic metadata, and artifact records. |
| `location` | Permission requirement; optional `configuredMocks.location` with initial coordinates; `scriptedEvents.location` with coordinate updates. | Current coordinate, sorted scripted update records, logs, semantic metadata, and artifact records. |
| `clipboard` | `configuredMocks.clipboard` with `text` or `initialText`; `scriptedEvents.clipboard` names containing `read` or `write`. | Initial/current text, read/write records, logs, semantic metadata, and artifact records. |
| `keyboardInput` | `configuredMocks.keyboardInput` with input trait payload keys; optional `scriptedEvents.keyboardInput`. | Focus/input trait state, keyboard event records, logs, semantic metadata, and artifact records. |
| `files` | `configuredMocks.files` with selected file payloads. | File picker selection records, logs, semantic metadata, and artifact records. |
| `shareSheet` | `configuredMocks.shareSheet` with shared item payloads. | Share sheet records, logs, semantic metadata, and artifact records. |
| `notifications` | Permission requirement; `scriptedEvents.notifications` with notification payloads. | Notification authorization, schedule/delivery records, logs, semantic metadata, and artifact records. |

`network` remains covered by the existing deterministic route fixture layer rather than these native mock records. `deviceEnvironment` is currently represented by launch device settings and diagnostics guidance. `sensors`, `haptics`, and `unsupported` remain fail-closed unless a later phase defines their deterministic mock contracts.

## Payload Reference

All `payload` values are strings. List values are comma-separated. Boolean values accept `true`, `false`, `yes`, `no`, `1`, and `0`.

| Capability | Payload keys |
| --- | --- |
| Permission prompt result | `result` on a matching `configuredMocks` entry, using a `RuntimeNativePermissionState` value such as `granted` or `denied`. |
| `camera` mock | `fixtureName` required for a capture record; optional `mediaType`, `outputPath`, and `result` when also resolving a prompt. |
| `photos` mock | `fixtureName` required for a selection record; optional `assetIdentifiers`, `mediaTypes`, and `result`. |
| `location` mock/event | `latitude`, `longitude`, and optional `accuracyMeters`. Events are sorted by `atRevision`. |
| `clipboard` mock/event | `text` or `initialText`; read/write events use names containing `read` or `write` and may include `text`. |
| `keyboardInput` mock | `focusedElementID`, `keyboardType`, `returnKey`, `textContentType`, `autocorrection`, `secureTextEntry`, `isVisible`. |
| `files` mock | `selectedFiles`, `contentTypes`, `allowsMultipleSelection`. |
| `shareSheet` mock | `activityType`, `items`, `completionState`, `excludedActivityTypes`. |
| `notifications` event | `identifier`, `title`, `body`, `trigger`; state is derived from the event name, for example `notification-scheduled` becomes `scheduled`. |

When `camera` or `photos` is granted but no fixture-backed mock is configured, the runtime emits deterministic diagnostics such as `missingFixture` instead of falling back to host behavior. A prompt state without a deterministic `result` similarly produces a diagnostic record.

## Inspection Surfaces

Native mock state is exposed through existing launch, session, log, semantic tree, and artifact surfaces:

- Swift runtime sessions expose `nativeCapabilities`, `nativeCapabilityState`, and `nativeCapabilityEvents`.
- `RuntimeArtifactBundle.nativeCapabilityRecords` includes fixture, event, diagnostic, and semantic snapshot records.
- Runtime logs include deterministic messages such as `native.permission.camera.prompt.granted`, `native.camera.capture.front-camera-still`, `native.location.update.location-update.4`, `native.clipboard.write.clipboard-write.3`, `native.files.selection.document-picker`, and `native.notifications.delivered.trip-reminder`.
- Semantic root metadata mirrors inspectable values such as `native.camera.fixture`, `native.photos.selection.<identifier>`, `native.location.latitude`, `native.clipboard.currentText`, `native.keyboard.focusedElementID`, `native.files.selection.<identifier>`, `native.shareSheet.<identifier>.completionState`, and `native.notification.<identifier>`.
- The TypeScript SDK accepts the same `nativeCapabilities` launch manifest, exposes `session.nativeCapabilityState`, `session.nativeCapabilityEvents`, `artifactBundle.nativeCapabilityRecords`, and provides `app.native.events()` plus `app.nativeCapabilityEvents()` for cloned event inspection.
- `app.native.*` provides high-level deterministic controls for permissions, camera, photos, location, clipboard, files, share sheets, notifications, device snapshots, native event inspection, and native artifact inspection.
- In transport mode, supported `app.native.*` mutations route through the generic `native.automation` command boundary and the same semantic revision gate used by other serialized session commands.

In CI, preserve `artifactBundle.nativeCapabilityRecords`, `session.nativeCapabilityState`, and `app.native.events()` output as JSON artifacts. Those files are the current native mock review surface because screenshots are metadata-only and native services are deterministic records.

Example agent flow:

```ts
await app.native.permissions.request("camera");
await app.native.camera.capture("front-camera-still");
await app.native.photos.select("recent-library-pick");
await app.native.permissions.set("location", "denied");
const location = await app.native.location.current();
await app.native.clipboard.write("Copied by agent");
await app.native.notifications.schedule("profile-reminder");
const nativeEvents = await app.native.events();
const nativeArtifacts = await app.native.artifacts();
```

These APIs are deterministic SDK controls today. Fixture mode mutates the in-memory automation session directly; local transport mode sends supported mutations through the transport session command path. Neither mode connects to host camera, photos, clipboard, files, notifications, sensors, haptics, production WebSocket, hosted sessions, MCP, or other host native services.

## Browser Preview

The browser renderer demo can parse illustrative strict-mode declarations into `tree.nativePreview` and render native preview cards with stable `data-native-capability` values. The supported preview declarations are:

- `PermissionPrompt(.camera, result: .granted)`
- `CameraFixture("front-camera-still", fixtureName: "profile-photo")`
- `PhotoPickerFixture("recent-library-pick", assets: ["profile-photo", "receipt-photo"])`
- `LocationEvent(latitude: 35.0116, longitude: 135.7681, accuracyMeters: 18)`
- `ClipboardFixture(text: "Kyoto weekend notes")`
- `KeyboardFixture(focusedElementID: "traveler-field", keyboardType: .default, returnKey: .done)`
- `FilePickerFixture("document-picker", selectedFiles: ["Fixtures/itinerary.pdf"])`
- `ShareSheetFixture("share-itinerary", activityType: .copy, items: ["Fixtures/itinerary.pdf"])`
- `NotificationFixture("trip-reminder", title: "Trip Reminder", state: .scheduled)`
- `NativePermissionRequest(.camera)`
- `NativePermissionSet(.location, .denied)`
- `NativeCameraCapture("front-camera-still")`
- `NativePhotoSelection("recent-library-pick")`
- `NativeLocationRead(expectPermission: .denied)`
- `NativeClipboardWrite("Copied by agent")`
- `NativeFileSelection("document-picker")`
- `NativeShareCompletion("share-itinerary", state: .completed)`
- `NativeNotificationSchedule("trip-reminder")`
- `NativeNotificationDelivery("trip-reminder")`
- `NativeDeviceEnvironmentSnapshot()`
- `UnsupportedNativeControl(.biometrics)`

This preview is browser-only source lowering. It is useful for deterministic UI inspection, but it is not live Swift execution and it does not claim native framework fidelity.

## Supported Capability Contract

A native mock capability is considered supported only when its implementation defines all of the following:

- The `RuntimeNativeCapabilityID` and the permission states that are meaningful for that capability.
- The accepted `configuredMocks` payload keys or `scriptedEvents` payload keys.
- The deterministic default behavior when no mock or event is configured.
- The unsupported native symbols that should produce `unsupportedSymbols` records.
- The `artifactOutputs` produced for debugging and agent inspection.
- Runtime, diagnostics, automation SDK, renderer preview, and documentation coverage that proves the behavior does not use live host permissions, live device state, or live network access by default.

Until those pieces exist, diagnostics may point source code at a manifest field, but the harness should still treat concrete native framework behavior as unavailable.

## Diagnostics Guidance

Compatibility diagnostics attach `nativeCapabilityGuidance` to recognized native API requests. The guidance includes:

- `capability`
- `requestedAPI`
- `requiresManifestMock`
- `suggestedManifestField`
- `failClosedReason`

Current recognized mappings include:

| Requested API | Capability | Suggested manifest field |
| --- | --- | --- |
| `UIApplication.shared.open` | `deviceEnvironment` | `configuredMocks.deviceEnvironment` |
| `AVCaptureSession.startRunning` | `camera` | `configuredMocks.camera` |
| `CLLocationManager.requestWhenInUseAuthorization` | `location` | `scriptedEvents.location` |
| `PHPickerViewController` | `photos` | `configuredMocks.photos` |
| `URLSession.dataTask` | `network` | `configuredMocks.network` |
| `UIPasteboard.general` | `clipboard` | `configuredMocks.clipboard` |
| `UNUserNotificationCenter.current` | `notifications` | `scriptedEvents.notifications` |
| `UIDocumentPickerViewController` | `files` | `configuredMocks.files` |
| `UIActivityViewController` | `shareSheet` | `configuredMocks.shareSheet` |
| `CMMotionManager.deviceMotion` | `sensors` | `scriptedEvents.sensors` |
| `UIImpactFeedbackGenerator.impactOccurred` | `haptics` | `scriptedEvents.haptics` |
| `UIDevice.current` | `deviceEnvironment` | `configuredMocks.deviceEnvironment` |
| `LAContext.evaluatePolicy` | `unsupported` | `unsupportedSymbols` |

`LAContext.evaluatePolicy` is intentionally fail-closed with `requiresManifestMock` set to `false` because there is no strict-mode capability contract for biometric policy evaluation.

## Mock-Fidelity Boundary

Native capability manifests are fixture contracts. They are intended to make tests and agent workflows deterministic, inspectable, and honest about unsupported behavior.

They do not:

- Access the camera, photo library, contacts, files, clipboard, sensors, haptics, notifications, or device environment on the host machine.
- Ask the host operating system for permissions.
- Emulate UIKit, SwiftUI, iOS lifecycle, native framework timing, simulator behavior, or binary compatibility.
- Perform live network calls by default.
- Create production WebSocket, hosted-session, MCP, or host-native-service behavior.

When source code needs native behavior, prefer strict-mode fixtures: `configuredMocks.*` for stable mock data, `scriptedEvents.*` for deterministic event delivery, and `unsupportedSymbols` for APIs that should remain blocked until a capability contract exists. Unsupported services still fail closed with diagnostics rather than silently degrading into host behavior.
