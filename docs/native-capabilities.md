# Native Capability Registry

The native capability registry is a deterministic contract layer for source that asks for native functionality. It does not provide iOS, UIKit, SwiftUI, CoreLocation, AVFoundation, Photos, notification, file picker, share sheet, sensor, haptic, clipboard, or host-device fidelity.

The registry lets the runtime, diagnostics layer, and automation SDK agree on the same capability names, manifest fields, and fail-closed behavior before any concrete mock services are implemented.

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

## Supported Capability Contract

A capability is not considered supported until its implementation defines all of the following:

- The `RuntimeNativeCapabilityID` and the permission states that are meaningful for that capability.
- The accepted `configuredMocks` payload keys or `scriptedEvents` payload keys.
- The deterministic default behavior when no mock or event is configured.
- The unsupported native symbols that should produce `unsupportedSymbols` records.
- The `artifactOutputs` produced for debugging and agent inspection.
- Runtime, diagnostics, automation SDK, and documentation coverage that proves the behavior does not use live host permissions, live device state, or live network access by default.

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

When source code needs native behavior, prefer strict-mode fixtures: `configuredMocks.*` for stable mock data, `scriptedEvents.*` for deterministic event delivery, and `unsupportedSymbols` for APIs that should remain blocked until a capability contract exists.
