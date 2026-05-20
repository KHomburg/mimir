---
description: "Use when creating or editing provider adapters, account registration, mock providers, or provider polling logic."
applyTo: "src/providers/**/*.ts"
---
# Provider adapter rules

- Extend the shared base provider and keep each provider self-contained.
- Normalize provider responses into the shared `MimirNotification` and `MimirFeedItem` types before data reaches the UI.
- Do not let providers write directly to React state. Return data to the repository layer instead.
- Prefer deterministic identifiers (`providerId`, `threadId`, `personId`) so cross-platform grouping stays stable.
- Any provider needing sensitive secrets or privileged requests should call into Rust commands rather than fetching directly from the Webview.
