import type { IMimirProvider } from '../types/mimir'
import { normalizeProviderModuleExport, type ProviderModule } from './provider-plugin'

const providerModules = import.meta.glob<ProviderModule>('./*/index.{ts,tsx}', { eager: true })

export const registeredProviderPlugins = Object.values(providerModules)
  .flatMap((module) => {
    const plugin = normalizeProviderModuleExport(module)
    return plugin ? [plugin] : []
  })
  .sort((a, b) => a.provider.metadata.displayName.localeCompare(b.provider.metadata.displayName))

export const registeredProviders = registeredProviderPlugins.map((plugin) => plugin.provider)

export function getProviderById(id: string): IMimirProvider | undefined {
  return registeredProviders.find((provider) => provider.id === id)
}

export function getProviderPluginById(id: string) {
  return registeredProviderPlugins.find((plugin) => plugin.provider.id === id)
}
