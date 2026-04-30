import { rendererStyles } from "./styles";
import type {
  NativePreviewState,
  SemanticUITree,
  UIAlertPayload,
  UIModalState,
  UITabState,
  UITreeNode,
  UITreeRole,
} from "./types";

const TEXT_ROLES = new Set<UITreeRole>(["text", "screen", "navigationStack", "modal", "alert"]);
const STACK_ROLES = new Set<UITreeRole>(["vStack", "screen", "navigationStack"]);

export function mountRenderer(
  container: HTMLElement,
  tree: SemanticUITree
): HTMLElement {
  container.replaceChildren();
  container.dataset.rendererRoot = "true";
  appendStyles(container.ownerDocument);

  const shell = container.ownerDocument.createElement("section");
  shell.className = "phone-shell";
  shell.setAttribute("data-app-id", tree.appIdentifier);

  shell.append(createChrome(container.ownerDocument));
  shell.append(createSurface(container.ownerDocument, tree));
  container.append(shell);

  return shell;
}

function appendStyles(document: Document): void {
  const existing = document.getElementById("renderer-styles");
  if (existing) {
    return;
  }

  const style = document.createElement("style");
  style.id = "renderer-styles";
  style.textContent = rendererStyles;
  document.head.append(style);
}

function createChrome(document: Document): HTMLElement {
  const chrome = document.createElement("div");
  chrome.className = "phone-chrome";

  const time = document.createElement("span");
  time.textContent = "9:41";

  const notch = document.createElement("div");
  notch.className = "phone-notch";
  notch.setAttribute("aria-hidden", "true");

  const network = document.createElement("span");
  network.textContent = "Wi-Fi";

  chrome.append(time, notch, network);
  return chrome;
}

function createSurface(document: Document, tree: SemanticUITree): HTMLElement {
  const surface = document.createElement("div");
  surface.className = "phone-surface";

  const header = document.createElement("header");
  header.className = "surface-header";

  const kicker = document.createElement("p");
  kicker.className = "surface-kicker";
  kicker.textContent = tree.appIdentifier;

  const title = document.createElement("h1");
  title.className = "surface-title";
  title.textContent = tree.scene.rootNode?.label ?? tree.scene.id;

  header.append(kicker, title);
  surface.append(header);

  const body = document.createElement("main");
  body.className = "surface-body";
  body.setAttribute("data-scene-kind", tree.scene.kind);

  body.append(createSceneMeta(document, tree));

  if (tree.scene.rootNode) {
    body.append(renderNode(document, tree.scene.rootNode, tree.scene.tabState));
  }

  const nativePreview = renderNativePreview(document, tree.nativePreview);
  if (nativePreview) {
    body.append(nativePreview);
  }

  surface.append(body);

  if (tree.scene.modalState?.isPresented && tree.scene.modalState.presentedNode) {
    surface.append(renderModalOverlay(document, tree.scene.modalState, tree.scene.tabState));
  }

  if (tree.scene.alertPayload) {
    surface.append(renderAlertOverlay(document, tree.scene.alertPayload));
  }

  return surface;
}

function createSceneMeta(document: Document, tree: SemanticUITree): HTMLElement {
  const meta = document.createElement("div");
  meta.className = "scene-meta";

  const rootId = tree.scene.rootNode?.id ?? "none";
  meta.append(
    createMetaPill(document, `scene:${tree.scene.id}`),
    createMetaPill(document, `root:${rootId}`),
    createMetaPill(
      document,
      `nav:${tree.scene.navigationState?.selectedIdentifier ?? "none"}`
    )
  );

  return meta;
}

function createMetaPill(document: Document, label: string): HTMLElement {
  const pill = document.createElement("span");
  pill.className = "scene-meta-pill";
  pill.textContent = label;
  return pill;
}

function renderNativePreview(
  document: Document,
  nativePreview: NativePreviewState | undefined
): HTMLElement | undefined {
  if (!nativePreview || !hasNativePreviewRecords(nativePreview)) {
    return undefined;
  }

  const section = document.createElement("section");
  section.className = "native-preview";
  section.setAttribute("aria-label", "Deterministic native capability preview");

  const heading = document.createElement("h2");
  heading.textContent = "Native Mocks";
  section.append(heading);

  const cameraFixtures = nativePreview.fixtureOutputs.filter(
    (fixture) => fixture.capability === "camera"
  );
  if (cameraFixtures.length > 0 || promptsFor(nativePreview, "camera").length > 0) {
    section.append(
      createNativePreviewCard(document, "camera", "Camera", [
        ...promptRows(nativePreview, "camera"),
        ...cameraFixtures.map((fixture) => [
          fixture.identifier,
          fixture.fixtureName ?? "fixture",
        ] as const),
      ])
    );
  }

  const photoFixtures = nativePreview.fixtureOutputs.filter(
    (fixture) => fixture.capability === "photos"
  );
  if (photoFixtures.length > 0 || promptsFor(nativePreview, "photos").length > 0) {
    section.append(
      createNativePreviewCard(document, "photos", "Photos", [
        ...promptRows(nativePreview, "photos"),
        ...photoFixtures.map((fixture) => [
          fixture.identifier,
          fixture.fixtureName ?? "fixture",
        ] as const),
      ])
    );
  }

  if (nativePreview.locationEvents.length > 0) {
    section.append(
      createNativePreviewCard(
        document,
        "location",
        "Location",
        nativePreview.locationEvents.map((event, index) => [
          `event ${index + 1}`,
          `${event.latitude}, ${event.longitude} ±${event.accuracyMeters}m`,
        ])
      )
    );
  }

  if (nativePreview.clipboard) {
    section.append(
      createNativePreviewCard(document, "clipboard", "Clipboard", [
        ["text", nativePreview.clipboard.text],
      ])
    );
  }

  if (nativePreview.keyboard) {
    section.append(
      createNativePreviewCard(document, "keyboardInput", "Keyboard", [
        ["focused", nativePreview.keyboard.focusedElementID],
        ["type", nativePreview.keyboard.keyboardType],
        ["return", nativePreview.keyboard.returnKey],
      ])
    );
  }

  if (nativePreview.filePickerRecords.length > 0) {
    section.append(
      createNativePreviewCard(
        document,
        "files",
        "Files",
        nativePreview.filePickerRecords.map((record) => [
          record.identifier,
          record.selectedFiles.join(", "),
        ])
      )
    );
  }

  if (nativePreview.shareSheetRecords.length > 0) {
    section.append(
      createNativePreviewCard(
        document,
        "shareSheet",
        "Share Sheet",
        nativePreview.shareSheetRecords.map((record) => [
          record.identifier,
          `${record.activityType}: ${record.items.join(", ")}`,
        ])
      )
    );
  }

  if (nativePreview.notificationRecords.length > 0 || promptsFor(nativePreview, "notifications").length > 0) {
    section.append(
      createNativePreviewCard(document, "notifications", "Notifications", [
        ...promptRows(nativePreview, "notifications"),
        ...nativePreview.notificationRecords.map((record) => [
          record.identifier,
          `${record.title}: ${record.state}`,
        ] as const),
      ])
    );
  }

  if (nativePreview.automationFlow?.steps.length) {
    section.append(createNativeAutomationFlowCard(document, nativePreview));
  }

  if (nativePreview.deviceEnvironment) {
    section.append(
      createNativePreviewCard(document, "deviceEnvironment", "Device Environment", [
        ...(nativePreview.deviceEnvironment.viewport
          ? [["viewport", nativePreview.deviceEnvironment.viewport] as const]
          : []),
        ["scheme", nativePreview.deviceEnvironment.colorScheme],
        ["locale", nativePreview.deviceEnvironment.locale],
        ...(nativePreview.deviceEnvironment.timeZone
          ? [["time zone", nativePreview.deviceEnvironment.timeZone] as const]
          : []),
      ])
    );
  }

  if (nativePreview.unsupportedControls?.length) {
    section.append(
      createNativePreviewCard(document, "unsupported", "Unsupported Controls", [
        ["controls", nativePreview.unsupportedControls.join(", ")],
      ])
    );
  }

  for (const prompt of nativePreview.permissionPrompts.filter(
    (prompt) => !["camera", "photos", "notifications"].includes(prompt.capability)
  )) {
    section.append(
      createNativePreviewCard(document, prompt.capability, titleCase(prompt.capability), [
        ["permission", `${prompt.state ?? "prompt"} -> ${prompt.result}`],
      ])
    );
  }

  return section;
}

function createNativeAutomationFlowCard(
  document: Document,
  nativePreview: NativePreviewState
): HTMLElement {
  const card = document.createElement("section");
  card.className = "native-preview-card";
  card.dataset.nativeFlow = "true";

  const heading = document.createElement("h3");
  heading.textContent = "Agent Native Flow";
  card.append(heading);

  const list = document.createElement("ol");
  list.className = "native-flow-list";
  for (const [index, step] of nativePreview.automationFlow?.steps.entries() ?? []) {
    const item = document.createElement("li");
    item.textContent = [
      `${index + 1}. ${step.action}`,
      step.identifier,
      step.detail,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ");
    list.append(item);
  }

  card.append(list);
  return card;
}

function createNativePreviewCard(
  document: Document,
  capability: string,
  title: string,
  rows: Array<readonly [string, string]>
): HTMLElement {
  const card = document.createElement("section");
  card.className = "native-preview-card";
  card.dataset.nativeCapability = capability;

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.append(heading);

  const list = document.createElement("dl");
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    term.textContent = label;

    const description = document.createElement("dd");
    description.textContent = value;

    list.append(term, description);
  }

  card.append(list);
  return card;
}

function promptRows(
  nativePreview: NativePreviewState,
  capability: string
): Array<readonly [string, string]> {
  return promptsFor(nativePreview, capability).map((prompt) => [
    "permission",
    `${prompt.state ?? "prompt"} -> ${prompt.result}`,
  ]);
}

function promptsFor(
  nativePreview: NativePreviewState,
  capability: string
): NativePreviewState["permissionPrompts"] {
  return nativePreview.permissionPrompts.filter((prompt) => prompt.capability === capability);
}

function hasNativePreviewRecords(nativePreview: NativePreviewState): boolean {
  return (
    nativePreview.permissionPrompts.length > 0 ||
    nativePreview.fixtureOutputs.length > 0 ||
    nativePreview.locationEvents.length > 0 ||
    nativePreview.clipboard !== undefined ||
    nativePreview.keyboard !== undefined ||
    nativePreview.filePickerRecords.length > 0 ||
    nativePreview.shareSheetRecords.length > 0 ||
    nativePreview.notificationRecords.length > 0 ||
    (nativePreview.automationFlow?.steps.length ?? 0) > 0 ||
    nativePreview.deviceEnvironment !== undefined ||
    (nativePreview.unsupportedControls?.length ?? 0) > 0
  );
}

function titleCase(value: string): string {
  return value.replace(/(^|[A-Z])([a-z])/gu, (match, boundary: string, character: string) =>
    boundary === "" ? character.toUpperCase() : `${boundary} ${character}`
  );
}

function renderNode(
  document: Document,
  node: UITreeNode,
  tabState?: UITabState
): HTMLElement {
  switch (node.role) {
    case "text":
      return renderTextNode(document, node);
    case "button":
      return renderButtonNode(document, node, tabState);
    case "textField":
      return renderTextFieldNode(document, node);
    case "list":
      return renderListNode(document, node);
    case "hStack":
      return renderContainerNode(document, node, "node-hStack", tabState);
    case "vStack":
      return renderContainerNode(document, node, "node-stack", tabState);
    case "screen":
    case "navigationStack":
    case "modal":
    case "alert":
      return renderContainerNode(document, node, `node-${node.role}`, tabState);
    case "tabView":
      return renderTabViewNode(document, node, tabState);
  }
}

function renderTextNode(document: Document, node: UITreeNode): HTMLElement {
  const element = document.createElement(TEXT_ROLES.has(node.role) ? "section" : "p");
  element.className = "node-text";
  if (node.label) {
    element.textContent = node.label;
  }
  if (node.metadata.emphasis) {
    element.dataset.emphasis = node.metadata.emphasis;
  }
  applyNodeMetadata(element, node);
  return element;
}

function renderButtonNode(
  document: Document,
  node: UITreeNode,
  tabState?: UITabState
): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "node-button";
  button.textContent = node.label ?? node.id;
  if (node.metadata.variant) {
    button.dataset.variant = node.metadata.variant;
  }
  if (tabState?.selectedIdentifier === node.id) {
    button.dataset.selected = "true";
    button.classList.add("tab-button");
  }
  applyNodeMetadata(button, node);
  return button;
}

function renderTextFieldNode(document: Document, node: UITreeNode): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "node-textField";

  const label = document.createElement("span");
  label.textContent = node.label ?? node.id;

  const input = document.createElement("input");
  input.type = "text";
  input.value = node.value ?? "";
  input.placeholder = node.metadata.placeholder ?? "";
  input.dataset.inputNodeId = node.id;
  input.setAttribute("aria-label", node.label ?? node.id);

  wrapper.append(label, input);
  applyNodeMetadata(wrapper, node);
  return wrapper;
}

function renderListNode(document: Document, node: UITreeNode): HTMLElement {
  const section = document.createElement("section");
  section.className = "node-list";
  if (node.label) {
    section.setAttribute("aria-label", node.label);
  }

  for (const child of node.children) {
    const item = document.createElement("div");
    item.className = "node-list-item";
    item.append(renderNode(document, child));
    section.append(item);
  }

  applyNodeMetadata(section, node);
  return section;
}

function renderContainerNode(
  document: Document,
  node: UITreeNode,
  className: string,
  tabState?: UITabState
): HTMLElement {
  const element = document.createElement(STACK_ROLES.has(node.role) ? "section" : "div");
  element.className = className;
  if (node.label) {
    element.setAttribute("aria-label", node.label);
  }

  for (const child of node.children) {
    element.append(renderNode(document, child, tabState));
  }

  applyNodeMetadata(element, node);
  return element;
}

function renderTabViewNode(
  document: Document,
  node: UITreeNode,
  tabState?: UITabState
): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "tab-bar";
  nav.setAttribute("aria-label", node.label ?? "Tabs");

  for (const child of node.children) {
    nav.append(renderButtonNode(document, child, tabState));
  }

  applyNodeMetadata(nav, node);
  return nav;
}

function renderModalOverlay(
  document: Document,
  modalState: UIModalState,
  tabState?: UITabState
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "modal-backdrop";
  overlay.setAttribute("aria-hidden", "true");

  const card = document.createElement("section");
  card.className = "modal-card";
  card.setAttribute("aria-label", modalState.presentedNode?.label ?? "Modal");

  if (modalState.presentedNode) {
    card.append(renderNode(document, modalState.presentedNode, tabState));
  }

  overlay.append(card);
  return overlay;
}

function renderAlertOverlay(document: Document, alertPayload: UIAlertPayload): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "alert-backdrop";
  overlay.setAttribute("aria-hidden", "true");

  const card = document.createElement("section");
  card.className = "alert-card";
  card.setAttribute("role", "alert");

  const title = document.createElement("strong");
  title.textContent = alertPayload.title;

  card.append(title);

  if (alertPayload.message) {
    const message = document.createElement("p");
    message.className = "node-text";
    message.textContent = alertPayload.message;
    card.append(message);
  }

  overlay.append(card);
  return overlay;
}

function applyNodeMetadata(element: HTMLElement, node: UITreeNode): void {
  element.dataset.nodeId = node.id;
  element.dataset.role = node.role;

  for (const [key, value] of Object.entries(node.metadata)) {
    element.dataset[`meta${capitalize(key)}`] = value;
  }
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
