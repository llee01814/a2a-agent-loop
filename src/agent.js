import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execFileAsync = promisify(execFile)

export async function callAgent(agent, message, context = {}) {
  if (!agent || agent.type === 'mock') return mockAgent(agent || {}, message, context)
  if (agent.type === 'command') return commandAgent(agent, message, context)
  if (agent.type === 'a2a-http') return a2aHttpAgent(agent, message, context)
  throw new Error(`Unsupported agent type: ${agent.type}`)
}

function mockAgent(agent, message, context) {
  const persona = agent.persona || agent.id || 'agent'
  const iteration = context.iteration || 1
  return {
    agentId: agent.id || 'mock',
    kind: 'mock',
    summary: `${persona} reviewed iteration ${iteration}: keep scope small, make one verified change, preserve user control.`,
    recommendation: iteration % 2 === 0 ? 'verify-and-refine' : 'implement-small-step',
    confidence: 0.72,
    risks: ['mock output is demonstration only']
  }
}

async function commandAgent(agent, message, context) {
  const command = agent.command
  if (!Array.isArray(command) || command.length === 0) throw new Error(`Agent ${agent.id} missing command array`)
  const input = JSON.stringify({ message, context })
  const { stdout, stderr } = await execFileAsync(command[0], command.slice(1), {
    input,
    timeout: agent.timeoutMs || 120000,
    maxBuffer: agent.maxBuffer || 1024 * 1024,
    env: { ...process.env, A2A_AGENT_LOOP_INPUT: input }
  })
  return {
    agentId: agent.id,
    kind: 'command',
    summary: stdout.trim() || stderr.trim(),
    stderr: stderr.trim(),
    confidence: 0.6,
    risks: stderr.trim() ? ['agent wrote to stderr'] : []
  }
}

async function a2aHttpAgent(agent, message, context) {
  const body = {
    jsonrpc: '2.0',
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    method: agent.method || 'message/send',
    params: { message, context }
  }
  const res = await fetch(agent.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(agent.timeoutMs || 120000)
  })
  const json = await res.json().catch(() => ({}))
  return {
    agentId: agent.id,
    kind: 'a2a-http',
    summary: JSON.stringify(json.result ?? json, null, 2),
    confidence: res.ok ? 0.65 : 0.2,
    risks: res.ok ? [] : [`HTTP ${res.status}`]
  }
}
