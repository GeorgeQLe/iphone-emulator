import {
  Emulator,
  RuntimeTransportClient,
  RuntimeTransportProtocolError,
  createInMemoryRuntimeTransport,
  type RuntimeNativeCapabilityManifest,
} from "../../packages/automation-sdk/src/index";

async function main(): Promise<void> {
  const nativeCapabilities = representativeNativeCapabilities();
  const transport = createInMemoryRuntimeTransport({
    fixtureName: "strict-mode-baseline",
  });
  const transportClient = new RuntimeTransportClient({ transport });

  const app = await Emulator.launch({
    mode: "transport",
    appIdentifier: "LiveTransportBaselineApp",
    fixtureName: "strict-mode-baseline",
    transport: transportClient,
    nativeCapabilities,
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

  const cameraPermission = await app.native.permissions.request("camera");
  const cameraCapture = await app.native.camera.capture("front-camera-still");
  const photoSelection = await app.native.photos.select("recent-library-pick");
  await app.native.permissions.set("location", "denied");
  const deniedLocation = await app.native.location.current();
  const updatedLocation = await app.native.location.update({
    latitude: 40.7134,
    longitude: -74.0059,
    accuracyMeters: 18,
  });
  await app.native.clipboard.write("Copied by live transport example");
  const clipboardRead = await app.native.clipboard.read();
  const fileSelection = await app.native.files.select("document-picker");
  const shareCompletion = await app.native.shareSheet.complete("share-receipt", {
    completionState: "completed",
  });
  const notificationAuthorization = await app.native.notifications.requestAuthorization();
  const scheduledNotification = await app.native.notifications.schedule("profile-reminder");
  const deliveredNotification = await app.native.notifications.deliver("profile-reminder");
  const deviceSnapshot = await app.native.device.snapshot();

  const request = await app.request("https://example.test/profile");
  const updatedField = await app.getByTestId("name-field").inspect();
  const updatedTree = await app.semanticTree();
  const logs = await app.logs();
  const screenshot = await app.screenshot("live-transport-after-save");
  const artifacts = await app.artifacts();
  const session = await app.session();
  const nativeEvents = await app.native.events();
  const nativeArtifacts = await app.native.artifacts();

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
  console.log("Native permission:", cameraPermission.payload.resolvedState);
  console.log("Native camera fixture:", cameraCapture.payload.fixtureName);
  console.log("Native photo assets:", photoSelection.payload.assetIdentifiers);
  console.log("Native location diagnostics:", {
    deniedCurrent: deniedLocation.diagnostic?.code,
    updated: updatedLocation.payload,
  });
  console.log("Native clipboard:", clipboardRead.text);
  console.log("Native files:", fileSelection.selectedFiles);
  console.log("Native share sheet:", shareCompletion.payload.completionState);
  console.log("Native notifications:", {
    authorization: notificationAuthorization.payload.resolvedState,
    scheduled: scheduledNotification.payload.identifier,
    delivered: deliveredNotification.payload.identifier,
  });
  console.log("Native session events:", session.nativeCapabilityEvents.length);
  console.log("Native event names:", nativeEvents.map((event) => event.name));
  console.log("Native artifact names:", nativeArtifacts.map((record) => record.name));

  await demonstrateStructuredDiagnostic();
  await app.close();
}

function representativeNativeCapabilities(): RuntimeNativeCapabilityManifest {
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
        payload: { text: "Draft profile notes" },
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
          result: "granted",
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
        suggestedAdaptation:
          "Biometric policy evaluation is not part of the strict-mode native mock contract.",
      },
    ],
    artifactOutputs: [],
  };
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
