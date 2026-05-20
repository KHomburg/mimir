const EMOJI_MAP: Record<string, string> = {
  ':wave:': '👋',
  ':rocket:': '🚀',
  ':eyes:': '👀',
  ':thumbsup:': '👍',
  ':white_check_mark:': '✅',
  ':sparkles:': '✨',
  ':fire:': '🔥',
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderComposerPreview(value: string): string {
  let html = escapeHtml(value.trim())

  Object.entries(EMOJI_MAP).forEach(([shortcode, emoji]) => {
    html = html.replaceAll(shortcode, emoji)
  })

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\n/g, '<br />')

  return html
}
