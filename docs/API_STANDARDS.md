# API standards

## Default rule

Prefer provider API traffic in the Rust layer whenever requests involve:

- OAuth tokens or refresh tokens
- privileged CORS-restricted endpoints
- file uploads or downloads
- rate-limit sensitive retry logic

Use frontend fetches only for public or low-risk metadata where exposing the request in Webview memory is acceptable.

## CORS posture

- The Webview should not become the source of truth for complex provider networking.
- If a provider has hostile or inconsistent CORS behavior, route the request through a Rust command instead of adding browser-only workarounds.
- Do not introduce remote proxy services that are not free for private commercial use.

## Response normalization

- Adapters translate remote payloads into shared mimir types before the rest of the app sees them.
- Normalize timestamps to ISO-8601 strings.
- Prefer deterministic identifiers:
  - `providerId`: concrete account instance, e.g. `slack-work`
  - `threadId`: provider-native thread or conversation id
  - `personId`: stable identity match key such as email address

## Storage rules

- SQLite stores notifications, feed snapshots, sync cursors, and UI-acceleration data.
- Secure stores such as Stronghold store secrets, not SQLite.
- Cached rows should be replaceable and safe to rebuild from provider sync.

## Error handling

- Surface provider and bridge failures explicitly.
- Avoid silent fallbacks that hide authentication or permissions issues.
- Keep retry logic bounded and local to the provider or Rust command that owns the request.
