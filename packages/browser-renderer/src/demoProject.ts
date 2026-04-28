import type { SemanticUITree, UITreeNode } from "./types";

export interface DemoProjectFile {
  path: string;
  language: string;
  value: string;
}

export interface DemoDiagnostic {
  severity: "info" | "warning" | "error";
  message: string;
}

export interface DemoCompileResult {
  tree: SemanticUITree;
  diagnostics: DemoDiagnostic[];
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

This mock project demonstrates the intended browser IDE loop:

1. Edit strict-mode Swift-like app code.
2. Lower supported declarations into a semantic UI tree.
3. Render the result in an iPhone-like preview.
4. Let an agent inspect semantic state and artifacts.
`,
  },
];

export function compileDemoProject(source: string): DemoCompileResult {
  const diagnostics: DemoDiagnostic[] = [];
  const appIdentifier = matchFirst(source, /struct\s+([A-Za-z0-9_]+)\s*\{/u) ?? "DemoApp";
  const title = matchFirst(source, /NavigationStack\s*\(\s*title:\s*"([^"]+)"/u) ?? appIdentifier;
  const textNodes = matchAll(source, /Text\s*\(\s*"([^"]+)"\s*\)(?:\s*\n\s*\.emphasis\(\.headline\))?/gu);
  const buttons = matchAll(source, /Button\s*\(\s*"([^"]+)"\s*\)(?:\s*\n\s*\.variant\(\.primary\))?(?:\s*\n\s*\.testID\("([^"]+)"\))?/gu);
  const textField = /TextField\s*\(\s*"([^"]+)"\s*,\s*text:\s*"([^"]*)"\s*\)(?:\s*\n\s*\.testID\("([^"]+)"\))?/u.exec(source);
  const listMatch = /List\s*\(\s*"([^"]+)"\s*\)\s*\{([\s\S]*?)\n\s*\}/u.exec(source);

  if (!source.includes("StrictModeSDK")) {
    diagnostics.push({
      severity: "warning",
      message: "Strict mode demos should import StrictModeSDK so the harness owns the runtime surface.",
    });
  }

  if (/\bUIKit\b|\bSwiftUI\b|\bWebKit\b/u.test(source)) {
    diagnostics.push({
      severity: "error",
      message: "Unsupported Apple framework import detected. This demo harness lowers only strict-mode declarations.",
    });
  }

  if (textNodes.length === 0 && buttons.length === 0 && !textField) {
    diagnostics.push({
      severity: "info",
      message: "Add Text, Button, TextField, or List declarations to change the semantic preview.",
    });
  }

  const children: UITreeNode[] = [];

  for (const [index, textNode] of textNodes.entries()) {
    const [label] = textNode;
    children.push({
      id: index === 0 ? "headline" : `text-${index + 1}`,
      role: "text",
      label,
      children: [],
      metadata: index === 0 ? { emphasis: "headline" } : {},
    });
  }

  if (textField || buttons[0]) {
    const rowChildren: UITreeNode[] = [];
    if (textField) {
      rowChildren.push({
        id: textField[3] ?? slugify(textField[1]),
        role: "textField",
        label: textField[1],
        value: textField[2],
        children: [],
        metadata: {
          placeholder: textField[1],
        },
      });
    }

    if (buttons[0]) {
      const [label, testId] = buttons[0];
      rowChildren.push({
        id: testId ?? slugify(label),
        role: "button",
        label,
        children: [],
        metadata: {
          variant: "primary",
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

  if (listMatch) {
    const listLabel = listMatch[1];
    const listItems = matchAll(listMatch[2], /Text\s*\(\s*"([^"]+)"\s*\)/gu);
    children.push({
      id: slugify(listLabel),
      role: "list",
      label: listLabel,
      children: listItems.map(([label], index) => ({
        id: `${slugify(label)}-${index + 1}`,
        role: "text",
        label,
        children: [],
        metadata: {},
      })),
      metadata: {},
    });
  }

  for (const [index, button] of buttons.slice(1).entries()) {
    const [label, testId] = button;
    children.push({
      id: testId ?? slugify(label),
      role: "button",
      label,
      children: [],
      metadata: index === 0 ? { variant: "secondary" } : {},
    });
  }

  return {
    diagnostics,
    tree: {
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
    },
  };
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
