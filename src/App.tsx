import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import './App.css'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { StreamList } from './components/StreamList'
import { ThreadDrawer } from './components/ThreadDrawer'
import { useAccountConnections } from './hooks/useAccountConnections'
import { useNotifications } from './hooks/useNotifications'
import { useOAuthCallbacks } from './hooks/useOAuthCallbacks'
import { useProviderPolling } from './hooks/useProviderPolling'
import { getMessageRepository } from './lib/messageRepository'
import { registeredProviderPlugins, registeredProviders } from './providers/provider-registry'
import { useUiStore } from './store/uiStore'
import type { MimirNotification } from './types/mimir'

const EMPTY_IDS: string[] = []
const EMPTY_NOTIFICATIONS: MimirNotification[] = []

function buildErrorMessage(errors: unknown[]) {
  const first = errors.find(Boolean)
  if (!first) {
    return undefined
  }

  return first instanceof Error ? first.message : 'Something went wrong while loading the stream.'
}

export default function App() {
  const queryClient = useQueryClient()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const activeView = useUiStore((state) => state.activeView)
  const selectedThreadId = useUiStore((state) => state.selectedThreadId)
  const quickReplyDraft = useUiStore((state) => state.quickReplyDraft)
  const setActiveView = useUiStore((state) => state.setActiveView)
  const setSelectedThreadId = useUiStore((state) => state.setSelectedThreadId)
  const setQuickReplyDraft = useUiStore((state) => state.setQuickReplyDraft)
  const clearQuickReplyDraft = useUiStore((state) => state.clearQuickReplyDraft)

  const pluginsByProviderId = useMemo(
    () =>
      Object.fromEntries(
        registeredProviderPlugins.map((plugin) => [plugin.provider.id, plugin]),
      ),
    [],
  )
  const providersById = useMemo(
    () =>
      Object.fromEntries(registeredProviders.map((provider) => [provider.id, provider])),
    [],
  )

  const activeProvider = activeView === 'aggregated' ? undefined : providersById[activeView]
  const activePlugin = activeProvider ? pluginsByProviderId[activeProvider.id] : undefined

  const { stateQuery, unlockVault, lockVault, connectProvider, disconnectProvider } =
    useAccountConnections(registeredProviders)
  const { lastCallback, callbackError } = useOAuthCallbacks()
  const allNotificationsQuery = useNotifications()
  const streamNotificationsQuery = useNotifications(activeProvider?.id)

  const connectedProviderIds = stateQuery.data?.connectedProviderIds ?? EMPTY_IDS
  const connectedProviders = useMemo(
    () => registeredProviders.filter((provider) => connectedProviderIds.includes(provider.id)),
    [connectedProviderIds],
  )
  useProviderPolling(connectedProviders)

  const allNotifications = allNotificationsQuery.data ?? EMPTY_NOTIFICATIONS
  const streamNotifications = streamNotificationsQuery.data ?? EMPTY_NOTIFICATIONS

  const unreadByProvider = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const notification of allNotifications) {
      if (!notification.read) {
        counts[notification.providerId] = (counts[notification.providerId] ?? 0) + 1
      }
    }

    return counts
  }, [allNotifications])

  const totalUnread = useMemo(
    () => Object.values(unreadByProvider).reduce((sum, value) => sum + value, 0),
    [unreadByProvider],
  )

  const selectedThread = useMemo(() => {
    if (!selectedThreadId) {
      return []
    }

    if (activeView === 'aggregated') {
      return allNotifications.filter(
        (notification) => (notification.personId ?? notification.threadId) === selectedThreadId,
      )
    }

    return allNotifications.filter(
      (notification) =>
        notification.providerId === activeView && notification.threadId === selectedThreadId,
    )
  }, [activeView, allNotifications, selectedThreadId])

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!activeProvider || !selectedThreadId) {
        throw new Error('Open a provider thread before sending a reply.')
      }

      return activeProvider.sendMessage(selectedThreadId, quickReplyDraft.trim())
    },
    onSuccess: async (result) => {
      if (result.notification) {
        const repository = await getMessageRepository()
        await repository.upsertNotifications([result.notification])
        await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }

      clearQuickReplyDraft()
    },
  })

  const busyProviderId =
    (connectProvider.isPending ? connectProvider.variables?.id : undefined) ??
    (disconnectProvider.isPending ? disconnectProvider.variables : undefined)

  const viewTitle = activeProvider ? activeProvider.metadata.displayName : 'Mimir Stream'
  const viewSubtitle = activeProvider
    ? `A focused stream for ${activeProvider.metadata.displayName}. Open an item to slide in the full message.`
    : 'A unified stream across connected providers. Open any conversation to inspect the full thread.'
  const emptyStateMessage = activeProvider
    ? connectedProviderIds.includes(activeProvider.id)
      ? `No messages yet for ${activeProvider.metadata.displayName}.`
      : `Connect ${activeProvider.metadata.displayName} in settings to start filling this stream.`
    : 'Connect an integration in settings to start building your stream.'

  const errorMessage = buildErrorMessage([
    allNotificationsQuery.error,
    streamNotificationsQuery.error,
    stateQuery.error,
    unlockVault.error,
    lockVault.error,
    connectProvider.error,
    disconnectProvider.error,
    sendReply.error,
  ])

  return (
    <div className="shell">
      <Sidebar
        providers={registeredProviders}
        activeView={activeView}
        totalUnread={totalUnread}
        unreadByProvider={unreadByProvider}
        onSelect={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="shell-main">
        <section className="stream-shell">
          <header className="stream-shell-header">
            <div className="stream-shell-copy">
              <p className="panel-label">{activeProvider ? 'Provider stream' : 'Aggregated stream'}</p>
              <h1>{viewTitle}</h1>
              <p className="subtitle">{viewSubtitle}</p>
            </div>
          </header>

          {errorMessage ? (
            <section className="panel error-banner">
              <p className="panel-label">Stream status</p>
              <p>{errorMessage}</p>
            </section>
          ) : null}

          <section className="panel panel-stream">
            <StreamList
              view={activeView}
              notifications={activeProvider ? streamNotifications : allNotifications}
              isLoading={allNotificationsQuery.isLoading || streamNotificationsQuery.isLoading}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
              emptyStateMessage={emptyStateMessage}
              accentByProvider={Object.fromEntries(
                registeredProviders.map((provider) => [provider.id, provider.metadata.accent]),
              )}
              pluginsByProviderId={pluginsByProviderId}
            />
          </section>
        </section>
      </main>

      <ThreadDrawer
        isOpen={selectedThread.length > 0}
        onClose={() => setSelectedThreadId(undefined)}
        thread={selectedThread}
        provider={activeProvider}
        plugin={activePlugin}
        providerConnected={activeProvider ? connectedProviderIds.includes(activeProvider.id) : false}
        allowComposer={Boolean(activeProvider?.metadata.capabilities.includes('quick-reply'))}
        draft={quickReplyDraft}
        onDraftChange={setQuickReplyDraft}
        onSend={() => sendReply.mutate()}
        isSending={sendReply.isPending}
        accentByProvider={Object.fromEntries(
          registeredProviders.map((provider) => [provider.id, provider.metadata.accent]),
        )}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        providers={registeredProviders}
        connectedProviderIds={connectedProviderIds}
        unreadByProvider={unreadByProvider}
        vaultMode={stateQuery.data?.mode ?? 'browser-preview'}
        onUnlock={(passphrase) => unlockVault.mutate(passphrase)}
        onLock={() => lockVault.mutate()}
        onConnect={(provider) => connectProvider.mutate(provider)}
        onDisconnect={(providerId) => disconnectProvider.mutate(providerId)}
        isUnlocking={unlockVault.isPending}
        isLocking={lockVault.isPending}
        busyProviderId={busyProviderId}
        lastCallback={lastCallback}
        callbackError={callbackError}
        pluginsByProviderId={pluginsByProviderId}
      />
    </div>
  )
}
