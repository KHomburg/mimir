# Provider matrix

## Shared contract

Every provider must supply:
- `auth()`
- `getNotifications()`
- `getActivityFeed()`
- `sendMessage(threadId, content)`

All outputs must normalize into the shared `MimirNotification` and `MimirFeedItem` contracts.

## Platform guidance

### Slack
- Good fit for threads, channels, and read-status sync
- Often needs workspace-scoped account identifiers
- Sensitive token handling should stay out of the Webview

### Gmail
- Strong candidate for email-based `personId`
- Thread identity should mirror Gmail conversation IDs
- Message bodies may need careful preview extraction and markdown sanitization

### LinkedIn
- Profile identity may be less stable than email-backed providers
- Normalize conversation and actor identifiers explicitly
- Expect more cases where privileged or browser-hostile networking should move to Rust

### Mock provider
- Must stay simple, deterministic, and useful for shell development
- Should exercise grouping, unread state, and chronological ordering

## Design rule

If a provider cannot cleanly support a feature yet, degrade the provider capability explicitly rather than bending the shared contracts.
