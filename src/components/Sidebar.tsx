import type { CSSProperties } from 'react'
import type { IMimirProvider } from '../types/mimir'
import type { ActiveView } from '../store/uiStore'

interface SidebarProps {
  providers: IMimirProvider[]
  activeView: ActiveView
  totalUnread: number
  unreadByProvider: Record<string, number>
  connectedProviderIds: string[]
  onSelect: (view: ActiveView) => void
}

export function Sidebar({
  providers,
  activeView,
  totalUnread,
  unreadByProvider,
  connectedProviderIds,
  onSelect,
}: SidebarProps) {
  const connected = new Set(connectedProviderIds)

  return (
    <aside className="shell-sidebar">
      <section className="brand">
        <div className="brand-mark">M</div>
        <div>
          <p className="panel-label">Unified work stream</p>
          <h2>mimir</h2>
          <p>Repository-first triage across every connected surface.</p>
        </div>
      </section>

      <section className="nav-group">
        <span className="nav-group-title">Views</span>
        <button
          type="button"
          className={`nav-button${activeView === 'aggregated' ? ' is-active' : ''}`}
          onClick={() => onSelect('aggregated')}
          style={{ '--provider-accent': '#000000' } as CSSProperties}
        >
          <span className="nav-button-accent" aria-hidden="true" />
          <span className="nav-button-icon" aria-hidden="true">all</span>
          <span className="nav-button-copy">
            <span className="nav-button-row">
              <strong>All Messages</strong>
              <span className="nav-count">{totalUnread}</span>
            </span>
            <small>Unread across every connected account.</small>
          </span>
        </button>
      </section>

      <section className="nav-group">
        <span className="nav-group-title">Accounts</span>
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`nav-button${activeView === p.id ? ' is-active' : ''}`}
            onClick={() => onSelect(p.id)}
            style={{ '--provider-accent': p.metadata.accent } as CSSProperties}
          >
            <span className="nav-button-accent" aria-hidden="true" />
            <span className="nav-button-icon" aria-hidden="true">{p.metadata.icon}</span>
            <span className="nav-button-copy">
              <span className="nav-button-row">
                <strong>{p.metadata.displayName}</strong>
                <span className="nav-count">{unreadByProvider[p.id] ?? 0}</span>
              </span>
              <small>{connected.has(p.id) ? 'Connected' : 'Disconnected'} · {p.platform}</small>
            </span>
          </button>
        ))}
      </section>

      <section className="sidebar-footer">
        <span className="nav-group-title">Status</span>
        <div className="sidebar-summary-row">
          <span>Connected</span>
          <strong>{connectedProviderIds.length}/{providers.length}</strong>
        </div>
        <div className="sidebar-summary-row">
          <span>Unread</span>
          <strong>{totalUnread}</strong>
        </div>
      </section>
    </aside>
  )
}
