# Project Guidelines

## Core architecture

- Build around the Adapter Pattern documented in `docs/ARCHITECTURE.md`.
- Provider modules belong in `src/providers/` and must satisfy the shared provider contract in `src/types/mimir.ts`.
- The UI reads notifications through `src/lib/messageRepository.ts`; do not wire components directly to provider fetch calls.
- Keep Rust focused on secure storage, deep links, notifications, filesystem access, and privileged network work.

## Product goals to preserve

- Optimize for a lightweight desktop-first experience that still works during browser-only development.
- Treat the **Mimir Stream** as the primary product surface: it should feel instant because it reads from local cache first.
- Keep provider implementations extensible enough that adding a new provider is mostly additive.
- Favor boring, maintainable building blocks over clever abstractions or heavy SDKs.

## Current baseline

- The repo already contains a working shell, provider registry, mock provider, repository abstraction, Tauri bridge scaffold, and tests for aggregation and IPC helpers.
- `MockProvider` is the reference for end-to-end stream behavior during early development.
- Browser mode is intentional and should stay functional even when Rust is unavailable locally.

## Security rules

- Never store tokens, refresh tokens, API keys, or session secrets in SQLite or Zustand.
- Prefer Rust commands for sensitive fetch flows to avoid CORS problems and to keep credentials out of Webview memory.
- When touching Tauri permissions or plugins, update `src-tauri/capabilities/default.json` and `tauri.conf.json` together.
- Deep-link callbacks must validate the `mimir://` scheme before any downstream handling.

## Build and test

- Install dependencies with `npm install`.
- Use `npm run dev` for the web shell and `npm run tauri:dev` for the desktop shell once Rust is installed.
- Run `npm run lint`, `npm run typecheck`, and `npm run test` after code changes.

## Conventions

- Use free-for-private-commercial-use technologies only.
- Keep the interface calm and minimal; prefer small primitives over heavyweight design systems.
- When adding a provider, copy the structure from `docs/provider-template.ts` and keep the file name ending in `Provider.ts` for auto-registration.
- Keep identifiers deterministic so cross-platform grouping stays stable.
- Prefer pure helper functions for sorting, grouping, normalization, and other logic that should be easy to test.
