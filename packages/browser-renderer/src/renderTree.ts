import { rendererStyles } from "./styles";
import type {
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
      return renderContainerNode(document, node, "node-hStack");
    case "vStack":
      return renderContainerNode(document, node, "node-stack");
    case "screen":
    case "navigationStack":
    case "modal":
    case "alert":
      return renderContainerNode(document, node, `node-${node.role}`);
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
  input.readOnly = true;

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
  className: string
): HTMLElement {
  const element = document.createElement(STACK_ROLES.has(node.role) ? "section" : "div");
  element.className = className;
  if (node.label) {
    element.setAttribute("aria-label", node.label);
  }

  for (const child of node.children) {
    element.append(renderNode(document, child));
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
