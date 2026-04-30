import { describe, expect, it } from "vitest";

import { Emulator } from "./index";
import type {
  RuntimeDeviceSettings,
  RuntimeNativeCapabilityArtifactOutputKind,
  RuntimeNativeCapabilityID,
  RuntimeNativeCapabilityManifest,
  RuntimeNativeCapabilityRecord,
  RuntimeNativePermissionState,
} from "./types";

type NativeAutomationApp = Awaited<ReturnType<typeof Emulator.launch>> & {
  native: NativeAutomationNamespace;
};

type NativeAutomationSupportedCapability =
  | "camera"
  | "photos"
  | "location"
  | "clipboard"
  | "files"
  | "shareSheet"
  | "notifications"
  | "deviceEnvironment";

type NativePermissionSnapshot = Record<
  string,
  {
    state: RuntimeNativePermissionState;
    resolvedState: RuntimeNativePermissionState;
    prompt?: {
      presented: boolean;
      result?: RuntimeNativePermissionState;
    };
  }
>;

interface NativeAutomationNamespace {
  permissions: {
    snapshot(): Promise<NativePermissionSnapshot>;
    request(capability: NativeAutomationSupportedCapability): Promise<RuntimeNativeCapabilityRecord>;
    set(
      capability: NativeAutomationSupportedCapability,
      state: RuntimeNativePermissionState
    ): Promise<RuntimeNativeCapabilityRecord>;
  };
  camera: {
    capture(fixtureIdentifier: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  photos: {
    select(fixtureIdentifier: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  location: {
    current(): Promise<{
      permissionState: RuntimeNativePermissionState;
      coordinate?: {
        latitude: number;
        longitude: number;
        accuracyMeters: number;
      };
      diagnostic?: {
        capability: RuntimeNativeCapabilityID;
        code: string;
        payload: Record<string, string>;
      };
    }>;
    update(coordinate: {
      latitude: number;
      longitude: number;
      accuracyMeters: number;
    }): Promise<RuntimeNativeCapabilityRecord>;
  };
  clipboard: {
    read(): Promise<{ text?: string; record: RuntimeNativeCapabilityRecord }>;
    write(text: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  files: {
    select(fixtureIdentifier: string): Promise<{
      selectedFiles: string[];
      record: RuntimeNativeCapabilityRecord;
    }>;
  };
  shareSheet: {
    complete(
      identifier: string,
      result: { completionState: string }
    ): Promise<RuntimeNativeCapabilityRecord>;
  };
  notifications: {
    requestAuthorization(): Promise<RuntimeNativeCapabilityRecord>;
    schedule(identifier: string): Promise<RuntimeNativeCapabilityRecord>;
    deliver(identifier: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  device: {
    snapshot(): Promise<RuntimeDeviceSettings>;
  };
  events(): Promise<RuntimeNativeCapabilityRecord[]>;
  artifacts(): Promise<RuntimeNativeCapabilityRecord[]>;
}

describe("Emulator", () => {
  it("runs a representative fixture-backed automation flow", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
    });

    expect(app).toBeDefined();
    await expect(app.logs()).resolves.toEqual([]);

    const saveButton = app.getByText("Save");
    const nameFieldByRole = app.getByRole("textField", { text: "Name" });
    const nameFieldById = app.getByTestId("name-field");

    await expect(saveButton.inspect()).resolves.toMatchObject({
      id: "save-button",
      role: "button",
      label: "Save",
    });
    await expect(nameFieldByRole.inspect()).resolves.toMatchObject({
      id: "name-field",
      role: "textField",
      label: "Name",
      value: "Taylor",
    });

    await expect(saveButton.tap()).resolves.toBeUndefined();
    await expect(nameFieldByRole.fill("Jordan")).resolves.toBeUndefined();

    await expect(nameFieldById.inspect()).resolves.toMatchObject({
      id: "name-field",
      role: "textField",
      value: "Jordan",
    });
    await expect(app.semanticTree()).resolves.toMatchObject({
      appIdentifier: "FixtureApp",
      scene: {
        id: "baseline-screen",
        rootNode: {
          id: "root-stack",
        },
        alertPayload: {
          title: "Done",
          message: "Saved",
        },
      },
    });
    await expect(app.logs()).resolves.toEqual([
      { level: "info", message: "Tapped save-button" },
      { level: "info", message: "Filled name-field with Jordan" },
    ]);
    await expect(app.screenshot("baseline-home")).resolves.toMatchObject({
      name: "baseline-home",
      format: "png",
      byteCount: 0,
      kind: "screenshot",
    });
    await expect(app.close()).resolves.toBeUndefined();
  });

  it("exposes deterministic artifacts, network fixtures, and device launch options", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      device: {
        viewport: { width: 393, height: 852, scale: 3 },
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          frozenAtISO8601: "2026-04-27T14:00:00Z",
          timeZone: "America/New_York",
        },
        geolocation: { latitude: 40.7128, longitude: -74.006, accuracyMeters: 12 },
        network: { isOnline: true, latencyMilliseconds: 25, downloadKbps: 1500 },
      },
    });
    const saveButton = app.getByText("Save");
    const nameField = app.getByRole("textField", { text: "Name" });

    await expect(app.route("https://example.test/profile", {
      id: "profile-success",
      method: "GET",
      status: 200,
      headers: { "content-type": "application/json" },
      body: { name: "Taylor" },
    })).resolves.toBeUndefined();
    await expect(app.request("https://example.test/profile", {
      method: "GET",
      headers: { accept: "application/json" },
    })).resolves.toMatchObject({
      id: "request-1",
      request: {
        method: "GET",
        url: "https://example.test/profile",
      },
      response: {
        status: 200,
        bodyByteCount: 17,
      },
      source: { fixtureId: "profile-success" },
    });

    await expect(saveButton.tap()).resolves.toBeUndefined();
    await expect(nameField.fill("Morgan")).resolves.toBeUndefined();
    await expect(app.semanticTree()).resolves.toMatchObject({
      scene: {
        alertPayload: {
          title: "Done",
          message: "Saved",
        },
      },
    });
    await expect(app.getByTestId("name-field").inspect()).resolves.toMatchObject({
      id: "name-field",
      value: "Morgan",
    });
    await expect(app.logs()).resolves.toEqual([
      { level: "info", message: "Tapped save-button" },
      { level: "info", message: "Filled name-field with Morgan" },
    ]);
    await expect(app.screenshot("post-submit")).resolves.toMatchObject({
      name: "post-submit",
      kind: "screenshot",
      format: "png",
      byteCount: 0,
      viewport: { width: 393, height: 852, scale: 3 },
    });

    const artifacts = await app.artifacts();
    expect(artifacts).toMatchObject({
      sessionID: "session-1",
      renderArtifacts: [
        {
          name: "baseline-home",
          kind: "screenshot",
          viewport: { width: 393, height: 852, scale: 3 },
        },
        {
          name: "post-submit",
          kind: "screenshot",
          viewport: { width: 393, height: 852, scale: 3 },
        },
      ],
      semanticSnapshots: [
        {
          name: "baseline-tree",
          revision: 1,
        },
        {
          name: "baseline-tree",
          revision: 3,
        },
      ],
      logs: [
        { level: "info", message: "Tapped save-button" },
        { level: "info", message: "Filled name-field with Morgan" },
      ],
      networkRecords: [
        {
          id: "request-1",
          source: { fixtureId: "profile-success" },
        },
      ],
    });
    expect(artifacts.renderArtifacts).toHaveLength(2);
    expect(artifacts.semanticSnapshots).toHaveLength(2);
    expect(artifacts.logs).toHaveLength(2);
    expect(artifacts.networkRecords).toHaveLength(1);
    await expect(app.session()).resolves.toMatchObject({
      snapshot: {
        revision: 3,
        device: {
          viewport: { width: 393, height: 852, scale: 3 },
          colorScheme: "dark",
          locale: "en_US",
        },
      },
      device: {
        viewport: { width: 393, height: 852, scale: 3 },
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          frozenAtISO8601: "2026-04-27T14:00:00Z",
          timeZone: "America/New_York",
        },
        geolocation: { latitude: 40.7128, longitude: -74.006, accuracyMeters: 12 },
        network: {
          latencyMilliseconds: 25,
        },
      },
    });
  });

  it("carries native capability manifests through launch and session inspection", async () => {
    const nativeCapabilities: RuntimeNativeCapabilityManifest = {
      requiredCapabilities: [
        {
          id: "camera",
          permissionState: "denied",
          strictModeAlternative:
            "Configure a deterministic camera mock instead of requesting host camera access.",
        },
        {
          id: "location",
          permissionState: "granted",
          strictModeAlternative: "Use launch-time device geolocation or scripted location events.",
        },
      ],
      configuredMocks: [
        {
          capability: "camera",
          identifier: "front-camera-still",
          payload: {
            mediaType: "image",
            fixtureName: "profile-photo",
          },
        },
        {
          capability: "clipboard",
          identifier: "pasteboard-text",
          payload: {
            text: "Fixture clipboard",
          },
        },
      ],
      scriptedEvents: [
        {
          capability: "location",
          name: "location-update",
          atRevision: 2,
          payload: {
            latitude: "40.7128",
            longitude: "-74.0060",
          },
        },
      ],
      unsupportedSymbols: [
        {
          symbolName: "AVCaptureSession.startRunning",
          capability: "camera",
          suggestedAdaptation:
            "Replace live capture with a camera fixture in the native capability manifest.",
        },
      ],
      artifactOutputs: [
        {
          capability: "camera",
          name: "captured-profile-photo",
          kind: "fixtureReference",
        },
      ],
    };

    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities,
    });

    nativeCapabilities.requiredCapabilities[0].permissionState = "granted";
    nativeCapabilities.configuredMocks[0].payload.fixtureName = "mutated-photo";

    const session = await app.session();

    expect(session.nativeCapabilities).toMatchObject({
      requiredCapabilities: [
        {
          id: "camera",
          permissionState: "denied",
        },
        {
          id: "location",
          permissionState: "granted",
        },
      ],
      configuredMocks: [
        {
          capability: "camera",
          identifier: "front-camera-still",
          payload: {
            fixtureName: "profile-photo",
          },
        },
        {
          capability: "clipboard",
          identifier: "pasteboard-text",
          payload: {
            text: "Fixture clipboard",
          },
        },
      ],
      scriptedEvents: [
        {
          capability: "location",
          name: "location-update",
          atRevision: 2,
          payload: {
            latitude: "40.7128",
          },
        },
      ],
      unsupportedSymbols: [
        {
          symbolName: "AVCaptureSession.startRunning",
          capability: "camera",
        },
      ],
      artifactOutputs: [
        {
          capability: "camera",
          name: "captured-profile-photo",
          kind: "fixtureReference",
        },
      ],
    });

    session.nativeCapabilities.configuredMocks[0].payload.fixtureName = "inspector-mutation";
    const inspectedAgain = await app.session();

    expect(inspectedAgain.nativeCapabilities.configuredMocks[0].payload.fixtureName).toBe(
      "profile-photo"
    );
  });

  it("defaults native capability manifests to deterministic empty unsupported shapes", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
    });

    await expect(app.session()).resolves.toMatchObject({
      nativeCapabilities: {
        requiredCapabilities: [],
        configuredMocks: [],
        scriptedEvents: [],
        unsupportedSymbols: [],
        artifactOutputs: [],
      },
    });
  });

  it("preserves native capability taxonomy literals through launch and inspection", async () => {
    const capabilityIDs: RuntimeNativeCapabilityID[] = [
      "permissions",
      "camera",
      "photos",
      "location",
      "network",
      "clipboard",
      "keyboardInput",
      "files",
      "shareSheet",
      "notifications",
      "deviceEnvironment",
      "sensors",
      "haptics",
      "unsupported",
    ];
    const permissionStates: RuntimeNativePermissionState[] = [
      "unsupported",
      "notRequested",
      "prompt",
      "granted",
      "denied",
      "restricted",
    ];
    const artifactKinds: RuntimeNativeCapabilityArtifactOutputKind[] = [
      "fixtureReference",
      "eventLog",
      "diagnostic",
      "semanticSnapshot",
    ];
    const nativeCapabilities: RuntimeNativeCapabilityManifest = {
      requiredCapabilities: capabilityIDs.map((id, index) => ({
        id,
        permissionState: permissionStates[index % permissionStates.length],
        strictModeAlternative: `Use deterministic ${id} fixtures.`,
      })),
      configuredMocks: capabilityIDs.map((capability) => ({
        capability,
        identifier: `${capability}-mock`,
        payload: {
          capability,
        },
      })),
      scriptedEvents: capabilityIDs.map((capability, index) => ({
        capability,
        name: `${capability}-event`,
        atRevision: index + 1,
        payload: {
          revision: String(index + 1),
        },
      })),
      unsupportedSymbols: [
        {
          symbolName: "KeyboardObserver.start",
          capability: "keyboardInput",
          suggestedAdaptation: "Replace keyboard observers with strict-mode input fixtures.",
        },
        {
          symbolName: "BiometricPolicy.evaluate",
          capability: "unsupported",
          suggestedAdaptation: "Fail closed until a strict-mode capability contract exists.",
        },
      ],
      artifactOutputs: artifactKinds.map((kind, index) => ({
        capability: capabilityIDs[index],
        name: `${kind}-output`,
        kind,
      })),
    };

    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities,
    });
    const session = await app.session();

    expect(session.nativeCapabilities.requiredCapabilities.map((requirement) => requirement.id)).toEqual(
      capabilityIDs
    );
    expect(
      session.nativeCapabilities.requiredCapabilities.map((requirement) => requirement.permissionState)
    ).toEqual([
      "unsupported",
      "notRequested",
      "prompt",
      "granted",
      "denied",
      "restricted",
      "unsupported",
      "notRequested",
      "prompt",
      "granted",
      "denied",
      "restricted",
      "unsupported",
      "notRequested",
    ]);
    expect(session.nativeCapabilities.configuredMocks.map((mock) => mock.capability)).toEqual(
      capabilityIDs
    );
    expect(session.nativeCapabilities.scriptedEvents.map((event) => event.capability)).toEqual(
      capabilityIDs
    );
    expect(session.nativeCapabilities.scriptedEvents.at(-1)).toMatchObject({
      capability: "unsupported",
      name: "unsupported-event",
      atRevision: 14,
      payload: {
        revision: "14",
      },
    });
    expect(session.nativeCapabilities.unsupportedSymbols).toEqual([
      {
        symbolName: "KeyboardObserver.start",
        capability: "keyboardInput",
        suggestedAdaptation: "Replace keyboard observers with strict-mode input fixtures.",
      },
      {
        symbolName: "BiometricPolicy.evaluate",
        capability: "unsupported",
        suggestedAdaptation: "Fail closed until a strict-mode capability contract exists.",
      },
    ]);
    expect(session.nativeCapabilities.artifactOutputs.map((output) => output.kind)).toEqual(
      artifactKinds
    );
  });

  it("exposes deterministic native mock state through session and artifact inspection", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities: {
        requiredCapabilities: [
          {
            id: "camera",
            permissionState: "prompt",
            strictModeAlternative:
              "Use a fixture-backed camera capture instead of host camera access.",
          },
          {
            id: "photos",
            permissionState: "granted",
            strictModeAlternative: "Use configured photo library fixtures.",
          },
          {
            id: "location",
            permissionState: "granted",
            strictModeAlternative: "Use scripted location updates.",
          },
          {
            id: "notifications",
            permissionState: "prompt",
            strictModeAlternative:
              "Record deterministic notification authorization and delivery events.",
          },
        ],
        configuredMocks: [
          {
            capability: "camera",
            identifier: "front-camera-still",
            payload: {
              fixtureName: "profile-photo",
              mediaType: "image",
              result: "granted",
            },
          },
          {
            capability: "photos",
            identifier: "recent-library-pick",
            payload: {
              fixtureName: "gallery-selection",
              assetIdentifiers: "profile-photo,receipt-photo",
            },
          },
          {
            capability: "clipboard",
            identifier: "pasteboard-text",
            payload: {
              text: "Fixture clipboard",
            },
          },
          {
            capability: "keyboardInput",
            identifier: "name-entry",
            payload: {
              focusedElementID: "name-field",
              keyboardType: "default",
              returnKey: "done",
            },
          },
          {
            capability: "files",
            identifier: "document-picker",
            payload: {
              selectedFiles: "Fixtures/profile.pdf",
            },
          },
          {
            capability: "shareSheet",
            identifier: "share-receipt",
            payload: {
              activityType: "copy",
              items: "Fixtures/profile.pdf",
            },
          },
        ],
        scriptedEvents: [
          {
            capability: "location",
            name: "location-update",
            atRevision: 2,
            payload: {
              latitude: "40.7128",
              longitude: "-74.0060",
              accuracyMeters: "12",
            },
          },
          {
            capability: "notifications",
            name: "notification-scheduled",
            atRevision: 3,
            payload: {
              identifier: "trip-reminder",
              title: "Trip Reminder",
            },
          },
        ],
        unsupportedSymbols: [
          {
            symbolName: "LAContext.evaluatePolicy",
            capability: "unsupported",
            suggestedAdaptation: "Fail closed until a strict-mode capability contract exists.",
          },
        ],
        artifactOutputs: [
          {
            capability: "camera",
            name: "captured-profile-photo",
            kind: "fixtureReference",
          },
          {
            capability: "location",
            name: "native-location-events",
            kind: "eventLog",
          },
          {
            capability: "notifications",
            name: "notification-records",
            kind: "eventLog",
          },
        ],
      },
    });

    const session = await app.session();

    expect(session.nativeCapabilityState).toMatchObject({
      permissions: {
        camera: {
          state: "prompt",
          prompt: {
            presented: true,
            result: "granted",
          },
        },
        notifications: {
          state: "prompt",
          prompt: {
            presented: true,
          },
        },
      },
      fixtureOutputs: [
        {
          capability: "camera",
          identifier: "front-camera-still",
          fixtureName: "profile-photo",
        },
        {
          capability: "photos",
          identifier: "recent-library-pick",
          fixtureName: "gallery-selection",
        },
      ],
      locationEvents: [
        {
          latitude: 40.7128,
          longitude: -74.006,
          accuracyMeters: 12,
          revision: 2,
        },
      ],
      clipboard: {
        text: "Fixture clipboard",
      },
      keyboard: {
        focusedElementID: "name-field",
        keyboardType: "default",
        returnKey: "done",
      },
      filePickerRecords: [
        {
          identifier: "document-picker",
          selectedFiles: ["Fixtures/profile.pdf"],
        },
      ],
      shareSheetRecords: [
        {
          identifier: "share-receipt",
          activityType: "copy",
          items: ["Fixtures/profile.pdf"],
        },
      ],
      notificationRecords: [
        {
          identifier: "trip-reminder",
          title: "Trip Reminder",
          state: "scheduled",
        },
      ],
    });
    expect(session.artifactBundle.nativeCapabilityRecords).toMatchObject([
      {
        capability: "camera",
        name: "native.fixture.camera.front-camera-still",
        revision: 1,
      },
      {
        capability: "location",
        name: "native.event.location.location-update",
        revision: 2,
      },
      {
        capability: "notifications",
        name: "native.event.notifications.notification-scheduled",
        revision: 3,
      },
    ]);

    session.nativeCapabilityState.fixtureOutputs[0].payload.fixtureName = "inspector-mutation";
    session.artifactBundle.nativeCapabilityRecords[0].payload.fixtureName = "inspector-mutation";

    const inspectedAgain = await app.session();
    expect(inspectedAgain.nativeCapabilityState.fixtureOutputs[0].payload.fixtureName).toBe(
      "profile-photo"
    );
    expect(inspectedAgain.artifactBundle.nativeCapabilityRecords[0].payload.fixtureName).toBe(
      "profile-photo"
    );
  });

  it("exposes native capability event inspection as a stable lower-level surface", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities: {
        requiredCapabilities: [
          {
            id: "camera",
            permissionState: "prompt",
            strictModeAlternative:
              "Use a fixture-backed camera capture instead of host camera access.",
          },
        ],
        configuredMocks: [
          {
            capability: "camera",
            identifier: "front-camera-still",
            payload: {
              fixtureName: "profile-photo",
              result: "granted",
            },
          },
        ],
        scriptedEvents: [],
        unsupportedSymbols: [],
        artifactOutputs: [],
      },
    });

    expect(app.nativeCapabilityEvents).toBeTypeOf("function");
    await expect(app.nativeCapabilityEvents()).resolves.toMatchObject([
      {
        capability: "camera",
        name: "native.permission.camera.prompt",
        revision: 1,
        payload: {
          state: "prompt",
          result: "granted",
        },
      },
      {
        capability: "camera",
        name: "native.fixture.camera.front-camera-still",
        revision: 1,
        payload: {
          fixtureName: "profile-photo",
        },
      },
    ]);
    const inspectedEvents = await app.nativeCapabilityEvents();
    inspectedEvents[0].payload.result = "denied";
    const inspectedEventsAgain = await app.nativeCapabilityEvents();
    expect(inspectedEventsAgain[0]).toMatchObject({
      capability: "camera",
      name: "native.permission.camera.prompt",
      payload: {
        result: "granted",
      },
    });
  });

  it("drives native mocks through the future app.native namespace for agent flows", async () => {
    const nativeCapabilities = representativeNativeMockManifest();
    const app = (await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      device: {
        viewport: { width: 393, height: 852, scale: 3 },
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          frozenAtISO8601: "2026-04-28T12:00:00Z",
          timeZone: "America/New_York",
        },
        geolocation: { latitude: 40.7134, longitude: -74.0059, accuracyMeters: 18 },
        network: { isOnline: true, latencyMilliseconds: 20, downloadKbps: 2_500 },
      },
      nativeCapabilities,
    })) as NativeAutomationApp;

    await app.getByText("Save").tap();
    await app.getByRole("textField", { text: "Name" }).fill("Riley");

    await expect(app.native.permissions.snapshot()).resolves.toMatchObject({
      camera: {
        state: "prompt",
        resolvedState: "granted",
      },
      location: {
        state: "granted",
        resolvedState: "granted",
      },
      notifications: {
        state: "prompt",
        resolvedState: "granted",
      },
    });
    await expect(app.native.permissions.request("camera")).resolves.toMatchObject({
      capability: "camera",
      name: "native.permission.camera.request",
      payload: {
        initialState: "prompt",
        state: "granted",
        resolvedState: "granted",
      },
    });
    await expect(app.native.permissions.snapshot()).resolves.toMatchObject({
      camera: {
        state: "granted",
        resolvedState: "granted",
        prompt: {
          presented: false,
        },
      },
    });
    await expect(app.native.permissions.set("location", "denied")).resolves.toMatchObject({
      capability: "location",
      name: "native.permission.location.set",
      payload: {
        state: "denied",
      },
    });
    await expect(app.native.camera.capture("front-camera-still")).resolves.toMatchObject({
      capability: "camera",
      name: "native.camera.capture.front-camera-still",
      payload: {
        fixtureName: "profile-photo",
        permissionState: "granted",
      },
    });
    await expect(app.native.photos.select("recent-library-pick")).resolves.toMatchObject({
      capability: "photos",
      name: "native.photos.selection.recent-library-pick",
      payload: {
        assetIdentifiers: "profile-photo,receipt-photo",
        permissionState: "granted",
      },
    });
    await expect(app.native.location.current()).resolves.toMatchObject({
      permissionState: "denied",
      diagnostic: {
        code: "permissionDenied",
        payload: {
          permissionState: "denied",
        },
      },
    });
    await expect(
      app.native.location.update({
        latitude: 40.714,
        longitude: -74.0063,
        accuracyMeters: 9,
      })
    ).resolves.toMatchObject({
      capability: "location",
      name: "native.location.update.automation",
      payload: {
        latitude: "40.714",
      },
    });
    await expect(app.native.clipboard.read()).resolves.toMatchObject({
      text: "Updated profile notes",
      record: {
        capability: "clipboard",
        name: "native.clipboard.read.automation",
      },
    });
    await expect(app.native.clipboard.write("Copied by agent")).resolves.toMatchObject({
      capability: "clipboard",
      name: "native.clipboard.write.automation",
      payload: {
        text: "Copied by agent",
      },
    });
    await expect(app.native.files.select("document-picker")).resolves.toMatchObject({
      selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"],
      record: {
        capability: "files",
        name: "native.files.selection.document-picker",
      },
    });
    await expect(
      app.native.shareSheet.complete("share-receipt", { completionState: "completed" })
    ).resolves.toMatchObject({
      capability: "shareSheet",
      name: "native.shareSheet.complete.share-receipt",
      payload: {
        completionState: "completed",
      },
    });
    await expect(app.native.notifications.requestAuthorization()).resolves.toMatchObject({
      capability: "notifications",
      name: "native.notifications.authorization.request",
      payload: {
        resolvedState: "granted",
      },
    });
    await expect(app.native.notifications.schedule("profile-reminder")).resolves.toMatchObject({
      capability: "notifications",
      name: "native.notifications.schedule.profile-reminder",
    });
    await expect(app.native.notifications.deliver("profile-reminder")).resolves.toMatchObject({
      capability: "notifications",
      name: "native.notifications.deliver.profile-reminder",
    });
    await expect(app.native.device.snapshot()).resolves.toMatchObject({
      colorScheme: "dark",
      locale: "en_US",
      geolocation: {
        latitude: 40.7134,
      },
    });

    const unsupportedControls = app.native as unknown as Record<string, unknown>;
    expect(unsupportedControls.biometrics).toBeUndefined();
    expect(unsupportedControls.health).toBeUndefined();
    expect(unsupportedControls.speech).toBeUndefined();
    expect(unsupportedControls.sensors).toBeUndefined();
    expect(unsupportedControls.haptics).toBeUndefined();

    const permissionSnapshot = await app.native.permissions.snapshot();
    const nativeEvents = await app.native.events();
    const nativeArtifacts = await app.native.artifacts();
    permissionSnapshot.camera.resolvedState = "denied";
    nativeEvents[0].payload.result = "denied";
    nativeArtifacts[0].payload.fixtureName = "mutated-photo";

    await expect(app.native.permissions.snapshot()).resolves.toMatchObject({
      camera: {
        resolvedState: "granted",
      },
    });
    expect((await app.native.events())[0].payload.result).toBe("granted");
    expect((await app.native.artifacts())[0].payload.fixtureName).toBe("profile-photo");
    expect((await app.native.events()).map((event) => event.name)).toEqual([
      "native.permission.camera.prompt",
      "native.permission.notifications.prompt",
      "native.fixture.camera.front-camera-still",
      "native.fixture.photos.recent-library-pick",
      "native.event.location.location-update",
      "native.event.clipboard.clipboard-read",
      "native.event.clipboard.clipboard-write",
      "native.event.notifications.notification-scheduled",
      "native.event.notifications.notification-delivered",
      "native.permission.camera.request",
      "native.permission.location.set",
      "native.camera.capture.front-camera-still",
      "native.photos.selection.recent-library-pick",
      "native.diagnostic.location.permissionDenied",
      "native.location.update.automation",
      "native.clipboard.read.automation",
      "native.clipboard.write.automation",
      "native.files.selection.document-picker",
      "native.shareSheet.complete.share-receipt",
      "native.notifications.authorization.request",
      "native.notifications.schedule.profile-reminder",
      "native.notifications.deliver.profile-reminder",
      "native.deviceEnvironment.snapshot",
    ]);
    expect((await app.artifacts()).nativeCapabilityRecords.map((record) => record.name)).toEqual(
      expect.arrayContaining([
        "native.camera.capture.front-camera-still",
        "native.clipboard.write.automation",
        "native.notifications.schedule.profile-reminder",
        "native.deviceEnvironment.snapshot",
      ])
    );
  });

  it("hardens native permission defaults fixture failures and location state isolation", async () => {
    const defaultApp = (await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
    })) as NativeAutomationApp;

    await expect(defaultApp.native.permissions.snapshot()).resolves.toEqual({});
    await expect(defaultApp.native.permissions.request("camera")).resolves.toMatchObject({
      capability: "camera",
      name: "native.permission.camera.request",
      payload: {
        initialState: "notRequested",
        state: "notRequested",
        resolvedState: "notRequested",
      },
    });
    await expect(defaultApp.native.permissions.snapshot()).resolves.toMatchObject({
      camera: {
        state: "notRequested",
        resolvedState: "notRequested",
        prompt: {
          presented: false,
        },
      },
    });

    const app = (await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities: representativeNativeMockManifest(),
    })) as NativeAutomationApp;

    await expect(app.native.permissions.request("camera")).resolves.toMatchObject({
      payload: {
        initialState: "prompt",
        state: "granted",
        result: "granted",
        resolvedState: "granted",
      },
    });
    await expect(app.native.camera.capture("front-camera-still")).resolves.toMatchObject({
      payload: {
        identifier: "front-camera-still",
        fixtureName: "profile-photo",
        permissionState: "granted",
        outputPath: "Fixtures/profile-photo.heic",
      },
    });
    await expect(app.native.photos.select("recent-library-pick")).resolves.toMatchObject({
      payload: {
        identifier: "recent-library-pick",
        fixtureName: "recent-library",
        permissionState: "granted",
        assetIdentifiers: "profile-photo,receipt-photo",
      },
    });

    await expect(app.native.camera.capture("missing-camera")).rejects.toThrow(
      "no camera fixture named missing-camera"
    );
    await expect(app.native.photos.select("missing-library")).rejects.toThrow(
      "no photos fixture named missing-library"
    );
    await expect(app.native.permissions.set("location", "denied")).resolves.toMatchObject({
      payload: {
        state: "denied",
        resolvedState: "denied",
      },
    });

    const deniedLocation = await app.native.location.current();
    expect(deniedLocation).toMatchObject({
      permissionState: "denied",
      diagnostic: {
        capability: "location",
        code: "permissionDenied",
        payload: {
          permissionState: "denied",
        },
      },
    });
    deniedLocation.diagnostic!.payload.permissionState = "granted";

    const deniedSession = await app.session();
    expect(deniedSession.nativeCapabilityState.diagnosticRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: "camera",
          code: "missingFixture",
          payload: expect.objectContaining({ identifier: "missing-camera" }),
        }),
        expect.objectContaining({
          capability: "photos",
          code: "missingFixture",
          payload: expect.objectContaining({ identifier: "missing-library" }),
        }),
        expect.objectContaining({
          capability: "location",
          code: "permissionDenied",
          payload: expect.objectContaining({ permissionState: "denied" }),
        }),
      ])
    );
    expect((await app.native.events()).map((event) => event.name)).toEqual(
      expect.arrayContaining([
        "native.diagnostic.camera.missingFixture",
        "native.diagnostic.photos.missingFixture",
        "native.diagnostic.location.permissionDenied",
      ])
    );

    await expect(app.native.permissions.set("location", "granted")).resolves.toMatchObject({
      payload: {
        state: "granted",
        resolvedState: "granted",
      },
    });
    await expect(
      app.native.location.update({
        latitude: 51.501,
        longitude: -0.141,
        accuracyMeters: 7,
      })
    ).resolves.toMatchObject({
      name: "native.location.update.automation",
      payload: {
        latitude: "51.501",
        longitude: "-0.141",
        accuracyMeters: "7",
      },
    });

    const grantedLocation = await app.native.location.current();
    expect(grantedLocation).toMatchObject({
      permissionState: "granted",
      coordinate: {
        latitude: 51.501,
        longitude: -0.141,
        accuracyMeters: 7,
      },
    });
    grantedLocation.coordinate!.latitude = 0;
    await expect(app.native.location.current()).resolves.toMatchObject({
      coordinate: {
        latitude: 51.501,
      },
    });
    expect((await app.session()).nativeCapabilityState.diagnosticRecords.at(-1)).toMatchObject({
      capability: "location",
      code: "permissionDenied",
      payload: {
        permissionState: "denied",
      },
    });
  });

  it("hardens clipboard files share sheet notifications and device controls", async () => {
    const app = (await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      device: {
        viewport: { width: 393, height: 852, scale: 3 },
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          frozenAtISO8601: "2026-04-28T12:00:00Z",
          timeZone: "America/New_York",
        },
        geolocation: { latitude: 40.7134, longitude: -74.0059, accuracyMeters: 18 },
        network: { isOnline: true, latencyMilliseconds: 20, downloadKbps: 2_500 },
      },
      nativeCapabilities: representativeNativeMockManifest(),
    })) as NativeAutomationApp;

    const initialRead = await app.native.clipboard.read();
    expect(initialRead).toMatchObject({
      text: "Updated profile notes",
      record: {
        capability: "clipboard",
        name: "native.clipboard.read.automation",
        payload: {
          identifier: "clipboard",
          text: "Updated profile notes",
        },
      },
    });
    initialRead.record.payload.text = "mutated clipboard";

    await expect(app.native.clipboard.write("Agent copied receipt")).resolves.toMatchObject({
      capability: "clipboard",
      name: "native.clipboard.write.automation",
      payload: {
        identifier: "clipboard",
        text: "Agent copied receipt",
      },
    });
    await expect(app.native.clipboard.read()).resolves.toMatchObject({
      text: "Agent copied receipt",
    });

    const fileSelection = await app.native.files.select("document-picker");
    expect(fileSelection).toMatchObject({
      selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"],
      record: {
        capability: "files",
        name: "native.files.selection.document-picker",
        payload: {
          selectedFiles: "Fixtures/profile.pdf,Fixtures/receipt.pdf",
          contentTypes: "com.adobe.pdf,public.image",
          allowsMultipleSelection: "true",
        },
      },
    });
    fileSelection.selectedFiles[0] = "mutated.pdf";

    await expect(app.native.files.select("missing-document")).rejects.toThrow(
      "no file picker fixture named missing-document"
    );
    await expect(
      app.native.shareSheet.complete("missing-share", { completionState: "completed" })
    ).rejects.toThrow("no share sheet fixture named missing-share");

    await expect(
      app.native.shareSheet.complete("share-receipt", { completionState: "cancelled" })
    ).resolves.toMatchObject({
      capability: "shareSheet",
      name: "native.shareSheet.complete.share-receipt",
      payload: {
        identifier: "share-receipt",
        completionState: "cancelled",
      },
    });

    await expect(app.native.notifications.requestAuthorization()).resolves.toMatchObject({
      capability: "notifications",
      name: "native.notifications.authorization.request",
      payload: {
        initialState: "prompt",
        state: "granted",
        result: "granted",
        resolvedState: "granted",
      },
    });
    await expect(app.native.permissions.snapshot()).resolves.toMatchObject({
      notifications: {
        state: "granted",
        resolvedState: "granted",
        prompt: {
          presented: false,
        },
      },
    });
    await expect(app.native.notifications.schedule("profile-reminder")).resolves.toMatchObject({
      capability: "notifications",
      name: "native.notifications.schedule.profile-reminder",
      payload: {
        state: "scheduled",
        authorizationState: "granted",
      },
    });
    await expect(app.native.notifications.deliver("profile-reminder")).resolves.toMatchObject({
      capability: "notifications",
      name: "native.notifications.deliver.profile-reminder",
      payload: {
        state: "delivered",
        authorizationState: "granted",
      },
    });

    const deviceSnapshot = await app.native.device.snapshot();
    expect(deviceSnapshot).toMatchObject({
      viewport: { width: 393, height: 852, scale: 3 },
      colorScheme: "dark",
      locale: "en_US",
      clock: {
        frozenAtISO8601: "2026-04-28T12:00:00Z",
        timeZone: "America/New_York",
      },
      network: {
        isOnline: true,
        latencyMilliseconds: 20,
        downloadKbps: 2_500,
      },
    });
    deviceSnapshot.viewport.width = 0;

    const inspected = await app.session();
    expect(inspected.nativeCapabilityState).toMatchObject({
      clipboard: {
        currentText: "Agent copied receipt",
        readRecords: expect.arrayContaining([
          expect.objectContaining({
            name: "automation-read",
            text: "Updated profile notes",
          }),
          expect.objectContaining({
            name: "automation-read",
            text: "Agent copied receipt",
          }),
        ]),
        writeRecords: expect.arrayContaining([
          expect.objectContaining({
            name: "automation-write",
            text: "Agent copied receipt",
          }),
        ]),
      },
      filePickerRecords: [
        {
          identifier: "document-picker",
          selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"],
          contentTypes: ["com.adobe.pdf", "public.image"],
          allowsMultipleSelection: true,
          payload: expect.any(Object),
        },
      ],
      shareSheetRecords: [
        {
          identifier: "share-receipt",
          completionState: "cancelled",
          items: ["Fixtures/profile.pdf", "Summary"],
          excludedActivityTypes: ["com.apple.UIKit.activity.PostToTwitter"],
          payload: expect.any(Object),
        },
      ],
      notificationRecords: expect.arrayContaining([
        expect.objectContaining({
          identifier: "profile-reminder",
          state: "scheduled",
          authorizationState: "granted",
        }),
        expect.objectContaining({
          identifier: "profile-reminder",
          state: "delivered",
          authorizationState: "granted",
        }),
      ]),
      diagnosticRecords: expect.arrayContaining([
        expect.objectContaining({
          capability: "files",
          code: "missingFixture",
          payload: expect.objectContaining({ identifier: "missing-document" }),
        }),
        expect.objectContaining({
          capability: "shareSheet",
          code: "missingFixture",
          payload: expect.objectContaining({ identifier: "missing-share" }),
        }),
      ]),
    });
    inspected.nativeCapabilityState.clipboard!.currentText = "mutated clipboard";
    inspected.nativeCapabilityState.shareSheetRecords[0].completionState = "mutated";

    await expect(app.session()).resolves.toMatchObject({
      device: {
        viewport: { width: 393 },
      },
      nativeCapabilityState: {
        clipboard: {
          currentText: "Agent copied receipt",
        },
        shareSheetRecords: [
          {
            completionState: "cancelled",
          },
        ],
      },
    });
    expect((await app.native.events()).map((event) => event.name)).toEqual(
      expect.arrayContaining([
        "native.clipboard.read.automation",
        "native.clipboard.write.automation",
        "native.files.selection.document-picker",
        "native.diagnostic.files.missingFixture",
        "native.diagnostic.shareSheet.missingFixture",
        "native.shareSheet.complete.share-receipt",
        "native.notifications.authorization.request",
        "native.notifications.schedule.profile-reminder",
        "native.notifications.deliver.profile-reminder",
        "native.deviceEnvironment.snapshot",
      ])
    );
    expect((await app.native.artifacts()).map((record) => record.name)).toEqual(
      expect.arrayContaining([
        "native.diagnostic.files.missingFixture",
        "native.diagnostic.shareSheet.missingFixture",
        "native.deviceEnvironment.snapshot",
      ])
    );
    await expect(app.native.device.snapshot()).resolves.toMatchObject({
      viewport: { width: 393 },
    });

    const unsupportedControls = app.native as unknown as Record<string, unknown>;
    expect(unsupportedControls.biometrics).toBeUndefined();
    expect(unsupportedControls.health).toBeUndefined();
    expect(unsupportedControls.speech).toBeUndefined();
    expect(unsupportedControls.sensors).toBeUndefined();
    expect(unsupportedControls.haptics).toBeUndefined();
  });

  it("covers representative Phase 9 native mock flows through SDK inspection", async () => {
    const nativeCapabilities = representativeNativeMockManifest();
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities,
    });

    nativeCapabilities.requiredCapabilities[0].permissionState = "denied";
    nativeCapabilities.configuredMocks[0].payload.fixtureName = "mutated-photo";
    nativeCapabilities.scriptedEvents[2].payload.text = "Mutated clipboard";

    const session = await app.session();
    const artifacts = await app.artifacts();
    const nativeEvents = await app.nativeCapabilityEvents();

    expect(session.nativeCapabilityState).toMatchObject({
      permissions: {
        camera: {
          state: "prompt",
          resolvedState: "granted",
          prompt: {
            presented: true,
            result: "granted",
          },
        },
        notifications: {
          state: "prompt",
          resolvedState: "granted",
          prompt: {
            presented: true,
            result: "granted",
          },
        },
      },
      fixtureOutputs: [
        {
          capability: "camera",
          identifier: "front-camera-still",
          fixtureName: "profile-photo",
        },
        {
          capability: "photos",
          identifier: "recent-library-pick",
          fixtureName: "recent-library",
        },
      ],
      locationEvents: [
        {
          name: "location-update",
          latitude: 40.7134,
          longitude: -74.0059,
          accuracyMeters: 18,
          revision: 2,
        },
      ],
      clipboard: {
        identifier: "clipboard",
        initialText: "Draft profile notes",
        currentText: "Updated profile notes",
        readRecords: [
          {
            name: "clipboard-read",
            text: "Draft profile notes",
            revision: 2,
          },
        ],
        writeRecords: [
          {
            name: "clipboard-write",
            text: "Updated profile notes",
            revision: 3,
          },
        ],
      },
      keyboard: {
        identifier: "name-entry",
        focusedElementID: "name-field",
        keyboardType: "default",
        returnKey: "done",
        textContentType: "name",
        isVisible: true,
      },
      filePickerRecords: [
        {
          identifier: "document-picker",
          selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"],
          contentTypes: ["com.adobe.pdf", "public.image"],
          allowsMultipleSelection: true,
        },
      ],
      shareSheetRecords: [
        {
          identifier: "share-receipt",
          activityType: "com.apple.UIKit.activity.Mail",
          items: ["Fixtures/profile.pdf", "Summary"],
          completionState: "completed",
        },
      ],
      notificationRecords: [
        {
          identifier: "profile-reminder",
          title: "Profile Reminder",
          state: "scheduled",
          authorizationState: "granted",
          revision: 4,
        },
        {
          identifier: "profile-reminder",
          title: "Profile Reminder",
          state: "delivered",
          authorizationState: "granted",
          revision: 5,
        },
      ],
      diagnosticRecords: [
        {
          capability: "unsupported",
          code: "unsupportedSymbol",
          payload: {
            symbolName: "LAContext.evaluatePolicy",
          },
        },
      ],
    });

    expect(nativeEvents.map((event) => event.name)).toEqual([
      "native.permission.camera.prompt",
      "native.permission.notifications.prompt",
      "native.fixture.camera.front-camera-still",
      "native.fixture.photos.recent-library-pick",
      "native.event.location.location-update",
      "native.event.clipboard.clipboard-read",
      "native.event.clipboard.clipboard-write",
      "native.event.notifications.notification-scheduled",
      "native.event.notifications.notification-delivered",
    ]);
    expect(artifacts.nativeCapabilityRecords.map((record) => record.name)).toEqual([
      "native.fixture.camera.front-camera-still",
      "native.fixture.photos.recent-library-pick",
      "native.event.location.location-update",
      "native.event.clipboard.clipboard-read",
      "native.event.clipboard.clipboard-write",
      "native.event.notifications.notification-scheduled",
      "native.event.notifications.notification-delivered",
    ]);

    expect(session.nativeCapabilityState.clipboard).toBeDefined();
    session.nativeCapabilityState.clipboard!.payload.initialText = "inspector mutation";
    artifacts.nativeCapabilityRecords[0].payload.fixtureName = "inspector mutation";
    nativeEvents[0].payload.result = "denied";

    const inspectedAgain = await app.session();
    const nativeEventsAgain = await app.nativeCapabilityEvents();
    const artifactsAgain = await app.artifacts();

    expect(inspectedAgain.nativeCapabilities.requiredCapabilities[0].permissionState).toBe("prompt");
    expect(inspectedAgain.nativeCapabilityState.clipboard?.payload.initialText).toBe(
      "Draft profile notes"
    );
    expect(nativeEventsAgain[0].payload.result).toBe("granted");
    expect(artifactsAgain.nativeCapabilityRecords[0].payload.fixtureName).toBe("profile-photo");
  });

  it("regresses a strict-mode agent workflow across UI network native state and artifacts", async () => {
    const app = (await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      device: {
        viewport: { width: 393, height: 852, scale: 3 },
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          frozenAtISO8601: "2026-04-30T15:30:00Z",
          timeZone: "America/New_York",
        },
        geolocation: { latitude: 40.7134, longitude: -74.0059, accuracyMeters: 18 },
        network: { isOnline: true, latencyMilliseconds: 20, downloadKbps: 2_500 },
      },
      nativeCapabilities: representativeNativeMockManifest(),
    })) as NativeAutomationApp;

    await app.route("https://example.test/profile", {
      id: "profile-success",
      method: "POST",
      status: 201,
      headers: { "content-type": "application/json" },
      body: { saved: true },
    });
    const networkRecord = await app.request("https://example.test/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { name: "Avery" },
    });
    await app.getByText("Save").tap();
    await app.getByRole("textField", { text: "Name" }).fill("Avery");
    await app.screenshot("native-agent-flow");

    await app.native.permissions.request("camera");
    await app.native.permissions.set("location", "denied");
    await app.native.camera.capture("front-camera-still");
    await app.native.photos.select("recent-library-pick");
    await app.native.location.current();
    await app.native.clipboard.write("Copied by end-to-end agent");
    await app.native.files.select("document-picker");
    await app.native.shareSheet.complete("share-receipt", { completionState: "completed" });
    await app.native.notifications.requestAuthorization();
    await app.native.notifications.schedule("profile-reminder");
    await app.native.notifications.deliver("profile-reminder");
    await app.native.device.snapshot();

    const semanticTree = await app.semanticTree();
    const session = await app.session();
    const artifacts = await app.artifacts();
    const nativeEvents = await app.native.events();
    const unsupportedControls = app.native as unknown as Record<string, unknown>;

    expect(networkRecord).toMatchObject({
      source: { fixtureId: "profile-success" },
      response: { status: 201 },
    });
    expect(semanticTree.scene.alertPayload).toMatchObject({
      title: "Done",
      message: "Saved",
    });
    await expect(app.getByTestId("name-field").inspect()).resolves.toMatchObject({
      value: "Avery",
    });
    expect(session.logs.map((log) => log.message)).toEqual(
      expect.arrayContaining([
        "Tapped save-button",
        "Filled name-field with Avery",
      ])
    );
    expect(artifacts.networkRecords).toEqual([
      expect.objectContaining({
        id: "request-1",
        source: { fixtureId: "profile-success" },
      }),
    ]);
    expect(artifacts.renderArtifacts.at(-1)).toMatchObject({
      name: "native-agent-flow",
      viewport: { width: 393, height: 852, scale: 3 },
    });
    expect(session.nativeCapabilityState).toMatchObject({
      permissions: {
        camera: { state: "granted", resolvedState: "granted" },
        location: { state: "denied", resolvedState: "denied" },
        notifications: { state: "granted", resolvedState: "granted" },
      },
      clipboard: {
        currentText: "Copied by end-to-end agent",
      },
      shareSheetRecords: expect.arrayContaining([
        expect.objectContaining({
          identifier: "share-receipt",
          completionState: "completed",
        }),
      ]),
      notificationRecords: expect.arrayContaining([
        expect.objectContaining({
          identifier: "profile-reminder",
          state: "scheduled",
          authorizationState: "granted",
        }),
        expect.objectContaining({
          identifier: "profile-reminder",
          state: "delivered",
          authorizationState: "granted",
        }),
      ]),
      diagnosticRecords: expect.arrayContaining([
        expect.objectContaining({
          capability: "location",
          code: "permissionDenied",
        }),
      ]),
    });
    expect(nativeEvents.map((event) => event.name)).toEqual(
      expect.arrayContaining([
        "native.permission.camera.request",
        "native.permission.location.set",
        "native.camera.capture.front-camera-still",
        "native.photos.selection.recent-library-pick",
        "native.diagnostic.location.permissionDenied",
        "native.clipboard.write.automation",
        "native.files.selection.document-picker",
        "native.shareSheet.complete.share-receipt",
        "native.notifications.authorization.request",
        "native.notifications.schedule.profile-reminder",
        "native.notifications.deliver.profile-reminder",
        "native.deviceEnvironment.snapshot",
      ])
    );
    expect(artifacts.nativeCapabilityRecords.map((record) => record.name)).toEqual(
      expect.arrayContaining([
        "native.camera.capture.front-camera-still",
        "native.photos.selection.recent-library-pick",
        "native.clipboard.write.automation",
        "native.files.selection.document-picker",
        "native.shareSheet.complete.share-receipt",
        "native.notifications.schedule.profile-reminder",
        "native.notifications.deliver.profile-reminder",
        "native.deviceEnvironment.snapshot",
      ])
    );
    expect(unsupportedControls.biometrics).toBeUndefined();
    expect(unsupportedControls.health).toBeUndefined();
    expect(unsupportedControls.speech).toBeUndefined();
    expect(unsupportedControls.sensors).toBeUndefined();
    expect(unsupportedControls.haptics).toBeUndefined();

    session.nativeCapabilityState.clipboard!.currentText = "mutated";
    artifacts.nativeCapabilityRecords.at(-1)!.payload.locale = "mutated";
    nativeEvents.at(-1)!.payload.locale = "mutated";

    expect((await app.session()).nativeCapabilityState.clipboard?.currentText).toBe(
      "Copied by end-to-end agent"
    );
    expect((await app.artifacts()).nativeCapabilityRecords.at(-1)?.payload.locale).toBe(
      "en_US"
    );
    expect((await app.native.events()).at(-1)?.payload.locale).toBe("en_US");
  });
});

function representativeNativeMockManifest(): RuntimeNativeCapabilityManifest {
  return {
    requiredCapabilities: [
      {
        id: "camera",
        permissionState: "prompt",
        strictModeAlternative:
          "Use a deterministic camera fixture instead of live capture.",
      },
      {
        id: "photos",
        permissionState: "granted",
        strictModeAlternative:
          "Use photo picker fixtures instead of reading the host photo library.",
      },
      {
        id: "location",
        permissionState: "granted",
        strictModeAlternative:
          "Script deterministic coordinates instead of using CoreLocation.",
      },
      {
        id: "clipboard",
        permissionState: "granted",
        strictModeAlternative:
          "Use deterministic clipboard fixtures instead of host pasteboard access.",
      },
      {
        id: "keyboardInput",
        permissionState: "granted",
        strictModeAlternative:
          "Use semantic input traits instead of host keyboard state.",
      },
      {
        id: "files",
        permissionState: "granted",
        strictModeAlternative:
          "Use deterministic file picker fixtures instead of host document UI.",
      },
      {
        id: "shareSheet",
        permissionState: "granted",
        strictModeAlternative:
          "Record share sheet outcomes instead of presenting native UI.",
      },
      {
        id: "notifications",
        permissionState: "prompt",
        strictModeAlternative:
          "Record notification schedules instead of using a platform notification center.",
      },
    ],
    configuredMocks: [
      {
        capability: "camera",
        identifier: "front-camera-still",
        payload: {
          result: "granted",
          fixtureName: "profile-photo",
          mediaType: "image",
          outputPath: "Fixtures/profile-photo.heic",
        },
      },
      {
        capability: "photos",
        identifier: "recent-library-pick",
        payload: {
          fixtureName: "recent-library",
          assetIdentifiers: "profile-photo,receipt-photo",
          mediaTypes: "image",
        },
      },
      {
        capability: "location",
        identifier: "initial-location",
        payload: {
          latitude: "40.7128",
          longitude: "-74.0060",
          accuracyMeters: "25",
        },
      },
      {
        capability: "clipboard",
        identifier: "clipboard",
        payload: {
          initialText: "Draft profile notes",
        },
      },
      {
        capability: "keyboardInput",
        identifier: "name-entry",
        payload: {
          focusedElementID: "name-field",
          keyboardType: "default",
          returnKey: "done",
          textContentType: "name",
          isVisible: "true",
        },
      },
      {
        capability: "files",
        identifier: "document-picker",
        payload: {
          selectedFiles: "Fixtures/profile.pdf,Fixtures/receipt.pdf",
          contentTypes: "com.adobe.pdf,public.image",
          allowsMultipleSelection: "true",
        },
      },
      {
        capability: "shareSheet",
        identifier: "share-receipt",
        payload: {
          activityType: "com.apple.UIKit.activity.Mail",
          items: "Fixtures/profile.pdf,Summary",
          completionState: "completed",
          excludedActivityTypes: "com.apple.UIKit.activity.PostToTwitter",
        },
      },
      {
        capability: "notifications",
        identifier: "notification-permission",
        payload: {
          result: "granted",
        },
      },
    ],
    scriptedEvents: [
      {
        capability: "location",
        name: "location-update",
        atRevision: 2,
        payload: {
          latitude: "40.7134",
          longitude: "-74.0059",
          accuracyMeters: "18",
        },
      },
      {
        capability: "clipboard",
        name: "clipboard-read",
        atRevision: 2,
        payload: {},
      },
      {
        capability: "clipboard",
        name: "clipboard-write",
        atRevision: 3,
        payload: {
          text: "Updated profile notes",
        },
      },
      {
        capability: "notifications",
        name: "notification-scheduled",
        atRevision: 4,
        payload: {
          identifier: "profile-reminder",
          title: "Profile Reminder",
          body: "Review the saved profile.",
          trigger: "2026-04-28T12:15:00Z",
        },
      },
      {
        capability: "notifications",
        name: "notification-delivered",
        atRevision: 5,
        payload: {
          identifier: "profile-reminder",
          title: "Profile Reminder",
          body: "Review the saved profile.",
        },
      },
    ],
    unsupportedSymbols: [
      {
        symbolName: "LAContext.evaluatePolicy",
        capability: "unsupported",
        suggestedAdaptation:
          "Biometric policy evaluation is not part of the strict-mode native mock contract.",
      },
    ],
    artifactOutputs: [],
  };
}
