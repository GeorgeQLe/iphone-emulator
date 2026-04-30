import { describe, expect, it } from "vitest";

import { compileDemoProject, demoProjectFiles } from "./demoProject";

describe("compileDemoProject", () => {
  it("lowers the bundled mock strict-mode source into a deterministic semantic tree", () => {
    const swiftSource = demoProjectFiles.find((file) =>
      file.path.endsWith("TravelPlannerApp.swift")
    )?.value;

    expect(swiftSource).toBeDefined();

    const result = compileDemoProject(swiftSource ?? "");

    expect(result.executionMode).toEqual({
      kind: "illustrative-lowering",
      label: "Illustrative source lowering",
      detail:
        "This browser demo parses a small strict-mode Swift-like subset locally. It is not executing Swift or using a live runtime transport yet.",
    });
    expect(result.diagnostics).toEqual([]);
    expect(result.tree.appIdentifier).toBe("TravelPlannerApp");
    expect(result.tree.scene).toMatchObject({
      id: "trip-board-screen",
      kind: "screen",
      navigationState: {
        stackIdentifiers: ["trip-board-screen"],
        selectedIdentifier: "trip-board-screen",
      },
    });

    const layout = result.tree.scene.rootNode?.children[0]?.children[0];

    expect(layout).toMatchObject({
      id: "demo-layout",
      role: "vStack",
      metadata: { spacing: "16" },
    });
    expect(layout?.children.map((node) => `${node.id}:${node.role}:${node.label ?? ""}`)).toEqual([
      "text-1-plan-a-weekend-in-kyoto:text:Plan a weekend in Kyoto",
      "primary-action-row:hStack:",
      "list-itinerary:list:Itinerary",
      "agent-check:button:Generate Agent Check",
    ]);
    expect(layout?.children[0]).toMatchObject({
      metadata: { emphasis: "headline" },
    });
    expect(layout?.children[1]?.children).toMatchObject([
      {
        id: "traveler-field",
        role: "textField",
        label: "Traveler",
        value: "Taylor",
        metadata: { placeholder: "Traveler" },
      },
      {
        id: "save-trip",
        role: "button",
        label: "Save Trip",
        metadata: { variant: "primary" },
      },
    ]);
    expect(layout?.children[2]?.children.map((node) => node.label)).toEqual([
      "Book ryokan",
      "Reserve ramen counter",
      "Map temple walk",
    ]);
  });

  it("reports unsupported framework imports while still lowering supported declarations", () => {
    const result = compileDemoProject(`import SwiftUI
import UIKit
import StrictModeSDK

@StrictModeApp
struct UnsupportedImportDemo {
  var body: some StrictScene {
    NavigationStack(title: "Warnings") {
      Text("Still visible")
    }
  }
}
`);

    expect(result.diagnostics).toEqual([
      {
        severity: "error",
        message:
          'Unsupported Apple framework import "SwiftUI" detected. This demo lowers only illustrative strict-mode declarations.',
        source: "Sources/TravelPlannerApp.swift",
      },
      {
        severity: "error",
        message:
          'Unsupported Apple framework import "UIKit" detected. This demo lowers only illustrative strict-mode declarations.',
        source: "Sources/TravelPlannerApp.swift",
      },
    ]);
    expect(
      result.tree.scene.rootNode?.children[0]?.children[0]?.children.map((node) => node.label)
    ).toContain("Still visible");
  });

  it("emits diagnostics for missing strict-mode import and empty supported surfaces", () => {
    const result = compileDemoProject(`struct EmptyDemo {
  var body: some StrictScene {
    NavigationStack(title: "Empty") {
    }
  }
}
`);

    expect(result.diagnostics).toEqual([
      {
        severity: "warning",
        message:
          "Strict mode demos should import StrictModeSDK so the harness owns the runtime surface.",
        source: "Sources/TravelPlannerApp.swift",
      },
      {
        severity: "info",
        message:
          "No supported strict-mode UI declarations were found. Add Text, Button, TextField, or List declarations to change the semantic preview.",
        source: "Sources/TravelPlannerApp.swift",
      },
    ]);
    expect(result.tree.appIdentifier).toBe("EmptyDemo");
    expect(result.tree.scene.rootNode?.children[0]?.children[0]?.children).toEqual([]);
  });

  it("extracts deterministic native capability preview state from mock service declarations", () => {
    const result = compileDemoProject(`import StrictModeSDK

@StrictModeApp
struct NativePreviewDemo {
  var body: some StrictScene {
    NavigationStack(title: "Native Preview") {
      Text("Native services")
    }
  }

  var nativeMocks: some NativeCapabilityMocks {
    PermissionPrompt(.camera, result: .granted)
    PermissionPrompt(.notifications, result: .granted)
    CameraFixture("front-camera-still", fixtureName: "profile-photo")
    PhotoPickerFixture("recent-library-pick", assets: ["profile-photo", "receipt-photo"])
    LocationEvent(latitude: 40.7134, longitude: -74.0059, accuracyMeters: 18)
    ClipboardFixture(text: "Draft profile notes")
    KeyboardFixture(focusedElementID: "name-field", keyboardType: .default, returnKey: .done)
    FilePickerFixture("document-picker", selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"])
    ShareSheetFixture("share-receipt", activityType: .mail, items: ["Fixtures/profile.pdf", "Summary"])
    NotificationFixture("profile-reminder", title: "Profile Reminder", state: .delivered)
  }
}
`) as ReturnType<typeof compileDemoProject> & {
      nativePreview: {
        permissionPrompts: Array<{ capability: string; result: string }>;
        fixtureOutputs: Array<{ capability: string; identifier: string; fixtureName?: string }>;
        locationEvents: Array<{ latitude: number; longitude: number; accuracyMeters: number }>;
        clipboard: { text: string };
        keyboard: { focusedElementID: string; keyboardType: string; returnKey: string };
        filePickerRecords: Array<{ identifier: string; selectedFiles: string[] }>;
        shareSheetRecords: Array<{ identifier: string; activityType: string; items: string[] }>;
        notificationRecords: Array<{ identifier: string; title: string; state: string }>;
      };
    };

    expect(result.nativePreview).toMatchObject({
      permissionPrompts: [
        {
          capability: "camera",
          result: "granted",
        },
        {
          capability: "notifications",
          result: "granted",
        },
      ],
      fixtureOutputs: [
        {
          capability: "camera",
          identifier: "front-camera-still",
          fixtureName: "profile-photo",
        },
        {
          capability: "photos",
          identifier: "recent-library-pick",
          fixtureName: "profile-photo,receipt-photo",
        },
      ],
      locationEvents: [
        {
          latitude: 40.7134,
          longitude: -74.0059,
          accuracyMeters: 18,
        },
      ],
      clipboard: {
        text: "Draft profile notes",
      },
      keyboard: {
        focusedElementID: "name-field",
        keyboardType: "default",
        returnKey: "done",
      },
      filePickerRecords: [
        {
          identifier: "document-picker",
          selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"],
        },
      ],
      shareSheetRecords: [
        {
          identifier: "share-receipt",
          activityType: "mail",
          items: ["Fixtures/profile.pdf", "Summary"],
        },
      ],
      notificationRecords: [
        {
          identifier: "profile-reminder",
          title: "Profile Reminder",
          state: "delivered",
        },
      ],
    });
  });

  it("extracts native agent flow preview state from automation declarations", () => {
    const result = compileDemoProject(`import StrictModeSDK

@StrictModeApp
struct NativeAgentFlowPreviewDemo {
  var body: some StrictScene {
    NavigationStack(title: "Native Agent Flow") {
      Text("Native agent workflow")
    }
  }

  var nativeMocks: some NativeCapabilityMocks {
    PermissionPrompt(.camera, result: .granted)
    PermissionPrompt(.location, result: .denied)
    PermissionPrompt(.notifications, result: .granted)
    CameraFixture("front-camera-still", fixtureName: "profile-photo")
    PhotoPickerFixture("recent-library-pick", assets: ["profile-photo", "receipt-photo"])
    LocationEvent(latitude: 40.7134, longitude: -74.0059, accuracyMeters: 18)
    ClipboardFixture(text: "Draft profile notes")
    FilePickerFixture("document-picker", selectedFiles: ["Fixtures/profile.pdf", "Fixtures/receipt.pdf"])
    ShareSheetFixture("share-receipt", activityType: .mail, items: ["Fixtures/profile.pdf", "Summary"])
    NotificationFixture("profile-reminder", title: "Profile Reminder", state: .scheduled)
  }

  var nativeAgentFlow: some NativeAutomationFlow {
    NativePermissionRequest(.camera)
    NativePermissionSet(.location, .denied)
    NativeCameraCapture("front-camera-still")
    NativePhotoSelection("recent-library-pick")
    NativeLocationRead(expectPermission: .denied)
    NativeClipboardWrite("Copied by agent")
    NativeFileSelection("document-picker")
    NativeShareCompletion("share-receipt", state: .completed)
    NativeNotificationSchedule("profile-reminder")
    NativeNotificationDelivery("profile-reminder")
    NativeDeviceEnvironmentSnapshot()
    UnsupportedNativeControl(.biometrics)
    UnsupportedNativeControl(.health)
    UnsupportedNativeControl(.speech)
    UnsupportedNativeControl(.sensors)
    UnsupportedNativeControl(.haptics)
  }
}
`) as ReturnType<typeof compileDemoProject> & {
      nativePreview: {
        automationFlow: {
          steps: Array<{ action: string; capability: string; identifier?: string }>;
        };
        unsupportedControls: string[];
        deviceEnvironment: {
          colorScheme: string;
          locale: string;
        };
      };
    };

    expect(result.nativePreview).toMatchObject({
      permissionPrompts: [
        { capability: "camera", result: "granted" },
        { capability: "location", result: "denied" },
        { capability: "notifications", result: "granted" },
      ],
      automationFlow: {
        steps: [
          { action: "native.permissions.request", capability: "camera" },
          { action: "native.permissions.set", capability: "location" },
          {
            action: "native.camera.capture",
            capability: "camera",
            identifier: "front-camera-still",
          },
          {
            action: "native.photos.select",
            capability: "photos",
            identifier: "recent-library-pick",
          },
          { action: "native.location.current", capability: "location" },
          { action: "native.clipboard.write", capability: "clipboard" },
          {
            action: "native.files.select",
            capability: "files",
            identifier: "document-picker",
          },
          {
            action: "native.shareSheet.complete",
            capability: "shareSheet",
            identifier: "share-receipt",
          },
          {
            action: "native.notifications.schedule",
            capability: "notifications",
            identifier: "profile-reminder",
          },
          {
            action: "native.notifications.deliver",
            capability: "notifications",
            identifier: "profile-reminder",
          },
          { action: "native.device.snapshot", capability: "deviceEnvironment" },
        ],
      },
      unsupportedControls: ["biometrics", "health", "speech", "sensors", "haptics"],
      deviceEnvironment: {
        colorScheme: "light",
        locale: "en_US",
      },
    });
  });
});
