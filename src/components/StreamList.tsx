import type { CSSProperties } from 'react'
import { buildAggregatedStream } from '../lib/aggregator'
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
          <h2>Unread queue</h2>
          <span className="stream-item-meta">{groups.length} grouped conversations</span>
        </div>
        <div className="stream-scroll">
          {groups.map((g) => (
            <button
              type="button"
              key={g.id}
              className={`stream-row stream-group${selectedThreadId === g.notifications[0]?.threadId ? ' is-selected' : ''}`}
              onClick={() => onSelectThread(g.notifications[0]?.threadId ?? g.id)}
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
        <h2>Account feed</h2>
        <span className="stream-item-meta">{notifications.length} cached messages</span>
      </div>
      <div className="stream-scroll">
        {notifications.map((n) => (
          <button
            type="button"
            key={n.id}
            className={`stream-row stream-item${selectedThreadId === n.threadId ? ' is-selected' : ''}`}
            onClick={() => onSelectThread(n.threadId)}
            style={{ '--provider-accent': accentByProvider[n.providerId] ?? '#000000' } as CSSProperties}
          >
            <span className="stream-row-accent" aria-hidden="true" />
            <div className="stream-avatar" aria-hidden="true">{toInitials(n.personLabel)}</div>
            <div className="stream-row-content">
              <header>
                <div className="stream-copy">
                  <h4>{n.direction === 'outgoing' ? `You replied · ${n.personLabel}` : n.personLabel}</h4>
                  <p className="stream-headline">{n.title}</p>
                </div>

                <div className="stream-row-meta">
                  {!n.read ? <span className="stream-unread-dot" aria-hidden="true" /> : null}
                  <span className="stream-item-meta">{fmt(n.timestamp)}</span>
                </div>
              </header>

              <p className="stream-body">{n.preview ?? n.body}</p>

              <div className="stream-platforms">
                <span className="pill">{n.platform}</span>
                <span className="pill">{n.read ? 'read' : 'unread'}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
