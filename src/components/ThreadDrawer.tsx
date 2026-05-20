import { QuickReply } from './QuickReply'
import { Avatar, Badge, MessageBubble } from './ui'
import { ProviderBadgeRow, ProviderFactGrid, ProviderSurfaceSection } from './providerSurfaces'
import type { ProviderPluginDefinition } from '../providers/provider-plugin'
import type { IMimirProvider, MimirNotification } from '../types/mimir'

interface ThreadDrawerProps {
  isOpen: boolean
  onClose: () => void
  thread: MimirNotification[]
  provider?: IMimirProvider
  plugin?: ProviderPluginDefinition
  providerConnected: boolean
  allowComposer: boolean
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  isSending: boolean
  accentByProvider: Record<string, string>
}

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function ThreadDrawer({
  isOpen,
  onClose,
  thread,
  provider,
  plugin,
  providerConnected,
  allowComposer,
  draft,
  onDraftChange,
  onSend,
  isSending,
  accentByProvider,
}: ThreadDrawerProps) {
  if (!isOpen || !thread.length) {
    return null
  }

  const orderedThread = [...thread].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
  const latest = orderedThread[orderedThread.length - 1]
  const providerBadges = Array.from(new Set(orderedThread.map((notification) => notification.platform)))
  const currentProvider = provider ?? plugin?.provider
  const detailContext =
    currentProvider && latest
      ? {
          provider: currentProvider,
          thread: orderedThread,
          latest,
        }
      : undefined

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close message details" onClick={onClose} />
      <aside className="thread-drawer is-open" aria-label="Message details">
        <header className="thread-drawer-header">
          <div className="thread-drawer-identity">
            <Avatar label={latest.personLabel} accent={accentByProvider[latest.providerId]} size="lg" />
            <div>
              <p className="panel-label">Message details</p>
              <h2>{latest.personLabel}</h2>
              <p className="subtitle">
                {orderedThread.length} entries · Last updated {formatTimestamp(latest.timestamp)}
              </p>
            </div>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="thread-drawer-body">
          {detailContext && plugin?.renderThreadDetails ? (
            plugin.renderThreadDetails(detailContext)
          ) : (
            <ProviderSurfaceSection
              label="Conversation"
              title={latest.title}
              subtitle="Open the full thread here while the main workspace stays focused on the stream."
            >
              <ProviderFactGrid
                items={[
                  { label: 'Messages', value: `${orderedThread.length}` },
                  { label: 'Latest source', value: latest.platform },
                  { label: 'Current state', value: latest.read ? 'Read' : 'Unread' },
                ]}
              />
              <ProviderBadgeRow items={providerBadges} />
            </ProviderSurfaceSection>
          )}

          <section className="panel conversation-panel">
            <div className="panel-toolbar conversation-toolbar">
              <h3>Full thread</h3>
              <ProviderBadgeRow items={providerBadges} />
            </div>
            <div className="conversation-thread">
              {orderedThread.map((notification) => (
                <MessageBubble
                  key={notification.id}
                  accent={accentByProvider[notification.providerId]}
                  direction={notification.direction}
                  sender={notification.direction === 'outgoing' ? 'You' : notification.personLabel}
                  badges={<Badge>{notification.platform}</Badge>}
                  timestamp={formatTimestamp(notification.timestamp)}
                  title={notification.title}
                  body={notification.body}
                />
              ))}
            </div>
          </section>

          {currentProvider && allowComposer && providerConnected ? (
            plugin?.renderComposer && detailContext ? (
              plugin.renderComposer({
                ...detailContext,
                value: draft,
                onChange: onDraftChange,
                onSend,
                isSending,
              })
            ) : (
              <QuickReply
                provider={currentProvider}
                selectedThreadId={latest.threadId}
                selectedThreadLabel={latest.personLabel}
                value={draft}
                onChange={onDraftChange}
                onSend={onSend}
                isSending={isSending}
                label={plugin?.composer?.label}
                helperText={plugin?.composer?.helperText}
                placeholder={plugin?.composer?.placeholder}
                submitLabel={plugin?.composer?.submitLabel}
                featureBadges={plugin?.composer?.featureBadges}
              />
            )
          ) : currentProvider && allowComposer ? (
            <ProviderSurfaceSection
              label="Replies"
              title={`Connect ${currentProvider.metadata.displayName} to reply`}
              subtitle="Provider-specific compose surfaces stay available, but sending remains scoped to connected provider streams."
            />
          ) : (
            <ProviderSurfaceSection
              label="Replies"
              title="Reply from a provider stream"
              subtitle="Cross-provider views stay read-focused. Open a specific provider to use that plugin's composer."
            />
          )}
        </div>
      </aside>
    </>
  )
}
