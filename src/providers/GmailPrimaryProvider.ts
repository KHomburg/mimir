import { ScenarioProvider } from './scenario-provider'

export class GmailPrimaryProvider extends ScenarioProvider {
  constructor() {
    super({
      id: 'gmail-primary',
      platform: 'gmail',
      accountLabel: 'Gmail · Primary',
      metadata: {
        displayName: 'Gmail · Primary',
        icon: '✉',
        summary: 'Email notifications, replies, and thread-based conversations from Gmail.',
        accent: '#ea4335',
        capabilities: ['oauth', 'activity-feed', 'quick-reply', 'read-sync'],
        defaultConnected: true,
      },
      scope: ['gmail.readonly', 'gmail.modify'],
      blueprints: [
        {
          personId: 'alex@acme.dev',
          personLabel: 'Alex Morgan',
          threadId: 'gmail:alex-morgan:roadmap',
          title: 'Follow-up on roadmap notes',
          body: 'Sharing the email version of the roadmap comments so they group with the Slack thread.',
        },
        {
          personId: 'recruiting@network.io',
          personLabel: 'Network Recruiting',
          threadId: 'gmail:network-recruiting',
          title: 'Inbox update',
          body: 'We have a shortlist update waiting in the hiring thread.',
        },
        {
          personId: 'ops@mimir.dev',
          personLabel: 'Mimir Ops',
          threadId: 'gmail:mimir-ops:daily',
          title: 'Build digest',
          body: 'Nightly regression report is clean. Desktop sync emitter can be exercised next.',
        },
      ],
    })
  }
}

export default new GmailPrimaryProvider()
