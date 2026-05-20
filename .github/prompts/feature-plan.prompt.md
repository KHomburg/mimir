---
name: "Plan Mimir Feature"
description: "Plan a new mimir feature with architecture, data flow, Rust boundary, tests, and rollout notes."
argument-hint: "Feature or workflow to plan"
agent: "plan"
---
Create an implementation plan for the requested mimir feature.

Use these references:
- [Architecture](../../docs/ARCHITECTURE.md)
- [API standards](../../docs/API_STANDARDS.md)
- [Project instructions](../copilot-instructions.md)

Include:
1. The frontend surfaces to touch.
2. Whether the work belongs in TypeScript, Rust, or both.
3. How data moves through providers, repository, and UI.
4. Security implications for tokens, OAuth callbacks, and network calls.
5. Tests required for aggregator logic, bridge behavior, or UI interactions.
6. How the feature fits the product philosophy: performance over bloat, local-first privacy, extensibility by design.
7. Whether the feature should work in browser-only development mode, Tauri mode, or both.

Also answer these product-specific questions when relevant:
- Does this affect the aggregated stream, provider tabs, quick reply flow, or account onboarding?
- Should data originate from SQLite cache, a provider adapter poll, or a Rust command?
- Does the feature introduce a new provider capability that should be reusable by future adapters?

Keep the plan concrete, file-oriented, and biased toward the next shippable vertical slice.
