---
name: provider-workflow
description: "Implement, review, or extend mimir provider adapters. Use for Slack, LinkedIn, Gmail, OAuth account setup, polling, normalization, registry, and mock provider work."
argument-hint: "Provider task or platform"
user-invocable: true
---

# Provider workflow

Use this skill for provider adapter work in mimir: new providers, OAuth integration, registry issues, polling behavior, normalization bugs, and provider-focused reviews.

## Load first
- [Provider checklist](./references/checklist.md)
- [Provider task template](./assets/provider-task-template.md)
- [Provider matrix](./references/provider-matrix.md)
- [Security and auth notes](./references/security-and-auth.md)

## Procedure
1. Read `docs/ARCHITECTURE.md`, `docs/API_STANDARDS.md`, and `docs/provider-template.ts`.
2. Inspect `src/providers/base-provider.ts`, `src/providers/provider-registry.ts`, `src/lib/messageRepository.ts`, and any related tests.
3. Decide how the provider maps account identity, thread identity, and person identity into `providerId`, `threadId`, and `personId`.
4. Implement or update the target `*Provider.ts` file with stable IDs and normalized payloads.
5. Keep UI reads repository-first; if secrets or privileged requests are involved, move the sensitive part to Rust commands.
6. Check whether the provider changes the polling cadence, account onboarding, read-status sync, or quick reply behavior.
7. Add or update tests for ordering, grouping, polling, auth, or bridge behavior when contracts change.

## Mimir-specific expectations
- The provider must fit the aggregated stream and account-tab model.
- The first UI read should still come from the local repository cache.
- Real-provider work must not break browser-only development or the existing mock provider loop.
- Keep the adapter extensible enough that a future third-party provider can follow the same pattern without touching the Rust core.

## Expected result
- A provider that matches the shared contract
- Auto-registration still working
- Security boundaries preserved
- Tests covering the changed behavior
