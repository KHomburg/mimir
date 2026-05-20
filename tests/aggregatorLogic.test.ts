import { describe, expect, it } from 'vitest'
import { buildAggregatedStream, sortNotificationsByTimestamp } from '../src/lib/aggregator'
import type { MimirNotification } from '../src/types/mimir'

const items: MimirNotification[] = [
  {
    id: 'slack-1', providerId: 'slack-work', platform: 'slack',
    title: 'Slack ping', body: 'Oldest',
    timestamp: '2026-01-01T08:00:00.000Z',
    threadId: 'thread-a', personId: 'alex@example.com', personLabel: 'Alex', read: false,
  },
  {
    id: 'gmail-1', providerId: 'gmail-primary', platform: 'gmail',
    title: 'Email reply', body: 'Newest',
    timestamp: '2026-01-01T10:00:00.000Z',
    threadId: 'thread-b', personId: 'taylor@example.com', personLabel: 'Taylor', read: false,
  },
  {
    id: 'linkedin-1', providerId: 'linkedin-main', platform: 'linkedin',
    title: 'LinkedIn DM', body: 'Middle',
    timestamp: '2026-01-01T09:00:00.000Z',
    threadId: 'thread-c', personId: 'casey@example.com', personLabel: 'Casey', read: true,
  },
]

describe('sortNotificationsByTimestamp', () => {
  it('orders notifications newest-first across providers', () => {
    const result = sortNotificationsByTimestamp(items)
    expect(result.map((n) => n.id)).toEqual(['gmail-1', 'linkedin-1', 'slack-1'])
  })
})

describe('buildAggregatedStream', () => {
  it('groups by personId and surfaces the newest group first', () => {
    const groups = buildAggregatedStream(items)
    expect(groups[0].id).toBe('taylor@example.com')
    expect(groups).toHaveLength(3)
  })

  it('includes all source platforms for cross-platform threads', () => {
    const crossPlatform: MimirNotification[] = [
      { ...items[0], personId: 'same@example.com', personLabel: 'Same' },
      { ...items[1], personId: 'same@example.com', personLabel: 'Same', platform: 'gmail' },
    ]
    const groups = buildAggregatedStream(crossPlatform)
    expect(groups).toHaveLength(1)
    expect(groups[0].platforms).toContain('slack')
    expect(groups[0].platforms).toContain('gmail')
  })
})
