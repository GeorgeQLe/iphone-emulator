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
  RuntimeNativeAutomationAction,
  RuntimeNativeAutomationResult,
  RuntimeNativeCapabilityRecord,
  RuntimeNativeCapabilityManifest,
  RuntimeNativeCapabilityState,
  RuntimeNativeClipboardState,
  RuntimeNativeDiagnosticRecord,
  RuntimeNativePermissionState,
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

  async nativeAutomation(
    sessionID: string,
    expectedSemanticRevision: number,
    action: RuntimeNativeAutomationAction
  ): Promise<RuntimeNativeAutomationResult> {
    return this.command<RuntimeNativeAutomationResult>("native.automation", sessionID, {
      expectedSemanticRevision,
      action,
    });
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
        session = makeContractSession(request);
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
      if (method === "native.automation") {
        return applyNativeAutomation(liveSession, params);
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

function makeContractSession(request: RuntimeTransportLaunchRequest): RuntimeAutomationSession {
  const appIdentifier = request.appIdentifier;
  const fixtureName = request.fixtureName;
  const logs: RuntimeAutomationLogEntry[] = [
    { level: "info", message: `Launched fixture ${fixtureName}` },
  ];
  const device = request.device ? cloneDevice(request.device) : defaultDevice();
  const nativeCapabilities = cloneNativeManifest(
    request.nativeCapabilities ?? emptyNativeManifest()
  );
  const nativeCapabilityState = deriveNativeState(nativeCapabilities);
  const initialNativeRecords = nativeCapabilityState.fixtureOutputs.map((fixture) => ({
    capability: fixture.capability,
    name: `native.fixture.${fixture.capability}.${fixture.identifier}`,
    revision: 1,
    payload: { identifier: fixture.identifier, ...fixture.payload },
  }));
  const initialNativeEvents = [
    ...nativeCapabilities.requiredCapabilities
      .filter((requirement) => requirement.permissionState === "prompt")
      .map((requirement) => ({
        capability: requirement.id,
        name: `native.permission.${requirement.id}.prompt`,
        revision: 1,
        payload: { capability: requirement.id, state: "prompt" },
      })),
    ...initialNativeRecords,
  ];
  return {
    id: "session-1",
    appIdentifier,
    snapshot: {
      appIdentifier,
      lifecycleState: "active",
      revision: 1,
      device: cloneDevice(device),
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
      nativeCapabilityRecords: cloneNativeRecords(initialNativeRecords),
    },
    device: cloneDevice(device),
    nativeCapabilities,
    nativeCapabilityState,
    nativeCapabilityEvents: cloneNativeRecords(initialNativeEvents),
  };
}

function applyNativeAutomation(
  session: RuntimeAutomationSession,
  params: unknown
): RuntimeNativeAutomationResult {
  const request = parseNativeAutomationRequest(params, session.id);
  if (request.expectedSemanticRevision !== session.snapshot.revision) {
    throw {
      code: "staleRevision",
      message: "semantic revision is stale",
      payload: {
        sessionID: session.id,
        expectedSemanticRevision: String(request.expectedSemanticRevision),
        actualSemanticRevision: String(session.snapshot.revision),
      },
    } satisfies RuntimeTransportDiagnostic;
  }

  const action = request.action;
  switch (action.type) {
    case "requestPermission": {
      const permission = ensureNativePermission(session, action.capability);
      const initialState = permission.state;
      const result = permission.prompt.result;
      const requestedState = result ?? permission.resolvedState;
      permission.state = requestedState;
      permission.resolvedState = requestedState;
      permission.prompt = {
        presented: requestedState === "prompt",
        result: requestedState === "prompt" ? result : undefined,
      };
      const name =
        action.capability === "notifications"
          ? "native.notifications.authorization.request"
          : `native.permission.${action.capability}.request`;
      return appendNativeRecord(session, action.capability, name, {
        initialState,
        state: permission.state,
        result,
        resolvedState: permission.resolvedState,
      });
    }
    case "setPermission": {
      const permission = ensureNativePermission(session, action.capability);
      permission.state = action.state;
      permission.resolvedState = action.state;
      permission.prompt = { presented: action.state === "prompt", result: undefined };
      return appendNativeRecord(session, action.capability, `native.permission.${action.capability}.set`, {
        state: action.state,
        resolvedState: permission.resolvedState,
      });
    }
    case "captureCamera":
      return nativeFixtureRecord(session, "camera", action.identifier ?? "front-camera-still", "capture");
    case "selectPhoto":
      return nativeFixtureRecord(session, "photos", action.identifier ?? "recent-library-pick", "selection");
    case "currentLocation": {
      const permission = ensureNativePermission(session, "location");
      if (permission.resolvedState !== "granted") {
        const diagnostic = appendNativeDiagnostic(session, "location", "permissionDenied", {
          permissionState: permission.resolvedState,
        });
        return {
          permissionState: permission.resolvedState,
          diagnostic,
        };
      }
      const latestLocation = session.nativeCapabilityState.locationEvents.at(-1);
      const coordinate = latestLocation
        ? {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            accuracyMeters: latestLocation.accuracyMeters,
          }
        : session.device.geolocation
          ? { ...session.device.geolocation }
          : undefined;
      return coordinate ? { permissionState: permission.resolvedState, coordinate } : { permissionState: permission.resolvedState };
    }
    case "updateLocation": {
      const identifier = action.identifier ?? "automation";
      const record = appendNativeRecord(session, "location", `native.location.update.${identifier}`, {
        identifier,
        latitude: String(action.latitude),
        longitude: String(action.longitude),
        accuracyMeters: String(action.accuracyMeters ?? 0),
      });
      session.nativeCapabilityState.locationEvents.push({
        name: identifier,
        latitude: action.latitude,
        longitude: action.longitude,
        accuracyMeters: action.accuracyMeters ?? 0,
        revision: record.revision,
        payload: { ...record.payload },
      });
      return record;
    }
    case "readClipboard": {
      const clipboard = ensureNativeClipboard(session);
      const text = clipboard.currentText ?? clipboard.text ?? clipboard.initialText;
      const identifier = action.identifier ?? clipboard.identifier;
      const record = appendNativeRecord(session, "clipboard", `native.clipboard.read.${identifier}`, {
        identifier: clipboard.identifier,
        text,
      });
      clipboard.readRecords.push({ name: `${identifier}-read`, revision: record.revision, text, payload: { ...record.payload } });
      return { text, record };
    }
    case "writeClipboard": {
      const clipboard = ensureNativeClipboard(session);
      const identifier = action.identifier ?? clipboard.identifier;
      const record = appendNativeRecord(session, "clipboard", `native.clipboard.write.${identifier}`, {
        identifier: clipboard.identifier,
        text: action.text,
      });
      clipboard.text = action.text;
      clipboard.currentText = action.text;
      clipboard.writeRecords.push({ name: `${identifier}-write`, revision: record.revision, text: action.text, payload: { ...record.payload } });
      return record;
    }
    case "selectFiles": {
      const identifier = action.identifier ?? "document-picker";
      const file = session.nativeCapabilityState.filePickerRecords.find((candidate) => candidate.identifier === identifier);
      if (!file) {
        const record = appendNativeDiagnosticRecord(session, "files", "missingFixture", { fixtureIdentifier: identifier });
        return { selectedFiles: [], record };
      }
      const record = appendNativeRecord(session, "files", `native.files.selection.${identifier}`, {
        identifier,
        selectedFiles: file.selectedFiles.join(","),
        contentTypes: file.contentTypes.join(","),
        allowsMultipleSelection: String(file.allowsMultipleSelection),
        ...file.payload,
      });
      return { selectedFiles: [...file.selectedFiles], record };
    }
    case "completeShareSheet": {
      const identifier = action.identifier ?? "share-receipt";
      const share = session.nativeCapabilityState.shareSheetRecords.find((candidate) => candidate.identifier === identifier);
      if (!share) {
        return appendNativeDiagnosticRecord(session, "shareSheet", "missingFixture", { fixtureIdentifier: identifier });
      }
      share.completionState = action.completionState ?? share.completionState ?? "completed";
      return appendNativeRecord(session, "shareSheet", `native.shareSheet.complete.${identifier}`, {
        identifier,
        activityType: action.activityType ?? share.activityType,
        items: (action.items ?? share.items).join(","),
        excludedActivityTypes: share.excludedActivityTypes.join(","),
        ...share.payload,
        completionState: share.completionState,
      });
    }
    case "scheduleNotification":
    case "deliverNotification": {
      const identifier = action.identifier ?? "profile-reminder";
      const existing = session.nativeCapabilityState.notificationRecords.find((candidate) => candidate.identifier === identifier);
      const event = action.type === "scheduleNotification" ? "schedule" : "deliver";
      const state = event === "schedule" ? "scheduled" : "delivered";
      const permission = ensureNativePermission(session, "notifications");
      const record = appendNativeRecord(session, "notifications", `native.notifications.${event}.${identifier}`, {
        identifier,
        title: action.title ?? existing?.title,
        body: action.body ?? existing?.body,
        trigger: action.type === "scheduleNotification" ? action.trigger ?? existing?.trigger : existing?.trigger,
        state,
        authorizationState: permission.resolvedState,
        ...(existing?.payload ?? {}),
      });
      session.nativeCapabilityState.notificationRecords.push({
        identifier,
        title: action.title ?? existing?.title,
        body: action.body ?? existing?.body,
        trigger: action.type === "scheduleNotification" ? action.trigger ?? existing?.trigger : existing?.trigger,
        state,
        authorizationState: permission.resolvedState,
        revision: record.revision,
        payload: { ...record.payload },
      });
      return record;
    }
    case "snapshotDeviceEnvironment":
      appendNativeRecord(session, "deviceEnvironment", "native.deviceEnvironment.snapshot", devicePayload(session.device));
      return cloneDevice(session.device);
  }
}

function parseNativeAutomationRequest(
  params: unknown,
  sessionID: string
): { expectedSemanticRevision: number; action: RuntimeNativeAutomationAction } {
  if (typeof params !== "object" || params === null) {
    throw nativeAutomationProtocolViolation(sessionID, "native automation params must be an object", {
      reason: "malformedParams",
    });
  }

  const candidate = params as {
    expectedSemanticRevision?: unknown;
    action?: unknown;
  };
  if (typeof candidate.expectedSemanticRevision !== "number") {
    throw nativeAutomationProtocolViolation(sessionID, "native automation expected revision is required", {
      reason: "missingExpectedSemanticRevision",
    });
  }
  if (typeof candidate.action !== "object" || candidate.action === null) {
    throw nativeAutomationProtocolViolation(sessionID, "native automation action must be an object", {
      reason: "malformedAction",
    });
  }

  const action = candidate.action as { type?: unknown };
  if (typeof action.type !== "string") {
    throw nativeAutomationProtocolViolation(sessionID, "native automation action type is required", {
      reason: "missingActionType",
    });
  }
  if (!isSupportedNativeAutomationActionType(action.type)) {
    throw {
      code: "unsupportedCommand",
      message: `native automation action ${action.type} is not supported`,
      payload: { sessionID, command: "native.automation", nativeAction: action.type },
    } satisfies RuntimeTransportDiagnostic;
  }

  return {
    expectedSemanticRevision: candidate.expectedSemanticRevision,
    action: candidate.action as RuntimeNativeAutomationAction,
  };
}

function nativeAutomationProtocolViolation(
  sessionID: string,
  message: string,
  payload: Record<string, string>
): RuntimeTransportDiagnostic {
  return {
    code: "protocolViolation",
    message,
    payload: { sessionID, command: "native.automation", ...payload },
  };
}

function isSupportedNativeAutomationActionType(type: string): type is RuntimeNativeAutomationAction["type"] {
  return (
    type === "requestPermission" ||
    type === "setPermission" ||
    type === "captureCamera" ||
    type === "selectPhoto" ||
    type === "updateLocation" ||
    type === "currentLocation" ||
    type === "readClipboard" ||
    type === "writeClipboard" ||
    type === "selectFiles" ||
    type === "completeShareSheet" ||
    type === "scheduleNotification" ||
    type === "deliverNotification" ||
    type === "snapshotDeviceEnvironment"
  );
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

function emptyNativeManifest(): RuntimeNativeCapabilityManifest {
  return {
    requiredCapabilities: [],
    configuredMocks: [],
    scriptedEvents: [],
    unsupportedSymbols: [],
    artifactOutputs: [],
  };
}

function cloneNativeManifest(manifest: RuntimeNativeCapabilityManifest): RuntimeNativeCapabilityManifest {
  return {
    requiredCapabilities: manifest.requiredCapabilities.map((item) => ({ ...item })),
    configuredMocks: manifest.configuredMocks.map((item) => ({
      ...item,
      payload: { ...item.payload },
    })),
    scriptedEvents: manifest.scriptedEvents.map((item) => ({
      ...item,
      payload: { ...item.payload },
    })),
    unsupportedSymbols: manifest.unsupportedSymbols.map((item) => ({ ...item })),
    artifactOutputs: manifest.artifactOutputs.map((item) => ({ ...item })),
  };
}

function deriveNativeState(
  manifest: RuntimeNativeCapabilityManifest
): RuntimeNativeCapabilityState {
  const permissions = Object.fromEntries(
    manifest.requiredCapabilities.map((requirement) => {
      const promptResult = manifest.configuredMocks.find(
        (mock) => mock.capability === requirement.id && mock.payload.result
      )?.payload.result as RuntimeNativePermissionState | undefined;
      const resolvedState = resolveNativePermissionState(requirement.permissionState, promptResult);
      return [
        requirement.id,
        {
          state: requirement.permissionState,
          resolvedState,
          strictModeAlternative: requirement.strictModeAlternative,
          prompt: {
            presented: requirement.permissionState === "prompt",
            result: promptResult,
          },
        },
      ];
    })
  );

  return {
    permissions,
    fixtureOutputs: manifest.configuredMocks
      .filter((mock) => mock.capability === "camera" || mock.capability === "photos")
      .map((mock) => ({
        capability: mock.capability,
        identifier: mock.identifier,
        fixtureName: mock.payload.fixtureName,
        payload: { ...mock.payload },
      })),
    locationEvents: manifest.scriptedEvents
      .filter((event) => event.capability === "location")
      .map((event) => ({
        name: event.name,
        latitude: Number(event.payload.latitude ?? 0),
        longitude: Number(event.payload.longitude ?? 0),
        accuracyMeters: Number(event.payload.accuracyMeters ?? 0),
        revision: event.atRevision,
        payload: { ...event.payload },
      })),
    clipboard: clipboardStateFromManifest(manifest),
    filePickerRecords: manifest.configuredMocks
      .filter((mock) => mock.capability === "files")
      .map((mock) => ({
        identifier: mock.identifier,
        selectedFiles: splitList(mock.payload.selectedFiles),
        contentTypes: splitList(mock.payload.contentTypes),
        allowsMultipleSelection: mock.payload.allowsMultipleSelection === "true",
        payload: { ...mock.payload },
      })),
    shareSheetRecords: manifest.configuredMocks
      .filter((mock) => mock.capability === "shareSheet")
      .map((mock) => ({
        identifier: mock.identifier,
        activityType: mock.payload.activityType,
        items: splitList(mock.payload.items),
        completionState: mock.payload.completionState,
        excludedActivityTypes: splitList(mock.payload.excludedActivityTypes),
        payload: { ...mock.payload },
      })),
    notificationRecords: [],
    diagnosticRecords: manifest.unsupportedSymbols.map((symbol) => ({
      capability: symbol.capability,
      code: "unsupportedSymbol",
      message: `Unsupported native symbol ${symbol.symbolName} was requested.`,
      suggestedAdaptation: symbol.suggestedAdaptation,
      payload: { symbolName: symbol.symbolName, capability: symbol.capability },
    })),
  };
}

function clipboardStateFromManifest(
  manifest: RuntimeNativeCapabilityManifest
): RuntimeNativeClipboardState | undefined {
  const mock = manifest.configuredMocks.find((candidate) => candidate.capability === "clipboard");
  if (!mock) {
    return undefined;
  }
  return {
    identifier: mock.identifier,
    text: mock.payload.text ?? mock.payload.initialText,
    initialText: mock.payload.initialText ?? mock.payload.text,
    currentText: mock.payload.currentText ?? mock.payload.text ?? mock.payload.initialText,
    readRecords: [],
    writeRecords: [],
    payload: { ...mock.payload },
  };
}

function splitList(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function resolveNativePermissionState(
  state: RuntimeNativePermissionState,
  promptResult: RuntimeNativePermissionState | undefined
): RuntimeNativePermissionState {
  return state === "prompt" ? promptResult ?? state : state;
}

function ensureNativePermission(
  session: RuntimeAutomationSession,
  capability: string
): RuntimeNativeCapabilityState["permissions"][string] {
  const existing = session.nativeCapabilityState.permissions[capability];
  if (existing) {
    return existing;
  }
  const permission = {
    state: "notRequested" as const,
    resolvedState: "notRequested" as const,
    strictModeAlternative: `Use deterministic ${capability} mock controls instead of host native APIs.`,
    prompt: { presented: false },
  };
  session.nativeCapabilityState.permissions[capability] = permission;
  return permission;
}

function ensureNativeClipboard(session: RuntimeAutomationSession): RuntimeNativeClipboardState {
  if (!session.nativeCapabilityState.clipboard) {
    session.nativeCapabilityState.clipboard = {
      identifier: "automation",
      readRecords: [],
      writeRecords: [],
      payload: {},
    };
  }
  return session.nativeCapabilityState.clipboard;
}

function nativeFixtureRecord(
  session: RuntimeAutomationSession,
  capability: "camera" | "photos",
  identifier: string,
  action: "capture" | "selection"
): RuntimeNativeCapabilityRecord {
  const fixture = session.nativeCapabilityState.fixtureOutputs.find(
    (candidate) => candidate.capability === capability && candidate.identifier === identifier
  );
  if (!fixture) {
    return appendNativeDiagnosticRecord(session, capability, "missingFixture", {
      fixtureIdentifier: identifier,
    });
  }
  return appendNativeRecord(session, capability, `native.${capability}.${action}.${identifier}`, {
    identifier,
    fixtureName: fixture.fixtureName,
    ...fixture.payload,
    permissionState: session.nativeCapabilityState.permissions[capability]?.resolvedState ?? "unsupported",
  });
}

function appendNativeDiagnosticRecord(
  session: RuntimeAutomationSession,
  capability: RuntimeNativeCapabilityRecord["capability"],
  code: string,
  payload: Record<string, string>
): RuntimeNativeCapabilityRecord {
  appendNativeDiagnostic(session, capability, code, payload);
  return cloneNativeRecords(session.nativeCapabilityEvents).at(-1)!;
}

function appendNativeDiagnostic(
  session: RuntimeAutomationSession,
  capability: RuntimeNativeCapabilityRecord["capability"],
  code: string,
  payload: Record<string, string>
): RuntimeNativeDiagnosticRecord {
  const diagnostic: RuntimeNativeDiagnosticRecord = {
    capability,
    code,
    message:
      code === "permissionDenied"
        ? "Location permission is not granted for the deterministic native mock."
        : `Deterministic native ${capability} ${code}.`,
    suggestedAdaptation:
      code === "permissionDenied"
        ? "Set the location permission to granted or use scripted location denial assertions."
        : `Configure a deterministic ${capability} mock for this transport session.`,
    payload: { ...payload },
  };
  session.nativeCapabilityState.diagnosticRecords.push(diagnostic);
  appendNativeRecord(session, capability, `native.diagnostic.${capability}.${code}`, {
    code,
    message: diagnostic.message,
    suggestedAdaptation: diagnostic.suggestedAdaptation,
    ...payload,
  });
  return { ...diagnostic, payload: { ...diagnostic.payload } };
}

function appendNativeRecord(
  session: RuntimeAutomationSession,
  capability: RuntimeNativeCapabilityRecord["capability"],
  name: string,
  payload: Record<string, string | undefined>
): RuntimeNativeCapabilityRecord {
  const record = {
    capability,
    name,
    revision: maxNativeRevision(session) + 1,
    payload: compactPayload(payload),
  };
  session.nativeCapabilityEvents.push(record);
  session.artifactBundle.nativeCapabilityRecords.push({ ...record, payload: { ...record.payload } });
  appendSessionLog(session, name);
  return { ...record, payload: { ...record.payload } };
}

function maxNativeRevision(session: RuntimeAutomationSession): number {
  return Math.max(
    session.nativeCapabilities === undefined ? 0 : 1,
    ...session.nativeCapabilityEvents.map((record) => record.revision),
    ...session.artifactBundle.nativeCapabilityRecords.map((record) => record.revision)
  );
}

function devicePayload(device: RuntimeDeviceSettings): Record<string, string | undefined> {
  return {
    viewportWidth: String(device.viewport.width),
    viewportHeight: String(device.viewport.height),
    viewportScale: String(device.viewport.scale),
    colorScheme: device.colorScheme,
    locale: device.locale,
    timeZone: device.clock.timeZone,
    frozenAtISO8601: device.clock.frozenAtISO8601,
    latitude: device.geolocation ? String(device.geolocation.latitude) : undefined,
    longitude: device.geolocation ? String(device.geolocation.longitude) : undefined,
    accuracyMeters: device.geolocation ? String(device.geolocation.accuracyMeters) : undefined,
    isOnline: String(device.network.isOnline),
    latencyMilliseconds: String(device.network.latencyMilliseconds),
    downloadKbps: String(device.network.downloadKbps),
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
