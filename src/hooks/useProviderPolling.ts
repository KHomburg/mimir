import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getMessageRepository } from '../lib/messageRepository'
import type { IMimirProvider } from '../types/mimir'

const POLL_INTERVAL_MS = 10_000

export function useProviderPolling(providers: IMimirProvider[]): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false
    let timerId: number | undefined

    const poll = async () => {
      const repo = await getMessageRepository()
      const next = (
        await Promise.all(providers.map((p) => p.getNotifications()))
      ).flat()
      if (next.length > 0) {
        await repo.upsertNotifications(next)
        await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
      if (!cancelled) timerId = window.setTimeout(poll, POLL_INTERVAL_MS)
    }

    void poll()
    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
    }
  }, [providers, queryClient])
}
