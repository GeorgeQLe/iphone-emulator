import { baselineFixtureTree } from "./fixtureTree";
import { mountRenderer } from "./renderTree";

const appRoot = document.getElementById("app");

if (!appRoot) {
  throw new Error("Renderer mount root #app was not found.");
}

mountRenderer(appRoot, baselineFixtureTree);
