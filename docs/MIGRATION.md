# Migration & Operations Guide

This document covers database schema evolution, local development setup, building, and shipping mimir.

## Database Schema

### Version 1: Core messages table
```sql
CREATE TABLE IF NOT EXISTS messages (
  id           TEXT    PRIMARY KEY,
  provider_id  TEXT    NOT NULL,
  platform     TEXT    NOT NULL,
  title        TEXT    NOT NULL,
  body         TEXT    NOT NULL,
  preview      TEXT,
  timestamp    TEXT    NOT NULL,
  thread_id    TEXT    NOT NULL,
  person_id    TEXT,
  person_label TEXT    NOT NULL,
  read         INTEGER NOT NULL DEFAULT 0
);
```

Stores normalized notifications from all providers. The `id` is a deterministic hash combining provider, platform, and provider-specific IDs to ensure deduplication across restarts.

**Key fields:**
- `provider_id`: Unique identifier for the source provider instance (e.g., `slack:workspace-001`)
- `platform`: Platform name (slack, gmail, linkedin)
- `thread_id`: Groups related messages; used for conversation threads
- `person_id`: Deterministic identifier for the sender; enables stable grouping across platforms
- `timestamp`: ISO 8601 string; used for chronological sorting

### Version 2: Message direction
```sql
ALTER TABLE messages
ADD COLUMN direction TEXT NOT NULL DEFAULT 'incoming';
```

Tracks whether a message is `incoming` (from others) or `outgoing` (sent by the current user). Enables UI filtering and quick-reply history.

## Local Development

### Prerequisites

**For web preview (no Rust required):**
- Node.js ≥18
- npm ≥9

**For desktop shell (full Tauri experience):**
- All of the above, plus:
- Rust 1.70+ (installed via `rustup`)
- Xcode command-line tools (macOS) or Visual C++ build tools (Windows)

### Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd mimir
   npm install
   ```

2. **Run web preview**
   ```bash
   npm run dev
   ```
   Opens on `http://localhost:5173` with hot reload. Uses in-memory tokens and auto-connects mock providers.

3. **Install Rust (one-time, for desktop)**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

4. **Run desktop shell**
   ```bash
   npm run tauri:dev
   ```
   Starts the Tauri dev server. The app window opens with:
   - SQLite database at `~/.local/share/mimir/mimir.db` (macOS: `~/Library/Application Support/mimir/`)
   - Stronghold vault for secure token storage
   - Background poller emitting `mimir://poll-tick` every 10 seconds

### Development Workflow

**Type-check:**
```bash
npm run typecheck
```

**Lint and format:**
```bash
npm run lint
```

**Run tests:**
```bash
npm run test
```
Unit and integration tests in Vitest. E2E tests require the app to be running:
```bash
npm run tauri:dev      # in terminal 1
npm run test:e2e       # in terminal 2
```

**Debug in browser DevTools:**
- Web preview: Use browser DevTools directly
- Desktop shell: Open DevTools via `Ctrl+Shift+I` (or `Cmd+Shift+I` on macOS)

## Building for Production

### Web Production Build

```bash
npm run build
```

Outputs optimized bundle to `dist/`. Use a static host (Netlify, Vercel, S3) to serve.

### Desktop App Bundle

**macOS:**
```bash
npm run tauri:build
```
Produces:
- DMG installer: `src-tauri/target/release/bundle/dmg/mimir_x.x.x_x64.dmg`
- App bundle: `src-tauri/target/release/bundle/macos/mimir.app`

**Windows:**
```bash
npm run tauri:build
```
Produces:
- MSI installer: `src-tauri/target/release/bundle/msi/mimir_x.x.x_x64_en-US.msi`
- Portable EXE: `src-tauri/target/release/bundle/nsis/mimir Setup x.x.x.exe`

**Linux:**
```bash
npm run tauri:build
```
Produces:
- AppImage: `src-tauri/target/release/bundle/appimage/mimir_x.x.x_amd64.AppImage`
- deb package: `src-tauri/target/release/bundle/deb/mimir_x.x.x_amd64.deb`

### Custom Build Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- App name and version
- Bundle settings (icon, identifier, etc.)
- Permission scopes (plugins, deep links, filesystem access)

## Shipping & Distribution

### Version Management

Update version in three places:
1. `package.json`: `"version": "X.Y.Z"`
2. `src-tauri/Cargo.toml`: `version = "X.Y.Z"`
3. `src-tauri/tauri.conf.json`: `"version": "X.Y.Z"`

Use [semantic versioning](https://semver.org/):
- **MAJOR**: Breaking changes to provider API or storage format
- **MINOR**: New features, new providers
- **PATCH**: Bug fixes

### Desktop Release (macOS)

1. **Sign the binary** (requires Apple Developer Certificate)
   ```bash
   npm run tauri:build -- --sign
   ```
   Set environment variables:
   ```bash
   export APPLE_CERTIFICATE_PASSWORD="<password>"
   export APPLE_SIGNING_IDENTITY="<cert-id>"
   ```

2. **Notarize** (required for macOS ≥10.15)
   ```bash
   export APPLE_ID="<apple-id>"
   export APPLE_PASSWORD="<app-specific-password>"
   ```
   Tauri handles notarization automatically when both are set during build.

3. **Distribute**
   - Host DMG on your website
   - Submit to Mac App Store via Transporter
   - Use Sparkle for auto-updates (configure in `tauri.conf.json`)

### Desktop Release (Windows)

1. **Code sign** (optional but recommended)
   ```bash
   npm run tauri:build -- --sign
   ```
   Requires a code signing certificate.

2. **Distribute**
   - Host MSI on your website
   - Submit to Microsoft Store via Partner Center
   - Use Windows Update or Tauri's updater plugin

### Web Distribution

1. **Build**
   ```bash
   npm run build
   ```

2. **Deploy to static host**
   ```bash
   npm run build && vercel       # Vercel
   npm run build && netlify deploy dist  # Netlify
   aws s3 sync dist s3://my-bucket     # AWS S3
   ```

3. **Set Cache Headers**
   - `index.html`: No cache or short TTL (5 min)
   - `dist/assets/*`: Long TTL (1 year), use content hash in filenames

### Updating Provider Credentials

When shipping a new provider or updating OAuth scopes:
1. Update provider adapter in `src/providers/<Name>Provider.ts`
2. Document new scopes in provider comments
3. Bump version
4. For desktop: Users must re-connect the account (old token invalidated)
5. For web: Clear localStorage manually or implement migration

### Database Migrations in Production

When adding a new migration:
1. Add `Migration` struct to `message_migrations()` in [src-tauri/src/main.rs](../src-tauri/src/main.rs)
2. Increment `version` and add unique `description`
3. Write SQL in `sql` field; Tauri applies migrations automatically
4. **Test thoroughly**: Migrations run on every app startup; failed SQL will crash the app
5. Test migration path: app v1 → v2 by running old version first, then upgrading

Example:
```rust
Migration {
    version: 3,
    description: "add_read_at_timestamp",
    sql: r#"
        ALTER TABLE messages
        ADD COLUMN read_at TEXT;
    "#,
    kind: MigrationKind::Up,
}
```

### Rollback Strategy

If a migration causes data loss or crashes:
1. Users can manually delete `mimir.db` to reset (users will lose cache)
2. For sensitive migrations, add a `MigrationKind::Down` that reverts the change
3. Test `Down` migrations locally before shipping

## CI/CD Integration

### GitHub Actions Example

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

## Troubleshooting

**Database locked error:**
- Close other instances of mimir
- On macOS, check `~/Library/Application Support/mimir/mimir.db` is writable

**Stronghold vault not found:**
- Desktop app requires write permissions to `~/.local/share/mimir/` (macOS: `~/Library/Application Support/mimir/`)
- Delete `stronghold-salt.txt` to reset vault (loses stored tokens)

**Build fails with Rust errors:**
- Run `rustup update` to update toolchain
- Run `cargo clean` to clear build cache
- Reinstall Tauri CLI: `cargo install tauri-cli --version ^2.0`

**App won't start after migration:**
- Check Tauri console for SQL errors: `npm run tauri:dev`
- Revert to previous version and debug migration SQL
- As last resort, delete `mimir.db` and let fresh database be created
