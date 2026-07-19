import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createRunStore } from '../src/store.js'
import { runLoop } from '../src/loop.js'
import { demoConfig } from '../src/config.js'
import { synthesizeCouncil } from '../src/council.js'
import { getPreset, listPresets } from '../src/presets.js'

const execFileAsync = promisify(execFile)

test('council synthesis continues when average confidence is acceptable', () => {
  const c = synthesizeCouncil({ goal: 'x', iteration: 1, votes: [{ confidence: 0.8, recommendation: 'go' }, { confidence: 0.6, recommendation: 'ship' }] })
  assert.equal(c.decision, 'continue')
  assert.match(c.implementerInstruction, /Iteration 1/)
})

test('demo loop creates council, implementation, and review events', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'a2a-loop-test-'))
  try {
    const store = createRunStore(dir)
    const config = demoConfig()
    config.once = true
    config.maxIterations = 1
    const result = await runLoop({ config, store })
    assert.equal(result.status, 'completed')
    const events = await store.readEvents(result.runId)
    assert.ok(events.some(e => e.type === 'council.conclusion'))
    assert.ok(events.some(e => e.type === 'implementation.result'))
    assert.ok(events.some(e => e.type === 'review.conclusion'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('provider presets produce command agents and safety policy', () => {
  assert.deepEqual(listPresets(), ['mock', 'codex', 'claude-code', 'openclaw', 'hermes', 'mixed'])
  const codex = getPreset('codex')
  assert.equal(codex.agents.council[0].type, 'command')
  assert.equal(codex.safety.destructiveActions, 'require-human-approval')
})

test('cli init writes preset config', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'a2a-init-test-'))
  try {
    await execFileAsync('node', ['./bin/a2a-agent-loop.js', 'init', '--dir', dir, '--preset', 'mixed'], { cwd: process.cwd() })
    const cfg = JSON.parse(await readFile(join(dir, 'a2a-loop.config.json'), 'utf8'))
    assert.equal(cfg.meta.preset, 'mixed')
    assert.equal(cfg.agents.implementer.type, 'command')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
