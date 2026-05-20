---
description: "Use when editing aggregator logic, repository code, hooks, bridge helpers, or tests."
applyTo:
  - "src/lib/**/*.ts"
  - "src/hooks/**/*.ts"
  - "tests/**/*.ts"
---
# Testing and quality rules

- Keep aggregation and normalization logic in pure helpers where possible so it can be unit tested without a Tauri window.
- When changing bridge helpers, test both browser fallback behavior and Tauri IPC behavior with mocked `invoke`.
- Prefer deterministic timestamps, IDs, and provider names in tests; avoid randomness and real timers unless the feature specifically depends on them.
- If a new provider affects stream grouping, add or update tests around timestamp ordering and cross-platform grouping.
- Treat failing tests as signal to refine the contract rather than weakening assertions.
- Protect the local-first contract: tests should reinforce that UI-facing reads come from the repository layer rather than raw provider responses.
- When polling behavior changes, keep timer ownership explicit and test the persistence/invalidation path rather than only the fetch call.
- When adding Rust commands, pair the command shape with TypeScript bridge tests so the boundary stays explicit.
- Prefer a few high-signal scenarios over many shallow tests: newest-first ordering, cross-provider grouping, browser fallback, validated deep-link handling, and provider auto-registration.
