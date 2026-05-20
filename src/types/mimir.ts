export type ProviderPlatform = 'slack' | 'linkedin' | 'gmail' | 'mock'

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  scope?: string[]
}

export interface ProviderMetadata {
  displayName: string
  icon: string
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
}

export interface IMimirProvider {
  id: string
  platform: ProviderPlatform
  metadata: ProviderMetadata
  auth(): Promise<AuthToken>
  getNotifications(): Promise<MimirNotification[]>
  getActivityFeed(): Promise<MimirFeedItem[]>
  sendMessage(threadId: string, content: string): Promise<boolean>
}
