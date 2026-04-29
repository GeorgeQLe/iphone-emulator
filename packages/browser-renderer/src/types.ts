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
}

export interface UITreeScene {
  id: string;
  kind: "screen" | "modal" | "tabView" | "alert";
  rootNode?: UITreeNode;
  navigationState?: UINavigationState;
  modalState?: UIModalState;
  tabState?: UITabState;
  alertPayload?: UIAlertPayload;
}

export interface SemanticUITree {
  appIdentifier: string;
  scene: UITreeScene;
  nativePreview?: NativePreviewState;
}

export interface NativePreviewState {
  permissionPrompts: NativePermissionPromptPreview[];
  fixtureOutputs: NativeFixtureOutputPreview[];
  locationEvents: NativeLocationEventPreview[];
  clipboard?: NativeClipboardPreview;
  keyboard?: NativeKeyboardPreview;
  filePickerRecords: NativeFilePickerPreview[];
  shareSheetRecords: NativeShareSheetPreview[];
  notificationRecords: NativeNotificationPreview[];
}

export interface NativePermissionPromptPreview {
  capability: string;
  state?: string;
  result: string;
}

export interface NativeFixtureOutputPreview {
  capability: string;
  identifier: string;
  fixtureName?: string;
}

export interface NativeLocationEventPreview {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export interface NativeClipboardPreview {
  text: string;
}

export interface NativeKeyboardPreview {
  focusedElementID: string;
  keyboardType: string;
  returnKey: string;
}

export interface NativeFilePickerPreview {
  identifier: string;
  selectedFiles: string[];
}

export interface NativeShareSheetPreview {
  identifier: string;
  activityType: string;
  items: string[];
}

export interface NativeNotificationPreview {
  identifier: string;
  title: string;
  state: string;
}

export type RendererRenderArtifactKind = "render";

export interface RendererViewportMetadata {
  width: number;
  height: number;
  scale: number;
}

export interface RendererRenderArtifactMetadata {
  name: string;
  kind: RendererRenderArtifactKind;
  format: "dom";
  byteCount: number;
  viewport: RendererViewportMetadata;
  appIdentifier: string;
  sceneId: string;
  sceneKind: UITreeScene["kind"];
  rootNodeId?: string;
  nodeCount: number;
}
