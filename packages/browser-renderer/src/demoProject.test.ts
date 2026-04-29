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
});
