import { BaseProvider } from '../src/providers/base-provider'
import type { AuthToken, MimirFeedItem, MimirNotification } from '../src/types/mimir'

/**
 * Copy this file into src/providers/ and rename it <YourPlatform>Provider.ts.
 * The registry auto-discovers files matching *Provider.ts via import.meta.glob.
 */
export class ExampleProvider extends BaseProvider {
  private readonly accountId = 'example-account'

  constructor() {
    super('example-account', 'gmail', {
      displayName: 'Example Gmail',
      icon: 'G',
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
    }))
  }

  async sendMessage(_threadId: string, _content: string): Promise<boolean> {
    // Prefer a Rust command for the actual HTTP POST.
    return true
  }
}

export default new ExampleProvider()
