import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getPreset, mockPreset } from './presets.js'

export async function loadConfig({ configPath, demo, goal, maxIterations, once, preset } = {}) {
  let config
  if (demo || !configPath) config = demoConfig()
  if (preset && !configPath) config = getPreset(preset)
  if (configPath) config = JSON.parse(await readFile(resolve(process.cwd(), configPath), 'utf8'))
  config ||= demoConfig()
  if (goal) config.goal = goal
  if (maxIterations) config.maxIterations = maxIterations
  if (once) { config.once = true; config.maxIterations = 1 }
  config.maxIterations ||= 3
  config.agents ||= demoConfig().agents
  config.dashboard ||= { host: '127.0.0.1', port: 8787 }
  config.safety ||= { stepPolicy: 'one-small-reversible-step', destructiveActions: 'require-human-approval' }
  return config
}

export function starterConfig(preset = 'mock') { return getPreset(preset) }

export function demoConfig() {
  const cfg = mockPreset()
  cfg.goal = 'Demo: turn a human goal into council votes, an implementation instruction, a result, and a review timeline.'
  cfg.maxIterations = 3
  return cfg
}
