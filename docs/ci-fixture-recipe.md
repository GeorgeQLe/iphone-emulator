# CI Fixture Recipe

This recipe shows how to use the current local harness in CI. It is intentionally fixture-backed: it does not start a hosted session, a real iOS simulator, a live Swift-to-browser transport, or host native services.

## When To Use This

Use this path when a team wants deterministic checks for strict-mode fixture flows:

- Semantic UI tree state.
- Locator-driven interactions.
- Route fixture request records.
- Runtime and SDK logs.
- Screenshot metadata.
- Device metadata.
- Native capability event and artifact records.

Do not use it as proof of UIKit, SwiftUI, WebKit, CoreAnimation, real iOS, camera, photo library, notification delivery, host clipboard, host files, or device-farm fidelity.

## Minimal CI Job

```yaml
name: strict-mode-fixture

on:
  pull_request:
  push:
    branches: [main]

jobs:
  fixture:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install npm dependencies
        run: npm ci

      - name: Validate Swift contracts
        run: |
          swift test
          swift build

      - name: Validate TypeScript packages
        run: |
          npm --prefix packages/automation-sdk run typecheck
          npm --prefix packages/automation-sdk test
          npm --prefix packages/automation-sdk run build
          npm --prefix packages/browser-renderer run typecheck
          npm --prefix packages/browser-renderer test
          npm --prefix packages/browser-renderer run build

      - name: Run strict-mode baseline fixture
        run: npx tsx examples/strict-mode-baseline/automation-example.ts
```

The root `package.json` has no root `npm test` script. CI should call the package scripts directly.

## Artifact Retention

The checked-in example currently prints artifact counts and native event names. For a team CI workflow, keep the structured data produced by `app.artifacts()`, `app.logs()`, `app.semanticTree()`, `app.native.events()`, and `app.session()` as build artifacts.

Recommended artifact names:

| Artifact | Source API | Why keep it |
| --- | --- | --- |
| `semantic-tree.json` | `await app.semanticTree()` | Shows the current app state, roles, identifiers, labels, values, and scene state. |
| `logs.json` | `await app.logs()` | Explains deterministic interaction and native mock events. |
| `artifact-bundle.json` | `await app.artifacts()` | Preserves screenshot metadata, semantic snapshots, network request records, logs, and native capability records. |
| `native-events.json` | `await app.native.events()` | Lists high-level native automation records such as permission requests, captures, selections, clipboard writes, and notification schedules. |
| `session.json` | `await app.session()` | Captures launch device settings, native capability state, and retained snapshot metadata. |

Screenshot records are metadata only today. Preserve them because they carry names, formats, byte counts, artifact kinds, and viewports, but do not treat them as captured pixels.

## Example Artifact Writer

A fixture script can write reviewable JSON like this:

```ts
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("artifacts/strict-mode-baseline", { recursive: true });

await writeFile(
  "artifacts/strict-mode-baseline/semantic-tree.json",
  JSON.stringify(await app.semanticTree(), null, 2)
);
await writeFile(
  "artifacts/strict-mode-baseline/logs.json",
  JSON.stringify(await app.logs(), null, 2)
);
await writeFile(
  "artifacts/strict-mode-baseline/artifact-bundle.json",
  JSON.stringify(await app.artifacts(), null, 2)
);
await writeFile(
  "artifacts/strict-mode-baseline/native-events.json",
  JSON.stringify(await app.native.events(), null, 2)
);
await writeFile(
  "artifacts/strict-mode-baseline/session.json",
  JSON.stringify(await app.session(), null, 2)
);
```

Then upload the directory:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: strict-mode-baseline-artifacts
    path: artifacts/strict-mode-baseline
    retention-days: 30
```

## Review Checklist

For each failed fixture run, inspect:

- `semantic-tree.json`: did the expected element exist by role, text, or stable id?
- `logs.json`: did the interaction sequence reach the expected tap/fill/native mock steps?
- `artifact-bundle.json`: did route fixture records and screenshot metadata appear?
- `native-events.json`: did the expected permission, camera/photo, location, clipboard, file/share, notification, and device records appear?
- `session.json`: did launch device settings and native capability state match the fixture manifest?

## Common Failures

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `unknown fixture strict-mode-baseline` or similar fixture mismatch | The SDK only launches known in-memory fixtures. | Use `fixtureName: "strict-mode-baseline"` until a later transport phase adds arbitrary app launch. |
| Locator fails by text or role | The semantic fixture label, role, or id changed. | Inspect `semantic-tree.json` and update the test query or fixture. |
| Route request returns 404 metadata | No matching `app.route(...)` fixture was installed. | Add a route with the same method and URL before `app.request(...)`. |
| Native `missingFixture` diagnostic | A native control references a fixture identifier absent from `nativeCapabilities.configuredMocks`. | Add a matching mock payload, for example a `camera` mock with `identifier: "front-camera-still"`. |
| Location read returns a denial diagnostic | The fixture state sets location permission to `denied`, `restricted`, or `unsupported`. | Use the denial as the expected assertion, or set deterministic permission state to `granted` and provide coordinates. |

## Current Boundary

This CI path is the first team-conversion proof for the local harness. The next technical unlock is live runtime-to-renderer transport and a transport-backed automation SDK mode. Until then, CI should frame the project as a deterministic strict-mode fixture runner with inspectable semantic, network, native, and metadata artifacts.

