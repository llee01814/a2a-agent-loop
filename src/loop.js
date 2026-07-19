import { callAgent } from './agent.js'
import { runCouncil } from './council.js'

export async function runLoop({ config, store }) {
  const run = await store.createRun({ goal: config.goal, maxIterations: config.maxIterations, safety: config.safety })
  const runId = run.runId
  await store.append(runId, { type: 'run.started', goal: config.goal, maxIterations: config.maxIterations, safety: config.safety })
  let implementationResult = null
  let status = 'completed'

  for (let iteration = 1; iteration <= config.maxIterations; iteration += 1) {
    if (await store.shouldStop(runId)) { status = 'stopped'; break }
    await store.writeState(runId, { status: 'running', iteration, phase: 'council' })
    await store.append(runId, { type: 'iteration.started', iteration })

    const council = await runCouncil({ councilAgents: config.agents.council || [], goal: config.goal, iteration, store, runId, implementationResult })
    if (council.conclusion.decision === 'pause-for-human') {
      status = 'paused'
      await store.append(runId, { type: 'run.paused', reason: 'council requested human review', iteration })
      break
    }

    await store.writeState(runId, { status: 'running', iteration, phase: 'implement' })
    implementationResult = await callAgent(config.agents.implementer, council.conclusion.implementerInstruction, { phase: 'implement', goal: config.goal, iteration, council: council.conclusion, safety: config.safety })
    await store.append(runId, { type: 'implementation.result', iteration, implementationResult })

    await store.writeState(runId, { status: 'running', iteration, phase: 'review' })
    const review = await runCouncil({ councilAgents: config.agents.council || [], goal: `Review implementation result for original goal: ${config.goal}`, iteration, store, runId, implementationResult })
    await store.append(runId, { type: 'review.conclusion', iteration, conclusion: review.conclusion })

    if (config.once) break
  }

  await store.writeState(runId, { status, phase: 'finished', finishedAt: new Date().toISOString(), implementationResult })
  await store.append(runId, { type: 'run.finished', status })
  return { runId, status, stateDir: store.baseDir }
}
