import { describe, expect, it } from "vitest";

import { Emulator } from "./index";
import {
  RuntimeTransportClient,
  RuntimeTransportConnectionError,
  RuntimeTransportProtocolError,
  RuntimeTransportTimeoutError,
  createInMemoryRuntimeTransport,
  createWebSocketRuntimeTransport,
} from "./transport";
import type { RuntimeNativeCapabilityManifest } from "./types";

describe("RuntimeTransportClient", () => {
  it("launches, inspects, interacts, collects records, and closes a live local session", async () => {
    const transport = createInMemoryRuntimeTransport({
      fixtureName: "strict-mode-baseline",
    });
    const client = new RuntimeTransportClient({ transport, timeoutMs: 250 });
    const app = await Emulator.launch({
      mode: "transport",
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      transport: client,
    });

    await expect(app.session()).resolves.toMatchObject({
      id: "session-1",
      appIdentifier: "FixtureApp",
      snapshot: { revision: 1 },
    });
    await expect(app.getByText("Save").tap()).resolves.toBeUndefined();
    await expect(app.getByRole("textField", { text: "Name" }).fill("Jordan")).resolves.toBeUndefined();
    await expect(app.getByTestId("name-field").inspect()).resolves.toMatchObject({
      id: "name-field",
      value: "Jordan",
    });
    await expect(app.semanticTree()).resolves.toMatchObject({
      appIdentifier: "FixtureApp",
      scene: {
        id: "baseline-screen",
        alertPayload: {
          title: "Done",
          message: "Saved",
        },
      },
    });
    await expect(app.screenshot("live-home")).resolves.toMatchObject({
      name: "live-home",
      kind: "screenshot",
      format: "png",
    });
    await expect(app.logs()).resolves.toEqual([
      { level: "info", message: "Launched fixture strict-mode-baseline" },
      { level: "info", message: "Tapped save-button" },
      { level: "info", message: "Filled name-field with Jordan" },
    ]);
    await expect(app.artifacts()).resolves.toMatchObject({
      sessionID: "session-1",
      semanticSnapshots: [{ revision: 1 }, { revision: 2 }, { revision: 3 }],
      renderArtifacts: [{ name: "live-home" }],
      networkRecords: [],
      nativeCapabilityRecords: expect.any(Array),
    });
    await expect(app.native.device.snapshot()).resolves.toMatchObject({
      viewport: { width: 390, height: 844, scale: 1 },
    });
    await expect(app.close()).resolves.toBeUndefined();
    await expect(client.closed).resolves.toEqual({ sessionID: "session-1" });
    await expect(app.session()).rejects.toMatchObject({
      name: "RuntimeTransportProtocolError",
      code: "protocolViolation",
      payload: { sessionID: "session-1" },
    });
  });

  it("surfaces transport connection, timeout, unsupported command, and protocol diagnostics", async () => {
    await expect(
      createWebSocketRuntimeTransport({ url: "ws://127.0.0.1:9/runtime" }).connect()
    ).rejects.toBeInstanceOf(RuntimeTransportConnectionError);

    const timedOut = new RuntimeTransportClient({
      transport: createInMemoryRuntimeTransport({ fixtureName: "strict-mode-baseline", stall: true }),
      timeoutMs: 1,
    });
    await expect(
      Emulator.launch({
        mode: "transport",
        appIdentifier: "FixtureApp",
        fixtureName: "strict-mode-baseline",
        transport: timedOut,
      })
    ).rejects.toBeInstanceOf(RuntimeTransportTimeoutError);

    const protocolClient = new RuntimeTransportClient({
      transport: createInMemoryRuntimeTransport({
        fixtureName: "strict-mode-baseline",
        diagnostics: [
          { code: "unsupportedCommand", message: "pinch is not supported", payload: { command: "pinch" } },
          { code: "protocolViolation", message: "missing session", payload: { sessionID: "missing" } },
        ],
      }),
      timeoutMs: 250,
    });
    const app = await Emulator.launch({
      mode: "transport",
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      transport: protocolClient,
    });

    await expect(protocolClient.sendUnsupportedCommand("pinch")).rejects.toMatchObject({
      name: "RuntimeTransportProtocolError",
      code: "unsupportedCommand",
      payload: { command: "pinch" },
    } satisfies Partial<RuntimeTransportProtocolError>);
    await expect(protocolClient.inspectSession("missing")).rejects.toMatchObject({
      name: "RuntimeTransportProtocolError",
      code: "protocolViolation",
      payload: { sessionID: "missing" },
    } satisfies Partial<RuntimeTransportProtocolError>);
    await expect(app.close()).resolves.toBeUndefined();
  });

  it("regresses the strict mode live local transport session from launch to clean close", async () => {
    const client = new RuntimeTransportClient({
      transport: createInMemoryRuntimeTransport({ fixtureName: "strict-mode-baseline" }),
      timeoutMs: 250,
    });
    const app = await Emulator.launch({
      mode: "transport",
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      transport: client,
    });

    await expect(app.session()).resolves.toMatchObject({
      id: "session-1",
      snapshot: {
        revision: 1,
        tree: {
          scene: {
            rootNode: {
              id: "root-stack",
            },
          },
        },
      },
    });

    await app.getByText("Save").tap();
    await app.getByRole("textField", { text: "Name" }).fill("Jordan");
    await expect(app.getByTestId("name-field").inspect()).resolves.toMatchObject({
      id: "name-field",
      value: "Jordan",
    });

    await expect(app.screenshot("live-home")).resolves.toMatchObject({
      name: "live-home",
      viewport: { width: 390, height: 844, scale: 1 },
    });
    await app.route("https://example.test/profile", {
      id: "profile-success",
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
    });
    await expect(
      app.request("https://example.test/profile", {
        headers: { accept: "application/json" },
      })
    ).resolves.toMatchObject({
      id: "request-1",
      response: { status: 200 },
      source: { fixtureId: "profile-success" },
    });
    await expect(app.native.device.snapshot()).resolves.toMatchObject({
      viewport: { width: 390, height: 844, scale: 1 },
      colorScheme: "light",
    });

    const artifacts = await app.artifacts();
    expect(artifacts.semanticSnapshots.map((snapshot) => snapshot.revision)).toEqual([1, 2, 3]);
    expect(artifacts.renderArtifacts.map((artifact) => artifact.name)).toEqual(["live-home"]);
    expect(artifacts.networkRecords.map((record) => record.source)).toEqual([
      { fixtureId: "profile-success" },
    ]);

    await expect(client.sendUnsupportedCommand("pinch")).rejects.toMatchObject({
      code: "unsupportedCommand",
      payload: { command: "pinch" },
    });
    await expect(client.inspectSession("missing-session")).rejects.toMatchObject({
      code: "protocolViolation",
      payload: { sessionID: "missing-session" },
    });
    await expect(app.close()).resolves.toBeUndefined();
    await expect(client.closed).resolves.toEqual({ sessionID: "session-1" });
    await expect(app.semanticTree()).rejects.toMatchObject({
      code: "protocolViolation",
      payload: { sessionID: "session-1" },
    });
  });

  it("matches fixture native automation parity for representative deterministic workflows", async () => {
    const nativeCapabilities = representativeNativeMockManifest();
    const fixtureApp = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities,
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
    });
    const transportClient = new RuntimeTransportClient({
      transport: createInMemoryRuntimeTransport({ fixtureName: "strict-mode-baseline" }),
      timeoutMs: 250,
    });
    const transportApp = await Emulator.launch({
      mode: "transport",
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities: representativeNativeMockManifest(),
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
      transport: transportClient,
    });

    for (const app of [fixtureApp, transportApp]) {
      await app.native.permissions.request("camera");
      await app.native.permissions.set("location", "denied");
      await app.native.camera.capture("front-camera-still");
      await app.native.photos.select("recent-library-pick");
      await app.native.location.current();
      await app.native.location.update({ latitude: 34.0522, longitude: -118.2437, accuracyMeters: 10 });
      await app.native.clipboard.read();
      await app.native.clipboard.write("Copied by transport parity test");
      await app.native.files.select("document-picker");
      await app.native.shareSheet.complete("share-receipt", { completionState: "completed" });
      await app.native.notifications.requestAuthorization();
      await app.native.notifications.schedule("profile-reminder");
      await app.native.notifications.deliver("profile-reminder");
      await app.native.device.snapshot();
    }

    const fixtureSession = await fixtureApp.session();
    const transportSession = await transportApp.session();
    const fixtureArtifacts = await fixtureApp.artifacts();
    const transportArtifacts = await transportApp.artifacts();
    const fixtureEvents = await fixtureApp.native.events();
    const transportEvents = await transportApp.native.events();

    expect(transportSession.nativeCapabilityState).toMatchObject(fixtureSession.nativeCapabilityState);
    expect(transportSession.snapshot.tree.scene.rootNode?.metadata).toMatchObject(
      fixtureSession.snapshot.tree.scene.rootNode?.metadata ?? {}
    );
    expect(transportArtifacts.nativeCapabilityRecords.map((record) => record.name)).toEqual(
      fixtureArtifacts.nativeCapabilityRecords.map((record) => record.name)
    );
    expect(transportEvents.map((event) => event.name)).toEqual(fixtureEvents.map((event) => event.name));
    expect(transportSession.logs.map((log) => log.message)).toEqual(
      expect.arrayContaining(["native.deviceEnvironment.snapshot"])
    );

    transportSession.nativeCapabilityState.clipboard!.currentText = "mutated by test";
    transportArtifacts.nativeCapabilityRecords.at(-1)!.payload.locale = "mutated";
    transportEvents.at(-1)!.payload.locale = "mutated";

    await expect(transportApp.session()).resolves.toMatchObject({
      nativeCapabilityState: {
        clipboard: { currentText: "Copied by transport parity test" },
      },
    });
    await expect(transportApp.artifacts()).resolves.toMatchObject({
      nativeCapabilityRecords: expect.arrayContaining([
        expect.objectContaining({
          name: "native.deviceEnvironment.snapshot",
          payload: expect.objectContaining({ locale: "en_US" }),
        }),
      ]),
    });
    await expect(transportApp.native.events()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "native.deviceEnvironment.snapshot",
          payload: expect.objectContaining({ locale: "en_US" }),
        }),
      ])
    );

    await expect(transportApp.close()).resolves.toBeUndefined();
    await expect(transportApp.native.clipboard.write("after close")).rejects.toMatchObject({
      name: "RuntimeTransportProtocolError",
      code: "protocolViolation",
    });
  });

  it("reports deterministic native transport diagnostics for missing fixtures and stale sessions", async () => {
    const client = new RuntimeTransportClient({
      transport: createInMemoryRuntimeTransport({ fixtureName: "strict-mode-baseline" }),
      timeoutMs: 250,
    });
    const app = await Emulator.launch({
      mode: "transport",
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      nativeCapabilities: representativeNativeMockManifest(),
      transport: client,
    });

    await expect(app.native.camera.capture("missing-camera")).resolves.toMatchObject({
      capability: "camera",
      name: "native.diagnostic.camera.missingFixture",
      payload: expect.objectContaining({ fixtureIdentifier: "missing-camera" }),
    });
    await expect(app.native.files.select("missing-file-picker")).resolves.toMatchObject({
      record: {
        capability: "files",
        name: "native.diagnostic.files.missingFixture",
      },
      selectedFiles: [],
    });
    await expect(app.native.shareSheet.complete("missing-share", { completionState: "cancelled" })).resolves.toMatchObject({
      capability: "shareSheet",
      name: "native.diagnostic.shareSheet.missingFixture",
    });
    await expect(client.inspectSession("missing-session")).rejects.toMatchObject({
      code: "protocolViolation",
      payload: { sessionID: "missing-session" },
    });

    await app.getByText("Save").tap();
    await expect(app.native.clipboard.write("after stale UI mutation")).resolves.toMatchObject({
      capability: "clipboard",
      name: "native.clipboard.write.automation",
    });
  });

  it("exposes one generic native automation transport command boundary", async () => {
    const client = new RuntimeTransportClient({
      transport: createInMemoryRuntimeTransport({ fixtureName: "strict-mode-baseline" }),
      timeoutMs: 250,
    });

    expect(typeof (client as unknown as { nativeAutomation?: unknown }).nativeAutomation).toBe("function");
  });
});

function representativeNativeMockManifest(): RuntimeNativeCapabilityManifest {
  return {
    requiredCapabilities: [
      {
        id: "camera",
        permissionState: "prompt",
        strictModeAlternative: "Use a deterministic camera fixture instead of live capture.",
      },
      {
        id: "photos",
        permissionState: "granted",
        strictModeAlternative: "Use photo picker fixtures instead of reading the host photo library.",
      },
      {
        id: "location",
        permissionState: "granted",
        strictModeAlternative: "Script deterministic coordinates instead of using CoreLocation.",
      },
      {
        id: "clipboard",
        permissionState: "granted",
        strictModeAlternative: "Use deterministic clipboard fixtures instead of host pasteboard access.",
      },
      {
        id: "files",
        permissionState: "granted",
        strictModeAlternative: "Use deterministic file picker fixtures instead of host document UI.",
      },
      {
        id: "shareSheet",
        permissionState: "granted",
        strictModeAlternative: "Record share sheet outcomes instead of presenting native UI.",
      },
      {
        id: "notifications",
        permissionState: "prompt",
        strictModeAlternative: "Record notification schedules instead of using a platform notification center.",
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
          mediaTypes: "image,image",
        },
      },
      {
        capability: "clipboard",
        identifier: "clipboard",
        payload: {
          text: "Draft profile notes",
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
        identifier: "profile-reminder",
        payload: {
          title: "Profile Reminder",
          body: "Review updated profile",
          trigger: "2026-04-30T16:00:00Z",
        },
      },
    ],
    scriptedEvents: [],
    unsupportedSymbols: [
      {
        symbolName: "LAContext.evaluatePolicy",
        capability: "unsupported",
        suggestedAdaptation: "Biometric policy evaluation is not part of the strict-mode native mock contract.",
      },
    ],
    artifactOutputs: [],
  };
}
