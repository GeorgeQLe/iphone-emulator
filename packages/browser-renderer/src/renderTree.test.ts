import { describe, expect, it } from "vitest";

import { baselineFixtureTree } from "./fixtureTree";
import { createRenderArtifactMetadata } from "./renderArtifacts";
import { mountRenderer } from "./renderTree";

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
});
