import {
  renderLinkedInSettingsPanel,
  renderLinkedInStreamRow,
  renderLinkedInThreadDetails,
} from '../builtinProviderSurfaces'
import { defineProviderPlugin } from '../provider-plugin'
import { ScenarioProvider } from '../scenario-provider'

export class LinkedInInboxProvider extends ScenarioProvider {
  constructor() {
    super({
      id: 'linkedin-inbox',
      platform: 'linkedin',
      accountLabel: 'LinkedIn · Inbox',
      metadata: {
        displayName: 'LinkedIn · Inbox',
        icon: 'in',
        summary: 'Professional inbox activity that may eventually need a lite webview fallback.',
        accent: '#0a66c2',
        capabilities: ['oauth', 'activity-feed', 'quick-reply', 'read-sync', 'lite-webview'],
        defaultConnected: true,
      },
      scope: ['messages:read', 'messages:write'],
      blueprints: [
        {
          personId: 'sam@acme.dev',
          personLabel: 'Sam Rivera',
          threadId: 'linkedin:sam-rivera:career',
          title: 'Career check-in',
          body: 'Wanted to continue the conversation here as well so identity grouping can bridge platforms.',
        },
        {
          personId: 'drew@network.io',
          personLabel: 'Drew Chen',
          threadId: 'linkedin:drew-chen:search',
          title: 'Recruiter follow-up',
          body: 'I have a role that lines up with your Tauri and local-first architecture background.',
        },
        {
          personId: 'partnerships@mimir.dev',
          personLabel: 'Mimir Partnerships',
          threadId: 'linkedin:partnerships',
          title: 'Partnership note',
          body: 'LinkedIn remains the provider most likely to need the lite webview surface in a later slice.',
        },
      ],
    })
  }
}

const provider = new LinkedInInboxProvider()

export default defineProviderPlugin({
  provider,
  composer: {
    label: 'Inbox reply',
    helperText: 'Relationship-focused plugins can shape tone and prompts while still using core controls and styling.',
    placeholder: 'Write a concise professional follow-up...',
    submitLabel: 'Send message',
    featureBadges: ['Profile context', 'Short-form reply', 'Follow-up'],
  },
  renderStreamRow: renderLinkedInStreamRow,
  renderThreadDetails: renderLinkedInThreadDetails,
  renderSettingsPanel: renderLinkedInSettingsPanel,
})
