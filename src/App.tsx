import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './App.css'
import { AccountCenter } from './components/AccountCenter'
import { ConversationPanel } from './components/ConversationPanel'
import { QuickReply } from './components/QuickReply'
import { RustStatusCard } from './components/RustStatusCard'
import { Sidebar } from './components/Sidebar'
import { StreamList } from './components/StreamList'
import { useAccountConnections } from './hooks/useAccountConnections'
import { useNotifications } from './hooks/useNotifications'
import { useOAuthCallbacks } from './hooks/useOAuthCallbacks'
import { useProviderPolling } from './hooks/useProviderPolling'
import { getRustHealth } from './lib/bridge'
import { getMessageRepository } from './lib/messageRepository'
import { getProviderById, registeredProviders } from './providers/provider-registry'
import { useUiStore } from './store/uiStore'

function App() {
  const queryClient = useQueryClient()
  const activeView = useUiStore((s) => s.activeView)
  const selectedThreadId = useUiStore((s) => s.selectedThreadId)
  const setActiveView = useUiStore((s) => s.setActiveView)
  const setSelectedThreadId = useUiStore((s) => s.setSelectedThreadId)
  const draft = useUiStore((s) => s.quickReplyDraft)
  const setDraft = useUiStore((s) => s.setQuickReplyDraft)
  const clearDraft = useUiStore((s) => s.clearQuickReplyDraft)
  const activeProvider = activeView === 'aggregated' ? undefined : getProviderById(activeView)
  const {
    stateQuery: accountStateQuery,
    unlockVault,
    lockVault,
    connectProvider,
    disconnectProvider,
  } = useAccountConnections(registeredProviders)
  const { lastCallback, callbackError } = useOAuthCallbacks()
  const accountState = accountStateQuery.data ?? { mode: 'browser-preview' as const, connectedProviderIds: [] }
  const connectedProviderIds = accountState.connectedProviderIds
  const connectedProviderIdSet = useMemo(
    () => new Set(accountState.connectedProviderIds),
    [accountState.connectedProviderIds],
  )
  const connectedProviders = useMemo(
    () => registeredProviders.filter((provider) => connectedProviderIdSet.has(provider.id)),
    [connectedProviderIdSet],
  )
  const allNotificationsQuery = useNotifications()
  const providerNotificationsQuery = useNotifications(activeProvider?.id)
  const scopedNotifications = useMemo(
    () =>
      activeView === 'aggregated'
        ? allNotificationsQuery.data ?? []
        : providerNotificationsQuery.data ?? [],
    [activeView, allNotificationsQuery.data, providerNotificationsQuery.data],
  )
  const activeProviderConnected = activeProvider ? connectedProviderIdSet.has(activeProvider.id) : false

  useProviderPolling(connectedProviders)
  const rustHealthQuery = useQuery({
    queryKey: ['rust-health'],
    queryFn: getRustHealth,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!scopedNotifications.length) {
      if (selectedThreadId) setSelectedThreadId(undefined)
      return
    }

    const threadExists = selectedThreadId
      ? scopedNotifications.some((notification) => notification.threadId === selectedThreadId)
      : false

    if (!threadExists) {
      setSelectedThreadId(scopedNotifications[0]?.threadId)
    }
  }, [scopedNotifications, selectedThreadId, setSelectedThreadId])

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeProvider || !activeProviderConnected) {
        throw new Error('Connect an account before sending a reply.')
      }

      if (!selectedThreadId) {
        throw new Error('Choose a thread before sending a reply.')
      }

      const threadNotifications = scopedNotifications.filter(
        (notification) => notification.threadId === selectedThreadId,
      )
      const result = await activeProvider.sendMessage(selectedThreadId, content)
      if (!result.accepted) {
        throw new Error(`Provider ${activeProvider.id} rejected the message.`)
      }

      const repo = await getMessageRepository()
      await activeProvider.markAsRead(threadNotifications.map((notification) => notification.id))
      await repo.markAsRead(threadNotifications.map((notification) => notification.id))
      if (result.notification) {
        await repo.upsertNotifications([result.notification])
      }
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      clearDraft()
    },
  })

  const markVisibleReadMutation = useMutation({
    mutationFn: async () => {
      const notifications = scopedNotifications
      if (!notifications.length) return

      const notificationsByProvider = notifications.reduce<Record<string, string[]>>((acc, notification) => {
        acc[notification.providerId] ??= []
        acc[notification.providerId].push(notification.id)
        return acc
      }, {})

      await Promise.all(
        Object.entries(notificationsByProvider).map(async ([providerId, ids]) => {
          const provider = getProviderById(providerId)
          if (provider && connectedProviderIdSet.has(providerId)) {
            await provider.markAsRead(ids)
          }
        }),
      )

      const repo = await getMessageRepository()
      await repo.markAsRead(notifications.map((n) => n.id))
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const stats = useMemo(() => {
    return {
      total: scopedNotifications.length,
      unread: scopedNotifications.filter((notification) => !notification.read).length,
      connectedAccounts: connectedProviderIds.length,
    }
  }, [connectedProviderIds.length, scopedNotifications])

  const selectedThreadCount = useMemo(() => {
    if (!selectedThreadId) return 0
    return scopedNotifications.filter((notification) => notification.threadId === selectedThreadId).length
  }, [scopedNotifications, selectedThreadId])

  const unreadByProvider = useMemo(() => {
    return (allNotificationsQuery.data ?? []).reduce<Record<string, number>>((acc, notification) => {
      if (!notification.read) {
        acc[notification.providerId] = (acc[notification.providerId] ?? 0) + 1
      }
      return acc
    }, {})
  }, [allNotificationsQuery.data])

  const totalUnread = useMemo(
    () => Object.values(unreadByProvider).reduce((sum, count) => sum + count, 0),
    [unreadByProvider],
  )

  const selectedThreadLabel = useMemo(() => {
    if (!selectedThreadId) return undefined
    return scopedNotifications.find((notification) => notification.threadId === selectedThreadId)?.personLabel
  }, [scopedNotifications, selectedThreadId])

  const accentByProvider = useMemo(
    () =>
      registeredProviders.reduce<Record<string, string>>((acc, provider) => {
        acc[provider.id] = provider.metadata.accent
        return acc
      }, {}),
    [],
  )

  const activeAccent = activeProvider?.metadata.accent ?? '#000000'
  const workspaceTitle = activeProvider?.metadata.displayName ?? 'All Messages'

  const headerCopy = activeProvider
    ? activeProviderConnected
      ? `${activeProvider.metadata.summary} Cached messages render instantly from the local repository before sync catches up.`
      : `This account is disconnected. Connect it to resume sync, quick reply, and read-status propagation.`
    : 'Unified chronological stream across every connected account. Person and thread identities group related conversations across providers.'

  const surfaceMessage =
    activeView === 'aggregated'
      ? 'No cached notifications yet. Connect a demo provider or wait for the next sync tick.'
      : activeProviderConnected
        ? 'This account is connected but has no cached messages yet.'
        : 'Connect this account to begin syncing its feed into the local-first repository.'

  const activeError =
    sendMessageMutation.error ??
    markVisibleReadMutation.error ??
    connectProvider.error ??
    disconnectProvider.error ??
    unlockVault.error ??
    lockVault.error

  const detailCopy = selectedThreadLabel
    ? `${selectedThreadCount} messages are currently grouped into this conversation.`
    : surfaceMessage

  return (
    <div className="shell">
      <Sidebar
        providers={registeredProviders}
        activeView={activeView}
        totalUnread={totalUnread}
        unreadByProvider={unreadByProvider}
        connectedProviderIds={connectedProviderIds}
        onSelect={setActiveView}
      />

      <main className="shell-main">
        <header className="shell-topbar">
          <label className="shell-search">
            <span className="shell-search-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="8.5" cy="8.5" r="4.75" />
                <path d="M12 12 16 16" strokeLinecap="round" />
              </svg>
            </span>
            <input type="search" placeholder="Search across platforms..." aria-label="Search across platforms" />
          </label>

          <div className="topbar-tabs" aria-label="Current stream summary">
            <span className="topbar-tab is-active">Unread {stats.unread}</span>
            <span className="topbar-tab">Connected {stats.connectedAccounts}</span>
            <span className="topbar-tab">{selectedThreadCount > 0 ? `${selectedThreadCount} in thread` : 'All threads'}</span>
          </div>

          <div className="topbar-actions">
            <span className="status-pill ok" style={{ borderColor: activeAccent }}>
              {activeView === 'aggregated' ? 'Unified view' : activeProviderConnected ? 'Live account' : 'Disconnected'}
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => markVisibleReadMutation.mutate()}
              disabled={markVisibleReadMutation.isPending || stats.total === 0}
            >
              Mark visible read
            </button>
          </div>
        </header>

        {activeError ? (
          <section className="panel error-banner">
            <p className="panel-label">Attention</p>
            <p>{activeError.message}</p>
          </section>
        ) : null}

        <section className="workspace-shell">
          <section className="list-column">
            <section className="column-intro">
              <p className="panel-label">Mimir stream</p>
              <div className="column-intro-row">
                <div>
                  <h1>{workspaceTitle}</h1>
                  <p className="subtitle">{headerCopy}</p>
                </div>

                <div className="summary-stats">
                  <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
                  <div className="stat-card"><span>Unread</span><strong>{stats.unread}</strong></div>
                  <div className="stat-card"><span>Connected</span><strong>{stats.connectedAccounts}</strong></div>
                </div>
              </div>
            </section>

            <section className="panel panel-stream">
              <StreamList
                view={activeView}
                notifications={scopedNotifications}
                isLoading={allNotificationsQuery.isLoading || providerNotificationsQuery.isLoading}
                selectedThreadId={selectedThreadId}
                onSelectThread={setSelectedThreadId}
                emptyStateMessage={surfaceMessage}
                accentByProvider={accentByProvider}
              />
            </section>
          </section>

          <section className="detail-column">
            <section className="panel detail-overview">
              <div className="detail-overview-row">
                <div>
                  <p className="panel-label">Focus</p>
                  <h2>{selectedThreadLabel ?? workspaceTitle}</h2>
                  <p className="subtitle">{detailCopy}</p>
                </div>
                <span className={`status-pill${activeView === 'aggregated' || activeProviderConnected ? ' ok' : ' pending'}`}>
                  {activeView === 'aggregated' ? 'Unified' : activeProviderConnected ? 'Connected' : 'Idle'}
                </span>
              </div>
            </section>

            <ConversationPanel
              view={activeView}
              notifications={scopedNotifications}
              selectedThreadId={selectedThreadId}
              accentByProvider={accentByProvider}
            />

            <QuickReply
              provider={activeProviderConnected ? activeProvider : undefined}
              selectedThreadId={selectedThreadId}
              selectedThreadLabel={selectedThreadLabel}
              value={draft}
              onChange={setDraft}
              onSend={() => sendMessageMutation.mutate(draft)}
              isSending={sendMessageMutation.isPending}
            />

            <div className="detail-support-grid">
              <RustStatusCard
                status={rustHealthQuery.data?.status ?? 'pending'}
                message={rustHealthQuery.data?.message ?? 'Checking bridge availability...'}
              />

              <AccountCenter
                providers={registeredProviders}
                connectedProviderIds={connectedProviderIds}
                unreadByProvider={unreadByProvider}
                vaultMode={accountState.mode}
                onUnlock={(passphrase) => unlockVault.mutate(passphrase)}
                onLock={() => lockVault.mutate()}
                onConnect={(provider) => connectProvider.mutate(provider)}
                onDisconnect={(providerId) => disconnectProvider.mutate(providerId)}
                isUnlocking={unlockVault.isPending}
                isLocking={lockVault.isPending}
                busyProviderId={
                  connectProvider.isPending
                    ? connectProvider.variables?.id
                    : disconnectProvider.isPending
                      ? disconnectProvider.variables
                      : undefined
                }
                lastCallback={lastCallback}
                callbackError={callbackError}
              />
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default App
