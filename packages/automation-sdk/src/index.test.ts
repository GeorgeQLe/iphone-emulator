import { describe, expect, it } from "vitest";

import { Emulator } from "./index";

describe("Emulator", () => {
  it("runs a representative fixture-backed automation flow", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
    });

    expect(app).toBeDefined();
    await expect(app.logs()).resolves.toEqual([]);

    const saveButton = app.getByText("Save");
    const nameFieldByRole = app.getByRole("textField", { text: "Name" });
    const nameFieldById = app.getByTestId("name-field");

    await expect(saveButton.inspect()).resolves.toMatchObject({
      id: "save-button",
      role: "button",
      label: "Save",
    });
    await expect(nameFieldByRole.inspect()).resolves.toMatchObject({
      id: "name-field",
      role: "textField",
      label: "Name",
      value: "Taylor",
    });

    await expect(saveButton.tap()).resolves.toBeUndefined();
    await expect(nameFieldByRole.fill("Jordan")).resolves.toBeUndefined();

    await expect(nameFieldById.inspect()).resolves.toMatchObject({
      id: "name-field",
      role: "textField",
      value: "Jordan",
    });
    await expect(app.semanticTree()).resolves.toMatchObject({
      appIdentifier: "FixtureApp",
      scene: {
        id: "baseline-screen",
        rootNode: {
          id: "root-stack",
        },
        alertPayload: {
          title: "Done",
          message: "Saved",
        },
      },
    });
    await expect(app.logs()).resolves.toEqual([
      { level: "info", message: "Tapped save-button" },
      { level: "info", message: "Filled name-field with Jordan" },
    ]);
    await expect(app.screenshot("baseline-home")).resolves.toMatchObject({
      name: "baseline-home",
      format: "png",
      byteCount: 0,
      kind: "screenshot",
    });
    await expect(app.close()).resolves.toBeUndefined();
  });

  it("exposes deterministic artifacts, network fixtures, and device launch options", async () => {
    const app = await Emulator.launch({
      appIdentifier: "FixtureApp",
      fixtureName: "strict-mode-baseline",
      device: {
        viewport: { width: 393, height: 852, scale: 3 },
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          frozenAtISO8601: "2026-04-27T14:00:00Z",
          timeZone: "America/New_York",
        },
        geolocation: { latitude: 40.7128, longitude: -74.006, accuracyMeters: 12 },
        network: { isOnline: true, latencyMilliseconds: 25, downloadKbps: 1500 },
      },
    });

    await expect(app.route("https://example.test/profile", {
      id: "profile-success",
      method: "GET",
      status: 200,
      headers: { "content-type": "application/json" },
      body: { name: "Taylor" },
    })).resolves.toBeUndefined();
    await expect(app.request("https://example.test/profile", {
      method: "GET",
      headers: { accept: "application/json" },
    })).resolves.toMatchObject({
      id: "request-1",
      request: {
        method: "GET",
        url: "https://example.test/profile",
      },
      response: {
        status: 200,
        bodyByteCount: 17,
      },
      source: { fixtureId: "profile-success" },
    });

    await expect(app.artifacts()).resolves.toMatchObject({
      sessionID: "session-1",
      renderArtifacts: [
        {
          name: "baseline-home",
          kind: "screenshot",
          viewport: { width: 393, height: 852, scale: 3 },
        },
      ],
      semanticSnapshots: [
        {
          name: "baseline-tree",
          revision: 1,
        },
      ],
      networkRecords: [
        {
          source: { fixtureId: "profile-success" },
        },
      ],
    });
    await expect(app.session()).resolves.toMatchObject({
      device: {
        colorScheme: "dark",
        locale: "en_US",
        clock: {
          timeZone: "America/New_York",
        },
        network: {
          latencyMilliseconds: 25,
        },
      },
    });
  });
});
