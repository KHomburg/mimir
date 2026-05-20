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


### Prerequisites

**For web preview** (no Rust required):
- Node.js ≥18
- npm ≥9

**For desktop shell** (full experience):
- All of the above, plus:
- Rust 1.70+ (install via `rustup`)
- Xcode command-line tools (macOS) or Visual C++ build tools (Windows)

### Development

**Web preview** (instant feedback, no Rust):
```bash
npm install
npm run dev          # opens http://localhost:5173 with hot reload
```

**Desktop shell**:
```bash
# One-time: install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Then start dev server
npm run tauri:dev    # builds Rust, runs app with hot reload
```

### Development workflow

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest unit + integration tests

# E2E tests (requires app running in another terminal)
npm run tauri:dev    # terminal 1
npm run test:e2e     # terminal 2
```

Debug the app:
- **Web**: Open browser DevTools
- **Desktop**: Press `Ctrl+Shift+I` (or `Cmd+Shift+I` on macOS)
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
  tauri.conf.json   Tauri config in the standard app-directory location
docs/
  ARCHITECTURE.md   System shape, data flow, extension model
  API_STANDARDS.md  CORS posture, storage rules, normalization conventions
  FIRST_SLICE.md    What the current app already implements
  MIGRATION.md      Database schema, dev setup, building, shipping, deployment
  SECURE_STORAGE.md Browser vs Tauri token-handling model
  provider-template.ts  Copy-and-customise starting point for new adapters
tests/
  aggregatorLogic.test.ts   Sort + group logic across providers
  tauriBridge.test.ts       Mocked IPC integration tests
  scenarioProvider.test.ts  Provider send/reply and direction metadata
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


## Building for production

### Web bundle
```bash
npm run build
```
Outputs to `dist/`. Deploy to any static host (Netlify, Vercel, S3, GitHub Pages).

### Desktop application

**macOS:**
```bash
npm run tauri:build
```
Produces:
- DMG installer: `src-tauri/target/release/bundle/dmg/mimir_*.dmg`
- App bundle: `src-tauri/target/release/bundle/macos/mimir.app`

**Windows:**
```bash
npm run tauri:build
```
Produces:
- MSI installer: `src-tauri/target/release/bundle/msi/mimir_*.msi`
- Portable executable: `src-tauri/target/release/bundle/nsis/mimir Setup *.exe`

**Linux:**
```bash
npm run tauri:build
```
Produces:
- AppImage: `src-tauri/target/release/bundle/appimage/mimir_*.AppImage`
- Debian package: `src-tauri/target/release/bundle/deb/mimir_*.deb`

## Shipping & Distribution

### Version management

Always update versions in lockstep:
1. `package.json`: `"version": "X.Y.Z"`
2. `src-tauri/Cargo.toml`: `version = "X.Y.Z"`
3. `src-tauri/tauri.conf.json`: `"version": "X.Y.Z"`

Use [semantic versioning](https://semver.org/):
- **MAJOR**: Breaking provider API changes or storage format
- **MINOR**: New features or providers
- **PATCH**: Bug fixes

### macOS signing & distribution

**Code signing** (requires Apple Developer Certificate):
```bash
export APPLE_CERTIFICATE_PASSWORD="<password>"
export APPLE_SIGNING_IDENTITY="<cert-id>"
npm run tauri:build -- --sign
```

**Notarization** (required for macOS 10.15+):
```bash
export APPLE_ID="<apple-id>"
export APPLE_PASSWORD="<app-specific-password>"
# Tauri handles notarization automatically during build
npm run tauri:build -- --sign
```

**Distribute:**
- Host DMG on your website
- Submit to Mac App Store via Transporter
- Use Sparkle framework for auto-updates

### Windows distribution

**Code signing** (optional but recommended):
```bash
npm run tauri:build -- --sign
```
Requires a code signing certificate.

**Distribute:**
- Host MSI on your website
- Submit to Microsoft Store via Partner Center
- Use Windows Update or Tauri's updater plugin

### Web deployment

**Deploy to Vercel:**
```bash
npm run build && vercel
```

**Deploy to Netlify:**
```bash
npm run build && netlify deploy dist
```

**Deploy to S3:**
```bash
npm run build && aws s3 sync dist s3://my-bucket
```

**Cache strategy:**
- `index.html`: No cache or 5 min TTL
- `dist/assets/*`: 1 year TTL (Vite adds content hash to filenames)

### Database migrations in production

When adding a new migration to `src-tauri/src/main.rs`:
1. Add a new `Migration` struct to `message_migrations()`
2. Increment the `version` number
3. Write SQL in the `sql` field
4. Test thoroughly — migrations run on startup; failed SQL crashes the app
5. Test the migration path by running the old version first, then upgrading

See `docs/MIGRATION.md` for detailed migration strategy and rollback procedures.

### CI/CD automation

Example GitHub Actions workflow:
```yaml
name: Build & Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: npm install
      - run: npm run tauri:build
      - uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/**/*
```

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design, data flow, extension model
- **[API_STANDARDS.md](docs/API_STANDARDS.md)** — CORS, storage, normalization rules
- **[FIRST_SLICE.md](docs/FIRST_SLICE.md)** — Current implementation status
- **[MIGRATION.md](docs/MIGRATION.md)** — Database schema, detailed dev/build/ship guide
- **[SECURE_STORAGE.md](docs/SECURE_STORAGE.md)** — Token handling for browser vs Tauri
- **[provider-template.ts](docs/provider-template.ts)** — Template for new providers
