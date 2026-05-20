import type { CSSProperties, ReactNode } from 'react'

interface AvatarProps {
  label: string
  accent?: string
  size?: 'sm' | 'md' | 'lg'
}

interface BadgeProps {
  children: ReactNode
}

interface PanelProps {
  children: ReactNode
  className?: string
}

interface PanelLabelProps {
  children: ReactNode
}

interface StreamRowBaseProps {
  accent?: string
  avatarLabel: string
  title: ReactNode
  headline?: ReactNode
  preview?: ReactNode
  badges?: ReactNode
  meta?: ReactNode
  unread?: boolean
  selected?: boolean
  onSelect: () => void
}

interface MessageBubbleProps {
  accent?: string
  direction: 'incoming' | 'outgoing'
  sender: ReactNode
  timestamp: ReactNode
  badges?: ReactNode
  title?: ReactNode
  body: ReactNode
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

export function Avatar({ label, accent, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`ui-avatar ui-avatar--${size}`}
      style={{ borderColor: accent ?? 'var(--border)' } as CSSProperties}
      aria-hidden="true"
    >
      {toInitials(label)}
    </div>
  )
}

export function Badge({ children }: BadgeProps) {
  return <span className="pill">{children}</span>
}

export function Panel({ children, className }: PanelProps) {
  return <section className={className ? `panel ${className}` : 'panel'}>{children}</section>
}

export function PanelLabel({ children }: PanelLabelProps) {
  return <p className="panel-label">{children}</p>
}

export function StreamRowBase({
  accent,
  avatarLabel,
  title,
  headline,
  preview,
  badges,
  meta,
  unread,
  selected,
  onSelect,
}: StreamRowBaseProps) {
  return (
    <button
      type="button"
      className={`stream-row stream-item${selected ? ' is-selected' : ''}`}
      onClick={onSelect}
      style={{ '--provider-accent': accent ?? 'var(--primary)' } as CSSProperties}
    >
      <span className="stream-row-accent" aria-hidden="true" />
      <Avatar label={avatarLabel} accent={accent} />
      <div className="stream-row-content">
        <header>
          <div className="stream-copy">
            <h4>{title}</h4>
            {headline ? <p className="stream-headline">{headline}</p> : null}
          </div>

          <div className="stream-row-meta">
            {unread ? <span className="stream-unread-dot" aria-hidden="true" /> : null}
            {meta ? <span className="stream-item-meta">{meta}</span> : null}
          </div>
        </header>

        {preview ? <p className="stream-body">{preview}</p> : null}
        {badges ? <div className="stream-platforms">{badges}</div> : null}
      </div>
    </button>
  )
}

export function MessageBubble({
  accent,
  direction,
  sender,
  timestamp,
  badges,
  title,
  body,
}: MessageBubbleProps) {
  return (
    <article
      className={`message-bubble ${direction === 'outgoing' ? 'outgoing' : 'incoming'}`}
      style={{ '--provider-accent': accent ?? 'var(--primary)' } as CSSProperties}
    >
      <header className="message-bubble-header">
        <div className="message-meta">
          <strong>{sender}</strong>
          {badges}
        </div>
        <span className="stream-item-meta">{timestamp}</span>
      </header>
      {title ? <p className="message-title">{title}</p> : null}
      <p>{body}</p>
    </article>
  )
}
