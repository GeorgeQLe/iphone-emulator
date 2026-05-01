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
});
