# Provider checklist

- File name ends in `Provider.ts`
- Extends the shared base provider
- Returns `MimirNotification` and `MimirFeedItem` data, not provider-native shapes
- Uses deterministic `providerId`, `threadId`, and `personId` values
- Keeps auth tokens out of SQLite and React state
- Pushes fetched data through the repository layer before UI render
- Updates tests if grouping, ordering, or auth/bridge behavior changes
- Preserves browser-mode development where possible
- Does not hard-code provider-specific UI assumptions into the shared shell
