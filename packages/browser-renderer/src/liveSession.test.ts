import { describe, expect, it, vi } from "vitest";

import {
  RuntimeLiveSessionAdapter,
  RuntimeLiveSessionDiagnosticError,
  createRuntimeLiveSession,
} from "./liveSession";
import type { SemanticUITree } from "./types";

const firstSnapshot: SemanticUITree = {
  appIdentifier: "FixtureApp",
  scene: {
    id: "baseline-screen",
    kind: "screen",
    rootNode: {
      id: "root-stack",
      role: "vStack",
      label: "Profile",
      children: [
        { id: "headline", role: "text", label: "Hello from live runtime", children: [], metadata: {} },
        { id: "name-field", role: "textField", label: "Name", value: "Taylor", children: [], metadata: {} },
        { id: "save-button", role: "button", label: "Save", children: [], metadata: {} },
      ],
      metadata: {},
    },
  },
};

const secondSnapshot: SemanticUITree = {
  ...firstSnapshot,
  scene: {
    ...firstSnapshot.scene,
    rootNode: {
      ...firstSnapshot.scene.rootNode!,
      children: [
        firstSnapshot.scene.rootNode!.children[0],
        {
          ...firstSnapshot.scene.rootNode!.children[1],
          value: "Jordan",
        },
        firstSnapshot.scene.rootNode!.children[2],
      ],
    },
    alertPayload: {
      title: "Done",
      message: "Saved",
      actions: ["OK"],
    },
  },
};

describe("RuntimeLiveSessionAdapter", () => {
  it("renders semantic tree snapshots from the transport without source lowering", async () => {
    const container = document.createElement("div");
    const adapter = new RuntimeLiveSessionAdapter(container);

    await adapter.applySnapshot({
      sessionID: "session-1",
      revision: 1,
      tree: firstSnapshot,
      source: "transport",
    });
    await adapter.applySnapshot({
      sessionID: "session-1",
      revision: 2,
      tree: secondSnapshot,
      source: "transport",
    });

    expect(container.dataset.rendererMode).toBe("live");
    expect(container.dataset.liveSessionId).toBe("session-1");
    expect(container.dataset.liveRevision).toBe("2");
    expect(container.querySelector("[data-app-id='FixtureApp']")).not.toBeNull();
    expect(container.querySelector("[data-node-id='headline']")?.textContent).toContain(
      "Hello from live runtime"
    );
    expect(
      container.querySelector<HTMLInputElement>("[data-node-id='name-field'] input")?.value
    ).toBe("Jordan");
    expect(container.querySelector("[role='alert']")?.textContent).toContain("Saved");
    expect(adapter.snapshots.map((snapshot) => snapshot.revision)).toEqual([1, 2]);
  });

  it("keeps demo mode available as a separate fallback path", async () => {
    const container = document.createElement("div");
    const adapter = new RuntimeLiveSessionAdapter(container, { fallbackMode: "demo" });

    await adapter.showDemoFallback();

    expect(container.dataset.rendererMode).toBe("demo");
    expect(container.dataset.liveSessionId).toBeUndefined();
    expect(container.querySelector("[data-app-id='BaselineFixtureApp']")).not.toBeNull();
    expect(adapter.snapshots).toEqual([]);
  });

  it("reports structured diagnostics for connection, protocol, stale revision, and close events", async () => {
    const onDiagnostic = vi.fn();
    const container = document.createElement("div");
    const session = createRuntimeLiveSession(container, { onDiagnostic });

    await session.connect({
      sessionID: "session-1",
      snapshots: [
        { sessionID: "session-1", revision: 2, tree: firstSnapshot, source: "transport" },
        { sessionID: "session-1", revision: 1, tree: secondSnapshot, source: "transport" },
      ],
      diagnostics: [
        { code: "connectionFailure", message: "socket closed", payload: { url: "ws://localhost/runtime" } },
        { code: "protocolViolation", message: "missing id", payload: { envelope: "event" } },
      ],
    });

    await expect(session.closed).resolves.toEqual({ sessionID: "session-1" });
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: "connectionFailure", payload: { url: "ws://localhost/runtime" } })
    );
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: "protocolViolation", payload: { envelope: "event" } })
    );
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: "staleRevision", payload: { expectedRevision: "3", receivedRevision: "1" } })
    );
    expect(() => session.throwIfFailed()).toThrow(RuntimeLiveSessionDiagnosticError);
  });
});
