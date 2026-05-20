import { describe, expect, it } from 'vitest'
import { MockProvider } from '../src/providers/mock-focus'

describe('ScenarioProvider-based adapters', () => {
  it('creates incoming notifications with normalized direction metadata', async () => {
    const provider = new MockProvider()
    const notifications = await provider.getNotifications()

    expect(notifications).toHaveLength(1)
    expect(notifications[0]?.providerId).toBe('mock-focus')
    expect(notifications[0]?.direction).toBe('incoming')
  })

  it('returns a local echo when sending a reply', async () => {
    const provider = new MockProvider()
    const [notification] = await provider.getNotifications()
    const result = await provider.sendMessage(notification.threadId, 'Replying with **markdown** :wave:')

    expect(result.accepted).toBe(true)
    expect(result.notification?.direction).toBe('outgoing')
    expect(result.notification?.threadId).toBe(notification.threadId)
  })
})
