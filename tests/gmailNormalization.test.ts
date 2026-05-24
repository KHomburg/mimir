import { describe, expect, it } from 'vitest'
import {
  buildGmailThreadId,
  normalizeGmailThread,
  parseMailbox,
  stripGmailThreadId,
} from '../src/providers/gmail-primary/gmail-normalization'

describe('Gmail normalization', () => {
  it('normalizes the latest Gmail message into the shared notification shape', () => {
    const notification = normalizeGmailThread(
      {
        id: 'thread-123',
        messages: [
          {
            id: 'message-older',
            threadId: 'thread-123',
            internalDate: '1716211000000',
            labelIds: ['UNREAD'],
            snippet: 'Older email',
            payload: {
              headers: [
                { name: 'From', value: 'Taylor Example <taylor@example.com>' },
                { name: 'To', value: 'owner@mimir.dev' },
                { name: 'Subject', value: 'Roadmap follow-up' },
              ],
            },
          },
          {
            id: 'message-latest',
            threadId: 'thread-123',
            internalDate: '1716212000000',
            labelIds: ['INBOX'],
            snippet: 'Latest Gmail preview',
            payload: {
              headers: [
                { name: 'From', value: 'Taylor Example <taylor@example.com>' },
                { name: 'To', value: 'owner@mimir.dev' },
                { name: 'Subject', value: 'Roadmap follow-up' },
              ],
            },
          },
        ],
      },
      'gmail-primary',
      'owner@mimir.dev',
    )

    expect(notification).toMatchObject({
      id: 'gmail-primary:message-latest',
      providerId: 'gmail-primary',
      platform: 'gmail',
      title: 'Roadmap follow-up',
      preview: 'Latest Gmail preview',
      threadId: 'gmail:thread-123',
      personId: 'taylor@example.com',
      personLabel: 'Taylor Example',
      read: true,
      direction: 'incoming',
      nativeThreadId: 'thread-123',
      nativeMessageId: 'message-latest',
    })
  })

  it('keeps Gmail thread ids reversible and parses mailbox labels cleanly', () => {
    expect(buildGmailThreadId('abc123')).toBe('gmail:abc123')
    expect(stripGmailThreadId('gmail:abc123')).toBe('abc123')
    expect(parseMailbox('"Taylor Example" <taylor@example.com>')).toEqual({
      label: 'Taylor Example',
      email: 'taylor@example.com',
    })
  })
})
