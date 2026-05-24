import { useMemo, useState, type CSSProperties } from 'react'
import type { VaultMode } from '../lib/accountVault'
import type { ProviderPluginDefinition } from '../providers/provider-plugin'
import type { IMimirProvider } from '../types/mimir'

interface AccountCenterProps {
  providers: IMimirProvider[]
  connectedProviderIds: string[]
  unreadByProvider: Record<string, number>
  vaultMode: VaultMode
  onUnlock: (passphrase: string) => void
  onLock: () => void
  onConnect: (provider: IMimirProvider) => void
  onDisconnect: (providerId: string) => void
  isUnlocking: boolean
  isLocking: boolean
  busyProviderId?: string
  lastCallback?: string
  callbackError?: string
  pluginsByProviderId?: Record<string, ProviderPluginDefinition>
}

function titleForVault(mode: VaultMode): string {
  if (mode === 'browser-preview') return 'Preview mode'
  if (mode === 'unlocked') return 'Secure vault unlocked'
  return 'Secure vault locked'
}

export function AccountCenter({
  providers,
  connectedProviderIds,
  unreadByProvider,
  vaultMode,
  onUnlock,
  onLock,
  onConnect,
  onDisconnect,
  isUnlocking,
  isLocking,
  busyProviderId,
  lastCallback,
  callbackError,
  pluginsByProviderId,
}: AccountCenterProps) {
  const [passphrase, setPassphrase] = useState('')
  const connected = useMemo(() => new Set(connectedProviderIds), [connectedProviderIds])
  const canManageAccounts = vaultMode === 'browser-preview' || vaultMode === 'unlocked'

  return (
    <section className="panel account-center">
      <div className="panel-toolbar">
        <h2>Integrations</h2>
        <span className={`status-pill${vaultMode === 'unlocked' ? ' ok' : ' browser'}`}>
          {titleForVault(vaultMode)}
        </span>
      </div>

      <div className="account-vault">
        <p className="panel-label">Secure storage</p>
        {vaultMode === 'locked' ? (
          <>
            <p className="subtitle">
              Unlock the Tauri Stronghold vault to persist provider tokens securely. Browser preview keeps tokens in memory only.
            </p>
            <div className="vault-actions">
              <input
                className="vault-input"
                type="password"
                value={passphrase}
                placeholder="Enter a local vault passphrase"
                onChange={(event) => setPassphrase(event.target.value)}
              />
              <button
                type="button"
                className="primary-button"
                disabled={isUnlocking || passphrase.trim().length === 0}
                onClick={() => onUnlock(passphrase)}
              >
                {isUnlocking ? 'Unlocking…' : 'Unlock vault'}
              </button>
            </div>
          </>
        ) : (
          <div className="vault-actions">
            <p className="subtitle">
              {vaultMode === 'browser-preview'
                ? 'Preview mode auto-connects the demo provider and keeps any credentials ephemeral.'
                : 'Provider tokens are now persisted in Stronghold and can survive app restarts.'}
            </p>
            {vaultMode === 'unlocked' ? (
              <button type="button" className="secondary-button" disabled={isLocking} onClick={onLock}>
                {isLocking ? 'Locking…' : 'Lock vault'}
              </button>
            ) : null}
          </div>
        )}

        {lastCallback ? (
          <p className="account-helper">
            Last OAuth callback: <code>{lastCallback}</code>
          </p>
        ) : null}
        {callbackError ? <p className="error-copy">{callbackError}</p> : null}
      </div>

      <div className="account-list">
        {providers.map((provider) => {
          const isConnected = connected.has(provider.id)
          const capabilities = provider.metadata.capabilities.join(' · ')
          const plugin = pluginsByProviderId?.[provider.id]

          return (
            <article
              key={provider.id}
              className="account-card"
              style={{ '--provider-accent': provider.metadata.accent } as CSSProperties}
            >
              <header className="account-card-header">
                <div>
                  <h3>
                    <span className="provider-icon">{provider.metadata.icon}</span> {provider.metadata.displayName}
                  </h3>
                  <p>{provider.metadata.summary}</p>
                </div>
                <span className={`status-pill${isConnected ? ' ok' : ' pending'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </header>

              <p className="account-helper">{capabilities}</p>
              {plugin?.renderSettingsPanel ? (
                <div className="account-plugin-panel">
                  {plugin.renderSettingsPanel({
                    provider,
                    isConnected,
                    unreadCount: unreadByProvider[provider.id] ?? 0,
                    isBusy: busyProviderId === provider.id,
                    canManageAccounts,
                    onConnect: () => onConnect(provider),
                    onDisconnect: () => onDisconnect(provider.id),
                  })}
                </div>
              ) : null}
              <div className="account-card-footer">
                <span className="stream-item-meta">{unreadByProvider[provider.id] ?? 0} unread</span>
                <button
                  type="button"
                  className={isConnected ? 'secondary-button' : 'primary-button'}
                  disabled={!canManageAccounts || busyProviderId === provider.id}
                  onClick={() =>
                    isConnected ? onDisconnect(provider.id) : onConnect(provider)
                  }
                >
                  {busyProviderId === provider.id
                    ? isConnected
                      ? 'Disconnecting…'
                      : 'Connecting…'
                    : isConnected
                      ? 'Disconnect'
                      : 'Connect'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
