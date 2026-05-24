import { openUrl } from '@tauri-apps/plugin-opener'
import { getAccountVault } from '../../lib/accountVault'
import { waitForOAuthCallback } from '../../lib/oauthCallbacks'
import { isTauriRuntime } from '../../lib/runtime'
import type { AuthToken } from '../../types/mimir'
import type { GmailThreadResource } from './gmail-normalization'

const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_OAUTH_CLIENT_ID?.trim() ?? ''
const GMAIL_REDIRECT_URI = import.meta.env.VITE_GMAIL_OAUTH_REDIRECT_URI?.trim() || 'io.mimir.app:/oauth2redirect'
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
]
const GMAIL_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GMAIL_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me'
const CALLBACK_TIMEOUT_MS = 120_000

interface GmailTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

interface GmailProfileResponse {
  emailAddress: string
}

interface GmailThreadListResponse {
  threads?: Array<{ id: string }>
}

interface GmailSession {
  token: AuthToken
  accountEmail: string
}

export function isGmailLiveConfigured(): boolean {
  return GMAIL_CLIENT_ID.length > 0
}

export function getGmailRedirectUri(): string {
  return GMAIL_REDIRECT_URI
}

export async function authenticateWithGmail(): Promise<AuthToken> {
  assertGmailLiveReady()

  const { authUrl, state, codeVerifier } = await buildAuthorizationRequest()
  await openSystemBrowser(authUrl)

  const callbackUrl = await waitForOAuthCallback(
    (url) => isGmailCallbackUrl(url) && new URL(url).searchParams.get('state') === state,
    CALLBACK_TIMEOUT_MS,
  )
  const callback = new URL(callbackUrl)
  const error = callback.searchParams.get('error')
  if (error) {
    throw new Error(`Gmail sign-in failed: ${error}.`)
  }

  const code = callback.searchParams.get('code')
  if (!code) {
    throw new Error('Gmail sign-in did not return an authorization code.')
  }

  const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
  const profile = await fetchGmailProfile(tokenResponse.accessToken)

  return {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresAt: buildExpiryTimestamp(tokenResponse.expiresIn),
    scope: tokenResponse.scope,
    accountLabel: profile.emailAddress,
  }
}

export async function listGmailThreads(providerId: string): Promise<{ accountEmail: string; threads: GmailThreadResource[] }> {
  const { data, session } = await gmailApiRequest<GmailThreadListResponse>(
    providerId,
    '/threads?labelIds=INBOX&maxResults=12',
  )
  const threadRefs = data.threads ?? []

  const threads = await Promise.all(
    threadRefs.map(async ({ id }) => {
      const { data } = await gmailApiRequest<GmailThreadResource>(
        providerId,
        `/threads/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject`,
        undefined,
        session,
      )
      return data
    }),
  )

  return {
    accountEmail: session.accountEmail,
    threads,
  }
}

export async function markGmailThreadsRead(providerId: string, nativeThreadIds: string[]): Promise<void> {
  const uniqueThreadIds = [...new Set(nativeThreadIds)]
  if (!uniqueThreadIds.length) {
    return
  }

  const session = await getGmailSession(providerId)
  await Promise.all(
    uniqueThreadIds.map((threadId) =>
      gmailApiRequest(
        providerId,
        `/threads/${threadId}/modify`,
        {
          method: 'POST',
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
        },
        session,
      ),
    ),
  )
}

export async function sendGmailReply(
  providerId: string,
  nativeThreadId: string,
  content: string,
): Promise<void> {
  const session = await getGmailSession(providerId)
  const { data: thread } = await gmailApiRequest<GmailThreadResource>(
    providerId,
    `/threads/${nativeThreadId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Message-ID&metadataHeaders=References`,
    undefined,
    session,
  )
  const latestMessage = [...(thread.messages ?? [])]
    .sort((a, b) => Number(a.internalDate ?? '0') - Number(b.internalDate ?? '0'))
    .at(-1)

  if (!latestMessage) {
    throw new Error('Cannot send a Gmail reply without a thread to reply to.')
  }

  const headers = latestMessage.payload?.headers ?? []
  const fromHeader = headers.find((header) => header.name.toLowerCase() === 'from')?.value
  const toHeader = headers.find((header) => header.name.toLowerCase() === 'to')?.value
  const subjectHeader = headers.find((header) => header.name.toLowerCase() === 'subject')?.value ?? 'New email'
  const messageIdHeader = headers.find((header) => header.name.toLowerCase() === 'message-id')?.value
  const referencesHeader = headers.find((header) => header.name.toLowerCase() === 'references')?.value

  const counterpart = pickReplyTarget(fromHeader, toHeader, session.accountEmail)
  const replySubject = subjectHeader.toLowerCase().startsWith('re:') ? subjectHeader : `Re: ${subjectHeader}`
  const rawMessage = [
    `To: ${counterpart}`,
    `Subject: ${replySubject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    messageIdHeader ? `In-Reply-To: ${messageIdHeader}` : undefined,
    messageIdHeader
      ? `References: ${referencesHeader ? `${referencesHeader} ${messageIdHeader}` : messageIdHeader}`
      : undefined,
    '',
    content,
  ]
    .filter(Boolean)
    .join('\r\n')

  await gmailApiRequest(
    providerId,
    '/messages/send',
    {
      method: 'POST',
      body: JSON.stringify({
        raw: toBase64Url(rawMessage),
        threadId: nativeThreadId,
      }),
    },
    session,
  )
}

async function buildAuthorizationRequest() {
  const state = createRandomString(48)
  const codeVerifier = createRandomString(96)
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const authUrl = new URL(GMAIL_AUTH_ENDPOINT)
  authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GMAIL_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GMAIL_SCOPES.join(' '))
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('include_granted_scopes', 'true')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  return {
    authUrl: authUrl.toString(),
    state,
    codeVerifier,
  }
}

async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const response = await fetch(GMAIL_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: GMAIL_REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'Failed to exchange the Gmail authorization code.'))
  }

  const payload = (await response.json()) as GmailTokenResponse
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
    scope: payload.scope?.split(' ').filter(Boolean) ?? GMAIL_SCOPES,
  }
}

async function refreshGmailSession(providerId: string): Promise<GmailSession> {
  const vault = await getAccountVault()
  const token = await vault.getToken(providerId)

  if (!token?.refreshToken) {
    throw new Error('Reconnect Gmail to refresh the expired session.')
  }

  const response = await fetch(GMAIL_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'Failed to refresh the Gmail session.'))
  }

  const payload = (await response.json()) as GmailTokenResponse
  const nextToken: AuthToken = {
    accessToken: payload.access_token,
    refreshToken: token.refreshToken,
    expiresAt: buildExpiryTimestamp(payload.expires_in),
    scope: payload.scope?.split(' ').filter(Boolean) ?? token.scope,
    accountLabel: token.accountLabel,
  }

  await vault.storeToken(providerId, nextToken)

  return {
    token: nextToken,
    accountEmail: nextToken.accountLabel ?? (await fetchGmailProfile(nextToken.accessToken)).emailAddress,
  }
}

async function getGmailSession(providerId: string): Promise<GmailSession> {
  assertGmailLiveReady()

  const vault = await getAccountVault()
  const token = await vault.getToken(providerId)
  if (!token) {
    throw new Error('Connect Gmail in Settings before syncing the live inbox.')
  }

  const nextToken = shouldRefreshToken(token) ? (await refreshGmailSession(providerId)).token : token
  const profileEmail = nextToken.accountLabel ?? (await fetchGmailProfile(nextToken.accessToken)).emailAddress

  if (profileEmail !== nextToken.accountLabel) {
    const tokenWithAccount = { ...nextToken, accountLabel: profileEmail }
    await vault.storeToken(providerId, tokenWithAccount)
    return {
      token: tokenWithAccount,
      accountEmail: profileEmail,
    }
  }

  return {
    token: nextToken,
    accountEmail: profileEmail,
  }
}

async function gmailApiRequest<T>(
  providerId: string,
  path: string,
  init?: RequestInit,
  session?: GmailSession,
): Promise<{ data: T; session: GmailSession }> {
  let currentSession = session ?? (await getGmailSession(providerId))
  let response = await sendAuthenticatedRequest(path, currentSession.token.accessToken, init)

  if (response.status === 401 && currentSession.token.refreshToken) {
    currentSession = await refreshGmailSession(providerId)
    response = await sendAuthenticatedRequest(path, currentSession.token.accessToken, init)
  }

  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'The Gmail request failed.'))
  }

  if (response.status === 204) {
    return {
      data: undefined as T,
      session: currentSession,
    }
  }

  return {
    data: (await response.json()) as T,
    session: currentSession,
  }
}

async function sendAuthenticatedRequest(path: string, accessToken: string, init?: RequestInit): Promise<Response> {
  return fetch(`${GMAIL_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

async function fetchGmailProfile(accessToken: string): Promise<GmailProfileResponse> {
  const response = await fetch(`${GMAIL_API_BASE_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(await readGoogleError(response, 'Failed to load the Gmail profile.'))
  }

  return (await response.json()) as GmailProfileResponse
}

function shouldRefreshToken(token: AuthToken): boolean {
  if (!token.expiresAt || !token.refreshToken) {
    return false
  }

  return Date.parse(token.expiresAt) - Date.now() < 60_000
}

function buildExpiryTimestamp(expiresInSeconds: number | undefined): string | undefined {
  if (!expiresInSeconds) {
    return undefined
  }

  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

function createRandomString(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'[byte % 66]).join('')
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  return toBase64Url(digest)
}

function toBase64Url(value: string | ArrayBuffer): string {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function assertGmailLiveReady() {
  if (!isTauriRuntime()) {
    throw new Error('Live Gmail sign-in requires the Tauri desktop shell so the app can receive the OAuth callback.')
  }

  if (!isGmailLiveConfigured()) {
    throw new Error('Set VITE_GMAIL_OAUTH_CLIENT_ID before connecting Gmail in live mode.')
  }
}

async function openSystemBrowser(url: string): Promise<void> {
  if (isTauriRuntime()) {
    await openUrl(url)
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function isGmailCallbackUrl(url: string): boolean {
  const candidate = new URL(url)
  const redirect = new URL(GMAIL_REDIRECT_URI)

  return candidate.protocol === redirect.protocol && candidate.pathname === redirect.pathname
}

function pickReplyTarget(fromHeader: string | undefined, toHeader: string | undefined, accountEmail: string): string {
  const fromEmail = extractEmailAddress(fromHeader)
  const toEmail = extractEmailAddress(toHeader)

  if (fromEmail && fromEmail.toLowerCase() !== accountEmail.toLowerCase()) {
    return fromEmail
  }

  if (toEmail) {
    return toEmail
  }

  throw new Error('Could not determine who to reply to in the Gmail thread.')
}

function extractEmailAddress(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0]
}

async function readGoogleError(response: Response, fallbackMessage: string): Promise<string> {
  const payload = (await response.text()).trim()
  if (!payload) {
    return fallbackMessage
  }

  try {
    const parsed = JSON.parse(payload) as { error?: { message?: string } }
    return parsed.error?.message || fallbackMessage
  } catch {
    return payload
  }
}
