import { callAgent } from './agent.js'

export async function runCouncil({ councilAgents, goal, iteration, store, runId, implementationResult }) {
  const prompt = buildCouncilPrompt({ goal, iteration, implementationResult })
  const votes = []
  for (const agent of councilAgents) {
    const vote = await callAgent(agent, prompt, { phase: 'council', goal, iteration, implementationResult })
    votes.push(vote)
    await store.append(runId, { type: 'council.vote', iteration, agentId: vote.agentId, vote })
  }
  const conclusion = synthesizeCouncil({ goal, iteration, votes })
  await store.append(runId, { type: 'council.conclusion', iteration, conclusion })
  return { votes, conclusion }
}

export function buildCouncilPrompt({ goal, iteration, implementationResult }) {
  return [
    `Goal: ${goal}`,
    `Iteration: ${iteration}`,
    implementationResult ? `Previous implementation result: ${JSON.stringify(implementationResult)}` : 'No previous implementation yet.',
    'Return a concise recommendation, key risks, and whether the implementer should continue.'
  ].join('\n')
}

export function synthesizeCouncil({ goal, iteration, votes }) {
  const risks = [...new Set(votes.flatMap(v => v.risks || []))]
  const confidence = votes.length ? votes.reduce((s, v) => s + Number(v.confidence || 0), 0) / votes.length : 0
  const recommendations = votes.map(v => v.recommendation || v.summary).filter(Boolean)
  return {
    goal,
    iteration,
    decision: confidence >= 0.5 ? 'continue' : 'pause-for-human',
    implementerInstruction: `Iteration ${iteration}: perform one small, reversible, testable step toward: ${goal}. Council says: ${recommendations.join(' | ')}`,
    confidence: Number(confidence.toFixed(2)),
    risks,
    summary: recommendations.join('\n')
  }
}
