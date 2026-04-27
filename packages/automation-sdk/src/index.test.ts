import { describe, expect, it } from "vitest";

import { Emulator } from "./index";

describe("Emulator", () => {
  it("launches a fixture app and exposes semantic queries plus logs", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
    });

    expect(app).toBeDefined();
    await expect(app.logs()).resolves.toEqual([]);
    await expect(app.semanticTree()).resolves.toMatchObject({
      appIdentifier: "FixtureApp",
    });
    await expect(app.close()).resolves.toBeUndefined();
  });

  it("supports locator lookup by text, role, and stable identifier", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
    });

    const byText = app.getByText("Save");
    const byRole = app.getByRole("textField", { text: "Name" });
    const byId = app.getByTestId("name-field");

    await expect(byText.tap()).resolves.toBeUndefined();
    await expect(byRole.fill("Taylor")).resolves.toBeUndefined();
    await expect(byId.inspect()).resolves.toMatchObject({
      id: "name-field",
    });
  });
});
