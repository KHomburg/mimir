import type { MimirNotification, ProviderPlatform } from '../types/mimir'

export interface AggregatedGroup {
  id: string
  title: string
  timestamp: string
  notifications: MimirNotification[]
  platforms: ProviderPlatform[]
  personLabel: string
}

export function sortNotificationsByTimestamp(items: MimirNotification[]): MimirNotification[] {
  return [...items].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}

export function buildAggregatedStream(notifications: MimirNotification[]): AggregatedGroup[] {
  const groups = new Map<string, AggregatedGroup>()

  for (const n of sortNotificationsByTimestamp(notifications)) {
    const key = n.personId ?? n.threadId
    const existing = groups.get(key)
    if (existing) {
      existing.notifications.push(n)
      if (!existing.platforms.includes(n.platform)) existing.platforms.push(n.platform)
      continue
    }
    groups.set(key, {
      id: key,
      title: n.title,
      timestamp: n.timestamp,
      notifications: [n],
      platforms: [n.platform],
      personLabel: n.personLabel,
    })
  }

  return [...groups.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}
