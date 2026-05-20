import { BaseProvider } from './base-provider'
import type { AuthToken, MimirFeedItem, MimirNotification } from '../types/mimir'

const mockThreads = [
  {
    personId: 'sam@acme.dev',
    personLabel: 'Sam Rivera',
    threadId: 'slack:sam-rivera',
    title: 'Standup follow-up',
    body: 'Can you review the new provider contract before lunch?',
  },
  {
    personId: 'drew@network.io',
    personLabel: 'Drew Chen',
    threadId: 'linkedin:drew-chen',
    title: 'Recruiter ping',
    body: 'Wanted to follow up on your profile. Interested in a staff role?',
  },
  {
    personId: 'alerts@mimir.dev',
    personLabel: 'Build Bot',
    threadId: 'gmail:build-alerts',
    title: 'CI summary',
    body: 'Nightly build is green again after the SQL migration fix.',
  },
]

export class MockProvider extends BaseProvider {
  private nextIndex = 0
  private readonly history: MimirNotification[] = []

  constructor() {
    super('mock-focus', 'mock', {
      displayName: 'Focus Demo',
      icon: '◉',
    })
  }

  async auth(): Promise<AuthToken> {
    return {
      accessToken: 'mock-access-token',
      scope: ['notifications:read', 'messages:write'],
    }
  }

  async getNotifications(): Promise<MimirNotification[]> {
    const blueprint = mockThreads[this.nextIndex % mockThreads.length]
    const notification: MimirNotification = {
      id: `${this.id}:${this.nextIndex}`,
      providerId: this.id,
      platform: this.platform,
      title: blueprint.title,
      body: blueprint.body,
      preview: blueprint.body,
      timestamp: new Date(Date.now() - this.nextIndex * 45_000).toISOString(),
      threadId: blueprint.threadId,
      personId: blueprint.personId,
      personLabel: blueprint.personLabel,
      read: false,
    }
    this.nextIndex += 1
    this.history.unshift(notification)
    return [notification]
  }

  async getActivityFeed(): Promise<MimirFeedItem[]> {
    return this.history.map((n) => ({
      id: `${n.id}:feed`,
      providerId: n.providerId,
      platform: n.platform,
      summary: n.body,
      timestamp: n.timestamp,
      threadId: n.threadId,
      actorId: n.personId,
      actorLabel: n.personLabel,
      read: n.read,
    }))
  }

  async sendMessage(_threadId: string, _content: string): Promise<boolean> {
    return true
  }
}

export default new MockProvider()
