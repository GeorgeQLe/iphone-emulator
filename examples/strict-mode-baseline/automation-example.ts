import {
  Emulator,
  type RuntimeNativeCapabilityManifest,
} from "../../packages/automation-sdk/src/index";

async function main(): Promise<void> {
  const nativeCapabilities: RuntimeNativeCapabilityManifest = {
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
        payload: { initialText: "Draft profile notes" },
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
        payload: { result: "granted" },
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
        payload: { text: "Updated profile notes" },
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
    nativeCapabilities,
  });

  await app.route("https://example.test/profile", {
    id: "profile-fixture",
    status: 200,
    headers: { "content-type": "application/json" },
    body: { name: "Jordan" },
  });

  await app.getByText("Save").tap();
  await app.getByRole("textField", { text: "Name" }).fill("Jordan");

  await app.native.permissions.request("camera");
  await app.native.camera.capture("front-camera-still");
  await app.native.photos.select("recent-library-pick");
  await app.native.permissions.set("location", "denied");
  const deniedLocation = await app.native.location.current();
  await app.native.clipboard.write("Copied by agent");
  const clipboardRead = await app.native.clipboard.read();
  const fileSelection = await app.native.files.select("document-picker");
  await app.native.shareSheet.complete("share-receipt", {
    completionState: "completed",
  });
  await app.native.notifications.requestAuthorization();
  await app.native.notifications.schedule("profile-reminder");
  await app.native.notifications.deliver("profile-reminder");
  const deviceSnapshot = await app.native.device.snapshot();

  const request = await app.request("https://example.test/profile");
  const field = await app.getByTestId("name-field").inspect();
  const tree = await app.semanticTree();
  const logs = await app.logs();
  const screenshot = await app.screenshot("baseline-after-save");
  const artifacts = await app.artifacts();
  const session = await app.session();
  const nativeEvents = await app.native.events();
  const nativeArtifacts = await app.native.artifacts();

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
    nativeCapabilityRecords: artifacts.nativeCapabilityRecords.length,
  });
  console.log("Session device:", session.device);
  console.log("Native camera permission:", session.nativeCapabilityState.permissions.camera);
  console.log("Location denial diagnostic:", deniedLocation.diagnostic?.code);
  console.log("Native clipboard:", clipboardRead.text, session.nativeCapabilityState.clipboard);
  console.log("Selected files:", fileSelection.selectedFiles);
  console.log("Device snapshot:", deviceSnapshot);
  console.log("Native event names:", nativeEvents.map((event) => event.name));
  console.log("Native artifact names:", nativeArtifacts.map((record) => record.name));

  await app.close();
}

void main();
