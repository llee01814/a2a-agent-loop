const SAFE_SHELL = 'sh'

function shellAgent(id, persona, commandText) {
  return { id, type: 'command', persona, timeoutMs: 120000, command: [SAFE_SHELL, '-lc', commandText] }
}

const guidance = {
  codex: 'codex exec --ask-for-approval on-request "Read A2A_AGENT_LOOP_INPUT and respond with JSON-ish review."',
  'claude-code': 'claude -p "Read A2A_AGENT_LOOP_INPUT and respond with a concise council review."',
  openclaw: 'openclaw run "Read A2A_AGENT_LOOP_INPUT and respond with a concise council review."',
  hermes: 'hermes ask "Read A2A_AGENT_LOOP_INPUT and respond with a concise council review."'
}

function placeholder(provider, role) {
  const cmd = guidance[provider]
  return `printf '%s\n' '${provider}/${role} preset placeholder. Replace this command with: ${cmd.replace(/'/g, "'\\''")}'`
}

export function listPresets() { return ['mock', 'codex', 'claude-code', 'openclaw', 'hermes', 'mixed'] }

export function getPreset(name = 'mock') {
  if (name === 'mock') return mockPreset()
  if (name === 'mixed') return mixedPreset()
  if (['codex', 'claude-code', 'openclaw', 'hermes'].includes(name)) return providerPreset(name)
  throw new Error(`Unknown preset: ${name}. Available: ${listPresets().join(', ')}`)
}

export function mockPreset() {
  return {
    goal: 'Make the project better with a council-reviewed implementation loop.',
    maxIterations: 3,
    dashboard: { port: 8787, host: '127.0.0.1' },
    safety: { stepPolicy: 'one-small-reversible-step', destructiveActions: 'require-human-approval', secrets: 'never-request-or-print' },
    agents: {
      council: [
        { id: 'architect', type: 'mock', persona: 'systems architect' },
        { id: 'security', type: 'mock', persona: 'security reviewer' },
        { id: 'product', type: 'mock', persona: 'product thinker' }
      ],
      implementer: { id: 'implementer', type: 'mock', persona: 'careful implementation agent' }
    }
  }
}

export function providerPreset(provider) {
  return {
    goal: `Run a safe ${provider} council loop over this repository.`,
    maxIterations: 3,
    dashboard: { port: 8787, host: '127.0.0.1' },
    safety: { stepPolicy: 'one-small-reversible-step', destructiveActions: 'require-human-approval', network: 'provider-default', secrets: 'never-request-or-print' },
    agents: {
      council: [
        shellAgent(`${provider}-architect`, 'architecture reviewer', placeholder(provider, 'architect')),
        shellAgent(`${provider}-security`, 'security reviewer', placeholder(provider, 'security')),
        shellAgent(`${provider}-maintainer`, 'open-source maintainer', placeholder(provider, 'maintainer'))
      ],
      implementer: shellAgent(`${provider}-implementer`, 'implementation agent', placeholder(provider, 'implementer'))
    }
  }
}

export function mixedPreset() {
  return {
    goal: 'Run a mixed-provider council loop over this repository.',
    maxIterations: 3,
    dashboard: { port: 8787, host: '127.0.0.1' },
    safety: { stepPolicy: 'one-small-reversible-step', destructiveActions: 'require-human-approval', secrets: 'never-request-or-print' },
    agents: {
      council: [
        shellAgent('codex-architect', 'Codex architecture reviewer', placeholder('codex', 'architect')),
        shellAgent('claude-security', 'Claude Code security reviewer', placeholder('claude-code', 'security')),
        shellAgent('hermes-maintainer', 'Hermes maintainer reviewer', placeholder('hermes', 'maintainer'))
      ],
      implementer: shellAgent('openclaw-implementer', 'OpenClaw implementation agent', placeholder('openclaw', 'implementer'))
    }
  }
}
