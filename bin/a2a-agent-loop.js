#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig, starterConfig } from '../src/config.js'
import { listPresets } from '../src/presets.js'
import { createRunStore } from '../src/store.js'
import { runLoop } from '../src/loop.js'
import { startDashboard } from '../src/server.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (!a.startsWith('--')) args._.push(a)
    else if (a === '--demo') args.demo = true
    else if (a === '--once') args.once = true
    else if (a === '--hold-dashboard') args.holdDashboard = true
    else if (a === '--no-dashboard') args.dashboard = false
    else if (a === '--help' || a === '-h') args.help = true
    else {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) args[key] = true
      else { args[key] = next; i += 1 }
    }
  }
  return args
}

function help() {
  console.log(`A2A Agent Loop v0.2\n\nUsage:\n  a2a-loop init [--dir .] [--preset mock|codex|claude-code|openclaw|hermes|mixed]\n  a2a-loop presets\n  a2a-loop start [--config a2a-loop.config.json] [--goal \"...\"] [--port 8787] [--once] [--demo] [--hold-dashboard]\n  a2a-loop status [--state .a2a-loop]\n\nExamples:\n  a2a-loop init --preset codex\n  a2a-loop init --preset mixed\n  a2a-loop start --demo --hold-dashboard\n  a2a-loop start --goal \"Improve README and tests\" --max-iterations 5\n`)
}

async function initProject({ dir = '.', preset = 'mock', force = false } = {}) {
  const target = resolve(process.cwd(), dir)
  const configPath = resolve(target, 'a2a-loop.config.json')
  await mkdir(target, { recursive: true })
  if (existsSync(configPath) && !force) {
    console.log(`Config already exists: ${configPath}`)
    console.log('Pass --force to overwrite.')
    return
  }
  const starter = starterConfig(preset)
  starter.meta = { generatedBy: 'a2a-agent-loop', preset, version: '0.2.0' }
  await writeFile(configPath, JSON.stringify(starter, null, 2) + '\n')
  console.log(`Created ${configPath}`)
  console.log(`Preset: ${preset}`)
}

async function status(stateDir = '.a2a-loop') {
  const store = createRunStore(resolve(process.cwd(), stateDir))
  const latest = await store.latestRun()
  if (!latest) { console.log('No runs found.'); return }
  console.log(JSON.stringify(latest, null, 2))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const cmd = args._[0] || 'help'
  if (args.help || cmd === 'help') return help()
  if (cmd === 'presets') { console.log(listPresets().join('\n')); return }
  if (cmd === 'init') return initProject({ dir: args.dir || '.', preset: args.preset || 'mock', force: args.force })
  if (cmd === 'status') return status(args.state || '.a2a-loop')
  if (cmd !== 'start') throw new Error(`Unknown command: ${cmd}`)

  const config = await loadConfig({ configPath: args.config, demo: args.demo, preset: args.preset, goal: args.goal, maxIterations: args['max-iterations'] ? Number(args['max-iterations']) : undefined, once: args.once })
  const stateDir = resolve(process.cwd(), args.state || '.a2a-loop')
  const store = createRunStore(stateDir)
  let dashboard
  if (args.dashboard !== false && config.dashboard !== false) {
    dashboard = await startDashboard({ store, config, publicDir: resolve(root, 'public'), port: Number(args.port || config.dashboard?.port || 8787), host: args.host || config.dashboard?.host || '127.0.0.1' })
    console.log(`Dashboard: http://${dashboard.host}:${dashboard.port}`)
  }
  const result = await runLoop({ config, store })
  if (dashboard && (args.holdDashboard || config.holdDashboard || (!config.once && !args.once))) await dashboard.closed
  else if (dashboard) await dashboard.close()
  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => { console.error(err?.stack || err?.message || String(err)); process.exitCode = 1 })
