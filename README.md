# mimir

Desktop-first notification aggregation for Slack, LinkedIn, Gmail, and future adapters. The repository is optimized for a small bundle, local-first performance, and explicit security boundaries between the Webview and the Rust core.

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React 19 + Vite + TypeScript |
| Server state | TanStack Query v5 |
| UI state | Zustand |
| Local cache | SQLite via `@tauri-apps/plugin-sql` |
| Secure storage | Stronghold via `@tauri-apps/plugin-stronghold` |
| Auth callbacks | Deep-link via `@tauri-apps/plugin-deep-link` |
| Testing | Vitest (unit/integration) + Playwright (E2E) |

## Quick start

```bash
npm install
npm run dev          # web preview (no Rust required)
npm run typecheck    # type-check all TS
npm run test         # run unit + integration tests
npm run lint         # run ESLint
```

For the full desktop shell (requires Rust toolchain):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh   # one-time
npm run tauri:dev
```

## Repo layout

```
src/
  components/       Shell UI (Sidebar, StreamList, QuickReply, RustStatusCard)
  hooks/            useNotifications · useAuth · useProviderPolling
  lib/              aggregator · messageRepository · bridge · runtime
  providers/        *Provider.ts adapters (auto-registered via import.meta.glob)
  store/            Zustand UI state (active view, quick-reply draft)
  types/            Shared TypeScript contracts (IMimirProvider, MimirNotification…)
src-tauri/
  src/main.rs       Plugin registration & bootstrap
  src/commands.rs   TypeScript-callable Rust functions (health check, OAuth bridge)
  capabilities/     Tauri 2 permission surface
docs/
  ARCHITECTURE.md   System shape, data flow, extension model
  API_STANDARDS.md  CORS posture, storage rules, normalization conventions
  provider-template.ts  Copy-and-customise starting point for new adapters
tests/
  aggregatorLogic.test.ts   Sort + group logic across providers
  tauriBridge.test.ts       Mocked IPC integration tests
.github/
  copilot-instructions.md          Project-wide agent guidance
  instructions/*.instructions.md  File-scoped adapter and security rules
  prompts/*.prompt.md             Reusable slash prompts for provider work and planning
  agents/*.agent.md               Focused subagents for provider and Tauri work
  hooks/*.json                    Deterministic safety automation
  skills/provider-workflow/       Reusable provider implementation workflow
AGENTS.md            Generic agent guidance for tools that honor root agent files
.cursorrules        Ten project laws for cursor-based AI coding
```

## Adding a new provider

1. Copy `docs/provider-template.ts` into `src/providers/<Name>Provider.ts`.
2. Implement the four abstract methods.
3. Export a default instance at the bottom of the file.
4. The registry picks it up automatically — no other file needs to change.

## Key conventions

- Providers live in `src/providers/` and are auto-registered when the filename ends in `Provider.ts`.
- The UI reads notifications from the repository layer (`src/lib/messageRepository.ts`), never directly from provider fetch results.
- Sensitive auth and API work belongs in Rust commands whenever possible.
- Tokens must never be written to SQLite in plaintext; use Stronghold.
