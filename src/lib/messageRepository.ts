import Database from '@tauri-apps/plugin-sql'
import type { MimirNotification } from '../types/mimir'
import { sortNotificationsByTimestamp } from './aggregator'
import { isTauriRuntime } from './runtime'

const DATABASE_URL = 'sqlite:mimir.db'

const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    preview TEXT,
    timestamp TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    person_id TEXT,
    person_label TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  )
`

interface MessageRow {
  id: string
  provider_id: string
  platform: MimirNotification['platform']
  title: string
  body: string
  preview: string | null
  timestamp: string
  thread_id: string
  person_id: string | null
  person_label: string
  read: number
}

type SqlDatabase = Awaited<ReturnType<typeof Database.load>>

export interface MessageRepository {
  init(): Promise<void>
  upsertNotifications(notifications: MimirNotification[]): Promise<void>
  listNotifications(providerId?: string): Promise<MimirNotification[]>
  markAsRead(ids: string[]): Promise<void>
}

class InMemoryMessageRepository implements MessageRepository {
  private readonly messages = new Map<string, MimirNotification>()

  async init() {}

  async upsertNotifications(notifications: MimirNotification[]) {
    notifications.forEach((n) => this.messages.set(n.id, n))
  }

  async listNotifications(providerId?: string): Promise<MimirNotification[]> {
    const values = [...this.messages.values()]
    const filtered = providerId ? values.filter((n) => n.providerId === providerId) : values
    return sortNotificationsByTimestamp(filtered)
  }

  async markAsRead(ids: string[]) {
    ids.forEach((id) => {
      const n = this.messages.get(id)
      if (n) this.messages.set(id, { ...n, read: true })
    })
  }
}

class SqlMessageRepository implements MessageRepository {
  private dbPromise?: Promise<SqlDatabase>

  async init() {
    const db = await this.getDb()
    await db.execute(INIT_SQL)
  }

  async upsertNotifications(notifications: MimirNotification[]) {
    const db = await this.getDb()
    for (const n of notifications) {
      await db.execute(
        `INSERT OR REPLACE INTO messages
           (id,provider_id,platform,title,body,preview,timestamp,thread_id,person_id,person_label,read)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [n.id,n.providerId,n.platform,n.title,n.body,n.preview??null,n.timestamp,n.threadId,n.personId??null,n.personLabel,n.read?1:0],
      )
    }
  }

  async listNotifications(providerId?: string): Promise<MimirNotification[]> {
    const db = await this.getDb()
    const rows = providerId
      ? await db.select<MessageRow[]>('SELECT * FROM messages WHERE provider_id=$1 ORDER BY timestamp DESC',[providerId])
      : await db.select<MessageRow[]>('SELECT * FROM messages ORDER BY timestamp DESC')
    return rows.map(mapRow)
  }

  async markAsRead(ids: string[]) {
    if (!ids.length) return
    const db = await this.getDb()
    for (const id of ids) {
      await db.execute('UPDATE messages SET read=1 WHERE id=$1', [id])
    }
  }

  private async getDb(): Promise<SqlDatabase> {
    if (!this.dbPromise) this.dbPromise = Database.load(DATABASE_URL)
    return this.dbPromise
  }
}

function mapRow(r: MessageRow): MimirNotification {
  return {
    id: r.id,
    providerId: r.provider_id,
    platform: r.platform,
    title: r.title,
    body: r.body,
    preview: r.preview ?? undefined,
    timestamp: r.timestamp,
    threadId: r.thread_id,
    personId: r.person_id ?? undefined,
    personLabel: r.person_label,
    read: r.read === 1,
  }
}

let repositoryPromise: Promise<MessageRepository> | undefined

export async function getMessageRepository(): Promise<MessageRepository> {
  if (!repositoryPromise) repositoryPromise = createRepository()
  return repositoryPromise
}

async function createRepository(): Promise<MessageRepository> {
  const repo = isTauriRuntime() ? new SqlMessageRepository() : new InMemoryMessageRepository()
  await repo.init()
  return repo
}
