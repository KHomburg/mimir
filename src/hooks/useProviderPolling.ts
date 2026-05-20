import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useQueryClient } from '@tanstack/react-query'
import { getMessageRepository } from '../lib/messageRepository'
import { isTauriRuntime } from '../lib/runtime'
import type { IMimirProvider } from '../types/mimir'

const POLL_INTERVAL_MS = 10_000
const POLL_EVENT = 'mimir://poll-tick'

export function useProviderPolling(providers: IMimirProvider[]): void {
  const queryClient = useQueryClient()
  const providerKey = providers.map((provider) => provider.id).join('|')

  useEffect(() => {
    if (!providers.length) return

    let cancelled = false
    let timerId: number | undefined
    let unlisten: (() => void) | undefined

    const hydrateProviders = async () => {
      const repo = await getMessageRepository()
      const next = (
        await Promise.all(providers.map((p) => p.getNotifications()))
      ).flat()
      if (next.length > 0) {
        await repo.upsertNotifications(next)
        await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    }

    const poll = async () => {
      await hydrateProviders()
      if (!cancelled) timerId = window.setTimeout(poll, POLL_INTERVAL_MS)
    }

    if (isTauriRuntime()) {
      void hydrateProviders()
      void listen<string>(POLL_EVENT, () => {
        if (!cancelled) {
          void hydrateProviders()
        }
      }).then((detach) => {
        unlisten = detach
      })
    } else {
      void poll()
    }

    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
      unlisten?.()
    }
  }, [providerKey, providers, queryClient])
}
