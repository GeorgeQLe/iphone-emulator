import {
  Emulator,
  RuntimeTransportClient,
  RuntimeTransportProtocolError,
  createInMemoryRuntimeTransport,
} from "../../packages/automation-sdk/src/index";

async function main(): Promise<void> {
  const transport = createInMemoryRuntimeTransport({
    fixtureName: "strict-mode-baseline",
  });
  const transportClient = new RuntimeTransportClient({ transport });

  const app = await Emulator.launch({
    mode: "transport",
    appIdentifier: "LiveTransportBaselineApp",
    fixtureName: "strict-mode-baseline",
    transport: transportClient,
  });

  const initialSession = await app.session();
  const initialTree = await app.semanticTree();
  const initialField = await app.getByTestId("name-field").inspect();

  await app.route("https://example.test/profile", {
    id: "profile-fixture",
    status: 200,
    headers: { "content-type": "application/json" },
    body: { name: "Jordan" },
  });

  await app.getByRole("textField", { text: "Name" }).fill("Jordan");
  await app.getByText("Save").tap();

  const request = await app.request("https://example.test/profile");
  const updatedField = await app.getByTestId("name-field").inspect();
  const updatedTree = await app.semanticTree();
  const logs = await app.logs();
  const screenshot = await app.screenshot("live-transport-after-save");
  const artifacts = await app.artifacts();
  const session = await app.session();
  const deviceSnapshot = await app.native.device.snapshot();

  console.log("Initial revision:", initialSession.snapshot.revision);
  console.log("Initial scene:", initialTree.scene.id);
  console.log("Initial field value:", initialField.value);
  console.log("Updated field value:", updatedField.value);
  console.log("Alert title:", updatedTree.scene.alertPayload?.title);
  console.log("Request status:", request.response.status);
  console.log("Screenshot placeholder:", screenshot);
  console.log("Artifact counts:", {
    renders: artifacts.renderArtifacts.length,
    snapshots: artifacts.semanticSnapshots.length,
    logs: artifacts.logs.length,
    network: artifacts.networkRecords.length,
    nativeCapabilityRecords: artifacts.nativeCapabilityRecords.length,
  });
  console.log("Log messages:", logs.map((entry) => entry.message));
  console.log("Device snapshot:", deviceSnapshot);

  await demonstrateStructuredDiagnostic();
  await app.close();
}

async function demonstrateStructuredDiagnostic(): Promise<void> {
  const transport = createInMemoryRuntimeTransport({
    fixtureName: "strict-mode-baseline",
    diagnostics: [
      {
        code: "unsupportedCommand",
        message: "native.camera.capture is not supported by this local transport",
        payload: { command: "native.camera.capture" },
      },
    ],
  });
  const client = new RuntimeTransportClient({ transport });

  const session = await client.launch({
    appIdentifier: "LiveTransportDiagnosticsApp",
    fixtureName: "strict-mode-baseline",
  });

  try {
    await client.sendUnsupportedCommand("native.camera.capture");
  } catch (error) {
    if (error instanceof RuntimeTransportProtocolError) {
      console.log("Structured diagnostic:", {
        code: error.code,
        command: error.payload.command,
      });
    } else {
      throw error;
    }
  } finally {
    await client.close(session.id);
  }
}

void main();
