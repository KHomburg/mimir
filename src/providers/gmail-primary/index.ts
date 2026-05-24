import {
  renderGmailSettingsPanel,
  renderGmailStreamRow,
  renderGmailThreadDetails,
} from '../builtinProviderSurfaces'
import { BaseProvider } from '../base-provider'
import { defineProviderPlugin } from '../provider-plugin'
import type { MimirFeedItem, MimirNotification, SendMessageResult } from '../../types/mimir'
import {
  authenticateWithGmail,
  listGmailThreads,
  sendGmailReply,
  markGmailThreadsRead,
} from './gmail-live'
import {
  normalizeGmailThread,
  notificationToFeedItem,
  stripGmailThreadId,
  type NormalizedGmailNotification,
} from './gmail-normalization'

export class GmailPrimaryProvider extends BaseProvider {
  private readonly history = new Map<string, MimirNotification>()
  private readonly nativeThreadIdsByNotificationId = new Map<string, string>()

  constructor() {
    super('gmail-primary', 'gmail', {
      displayName: 'Gmail · Primary',
      icon: '✉',
      summary: 'Email notifications, replies, and thread-based conversations from Gmail.',
      accent: '#ea4335',
      capabilities: ['oauth', 'activity-feed', 'quick-reply', 'read-sync'],
      defaultConnected: false,
    })
  }

  async auth() {
    return authenticateWithGmail()
  }

  async getNotifications(): Promise<MimirNotification[]> {
    const { accountEmail, threads } = await listGmailThreads(this.id)
    const notifications = threads
      .map((thread) => normalizeGmailThread(thread, this.id, accountEmail))
      .filter((notification): notification is NormalizedGmailNotification => Boolean(notification))

    this.history.clear()
    this.nativeThreadIdsByNotificationId.clear()

    for (const notification of notifications) {
      this.history.set(notification.id, notification)
      this.nativeThreadIdsByNotificationId.set(notification.id, notification.nativeThreadId)
    }

    return notifications
  }

  async getActivityFeed(): Promise<MimirFeedItem[]> {
    return [...this.history.values()]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .map(notificationToFeedItem)
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    const nativeThreadIds = notificationIds
      .map((notificationId) => this.nativeThreadIdsByNotificationId.get(notificationId))
      .filter((threadId): threadId is string => Boolean(threadId))

    await markGmailThreadsRead(this.id, nativeThreadIds)

    notificationIds.forEach((notificationId) => {
      const existing = this.history.get(notificationId)
      if (existing) {
        this.history.set(notificationId, { ...existing, read: true })
      }
    })
  }

  async sendMessage(threadId: string, content: string): Promise<SendMessageResult> {
    const nativeThreadId = stripGmailThreadId(threadId)
    await sendGmailReply(this.id, nativeThreadId, content)

    const latestThreadMessage = [...this.history.values()]
      .filter((notification) => notification.threadId === threadId)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .at(0)

    const outgoing: MimirNotification = {
      id: `${this.id}:outgoing:${Date.now()}`,
      providerId: this.id,
      platform: this.platform,
      title: latestThreadMessage?.title ?? 'Reply sent',
      body: content,
      preview: content,
      timestamp: new Date().toISOString(),
      threadId,
      personId: latestThreadMessage?.personId,
      personLabel: latestThreadMessage?.personLabel ?? 'Gmail recipient',
      read: true,
      direction: 'outgoing',
    }

    this.history.set(outgoing.id, outgoing)

    return {
      accepted: true,
      notification: outgoing,
    }
  }
}

const provider = new GmailPrimaryProvider()

export default defineProviderPlugin({
  provider,
  composer: {
    label: 'Email reply',
    helperText: 'Email plugins can steer longer-form reply copy and formatting hints without changing the core shell.',
    placeholder: 'Write the full email reply...',
    submitLabel: 'Send email',
    featureBadges: ['Formatting', 'Links', 'Reply chain'],
  },
  renderStreamRow: renderGmailStreamRow,
  renderThreadDetails: renderGmailThreadDetails,
  renderSettingsPanel: renderGmailSettingsPanel,
})
