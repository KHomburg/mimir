# First slice status

This repository now implements the first usable mimir slice around the original product brief.

## Implemented

### Aggregated stream
- Unified chronological stream across every connected provider
- Smart grouping by `personId` fallbacking to `threadId`
- Unread counts per group and per provider
- Thread detail panel driven by repository-backed notifications

### Account tabs and onboarding
- Dynamic provider tabs from `src/providers/*Provider.ts`
- Secure-account command center with connect / disconnect actions
- Browser-preview mode auto-seeds demo accounts for local development
- Tauri mode can unlock Stronghold-backed token storage with a local passphrase

### Providers
- `MockProvider`
- `SlackWorkProvider`
- `GmailPrimaryProvider`
- `LinkedInInboxProvider`

All current providers are scenario-backed adapters that simulate real activity while preserving the final adapter contract.

### Messaging
- Quick reply for connected account views
- Markdown + emoji preview
- Local echo insertion into the repository
- Read-status sync through provider adapters

### Tauri runtime
- SQLite-backed message cache
- Deep-link callback capture for `mimir://...`
- Rust background poller that emits `mimir://poll-tick` every 10 seconds
- Stronghold available for secure token persistence in desktop mode

## Current development modes

### Browser preview
- Fully runnable with `npm run dev`
- Uses an in-memory token vault
- Automatically connects the demo providers

### Tauri desktop
- Intended flow once Rust is installed locally
- Uses Stronghold for persisted tokens
- Uses the Rust background sync emitter

## Next likely product steps

1. Replace scenario providers with real OAuth and API adapters one platform at a time.
2. Move sensitive provider writes and token exchanges into Rust commands.
3. Add sandboxed lite-webview surfaces for providers that cannot expose a clean API.
