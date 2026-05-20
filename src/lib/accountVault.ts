import { Stronghold } from '@tauri-apps/plugin-stronghold'
import type { AuthToken } from '../types/mimir'
import { isTauriRuntime } from './runtime'

const SNAPSHOT_PATH = 'mimir-vault.hold'
const CLIENT_NAME = 'mimir'
const PROVIDER_INDEX_KEY = '__provider_index__'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type VaultMode = 'browser-preview' | 'locked' | 'unlocked'

export interface AccountVaultState {
  mode: VaultMode
  connectedProviderIds: string[]
}

export interface AccountVault {
  getState(): Promise<AccountVaultState>
  unlock(passphrase: string): Promise<AccountVaultState>
  lock(): Promise<AccountVaultState>
  storeToken(providerId: string, token: AuthToken): Promise<void>
  removeToken(providerId: string): Promise<void>
}

class BrowserPreviewVault implements AccountVault {
  private readonly tokens = new Map<string, AuthToken>()

  async getState(): Promise<AccountVaultState> {
    return {
      mode: 'browser-preview',
      connectedProviderIds: [...this.tokens.keys()],
    }
  }

  async unlock(): Promise<AccountVaultState> {
    return this.getState()
  }

  async lock(): Promise<AccountVaultState> {
    return this.getState()
  }

  async storeToken(providerId: string, token: AuthToken): Promise<void> {
    this.tokens.set(providerId, token)
  }

  async removeToken(providerId: string): Promise<void> {
    this.tokens.delete(providerId)
  }
}

class StrongholdAccountVault implements AccountVault {
  private stronghold?: Stronghold
  private store?: Awaited<ReturnType<Awaited<ReturnType<typeof Stronghold.load>>['loadClient']>>['getStore'] extends () => infer T ? T : never

  async getState(): Promise<AccountVaultState> {
    if (!this.store) {
      return {
        mode: 'locked',
        connectedProviderIds: [],
      }
    }

    return {
      mode: 'unlocked',
      connectedProviderIds: await this.getProviderIndex(),
    }
  }

  async unlock(passphrase: string): Promise<AccountVaultState> {
    if (!passphrase.trim()) {
      throw new Error('Enter a passphrase to unlock secure account storage.')
    }

    this.stronghold = await Stronghold.load(SNAPSHOT_PATH, passphrase)

    const client = await this.loadOrCreateClient(this.stronghold)
    this.store = client.getStore()

    return this.getState()
  }

  async lock(): Promise<AccountVaultState> {
    if (this.stronghold) {
      await this.stronghold.unload()
    }

    this.stronghold = undefined
    this.store = undefined

    return {
      mode: 'locked',
      connectedProviderIds: [],
    }
  }

  async storeToken(providerId: string, token: AuthToken): Promise<void> {
    const store = this.requireStore()
    await store.insert(providerId, encodeValue(token))
    await this.setProviderIndex(providerId, 'add')
    await this.persist()
  }

  async removeToken(providerId: string): Promise<void> {
    const store = this.requireStore()
    await store.remove(providerId)
    await this.setProviderIndex(providerId, 'remove')
    await this.persist()
  }

  private async loadOrCreateClient(stronghold: Stronghold) {
    try {
      return await stronghold.loadClient(CLIENT_NAME)
    } catch {
      return stronghold.createClient(CLIENT_NAME)
    }
  }

  private requireStore() {
    if (!this.store) {
      throw new Error('Unlock the secure vault before connecting providers.')
    }

    return this.store
  }

  private async getProviderIndex(): Promise<string[]> {
    const store = this.requireStore()
    const value = await store.get(PROVIDER_INDEX_KEY)
    if (!value) return []

    const parsed = JSON.parse(decoder.decode(value)) as string[]
    return parsed.sort()
  }

  private async setProviderIndex(providerId: string, operation: 'add' | 'remove'): Promise<void> {
    const next = new Set(await this.getProviderIndex())
    if (operation === 'add') {
      next.add(providerId)
    } else {
      next.delete(providerId)
    }

    const store = this.requireStore()
    await store.insert(PROVIDER_INDEX_KEY, encodeValue([...next]))
  }

  private async persist(): Promise<void> {
    if (this.stronghold) {
      await this.stronghold.save()
    }
  }
}

function encodeValue(value: unknown): number[] {
  return Array.from(encoder.encode(JSON.stringify(value)))
}

let vaultPromise: Promise<AccountVault> | undefined

export async function getAccountVault(): Promise<AccountVault> {
  if (!vaultPromise) {
    vaultPromise = Promise.resolve(isTauriRuntime() ? new StrongholdAccountVault() : new BrowserPreviewVault())
  }

  return vaultPromise
}
