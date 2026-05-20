import { describe, expect, it } from 'vitest'
import { registeredProviderPlugins, registeredProviders } from '../src/providers/provider-registry'

describe('provider registry', () => {
  it('auto-registers folder entrypoints for built-in integrations', () => {
    expect(registeredProviders.map((provider) => provider.id)).toEqual([
      'mock-focus',
      'gmail-primary',
      'linkedin-inbox',
      'slack-work',
    ])
  })

  it('keeps plugin and provider definitions aligned', () => {
    expect(registeredProviderPlugins.every((plugin) => registeredProviders.includes(plugin.provider))).toBe(true)
    expect(registeredProviderPlugins.find((plugin) => plugin.provider.id === 'slack-work')?.renderStreamRow).toBeTypeOf('function')
  })
})
