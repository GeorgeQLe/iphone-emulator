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
      code: "close",
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
    await expect(app.semanticTree()).rejects.toMatchObject({ code: "close" });
  });
});
