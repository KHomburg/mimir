import type { IMimirProvider } from '../types/mimir'

interface QuickReplyProps {
  provider?: IMimirProvider
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isSending: boolean
}

export function QuickReply({ provider, value, onChange, onSend, isSending }: QuickReplyProps) {
  const disabled = !provider || value.trim().length === 0 || isSending
  return (
    <section className="panel quick-reply">
      <p className="panel-label">Quick reply</p>
      <h3>{provider ? `Reply via ${provider.metadata.displayName}` : 'Select an account to reply'}</h3>
      <p className="subtitle">Markdown and emoji-friendly composer. Sensitive sends should use Rust commands.</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Reply with markdown, links, or :emoji: shortcuts…"
      />
      <div className="quick-reply-footer">
        <span className="quick-reply-help">Sensitive provider writes → Rust commands.</span>
        <button type="button" className="primary-button" disabled={disabled} onClick={onSend}>
          {isSending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </section>
  )
}
