import {
  renderSlackSettingsPanel,
  renderSlackStreamRow,
  renderSlackThreadDetails,
} from '../builtinProviderSurfaces'
import { defineProviderPlugin } from '../provider-plugin'
import { ScenarioProvider } from '../scenario-provider'

export class SlackWorkProvider extends ScenarioProvider {
  constructor() {
    super({
      id: 'slack-work',
      platform: 'slack',
      accountLabel: 'Slack · Work',
      metadata: {
        displayName: 'Slack · Work',
        icon: '#',
        summary: 'Workspace messages and thread follow-ups from your work Slack.',
        accent: '#4a154b',
        capabilities: ['oauth', 'activity-feed', 'quick-reply', 'read-sync'],
        defaultConnected: true,
      },
      scope: ['channels:history', 'chat:write'],
      blueprints: [
        {
          personId: 'alex@acme.dev',
          personLabel: 'Alex Morgan',
          threadId: 'slack:alex-morgan:roadmap',
          title: 'Roadmap thread',
          body: 'Can you sanity-check the provider onboarding copy before the product review?',
        },
        {
          personId: 'sam@acme.dev',
          personLabel: 'Sam Rivera',
          threadId: 'slack:sam-rivera:release',
          title: 'Release coordination',
          body: 'The desktop build is ready to smoke-test as soon as the secure vault is unlocked.',
        },
        {
          personId: 'eng-leads@acme.dev',
          personLabel: 'Engineering Leads',
          threadId: 'slack:eng-leads:triage',
          title: 'Triage follow-up',
          body: 'Please mark the unread grouping issue as resolved once the repo-backed thread view lands.',
        },
      ],
    })
  }
}

const provider = new SlackWorkProvider()

export default defineProviderPlugin({
  provider,
  composer: {
    label: 'Thread reply',
    helperText: 'Slack-style plugins can tune the composer for short replies, mentions, and quick thread follow-ups.',
    placeholder: 'Reply in thread, mention teammates, or paste context...',
    submitLabel: 'Send to Slack',
    featureBadges: ['Mentions', 'Emoji', 'Thread reply'],
  },
  renderStreamRow: renderSlackStreamRow,
  renderThreadDetails: renderSlackThreadDetails,
  renderSettingsPanel: renderSlackSettingsPanel,
})
