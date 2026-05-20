import type { IMimirProvider } from '../types/mimir'
import { renderComposerPreview } from '../lib/markdown'

interface QuickReplyProps {
  provider?: IMimirProvider
  selectedThreadId?: string
  selectedThreadLabel?: string
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isSending: boolean
}

export function QuickReply({
  provider,
  selectedThreadId,
  selectedThreadLabel,
  value,
  onChange,
  onSend,
  isSending,
}: QuickReplyProps) {
  const disabled = !provider || !selectedThreadId || value.trim().length === 0 || isSending

  return (
    <section className="panel quick-reply">
      <div className="quick-reply-header">
        <div>
          <p className="panel-label">Quick reply</p>
          <h3>
            {provider
              ? selectedThreadLabel
                ? `Reply to ${selectedThreadLabel}`
                : `Reply via ${provider.metadata.displayName}`
              : 'Select a connected account to reply'}
          </h3>
        </div>
        {provider ? <span className="pill">{provider.platform}</span> : null}
      </div>

      <p className="subtitle quick-reply-note">
        Markdown-friendly composer routed through the selected provider once account wiring is available.
      </p>

      <label className="field-label" htmlFor="quick-reply-textarea">Message</label>
      <textarea
        id="quick-reply-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Reply with markdown, links, or :emoji: shortcuts..."
      />
      {value.trim() ? (
        <div className="reply-preview">
          <p className="panel-label">Preview</p>
          <div
            className="reply-preview-body"
            dangerouslySetInnerHTML={{ __html: renderComposerPreview(value) }}
          />
        </div>
      ) : null}
      <div className="quick-reply-footer">
        <span className="quick-reply-help">
          {selectedThreadId ? `Thread: ${selectedThreadId}` : 'Choose a thread from the stream to reply.'}
        </span>
        <button type="button" className="primary-button" disabled={disabled} onClick={onSend}>
          {isSending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </section>
  )
}
