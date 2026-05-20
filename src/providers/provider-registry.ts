import type { IMimirProvider } from '../types/mimir'

type ProviderModule = {
  default?: IMimirProvider
  provider?: IMimirProvider
}

const providerModules = import.meta.glob<ProviderModule>('./*Provider.ts', { eager: true })

export const registeredProviders = Object.values(providerModules)
  .flatMap((m) => {
    const p = m.default ?? m.provider
    return p ? [p] : []
  })
  .sort((a, b) => a.metadata.displayName.localeCompare(b.metadata.displayName))

export function getProviderById(id: string): IMimirProvider | undefined {
  return registeredProviders.find((p) => p.id === id)
}
