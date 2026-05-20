import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './App.css'
import { QuickReply } from './components/QuickReply'
import { RustStatusCard } from './components/RustStatusCard'
import { Sidebar } from './components/Sidebar'
import { StreamList } from './components/StreamList'
import { useNotifications } from './hooks/useNotifications'
import { useProviderPolling } from './hooks/useProviderPolling'
import { getRustHealth } from './lib/bridge'
import { getMessageRepository } from './lib/messageRepository'
import { getProviderById, registeredProviders } from './providers/provider-registry'
import { useUiStore } from './store/uiStore'

function App() {
  const queryClient = useQueryClient()
  const activeView = useUiStore((s) => s.activeView)
  const setActiveView = useUiStore((s) => s.setActiveView)
  const draft = useUiStore((s) => s.quickReplyDraft)
  const setDraft = useUiStore((s) => s.setQuickReplyDraft)
  const clearDraft = useUiStore((s) => s.clearQuickReplyDraft)
  const activeProvider = activeView === 'aggregated' ? undefined : getProviderById(activeView)

  useProviderPolling(registeredProviders)

  const notificationsQuery = useNotifications(activeProvider?.id)
  const rustHealthQuery = useQuery({
    queryKey: ['rust-health'],
    queryFn: getRustHealth,
    staleTime: 60_000,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeProvider) throw new Error('Select an account before sending.')
      const notifications = notificationsQuery.data ?? []
      const threadId = notifications[0]?.threadId ?? `${activeProvider.id}-thread`
      const ok = await activeProvider.sendMessage(threadId, content)
      if (!ok) throw new Error(`Provider ${activeProvider.id} rejected the message.`)
      const repo = await getMessageRepository()
      await repo.markAsRead(
        notifications.filter((n) => n.threadId === threadId).map((n) => n.id),
      )
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      clearDraft()
    },
  })

  const markVisibleReadMutation = useMutation({
    mutationFn: async () => {
      const notifications = notificationsQuery.data ?? []
      if (!notifications.length) return
      const repo = await getMessageRepository()
      await repo.markAsRead(notifications.map((n) => n.id))
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const stats = useMemo(() => {
    const notifications = notificationsQuery.data ?? []
    return { total: notifications.length, unread: notifications.filter((n) => !n.read).length }
  }, [notificationsQuery.data])

  return (
    <div className="shell">
      <Sidebar providers={registeredProviders} activeView={activeView} onSelect={setActiveView} />

      <main className="shell-main">
        <header className="shell-header">
          <div>
            <p className="eyebrow">mimir stream</p>
            <h1>{activeProvider?.metadata.displayName ?? 'Aggregated Stream'}</h1>
            <p className="subtitle">
              Instant-read UI backed by the local repository. Provider polling hydrates the store every 10 seconds.
            </p>
          </div>
          <div className="header-actions">
            <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="stat-card"><span>Unread</span><strong>{stats.unread}</strong></div>
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

        <section className="dashboard-grid">
          <section className="panel panel-stream">
            <StreamList
              view={activeView}
              notifications={notificationsQuery.data ?? []}
              isLoading={notificationsQuery.isLoading}
            />
          </section>

          <aside className="side-column">
            <RustStatusCard
              status={rustHealthQuery.data?.status ?? 'pending'}
              message={rustHealthQuery.data?.message ?? 'Checking bridge availability…'}
            />
            <section className="panel panel-notes">
              <p className="panel-label">Architecture</p>
              <ul className="bullet-list">
                <li>Adapters self-register from <code>src/providers/*Provider.ts</code>.</li>
                <li>UI reads from the repository layer, not provider responses directly.</li>
                <li>Rust owns secure tokens, deep links, and privileged networking.</li>
              </ul>
            </section>
            <QuickReply
              provider={activeProvider}
              value={draft}
              onChange={setDraft}
              onSend={() => sendMessageMutation.mutate(draft)}
              isSending={sendMessageMutation.isPending}
            />
          </aside>
        </section>
      </main>
    </div>
  )
}

export default App
