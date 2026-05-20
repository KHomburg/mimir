import { test } from '@playwright/test'

// Enable once the local Rust toolchain is installed and `npm run tauri:dev` is wired.
test.skip(true, 'Tauri E2E wiring will be enabled once the local Rust toolchain is installed.')
