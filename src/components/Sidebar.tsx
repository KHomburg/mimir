import type { IMimirProvider } from '../types/mimir'
import type { ActiveView } from '../store/uiStore'

interface SidebarProps {
  providers: IMimirProvider[]
  activeView: ActiveView
  onSelect: (view: ActiveView) => void
}

export function Sidebar({ providers, activeView, onSelect }: SidebarProps) {
  return (
    <aside className="shell-sidebar">
      <section className="brand">
        <p className="eyebrow">focus-first workspace</p>
        <h2>mimir</h2>
        <p>Cross-platform notifications without the feed noise.</p>
      </section>

      <section className="nav-group">
        <span className="nav-group-title">Views</span>
        <button
          type="button"
          className={`nav-button${activeView === 'aggregated' ? ' is-active' : ''}`}
          onClick={() => onSelect('aggregated')}
        >
          Aggregated Stream
          <small>Chronological overview across every connected account.</small>
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
          >
            {p.metadata.icon} {p.metadata.displayName}
            <small>{p.platform} adapter</small>
          </button>
        ))}
      </section>
    </aside>
  )
}
