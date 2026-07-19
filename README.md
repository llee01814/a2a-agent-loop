# A2A Agent Loop

Local-first A2A council loop for people who want multi-agent swarm / loop engineering without hand-building the harness.

The project gives coding agents such as Codex CLI, Claude Code, OpenClaw, Hermes, or any command-line agent a common loop:

```text
Human goal → Council agents discuss → Council conclusion → Implementer agent acts → Council reviews result → repeat
```

A live dashboard shows the discussion timeline, council conclusions, implementation results, a branch graph, a stop button, and human comment injection.

## v0.2 highlights

- Provider config presets: `codex`, `claude-code`, `openclaw`, `hermes`, `mixed`.
- `a2a-loop presets` command.
- `a2a-loop init --preset <name>` config generator.
- Review phase after each implementation result.
- Improved dashboard metrics and live branch graph.
- `--hold-dashboard` mode for demos and long inspection.

## Why this exists

Most users do not know how to build a persistent council + implementation loop. Existing tools cover pieces:

- A2A protocol SDKs expose agent-to-agent communication.
- Claude/Codex multi-agent repos show provider-specific orchestration.
- Swarm dashboards visualize agents.
- Agent frameworks orchestrate workers but often require framework buy-in.

A2A Agent Loop is intended as the small, portable harness repo a user can drop into an AI coding session and say: "install this and run the loop."

## Quick start

```bash
git clone https://github.com/llee01814/a2a-agent-loop.git
cd a2a-agent-loop
npm test
npm run demo
```

Open dashboard demo:

```bash
npm run demo:dashboard
# http://127.0.0.1:8787
```

Demo video:

https://github.com/llee01814/a2a-agent-loop/releases/download/v0.2.0/a2a-agent-loop-v0.2-demo.mp4

Local copy:

```text
demo/videos/a2a-agent-loop-v0.2-demo.mp4
```

See [`docs/DEMO.md`](docs/DEMO.md).

## Use in another repo

```bash
npx a2a-agent-loop init --preset codex
npx a2a-agent-loop start --goal "Improve tests and documentation" --max-iterations 5
```

Until the npm package is published, use a local clone:

```bash
node /path/to/a2a-agent-loop/bin/a2a-agent-loop.js init --preset mixed
node /path/to/a2a-agent-loop/bin/a2a-agent-loop.js start --config a2a-loop.config.json
```

## Presets

```bash
a2a-loop presets
```

Available:

- `mock` — dependency-free local demo.
- `codex` — Codex CLI placeholder config.
- `claude-code` — Claude Code placeholder config.
- `openclaw` — OpenClaw placeholder config.
- `hermes` — Hermes placeholder config.
- `mixed` — mixed-provider council template.

Provider presets are safe placeholders. They generate config shape and document where to insert the real CLI command, but they do not silently grant credentials or destructive permissions.

## Command agent adapter

`a2a-loop.config.json` can define agents as commands. The command receives JSON on stdin and in `A2A_AGENT_LOOP_INPUT`.

```json
{
  "goal": "Improve this repository safely",
  "maxIterations": 3,
  "agents": {
    "council": [
      { "id": "architect", "type": "command", "command": ["claude", "-p", "You are an architecture reviewer"] },
      { "id": "security", "type": "command", "command": ["codex", "exec", "review security risks"] }
    ],
    "implementer": { "id": "implementer", "type": "command", "command": ["codex", "exec", "Implement exactly one small reversible step"] }
  }
}
```

Keep command agents sandboxed. Do not grant credentials or destructive permissions by default.

## Dashboard

The dashboard is intentionally dependency-free:

- GET `/api/latest`
- GET `/api/events`
- GET `/api/stream`
- POST `/api/stop`
- POST `/api/comment`

## Safety model

- Local-first by default.
- No secrets required for the demo.
- Human can stop the run from the dashboard.
- User comments are appended as audit events.
- Council output is treated as advice, not truth.
- Implementer should make one small reversible step per iteration.

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## License

MIT
