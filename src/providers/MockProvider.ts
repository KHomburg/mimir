import { ScenarioProvider } from './scenario-provider'

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

export default new MockProvider()
