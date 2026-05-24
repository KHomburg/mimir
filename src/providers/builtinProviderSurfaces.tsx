import { Badge, StreamRowBase } from '../components/ui'
import { ProviderBadgeRow, ProviderFactGrid, ProviderSurfaceSection } from '../components/providerSurfaces'
import type {
  ProviderSettingsContext,
  ProviderStreamRowContext,
  ProviderThreadContext,
} from './provider-plugin'

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function renderSlackStreamRow({
  notification,
  isSelected,
  accent,
  onSelect,
}: ProviderStreamRowContext) {
  return (
    <StreamRowBase
      accent={accent}
      avatarLabel={notification.personLabel}
      title={notification.personLabel}
      headline={notification.title}
      preview={notification.preview ?? notification.body}
      badges={
        <>
          <Badge>Slack</Badge>
          <Badge>Thread</Badge>
          <Badge>Mentions</Badge>
        </>
      }
      meta={formatTimestamp(notification.timestamp)}
      unread={!notification.read}
      selected={isSelected}
      onSelect={onSelect}
    />
  )
}

export function renderGmailStreamRow({
  notification,
  isSelected,
  accent,
  onSelect,
}: ProviderStreamRowContext) {
  return (
    <StreamRowBase
      accent={accent}
      avatarLabel={notification.personLabel}
      title={notification.personLabel}
      headline={notification.title}
      preview={notification.preview ?? notification.body}
      badges={
        <>
          <Badge>Email</Badge>
          <Badge>Formatting</Badge>
          <Badge>Reply chain</Badge>
        </>
      }
      meta={formatTimestamp(notification.timestamp)}
      unread={!notification.read}
      selected={isSelected}
      onSelect={onSelect}
    />
  )
}

export function renderLinkedInStreamRow({
  notification,
  isSelected,
  accent,
  onSelect,
}: ProviderStreamRowContext) {
  return (
    <StreamRowBase
      accent={accent}
      avatarLabel={notification.personLabel}
      title={notification.personLabel}
      headline={notification.title}
      preview={notification.preview ?? notification.body}
      badges={
        <>
          <Badge>LinkedIn</Badge>
          <Badge>Profile context</Badge>
          <Badge>Follow-up</Badge>
        </>
      }
      meta={formatTimestamp(notification.timestamp)}
      unread={!notification.read}
      selected={isSelected}
      onSelect={onSelect}
    />
  )
}

export function renderMockStreamRow({
  notification,
  isSelected,
  accent,
  onSelect,
}: ProviderStreamRowContext) {
  return (
    <StreamRowBase
      accent={accent}
      avatarLabel={notification.personLabel}
      title={notification.personLabel}
      headline={notification.title}
      preview={notification.preview ?? notification.body}
      badges={
        <>
          <Badge>Demo</Badge>
          <Badge>Local echo</Badge>
          <Badge>Read sync</Badge>
        </>
      }
      meta={formatTimestamp(notification.timestamp)}
      unread={!notification.read}
      selected={isSelected}
      onSelect={onSelect}
    />
  )
}

export function renderSlackThreadDetails({ latest, thread }: ProviderThreadContext) {
  return (
    <ProviderSurfaceSection
      label="Slack thread"
      title={latest.title}
      subtitle="Thread-first activity with short-form replies, mentions, and quick follow-up context."
    >
      <ProviderFactGrid
        items={[
          { label: 'Thread size', value: `${thread.length} messages` },
          { label: 'Reply style', value: 'Thread reply + mentions' },
          { label: 'Focus', value: latest.personLabel },
        ]}
      />
      <ProviderBadgeRow items={['Mentions', 'Emoji', 'Thread reply']} />
    </ProviderSurfaceSection>
  )
}

export function renderGmailThreadDetails({ latest, thread }: ProviderThreadContext) {
  return (
    <ProviderSurfaceSection
      label="Email conversation"
      title={latest.title}
      subtitle="Longer-form messages with subject context, richer formatting, and reply-chain history."
    >
      <ProviderFactGrid
        items={[
          { label: 'Thread size', value: `${thread.length} emails` },
          { label: 'Best for', value: 'Long-form updates' },
          { label: 'Latest sender', value: latest.personLabel },
        ]}
      />
      <ProviderBadgeRow items={['Formatting', 'Links', 'Reply chain']} />
    </ProviderSurfaceSection>
  )
}

export function renderLinkedInThreadDetails({ latest, thread }: ProviderThreadContext) {
  return (
    <ProviderSurfaceSection
      label="LinkedIn inbox"
      title={latest.title}
      subtitle="Relationship-driven messaging where context and next actions usually matter more than formatting."
    >
      <ProviderFactGrid
        items={[
          { label: 'Thread size', value: `${thread.length} messages` },
          { label: 'Tone', value: 'Professional outreach' },
          { label: 'Contact', value: latest.personLabel },
        ]}
      />
      <ProviderBadgeRow items={['Profile context', 'Short-form reply', 'Follow-up']} />
    </ProviderSurfaceSection>
  )
}

export function renderMockThreadDetails({ latest, thread }: ProviderThreadContext) {
  return (
    <ProviderSurfaceSection
      label="Demo plugin"
      title={latest.title}
      subtitle="Built-in mock activity used to exercise stream grouping, provider surfaces, and local-first behavior."
    >
      <ProviderFactGrid
        items={[
          { label: 'Thread size', value: `${thread.length} demo messages` },
          { label: 'Purpose', value: 'Local development' },
          { label: 'Contact', value: latest.personLabel },
        ]}
      />
      <ProviderBadgeRow items={['Sample data', 'Local echo', 'Read sync']} />
    </ProviderSurfaceSection>
  )
}

export function renderSlackSettingsPanel({ isConnected, unreadCount }: ProviderSettingsContext) {
  return (
    <>
      <ProviderBadgeRow items={['Threads', 'Mentions', 'Emoji']} />
      <p className="account-helper">
        {isConnected
          ? `${unreadCount} unread Slack updates are ready in the stream.`
          : 'Connect Slack to pull thread activity and reply from the side panel.'}
      </p>
    </>
  )
}

export function renderGmailSettingsPanel({ isConnected, unreadCount }: ProviderSettingsContext) {
  return (
    <>
      <ProviderBadgeRow items={['Formatting', 'Labels', 'Reply chain']} />
      <p className="account-helper">
        {isConnected
          ? `${unreadCount} unread email updates are available in the Gmail stream.`
          : 'Connect Gmail in the desktop shell to run live OAuth, sync inbox threads, and reply from the side panel.'}
      </p>
    </>
  )
}

export function renderLinkedInSettingsPanel({ isConnected, unreadCount }: ProviderSettingsContext) {
  return (
    <>
      <ProviderBadgeRow items={['Profile context', 'Short-form reply', 'Lite webview']} />
      <p className="account-helper">
        {isConnected
          ? `${unreadCount} unread LinkedIn conversations are ready for follow-up.`
          : 'Connect LinkedIn to sync inbox activity and keep outreach in one stream.'}
      </p>
    </>
  )
}

export function renderMockSettingsPanel({ isConnected, unreadCount }: ProviderSettingsContext) {
  return (
    <>
      <ProviderBadgeRow items={['Sample data', 'Local echo', 'Read sync']} />
      <p className="account-helper">
        {isConnected
          ? `${unreadCount} demo items are available for local development.`
          : 'Connect the demo provider to exercise the stream without real accounts.'}
      </p>
    </>
  )
}
