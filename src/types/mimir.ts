export type ProviderPlatform = string
export type MessageDirection = 'incoming' | 'outgoing'
export type ProviderCapability =
  | 'oauth'
  | 'activity-feed'
  | 'quick-reply'
  | 'read-sync'
  | 'lite-webview'
  | (string & {})

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  scope?: string[]
  accountLabel?: string
}

export interface ProviderMetadata {
  displayName: string
  icon: string
  summary: string
  accent: string
  capabilities: ProviderCapability[]
  defaultConnected?: boolean
}

export interface MimirNotification {
  id: string
  providerId: string
  platform: ProviderPlatform
  title: string
  body: string
  preview?: string
  timestamp: string
  threadId: string
  personId?: string
  personLabel: string
  read: boolean
  direction: MessageDirection
}

export interface MimirFeedItem {
  id: string
  providerId: string
  platform: ProviderPlatform
  summary: string
  timestamp: string
  threadId: string
  actorId?: string
  actorLabel: string
  read: boolean
  direction: MessageDirection
}

export interface SendMessageResult {
  accepted: boolean
  notification?: MimirNotification
}

export interface IMimirProvider {
  id: string
  platform: ProviderPlatform
  metadata: ProviderMetadata
  auth(): Promise<AuthToken>
  getNotifications(): Promise<MimirNotification[]>
  getActivityFeed(): Promise<MimirFeedItem[]>
  markAsRead(notificationIds: string[]): Promise<void>
  sendMessage(threadId: string, content: string): Promise<SendMessageResult>
}
