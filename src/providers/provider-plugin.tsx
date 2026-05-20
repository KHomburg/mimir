import type { ReactNode } from 'react'
import type { IMimirProvider, MimirNotification } from '../types/mimir'

export interface ProviderThreadContext {
  provider: IMimirProvider
  thread: MimirNotification[]
  latest: MimirNotification
}

export interface ProviderComposerContext extends ProviderThreadContext {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isSending: boolean
}

export interface ProviderStreamRowContext {
  provider: IMimirProvider
  notification: MimirNotification
  isSelected: boolean
  accent: string
  onSelect: () => void
}

export interface ProviderSettingsContext {
  provider: IMimirProvider
  isConnected: boolean
  unreadCount: number
  isBusy: boolean
  canManageAccounts: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export interface ProviderComposerPreset {
  label?: string
  helperText?: string
  placeholder?: string
  submitLabel?: string
  featureBadges?: string[]
}

export interface ProviderPluginDefinition {
  provider: IMimirProvider
  composer?: ProviderComposerPreset
  renderStreamRow?: (context: ProviderStreamRowContext) => ReactNode
  renderThreadDetails?: (context: ProviderThreadContext) => ReactNode
  renderComposer?: (context: ProviderComposerContext) => ReactNode
  renderSettingsPanel?: (context: ProviderSettingsContext) => ReactNode
}

export interface ProviderModule {
  default?: IMimirProvider | ProviderPluginDefinition
  provider?: IMimirProvider
  plugin?: ProviderPluginDefinition
}

export function defineProviderPlugin(
  input: IMimirProvider | ProviderPluginDefinition,
): ProviderPluginDefinition {
  if (isProviderPluginDefinition(input)) {
    return input
  }

  return {
    provider: input,
  }
}

export function normalizeProviderModuleExport(module: ProviderModule): ProviderPluginDefinition | undefined {
  if (module.plugin) {
    return defineProviderPlugin(module.plugin)
  }

  if (module.default) {
    return defineProviderPlugin(module.default)
  }

  if (module.provider) {
    return defineProviderPlugin(module.provider)
  }

  return undefined
}

function isProviderPluginDefinition(
  value: IMimirProvider | ProviderPluginDefinition,
): value is ProviderPluginDefinition {
  return 'provider' in value
}
