import type { MimirFeedItem, MimirNotification } from '../../types/mimir'

export interface GmailHeader {
  name: string
  value: string
}

interface GmailPayload {
  headers?: GmailHeader[]
}

export interface GmailMessageResource {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  internalDate?: string
  payload?: GmailPayload
}

export interface GmailThreadResource {
  id: string
  messages?: GmailMessageResource[]
}

export interface NormalizedGmailNotification extends MimirNotification {
  nativeThreadId: string
  nativeMessageId: string
}

interface Mailbox {
  email?: string
  label?: string
}

export function buildGmailThreadId(nativeThreadId: string): string {
  return `gmail:${nativeThreadId}`
}

export function stripGmailThreadId(threadId: string): string {
  return threadId.startsWith('gmail:') ? threadId.slice('gmail:'.length) : threadId
}

export function notificationToFeedItem(notification: MimirNotification): MimirFeedItem {
  return {
    id: `${notification.id}:feed`,
    providerId: notification.providerId,
    platform: notification.platform,
    summary: notification.preview ?? notification.body,
    timestamp: notification.timestamp,
    threadId: notification.threadId,
    actorId: notification.personId,
    actorLabel: notification.personLabel,
    read: notification.read,
    direction: notification.direction,
  }
}

export function normalizeGmailThread(
  thread: GmailThreadResource,
  providerId: string,
  accountEmail: string,
): NormalizedGmailNotification | undefined {
  const latestMessage = [...(thread.messages ?? [])]
    .sort((a, b) => Number(a.internalDate ?? '0') - Number(b.internalDate ?? '0'))
    .at(-1)

  if (!latestMessage) {
    return undefined
  }

  const headers = latestMessage.payload?.headers ?? []
  const from = parseMailbox(getHeader(headers, 'From'))
  const recipients = parseMailboxList(getHeader(headers, 'To'))
  const counterpart = pickCounterparty(from, recipients, accountEmail)
  const subject = getHeader(headers, 'Subject') ?? 'New email'
  const isOutgoing = from.email?.toLowerCase() === accountEmail.toLowerCase()

  return {
    id: `${providerId}:${latestMessage.id}`,
    providerId,
    platform: 'gmail',
    title: subject,
    body: latestMessage.snippet?.trim() || subject,
    preview: latestMessage.snippet?.trim() || subject,
    timestamp: toIsoTimestamp(latestMessage.internalDate),
    threadId: buildGmailThreadId(thread.id),
    personId: counterpart.email?.toLowerCase(),
    personLabel: counterpart.label ?? counterpart.email ?? 'Unknown sender',
    read: !latestMessage.labelIds?.includes('UNREAD'),
    direction: isOutgoing ? 'outgoing' : 'incoming',
    nativeThreadId: thread.id,
    nativeMessageId: latestMessage.id,
  }
}

export function parseMailbox(value: string | undefined): Mailbox {
  if (!value?.trim()) {
    return {}
  }

  const trimmed = value.trim()
  const angleMatch = trimmed.match(/^(?:"?([^"]*?)"?\s*)?<([^>]+)>$/)
  if (angleMatch) {
    return {
      label: normalizeLabel(angleMatch[1]),
      email: angleMatch[2]?.trim().toLowerCase(),
    }
  }

  const emailMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  if (emailMatch) {
    return {
      label: normalizeLabel(trimmed.replace(emailMatch[0], '').replace(/[<>"]/g, '').trim()),
      email: emailMatch[0].toLowerCase(),
    }
  }

  return {
    label: normalizeLabel(trimmed),
  }
}

function parseMailboxList(value: string | undefined): Mailbox[] {
  if (!value?.trim()) {
    return []
  }

  return value
    .split(',')
    .map((entry) => parseMailbox(entry))
    .filter((entry) => entry.email || entry.label)
}

function pickCounterparty(from: Mailbox, recipients: Mailbox[], accountEmail: string): Mailbox {
  const normalizedAccount = accountEmail.toLowerCase()
  if (from.email && from.email.toLowerCase() !== normalizedAccount) {
    return from
  }

  return recipients.find((recipient) => recipient.email && recipient.email !== normalizedAccount) ?? from
}

function getHeader(headers: GmailHeader[], name: string): string | undefined {
  const normalizedName = name.toLowerCase()
  return headers.find((header) => header.name.toLowerCase() === normalizedName)?.value
}

function normalizeLabel(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed.replace(/^"+|"+$/g, '') : undefined
}

function toIsoTimestamp(internalDate: string | undefined): string {
  const millis = Number(internalDate)
  return Number.isFinite(millis) && millis > 0
    ? new Date(millis).toISOString()
    : new Date().toISOString()
}
