# Devtool Monetization

## Product Context

This project is an open-source iPhone-like app harness for deterministic Swift-style app flows. Its current value is local, fixture-backed, and agent-friendly: strict-mode declarations lower into semantic UI trees, the TypeScript automation SDK drives deterministic flows, and artifacts expose semantic state, logs, network records, device metadata, and native capability records.

Monetization should not start by charging for simulator fidelity, hosted real devices, broad SwiftUI/UIKit compatibility, or live native behavior. Those are explicit non-goals or future gates. The credible commercial path is to keep the core harness open source and later monetize team-grade workflow infrastructure around transport-backed sessions, CI artifact retention, hosted orchestration, policy controls, and enterprise support.

## Free And Open-Source Stance

| Area | Recommended stance | Rationale |
| --- | --- | --- |
| Core runtime and strict-mode SDK | Open source | The harness needs trust, inspectability, and contribution around deterministic semantics. |
| Diagnostics core and compatibility matrix | Open source | Fail-closed unsupported API guidance is a trust builder and adoption wedge. |
| Browser renderer | Open source | Preview fidelity and DOM metadata need contributor confidence and transparent limits. |
| TypeScript automation SDK | Open source | Agents and CI users need a low-friction local API before any paid service makes sense. |
| Examples, templates, and CI recipes | Open source | These reduce activation friction and expand fixture adoption. |
| Hosted orchestration and artifact service | Commercial | Teams pay for reliable shared infrastructure, retention, access control, and reporting. |
| Enterprise controls and support | Commercial | Procurement value comes from governance, support SLAs, private deployment, and compliance artifacts. |

Recommended license posture: keep the repo permissive or business-friendly open source if the goal is broad developer adoption. Avoid an early open-core split that withholds core automation or diagnostics; that would weaken the project before it has external traction.

## Packaging Strategy

### Current Package

The current package is a repo-local developer tool. It should be presented as:

- Clone-and-run local workspace.
- SwiftPM packages for strict-mode SDK, runtime host, and diagnostics.
- npm workspace packages for browser renderer and automation SDK.
- Checked-in examples for deterministic agent and CI fixture flows.

Do not sell or market the current state as an installable production service. The automation SDK is in-memory, the browser preview is not live-runtime backed, and screenshots are placeholder metadata.

### Future Package Tiers

| Tier | Buyer | Contents | When to offer |
| --- | --- | --- | --- |
| Community | Individual developers, OSS contributors, agent workflow authors | Open-source local harness, SDKs, examples, templates, compatibility diagnostics, local artifact output. | Now, after first-green-run docs are improved. |
| Team Cloud | QA automation, platform, agent workflow teams | Hosted session coordination, transport-backed runs, artifact retention, CI integration, team dashboards, shared fixture libraries. | After live runtime-to-renderer transport and transport-backed SDK mode exist. |
| Enterprise | Large mobile/platform organizations | SSO/SAML, audit logs, RBAC, private runners, VPC/private deployment, retention policies, support SLA, procurement/security docs. | After Team Cloud has repeat team usage and artifact workflows. |
| Services/Support | Mobile platform teams and early adopters | Migration workshops, strict-mode fixture authoring help, compatibility report reviews, custom integration support. | Useful before mature cloud packaging, but should not become the main product. |

## Pricing Model

Use value-based team packaging rather than per-download or per-open-source-user pricing.

| Model | Fit | Recommendation |
| --- | --- | --- |
| Per seat | Moderate | Useful for dashboard users, but agents/CI runs create value without human seats. Do not make this the only meter. |
| Per session/run | Strong | Aligns with hosted orchestration, CI usage, artifact storage, and compute cost. |
| Artifact retention/storage | Strong | Maps to team value in debugging, audit, and historical analysis. |
| Private runner/tenant | Strong for enterprise | Captures security and isolation value. |
| Per fixture/app | Weak | Encourages users to avoid adding coverage and is hard to define consistently. |
| Paid SDK | Poor | Would block adoption before the ecosystem forms. |

Recommended commercial pricing shape:

| Plan | Price anchor | Included limits | Upgrade trigger |
| --- | --- | --- | --- |
| Community | Free | Local runs, open-source SDKs, local artifacts, community support. | Need shared hosted runs or retention. |
| Team | Monthly platform fee plus usage | Included run minutes/session count, 30-day artifact retention, CI integrations, team workspace. | More CI volume, longer retention, private runners. |
| Enterprise | Annual contract | SSO, audit logs, private deployment/runners, custom retention, SLA, priority support. | Security review, procurement, regulated workloads, large agent fleets. |

Do not set exact prices yet. Pricing should wait until transport-backed sessions expose real compute, storage, support, and retention costs.

## Usage Limits

### Open-Source Local Limits

Local open-source usage should remain unlimited in license terms. Practical limits can be documented as supported test matrix boundaries:

- Supported Swift and Node versions.
- Supported strict-mode SDK surface.
- Supported compatibility subset.
- Supported native capability record types.
- Supported artifact output format.

These are engineering support boundaries, not monetization limits.

### Hosted Limits

Hosted plans should meter infrastructure and team value:

| Limit | Why it matters | Free/Team default idea |
| --- | --- | --- |
| Session minutes or run count | Primary compute and orchestration cost. | Small free hosted quota only after cloud exists; Team includes monthly pool. |
| Parallel sessions | Directly tied to CI speed and infrastructure cost. | Low on free, expandable on Team. |
| Artifact retention window | Storage cost and debugging value. | Short free retention, 30-day Team, custom Enterprise. |
| Artifact storage volume | Prevents unbounded logs/snapshots/media. | Quota by plan with overage controls. |
| Team members and service accounts | Maps to organization rollout. | Community local-only; Team workspace; Enterprise SSO/RBAC. |
| Private runners | High operational and security value. | Enterprise or paid Team add-on. |
| Compatibility report volume | Useful if report generation becomes compute-heavy. | Keep local reports free; hosted batch reports metered. |

Avoid limiting semantic tree inspection, fixture authoring, or local SDK APIs. Those are core adoption loops.

## Team Conversion

The strongest conversion path is from one deterministic fixture to team artifact workflows.

1. Individual or agent runs the strict-mode baseline locally.
2. Developer adds one project-specific strict-mode fixture.
3. CI runs the fixture and preserves semantic/log/network/native records.
4. Team needs shared artifact history, flaky-run comparison, permissions, and dashboards.
5. Platform owner adopts hosted runs or private runners to standardize agent/mobile-like checks.

Product moments that should prompt conversion:

| Moment | Commercial hook |
| --- | --- |
| More than one developer or agent needs the same fixture outputs | Shared workspace and artifact history. |
| CI wants deterministic mobile-like checks on every PR | Hosted runs, CI integration, retention, parallelism. |
| Failures need review across QA, product, and platform teams | Artifact dashboard, saved semantic snapshots, run comparison. |
| Teams want policy around unsupported APIs and strict-mode migration | Compatibility reports, migration tracking, governance exports. |
| Agent platform needs a stable tool boundary | Hosted MCP/protocol server and managed session orchestration. |

The open-source repo should make the first two steps easy enough that paid conversion feels like scaling a proven workflow, not paying to discover the value.

## Enterprise Triggers

Enterprise packaging becomes relevant when the product holds team artifacts or orchestrates runs in customer environments.

| Trigger | Needed capability |
| --- | --- |
| Security review | Architecture docs, dependency/license inventory, data handling description, threat model. |
| Regulated or private code | Private runners, self-hosted deployment, network egress controls, retention policy. |
| Large agent fleet | High parallelism, service accounts, usage reporting, API rate limits. |
| Multi-team rollout | RBAC, SSO/SAML, audit logs, workspace administration. |
| Release governance | Compatibility report exports, artifact retention, signed run metadata. |
| Procurement | SLA, support tiers, invoice billing, vendor documentation. |

Enterprise promises should wait until the project has a stable transport/session architecture. Selling enterprise before live sessions exist would force custom work around unstable boundaries.

## Unit Economics

The open-source local harness has low marginal cost but requires maintainer time. Hosted monetization will be driven by session orchestration, artifact storage, and support.

| Cost driver | Expected pressure | Design implication |
| --- | --- | --- |
| Session compute | Medium to high once live renderer/runtime sessions exist. | Meter run minutes and parallelism. |
| Artifact storage | Medium and predictable. | Meter retention window and storage volume. |
| Logs/semantic snapshots | Low per run, high at scale. | Compress and deduplicate repeated fixtures. |
| Browser rendering | Medium if real captures are added. | Separate placeholder metadata from pixel/video artifacts in pricing. |
| Support | High for migration and expectation mismatch. | Keep simulator non-goals prominent and gate support plans. |
| Compatibility expansion | High engineering cost. | Fund through roadmap sponsorship or enterprise support only when broadly useful. |
| Private runners | High setup/support cost. | Enterprise add-on with clear deployment boundaries. |

The service should avoid expensive real-device or simulator infrastructure unless the positioning changes. The differentiated value is deterministic semantic automation, not device-farm coverage.

## Commercial Roadmap

| Stage | Commercial readiness | Required proof |
| --- | --- | --- |
| Stage 0: Local OSS harness | Not monetized directly | First-green-run docs, examples, CI recipe, contributor guide. |
| Stage 1: OSS adoption plus support | Light services/support revenue possible | Teams can adapt fixtures and ask for migration or CI help. |
| Stage 2: Transport-backed sessions | Early paid team pilots | Live runtime-to-renderer transport and SDK transport mode preserve local semantics. |
| Stage 3: Hosted Team Cloud | Primary monetization | CI integration, artifact retention, dashboards, team workspaces. |
| Stage 4: Enterprise platform | Expansion monetization | SSO/RBAC, audit logs, private runners, retention controls, SLA. |

## Risks

| Risk | Monetization impact | Mitigation |
| --- | --- | --- |
| Charging too early for core SDKs | Blocks adoption and weakens community proof. | Keep SDK/runtime/diagnostics open. |
| Simulator expectation mismatch | Causes support burden and churn. | Sell deterministic harness workflows, not iOS fidelity. |
| In-memory SDK overmarketed | Buyers expect live sessions that do not exist. | Gate paid team plans on transport-backed mode. |
| Open-core split hides essential artifacts | Reduces trust with agents and CI users. | Monetize hosted retention, governance, and orchestration instead. |
| Services work dominates roadmap | Turns product into custom consulting. | Keep services scoped to repeatable templates and migration reports. |
| Usage pricing discourages test coverage | Teams avoid adding fixtures. | Include generous run pools and price overages predictably. |

## Recommended Monetization Work

1. Keep `StrictModeSDK`, `RuntimeHost`, `DiagnosticsCore`, browser renderer, automation SDK, examples, and templates open source.
2. Add public docs that clearly say the current package is local-first and not a hosted service or simulator replacement.
3. Build first-green-run, CI artifact, and template adoption paths before any pricing page.
4. Design live runtime-to-renderer transport as the next commercial unlock because it enables hosted sessions.
5. After transport lands, define Team Cloud pilots around CI runs, artifact retention, and shared workspaces.
6. Prepare enterprise controls only after hosted team usage proves retention, parallelism, and governance demand.

## Follow-Up Work

- Add README first-green-run and current-packaging language so the free local value is obvious and bounded.
- Add a CI fixture recipe with artifact retention guidance as the first team-conversion proof.
- Reconcile the main spec before designing transport-backed paid packaging.
- Add a future record to measure hosted-session economics once live transport and real artifact retention exist.
