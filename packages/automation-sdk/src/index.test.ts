import { describe, expect, it } from "vitest";

import { Emulator } from "./index";
import type {
  RuntimeNativeCapabilityArtifactOutputKind,
  RuntimeNativeCapabilityID,
  RuntimeNativeCapabilityManifest,
  RuntimeNativePermissionState,
} from "./types";

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

  it("exposes native capability event inspection without the Phase 10 native control namespace", async () => {
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
    expect("native" in app).toBe(false);
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
    expect("native" in app).toBe(false);

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
