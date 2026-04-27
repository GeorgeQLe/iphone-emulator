import { describe, expect, it } from "vitest";

import { baselineFixtureTree } from "./fixtureTree";
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
});
