import { mkdir, readFile, readdir, writeFile, appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function createRunStore(baseDir) {
  async function ensure() { await mkdir(baseDir, { recursive: true }) }
  async function runDir(runId) { await ensure(); const dir = join(baseDir, 'runs', runId); await mkdir(dir, { recursive: true }); return dir }

  return {
    baseDir,
    async createRun(meta) {
      await ensure()
      const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`
      const dir = await runDir(runId)
      const state = { runId, status: 'running', createdAt: new Date().toISOString(), events: 0, comments: [], control: { stop: false }, ...meta }
      await writeFile(join(dir, 'state.json'), JSON.stringify(state, null, 2))
      await writeFile(join(dir, 'events.jsonl'), '')
      await writeFile(join(dir, 'control.json'), JSON.stringify({ stop: false }, null, 2))
      await writeFile(join(baseDir, 'latest.json'), JSON.stringify({ runId, dir }, null, 2))
      return state
    },
    async append(runId, event) {
      const dir = await runDir(runId)
      const payload = { ts: new Date().toISOString(), ...event }
      await appendFile(join(dir, 'events.jsonl'), JSON.stringify(payload) + '\n')
      const events = await this.readEvents(runId)
      const patch = { events: events.length }
      if (payload.type === 'user.comment') {
        const state = await this.readState(runId).catch(() => ({ comments: [] }))
        patch.comments = [...(state.comments || []), { comment: payload.comment, ts: payload.ts }]
      }
      await this.writeState(runId, patch)
      return payload
    },
    async readEvents(runId) {
      const dir = join(baseDir, 'runs', runId)
      const p = join(dir, 'events.jsonl')
      if (!existsSync(p)) return []
      return (await readFile(p, 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line))
    },
    async readState(runId) {
      const dir = join(baseDir, 'runs', runId)
      return JSON.parse(await readFile(join(dir, 'state.json'), 'utf8'))
    },
    async writeState(runId, patch) {
      const dir = await runDir(runId)
      const p = join(dir, 'state.json')
      const current = existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : { runId }
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
      await writeFile(p, JSON.stringify(next, null, 2))
      return next
    },
    async stop(runId, reason = 'user requested stop') {
      const dir = await runDir(runId)
      await writeFile(join(dir, 'control.json'), JSON.stringify({ stop: true, reason, ts: new Date().toISOString() }, null, 2))
      await this.append(runId, { type: 'control.stop', reason })
    },
    async comment(runId, comment) {
      await this.append(runId, { type: 'user.comment', comment })
    },
    async shouldStop(runId) {
      const p = join(baseDir, 'runs', runId, 'control.json')
      if (!existsSync(p)) return false
      return Boolean(JSON.parse(await readFile(p, 'utf8')).stop)
    },
    async latestRun() {
      const p = join(baseDir, 'latest.json')
      if (!existsSync(p)) return null
      const latest = JSON.parse(await readFile(p, 'utf8'))
      return this.readState(latest.runId)
    },
    async listRuns() {
      const dir = join(baseDir, 'runs')
      if (!existsSync(dir)) return []
      return readdir(dir)
    }
  }
}
