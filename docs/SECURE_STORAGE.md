# Secure storage and auth flow

## Current model

`mimir` uses a split model depending on runtime:

### Browser preview
- Tokens are kept in memory only
- This mode exists to keep frontend development fast and safe without persisting plaintext secrets

### Tauri desktop
- Tokens are stored in Stronghold using `@tauri-apps/plugin-stronghold`
- The user unlocks the vault with a local passphrase
- OAuth callbacks are validated against the `mimir://` scheme before use

## Why this split exists

- The product is local-first, but secrets still need a secure store
- Browser preview is for UI and adapter development, not long-lived credential persistence
- Desktop mode is where secure storage and privileged networking ultimately belong

## Current auth path

1. User unlocks the local vault in desktop mode.
2. User connects a provider.
3. The provider returns an auth token object.
4. The token is written to Stronghold instead of SQLite.
5. Any incoming `mimir://` callback is validated and surfaced to the app.

## Rules

- Never store tokens in SQLite, Zustand, or localStorage.
- Prefer narrow Rust commands for token exchange, refresh, and provider writes when real integrations are added.
- Keep provider IDs stable so token ownership is easy to reason about.
