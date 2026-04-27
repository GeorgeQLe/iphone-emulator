import { Emulator } from "../../packages/automation-sdk/src/index";

async function main(): Promise<void> {
  const app = await Emulator.launch({
    appIdentifier: "FixtureApp",
    fixtureName: "strict-mode-baseline",
  });

  await app.getByText("Save").tap();
  await app.getByRole("textField", { text: "Name" }).fill("Jordan");

  const field = await app.getByTestId("name-field").inspect();
  const tree = await app.semanticTree();
  const logs = await app.logs();
  const screenshot = await app.screenshot("baseline-after-save");

  console.log("Field value:", field.value);
  console.log("Alert title:", tree.scene.alertPayload?.title);
  console.log("Log messages:", logs.map((entry) => entry.message));
  console.log("Screenshot placeholder:", screenshot);

  await app.close();
}

void main();
