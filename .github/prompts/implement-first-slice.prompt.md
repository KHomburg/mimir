---
name: "Implement First Slice"
description: "Implement the core mimir vertical slice: sidebar, aggregated stream, account tabs, mock provider polling, local-first repository reads, and secure Rust boundary."
argument-hint: "Specific slice, enhancement, or missing part to implement"
agent: "agent"
---
Implement the requested part of the first shippable mimir slice.

Base requirements from the product spec:
- Desktop-first Tauri app with React + TypeScript frontend and Rust for system/secure work
- Sidebar with **Aggregated Stream** plus dynamic account tabs
- A `BaseProvider` contract and drop-in provider auto-registration
- `MockProvider` that generates notifications on a regular cadence for stream testing
- Local-first reads through SQLite/repository, not raw provider fetches
- Secure bridge for OAuth callbacks, tokens, and privileged provider networking
- A focused, calm, work-oriented UI

Use these references first:
- [Architecture](../../docs/ARCHITECTURE.md)
- [API standards](../../docs/API_STANDARDS.md)
- [Provider template](../../docs/provider-template.ts)
- [Project instructions](../copilot-instructions.md)

Execution rules:
1. Keep the repository as the source of truth for UI reads.
2. Preserve browser-only development when Rust is unavailable locally.
3. Prefer additive provider work over shell-specific branching.
4. Keep secrets in Rust/Stronghold and cache-only data in SQLite.
5. Add or update tests around aggregation, provider registration, polling, or bridge behavior when contracts change.

Return:
- Files changed
- Which part of the first slice moved forward
- Any remaining Rust-only follow-up
