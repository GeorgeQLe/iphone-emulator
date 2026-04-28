import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import "monaco-editor/min/vs/editor/editor.main.css";
import { createRenderArtifactMetadata } from "./renderArtifacts";
import { demoStyles } from "./demoStyles";
import {
  compileDemoProject,
  demoProjectFiles,
  type DemoCompileResult,
  type DemoProjectFile,
} from "./demoProject";
import { mountRenderer } from "./renderTree";
import type { UITreeNode } from "./types";

(self as Window & typeof globalThis & { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }

    return new editorWorker();
  },
};

const appRoot = document.getElementById("app");

if (!appRoot) {
  throw new Error("Renderer mount root #app was not found.");
}

appendDemoStyles(document);

const projectFiles = new Map(demoProjectFiles.map((file) => [file.path, file]));
let activeFile = demoProjectFiles[0];
let lastCompileResult = compileDemoProject(activeFile.value);
let activePreviewInput: HTMLInputElement | undefined;

const shell = document.createElement("div");
shell.className = "demo-shell";

const sidebar = createSidebar();
const editorPane = document.createElement("section");
editorPane.className = "demo-editor-pane";
const previewPane = createPreviewPane();

shell.append(sidebar, editorPane, previewPane.container);
appRoot.replaceChildren(shell);

const toolbar = document.createElement("header");
toolbar.className = "demo-toolbar";

const activePath = document.createElement("div");
activePath.className = "demo-path";

const runButton = document.createElement("button");
runButton.type = "button";
runButton.className = "demo-run-button";
runButton.textContent = "Run Preview";

toolbar.append(activePath, runButton);

const editorContainer = document.createElement("div");
editorContainer.className = "demo-editor";

const output = document.createElement("section");
output.className = "demo-output";

editorPane.append(toolbar, editorContainer, output);

const editor = monaco.editor.create(editorContainer, {
  value: activeFile.value,
  language: activeFile.language,
  theme: "vs-dark",
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: 20,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  tabSize: 2,
});

runButton.addEventListener("click", () => {
  updateActiveFileValue(editor.getValue());
  refreshPreview();
});

editor.onDidChangeModelContent(() => {
  updateActiveFileValue(editor.getValue());
  if (activeFile.path.endsWith(".swift")) {
    refreshPreview();
  }
});

selectFile(activeFile.path);
refreshPreview();

function createSidebar(): HTMLElement {
  const aside = document.createElement("aside");
  aside.className = "demo-sidebar";

  const brand = document.createElement("header");
  brand.className = "demo-brand";

  const title = document.createElement("h1");
  title.textContent = "Agent Mobile Harness";

  const copy = document.createElement("p");
  copy.textContent =
    "Edit a mock strict-mode Swift project and watch the semantic iPhone preview update.";

  brand.append(title, copy);

  const fileList = document.createElement("nav");
  fileList.className = "demo-file-list";
  fileList.setAttribute("aria-label", "Project files");

  for (const file of demoProjectFiles) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "demo-file-button";
    button.textContent = file.path;
    button.dataset.path = file.path;
    button.addEventListener("click", () => selectFile(file.path));
    fileList.append(button);
  }

  const footer = document.createElement("footer");
  footer.className = "demo-sidebar-footer";
  footer.textContent =
    "This demo mocks the intended browser IDE loop: source, semantic lowering, preview, diagnostics, and artifacts.";

  aside.append(brand, fileList, footer);
  return aside;
}

function createPreviewPane(): {
  container: HTMLElement;
  stage: HTMLElement;
  inspector: HTMLPreElement;
} {
  const container = document.createElement("section");
  container.className = "demo-preview-pane";

  const header = document.createElement("header");
  header.className = "demo-preview-header";

  const title = document.createElement("h2");
  title.textContent = "iPhone-like Preview";

  const copy = document.createElement("p");
  copy.textContent =
    "The preview is rendered from a semantic UI tree, the same contract an agent would inspect.";

  header.append(title, copy);

  const stage = document.createElement("div");
  stage.className = "demo-preview-stage";

  const inspector = document.createElement("pre");
  inspector.className = "demo-inspector";

  container.append(header, stage, inspector);
  return { container, stage, inspector };
}

function selectFile(path: string): void {
  updateActiveFileValue(editor?.getValue?.() ?? activeFile.value);

  const nextFile = projectFiles.get(path);
  if (!nextFile) {
    return;
  }

  activeFile = nextFile;
  activePath.textContent = activeFile.path;

  for (const button of Array.from(
    sidebar.querySelectorAll<HTMLButtonElement>(".demo-file-button")
  )) {
    button.dataset.active = String(button.dataset.path === activeFile.path);
  }

  const model = monaco.editor.createModel(
    activeFile.value,
    activeFile.language,
    monaco.Uri.parse(`file:///${activeFile.path}`)
  );
  editor.setModel(model);
}

function updateActiveFileValue(value: string): void {
  activeFile.value = value;
}

function refreshPreview(): void {
  const swiftFile = projectFiles.get("Sources/TravelPlannerApp.swift");
  if (!swiftFile) {
    return;
  }

  lastCompileResult = compileDemoProject(swiftFile.value);
  previewPane.stage.replaceChildren();
  const rendererRoot = document.createElement("div");
  previewPane.stage.append(rendererRoot);
  mountRenderer(rendererRoot, lastCompileResult.tree);
  wirePreviewInteractions(rendererRoot);
  renderOutput(lastCompileResult);
  renderInspector(lastCompileResult);
}

function renderOutput(result: DemoCompileResult): void {
  const heading = document.createElement("h2");
  heading.textContent = "Harness Output";

  const list = document.createElement("ul");
  list.className = "demo-diagnostic-list";

  const diagnostics =
    result.diagnostics.length > 0
      ? result.diagnostics
      : [
          {
            severity: "info" as const,
            message: "Semantic preview compiled. No unsupported strict-mode declarations found.",
          },
        ];

  for (const diagnostic of diagnostics) {
    const item = document.createElement("li");
    item.className = "demo-diagnostic";
    item.dataset.severity = diagnostic.severity;
    item.textContent = diagnostic.message;
    list.append(item);
  }

  output.replaceChildren(heading, list);
}

function renderInspector(result: DemoCompileResult): void {
  const artifact = createRenderArtifactMetadata(result.tree, {
    name: "demo-render",
    viewport: {
      width: 393,
      height: 852,
      scale: 3,
    },
  });

  previewPane.inspector.textContent = JSON.stringify(
    {
      appIdentifier: result.tree.appIdentifier,
      scene: result.tree.scene.id,
      artifact,
      semanticRoot: result.tree.scene.rootNode,
    },
    null,
    2
  );
}

function wirePreviewInteractions(rendererRoot: HTMLElement): void {
  const surface = rendererRoot.querySelector<HTMLElement>(".phone-surface");
  if (!surface) {
    return;
  }

  surface.addEventListener("focusin", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    activePreviewInput = input;
    showKeyboard(surface);
  });

  surface.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const field = input.closest<HTMLElement>("[data-node-id]");
    if (!field?.dataset.nodeId) {
      return;
    }

    updateTreeNodeValue(lastCompileResult.tree.scene.rootNode, field.dataset.nodeId, input.value);
    renderInspector(lastCompileResult);
  });
}

function showKeyboard(surface: HTMLElement): void {
  surface.querySelector(".demo-keyboard")?.remove();
  surface.append(createKeyboard(surface.ownerDocument));
}

function createKeyboard(document: Document): HTMLElement {
  const keyboard = document.createElement("div");
  keyboard.className = "demo-keyboard";
  keyboard.setAttribute("aria-label", "Mock iOS keyboard");

  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  for (const row of rows) {
    const rowElement = document.createElement("div");
    rowElement.className = "demo-keyboard-row";
    for (const character of row) {
      rowElement.append(createKey(document, character, () => insertPreviewText(character)));
    }
    keyboard.append(rowElement);
  }

  const controls = document.createElement("div");
  controls.className = "demo-keyboard-row";
  controls.append(
    createKey(document, "Space", () => insertPreviewText(" "), { wide: true }),
    createKey(document, "⌫", deletePreviewText, { wide: true }),
    createKey(document, "Done", hideKeyboard, { action: "done" })
  );
  keyboard.append(controls);

  return keyboard;
}

function createKey(
  document: Document,
  label: string,
  onClick: () => void,
  options: { wide?: boolean; action?: string } = {}
): HTMLButtonElement {
  const key = document.createElement("button");
  key.type = "button";
  key.className = "demo-key";
  key.textContent = label;
  key.dataset.wide = String(options.wide ?? false);
  if (options.action) {
    key.dataset.action = options.action;
  }
  key.addEventListener("mousedown", (event) => event.preventDefault());
  key.addEventListener("click", onClick);
  return key;
}

function insertPreviewText(value: string): void {
  if (!activePreviewInput) {
    return;
  }

  const start = activePreviewInput.selectionStart ?? activePreviewInput.value.length;
  const end = activePreviewInput.selectionEnd ?? activePreviewInput.value.length;
  activePreviewInput.setRangeText(value, start, end, "end");
  activePreviewInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  activePreviewInput.focus();
}

function deletePreviewText(): void {
  if (!activePreviewInput) {
    return;
  }

  const start = activePreviewInput.selectionStart ?? activePreviewInput.value.length;
  const end = activePreviewInput.selectionEnd ?? activePreviewInput.value.length;
  if (start === end && start > 0) {
    activePreviewInput.setRangeText("", start - 1, end, "end");
  } else {
    activePreviewInput.setRangeText("", start, end, "end");
  }
  activePreviewInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
  activePreviewInput.focus();
}

function hideKeyboard(): void {
  activePreviewInput?.blur();
  activePreviewInput
    ?.closest(".phone-surface")
    ?.querySelector(".demo-keyboard")
    ?.remove();
  activePreviewInput = undefined;
}

function updateTreeNodeValue(node: UITreeNode | undefined, nodeId: string, value: string): boolean {
  if (!node) {
    return false;
  }

  if (node.id === nodeId) {
    node.value = value;
    return true;
  }

  return node.children.some((child) => updateTreeNodeValue(child, nodeId, value));
}

function appendDemoStyles(document: Document): void {
  const style = document.createElement("style");
  style.id = "demo-styles";
  style.textContent = demoStyles;
  document.head.append(style);
}
