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
  mode?: "fixture";
  appIdentifier: string;
  fixtureName: string;
  device?: RuntimeDeviceSettings;
  nativeCapabilities?: RuntimeNativeCapabilityManifest;
}

export interface RuntimeTransportLaunchOptions {
  mode: "transport";
  appIdentifier: string;
  fixtureName: string;
  transport: RuntimeTransportLike;
  device?: RuntimeDeviceSettings;
  nativeCapabilities?: RuntimeNativeCapabilityManifest;
}

export interface RuntimeTransportLike {
  launch(options: RuntimeTransportLaunchRequest): Promise<RuntimeAutomationSession>;
  close(sessionID: string): Promise<{ sessionID: string }>;
  inspect?(sessionID: string, query: SemanticQuery): Promise<UITreeNode>;
  tap?(sessionID: string, query: SemanticQuery): Promise<RuntimeAutomationSession>;
  fill?(sessionID: string, query: SemanticQuery, text: string): Promise<RuntimeAutomationSession>;
  logs?(sessionID: string): Promise<RuntimeAutomationLogEntry[]>;
  artifacts?(sessionID: string): Promise<RuntimeArtifactBundle>;
  request?(
    sessionID: string,
    url: string,
    options?: RuntimeNetworkRequestInput
  ): Promise<RuntimeNetworkRequestRecord>;
  route?(sessionID: string, url: string, fixture: RuntimeNetworkFixtureInput): Promise<void>;
  screenshot?(sessionID: string, name?: string): Promise<RuntimeAutomationScreenshotMetadata>;
  semanticTree?(sessionID: string): Promise<SemanticUITree>;
  session?(sessionID: string): Promise<RuntimeAutomationSession>;
  nativeAutomation?(
    sessionID: string,
    expectedSemanticRevision: number,
    action: RuntimeNativeAutomationAction
  ): Promise<RuntimeNativeAutomationResult>;
  nativeDeviceSnapshot?(sessionID: string): Promise<RuntimeDeviceSettings>;
  nativeCapabilityEvents?(sessionID: string): Promise<RuntimeNativeCapabilityRecord[]>;
}

export interface RuntimeTransportLaunchRequest {
  appIdentifier: string;
  fixtureName: string;
  device?: RuntimeDeviceSettings;
  nativeCapabilities?: RuntimeNativeCapabilityManifest;
}

export type EmulatorLaunchOptions =
  | RuntimeAutomationLaunchOptions
  | RuntimeTransportLaunchOptions;

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
  nativeCapabilities: RuntimeNativeCapabilityManifest;
  nativeCapabilityState: RuntimeNativeCapabilityState;
  nativeCapabilityEvents: RuntimeNativeCapabilityRecord[];
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
  nativeCapabilityRecords: RuntimeNativeCapabilityRecord[];
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

export interface RuntimeNativeCapabilityManifest {
  requiredCapabilities: RuntimeNativeCapabilityRequirement[];
  configuredMocks: RuntimeNativeCapabilityMock[];
  scriptedEvents: RuntimeNativeCapabilityEvent[];
  unsupportedSymbols: RuntimeNativeUnsupportedSymbol[];
  artifactOutputs: RuntimeNativeCapabilityArtifactOutput[];
}

export type RuntimeNativeCapabilityID =
  | "permissions"
  | "camera"
  | "photos"
  | "location"
  | "network"
  | "clipboard"
  | "keyboardInput"
  | "files"
  | "shareSheet"
  | "notifications"
  | "deviceEnvironment"
  | "sensors"
  | "haptics"
  | "unsupported";

export type RuntimeNativePermissionState =
  | "unsupported"
  | "notRequested"
  | "prompt"
  | "granted"
  | "denied"
  | "restricted";

export interface RuntimeNativeCapabilityRequirement {
  id: RuntimeNativeCapabilityID;
  permissionState: RuntimeNativePermissionState;
  strictModeAlternative: string;
}

export interface RuntimeNativeCapabilityMock {
  capability: RuntimeNativeCapabilityID;
  identifier: string;
  payload: Record<string, string>;
}

export interface RuntimeNativeCapabilityEvent {
  capability: RuntimeNativeCapabilityID;
  name: string;
  atRevision: number;
  payload: Record<string, string>;
}

export interface RuntimeNativeUnsupportedSymbol {
  symbolName: string;
  capability: RuntimeNativeCapabilityID;
  suggestedAdaptation: string;
}

export type RuntimeNativeCapabilityArtifactOutputKind =
  | "fixtureReference"
  | "eventLog"
  | "diagnostic"
  | "semanticSnapshot";

export interface RuntimeNativeCapabilityArtifactOutput {
  capability: RuntimeNativeCapabilityID;
  name: string;
  kind: RuntimeNativeCapabilityArtifactOutputKind;
}

export interface RuntimeNativeCapabilityState {
  permissions: Record<string, RuntimeNativePermissionInspection>;
  fixtureOutputs: RuntimeNativeFixtureOutputRecord[];
  locationEvents: RuntimeNativeLocationEventRecord[];
  clipboard?: RuntimeNativeClipboardState;
  keyboard?: RuntimeNativeKeyboardState;
  filePickerRecords: RuntimeNativeFilePickerRecord[];
  shareSheetRecords: RuntimeNativeShareSheetRecord[];
  notificationRecords: RuntimeNativeNotificationRecord[];
  diagnosticRecords: RuntimeNativeDiagnosticRecord[];
}

export interface RuntimeNativePermissionInspection {
  state: RuntimeNativePermissionState;
  resolvedState: RuntimeNativePermissionState;
  strictModeAlternative: string;
  prompt: RuntimeNativePermissionPromptInspection;
}

export interface RuntimeNativePermissionPromptInspection {
  presented: boolean;
  result?: RuntimeNativePermissionState;
}

export interface RuntimeNativeFixtureOutputRecord {
  capability: RuntimeNativeCapabilityID;
  identifier: string;
  fixtureName?: string;
  payload: Record<string, string>;
}

export interface RuntimeNativeLocationEventRecord {
  name: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  revision: number;
  payload: Record<string, string>;
}

export interface RuntimeNativeClipboardState {
  identifier: string;
  text?: string;
  initialText?: string;
  currentText?: string;
  readRecords: RuntimeNativeClipboardEventRecord[];
  writeRecords: RuntimeNativeClipboardEventRecord[];
  payload: Record<string, string>;
}

export interface RuntimeNativeClipboardEventRecord {
  name: string;
  revision: number;
  text?: string;
  payload: Record<string, string>;
}

export interface RuntimeNativeKeyboardState {
  identifier: string;
  focusedElementID?: string;
  keyboardType?: string;
  returnKey?: string;
  textContentType?: string;
  autocorrection?: string;
  secureTextEntry?: boolean;
  isVisible?: boolean;
  inputTraits: RuntimeNativeKeyboardInputTraitRecord[];
  eventRecords: RuntimeNativeCapabilityRecord[];
  payload: Record<string, string>;
}

export interface RuntimeNativeKeyboardInputTraitRecord {
  identifier: string;
  focusedElementID?: string;
  keyboardType?: string;
  returnKey?: string;
  textContentType?: string;
  autocorrection?: string;
  secureTextEntry?: boolean;
  isVisible?: boolean;
  payload: Record<string, string>;
}

export interface RuntimeNativeFilePickerRecord {
  identifier: string;
  selectedFiles: string[];
  contentTypes: string[];
  allowsMultipleSelection: boolean;
  payload: Record<string, string>;
}

export interface RuntimeNativeShareSheetRecord {
  identifier: string;
  activityType?: string;
  items: string[];
  completionState?: string;
  excludedActivityTypes: string[];
  payload: Record<string, string>;
}

export interface RuntimeNativeNotificationRecord {
  identifier: string;
  title?: string;
  body?: string;
  trigger?: string;
  state: string;
  authorizationState: RuntimeNativePermissionState;
  revision: number;
  payload: Record<string, string>;
}

export interface RuntimeNativeDiagnosticRecord {
  capability: RuntimeNativeCapabilityID;
  code: string;
  message: string;
  suggestedAdaptation: string;
  payload: Record<string, string>;
}

export interface RuntimeNativeCapabilityRecord {
  capability: RuntimeNativeCapabilityID;
  name: string;
  revision: number;
  payload: Record<string, string>;
}

export type NativeAutomationSupportedCapability =
  | "camera"
  | "photos"
  | "location"
  | "clipboard"
  | "files"
  | "shareSheet"
  | "notifications"
  | "deviceEnvironment";

export type RuntimeNativeAutomationAction =
  | {
      type: "requestPermission";
      capability: RuntimeNativeCapabilityID;
    }
  | {
      type: "setPermission";
      capability: RuntimeNativeCapabilityID;
      state: RuntimeNativePermissionState;
    }
  | {
      type: "captureCamera";
      identifier?: string;
      fixtureName?: string;
      mediaType?: string;
      outputPath?: string;
    }
  | {
      type: "selectPhoto";
      identifier?: string;
      fixtureName?: string;
      assetIdentifiers?: string[];
      mediaTypes?: string[];
    }
  | {
      type: "updateLocation";
      identifier?: string;
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
    }
  | {
      type: "currentLocation";
    }
  | {
      type: "readClipboard";
      identifier?: string;
    }
  | {
      type: "writeClipboard";
      identifier?: string;
      text: string;
    }
  | {
      type: "selectFiles";
      identifier?: string;
      selectedFiles?: string[];
      contentTypes?: string[];
      allowsMultipleSelection?: boolean;
    }
  | {
      type: "completeShareSheet";
      identifier?: string;
      activityType?: string;
      items?: string[];
      completionState?: string;
    }
  | {
      type: "scheduleNotification";
      identifier?: string;
      title?: string;
      body?: string;
      trigger?: string;
    }
  | {
      type: "deliverNotification";
      identifier?: string;
      title?: string;
      body?: string;
    }
  | {
      type: "snapshotDeviceEnvironment";
    };

export type RuntimeNativeAutomationResult =
  | RuntimeNativeCapabilityRecord
  | NativeLocationSnapshot
  | NativeClipboardReadResult
  | NativeFileSelectionResult
  | RuntimeDeviceSettings;

export type NativePermissionSnapshot = Record<string, RuntimeNativePermissionInspection>;

export interface NativeLocationUpdateInput {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export interface NativeLocationSnapshot {
  permissionState: RuntimeNativePermissionState;
  coordinate?: NativeLocationUpdateInput;
  diagnostic?: RuntimeNativeDiagnosticRecord;
}

export interface NativeClipboardReadResult {
  text?: string;
  record: RuntimeNativeCapabilityRecord;
}

export interface NativeFileSelectionResult {
  selectedFiles: string[];
  record: RuntimeNativeCapabilityRecord;
}

export interface NativeShareSheetCompletionInput {
  completionState: string;
}

export interface NativeAutomationNamespace {
  permissions: {
    snapshot(): Promise<NativePermissionSnapshot>;
    request(
      capability: NativeAutomationSupportedCapability
    ): Promise<RuntimeNativeCapabilityRecord>;
    set(
      capability: NativeAutomationSupportedCapability,
      state: RuntimeNativePermissionState
    ): Promise<RuntimeNativeCapabilityRecord>;
  };
  camera: {
    capture(fixtureIdentifier: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  photos: {
    select(fixtureIdentifier: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  location: {
    current(): Promise<NativeLocationSnapshot>;
    update(coordinate: NativeLocationUpdateInput): Promise<RuntimeNativeCapabilityRecord>;
  };
  clipboard: {
    read(): Promise<NativeClipboardReadResult>;
    write(text: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  files: {
    select(fixtureIdentifier: string): Promise<NativeFileSelectionResult>;
  };
  shareSheet: {
    complete(
      identifier: string,
      result: NativeShareSheetCompletionInput
    ): Promise<RuntimeNativeCapabilityRecord>;
  };
  notifications: {
    requestAuthorization(): Promise<RuntimeNativeCapabilityRecord>;
    schedule(identifier: string): Promise<RuntimeNativeCapabilityRecord>;
    deliver(identifier: string): Promise<RuntimeNativeCapabilityRecord>;
  };
  device: {
    snapshot(): Promise<RuntimeDeviceSettings>;
  };
  events(): Promise<RuntimeNativeCapabilityRecord[]>;
  artifacts(): Promise<RuntimeNativeCapabilityRecord[]>;
}
