import { createReadStream, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' }

export async function startDashboard({ store, publicDir, host = '127.0.0.1', port = 8787 }) {
  const clients = new Set()
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`)
      if (url.pathname === '/api/latest') return json(res, await store.latestRun())
      if (url.pathname === '/api/events') {
        const latest = await store.latestRun()
        return json(res, latest ? await store.readEvents(latest.runId) : [])
      }
      if (url.pathname === '/api/stop' && req.method === 'POST') {
        const latest = await store.latestRun(); if (latest) await store.stop(latest.runId)
        return json(res, { ok: true })
      }
      if (url.pathname === '/api/comment' && req.method === 'POST') {
        const latest = await store.latestRun(); const body = await readBody(req)
        if (latest) await store.comment(latest.runId, body.comment || body.text || '')
        return json(res, { ok: true })
      }
      if (url.pathname === '/api/stream') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
        clients.add(res)
        req.on('close', () => clients.delete(res))
        return
      }
      serveStatic(publicDir, url.pathname, res)
    } catch (err) {
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  })
  const interval = setInterval(async () => {
    const latest = await store.latestRun().catch(() => null)
    const events = latest ? await store.readEvents(latest.runId).catch(() => []) : []
    for (const c of clients) c.write(`event: update\ndata: ${JSON.stringify({ latest, events })}\n\n`)
  }, 1000)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => { server.off('error', reject); resolve() })
  })
  return { host, port, closed: new Promise(resolve => server.on('close', resolve)), close: () => new Promise(resolve => { clearInterval(interval); server.close(resolve) }) }
}

function json(res, data) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(data ?? null, null, 2)) }
async function readBody(req) { const chunks=[]; for await (const c of req) chunks.push(c); return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') }
function serveStatic(publicDir, pathname, res) {
  const rel = pathname === '/' ? '/index.html' : pathname
  const safe = normalize(rel).replace(/^\.\.(\/|$)/, '')
  const file = join(publicDir, safe)
  if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
}
