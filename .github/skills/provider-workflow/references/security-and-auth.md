# Security and auth notes

- OAuth redirects must use the `mimir://` deep-link flow.
- Secrets belong in Stronghold, never in SQLite or Zustand.
- If a token exchange, refresh flow, or API call would expose credentials in Webview memory, move that work to a Rust command.
- Prefer narrow Rust commands such as `exchange_provider_code`, `refresh_provider_token`, or `send_provider_message` over generic proxy-style commands.
- Validate callback URLs, provider IDs, and account ownership before persisting any secure state.
- When auth changes, update both TypeScript bridge helpers and tests so the boundary stays obvious.
