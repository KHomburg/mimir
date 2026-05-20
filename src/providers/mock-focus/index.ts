import {
  renderMockSettingsPanel,
  renderMockStreamRow,
  renderMockThreadDetails,
} from '../builtinProviderSurfaces'
import { defineProviderPlugin } from '../provider-plugin'
import { ScenarioProvider } from '../scenario-provider'

export class MockProvider extends ScenarioProvider {
  constructor() {
    super({
      id: 'mock-focus',
      platform: 'mock',
      accountLabel: 'Focus Demo',
      metadata: {
        displayName: 'Focus Demo',
        icon: '◉',
        summary: 'A built-in demo account that keeps the stream alive during local development.',
        accent: '#8b5cf6',
        capabilities: ['activity-feed', 'quick-reply', 'read-sync'],
        defaultConnected: true,
      },
      scope: ['notifications:read', 'messages:write'],
      blueprints: [
        {
          personId: 'sam@acme.dev',
          personLabel: 'Sam Rivera',
          threadId: 'mock:sam-rivera',
          title: 'Focus block scheduled',
          body: 'I carved out a 90-minute block to wire the account tabs. Want the branch after lunch?',
        },
        {
          personId: 'ops@mimir.dev',
          personLabel: 'Mimir Ops',
          threadId: 'mock:ops-status',
          title: 'Daily digest',
          body: 'Mock sync confirms the repository-first path is hydrated before the UI paints.',
        },
        {
          personId: 'alex@acme.dev',
          personLabel: 'Alex Morgan',
          threadId: 'mock:alex-morgan',
          title: 'Cross-platform thread',
          body: 'You now have matching identities across providers, so this conversation should group cleanly.',
        },
      ],
    })
  }
}

const provider = new MockProvider()

export default defineProviderPlugin({
  provider,
  composer: {
    label: 'Demo reply',
    helperText: 'Exercise the provider plugin contract with local echoes and lightweight markdown.',
    placeholder: 'Send a demo reply to the mock thread...',
    submitLabel: 'Send demo reply',
    featureBadges: ['Markdown', 'Local echo', 'Read sync'],
  },
  renderStreamRow: renderMockStreamRow,
  renderThreadDetails: renderMockThreadDetails,
  renderSettingsPanel: renderMockSettingsPanel,
})
