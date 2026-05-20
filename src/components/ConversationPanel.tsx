import type { CSSProperties } from 'react'
import { sortNotificationsByTimestamp } from '../lib/aggregator'
import type { ActiveView } from '../store/uiStore'
import type { MimirNotification } from '../types/mimir'

interface ConversationPanelProps {
  view: ActiveView
  notifications: MimirNotification[]
  selectedThreadId?: string
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

function toInitials(label: string) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || '?'
}

export function ConversationPanel({
  view,
  notifications,
  selectedThreadId,
  accentByProvider,
}: ConversationPanelProps) {
  const threadId = selectedThreadId ?? notifications[0]?.threadId
  const thread = sortNotificationsByTimestamp(
    notifications.filter((notification) => notification.threadId === threadId),
  ).reverse()

  if (!thread.length) {
    return (
      <section className="panel conversation-panel">
        <p className="panel-label">Conversation</p>
        <div className="stream-empty conversation-empty">
          <p>Select a thread to inspect its message history.</p>
        </div>
      </section>
    )
  }

  const latest = thread[thread.length - 1]
  const latestAccent = accentByProvider[latest.providerId] ?? '#000000'

  return (
    <section className="panel conversation-panel">
      <div className="panel-toolbar conversation-toolbar">
        <div className="conversation-identity">
          <div className="conversation-avatar" style={{ borderColor: latestAccent }}>
            {toInitials(latest.personLabel)}
          </div>
          <div>
            <h2>{latest.personLabel}</h2>
            <span className="stream-item-meta">
              {view === 'aggregated' ? 'Unified thread' : latest.providerId} · {thread.length} messages
            </span>
          </div>
        </div>
        <span className={`status-pill${latest.read ? ' ok' : ' pending'}`}>
          {latest.read ? 'Read' : 'Unread'}
        </span>
      </div>

      <div className="conversation-thread">
        {thread.map((notification) => (
          <article
            key={notification.id}
            className={`message-bubble ${notification.direction === 'outgoing' ? 'outgoing' : 'incoming'}`}
            style={{ '--provider-accent': accentByProvider[notification.providerId] ?? '#000000' } as CSSProperties}
          >
            <header className="message-bubble-header">
              <div className="message-meta">
                <strong>
                  {notification.direction === 'outgoing' ? 'You' : notification.personLabel}
                </strong>
                <span className="pill">{notification.platform}</span>
              </div>
              <span className="stream-item-meta">{formatTimestamp(notification.timestamp)}</span>
            </header>
            <p>{notification.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
