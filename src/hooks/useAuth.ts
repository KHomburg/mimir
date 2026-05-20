import { useMutation } from '@tanstack/react-query'
import type { IMimirProvider } from '../types/mimir'

export function useAuth(provider?: IMimirProvider) {
  return useMutation({
    mutationKey: ['provider-auth', provider?.id ?? 'none'],
    mutationFn: async () => {
      if (!provider) throw new Error('Cannot authenticate without a provider.')
      return provider.auth()
    },
  })
}
