# Architecture

## Core idea

A2A Agent Loop is a harness, not another closed agent framework. It coordinates existing AI coding agents through adapters.

```text
┌────────────┐
│   Human    │
└─────┬──────┘
      │ goal/comment/stop
┌─────▼────────────────────────────────────────────┐
│              A2A Agent Loop Controller            │
│  - iteration state                                │
│  - audit log                                      │
│  - stop/comment control                           │
└─────┬──────────────────────────┬─────────────────┘
      │                          │
┌─────▼──────┐             ┌─────▼────────┐
│  Council   │             │ Implementer  │
│ agents     │             │ agent        │
└─────┬──────┘             └─────┬────────┘
      │ votes/conclusion         │ result
      └──────────────┬───────────┘
                     ▼
              next iteration
```

## Components

### Controller

Runs the loop:

1. Create run state.
2. Ask council agents for votes.
3. Synthesize a conclusion.
4. Send the conclusion to the implementer.
5. Log the result.
6. Repeat until max iterations, stop button, or council pause.

### Agent adapters

Current adapters:

- `mock` — deterministic demo agent.
- `command` — wraps any CLI agent.
- `a2a-http` — experimental JSON-RPC over HTTP adapter compatible with A2A-style agents.

Planned adapters:

- official `@a2a-js/sdk` bridge
- Claude Code native wrapper
- Codex CLI wrapper
- OpenClaw wrapper
- Hermes A2A plugin wrapper

### Store

Local `.a2a-loop/` directory:

```text
.a2a-loop/
  latest.json
  runs/
    run-.../
      state.json
      control.json
      events.jsonl
```

### Dashboard

Dependency-free HTML/CSS/JS served by Node. It reads API events and displays a live timeline.

## Non-goals for MVP

- Fully autonomous unbounded code mutation.
- Real shared consciousness/memory between agents.
- Cloud-hosted SaaS.
- Credential management.
- Bypassing provider safety or permission models.
