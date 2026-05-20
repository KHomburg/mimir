# mimir architecture

## Principles

1. **Performance over bloat**: the desktop shell should feel instant, even when provider APIs are slow.
2. **Local-first privacy**: the UI reads from a local cache first; credentials stay in secure storage.
3. **Extensible by design**: adapters are drop-in modules, not special cases inside the app shell.

## System shape

```text
Provider Adapter -> Repository Cache -> Query Hooks -> React UI
          |                ^
          v                |
      Rust Commands ---- SQLite
```

## Frontend boundaries

- `src/providers/`: adapter modules that translate platform APIs into mimir types.
- `src/lib/messageRepository.ts`: the only frontend abstraction allowed to persist or read notifications.
- `src/hooks/`: TanStack Query hooks for reading cached data and orchestrating provider polling.
- `src/store/`: UI-only Zustand state such as the active tab and quick-reply draft.
- `src/components/`: presentational shell components. Keep them unaware of provider implementation details.

## Backend boundaries

- `src-tauri/src/main.rs`: Tauri plugin registration and app bootstrap.
- `src-tauri/src/commands.rs`: narrow Rust commands callable from TypeScript.
- `src-tauri/capabilities/default.json`: permission surface for plugins and commands.
- `tauri.conf.json`: desktop/mobile build configuration and deep-link registration.

## Data flow

1. A provider polls or receives a push event.
2. The adapter normalizes notifications into `MimirNotification`.
3. The repository stores notifications in SQLite (or the browser fallback repository during web-only development).
4. React Query reads from the repository and hydrates the UI immediately.
5. Rust handles secure storage, token exchange, and privileged fetches when a provider needs them.

## Extension model

- New providers require only a new file in `src/providers/` that exports a default provider instance.
- The registry discovers provider files via `import.meta.glob`.
- Cross-provider grouping relies on stable `threadId` and `personId` semantics.
