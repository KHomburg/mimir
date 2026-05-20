---
description: "Use when editing the React shell, sidebar, stream list, quick reply UI, CSS theme tokens, or Zustand UI state."
applyTo:
  - "src/App.tsx"
  - "src/components/**/*.tsx"
  - "src/store/**/*.ts"
  - "src/App.css"
  - "src/index.css"
---
# Frontend shell rules

- Preserve the calm, work-focused "Zen" aesthetic: strong hierarchy, low visual noise, no decorative animation.
- Prefer simple CSS and existing primitives over bringing in new UI frameworks or heavy component libraries.
- Keep stream rendering data-driven; view state belongs in Zustand, remote/cache state belongs in TanStack Query and the repository layer.
- Quick actions should stay lightweight and keyboard-friendly.
- If a UI change affects provider data shape, update the shared types and tests rather than adding component-local transforms.
- The left rail should continue to communicate the two primary surfaces clearly: the aggregated stream and per-account views.
- Prefer optimistic-feeling UX by reading from cached repository data first and treating polling/network updates as background refreshes.
- Preserve room for future platform tabs and multi-account states; avoid layout assumptions that only work for one provider.
- Messaging and reply affordances should stay generic so Slack, Gmail, and LinkedIn can all plug into the same shell.
- If adding badges, counters, or status pills, keep them informative and quiet rather than attention-seeking.
