import type {
  RuntimeAutomationLogEntry,
  RuntimeAutomationSession,
  RuntimeArtifactBundle,
  RuntimeAutomationScreenshotMetadata,
  RuntimeNetworkFixture,
  RuntimeNetworkFixtureInput,
  RuntimeNetworkRequestInput,
  RuntimeNetworkRequestRecord,
  RuntimeDeviceSettings,
  RuntimeNativeCapabilityRecord,
  RuntimeTransportLaunchRequest,
  RuntimeTransportLike,
  SemanticQuery,
  SemanticUITree,
  UITreeNode,
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
  private closedSessionID?: string;

  constructor(options: RuntimeTransportClientOptions) {
    this.transport = options.transport;
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  get closed(): Promise<{ sessionID: string } | undefined> {
    return this.closedSessionID
      ? Promise.resolve({ sessionID: this.closedSessionID })
      : Promise.resolve(undefined);
  }

  async launch(options: RuntimeTransportLaunchRequest): Promise<RuntimeAutomationSession> {
    await this.withTimeout(this.transport.connect(), "connect");
    const session = await this.withTimeout(
      this.transport.request("launch", options) as Promise<RuntimeAutomationSession>,
      "launch"
    );
    this.currentSessionID = session.id;
    this.closedSessionID = undefined;
    return session;
  }

  async close(sessionID: string): Promise<{ sessionID: string }> {
    await this.withTimeout(this.transport.request("close", { sessionID }), "close", sessionID);
    await this.withTimeout(this.transport.close(), "disconnect", sessionID);
    this.currentSessionID = undefined;
    this.closedSessionID = sessionID;
    return { sessionID };
  }

  async inspect(sessionID: string, query: SemanticQuery): Promise<UITreeNode> {
    return this.command<UITreeNode>("locator.inspect", sessionID, { query });
  }

  async tap(sessionID: string, query: SemanticQuery): Promise<RuntimeAutomationSession> {
    return this.command<RuntimeAutomationSession>("locator.tap", sessionID, { query });
  }

  async fill(
    sessionID: string,
    query: SemanticQuery,
    text: string
  ): Promise<RuntimeAutomationSession> {
    return this.command<RuntimeAutomationSession>("locator.fill", sessionID, { query, text });
  }

  async logs(sessionID: string): Promise<RuntimeAutomationLogEntry[]> {
    return this.command<RuntimeAutomationLogEntry[]>("logs", sessionID);
  }

  async artifacts(sessionID: string): Promise<RuntimeArtifactBundle> {
    return this.command<RuntimeArtifactBundle>("artifacts", sessionID);
  }

  async request(
    sessionID: string,
    url: string,
    options: RuntimeNetworkRequestInput = {}
  ): Promise<RuntimeNetworkRequestRecord> {
    return this.command<RuntimeNetworkRequestRecord>("network.request", sessionID, { url, options });
  }

  async route(
    sessionID: string,
    url: string,
    fixture: RuntimeNetworkFixtureInput
  ): Promise<void> {
    await this.command<void>("network.route", sessionID, { url, fixture });
  }

  async screenshot(
    sessionID: string,
    name?: string
  ): Promise<RuntimeAutomationScreenshotMetadata> {
    return this.command<RuntimeAutomationScreenshotMetadata>("screenshot", sessionID, { name });
  }

  async semanticTree(sessionID: string): Promise<SemanticUITree> {
    return this.command<SemanticUITree>("semanticTree", sessionID);
  }

  async session(sessionID: string): Promise<RuntimeAutomationSession> {
    return this.inspectSession(sessionID);
  }

  async nativeDeviceSnapshot(sessionID: string): Promise<RuntimeDeviceSettings> {
    return this.command<RuntimeDeviceSettings>("native.device.snapshot", sessionID);
  }

  async nativeCapabilityEvents(sessionID: string): Promise<RuntimeNativeCapabilityRecord[]> {
    return this.command<RuntimeNativeCapabilityRecord[]>("native.events", sessionID);
  }

  async inspectSession(sessionID: string): Promise<RuntimeAutomationSession> {
    return this.withTimeout(
      this.transport.request("inspectSession", { sessionID }) as Promise<RuntimeAutomationSession>,
      "inspectSession",
      sessionID
    );
  }

  async sendUnsupportedCommand(command: string): Promise<never> {
    await this.withTimeout(
      this.transport.request(command, compactPayload({ sessionID: this.currentSessionID })),
      command,
      this.currentSessionID
    );
    throw new RuntimeTransportProtocolError({
      code: "unsupportedCommand",
      message: `${command} is not supported`,
      payload: { command },
    });
  }

  private command<T>(
    method: string,
    sessionID: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    return this.withTimeout(
      this.transport.request(method, { sessionID, ...params }) as Promise<T>,
      method,
      sessionID
    );
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    method: string,
    sessionID?: string
  ): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timer = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new RuntimeTransportTimeoutError(undefined, compactPayload({ method, sessionID }))),
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
  let session: RuntimeAutomationSession | undefined;
  const networkFixtures = new Map<string, RuntimeNetworkFixture>();
  let requestSequence = 0;
  let closed = false;
  return {
    async connect() {
      closed = false;
    },
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
        session = makeContractSession(request.appIdentifier, options.fixtureName);
        return cloneSession(session);
      }
      if (method === "close") {
        const sessionID = (params as { sessionID: string }).sessionID;
        requireMatchingSession(session, sessionID);
        closed = true;
        session = undefined;
        return params;
      }
      if (closed) {
        throw {
          code: "protocolViolation",
          message: "Runtime transport session is closed",
          payload: compactPayload({ sessionID: (params as { sessionID?: string }).sessionID }),
        } satisfies RuntimeTransportDiagnostic;
      }
      const liveSession = requireMatchingSession(session, (params as { sessionID: string }).sessionID);
      if (method === "inspectSession") {
        return cloneSession(liveSession);
      }
      if (method === "locator.inspect") {
        return cloneNode(findFirstMatchOrThrow(liveSession, (params as { query: SemanticQuery }).query));
      }
      if (method === "locator.tap") {
        const node = findFirstMatchOrThrow(liveSession, (params as { query: SemanticQuery }).query);
        if (node.role === "button") {
          node.label = "Saved";
        }
        updateSessionSnapshot(liveSession, (tree) => {
          tree.scene.alertPayload = { title: "Done", message: "Saved", actions: [] };
        });
        appendSessionLog(liveSession, `Tapped ${node.id}`);
        return cloneSession(liveSession);
      }
      if (method === "locator.fill") {
        const request = params as { query: SemanticQuery; text: string };
        const node = findFirstMatchOrThrow(liveSession, request.query);
        if (node.role !== "textField") {
          throw {
            code: "protocolViolation",
            message: "target is not a text field",
            payload: { sessionID: liveSession.id, nodeID: node.id },
          } satisfies RuntimeTransportDiagnostic;
        }
        node.value = request.text;
        updateSessionSnapshot(liveSession);
        appendSessionLog(liveSession, `Filled ${node.id} with ${request.text}`);
        return cloneSession(liveSession);
      }
      if (method === "logs") {
        return liveSession.logs.map((entry) => ({ ...entry }));
      }
      if (method === "artifacts") {
        return cloneArtifactBundle(liveSession.artifactBundle);
      }
      if (method === "network.route") {
        const request = params as { url: string; fixture: RuntimeNetworkFixtureInput };
        const httpMethod = request.fixture.method ?? "GET";
        networkFixtures.set(fixtureKey(httpMethod, request.url), {
          id: request.fixture.id,
          method: httpMethod,
          url: request.url,
          response: {
            status: request.fixture.status,
            headers: { ...(request.fixture.headers ?? {}) },
            bodyByteCount: byteCount(request.fixture.body),
          },
        });
        return undefined;
      }
      if (method === "network.request") {
        const request = params as { url: string; options?: RuntimeNetworkRequestInput };
        const httpMethod = request.options?.method ?? "GET";
        const fixture = networkFixtures.get(fixtureKey(httpMethod, request.url));
        const record: RuntimeNetworkRequestRecord = {
          id: `request-${++requestSequence}`,
          request: {
            method: httpMethod,
            url: request.url,
            headers: { ...(request.options?.headers ?? {}) },
            bodyByteCount: byteCount(request.options?.body),
          },
          response: fixture?.response ?? { status: 404, headers: {}, bodyByteCount: 0 },
          source: fixture ? { fixtureId: fixture.id } : { missingFixture: true },
        };
        liveSession.artifactBundle.networkRecords.push(record);
        return cloneNetworkRequestRecord(record);
      }
      if (method === "screenshot") {
        const artifact: RuntimeAutomationScreenshotMetadata = {
          name: (params as { name?: string }).name ?? liveSession.snapshot.tree.scene.id,
          format: "png",
          byteCount: 0,
          kind: "screenshot",
          viewport: { ...liveSession.device.viewport },
        };
        liveSession.artifactBundle.renderArtifacts.push(artifact);
        return { ...artifact, viewport: { ...artifact.viewport } };
      }
      if (method === "semanticTree") {
        return cloneTree(liveSession.snapshot.tree);
      }
      if (method === "native.device.snapshot") {
        return cloneDevice(liveSession.device);
      }
      if (method === "native.events") {
        return liveSession.nativeCapabilityEvents.map((record) => ({
          ...record,
          payload: { ...record.payload },
        }));
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

function compactPayload(payload: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(payload).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
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

function requireMatchingSession(
  session: RuntimeAutomationSession | undefined,
  sessionID: string
): RuntimeAutomationSession {
  if (!session || session.id !== sessionID) {
    throw {
      code: "protocolViolation",
      message: "missing session",
      payload: { sessionID },
    } satisfies RuntimeTransportDiagnostic;
  }
  return session;
}

function findFirstMatchOrThrow(session: RuntimeAutomationSession, query: SemanticQuery): UITreeNode {
  const rootNode = session.snapshot.tree.scene.rootNode;
  const match = rootNode ? findFirstMatch(rootNode, query) : null;
  if (!match) {
    throw {
      code: "protocolViolation",
      message: "no element matched the query",
      payload: { sessionID: session.id },
    } satisfies RuntimeTransportDiagnostic;
  }
  return match;
}

function findFirstMatch(node: UITreeNode, query: SemanticQuery): UITreeNode | null {
  if (
    (query.role === undefined || node.role === query.role) &&
    (query.text === undefined || node.label === query.text || node.value === query.text) &&
    (query.identifier === undefined || node.id === query.identifier)
  ) {
    return node;
  }
  for (const child of node.children) {
    const match = findFirstMatch(child, query);
    if (match) {
      return match;
    }
  }
  return null;
}

function updateSessionSnapshot(
  session: RuntimeAutomationSession,
  updateTree?: (tree: SemanticUITree) => void
): void {
  updateTree?.(session.snapshot.tree);
  session.snapshot = {
    ...session.snapshot,
    revision: session.snapshot.revision + 1,
    tree: cloneTree(session.snapshot.tree),
  };
  session.artifactBundle.semanticSnapshots.push({
    name: "baseline-tree",
    tree: cloneTree(session.snapshot.tree),
    revision: session.snapshot.revision,
  });
}

function appendSessionLog(session: RuntimeAutomationSession, message: string): void {
  const entry: RuntimeAutomationLogEntry = { level: "info", message };
  session.logs.push(entry);
  session.artifactBundle.logs.push({ ...entry });
}

function cloneSession(session: RuntimeAutomationSession): RuntimeAutomationSession {
  return {
    ...session,
    snapshot: {
      ...session.snapshot,
      tree: cloneTree(session.snapshot.tree),
      device: cloneDevice(session.snapshot.device),
    },
    logs: session.logs.map((entry) => ({ ...entry })),
    artifactBundle: cloneArtifactBundle(session.artifactBundle),
    device: cloneDevice(session.device),
    nativeCapabilities: {
      requiredCapabilities: session.nativeCapabilities.requiredCapabilities.map((item) => ({ ...item })),
      configuredMocks: session.nativeCapabilities.configuredMocks.map((item) => ({
        ...item,
        payload: { ...item.payload },
      })),
      scriptedEvents: session.nativeCapabilities.scriptedEvents.map((item) => ({
        ...item,
        payload: { ...item.payload },
      })),
      unsupportedSymbols: session.nativeCapabilities.unsupportedSymbols.map((item) => ({ ...item })),
      artifactOutputs: session.nativeCapabilities.artifactOutputs.map((item) => ({ ...item })),
    },
    nativeCapabilityState: {
      permissions: Object.fromEntries(
        Object.entries(session.nativeCapabilityState.permissions).map(([key, value]) => [
          key,
          {
            ...value,
            prompt: { ...value.prompt },
          },
        ])
      ),
      fixtureOutputs: session.nativeCapabilityState.fixtureOutputs.map((item) => ({
        ...item,
        payload: { ...item.payload },
      })),
      locationEvents: session.nativeCapabilityState.locationEvents.map((item) => ({
        ...item,
        payload: { ...item.payload },
      })),
      clipboard: session.nativeCapabilityState.clipboard
        ? {
            ...session.nativeCapabilityState.clipboard,
            readRecords: session.nativeCapabilityState.clipboard.readRecords.map((item) => ({
              ...item,
              payload: { ...item.payload },
            })),
            writeRecords: session.nativeCapabilityState.clipboard.writeRecords.map((item) => ({
              ...item,
              payload: { ...item.payload },
            })),
            payload: { ...session.nativeCapabilityState.clipboard.payload },
          }
        : undefined,
      keyboard: session.nativeCapabilityState.keyboard
        ? {
            ...session.nativeCapabilityState.keyboard,
            inputTraits: session.nativeCapabilityState.keyboard.inputTraits.map((item) => ({
              ...item,
              payload: { ...item.payload },
            })),
            eventRecords: cloneNativeRecords(session.nativeCapabilityState.keyboard.eventRecords),
            payload: { ...session.nativeCapabilityState.keyboard.payload },
          }
        : undefined,
      filePickerRecords: session.nativeCapabilityState.filePickerRecords.map((item) => ({
        ...item,
        selectedFiles: [...item.selectedFiles],
        contentTypes: [...item.contentTypes],
        payload: { ...item.payload },
      })),
      shareSheetRecords: session.nativeCapabilityState.shareSheetRecords.map((item) => ({
        ...item,
        items: [...item.items],
        excludedActivityTypes: [...item.excludedActivityTypes],
        payload: { ...item.payload },
      })),
      notificationRecords: session.nativeCapabilityState.notificationRecords.map((item) => ({
        ...item,
        payload: { ...item.payload },
      })),
      diagnosticRecords: session.nativeCapabilityState.diagnosticRecords.map((item) => ({
        ...item,
        payload: { ...item.payload },
      })),
    },
    nativeCapabilityEvents: cloneNativeRecords(session.nativeCapabilityEvents),
  };
}

function cloneArtifactBundle(bundle: RuntimeArtifactBundle): RuntimeArtifactBundle {
  return {
    sessionID: bundle.sessionID,
    renderArtifacts: bundle.renderArtifacts.map((item) => ({
      ...item,
      viewport: { ...item.viewport },
    })),
    semanticSnapshots: bundle.semanticSnapshots.map((item) => ({
      name: item.name,
      tree: cloneTree(item.tree),
      revision: item.revision,
    })),
    logs: bundle.logs.map((entry) => ({ ...entry })),
    networkRecords: bundle.networkRecords.map(cloneNetworkRequestRecord),
    nativeCapabilityRecords: cloneNativeRecords(bundle.nativeCapabilityRecords),
  };
}

function cloneNetworkRequestRecord(record: RuntimeNetworkRequestRecord): RuntimeNetworkRequestRecord {
  return {
    id: record.id,
    request: {
      method: record.request.method,
      url: record.request.url,
      headers: { ...record.request.headers },
      bodyByteCount: record.request.bodyByteCount,
    },
    response: {
      status: record.response.status,
      headers: { ...record.response.headers },
      bodyByteCount: record.response.bodyByteCount,
    },
    source: { ...record.source },
  };
}

function cloneNativeRecords(records: RuntimeNativeCapabilityRecord[]): RuntimeNativeCapabilityRecord[] {
  return records.map((record) => ({
    ...record,
    payload: { ...record.payload },
  }));
}

function cloneDevice(device: RuntimeDeviceSettings): RuntimeDeviceSettings {
  return {
    viewport: { ...device.viewport },
    colorScheme: device.colorScheme,
    locale: device.locale,
    clock: { ...device.clock },
    geolocation: device.geolocation ? { ...device.geolocation } : undefined,
    network: { ...device.network },
  };
}

function cloneTree(tree: SemanticUITree): SemanticUITree {
  return {
    ...tree,
    scene: {
      ...tree.scene,
      rootNode: tree.scene.rootNode ? cloneNode(tree.scene.rootNode) : undefined,
      navigationState: tree.scene.navigationState
        ? {
            stackIdentifiers: [...tree.scene.navigationState.stackIdentifiers],
            selectedIdentifier: tree.scene.navigationState.selectedIdentifier,
          }
        : undefined,
      modalState: tree.scene.modalState
        ? {
            isPresented: tree.scene.modalState.isPresented,
            presentedNode: tree.scene.modalState.presentedNode
              ? cloneNode(tree.scene.modalState.presentedNode)
              : undefined,
          }
        : undefined,
      tabState: tree.scene.tabState
        ? {
            tabIdentifiers: [...tree.scene.tabState.tabIdentifiers],
            selectedIdentifier: tree.scene.tabState.selectedIdentifier,
          }
        : undefined,
      alertPayload: tree.scene.alertPayload
        ? {
            title: tree.scene.alertPayload.title,
            message: tree.scene.alertPayload.message,
            actions: [...tree.scene.alertPayload.actions],
          }
        : undefined,
    },
  };
}

function cloneNode(node: UITreeNode): UITreeNode {
  return {
    ...node,
    metadata: { ...node.metadata },
    children: node.children.map(cloneNode),
  };
}

function fixtureKey(method: string, url: string): string {
  return `${method.toUpperCase()} ${url}`;
}

function byteCount(body: unknown): number {
  if (body === undefined || body === null) {
    return 0;
  }
  if (typeof body === "string") {
    return Buffer.byteLength(body);
  }
  if (body instanceof Uint8Array) {
    return body.byteLength;
  }
  return Buffer.byteLength(JSON.stringify(body));
}
