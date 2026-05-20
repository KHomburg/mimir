import { buildAggregatedStream } from '../lib/aggregator'
import type { ActiveView } from '../store/uiStore'
import type { MimirNotification } from '../types/mimir'

interface StreamListProps {
  view: ActiveView
  notifications: MimirNotification[]
  isLoading: boolean
}

function fmt(ts: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric',
  }).format(new Date(ts))
}

export function StreamList({ view, notifications, isLoading }: StreamListProps) {
  if (isLoading) {
    return <div className="stream-empty"><p>Loading local cache…</p></div>
  }
  if (notifications.length === 0) {
    return (
      <div className="stream-empty">
        <p>No cached notifications yet. The mock provider seeds the stream automatically.</p>
      </div>
    )
  }

  if (view === 'aggregated') {
    const groups = buildAggregatedStream(notifications)
    return (
      <>
        <div className="panel-toolbar">
          <h2>Aggregated Stream</h2>
          <span className="stream-item-meta">{groups.length} grouped conversations</span>
        </div>
        <div className="stream-scroll">
          {groups.map((g) => (
            <article key={g.id} className="stream-group">
              <header>
                <div>
                  <h3>{g.personLabel}</h3>
                  <p className="stream-group-meta">
                    {g.notifications.length} messages · latest {fmt(g.timestamp)}
                  </p>
                </div>
                <span className="status-pill">{g.notifications[0]?.read ? 'Read' : 'Unread'}</span>
              </header>
              <p className="stream-body">{g.notifications[0]?.body}</p>
              <div className="stream-platforms">
                {g.platforms.map((pl) => (
                  <span key={`${g.id}:${pl}`} className="pill">{pl}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="panel-toolbar">
        <h2>Account Feed</h2>
        <span className="stream-item-meta">{notifications.length} cached messages</span>
      </div>
      <div className="stream-scroll">
        {notifications.map((n) => (
          <article key={n.id} className="stream-item">
            <header>
              <div>
                <h4>{n.title}</h4>
                <p className="stream-item-meta">{n.personLabel} · {fmt(n.timestamp)}</p>
              </div>
              <span className={`status-pill${n.read ? ' ok' : ' pending'}`}>
                {n.read ? 'Read' : 'Unread'}
              </span>
            </header>
            <p className="stream-body">{n.body}</p>
          </article>
        ))}
      </div>
    </>
  )
}
