import { baselineFixtureTree } from "./fixtureTree";
import { mountRenderer } from "./renderTree";
import type {
  RuntimeLiveSessionDiagnostic,
  RuntimeLiveSessionSnapshot,
} from "./types";

export interface RuntimeLiveSessionAdapterOptions {
  fallbackMode?: "demo";
  onDiagnostic?: (diagnostic: RuntimeLiveSessionDiagnostic) => void;
}

export interface RuntimeLiveSessionConnectOptions {
  sessionID: string;
  snapshots?: RuntimeLiveSessionSnapshot[];
  diagnostics?: RuntimeLiveSessionDiagnostic[];
}

export class RuntimeLiveSessionDiagnosticError extends Error {
  readonly diagnostics: RuntimeLiveSessionDiagnostic[];

  constructor(diagnostics: RuntimeLiveSessionDiagnostic[]) {
    super(diagnostics.map((diagnostic) => diagnostic.message).join("; "));
    this.name = "RuntimeLiveSessionDiagnosticError";
    this.diagnostics = diagnostics;
  }
}

export class RuntimeLiveSessionAdapter {
  readonly snapshots: RuntimeLiveSessionSnapshot[] = [];

  private readonly diagnostics: RuntimeLiveSessionDiagnostic[] = [];
  private readonly onDiagnostic?: (diagnostic: RuntimeLiveSessionDiagnostic) => void;

  constructor(
    private readonly container: HTMLElement,
    private readonly options: RuntimeLiveSessionAdapterOptions = {}
  ) {
    this.onDiagnostic = options.onDiagnostic;
  }

  async applySnapshot(snapshot: RuntimeLiveSessionSnapshot): Promise<void> {
    const latestRevision = this.snapshots.at(-1)?.revision ?? 0;
    const expectedRevision = latestRevision + 1;

    if (snapshot.revision <= latestRevision) {
      this.reportDiagnostic({
        code: "staleRevision",
        message: `Received stale live session revision ${snapshot.revision}.`,
        payload: {
          expectedRevision: String(expectedRevision),
          receivedRevision: String(snapshot.revision),
        },
      });
      return;
    }

    this.snapshots.push(snapshot);
    this.container.dataset.rendererMode = "live";
    this.container.dataset.liveSessionId = snapshot.sessionID;
    this.container.dataset.liveRevision = String(snapshot.revision);
    mountRenderer(this.container, snapshot.tree, { mode: "live" });
    this.container.dataset.rendererMode = "live";
    this.container.dataset.liveSessionId = snapshot.sessionID;
    this.container.dataset.liveRevision = String(snapshot.revision);
  }

  async showDemoFallback(): Promise<void> {
    if (this.options.fallbackMode !== "demo") {
      return;
    }

    delete this.container.dataset.liveSessionId;
    delete this.container.dataset.liveRevision;
    mountRenderer(this.container, baselineFixtureTree, { mode: "demo" });
  }

  reportDiagnostic(diagnostic: RuntimeLiveSessionDiagnostic): void {
    this.diagnostics.push(diagnostic);
    this.onDiagnostic?.(diagnostic);
    this.renderDiagnostic(diagnostic);
  }

  throwIfFailed(): void {
    if (this.diagnostics.length > 0) {
      throw new RuntimeLiveSessionDiagnosticError(this.diagnostics);
    }
  }

  private renderDiagnostic(diagnostic: RuntimeLiveSessionDiagnostic): void {
    this.container.dataset.liveDiagnosticCode = diagnostic.code;

    const document = this.container.ownerDocument;
    const status = document.createElement("div");
    status.className = "live-session-diagnostic";
    status.dataset.diagnosticCode = diagnostic.code;
    status.textContent = diagnostic.message;
    this.container.append(status);
  }
}

export interface RuntimeLiveSession {
  readonly adapter: RuntimeLiveSessionAdapter;
  readonly closed: Promise<{ sessionID: string }>;
  connect(options: RuntimeLiveSessionConnectOptions): Promise<void>;
  throwIfFailed(): void;
}

export function createRuntimeLiveSession(
  container: HTMLElement,
  options: RuntimeLiveSessionAdapterOptions = {}
): RuntimeLiveSession {
  const adapter = new RuntimeLiveSessionAdapter(container, options);
  let closeSession: (value: { sessionID: string }) => void = () => {};
  const closed = new Promise<{ sessionID: string }>((resolve) => {
    closeSession = resolve;
  });

  return {
    adapter,
    closed,
    async connect(connectOptions: RuntimeLiveSessionConnectOptions): Promise<void> {
      for (const diagnostic of connectOptions.diagnostics ?? []) {
        adapter.reportDiagnostic(diagnostic);
      }

      for (const snapshot of connectOptions.snapshots ?? []) {
        await adapter.applySnapshot(snapshot);
      }

      closeSession({ sessionID: connectOptions.sessionID });
    },
    throwIfFailed(): void {
      adapter.throwIfFailed();
    },
  };
}
