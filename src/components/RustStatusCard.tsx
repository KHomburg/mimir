interface RustStatusCardProps {
  status: 'ok' | 'browser' | 'pending'
  message: string
}

export function RustStatusCard({ status, message }: RustStatusCardProps) {
  return (
    <section className="panel status-card">
      <p className="panel-label">Rust bridge</p>
      <span className={`status-pill ${status}`}>{status === 'ok' ? 'Connected' : status}</span>
      <p>{message}</p>
    </section>
  )
}
