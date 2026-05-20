# mimir agent guide

`mimir` is a lightweight, cross-platform notification and message aggregator built around **performance over bloat**, **local-first privacy**, and **extensibility by design**.

Read these first before making structural changes:
- `docs/ARCHITECTURE.md`
- `docs/API_STANDARDS.md`
- `docs/provider-template.ts`
- `.github/copilot-instructions.md`

## Product intent
- The app aggregates notifications and activity across Slack, LinkedIn, Gmail, and future providers.
- The default experience is the **Mimir Stream**: a unified chronological feed sourced from the local cache.
- Accounts appear as dynamic tabs in the shell; providers are drop-in modules, not hard-coded app cases.
- The first vertical slice should stay usable even in browser-only development through the in-memory repository and the mock provider.

## Current architecture contract
- **Providers** live in `src/providers/` and normalize remote payloads into the shared contracts in `src/types/mimir.ts`.
- **Repository-first UI** is mandatory: components and hooks read notifications through `src/lib/messageRepository.ts`.
- **Rust owns privileged work**: secure storage, OAuth callback handling, notifications, filesystem access, and CORS-sensitive or secret-bearing network flows.
- **SQLite is a cache**, not a secret store. Stronghold is the secure store of record.

## Non-negotiables
- Keep the Adapter Pattern intact. A new provider should usually mean a new `*Provider.ts` file, not custom logic in the app shell.
- Preserve auto-registration via `src/providers/provider-registry.ts`; provider filenames must end in `Provider.ts`.
- Never store access tokens, refresh tokens, client secrets, or session credentials in SQLite, Zustand, or component state.
- Prefer small, free-for-private-commercial-use libraries only.
- Preserve the quiet, focused UI: low chrome, low animation, strong information hierarchy.

## First-slice expectations
- Sidebar includes **Aggregated Stream** plus account tabs.
- `MockProvider` remains a working source of fake notifications so stream and grouping logic can be exercised without real APIs.
- Polling should write into the repository first, then invalidate/read through TanStack Query.
- Grouping should remain stable across platforms using `personId` and `threadId`.
- Quick reply UI should stay lightweight and ready for provider-specific send wiring.

## When changing specific areas
- **Providers**: update provider code, registry behavior, and tests together when contracts change.
- **Aggregation**: keep sorting/grouping logic in pure helpers and protect it with deterministic tests.
- **Rust bridge**: update `src-tauri/src/main.rs`, `src-tauri/src/commands.rs`, `src-tauri/capabilities/default.json`, and `tauri.conf.json` together.
- **Frontend shell**: keep state boundaries clean: TanStack Query for cached/server-like state, Zustand for UI-only state.

## Validation
- Run `npm run typecheck` and `npm run test` after non-trivial changes.
- If desktop-only behavior changes, note any Rust toolchain requirement explicitly.
