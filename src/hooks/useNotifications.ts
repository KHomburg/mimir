import { useQuery } from '@tanstack/react-query'
import { getMessageRepository } from '../lib/messageRepository'

export function useNotifications(providerId?: string) {
  return useQuery({
    queryKey: ['notifications', providerId ?? 'aggregated'],
    queryFn: async () => {
      const repo = await getMessageRepository()
      return repo.listNotifications(providerId)
    },
  })
}
