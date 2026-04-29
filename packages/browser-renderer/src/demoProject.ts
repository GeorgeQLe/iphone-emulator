import type { NativePreviewState, SemanticUITree, UITreeNode } from "./types";

export interface DemoProjectFile {
  path: string;
  language: string;
  value: string;
}

export interface DemoDiagnostic {
  severity: "info" | "warning" | "error";
  message: string;
  source?: string;
}

export interface DemoCompileResult {
  tree: SemanticUITree;
  diagnostics: DemoDiagnostic[];
  nativePreview?: NativePreviewState;
  executionMode: {
    kind: "illustrative-lowering";
    label: string;
    detail: string;
  };
}

export const demoProjectFiles: DemoProjectFile[] = [
  {
    path: "Sources/TravelPlannerApp.swift",
    language: "swift",
    value: `import StrictModeSDK

@StrictModeApp
struct TravelPlannerApp {
  var body: some StrictScene {
    NavigationStack(title: "Trip Board") {
      VStack(spacing: 16) {
        Text("Plan a weekend in Kyoto")
          .emphasis(.headline)

        HStack {
          TextField("Traveler", text: "Taylor")
            .testID("traveler-field")

          Button("Save Trip")
            .variant(.primary)
            .testID("save-trip")
        }

        List("Itinerary") {
          Text("Book ryokan")
          Text("Reserve ramen counter")
          Text("Map temple walk")
        }

        Button("Generate Agent Check")
          .testID("agent-check")
      }
    }
  }

  var nativeMocks: some NativeCapabilityMocks {
    PermissionPrompt(.camera, result: .granted)
    CameraFixture("front-camera-still", fixtureName: "profile-photo")
    PhotoPickerFixture("recent-library-pick", assets: ["profile-photo", "receipt-photo"])
    LocationEvent(latitude: 35.0116, longitude: 135.7681, accuracyMeters: 18)
    ClipboardFixture(text: "Kyoto weekend notes")
    KeyboardFixture(focusedElementID: "traveler-field", keyboardType: .default, returnKey: .done)
    FilePickerFixture("document-picker", selectedFiles: ["Fixtures/itinerary.pdf"])
    ShareSheetFixture("share-itinerary", activityType: .copy, items: ["Fixtures/itinerary.pdf"])
    NotificationFixture("trip-reminder", title: "Trip Reminder", state: .scheduled)
  }
}
`,
  },
  {
    path: "Tests/TravelPlanner.agent.ts",
    language: "typescript",
    value: `import { Emulator } from "@iphone-emulator/automation-sdk";

const app = await Emulator.launch({
  appIdentifier: "TravelPlannerApp",
  fixtureName: "travel-planner-demo",
  device: {
    viewport: { width: 393, height: 852, scale: 3 },
    colorScheme: "light",
    locale: "en_US",
  },
});

await app.getByText("Save Trip").tap();
const traveler = await app.getByTestId("traveler-field").inspect();
const artifacts = await app.artifacts();

console.log(traveler.value, artifacts.semanticSnapshots.length);
await app.close();
`,
  },
  {
    path: "README.md",
    language: "markdown",
    value: `# Travel Planner Demo

This mock project demonstrates the intended browser IDE loop. It does not run
Swift or connect to a live runtime yet; the browser lowers a small illustrative
strict-mode surface into the same semantic tree shape the real runtime transport
will eventually provide.

1. Edit strict-mode Swift-like app code.
2. Lower supported declarations into a semantic UI tree in the browser.
3. Render the result in an iPhone-like preview.
4. Let an agent inspect semantic state and artifacts.
`,
  },
];

export function compileDemoProject(source: string): DemoCompileResult {
  const diagnostics: DemoDiagnostic[] = [];
  const appIdentifier = matchFirst(source, /struct\s+([A-Za-z0-9_]+)\s*\{/u) ?? "DemoApp";
  const title = matchFirst(source, /NavigationStack\s*\(\s*title:\s*"([^"]+)"/u) ?? appIdentifier;
  const listDeclarations = parseLists(source);
  const textNodes = parseTextDeclarations(source, listDeclarations);
  const buttons = parseButtonDeclarations(source);
  const textFields = parseTextFieldDeclarations(source);
  const nativePreview = parseNativePreview(source);

  if (!source.includes("StrictModeSDK")) {
    diagnostics.push({
      severity: "warning",
      message: "Strict mode demos should import StrictModeSDK so the harness owns the runtime surface.",
      source: "Sources/TravelPlannerApp.swift",
    });
  }

  const unsupportedImports = matchAll(source, /^\s*import\s+(UIKit|SwiftUI|WebKit|Combine|Foundation)\b/gmu).map(
    ([framework]) => framework
  );

  for (const framework of unsupportedImports) {
    diagnostics.push({
      severity: "error",
      message: `Unsupported Apple framework import "${framework}" detected. This demo lowers only illustrative strict-mode declarations.`,
      source: "Sources/TravelPlannerApp.swift",
    });
  }

  const supportedSurfaceCount =
    textNodes.length +
    buttons.length +
    textFields.length +
    listDeclarations.reduce((count, list) => count + list.items.length, listDeclarations.length);

  if (supportedSurfaceCount === 0) {
    diagnostics.push({
      severity: "info",
      message: "No supported strict-mode UI declarations were found. Add Text, Button, TextField, or List declarations to change the semantic preview.",
      source: "Sources/TravelPlannerApp.swift",
    });
  }

  const children: UITreeNode[] = [];

  for (const textNode of textNodes) {
    children.push({
      id: textNode.testId ?? `text-${textNode.order}-${slugify(textNode.label)}`,
      role: "text",
      label: textNode.label,
      children: [],
      metadata: textNode.emphasis ? { emphasis: textNode.emphasis } : {},
    });
  }

  if (textFields[0] || buttons[0]) {
    const rowChildren: UITreeNode[] = [];
    if (textFields[0]) {
      const textField = textFields[0];
      rowChildren.push({
        id: textField.testId ?? `text-field-${slugify(textField.label)}`,
        role: "textField",
        label: textField.label,
        value: textField.value,
        children: [],
        metadata: {
          placeholder: textField.label,
        },
      });
    }

    if (buttons[0]) {
      const button = buttons[0];
      rowChildren.push({
        id: button.testId ?? `button-${slugify(button.label)}`,
        role: "button",
        label: button.label,
        children: [],
        metadata: {
          variant: button.variant ?? "primary",
        },
      });
    }

    children.push({
      id: "primary-action-row",
      role: "hStack",
      children: rowChildren,
      metadata: {
        alignment: "center",
      },
    });
  }

  for (const list of listDeclarations) {
    children.push({
      id: `list-${slugify(list.label)}`,
      role: "list",
      label: list.label,
      children: list.items.map((item, index) => ({
        id: `list-${slugify(list.label)}-item-${index + 1}-${slugify(item)}`,
        role: "text",
        label: item,
        children: [],
        metadata: {},
      })),
      metadata: {},
    });
  }

  for (const [index, button] of buttons.slice(1).entries()) {
    children.push({
      id: button.testId ?? `button-${slugify(button.label)}`,
      role: "button",
      label: button.label,
      children: [],
      metadata: {
        variant: button.variant ?? (index === 0 ? "secondary" : "plain"),
      },
    });
  }

  const tree: SemanticUITree = {
    appIdentifier,
    scene: {
      id: `${slugify(title)}-screen`,
      kind: "screen",
      navigationState: {
        stackIdentifiers: [`${slugify(title)}-screen`],
        selectedIdentifier: `${slugify(title)}-screen`,
      },
      rootNode: {
        id: "root-stack",
        role: "navigationStack",
        label: title,
        children: [
          {
            id: "demo-screen",
            role: "screen",
            label: title,
            children: [
              {
                id: "demo-layout",
                role: "vStack",
                children,
                metadata: {
                  spacing: "16",
                },
              },
            ],
            metadata: {},
          },
        ],
        metadata: {},
      },
    },
  };

  if (nativePreview) {
    tree.nativePreview = nativePreview;
  }

  return {
    diagnostics,
    executionMode: {
      kind: "illustrative-lowering",
      label: "Illustrative source lowering",
      detail:
        "This browser demo parses a small strict-mode Swift-like subset locally. It is not executing Swift or using a live runtime transport yet.",
    },
    nativePreview,
    tree,
  };
}

interface ParsedTextDeclaration {
  label: string;
  emphasis?: string;
  testId?: string;
  order: number;
}

interface ParsedButtonDeclaration {
  label: string;
  variant?: string;
  testId?: string;
}

interface ParsedTextFieldDeclaration {
  label: string;
  value: string;
  testId?: string;
}

interface ParsedListDeclaration {
  label: string;
  body: string;
  items: string[];
  start: number;
  end: number;
}

function parseTextDeclarations(
  source: string,
  listDeclarations: ParsedListDeclaration[]
): ParsedTextDeclaration[] {
  return Array.from(source.matchAll(/Text\s*\(\s*"([^"]+)"\s*\)([\s\S]*?)(?=\n\s*(?:Text|Button|TextField|List|HStack|VStack|\}))/gu))
    .filter((match) => !isInsideList(match.index ?? 0, listDeclarations))
    .map((match, index) => ({
      label: match[1],
      emphasis: matchFirst(match[2], /\.emphasis\(\.([A-Za-z0-9_]+)\)/u),
      testId: matchFirst(match[2], /\.testID\("([^"]+)"\)/u),
      order: index + 1,
    }));
}

function parseButtonDeclarations(source: string): ParsedButtonDeclaration[] {
  return Array.from(source.matchAll(/Button\s*\(\s*"([^"]+)"\s*\)([\s\S]*?)(?=\n\s*(?:Text|Button|TextField|List|HStack|VStack|\}))/gu)).map(
    (match) => ({
      label: match[1],
      variant: matchFirst(match[2], /\.variant\(\.([A-Za-z0-9_]+)\)/u),
      testId: matchFirst(match[2], /\.testID\("([^"]+)"\)/u),
    })
  );
}

function parseTextFieldDeclarations(source: string): ParsedTextFieldDeclaration[] {
  return Array.from(
    source.matchAll(/TextField\s*\(\s*"([^"]+)"\s*,\s*text:\s*"([^"]*)"\s*\)([\s\S]*?)(?=\n\s*(?:Text|Button|TextField|List|HStack|VStack|\}))/gu)
  ).map((match) => ({
    label: match[1],
    value: match[2],
    testId: matchFirst(match[3], /\.testID\("([^"]+)"\)/u),
  }));
}

function parseLists(source: string): ParsedListDeclaration[] {
  const lists: ParsedListDeclaration[] = [];
  const pattern = /List\s*\(\s*"([^"]+)"\s*\)\s*\{/gu;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const bodyStart = pattern.lastIndex;
    const bodyEnd = findMatchingBrace(source, bodyStart - 1);
    if (bodyEnd === -1) {
      continue;
    }

    const body = source.slice(bodyStart, bodyEnd);
    lists.push({
      label: match[1],
      body,
      items: matchAll(body, /Text\s*\(\s*"([^"]+)"\s*\)/gu).map(([label]) => label),
      start: match.index,
      end: bodyEnd,
    });
  }

  return lists;
}

function parseNativePreview(source: string): NativePreviewState | undefined {
  const permissionPrompts = Array.from(
    source.matchAll(/PermissionPrompt\s*\(\s*\.([A-Za-z0-9_]+)\s*,\s*result:\s*\.([A-Za-z0-9_]+)\s*\)/gu),
    (match) => ({
      capability: match[1],
      state: "prompt",
      result: match[2],
    })
  );

  const cameraFixtures = Array.from(
    source.matchAll(/CameraFixture\s*\(\s*"([^"]+)"\s*,\s*fixtureName:\s*"([^"]+)"\s*\)/gu),
    (match) => ({
      capability: "camera",
      identifier: match[1],
      fixtureName: match[2],
    })
  );

  const photoPickerFixtures = Array.from(
    source.matchAll(/PhotoPickerFixture\s*\(\s*"([^"]+)"\s*,\s*assets:\s*\[([^\]]*)\]\s*\)/gu),
    (match) => ({
      capability: "photos",
      identifier: match[1],
      fixtureName: parseStringArray(match[2]).join(","),
    })
  );

  const locationEvents = Array.from(
    source.matchAll(
      /LocationEvent\s*\(\s*latitude:\s*(-?\d+(?:\.\d+)?)\s*,\s*longitude:\s*(-?\d+(?:\.\d+)?)\s*,\s*accuracyMeters:\s*(\d+(?:\.\d+)?)\s*\)/gu
    ),
    (match) => ({
      latitude: Number(match[1]),
      longitude: Number(match[2]),
      accuracyMeters: Number(match[3]),
    })
  );

  const clipboardText = matchFirst(
    source,
    /ClipboardFixture\s*\(\s*text:\s*"([^"]*)"\s*\)/u
  );

  const keyboardMatch =
    /KeyboardFixture\s*\(\s*focusedElementID:\s*"([^"]+)"\s*,\s*keyboardType:\s*\.([A-Za-z0-9_]+)\s*,\s*returnKey:\s*\.([A-Za-z0-9_]+)\s*\)/u.exec(
      source
    );

  const filePickerRecords = Array.from(
    source.matchAll(/FilePickerFixture\s*\(\s*"([^"]+)"\s*,\s*selectedFiles:\s*\[([^\]]*)\]\s*\)/gu),
    (match) => ({
      identifier: match[1],
      selectedFiles: parseStringArray(match[2]),
    })
  );

  const shareSheetRecords = Array.from(
    source.matchAll(
      /ShareSheetFixture\s*\(\s*"([^"]+)"\s*,\s*activityType:\s*\.([A-Za-z0-9_]+)\s*,\s*items:\s*\[([^\]]*)\]\s*\)/gu
    ),
    (match) => ({
      identifier: match[1],
      activityType: match[2],
      items: parseStringArray(match[3]),
    })
  );

  const notificationRecords = Array.from(
    source.matchAll(
      /NotificationFixture\s*\(\s*"([^"]+)"\s*,\s*title:\s*"([^"]+)"\s*,\s*state:\s*\.([A-Za-z0-9_]+)\s*\)/gu
    ),
    (match) => ({
      identifier: match[1],
      title: match[2],
      state: match[3],
    })
  );

  const preview: NativePreviewState = {
    permissionPrompts,
    fixtureOutputs: [...cameraFixtures, ...photoPickerFixtures],
    locationEvents,
    ...(clipboardText !== undefined ? { clipboard: { text: clipboardText } } : {}),
    ...(keyboardMatch
      ? {
          keyboard: {
            focusedElementID: keyboardMatch[1],
            keyboardType: keyboardMatch[2],
            returnKey: keyboardMatch[3],
          },
        }
      : {}),
    filePickerRecords,
    shareSheetRecords,
    notificationRecords,
  };

  return hasNativePreviewRecords(preview) ? preview : undefined;
}

function hasNativePreviewRecords(preview: NativePreviewState): boolean {
  return (
    preview.permissionPrompts.length > 0 ||
    preview.fixtureOutputs.length > 0 ||
    preview.locationEvents.length > 0 ||
    preview.clipboard !== undefined ||
    preview.keyboard !== undefined ||
    preview.filePickerRecords.length > 0 ||
    preview.shareSheetRecords.length > 0 ||
    preview.notificationRecords.length > 0
  );
}

function parseStringArray(value: string): string[] {
  return Array.from(value.matchAll(/"([^"]*)"/gu), (match) => match[1]);
}

function isInsideList(index: number, listDeclarations: ParsedListDeclaration[]): boolean {
  return listDeclarations.some((list) => index > list.start && index < list.end);
}

function findMatchingBrace(source: string, openBraceIndex: number): number {
  let depth = 0;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") {
      depth += 1;
    }
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function matchFirst(source: string, pattern: RegExp): string | undefined {
  return pattern.exec(source)?.[1];
}

function matchAll(source: string, pattern: RegExp): Array<[string, string | undefined]> {
  return Array.from(source.matchAll(pattern), (match) => [match[1], match[2]]);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}
