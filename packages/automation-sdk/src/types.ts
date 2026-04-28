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
  device: RuntimeDeviceSettings;
}

export interface RuntimeAutomationLaunchOptions {
  appIdentifier: string;
  fixtureName: string;
  device?: RuntimeDeviceSettings;
}

export interface RuntimeAutomationLogEntry {
  level: "debug" | "info" | "warning" | "error";
  message: string;
}

export interface RuntimeAutomationScreenshotMetadata {
  name: string;
  format: string;
  byteCount: number;
  kind: RuntimeRenderArtifactKind;
  viewport: RuntimeDeviceViewport;
}

export interface RuntimeAutomationSession {
  id: string;
  appIdentifier: string;
  snapshot: RuntimeTreeSnapshot;
  logs: RuntimeAutomationLogEntry[];
  artifactBundle: RuntimeArtifactBundle;
  device: RuntimeDeviceSettings;
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

export type RuntimeRenderArtifactKind = "screenshot" | "render";

export interface RuntimeArtifactBundle {
  sessionID: string;
  renderArtifacts: RuntimeAutomationScreenshotMetadata[];
  semanticSnapshots: RuntimeSemanticSnapshotArtifact[];
  logs: RuntimeAutomationLogEntry[];
  networkRecords: RuntimeNetworkRequestRecord[];
}

export interface RuntimeSemanticSnapshotArtifact {
  name: string;
  tree: SemanticUITree;
  revision: number;
}

export interface RuntimeDeviceViewport {
  width: number;
  height: number;
  scale: number;
}

export interface RuntimeDeviceClock {
  frozenAtISO8601?: string;
  timeZone: string;
}

export interface RuntimeDeviceGeolocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export interface RuntimeDeviceNetworkState {
  isOnline: boolean;
  latencyMilliseconds: number;
  downloadKbps: number;
}

export interface RuntimeDeviceSettings {
  viewport: RuntimeDeviceViewport;
  colorScheme: "light" | "dark";
  locale: string;
  clock: RuntimeDeviceClock;
  geolocation?: RuntimeDeviceGeolocation;
  network: RuntimeDeviceNetworkState;
}

export interface RuntimeNetworkFixtureInput {
  id: string;
  method?: string;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface RuntimeNetworkFixture {
  id: string;
  method: string;
  url: string;
  response: RuntimeNetworkResponse;
}

export interface RuntimeNetworkRequestInput {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface RuntimeNetworkRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  bodyByteCount: number;
}

export interface RuntimeNetworkResponse {
  status: number;
  headers: Record<string, string>;
  bodyByteCount: number;
}

export interface RuntimeNetworkRequestRecord {
  id: string;
  request: RuntimeNetworkRequest;
  response: RuntimeNetworkResponse;
  source: RuntimeNetworkRequestRecordSource;
}

export type RuntimeNetworkRequestRecordSource =
  | { fixtureId: string }
  | { missingFixture: true };
