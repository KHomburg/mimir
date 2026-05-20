interface RustStatusCardProps {
  status: 'ok' | 'browser' | 'pending'
  message: string
}

export function RustStatusCard({ status, message }: RustStatusCardProps) {
  return (
    <section className="panel status-card">
      <div className="status-card-row">
        <div>
          <p className="panel-label">Rust bridge</p>
          <h3>{status === 'ok' ? 'Bridge ready' : status === 'browser' ? 'Browser preview' : 'Checking bridge'}</h3>
        </div>
        <span className={`status-pill ${status}`}>{status === 'ok' ? 'Connected' : status}</span>
      </div>
      <p>{message}</p>
    </section>
  )
}
