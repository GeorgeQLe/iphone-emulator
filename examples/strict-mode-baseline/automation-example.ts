import { Emulator } from "../../packages/automation-sdk/src/index";

async function main(): Promise<void> {
  const app = await Emulator.launch({
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
      geolocation: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracyMeters: 25,
      },
      network: {
        isOnline: true,
        latencyMilliseconds: 20,
        downloadKbps: 12000,
      },
    },
  });

  await app.route("https://example.test/profile", {
    id: "profile-fixture",
    status: 200,
    headers: { "content-type": "application/json" },
    body: { name: "Jordan" },
  });

  await app.getByText("Save").tap();
  await app.getByRole("textField", { text: "Name" }).fill("Jordan");

  const request = await app.request("https://example.test/profile");
  const field = await app.getByTestId("name-field").inspect();
  const tree = await app.semanticTree();
  const logs = await app.logs();
  const screenshot = await app.screenshot("baseline-after-save");
  const artifacts = await app.artifacts();
  const session = await app.session();

  console.log("Field value:", field.value);
  console.log("Alert title:", tree.scene.alertPayload?.title);
  console.log("Log messages:", logs.map((entry) => entry.message));
  console.log("Request record:", request);
  console.log("Screenshot placeholder:", screenshot);
  console.log("Artifact counts:", {
    renders: artifacts.renderArtifacts.length,
    snapshots: artifacts.semanticSnapshots.length,
    logs: artifacts.logs.length,
    network: artifacts.networkRecords.length,
  });
  console.log("Session device:", session.device);

  await app.close();
}

void main();
