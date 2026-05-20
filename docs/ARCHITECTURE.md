# mimir architecture

## Principles

1. **Performance over bloat**: the desktop shell should feel instant, even when provider APIs are slow.
2. **Local-first privacy**: the UI reads from a local cache first; credentials stay in secure storage.
3. **Extensible by design**: adapters are drop-in modules, not special cases inside the app shell.

## System shape

```text
Provider Adapters -> Repository Cache -> Query Hooks -> React UI
        ^                 ^                   |
        |                 |                   v
  Rust sync ticks     SQLite cache      Account / thread shell
        |
        v
  Stronghold + deep-link bridge
```

## Frontend boundaries

- `src/providers/`: adapter modules that translate platform APIs into mimir types.
- `src/lib/messageRepository.ts`: the only frontend abstraction allowed to persist or read notifications.
- `src/lib/accountVault.ts`: secure-account abstraction. Tauri mode uses Stronghold; browser preview uses an in-memory fallback.
- `src/hooks/`: TanStack Query hooks for reading cached data, orchestrating provider polling, handling account connections, and capturing OAuth callbacks.
- `src/store/`: UI-only Zustand state such as the active tab, selected thread, and quick-reply draft.
- `src/components/`: presentational shell components. Keep them unaware of provider implementation details.

## Backend boundaries

- `src-tauri/src/main.rs`: Tauri plugin registration, background sync tick emitter, and app bootstrap.
- `src-tauri/src/commands.rs`: narrow Rust commands callable from TypeScript.
- `src-tauri/capabilities/default.json`: permission surface for plugins and commands.
- `src-tauri/tauri.conf.json`: desktop/mobile build configuration and deep-link registration.

## Data flow

1. A connected provider receives a browser poll tick or a Rust-emitted `mimir://poll-tick`.
2. The adapter normalizes notifications into `MimirNotification`, including stable IDs and message direction.
3. The repository stores notifications in SQLite (or the browser fallback repository during web-only development).
4. React Query reads from the repository and hydrates the UI immediately.
5. Quick reply and mark-as-read operations update the provider first, then sync the local cache.
6. Rust and Stronghold handle secure storage, deep-link callbacks, and future privileged provider networking.

## Extension model

- New providers require only a new folder in `src/providers/` with an `index.ts` entrypoint that exports a default provider plugin.
- The registry discovers provider entrypoints via `import.meta.glob`.
- Cross-provider grouping relies on stable `threadId` and `personId` semantics.
- Provider metadata also describes capabilities such as quick reply, read sync, or lite webview readiness so the shell can stay generic.
