import { describe, expect, it } from "vitest";

import { baselineFixtureTree } from "./fixtureTree";
import { createRenderArtifactMetadata } from "./renderArtifacts";
import { mountRenderer } from "./renderTree";
import type { SemanticUITree } from "./types";

describe("mountRenderer", () => {
  it("renders the fixed semantic fixture into an iPhone-like shell", () => {
    const container = document.createElement("div");

    mountRenderer(container, baselineFixtureTree);

    expect(container.querySelector(".phone-shell")).not.toBeNull();
    expect(container.querySelector("[data-app-id='BaselineFixtureApp']")).not.toBeNull();
    expect(container.querySelector("[data-node-id='headline']")?.textContent).toContain(
      "Hello from strict mode"
    );
    expect(container.querySelector("[data-node-id='save-button']")?.textContent).toBe(
      "Save"
    );
    expect(
      container.querySelector<HTMLInputElement>("[data-node-id='name-field'] input")?.value
    ).toBe("Taylor");
    expect(container.querySelector(".modal-card")?.textContent).toContain(
      "Strict mode renderer fixture loaded."
    );
    expect(container.querySelector("[role='alert']")?.textContent).toContain("Preview Mode");
  });

  it("renders deterministic semantic structure for the checked-in fixture", () => {
    const container = document.createElement("div");

    mountRenderer(container, baselineFixtureTree);

    expect(container.querySelector("[data-scene-kind='screen']")).not.toBeNull();
    expect(
      container.querySelector("[data-node-id='profile-row']")?.getAttribute("data-role")
    ).toBe("hStack");
    expect(
      Array.from(container.querySelectorAll("[data-node-id='items-list'] .node-list-item")).map((item) =>
        item.textContent?.trim()
      )
    ).toEqual(["Messages", "Calendar"]);
    expect(
      Array.from(container.querySelectorAll<HTMLElement>("[data-node-id='tab-bar'] button")).map((tab) => ({
        id: tab.dataset.nodeId,
        selected: tab.dataset.selected ?? "false",
        label: tab.textContent?.trim(),
      }))
    ).toEqual([
      { id: "home-tab", selected: "true", label: "Home" },
      { id: "profile-tab", selected: "false", label: "Profile" },
    ]);
    expect(
      container.querySelector(".modal-card [data-node-id='welcome-modal-copy']")?.textContent
    ).toContain("Strict mode renderer fixture loaded.");
    expect(container.querySelector(".alert-card strong")?.textContent).toBe("Preview Mode");

    const semanticTreeSummary = Array.from(
      container.querySelectorAll<HTMLElement>("[data-node-id]")
    ).map((element) => `${element.dataset.nodeId}:${element.dataset.role}`);

    expect(semanticTreeSummary).toEqual([
      "root-stack:navigationStack",
      "home-screen:screen",
      "page-layout:vStack",
      "headline:text",
      "profile-row:hStack",
      "name-field:textField",
      "save-button:button",
      "items-list:list",
      "favorite-1:text",
      "favorite-2:text",
      "tab-bar:tabView",
      "home-tab:button",
      "profile-tab:button",
      "welcome-modal:modal",
      "welcome-modal-body:vStack",
      "welcome-modal-copy:text",
      "welcome-modal-button:button",
    ]);
  });

  it("exposes editable text field metadata and focusable controls through the rendered DOM", () => {
    const container = document.createElement("div");
    document.body.append(container);

    mountRenderer(container, baselineFixtureTree);

    const field = container.querySelector<HTMLElement>("[data-node-id='name-field']");
    const input = field?.querySelector<HTMLInputElement>("input");
    const saveButton = container.querySelector<HTMLButtonElement>("[data-node-id='save-button']");

    expect(field?.dataset.role).toBe("textField");
    expect(field?.dataset.metaPlaceholder).toBe("Enter name");
    expect(input?.dataset.inputNodeId).toBe("name-field");
    expect(input?.getAttribute("aria-label")).toBe("Name");
    expect(input?.placeholder).toBe("Enter name");
    expect(input?.value).toBe("Taylor");
    expect(saveButton?.type).toBe("button");
    expect(saveButton?.dataset.role).toBe("button");
    expect(saveButton?.dataset.metaVariant).toBe("primary");

    input?.focus();
    expect(document.activeElement).toBe(input);
    container.remove();
  });

  it("produces deterministic render artifact metadata for the fixed fixture", () => {
    const container = document.createElement("div");

    mountRenderer(container, baselineFixtureTree);

    expect(createRenderArtifactMetadata(baselineFixtureTree)).toEqual({
      name: "BaselineFixtureApp-baseline-screen-render",
      kind: "render",
      format: "dom",
      byteCount: 176,
      viewport: { width: 390, height: 844, scale: 1 },
      appIdentifier: "BaselineFixtureApp",
      sceneId: "baseline-screen",
      sceneKind: "screen",
      rootNodeId: "root-stack",
      nodeCount: 17,
    });
    expect(createRenderArtifactMetadata(baselineFixtureTree, {
      name: "baseline-render",
      viewport: { width: 393, height: 852, scale: 3 },
    })).toMatchObject({
      name: "baseline-render",
      kind: "render",
      format: "dom",
      byteCount: 176,
      viewport: { width: 393, height: 852, scale: 3 },
      nodeCount: container.querySelectorAll("[data-node-id]").length,
    });
  });

  it("renders deterministic native capability preview state when semantic state includes mock services", () => {
    const container = document.createElement("div");
    const treeWithNativePreview = {
      ...baselineFixtureTree,
      nativePreview: {
        permissionPrompts: [
          {
            capability: "camera",
            state: "prompt",
            result: "granted",
          },
          {
            capability: "notifications",
            state: "prompt",
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
            fixtureName: "gallery-selection",
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
      },
    } satisfies SemanticUITree & {
      nativePreview: {
        permissionPrompts: Array<{ capability: string; state: string; result: string }>;
        fixtureOutputs: Array<{ capability: string; identifier: string; fixtureName: string }>;
        locationEvents: Array<{ latitude: number; longitude: number; accuracyMeters: number }>;
        clipboard: { text: string };
        keyboard: { focusedElementID: string; keyboardType: string; returnKey: string };
        filePickerRecords: Array<{ identifier: string; selectedFiles: string[] }>;
        shareSheetRecords: Array<{ identifier: string; activityType: string; items: string[] }>;
        notificationRecords: Array<{ identifier: string; title: string; state: string }>;
      };
    };

    mountRenderer(container, treeWithNativePreview);

    expect(
      Array.from(container.querySelectorAll("[data-native-capability]")).map((card) =>
        card.getAttribute("data-native-capability")
      )
    ).toEqual([
      "camera",
      "photos",
      "location",
      "clipboard",
      "keyboardInput",
      "files",
      "shareSheet",
      "notifications",
    ]);
    expect(container.querySelector("[data-native-capability='camera']")?.textContent ?? "").toContain(
      "front-camera-still"
    );
    expect(container.querySelector("[data-native-capability='photos']")?.textContent ?? "").toContain(
      "gallery-selection"
    );
    expect(container.querySelector("[data-native-capability='location']")?.textContent ?? "").toContain(
      "40.7134"
    );
    expect(container.querySelector("[data-native-capability='clipboard']")?.textContent ?? "").toContain(
      "Draft profile notes"
    );
    expect(
      container.querySelector("[data-native-capability='keyboardInput']")?.textContent ?? ""
    ).toContain("name-field");
    expect(container.querySelector("[data-native-capability='files']")?.textContent ?? "").toContain(
      "Fixtures/profile.pdf, Fixtures/receipt.pdf"
    );
    expect(container.querySelector("[data-native-capability='shareSheet']")?.textContent ?? "").toContain(
      "share-receipt"
    );
    expect(
      container.querySelector("[data-native-capability='notifications']")?.textContent ?? ""
    ).toContain("Profile Reminder");
  });
});
