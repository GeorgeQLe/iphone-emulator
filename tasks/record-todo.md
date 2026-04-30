# Record Todo

## Documentation Records

- [ ] Measure hosted-session unit economics after live transport exists.
  - Source: `research/devtool-monetization.md`
  - Condition: runtime-to-renderer transport, transport-backed automation SDK mode, and retained run artifacts exist.
  - Non-blocking reason: the current SDK is in-memory and has no hosted compute, storage, retention, or support cost baseline.
  - Required data/access: pilot run telemetry or design estimates for run duration, parallel session utilization, artifact storage size, retention window, renderer capture cost, and support burden.
  - Measurement/query: aggregate pilot or design-phase hosted-session costs by session minute, artifact size, retained artifact window, and support incident load.
  - Target/acceptance note: produce a unit-economics note sufficient to update pricing and packaging assumptions in `research/devtool-monetization.md`.
  - Revisit: when a Team Cloud pilot or hosted-session design phase is opened.
  - Completion evidence: updated `research/devtool-monetization.md` and a `tasks/history.md` entry.
  - Promotion rule: move to `tasks/todo.md` when hosted-session implementation or pilot planning becomes active work.

## Condition-Gated Records

- [ ] Measure hosted-session unit economics after live transport exists.
  - Source: `research/devtool-monetization.md`
  - Condition: promote after runtime-to-renderer transport, transport-backed automation SDK mode, and retained run artifacts exist.
  - Non-blocking reason: the current SDK is in-memory and has no hosted compute, storage, retention, or support cost baseline.
  - Evidence: collect run duration, parallel session utilization, artifact storage size, retention window, renderer capture cost, and support burden from pilot runs.
  - Promotion rule: move to `tasks/todo.md` when a Team Cloud pilot or hosted-session design phase is opened.
