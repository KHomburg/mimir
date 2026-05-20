---
description: "Use when editing Rust commands, Tauri plugins, capabilities, tauri.conf.json, or secure storage flows."
applyTo:
  - "src-tauri/**/*.rs"
  - "src-tauri/capabilities/**/*.json"
  - "tauri.conf.json"
---
# Tauri security rules

- Keep Rust commands narrow and explicit; expose only the data the frontend needs.
- Register required plugin permissions in capabilities and avoid permissive wildcards.
- Keep database migrations idempotent and versioned.
- Treat Stronghold as the secret store of record. SQLite is cache-only.
- Deep-link handling must validate scheme and route before trusting payloads.
