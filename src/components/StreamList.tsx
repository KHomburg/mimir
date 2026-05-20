import { Fragment, type CSSProperties } from 'react'
import { buildAggregatedStream } from '../lib/aggregator'
import { Badge, StreamRowBase } from './ui'
import type { ProviderPluginDefinition } from '../providers/provider-plugin'
import type { ActiveView } from '../store/uiStore'
import type { MimirNotification } from '../types/mimir'

interface StreamListProps {
  view: ActiveView
  notifications: MimirNotification[]
  isLoading: boolean
  selectedThreadId?: string
  onSelectThread: (threadId: string) => void
  emptyStateMessage: string
  accentByProvider: Record<string, string>
  pluginsByProviderId?: Record<string, ProviderPluginDefinition>
}

function fmt(ts: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric',
  }).format(new Date(ts))
}

function toInitials(label: string) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || '?'
}

export function StreamList({
  view,
  notifications,
  isLoading,
  selectedThreadId,
  onSelectThread,
  emptyStateMessage,
  accentByProvider,
  pluginsByProviderId,
}: StreamListProps) {
  if (isLoading) {
    return <div className="stream-empty"><p>Loading local cache…</p></div>
  }
  if (notifications.length === 0) {
    return (
      <div className="stream-empty">
        <p>{emptyStateMessage}</p>
      </div>
    )
  }

  if (view === 'aggregated') {
    const groups = buildAggregatedStream(notifications)
    return (
      <>
        <div className="panel-toolbar">
          <h2>Mimir Stream</h2>
          <span className="stream-item-meta">{groups.length} grouped conversations</span>
        </div>
        <div className="stream-scroll">
          {groups.map((g) => (
            <button
              type="button"
              key={g.id}
              className={`stream-row stream-group${selectedThreadId === g.id ? ' is-selected' : ''}`}
              onClick={() => onSelectThread(g.id)}
              style={{ '--provider-accent': accentByProvider[g.notifications[0]?.providerId ?? ''] ?? '#000000' } as CSSProperties}
            >
              <span className="stream-row-accent" aria-hidden="true" />
              <div className="stream-avatar" aria-hidden="true">{toInitials(g.personLabel)}</div>
              <div className="stream-row-content">
                <header>
                  <div className="stream-copy">
                    <h3>{g.personLabel}</h3>
                    <p className="stream-headline">{g.notifications[0]?.title}</p>
                  </div>

                  <div className="stream-row-meta">
                    {g.notifications.some((item) => !item.read) ? <span className="stream-unread-dot" aria-hidden="true" /> : null}
                    <span className="stream-item-meta">{fmt(g.timestamp)}</span>
                  </div>
                </header>

                <p className="stream-body">{g.notifications[0]?.preview ?? g.notifications[0]?.body}</p>

                <div className="stream-platforms">
                  <span className="pill">{g.notifications.length} messages</span>
                  {g.platforms.map((pl) => (
                    <span key={`${g.id}:${pl}`} className="pill">{pl}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
      <>
        <div className="panel-toolbar">
          <h2>Provider stream</h2>
        </div>
        <div className="stream-scroll">
          {notifications.map((n) => {
            const plugin = pluginsByProviderId?.[n.providerId]
            const isSelected = selectedThreadId === n.threadId
            const accent = accentByProvider[n.providerId] ?? '#000000'

            return (
              <Fragment key={n.id}>
                {plugin?.renderStreamRow?.({
                  provider: plugin.provider,
                  notification: n,
                  isSelected,
                  accent,
                  onSelect: () => onSelectThread(n.threadId),
                }) ?? (
                  <StreamRowBase
                    accent={accent}
                    avatarLabel={n.personLabel}
                    title={n.direction === 'outgoing' ? `You replied · ${n.personLabel}` : n.personLabel}
                    headline={n.title}
                    preview={n.preview ?? n.body}
                    badges={
                      <>
                        <Badge>{n.platform}</Badge>
                        <Badge>{n.read ? 'Read' : 'Unread'}</Badge>
                      </>
                    }
                    meta={fmt(n.timestamp)}
                    unread={!n.read}
                    selected={isSelected}
                    onSelect={() => onSelectThread(n.threadId)}
                  />
                )}
              </Fragment>
            )
          })}
        </div>
      </>
    )
}
