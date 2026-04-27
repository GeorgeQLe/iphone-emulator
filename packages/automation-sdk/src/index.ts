import type {
  RoleLocatorOptions,
  RuntimeAutomationLaunchOptions,
  RuntimeAutomationLogEntry,
  RuntimeAutomationScreenshotMetadata,
  RuntimeAutomationSession,
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
  RuntimeAutomationLaunchOptions,
  RuntimeAutomationLogEntry,
  RuntimeAutomationScreenshotMetadata,
  RuntimeAutomationSession,
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

  async screenshot(name?: string): Promise<RuntimeAutomationScreenshotMetadata> {
    const session = this.requireSession();

    return {
      name: name ?? session.snapshot.tree.scene.id,
      format: "png",
      byteCount: 0,
    };
  }

  async semanticTree(): Promise<SemanticUITree> {
    return cloneTree(this.requireSession().snapshot.tree);
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
    session.logs.push({ level: "info", message });
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
  return {
    id: "session-1",
    appIdentifier: options.appIdentifier,
    snapshot: {
      appIdentifier: options.appIdentifier,
      tree,
      lifecycleState: "active",
      revision: 1,
    },
    logs: [],
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
  };
}

function cloneSnapshot(snapshot: RuntimeTreeSnapshot): RuntimeTreeSnapshot {
  return {
    ...snapshot,
    tree: cloneTree(snapshot.tree),
  };
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
