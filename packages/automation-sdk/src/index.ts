import type {
  NativeAutomationNamespace,
  NativeAutomationSupportedCapability,
  NativeClipboardReadResult,
  NativeFileSelectionResult,
  NativeLocationSnapshot,
  NativeLocationUpdateInput,
  NativePermissionSnapshot,
  NativeShareSheetCompletionInput,
  EmulatorLaunchOptions,
  RoleLocatorOptions,
  RuntimeArtifactBundle,
  RuntimeAutomationLaunchOptions,
  RuntimeAutomationLogEntry,
  RuntimeAutomationScreenshotMetadata,
  RuntimeAutomationSession,
  RuntimeDeviceSettings,
  RuntimeNativeCapabilityEvent,
  RuntimeNativeCapabilityID,
  RuntimeNativeCapabilityManifest,
  RuntimeNativeCapabilityMock,
  RuntimeNativeCapabilityRecord,
  RuntimeNativeCapabilityState,
  RuntimeNativeClipboardState,
  RuntimeNativeDiagnosticRecord,
  RuntimeNativeFilePickerRecord,
  RuntimeNativeFixtureOutputRecord,
  RuntimeNativeKeyboardInputTraitRecord,
  RuntimeNativeKeyboardState,
  RuntimeNativeLocationEventRecord,
  RuntimeNativeNotificationRecord,
  RuntimeNativePermissionState,
  RuntimeNativeShareSheetRecord,
  RuntimeNativeUnsupportedSymbol,
  RuntimeNetworkFixture,
  RuntimeNetworkFixtureInput,
  RuntimeNetworkRequestInput,
  RuntimeNetworkRequestRecord,
  RuntimeTreeSnapshot,
  RuntimeTransportLaunchOptions,
  SemanticQuery,
  SemanticUITree,
  UIAlertPayload,
  UIModalState,
  UINavigationState,
  UITabState,
  UITreeNode,
  UITreeRole,
  UITreeScene,
} from "./types";

export type {
  NativeAutomationNamespace,
  NativeAutomationSupportedCapability,
  NativeClipboardReadResult,
  NativeFileSelectionResult,
  NativeLocationSnapshot,
  NativeLocationUpdateInput,
  NativePermissionSnapshot,
  NativeShareSheetCompletionInput,
  EmulatorLaunchOptions,
  RoleLocatorOptions,
  RuntimeArtifactBundle,
  RuntimeAutomationLaunchOptions,
  RuntimeAutomationLogEntry,
  RuntimeAutomationScreenshotMetadata,
  RuntimeAutomationSession,
  RuntimeDeviceSettings,
  RuntimeNativeCapabilityArtifactOutput,
  RuntimeNativeCapabilityEvent,
  RuntimeNativeCapabilityID,
  RuntimeNativeCapabilityManifest,
  RuntimeNativeCapabilityMock,
  RuntimeNativeCapabilityRecord,
  RuntimeNativeCapabilityState,
  RuntimeNativeClipboardEventRecord,
  RuntimeNativeClipboardState,
  RuntimeNativeDiagnosticRecord,
  RuntimeNativeFilePickerRecord,
  RuntimeNativeFixtureOutputRecord,
  RuntimeNativeKeyboardInputTraitRecord,
  RuntimeNativeKeyboardState,
  RuntimeNativeLocationEventRecord,
  RuntimeNativeNotificationRecord,
  RuntimeNativePermissionInspection,
  RuntimeNativePermissionPromptInspection,
  RuntimeNativeCapabilityRequirement,
  RuntimeNativePermissionState,
  RuntimeNativeShareSheetRecord,
  RuntimeNativeUnsupportedSymbol,
  RuntimeNetworkFixture,
  RuntimeNetworkFixtureInput,
  RuntimeNetworkRequestInput,
  RuntimeNetworkRequestRecord,
  RuntimeNetworkResponse,
  RuntimeTreeSnapshot,
  RuntimeTransportLaunchOptions,
  SemanticQuery,
  SemanticUITree,
  UITreeNode,
  UITreeRole,
  UITreeScene,
} from "./types";

export {
  RuntimeTransportClient,
  RuntimeTransportConnectionError,
  RuntimeTransportError,
  RuntimeTransportProtocolError,
  RuntimeTransportTimeoutError,
  createInMemoryRuntimeTransport,
  createWebSocketRuntimeTransport,
} from "./transport";

export type {
  InMemoryRuntimeTransportOptions,
  RuntimeTransport,
  RuntimeTransportClientOptions,
  RuntimeTransportDiagnostic,
  RuntimeTransportDiagnosticCode,
} from "./transport";

export class Emulator {
  static async launch(options: EmulatorLaunchOptions): Promise<EmulatorApp> {
    if (isTransportLaunchOptions(options)) {
      return new InMemoryEmulatorApp(await options.transport.launch(options), {
        recordInteractionSnapshots: true,
      });
    }

    if (options.fixtureName !== "strict-mode-baseline") {
      throw new Error(`unknown fixture ${options.fixtureName}`);
    }

    return new InMemoryEmulatorApp(createSession(options));
  }
}

function isTransportLaunchOptions(
  options: EmulatorLaunchOptions
): options is RuntimeTransportLaunchOptions {
  return options.mode === "transport";
}

export interface EmulatorApp {
  native: NativeAutomationNamespace;
  close(): Promise<void>;
  getByRole(role: UITreeRole, options?: RoleLocatorOptions): Locator;
  getByText(text: string): Locator;
  getByTestId(identifier: string): Locator;
  logs(): Promise<RuntimeAutomationLogEntry[]>;
  nativeCapabilityEvents(): Promise<RuntimeNativeCapabilityRecord[]>;
  artifacts(): Promise<RuntimeArtifactBundle>;
  request(url: string, options?: RuntimeNetworkRequestInput): Promise<RuntimeNetworkRequestRecord>;
  route(url: string, fixture: RuntimeNetworkFixtureInput): Promise<void>;
  screenshot(name?: string): Promise<RuntimeAutomationScreenshotMetadata>;
  semanticTree(): Promise<SemanticUITree>;
  session(): Promise<RuntimeAutomationSession>;
}

export interface Locator {
  fill(text: string): Promise<void>;
  inspect(): Promise<UITreeNode>;
  tap(): Promise<void>;
}

class InMemoryEmulatorApp implements EmulatorApp {
  readonly native: NativeAutomationNamespace;
  private currentSession: RuntimeAutomationSession | null;
  private readonly networkFixtures = new Map<string, RuntimeNetworkFixture>();
  private readonly recordInteractionSnapshots: boolean;
  private requestSequence = 0;
  private nativeRevision = 0;

  constructor(
    session: RuntimeAutomationSession,
    options: { recordInteractionSnapshots?: boolean } = {}
  ) {
    this.currentSession = session;
    this.recordInteractionSnapshots = options.recordInteractionSnapshots ?? false;
    this.nativeRevision = maxNativeCapabilityRevision(session);
    this.native = this.createNativeAutomationNamespace();
  }

  async close(): Promise<void> {
    this.requireSession();
    this.currentSession = null;
  }

  getByRole(role: UITreeRole, options: RoleLocatorOptions = {}): Locator {
    return new InMemoryLocator(this, {
      role,
      text: options.text,
      identifier: options.id,
    });
  }

  getByText(text: string): Locator {
    return new InMemoryLocator(this, { text });
  }

  getByTestId(identifier: string): Locator {
    return new InMemoryLocator(this, { identifier });
  }

  async logs(): Promise<RuntimeAutomationLogEntry[]> {
    return cloneLogs(this.requireSession().logs);
  }

  async nativeCapabilityEvents(): Promise<RuntimeNativeCapabilityRecord[]> {
    return cloneNativeCapabilityRecords(this.requireSession().nativeCapabilityEvents);
  }

  async artifacts(): Promise<RuntimeArtifactBundle> {
    return cloneArtifactBundle(this.requireSession().artifactBundle);
  }

  async request(
    url: string,
    options: RuntimeNetworkRequestInput = {}
  ): Promise<RuntimeNetworkRequestRecord> {
    const session = this.requireSession();
    const method = options.method ?? "GET";
    const request = {
      method,
      url,
      headers: { ...(options.headers ?? {}) },
      bodyByteCount: byteCount(options.body),
    };
    const fixture = this.networkFixtures.get(fixtureKey(method, url));
    const record: RuntimeNetworkRequestRecord = {
      id: `request-${++this.requestSequence}`,
      request,
      response: fixture?.response ?? { status: 404, headers: {}, bodyByteCount: 0 },
      source: fixture ? { fixtureId: fixture.id } : { missingFixture: true },
    };

    session.artifactBundle.networkRecords.push(record);
    return cloneNetworkRequestRecord(record);
  }

  async route(url: string, fixture: RuntimeNetworkFixtureInput): Promise<void> {
    const method = fixture.method ?? "GET";
    const networkFixture: RuntimeNetworkFixture = {
      id: fixture.id,
      method,
      url,
      response: {
        status: fixture.status,
        headers: { ...(fixture.headers ?? {}) },
        bodyByteCount: byteCount(fixture.body),
      },
    };

    this.networkFixtures.set(fixtureKey(method, url), networkFixture);
  }

  async screenshot(name?: string): Promise<RuntimeAutomationScreenshotMetadata> {
    const session = this.requireSession();
    const artifact = {
      name: name ?? session.snapshot.tree.scene.id,
      kind: "screenshot" as const,
      format: "png",
      byteCount: 0,
      viewport: cloneDeviceViewport(session.device.viewport),
    };

    session.artifactBundle.renderArtifacts.push(artifact);
    return cloneRenderArtifact(artifact);
  }

  async semanticTree(): Promise<SemanticUITree> {
    const session = this.requireSession();
    const lastSnapshot = session.artifactBundle.semanticSnapshots.at(-1);
    if (lastSnapshot?.revision !== session.snapshot.revision) {
      session.artifactBundle.semanticSnapshots.push({
        name: "baseline-tree",
        tree: cloneTree(session.snapshot.tree),
        revision: session.snapshot.revision,
      });
    }
    return cloneTree(session.snapshot.tree);
  }

  async session(): Promise<RuntimeAutomationSession> {
    return cloneSession(this.requireSession());
  }

  private createNativeAutomationNamespace(): NativeAutomationNamespace {
    return {
      permissions: {
        snapshot: async () => this.nativePermissionSnapshot(),
        request: async (capability) => this.nativePermissionRequest(capability),
        set: async (capability, state) => this.nativePermissionSet(capability, state),
      },
      camera: {
        capture: async (fixtureIdentifier) =>
          this.nativeFixtureAction("camera", fixtureIdentifier, "capture"),
      },
      photos: {
        select: async (fixtureIdentifier) =>
          this.nativeFixtureAction("photos", fixtureIdentifier, "selection"),
      },
      location: {
        current: async () => this.nativeLocationCurrent(),
        update: async (coordinate) => this.nativeLocationUpdate(coordinate),
      },
      clipboard: {
        read: async () => this.nativeClipboardRead(),
        write: async (text) => this.nativeClipboardWrite(text),
      },
      files: {
        select: async (fixtureIdentifier) => this.nativeFileSelect(fixtureIdentifier),
      },
      shareSheet: {
        complete: async (identifier, result) => this.nativeShareSheetComplete(identifier, result),
      },
      notifications: {
        requestAuthorization: async () => this.nativeNotificationAuthorizationRequest(),
        schedule: async (identifier) => this.nativeNotificationEvent(identifier, "schedule"),
        deliver: async (identifier) => this.nativeNotificationEvent(identifier, "deliver"),
      },
      device: {
        snapshot: async () => this.nativeDeviceSnapshot(),
      },
      events: async () => cloneNativeCapabilityRecords(this.requireSession().nativeCapabilityEvents),
      artifacts: async () =>
        cloneNativeCapabilityRecords(this.requireSession().artifactBundle.nativeCapabilityRecords),
    };
  }

  private nativePermissionSnapshot(): NativePermissionSnapshot {
    return cloneNativePermissionSnapshot(this.requireSession().nativeCapabilityState.permissions);
  }

  private nativePermissionRequest(
    capability: NativeAutomationSupportedCapability
  ): RuntimeNativeCapabilityRecord {
    const permission = this.ensureNativePermission(capability);
    const initialState = permission.state;
    const result = permission.prompt.result;
    const requestedState = result ?? permission.resolvedState;

    permission.state = requestedState;
    permission.resolvedState = requestedState;
    permission.prompt = {
      presented: requestedState === "prompt",
      result: requestedState === "prompt" ? result : undefined,
    };

    const record = this.makeNativeRecord(capability, `native.permission.${capability}.request`, {
      initialState,
      state: permission.state,
      result,
      resolvedState: permission.resolvedState,
    });

    return this.appendNativeRecord(record);
  }

  private nativePermissionSet(
    capability: NativeAutomationSupportedCapability,
    state: RuntimeNativePermissionState
  ): RuntimeNativeCapabilityRecord {
    const permission = this.ensureNativePermission(capability);
    permission.state = state;
    permission.resolvedState = state;
    permission.prompt = {
      presented: state === "prompt",
      result: undefined,
    };

    const record = this.makeNativeRecord(capability, `native.permission.${capability}.set`, {
      state,
      resolvedState: permission.resolvedState,
    });

    return this.appendNativeRecord(record);
  }

  private nativeFixtureAction(
    capability: "camera" | "photos",
    fixtureIdentifier: string,
    action: "capture" | "selection"
  ): RuntimeNativeCapabilityRecord {
    const fixture = this.findNativeFixtureOutput(capability, fixtureIdentifier);
    if (!fixture) {
      this.appendNativeDiagnostic({
        capability,
        code: "missingFixture",
        message: `No ${capability} fixture named ${fixtureIdentifier} is configured for deterministic native automation.`,
        suggestedAdaptation: `Add a ${capability} mock with identifier ${fixtureIdentifier} to nativeCapabilities.configuredMocks.`,
        payload: { identifier: fixtureIdentifier },
      });
      throw new Error(`no ${capability} fixture named ${fixtureIdentifier}`);
    }

    const record = this.makeNativeRecord(
      capability,
      `native.${capability}.${action}.${fixtureIdentifier}`,
      {
        identifier: fixture.identifier,
        fixtureName: fixture.fixtureName,
        ...fixture.payload,
        permissionState: this.nativeResolvedPermissionState(capability),
      }
    );

    return this.appendNativeRecord(record);
  }

  private nativeLocationCurrent(): NativeLocationSnapshot {
    const session = this.requireSession();
    const permission = this.ensureNativePermission("location");
    const permissionState = permission.resolvedState;

    if (permissionState !== "granted") {
      const diagnostic = this.appendNativeDiagnostic({
        capability: "location",
        code: "permissionDenied",
        message: "Location permission is not granted for the deterministic native mock.",
        suggestedAdaptation:
          "Set the location permission to granted or use scripted location denial assertions.",
        payload: { permissionState },
      });

      return {
        permissionState,
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

    return coordinate ? { permissionState, coordinate } : { permissionState };
  }

  private nativeLocationUpdate(
    coordinate: NativeLocationUpdateInput
  ): RuntimeNativeCapabilityRecord {
    const session = this.requireSession();
    const record = this.makeNativeRecord("location", "native.location.update.automation", {
      latitude: String(coordinate.latitude),
      longitude: String(coordinate.longitude),
      accuracyMeters: String(coordinate.accuracyMeters),
    });

    session.nativeCapabilityState.locationEvents.push({
      name: "automation",
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      accuracyMeters: coordinate.accuracyMeters,
      revision: record.revision,
      payload: { ...record.payload },
    });

    return this.appendNativeRecord(record);
  }

  private nativeClipboardRead(): NativeClipboardReadResult {
    const clipboard = this.ensureNativeClipboardState();
    const text = clipboard.currentText ?? clipboard.text ?? clipboard.initialText;
    const record = this.makeNativeRecord("clipboard", "native.clipboard.read.automation", {
      identifier: clipboard.identifier,
      text,
    });

    clipboard.readRecords.push({
      name: "automation-read",
      revision: record.revision,
      text,
      payload: { ...record.payload },
    });

    return {
      text,
      record: this.appendNativeRecord(record),
    };
  }

  private nativeClipboardWrite(text: string): RuntimeNativeCapabilityRecord {
    const clipboard = this.ensureNativeClipboardState();
    const record = this.makeNativeRecord("clipboard", "native.clipboard.write.automation", {
      identifier: clipboard.identifier,
      text,
    });

    clipboard.text = text;
    clipboard.currentText = text;
    clipboard.writeRecords.push({
      name: "automation-write",
      revision: record.revision,
      text,
      payload: { ...record.payload },
    });

    return this.appendNativeRecord(record);
  }

  private nativeFileSelect(fixtureIdentifier: string): NativeFileSelectionResult {
    const record = this.requireSession().nativeCapabilityState.filePickerRecords.find(
      (candidate) => candidate.identifier === fixtureIdentifier
    );
    if (!record) {
      this.appendNativeDiagnostic({
        capability: "files",
        code: "missingFixture",
        message: `No file picker fixture named ${fixtureIdentifier} is configured for deterministic native automation.`,
        suggestedAdaptation: `Add a files mock with identifier ${fixtureIdentifier} to nativeCapabilities.configuredMocks.`,
        payload: { identifier: fixtureIdentifier },
      });
      throw new Error(`no file picker fixture named ${fixtureIdentifier}`);
    }

    const event = this.makeNativeRecord("files", `native.files.selection.${fixtureIdentifier}`, {
      identifier: record.identifier,
      selectedFiles: record.selectedFiles.join(","),
      contentTypes: record.contentTypes.join(","),
      allowsMultipleSelection: String(record.allowsMultipleSelection),
      ...record.payload,
    });

    return {
      selectedFiles: [...record.selectedFiles],
      record: this.appendNativeRecord(event),
    };
  }

  private nativeShareSheetComplete(
    identifier: string,
    result: NativeShareSheetCompletionInput
  ): RuntimeNativeCapabilityRecord {
    const record = this.requireSession().nativeCapabilityState.shareSheetRecords.find(
      (candidate) => candidate.identifier === identifier
    );
    if (!record) {
      this.appendNativeDiagnostic({
        capability: "shareSheet",
        code: "missingFixture",
        message: `No share sheet fixture named ${identifier} is configured for deterministic native automation.`,
        suggestedAdaptation: `Add a shareSheet mock with identifier ${identifier} to nativeCapabilities.configuredMocks.`,
        payload: { identifier },
      });
      throw new Error(`no share sheet fixture named ${identifier}`);
    }

    record.completionState = result.completionState;
    const event = this.makeNativeRecord("shareSheet", `native.shareSheet.complete.${identifier}`, {
      identifier: record.identifier,
      activityType: record.activityType,
      items: record.items.join(","),
      excludedActivityTypes: record.excludedActivityTypes.join(","),
      ...record.payload,
      completionState: result.completionState,
    });

    return this.appendNativeRecord(event);
  }

  private nativeNotificationAuthorizationRequest(): RuntimeNativeCapabilityRecord {
    const permission = this.ensureNativePermission("notifications");
    const initialState = permission.state;
    const result = permission.prompt.result;
    const requestedState = result ?? permission.resolvedState;

    permission.state = requestedState;
    permission.resolvedState = requestedState;
    permission.prompt = {
      presented: requestedState === "prompt",
      result: requestedState === "prompt" ? result : undefined,
    };

    const record = this.makeNativeRecord(
      "notifications",
      "native.notifications.authorization.request",
      {
        initialState,
        state: permission.state,
        result,
        resolvedState: permission.resolvedState,
      }
    );

    return this.appendNativeRecord(record);
  }

  private nativeNotificationEvent(
    identifier: string,
    action: "schedule" | "deliver"
  ): RuntimeNativeCapabilityRecord {
    const session = this.requireSession();
    const existing = session.nativeCapabilityState.notificationRecords.find(
      (candidate) => candidate.identifier === identifier
    );
    const state = action === "schedule" ? "scheduled" : "delivered";
    const permission = this.ensureNativePermission("notifications");
    const record = this.makeNativeRecord(
      "notifications",
      `native.notifications.${action}.${identifier}`,
      {
        identifier,
        title: existing?.title,
        body: existing?.body,
        trigger: existing?.trigger,
        state,
        authorizationState: permission.resolvedState,
        ...(existing?.payload ?? {}),
      }
    );

    session.nativeCapabilityState.notificationRecords.push({
      identifier,
      title: existing?.title,
      body: existing?.body,
      trigger: existing?.trigger,
      state,
      authorizationState: permission.resolvedState,
      revision: record.revision,
      payload: { ...record.payload },
    });

    return this.appendNativeRecord(record);
  }

  private nativeDeviceSnapshot(): RuntimeDeviceSettings {
    const session = this.requireSession();
    const record = this.makeNativeRecord("deviceEnvironment", "native.deviceEnvironment.snapshot", {
      viewportWidth: String(session.device.viewport.width),
      viewportHeight: String(session.device.viewport.height),
      viewportScale: String(session.device.viewport.scale),
      colorScheme: session.device.colorScheme,
      locale: session.device.locale,
      timeZone: session.device.clock.timeZone,
      frozenAtISO8601: session.device.clock.frozenAtISO8601,
      latitude: session.device.geolocation
        ? String(session.device.geolocation.latitude)
        : undefined,
      longitude: session.device.geolocation
        ? String(session.device.geolocation.longitude)
        : undefined,
      accuracyMeters: session.device.geolocation
        ? String(session.device.geolocation.accuracyMeters)
        : undefined,
      isOnline: String(session.device.network.isOnline),
      latencyMilliseconds: String(session.device.network.latencyMilliseconds),
      downloadKbps: String(session.device.network.downloadKbps),
    });

    this.appendNativeRecord(record);
    return cloneDeviceSettings(session.device);
  }

  private ensureNativePermission(
    capability: NativeAutomationSupportedCapability
  ): RuntimeNativeCapabilityState["permissions"][string] {
    const session = this.requireSession();
    const existing = session.nativeCapabilityState.permissions[capability];
    if (existing) {
      return existing;
    }

    const requirement = session.nativeCapabilities.requiredCapabilities.find(
      (candidate) => candidate.id === capability
    );
    const promptResult = nativePromptResult(capability, session.nativeCapabilities.configuredMocks);
    const state = requirement?.permissionState ?? "notRequested";
    const permission = {
      state,
      resolvedState: resolveNativePermissionState(state, promptResult),
      strictModeAlternative:
        requirement?.strictModeAlternative ??
        `Use deterministic ${capability} mock controls instead of host native APIs.`,
      prompt: {
        presented: state === "prompt",
        result: promptResult,
      },
    };

    session.nativeCapabilityState.permissions[capability] = permission;
    return permission;
  }

  private nativeResolvedPermissionState(
    capability: NativeAutomationSupportedCapability
  ): RuntimeNativePermissionState {
    return (
      this.requireSession().nativeCapabilityState.permissions[capability]?.resolvedState ??
      "unsupported"
    );
  }

  private ensureNativeClipboardState(): RuntimeNativeClipboardState {
    const session = this.requireSession();
    if (session.nativeCapabilityState.clipboard) {
      return session.nativeCapabilityState.clipboard;
    }

    const clipboard: RuntimeNativeClipboardState = {
      identifier: "clipboard",
      readRecords: [],
      writeRecords: [],
      payload: {},
    };
    session.nativeCapabilityState.clipboard = clipboard;
    return clipboard;
  }

  private findNativeFixtureOutput(
    capability: "camera" | "photos",
    fixtureIdentifier: string
  ): RuntimeNativeFixtureOutputRecord | undefined {
    return this.requireSession().nativeCapabilityState.fixtureOutputs.find(
      (candidate) =>
        candidate.capability === capability && candidate.identifier === fixtureIdentifier
    );
  }

  private makeNativeRecord(
    capability: RuntimeNativeCapabilityID,
    name: string,
    payload: Record<string, string | undefined>
  ): RuntimeNativeCapabilityRecord {
    return {
      capability,
      name,
      revision: ++this.nativeRevision,
      payload: compactStringRecord(payload),
    };
  }

  private appendNativeRecord(record: RuntimeNativeCapabilityRecord): RuntimeNativeCapabilityRecord {
    const session = this.requireSession();
    session.nativeCapabilityEvents.push(record);
    session.artifactBundle.nativeCapabilityRecords.push(record);
    return cloneNativeCapabilityRecords([record])[0];
  }

  private appendNativeDiagnostic(
    diagnostic: RuntimeNativeDiagnosticRecord
  ): RuntimeNativeDiagnosticRecord {
    const session = this.requireSession();
    const storedDiagnostic = cloneNativeDiagnosticRecord(diagnostic);
    session.nativeCapabilityState.diagnosticRecords.push(storedDiagnostic);
    this.appendNativeRecord(
      this.makeNativeRecord(
        diagnostic.capability,
        `native.diagnostic.${diagnostic.capability}.${diagnostic.code}`,
        {
          code: diagnostic.code,
          message: diagnostic.message,
          suggestedAdaptation: diagnostic.suggestedAdaptation,
          ...diagnostic.payload,
        }
      )
    );

    return cloneNativeDiagnosticRecord(storedDiagnostic);
  }

  inspect(query: SemanticQuery): UITreeNode {
    return cloneNode(this.findNode(query));
  }

  tap(query: SemanticQuery): void {
    const node = this.findMutableNode(query);
    if (node.role === "button") {
      node.label = "Saved";
    }

    this.withUpdatedSnapshot((scene) => {
      scene.alertPayload = {
        title: "Done",
        message: "Saved",
        actions: [],
      };
    });
    this.appendLog(`Tapped ${node.id}`);
  }

  fill(query: SemanticQuery, text: string): void {
    const node = this.findMutableNode(query);
    if (node.role !== "textField") {
      throw new Error("target is not a text field");
    }

    node.value = text;
    this.withUpdatedSnapshot();
    this.appendLog(`Filled ${node.id} with ${text}`);
  }

  private appendLog(message: string): void {
    const session = this.requireSession();
    const logEntry: RuntimeAutomationLogEntry = { level: "info", message };
    session.logs.push(logEntry);
    session.artifactBundle.logs.push({ ...logEntry });
  }

  private findMutableNode(query: SemanticQuery): UITreeNode {
    const rootNode = this.requireSession().snapshot.tree.scene.rootNode;
    if (!rootNode) {
      throw new Error("no root node available");
    }

    const match = findFirstMatch(rootNode, query);
    if (!match) {
      throw new Error("no element matched the query");
    }

    return match;
  }

  private findNode(query: SemanticQuery): UITreeNode {
    return this.findMutableNode(query);
  }

  private requireSession(): RuntimeAutomationSession {
    if (!this.currentSession) {
      throw new Error("session not found");
    }

    return this.currentSession;
  }

  private withUpdatedSnapshot(updateScene?: (scene: UITreeScene) => void): void {
    const session = this.requireSession();
    const scene = session.snapshot.tree.scene;
    updateScene?.(scene);

    session.snapshot = {
      ...session.snapshot,
      revision: session.snapshot.revision + 1,
      tree: {
        ...session.snapshot.tree,
        scene,
      },
    };
    if (this.recordInteractionSnapshots) {
      session.artifactBundle.semanticSnapshots.push({
        name: "baseline-tree",
        tree: cloneTree(session.snapshot.tree),
        revision: session.snapshot.revision,
      });
    }
  }
}

class InMemoryLocator implements Locator {
  constructor(
    private readonly app: InMemoryEmulatorApp,
    private readonly query: SemanticQuery
  ) {}

  async fill(text: string): Promise<void> {
    this.app.fill(this.query, text);
  }

  async inspect(): Promise<UITreeNode> {
    return this.app.inspect(this.query);
  }

  async tap(): Promise<void> {
    this.app.tap(this.query);
  }
}

function createSession(options: RuntimeAutomationLaunchOptions): RuntimeAutomationSession {
  const tree = createStrictModeBaselineTree(options.appIdentifier);
  const device = cloneDeviceSettings(options.device ?? defaultDeviceSettings());
  const nativeCapabilities = cloneNativeCapabilities(
    options.nativeCapabilities ?? defaultNativeCapabilities()
  );
  const native = deriveNativeCapabilityState(nativeCapabilities);
  const snapshot = {
    appIdentifier: options.appIdentifier,
    tree,
    lifecycleState: "active" as const,
    revision: 1,
    device: cloneDeviceSettings(device),
  };
  return {
    id: "session-1",
    appIdentifier: options.appIdentifier,
    snapshot,
    logs: [],
    artifactBundle: {
      sessionID: "session-1",
      renderArtifacts: [
        {
          name: "baseline-home",
          kind: "screenshot",
          format: "png",
          byteCount: 0,
          viewport: cloneDeviceViewport(device.viewport),
        },
      ],
      semanticSnapshots: [
        {
          name: "baseline-tree",
          tree: cloneTree(tree),
          revision: snapshot.revision,
        },
      ],
      logs: [],
      networkRecords: [],
      nativeCapabilityRecords: cloneNativeCapabilityRecords(native.artifactRecords),
    },
    device,
    nativeCapabilities,
    nativeCapabilityState: cloneNativeCapabilityState(native.state),
    nativeCapabilityEvents: cloneNativeCapabilityRecords(native.eventRecords),
  };
}

function maxNativeCapabilityRevision(session: RuntimeAutomationSession): number {
  return Math.max(
    session.snapshot.revision,
    0,
    ...session.nativeCapabilityEvents.map((record) => record.revision),
    ...session.artifactBundle.nativeCapabilityRecords.map((record) => record.revision)
  );
}

function defaultNativeCapabilities(): RuntimeNativeCapabilityManifest {
  return {
    requiredCapabilities: [],
    configuredMocks: [],
    scriptedEvents: [],
    unsupportedSymbols: [],
    artifactOutputs: [],
  };
}

function defaultDeviceSettings(): RuntimeDeviceSettings {
  return {
    viewport: { width: 393, height: 852, scale: 3 },
    colorScheme: "light",
    locale: "en_US",
    clock: { timeZone: "UTC" },
    network: { isOnline: true, latencyMilliseconds: 0, downloadKbps: 0 },
  };
}

interface RuntimeNativeCapabilityDerivation {
  state: RuntimeNativeCapabilityState;
  eventRecords: RuntimeNativeCapabilityRecord[];
  artifactRecords: RuntimeNativeCapabilityRecord[];
}

function deriveNativeCapabilityState(
  manifest: RuntimeNativeCapabilityManifest
): RuntimeNativeCapabilityDerivation {
  const permissions: RuntimeNativeCapabilityState["permissions"] = {};
  const eventRecords: RuntimeNativeCapabilityRecord[] = [];
  const fixtureOutputs: RuntimeNativeFixtureOutputRecord[] = [];

  for (const requirement of manifest.requiredCapabilities) {
    const promptResult = nativePromptResult(requirement.id, manifest.configuredMocks);
    const resolvedState = resolveNativePermissionState(requirement.permissionState, promptResult);
    permissions[requirement.id] = {
      state: requirement.permissionState,
      resolvedState,
      strictModeAlternative: requirement.strictModeAlternative,
      prompt: {
        presented: requirement.permissionState === "prompt",
        result: promptResult,
      },
    };

    if (requirement.permissionState === "prompt") {
      eventRecords.push({
        capability: requirement.id,
        name: `native.permission.${requirement.id}.prompt`,
        revision: 1,
        payload: compactStringRecord({
          state: requirement.permissionState,
          result: promptResult,
          resolvedState,
        }),
      });
    }
  }

  for (const mock of manifest.configuredMocks) {
    const fixtureName = nonEmptyString(mock.payload.fixtureName);
    if (!fixtureName) {
      continue;
    }

    const fixtureOutput: RuntimeNativeFixtureOutputRecord = {
      capability: mock.capability,
      identifier: mock.identifier,
      fixtureName,
      payload: { ...mock.payload },
    };
    const fixtureRecord: RuntimeNativeCapabilityRecord = {
      capability: mock.capability,
      name: `native.fixture.${mock.capability}.${mock.identifier}`,
      revision: 1,
      payload: { ...mock.payload, fixtureName },
    };

    fixtureOutputs.push(fixtureOutput);
    eventRecords.push(fixtureRecord);
  }

  const scriptedRecords = manifest.scriptedEvents.map(nativeRecordFromScriptedEvent);
  eventRecords.push(...scriptedRecords);

  const locationEvents = manifest.scriptedEvents
    .filter((event) => event.capability === "location")
    .map(nativeLocationEventFromScriptedEvent)
    .filter((event): event is RuntimeNativeLocationEventRecord => event !== null)
    .sort((first, second) => first.revision - second.revision);

  const state: RuntimeNativeCapabilityState = {
    permissions,
    fixtureOutputs,
    locationEvents,
    clipboard: deriveNativeClipboardState(manifest),
    keyboard: deriveNativeKeyboardState(manifest),
    filePickerRecords: manifest.configuredMocks
      .filter((mock) => mock.capability === "files")
      .map(nativeFilePickerRecordFromMock),
    shareSheetRecords: manifest.configuredMocks
      .filter((mock) => mock.capability === "shareSheet")
      .map(nativeShareSheetRecordFromMock),
    notificationRecords: manifest.scriptedEvents
      .filter((event) => event.capability === "notifications")
      .map((event) =>
        nativeNotificationRecordFromEvent(event, permissions.notifications?.resolvedState)
      )
      .sort((first, second) => first.revision - second.revision),
    diagnosticRecords: manifest.unsupportedSymbols.map(nativeDiagnosticRecordFromUnsupportedSymbol),
  };

  return {
    state,
    eventRecords,
    artifactRecords: deriveNativeArtifactRecords(manifest, eventRecords),
  };
}

function nativePromptResult(
  capability: RuntimeNativeCapabilityID,
  mocks: RuntimeNativeCapabilityMock[]
): RuntimeNativePermissionState | undefined {
  const result = mocks.find((mock) => mock.capability === capability)?.payload.result;
  return isRuntimeNativePermissionState(result) ? result : undefined;
}

function resolveNativePermissionState(
  state: RuntimeNativePermissionState,
  promptResult: RuntimeNativePermissionState | undefined
): RuntimeNativePermissionState {
  return state === "prompt" ? promptResult ?? state : state;
}

function isRuntimeNativePermissionState(
  value: string | undefined
): value is RuntimeNativePermissionState {
  return (
    value === "unsupported" ||
    value === "notRequested" ||
    value === "prompt" ||
    value === "granted" ||
    value === "denied" ||
    value === "restricted"
  );
}

function nativeRecordFromScriptedEvent(
  event: RuntimeNativeCapabilityEvent
): RuntimeNativeCapabilityRecord {
  return {
    capability: event.capability,
    name: `native.event.${event.capability}.${event.name}`,
    revision: event.atRevision,
    payload: { ...event.payload },
  };
}

function nativeLocationEventFromScriptedEvent(
  event: RuntimeNativeCapabilityEvent
): RuntimeNativeLocationEventRecord | null {
  const latitude = parseNativeNumber(event.payload.latitude);
  const longitude = parseNativeNumber(event.payload.longitude);
  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    name: event.name,
    latitude,
    longitude,
    accuracyMeters: parseNativeNumber(event.payload.accuracyMeters) ?? 0,
    revision: event.atRevision,
    payload: { ...event.payload },
  };
}

function deriveNativeClipboardState(
  manifest: RuntimeNativeCapabilityManifest
): RuntimeNativeClipboardState | undefined {
  const mock = manifest.configuredMocks.find((candidate) => candidate.capability === "clipboard");
  const events = manifest.scriptedEvents.filter((event) => event.capability === "clipboard");
  if (!mock && events.length === 0) {
    return undefined;
  }

  const initialText = mock?.payload.initialText ?? mock?.payload.text;
  const readRecords = events
    .filter((event) => event.name.includes("read"))
    .map((event) => ({
      name: event.name,
      revision: event.atRevision,
      text: event.payload.text ?? initialText,
      payload: { ...event.payload },
    }))
    .sort((first, second) => first.revision - second.revision);
  const writeRecords = events
    .filter((event) => event.name.includes("write"))
    .map((event) => ({
      name: event.name,
      revision: event.atRevision,
      text: event.payload.text,
      payload: { ...event.payload },
    }))
    .sort((first, second) => first.revision - second.revision);
  const currentText = writeRecords.at(-1)?.text ?? initialText;

  return {
    identifier: mock?.identifier ?? events[0]?.payload.identifier ?? "clipboard",
    text: currentText,
    initialText,
    currentText,
    readRecords,
    writeRecords,
    payload: { ...(mock?.payload ?? {}) },
  };
}

function deriveNativeKeyboardState(
  manifest: RuntimeNativeCapabilityManifest
): RuntimeNativeKeyboardState | undefined {
  const mocks = manifest.configuredMocks.filter((mock) => mock.capability === "keyboardInput");
  const events = manifest.scriptedEvents.filter((event) => event.capability === "keyboardInput");
  if (mocks.length === 0 && events.length === 0) {
    return undefined;
  }

  const inputTraits = mocks.map(nativeKeyboardInputTraitFromMock);
  const firstTrait = inputTraits[0];

  return {
    identifier: firstTrait?.identifier ?? events[0]?.payload.identifier ?? "keyboard-input",
    focusedElementID: firstTrait?.focusedElementID,
    keyboardType: firstTrait?.keyboardType,
    returnKey: firstTrait?.returnKey,
    textContentType: firstTrait?.textContentType,
    autocorrection: firstTrait?.autocorrection,
    secureTextEntry: firstTrait?.secureTextEntry,
    isVisible: firstTrait?.isVisible,
    inputTraits,
    eventRecords: events.map(nativeRecordFromScriptedEvent),
    payload: { ...(mocks[0]?.payload ?? {}) },
  };
}

function nativeKeyboardInputTraitFromMock(
  mock: RuntimeNativeCapabilityMock
): RuntimeNativeKeyboardInputTraitRecord {
  return {
    identifier: mock.identifier,
    focusedElementID: mock.payload.focusedElementID,
    keyboardType: mock.payload.keyboardType,
    returnKey: mock.payload.returnKey,
    textContentType: mock.payload.textContentType,
    autocorrection: mock.payload.autocorrection,
    secureTextEntry: parseNativeBool(mock.payload.secureTextEntry),
    isVisible: parseNativeBool(mock.payload.isVisible),
    payload: { ...mock.payload },
  };
}

function nativeFilePickerRecordFromMock(
  mock: RuntimeNativeCapabilityMock
): RuntimeNativeFilePickerRecord {
  return {
    identifier: mock.identifier,
    selectedFiles: splitNativeList(mock.payload.selectedFiles),
    contentTypes: splitNativeList(mock.payload.contentTypes),
    allowsMultipleSelection: parseNativeBool(mock.payload.allowsMultipleSelection) ?? false,
    payload: { ...mock.payload },
  };
}

function nativeShareSheetRecordFromMock(
  mock: RuntimeNativeCapabilityMock
): RuntimeNativeShareSheetRecord {
  return {
    identifier: mock.identifier,
    activityType: mock.payload.activityType,
    items: splitNativeList(mock.payload.items),
    completionState: mock.payload.completionState,
    excludedActivityTypes: splitNativeList(mock.payload.excludedActivityTypes),
    payload: { ...mock.payload },
  };
}

function nativeNotificationRecordFromEvent(
  event: RuntimeNativeCapabilityEvent,
  authorizationState: RuntimeNativePermissionState | undefined
): RuntimeNativeNotificationRecord {
  return {
    identifier: event.payload.identifier ?? event.name,
    title: event.payload.title,
    body: event.payload.body,
    trigger: event.payload.trigger,
    state: nativeNotificationStateFromEventName(event.name),
    authorizationState: authorizationState ?? "unsupported",
    revision: event.atRevision,
    payload: { ...event.payload },
  };
}

function nativeNotificationStateFromEventName(name: string): string {
  return name.replace("notification-", "").replace("-notification", "");
}

function nativeDiagnosticRecordFromUnsupportedSymbol(
  symbol: RuntimeNativeUnsupportedSymbol
): RuntimeNativeDiagnosticRecord {
  return {
    capability: symbol.capability,
    code: "unsupportedSymbol",
    message: `Unsupported native symbol ${symbol.symbolName} was requested.`,
    suggestedAdaptation: symbol.suggestedAdaptation,
    payload: {
      symbolName: symbol.symbolName,
      capability: symbol.capability,
    },
  };
}

function deriveNativeArtifactRecords(
  manifest: RuntimeNativeCapabilityManifest,
  eventRecords: RuntimeNativeCapabilityRecord[]
): RuntimeNativeCapabilityRecord[] {
  if (manifest.artifactOutputs.length === 0) {
    return eventRecords.filter(
      (record) =>
        record.name.startsWith("native.fixture.") || record.name.startsWith("native.event.")
    );
  }

  return manifest.artifactOutputs.map((output) => {
    const matchingRecord = eventRecords.find(
      (record) =>
        record.capability === output.capability &&
        (record.name.startsWith("native.fixture.") || record.name.startsWith("native.event."))
    );

    return (
      matchingRecord ?? {
        capability: output.capability,
        name: output.name,
        revision: 1,
        payload: {
          capability: output.capability,
          kind: output.kind,
        },
      }
    );
  });
}

function compactStringRecord(values: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
}

function nonEmptyString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseNativeNumber(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNativeBool(value: string | undefined): boolean | undefined {
  switch (value?.trim().toLowerCase()) {
    case "true":
    case "yes":
    case "1":
      return true;
    case "false":
    case "no":
    case "0":
      return false;
    default:
      return undefined;
  }
}

function splitNativeList(value: string | undefined): string[] {
  return value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0) ?? [];
}

function createStrictModeBaselineTree(appIdentifier: string): SemanticUITree {
  const navigationState: UINavigationState = {
    stackIdentifiers: ["baseline-screen", "details-screen"],
    selectedIdentifier: "baseline-screen",
  };
  const modalState: UIModalState = {
    isPresented: true,
    presentedNode: {
      id: "welcome-modal",
      role: "modal",
      label: "Welcome",
      children: [
        {
          id: "welcome-modal-body",
          role: "vStack",
          children: [
            {
              id: "welcome-modal-copy",
              role: "text",
              label: "Strict mode renderer fixture loaded.",
              children: [],
              metadata: {},
            },
            {
              id: "welcome-modal-button",
              role: "button",
              label: "Continue",
              children: [],
              metadata: {},
            },
          ],
          metadata: { spacing: "12" },
        },
      ],
      metadata: {},
    },
  };
  const tabState: UITabState = {
    tabIdentifiers: ["home-tab", "profile-tab"],
    selectedIdentifier: "home-tab",
  };
  const alertPayload: UIAlertPayload = {
    title: "Preview Mode",
    message: "Renderer output is deterministic for this fixed fixture.",
    actions: [],
  };

  return {
    appIdentifier,
    scene: {
      id: "baseline-screen",
      kind: "screen",
      rootNode: {
        id: "root-stack",
        role: "navigationStack",
        label: "Home",
        children: [
          {
            id: "home-screen",
            role: "screen",
            label: "Home",
            children: [
              {
                id: "page-layout",
                role: "vStack",
                children: [
                  {
                    id: "headline",
                    role: "text",
                    label: "Hello from strict mode",
                    children: [],
                    metadata: { emphasis: "headline" },
                  },
                  {
                    id: "profile-row",
                    role: "hStack",
                    children: [
                      {
                        id: "name-field",
                        role: "textField",
                        label: "Name",
                        value: "Taylor",
                        children: [],
                        metadata: { placeholder: "Enter name" },
                      },
                      {
                        id: "save-button",
                        role: "button",
                        label: "Save",
                        children: [],
                        metadata: { variant: "primary" },
                      },
                    ],
                    metadata: { alignment: "center" },
                  },
                  {
                    id: "items-list",
                    role: "list",
                    label: "Favorites",
                    children: [
                      {
                        id: "favorite-1",
                        role: "text",
                        label: "Messages",
                        children: [],
                        metadata: {},
                      },
                      {
                        id: "favorite-2",
                        role: "text",
                        label: "Calendar",
                        children: [],
                        metadata: {},
                      },
                    ],
                    metadata: {},
                  },
                  {
                    id: "tab-bar",
                    role: "tabView",
                    children: [
                      {
                        id: "home-tab",
                        role: "button",
                        label: "Home",
                        children: [],
                        metadata: {},
                      },
                      {
                        id: "profile-tab",
                        role: "button",
                        label: "Profile",
                        children: [],
                        metadata: {},
                      },
                    ],
                    metadata: {},
                  },
                ],
                metadata: { spacing: "16" },
              },
            ],
            metadata: {},
          },
        ],
        metadata: {},
      },
      navigationState,
      modalState,
      tabState,
      alertPayload,
    },
  };
}

function cloneSession(session: RuntimeAutomationSession): RuntimeAutomationSession {
  return {
    ...session,
    snapshot: cloneSnapshot(session.snapshot),
    logs: cloneLogs(session.logs),
    artifactBundle: cloneArtifactBundle(session.artifactBundle),
    device: cloneDeviceSettings(session.device),
    nativeCapabilities: cloneNativeCapabilities(session.nativeCapabilities),
    nativeCapabilityState: cloneNativeCapabilityState(session.nativeCapabilityState),
    nativeCapabilityEvents: cloneNativeCapabilityRecords(session.nativeCapabilityEvents),
  };
}

function cloneSnapshot(snapshot: RuntimeTreeSnapshot): RuntimeTreeSnapshot {
  return {
    ...snapshot,
    tree: cloneTree(snapshot.tree),
    device: cloneDeviceSettings(snapshot.device),
  };
}

function cloneArtifactBundle(bundle: RuntimeArtifactBundle): RuntimeArtifactBundle {
  return {
    sessionID: bundle.sessionID,
    renderArtifacts: bundle.renderArtifacts.map(cloneRenderArtifact),
    semanticSnapshots: bundle.semanticSnapshots.map((snapshot) => ({
      name: snapshot.name,
      tree: cloneTree(snapshot.tree),
      revision: snapshot.revision,
    })),
    logs: cloneLogs(bundle.logs),
    networkRecords: bundle.networkRecords.map(cloneNetworkRequestRecord),
    nativeCapabilityRecords: cloneNativeCapabilityRecords(bundle.nativeCapabilityRecords),
  };
}

function cloneRenderArtifact(
  artifact: RuntimeAutomationScreenshotMetadata
): RuntimeAutomationScreenshotMetadata {
  return {
    ...artifact,
    viewport: cloneDeviceViewport(artifact.viewport),
  };
}

function cloneDeviceSettings(device: RuntimeDeviceSettings): RuntimeDeviceSettings {
  return {
    viewport: cloneDeviceViewport(device.viewport),
    colorScheme: device.colorScheme,
    locale: device.locale,
    clock: { ...device.clock },
    geolocation: device.geolocation ? { ...device.geolocation } : undefined,
    network: { ...device.network },
  };
}

function cloneDeviceViewport(viewport: RuntimeDeviceSettings["viewport"]): RuntimeDeviceSettings["viewport"] {
  return { ...viewport };
}

function cloneNativeCapabilities(
  manifest: RuntimeNativeCapabilityManifest
): RuntimeNativeCapabilityManifest {
  return {
    requiredCapabilities: manifest.requiredCapabilities.map((requirement) => ({ ...requirement })),
    configuredMocks: manifest.configuredMocks.map((mock) => ({
      ...mock,
      payload: { ...mock.payload },
    })),
    scriptedEvents: manifest.scriptedEvents.map((event) => ({
      ...event,
      payload: { ...event.payload },
    })),
    unsupportedSymbols: manifest.unsupportedSymbols.map((symbol) => ({ ...symbol })),
    artifactOutputs: manifest.artifactOutputs.map((output) => ({ ...output })),
  };
}

function cloneNativeCapabilityState(
  state: RuntimeNativeCapabilityState
): RuntimeNativeCapabilityState {
  return {
    permissions: Object.fromEntries(
      Object.entries(state.permissions).map(([capability, permission]) => [
        capability,
        {
          state: permission.state,
          resolvedState: permission.resolvedState,
          strictModeAlternative: permission.strictModeAlternative,
          prompt: {
            presented: permission.prompt.presented,
            result: permission.prompt.result,
          },
        },
      ])
    ),
    fixtureOutputs: state.fixtureOutputs.map((record) => ({
      capability: record.capability,
      identifier: record.identifier,
      fixtureName: record.fixtureName,
      payload: { ...record.payload },
    })),
    locationEvents: state.locationEvents.map((record) => ({
      name: record.name,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracyMeters: record.accuracyMeters,
      revision: record.revision,
      payload: { ...record.payload },
    })),
    clipboard: state.clipboard
      ? {
          identifier: state.clipboard.identifier,
          text: state.clipboard.text,
          initialText: state.clipboard.initialText,
          currentText: state.clipboard.currentText,
          readRecords: state.clipboard.readRecords.map((record) => ({
            name: record.name,
            revision: record.revision,
            text: record.text,
            payload: { ...record.payload },
          })),
          writeRecords: state.clipboard.writeRecords.map((record) => ({
            name: record.name,
            revision: record.revision,
            text: record.text,
            payload: { ...record.payload },
          })),
          payload: { ...state.clipboard.payload },
        }
      : undefined,
    keyboard: state.keyboard
      ? {
          identifier: state.keyboard.identifier,
          focusedElementID: state.keyboard.focusedElementID,
          keyboardType: state.keyboard.keyboardType,
          returnKey: state.keyboard.returnKey,
          textContentType: state.keyboard.textContentType,
          autocorrection: state.keyboard.autocorrection,
          secureTextEntry: state.keyboard.secureTextEntry,
          isVisible: state.keyboard.isVisible,
          inputTraits: state.keyboard.inputTraits.map((trait) => ({
            identifier: trait.identifier,
            focusedElementID: trait.focusedElementID,
            keyboardType: trait.keyboardType,
            returnKey: trait.returnKey,
            textContentType: trait.textContentType,
            autocorrection: trait.autocorrection,
            secureTextEntry: trait.secureTextEntry,
            isVisible: trait.isVisible,
            payload: { ...trait.payload },
          })),
          eventRecords: cloneNativeCapabilityRecords(state.keyboard.eventRecords),
          payload: { ...state.keyboard.payload },
        }
      : undefined,
    filePickerRecords: state.filePickerRecords.map((record) => ({
      identifier: record.identifier,
      selectedFiles: [...record.selectedFiles],
      contentTypes: [...record.contentTypes],
      allowsMultipleSelection: record.allowsMultipleSelection,
      payload: { ...record.payload },
    })),
    shareSheetRecords: state.shareSheetRecords.map((record) => ({
      identifier: record.identifier,
      activityType: record.activityType,
      items: [...record.items],
      completionState: record.completionState,
      excludedActivityTypes: [...record.excludedActivityTypes],
      payload: { ...record.payload },
    })),
    notificationRecords: state.notificationRecords.map((record) => ({
      identifier: record.identifier,
      title: record.title,
      body: record.body,
      trigger: record.trigger,
      state: record.state,
      authorizationState: record.authorizationState,
      revision: record.revision,
      payload: { ...record.payload },
    })),
    diagnosticRecords: state.diagnosticRecords.map(cloneNativeDiagnosticRecord),
  };
}

function cloneNativeDiagnosticRecord(
  record: RuntimeNativeDiagnosticRecord
): RuntimeNativeDiagnosticRecord {
  return {
    capability: record.capability,
    code: record.code,
    message: record.message,
    suggestedAdaptation: record.suggestedAdaptation,
    payload: { ...record.payload },
  };
}

function cloneNativePermissionSnapshot(
  permissions: RuntimeNativeCapabilityState["permissions"]
): NativePermissionSnapshot {
  return Object.fromEntries(
    Object.entries(permissions).map(([capability, permission]) => [
      capability,
      {
        state: permission.state,
        resolvedState: permission.resolvedState,
        strictModeAlternative: permission.strictModeAlternative,
        prompt: {
          presented: permission.prompt.presented,
          result: permission.prompt.result,
        },
      },
    ])
  );
}

function cloneNativeCapabilityRecords(
  records: RuntimeNativeCapabilityRecord[]
): RuntimeNativeCapabilityRecord[] {
  return records.map((record) => ({
    capability: record.capability,
    name: record.name,
    revision: record.revision,
    payload: { ...record.payload },
  }));
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

function cloneTree(tree: SemanticUITree): SemanticUITree {
  return {
    ...tree,
    scene: cloneScene(tree.scene),
  };
}

function cloneScene(scene: UITreeScene): UITreeScene {
  return {
    ...scene,
    rootNode: scene.rootNode ? cloneNode(scene.rootNode) : undefined,
    navigationState: scene.navigationState
      ? {
          stackIdentifiers: [...scene.navigationState.stackIdentifiers],
          selectedIdentifier: scene.navigationState.selectedIdentifier,
        }
      : undefined,
    modalState: scene.modalState
      ? {
          isPresented: scene.modalState.isPresented,
          presentedNode: scene.modalState.presentedNode
            ? cloneNode(scene.modalState.presentedNode)
            : undefined,
        }
      : undefined,
    tabState: scene.tabState
      ? {
          tabIdentifiers: [...scene.tabState.tabIdentifiers],
          selectedIdentifier: scene.tabState.selectedIdentifier,
        }
      : undefined,
    alertPayload: scene.alertPayload
      ? {
          title: scene.alertPayload.title,
          message: scene.alertPayload.message,
          actions: [...scene.alertPayload.actions],
        }
      : undefined,
  };
}

function cloneNode(node: UITreeNode): UITreeNode {
  return {
    ...node,
    metadata: { ...node.metadata },
    children: node.children.map(cloneNode),
  };
}

function cloneLogs(logs: RuntimeAutomationLogEntry[]): RuntimeAutomationLogEntry[] {
  return logs.map((entry) => ({ ...entry }));
}

function findFirstMatch(node: UITreeNode, query: SemanticQuery): UITreeNode | null {
  if (matchesQuery(node, query)) {
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

function matchesQuery(node: UITreeNode, query: SemanticQuery): boolean {
  const matchesIdentifier = query.identifier ? node.id === query.identifier : true;
  const matchesRole = query.role ? node.role === query.role : true;
  const matchesText = query.text ? node.label === query.text || node.value === query.text : true;

  return matchesIdentifier && matchesRole && matchesText;
}
