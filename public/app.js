const stateEl = document.querySelector('#state')
const timelineEl = document.querySelector('#timeline')
const goalEl = document.querySelector('#goal')
const graphEl = document.querySelector('#graph')
const metrics = {
  status: document.querySelector('#metric-status'),
  iteration: document.querySelector('#metric-iteration'),
  events: document.querySelector('#metric-events'),
  phase: document.querySelector('#metric-phase')
}

async function refresh() {
  const [state, events] = await Promise.all([
    fetch('/api/latest').then(r => r.json()),
    fetch('/api/events').then(r => r.json())
  ])
  render(state, events)
}

function render(state, events = []) {
  goalEl.textContent = state?.goal || 'Waiting for a run…'
  stateEl.textContent = JSON.stringify(state || {}, null, 2)
  metrics.status.textContent = state?.status || 'idle'
  metrics.iteration.textContent = state?.iteration || '0'
  metrics.events.textContent = String(events.length)
  metrics.phase.textContent = state?.phase || 'ready'
  timelineEl.innerHTML = ''
  for (const ev of [...events].reverse()) {
    const item = document.createElement('div')
    item.className = `event ${eventClass(ev.type)}`
    item.innerHTML = `<div><span class="type">${escapeHtml(ev.type)}</span> <span class="ts">${escapeHtml(ev.ts || '')}</span></div><p>${escapeHtml(summary(ev))}</p><pre>${escapeHtml(JSON.stringify(ev, null, 2))}</pre>`
    timelineEl.appendChild(item)
  }
  renderGraph(events)
}

function summary(ev) {
  if (ev.type === 'council.conclusion' || ev.type === 'review.conclusion') return ev.conclusion?.summary || ev.conclusion?.decision || 'Council conclusion recorded.'
  if (ev.type === 'implementation.result') return ev.implementationResult?.summary || 'Implementer returned a result.'
  if (ev.type === 'council.vote') return `${ev.agentId}: ${ev.vote?.summary || ev.vote?.recommendation || 'vote recorded'}`
  if (ev.type === 'user.comment') return ev.comment || 'Human comment injected.'
  return ev.goal || ev.status || ev.reason || 'Event recorded.'
}

function eventClass(type = '') {
  if (type.includes('council')) return 'council'
  if (type.includes('implementation')) return 'implementation'
  if (type.includes('review')) return 'review'
  if (type.includes('user')) return 'human'
  return ''
}

function renderGraph(events) {
  const iterations = [...new Set(events.map(e => e.iteration).filter(Boolean))]
  graphEl.innerHTML = ''
  graphEl.appendChild(node(70, 180, 'Goal', 'done'))
  if (!iterations.length) {
    graphEl.appendChild(node(240, 180, 'Waiting', ''))
    graphEl.appendChild(edge(105, 180, 205, 180))
    return
  }
  iterations.forEach((it, idx) => {
    const x = 210 + idx * 250
    graphEl.appendChild(edge(x - 105, 180, x - 38, 95))
    graphEl.appendChild(edge(x - 105, 180, x - 38, 180))
    graphEl.appendChild(edge(x - 105, 180, x - 38, 265))
    graphEl.appendChild(node(x, 95, `Council ${it}`, 'council'))
    graphEl.appendChild(node(x, 180, `Implement ${it}`, 'impl'))
    graphEl.appendChild(node(x, 265, `Review ${it}`, 'review'))
    graphEl.appendChild(edge(x + 38, 95, x + 105, 180))
    graphEl.appendChild(edge(x + 38, 180, x + 105, 180))
    graphEl.appendChild(edge(x + 38, 265, x + 105, 180))
  })
  const endX = Math.min(920, 210 + iterations.length * 250)
  graphEl.appendChild(node(endX, 180, 'Next', 'done'))
}

function node(x, y, label, cls) {
  const g = svg('g')
  const c = svg('circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 42); c.setAttribute('class', `node ${cls}`)
  const t = svg('text'); t.setAttribute('x', x); t.setAttribute('y', y + 4); t.setAttribute('class', 'label'); t.textContent = label
  g.append(c, t)
  return g
}
function edge(x1,y1,x2,y2){ const l=svg('line'); l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2); l.setAttribute('class','edge'); return l }
function svg(tag){ return document.createElementNS('http://www.w3.org/2000/svg', tag) }
function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])) }

document.querySelector('#stop').addEventListener('click', async () => { await fetch('/api/stop', { method: 'POST' }); await refresh() })
document.querySelector('#send-comment').addEventListener('click', async () => {
  const input = document.querySelector('#comment')
  if (!input.value.trim()) return
  await fetch('/api/comment', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ comment: input.value }) })
  input.value = ''
  await refresh()
})

const source = new EventSource('/api/stream')
source.addEventListener('update', e => { const data = JSON.parse(e.data); render(data.latest, data.events || []) })
refresh()
