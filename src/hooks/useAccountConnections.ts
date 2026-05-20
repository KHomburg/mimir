import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccountVault } from '../lib/accountVault'
import type { IMimirProvider } from '../types/mimir'

export function useAccountConnections(providers: IMimirProvider[]) {
  const queryClient = useQueryClient()

  const stateQuery = useQuery({
    queryKey: ['account-connections'],
    queryFn: async () => {
      const vault = await getAccountVault()
      return vault.getState()
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    const state = stateQuery.data
    if (!state || state.mode !== 'browser-preview' || state.connectedProviderIds.length > 0) {
      return
    }

    const defaults = providers.filter((provider) => provider.metadata.defaultConnected)
    if (!defaults.length) return

    let cancelled = false

    const bootstrap = async () => {
      const vault = await getAccountVault()
      for (const provider of defaults) {
        const token = await provider.auth()
        if (cancelled) return
        await vault.storeToken(provider.id, token)
      }
      if (!cancelled) {
        await queryClient.invalidateQueries({ queryKey: ['account-connections'] })
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [providers, queryClient, stateQuery.data])

  const unlockVault = useMutation({
    mutationFn: async (passphrase: string) => {
      const vault = await getAccountVault()
      return vault.unlock(passphrase)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['account-connections'] })
    },
  })

  const lockVault = useMutation({
    mutationFn: async () => {
      const vault = await getAccountVault()
      return vault.lock()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['account-connections'] })
    },
  })

  const connectProvider = useMutation({
    mutationFn: async (provider: IMimirProvider) => {
      const token = await provider.auth()
      const vault = await getAccountVault()
      await vault.storeToken(provider.id, token)
      return provider.id
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['account-connections'] })
    },
  })

  const disconnectProvider = useMutation({
    mutationFn: async (providerId: string) => {
      const vault = await getAccountVault()
      await vault.removeToken(providerId)
      return providerId
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['account-connections'] })
    },
  })

  return {
    stateQuery,
    unlockVault,
    lockVault,
    connectProvider,
    disconnectProvider,
  }
}
