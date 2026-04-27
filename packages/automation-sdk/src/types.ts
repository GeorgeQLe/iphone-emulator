export type UITreeRole =
  | "screen"
  | "text"
  | "button"
  | "textField"
  | "list"
  | "vStack"
  | "hStack"
  | "navigationStack"
  | "modal"
  | "tabView"
  | "alert";

export type UITreeSceneKind = "screen" | "modal" | "tabView" | "alert";

export type RuntimeLifecycleState = "inactive" | "active" | "background";

export interface UITreeNode {
  id: string;
  role: UITreeRole;
  label?: string;
  value?: string;
  children: UITreeNode[];
  metadata: Record<string, string>;
}

export interface UINavigationState {
  stackIdentifiers: string[];
  selectedIdentifier?: string;
}

export interface UIModalState {
  isPresented: boolean;
  presentedNode?: UITreeNode;
}

export interface UITabState {
  tabIdentifiers: string[];
  selectedIdentifier?: string;
}

export interface UIAlertPayload {
  title: string;
  message?: string;
  actions: string[];
}

export interface UITreeScene {
  id: string;
  kind: UITreeSceneKind;
  rootNode?: UITreeNode;
  navigationState?: UINavigationState;
  modalState?: UIModalState;
  tabState?: UITabState;
  alertPayload?: UIAlertPayload;
}

export interface SemanticUITree {
  appIdentifier: string;
  scene: UITreeScene;
}

export interface RuntimeTreeSnapshot {
  appIdentifier: string;
  tree: SemanticUITree;
  lifecycleState: RuntimeLifecycleState;
  revision: number;
}

export interface RuntimeAutomationLaunchOptions {
  appIdentifier: string;
  fixtureName: string;
}

export interface RuntimeAutomationLogEntry {
  level: "debug" | "info" | "warning" | "error";
  message: string;
}

export interface RuntimeAutomationScreenshotMetadata {
  name: string;
  format: string;
  byteCount: number;
}

export interface RuntimeAutomationSession {
  id: string;
  appIdentifier: string;
  snapshot: RuntimeTreeSnapshot;
  logs: RuntimeAutomationLogEntry[];
}

export interface SemanticQuery {
  role?: UITreeRole;
  text?: string;
  identifier?: string;
}

export interface RoleLocatorOptions {
  text?: string;
  id?: string;
}
