# Research Notes

Date: 2026-07-19

## Finding

There are many pieces of the desired system, but no inspected result appeared to be the exact product shape:

> provider-agnostic repo that an AI coding agent can install, then run a persistent council → implementer → council loop with a local dashboard, stop control, and human comment injection.

## Relevant ecosystem

### A2A protocol / SDKs

- `@a2a-js/sdk` — official-looking Server & Client SDK for Agent2Agent protocol; repo: `a2aproject/a2a-js`.
- `mcp-a2a-gateway` — bridge between MCP and A2A.
- Other packages: `@lucid-agents/a2a`, `@galdor/a2a`, `tatou`, `agent-chat-cli`.

Use: good protocol layer candidates. They do not by themselves provide the full loop + dashboard + implementer handoff product.

### Claude Code / Codex multi-agent repos

- `Prorise-cool/Claude-Code-Multi-Agent`
- `aaddrick/claude-pipeline`
- `atticus98/codex-turbo`
- `builtbymatti/loop`

Use: strong provider-specific inspiration. They do not solve provider-agnostic A2A/council loop packaging by themselves.

### Dashboards

- `jonathanbossenger/concilium` — local/public multi-agent orchestration dashboard, council of agents.
- `bokiko/openClaw-dashboard`
- `Smilkoski/agent-swarm-dashboard`
- `bripo302-netizen/agent-comm`

Use: UI inspiration. Most are dashboards or framework-specific systems, not a small portable loop harness.

## Product opportunity

A2A Agent Loop should be the minimal bridge:

- small local harness
- provider adapters
- A2A-compatible message envelope
- council synthesis
- implementer handoff
- dashboard and human controls
- safe defaults

## Design conclusion

Build as a local-first Node CLI with no runtime dependencies for the MVP, then add official A2A SDK integration behind an adapter once the core loop is stable.
