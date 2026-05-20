#!/usr/bin/env node

const chunks = []

process.stdin.on('data', (chunk) => chunks.push(chunk))
process.stdin.on('end', () => {
  let payload = {}

  try {
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    process.stdout.write(JSON.stringify({ continue: true }))
    return
  }

  const toolName =
    payload.toolName ?? payload.tool_name ?? payload.tool?.name ?? payload.name ?? ''
  const command =
    payload.arguments?.command ??
    payload.toolInput?.command ??
    payload.input?.command ??
    payload.params?.command ??
    ''

  if (toolName !== 'bash' || typeof command !== 'string') {
    process.stdout.write(JSON.stringify({ continue: true }))
    return
  }

  const blockedPatterns = [
    /\bgit\s+reset\s+--hard\b/,
    /\bgit\s+checkout\s+--\b/,
    /\brm\s+-rf\s+\/Users\/kevin-macbook-air\/Projects\/mimir\b/,
    /\bkillall\b/,
    /\bpkill\b/,
  ]

  const blocked = blockedPatterns.find((pattern) => pattern.test(command))

  if (!blocked) {
    process.stdout.write(JSON.stringify({ continue: true }))
    return
  }

  process.stdout.write(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'Blocked by workspace quality guard: destructive repository-wide commands are not allowed.',
      },
    }),
  )
})
