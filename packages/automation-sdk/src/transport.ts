import type {
  RuntimeAutomationLogEntry,
  RuntimeAutomationSession,
  RuntimeTransportLaunchRequest,
  RuntimeTransportLike,
} from "./types";

export type RuntimeTransportDiagnosticCode =
  | "connectionFailure"
  | "timeout"
  | "unsupportedCommand"
  | "protocolViolation"
  | "staleRevision";

export interface RuntimeTransportDiagnostic {
  code: RuntimeTransportDiagnosticCode;
  message: string;
  sessionID?: string;
  requestID?: string;
  payload: Record<string, string>;
}

export interface RuntimeTransport {
  connect(): Promise<void>;
  request(method: string, params: unknown): Promise<unknown>;
  close(): Promise<void>;
}

export interface RuntimeTransportClientOptions {
  transport: RuntimeTransport;
  timeoutMs?: number;
}

export class RuntimeTransportError extends Error {
  readonly code: RuntimeTransportDiagnosticCode;
  readonly payload: Record<string, string>;

  constructor(
    name: string,
    code: RuntimeTransportDiagnosticCode,
    message: string,
    payload: Record<string, string> = {}
  ) {
    super(message);
    this.name = name;
    this.code = code;
    this.payload = payload;
  }
}

export class RuntimeTransportConnectionError extends RuntimeTransportError {
  constructor(message = "Runtime transport connection failed", payload: Record<string, string> = {}) {
    super("RuntimeTransportConnectionError", "connectionFailure", message, payload);
  }
}

export class RuntimeTransportTimeoutError extends RuntimeTransportError {
  constructor(message = "Runtime transport request timed out", payload: Record<string, string> = {}) {
    super("RuntimeTransportTimeoutError", "timeout", message, payload);
  }
}

export class RuntimeTransportProtocolError extends RuntimeTransportError {
  constructor(diagnostic: RuntimeTransportDiagnostic) {
    super(
      "RuntimeTransportProtocolError",
      diagnostic.code,
      diagnostic.message,
      diagnostic.payload
    );
  }
}

export class RuntimeTransportClient implements RuntimeTransportLike {
  private readonly transport: RuntimeTransport;
  private readonly timeoutMs: number;
  private currentSessionID?: string;

  constructor(options: RuntimeTransportClientOptions) {
    this.transport = options.transport;
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  get closed(): Promise<{ sessionID: string } | undefined> {
    return this.currentSessionID
      ? Promise.resolve({ sessionID: this.currentSessionID })
      : Promise.resolve(undefined);
  }

  async launch(options: RuntimeTransportLaunchRequest): Promise<RuntimeAutomationSession> {
    const session = await this.withTimeout(
      this.transport.request("launch", options) as Promise<RuntimeAutomationSession>
    );
    this.currentSessionID = session.id;
    return session;
  }

  async close(sessionID: string): Promise<{ sessionID: string }> {
    await this.withTimeout(this.transport.request("close", { sessionID }));
    this.currentSessionID = sessionID;
    return { sessionID };
  }

  async inspectSession(sessionID: string): Promise<RuntimeAutomationSession> {
    return this.withTimeout(
      this.transport.request("inspectSession", { sessionID }) as Promise<RuntimeAutomationSession>
    );
  }

  async sendUnsupportedCommand(command: string): Promise<never> {
    await this.withTimeout(this.transport.request(command, {}));
    throw new RuntimeTransportProtocolError({
      code: "unsupportedCommand",
      message: `${command} is not supported`,
      payload: { command },
    });
  }

  private async withTimeout<T>(operation: Promise<T>): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timer = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new RuntimeTransportTimeoutError()),
        this.timeoutMs
      );
    });

    try {
      return await Promise.race([operation, timer]);
    } catch (error) {
      if (error instanceof RuntimeTransportError) {
        throw error;
      }
      if (isDiagnostic(error)) {
        throw new RuntimeTransportProtocolError(error);
      }
      throw error;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}

export interface InMemoryRuntimeTransportOptions {
  fixtureName: string;
  stall?: boolean;
  diagnostics?: RuntimeTransportDiagnostic[];
}

export function createInMemoryRuntimeTransport(
  options: InMemoryRuntimeTransportOptions
): RuntimeTransport {
  const diagnostics = [...(options.diagnostics ?? [])];
  return {
    async connect() {},
    async request(method: string, params: unknown) {
      if (options.stall) {
        return new Promise(() => undefined);
      }
      const diagnostic = diagnostics.find((candidate) => {
        if (method === "inspectSession" && candidate.code === "protocolViolation") {
          return true;
        }
        return candidate.payload.command === method;
      });
      if (diagnostic) {
        throw diagnostic;
      }
      if (method === "launch") {
        const request = params as RuntimeTransportLaunchRequest;
        return makeContractSession(request.appIdentifier, options.fixtureName);
      }
      if (method === "close") {
        return params;
      }
      throw {
        code: "unsupportedCommand",
        message: `${method} is not supported`,
        payload: { command: method },
      } satisfies RuntimeTransportDiagnostic;
    },
    async close() {},
  };
}

export function createWebSocketRuntimeTransport(options: { url: string }): RuntimeTransport {
  return {
    async connect() {
      throw new RuntimeTransportConnectionError("Runtime WebSocket transport is not implemented.", {
        url: options.url,
      });
    },
    async request() {
      throw new RuntimeTransportConnectionError("Runtime WebSocket transport is not connected.", {
        url: options.url,
      });
    },
    async close() {},
  };
}

function makeContractSession(
  appIdentifier: string,
  fixtureName: string
): RuntimeAutomationSession {
  const logs: RuntimeAutomationLogEntry[] = [
    { level: "info", message: `Launched fixture ${fixtureName}` },
  ];
  return {
    id: "session-1",
    appIdentifier,
    snapshot: {
      appIdentifier,
      lifecycleState: "active",
      revision: 1,
      device: defaultDevice(),
      tree: {
        appIdentifier,
        scene: {
          id: "baseline-screen",
          kind: "screen",
          rootNode: {
            id: "root-stack",
            role: "vStack",
            children: [
              {
                id: "name-field",
                role: "textField",
                label: "Name",
                value: "Taylor",
                children: [],
                metadata: {},
              },
              {
                id: "save-button",
                role: "button",
                label: "Save",
                children: [],
                metadata: {},
              },
            ],
            metadata: {},
          },
        },
      },
    },
    logs,
    artifactBundle: {
      sessionID: "session-1",
      renderArtifacts: [],
      semanticSnapshots: [
        {
          name: "baseline-tree",
          tree: {
            appIdentifier,
            scene: {
              id: "baseline-screen",
              kind: "screen",
              rootNode: {
                id: "root-stack",
                role: "vStack",
                children: [
                  {
                    id: "name-field",
                    role: "textField",
                    label: "Name",
                    value: "Taylor",
                    children: [],
                    metadata: {},
                  },
                  {
                    id: "save-button",
                    role: "button",
                    label: "Save",
                    children: [],
                    metadata: {},
                  },
                ],
                metadata: {},
              },
            },
          },
          revision: 1,
        },
      ],
      logs: logs.map((entry) => ({ ...entry })),
      networkRecords: [],
      nativeCapabilityRecords: [],
    },
    device: defaultDevice(),
    nativeCapabilities: {
      requiredCapabilities: [],
      configuredMocks: [],
      scriptedEvents: [],
      unsupportedSymbols: [],
      artifactOutputs: [],
    },
    nativeCapabilityState: {
      permissions: {},
      fixtureOutputs: [],
      locationEvents: [],
      filePickerRecords: [],
      shareSheetRecords: [],
      notificationRecords: [],
      diagnosticRecords: [],
    },
    nativeCapabilityEvents: [],
  };
}

function defaultDevice() {
  return {
    viewport: { width: 390, height: 844, scale: 1 },
    colorScheme: "light" as const,
    locale: "en_US",
    clock: { timeZone: "UTC" },
    network: { isOnline: true, latencyMilliseconds: 0, downloadKbps: 0 },
  };
}

function isDiagnostic(error: unknown): error is RuntimeTransportDiagnostic {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "payload" in error
  );
}
