import type {
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
  RuntimeNativeCapabilityRequirement,
  RuntimeNativePermissionState,
  RuntimeNativeUnsupportedSymbol,
  RuntimeNetworkFixture,
  RuntimeNetworkFixtureInput,
  RuntimeNetworkRequestInput,
  RuntimeNetworkRequestRecord,
  RuntimeNetworkResponse,
  RuntimeTreeSnapshot,
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
  RuntimeNativeCapabilityRequirement,
  RuntimeNativePermissionState,
  RuntimeNativeUnsupportedSymbol,
  RuntimeNetworkFixture,
  RuntimeNetworkFixtureInput,
  RuntimeNetworkRequestInput,
  RuntimeNetworkRequestRecord,
  RuntimeNetworkResponse,
  RuntimeTreeSnapshot,
  SemanticQuery,
  SemanticUITree,
  UITreeNode,
  UITreeRole,
  UITreeScene,
} from "./types";

export class Emulator {
  static async launch(options: RuntimeAutomationLaunchOptions): Promise<EmulatorApp> {
    if (options.fixtureName !== "strict-mode-baseline") {
      throw new Error(`unknown fixture ${options.fixtureName}`);
    }

    return new InMemoryEmulatorApp(createSession(options));
  }
}

export interface EmulatorApp {
  close(): Promise<void>;
  getByRole(role: UITreeRole, options?: RoleLocatorOptions): Locator;
  getByText(text: string): Locator;
  getByTestId(identifier: string): Locator;
  logs(): Promise<RuntimeAutomationLogEntry[]>;
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
  private currentSession: RuntimeAutomationSession | null;
  private readonly networkFixtures = new Map<string, RuntimeNetworkFixture>();
  private requestSequence = 0;

  constructor(session: RuntimeAutomationSession) {
    this.currentSession = session;
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
    session.artifactBundle.semanticSnapshots.push({
      name: "baseline-tree",
      tree: cloneTree(session.snapshot.tree),
      revision: session.snapshot.revision,
    });
    return cloneTree(session.snapshot.tree);
  }

  async session(): Promise<RuntimeAutomationSession> {
    return cloneSession(this.requireSession());
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
    },
    device,
    nativeCapabilities,
  };
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
