import { BaseProvider } from './base-provider'
import type {
  AuthToken,
  MimirFeedItem,
  MimirNotification,
  ProviderMetadata,
  ProviderPlatform,
  SendMessageResult,
} from '../types/mimir'

export interface ScenarioBlueprint {
  personId: string
  personLabel: string
  threadId: string
  title: string
  body: string
  preview?: string
}

interface ScenarioProviderConfig {
  id: string
  platform: ProviderPlatform
  metadata: ProviderMetadata
  accountLabel: string
  scope: string[]
  blueprints: ScenarioBlueprint[]
}

export class ScenarioProvider extends BaseProvider {
  private readonly accountLabel: string
  private readonly scope: string[]
  private readonly blueprints: ScenarioBlueprint[]
  private readonly history = new Map<string, MimirNotification>()
  private sequence = 0

  constructor(config: ScenarioProviderConfig) {
    super(config.id, config.platform, config.metadata)
    this.accountLabel = config.accountLabel
    this.scope = config.scope
    this.blueprints = config.blueprints
  }

  async auth(): Promise<AuthToken> {
    return {
      accessToken: `${this.id}-mock-token`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      scope: this.scope,
      accountLabel: this.accountLabel,
    }
  }

  async getNotifications(): Promise<MimirNotification[]> {
    const blueprint = this.blueprints[this.sequence % this.blueprints.length]
    const notification: MimirNotification = {
      id: `${this.id}:${this.sequence}`,
      providerId: this.id,
      platform: this.platform,
      title: blueprint.title,
      body: blueprint.body,
      preview: blueprint.preview ?? blueprint.body,
      timestamp: new Date(Date.now() - this.sequence * 42_000).toISOString(),
      threadId: blueprint.threadId,
      personId: blueprint.personId,
      personLabel: blueprint.personLabel,
      read: false,
      direction: 'incoming',
    }

    this.sequence += 1
    this.history.set(notification.id, notification)
    return [notification]
  }

  async getActivityFeed(): Promise<MimirFeedItem[]> {
    return [...this.history.values()]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .map((notification) => ({
        id: `${notification.id}:feed`,
        providerId: notification.providerId,
        platform: notification.platform,
        summary: notification.preview ?? notification.body,
        timestamp: notification.timestamp,
        threadId: notification.threadId,
        actorId: notification.personId,
        actorLabel: notification.personLabel,
        read: notification.read,
        direction: notification.direction,
      }))
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    notificationIds.forEach((notificationId) => {
      const existing = this.history.get(notificationId)
      if (existing) {
        this.history.set(notificationId, { ...existing, read: true })
      }
    })
  }

  async sendMessage(threadId: string, content: string): Promise<SendMessageResult> {
    const threadMessages = [...this.history.values()]
      .filter((notification) => notification.threadId === threadId)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    const latest = threadMessages[0] ?? this.buildFallbackThread(threadId)

    const outgoing: MimirNotification = {
      id: `${this.id}:outgoing:${this.sequence}`,
      providerId: this.id,
      platform: this.platform,
      title: `Reply to ${latest.personLabel}`,
      body: content,
      preview: content,
      timestamp: new Date().toISOString(),
      threadId,
      personId: latest.personId,
      personLabel: latest.personLabel,
      read: true,
      direction: 'outgoing',
    }

    this.sequence += 1
    this.history.set(outgoing.id, outgoing)
    await this.markAsRead(threadMessages.map((notification) => notification.id))

    return {
      accepted: true,
      notification: outgoing,
    }
  }

  private buildFallbackThread(threadId: string): ScenarioBlueprint {
    return (
      this.blueprints.find((blueprint) => blueprint.threadId === threadId) ?? {
        personId: `${this.id}@mimir.local`,
        personLabel: this.accountLabel,
        threadId,
        title: 'New thread',
        body: 'Conversation created from the quick-reply composer.',
      }
    )
  }
}
