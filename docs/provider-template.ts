import { BaseProvider } from '../src/providers/base-provider'
import { defineProviderPlugin } from '../src/providers/provider-plugin'
import type {
  AuthToken,
  MimirFeedItem,
  MimirNotification,
  SendMessageResult,
} from '../src/types/mimir'

/**
 * Copy this file into src/providers/<your-provider-slug>/index.ts.
 * The registry auto-discovers provider folder entrypoints by their index.ts file via import.meta.glob.
 */
export class ExampleProvider extends BaseProvider {
  private readonly accountId = 'example-account'

  constructor() {
    super('example-account', 'gmail', {
      displayName: 'Example Gmail',
      icon: 'G',
      summary: 'Example provider that shows the expected metadata and normalization contract.',
      accent: '#ea4335',
      capabilities: ['oauth', 'activity-feed', 'quick-reply', 'read-sync'],
      defaultConnected: false,
    })
  }

  async auth(): Promise<AuthToken> {
    // Prefer invoking a Rust command here to keep tokens out of Webview memory.
    return {
      accessToken: 'fetch-from-rust-command',
      scope: ['notifications:read'],
    }
  }

  async getNotifications(): Promise<MimirNotification[]> {
    return [
      {
        id: `${this.accountId}:message:1`,
        providerId: this.id,
        platform: this.platform,
        title: 'New message received',
        body: 'Normalize provider payloads before returning them.',
        preview: 'Normalize provider payloads before returning them.',
        timestamp: new Date().toISOString(),
        threadId: `${this.accountId}:thread:1`,
        personId: 'user@example.com',
        personLabel: 'Taylor Example',
        read: false,
        direction: 'incoming',
      },
    ]
  }

  async getActivityFeed(): Promise<MimirFeedItem[]> {
    const notifications = await this.getNotifications()
    return notifications.map((n) => ({
      id: `${n.id}:feed`,
      providerId: n.providerId,
      platform: n.platform,
      summary: n.body,
      timestamp: n.timestamp,
      threadId: n.threadId,
      actorId: n.personId,
      actorLabel: n.personLabel,
      read: n.read,
      direction: n.direction,
    }))
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    // Keep provider read-state sync close to the adapter or a Rust command.
    void notificationIds
  }

  async sendMessage(threadId: string, content: string): Promise<SendMessageResult> {
    // Prefer a Rust command for the actual HTTP POST.
    return {
      accepted: true,
      notification: {
        id: `${this.accountId}:reply:${Date.now()}`,
        providerId: this.id,
        platform: this.platform,
        title: 'Reply sent',
        body: content,
        preview: content,
        timestamp: new Date().toISOString(),
        threadId,
        personId: 'user@example.com',
        personLabel: 'Taylor Example',
        read: true,
        direction: 'outgoing',
      },
    }
  }
}

const provider = new ExampleProvider()

export default defineProviderPlugin({
  provider,
})
