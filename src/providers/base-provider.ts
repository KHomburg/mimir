import type {
  AuthToken,
  IMimirProvider,
  MimirFeedItem,
  MimirNotification,
  ProviderMetadata,
  ProviderPlatform,
} from '../types/mimir'

export abstract class BaseProvider implements IMimirProvider {
  readonly id: string
  readonly platform: ProviderPlatform
  readonly metadata: ProviderMetadata

  constructor(id: string, platform: ProviderPlatform, metadata: ProviderMetadata) {
    this.id = id
    this.platform = platform
    this.metadata = metadata
  }

  abstract auth(): Promise<AuthToken>
  abstract getNotifications(): Promise<MimirNotification[]>
  abstract getActivityFeed(): Promise<MimirFeedItem[]>
  abstract sendMessage(threadId: string, content: string): Promise<boolean>
}
