import type { ReactNode } from 'react'

interface ProviderSurfaceSectionProps {
  label: string
  title: string
  subtitle?: string
  children?: ReactNode
}

interface ProviderFactGridProps {
  items: Array<{
    label: string
    value: string
  }>
}

interface ProviderBadgeRowProps {
  items: string[]
}

export function ProviderSurfaceSection({
  label,
  title,
  subtitle,
  children,
}: ProviderSurfaceSectionProps) {
  return (
    <section className="panel provider-surface-section">
      <p className="panel-label">{label}</p>
      <div className="provider-surface-copy">
        <h3>{title}</h3>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function ProviderFactGrid({ items }: ProviderFactGridProps) {
  return (
    <dl className="provider-fact-grid">
      {items.map((item) => (
        <div key={`${item.label}:${item.value}`} className="provider-fact-card">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ProviderBadgeRow({ items }: ProviderBadgeRowProps) {
  if (!items.length) {
    return null
  }

  return (
    <div className="provider-badge-row">
      {items.map((item) => (
        <span key={item} className="pill">
          {item}
        </span>
      ))}
    </div>
  )
}
