import { useEffect } from 'react'
import type { VaultMode } from '../lib/accountVault'
import type { ProviderPluginDefinition } from '../providers/provider-plugin'
import type { IMimirProvider } from '../types/mimir'
import { AccountCenter } from './AccountCenter'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
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

export function SettingsModal({
  isOpen,
  onClose,
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
}: SettingsModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <>
      <button type="button" className="settings-modal-backdrop" aria-label="Close settings" onClick={onClose} />
      <div className="settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="settings-modal-card">
          <header className="settings-modal-header">
            <div>
              <p className="panel-label">Settings</p>
              <h2>Accounts and integrations</h2>
              <p className="subtitle">Connect providers here without cluttering the main stream.</p>
            </div>
            <button type="button" className="secondary-button" onClick={onClose}>
              Close
            </button>
          </header>

          <div className="settings-modal-body">
            <AccountCenter
              providers={providers}
              connectedProviderIds={connectedProviderIds}
              unreadByProvider={unreadByProvider}
              vaultMode={vaultMode}
              onUnlock={onUnlock}
              onLock={onLock}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              isUnlocking={isUnlocking}
              isLocking={isLocking}
              busyProviderId={busyProviderId}
              lastCallback={lastCallback}
              callbackError={callbackError}
              pluginsByProviderId={pluginsByProviderId}
            />
          </div>
        </div>
      </div>
    </>
  )
}
