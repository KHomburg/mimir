---
name: "Add Provider"
description: "Add a new Slack, LinkedIn, Gmail, or custom provider adapter for mimir using the shared contract and repository-first architecture."
argument-hint: "Provider name, platform, auth notes, and any API quirks"
agent: "agent"
---
Implement a provider adapter for mimir using the chat argument as the provider brief.

Use these project references first:
- [Architecture](../../docs/ARCHITECTURE.md)
- [API standards](../../docs/API_STANDARDS.md)
- [Provider template](../../docs/provider-template.ts)
- [Provider adapter rules](../instructions/provider-adapters.instructions.md)
- [Testing rules](../instructions/testing-quality.instructions.md)

Requirements:
1. Create or update a `src/providers/*Provider.ts` file that extends the shared base provider.
2. Normalize all external data into the shared TypeScript contracts before it reaches the UI.
3. Define a stable identity strategy for `providerId`, `threadId`, and `personId` so grouping is predictable.
4. Keep secrets and privileged fetches in the Rust layer when appropriate; do not store tokens in SQLite.
5. Ensure the provider still auto-registers through `src/providers/provider-registry.ts`.
6. Update polling, repository, or bridge code only if the provider change actually requires it.
7. Add or update tests if grouping, polling, auth, or bridge behavior changes.

Implementation notes:
- Prefer the smallest viable dependency set.
- If the provider has weak browser CORS support, design the network boundary around Rust commands instead of browser workarounds.
- Keep the shell generic: provider-specific details should stay inside the adapter or typed provider metadata.

Output:
- Implemented files
- Identity mapping and normalization decisions
- Security considerations
- Tests added or updated
