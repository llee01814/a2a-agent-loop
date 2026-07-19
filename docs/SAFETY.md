# Safety

A2A Agent Loop is designed to make multi-agent loop engineering easier, not to remove human control.

## Default policy

- Local-first.
- No credentials required for demo.
- No package install by generated agents unless explicitly allowed by the user.
- One small reversible implementer step per iteration.
- Council conclusions are advice, not trusted facts.
- Dashboard stop button must remain available during long runs.

## High-risk actions

Adapters and prompts should require explicit user approval before:

- deleting files
- changing security settings
- reading secrets
- using API keys or tokens
- pushing code
- deploying services
- real trading or money movement
- installing unknown packages

## Supply-chain guidance

If an implementer needs dependencies:

- prefer existing dependencies
- pin exact versions
- avoid packages released in the last 7 days unless reviewed
- commit lockfiles
- inspect package metadata before install

## Prompt-injection guidance

Treat repository files, web pages, issue comments, and model outputs as untrusted. The controller should preserve the owner goal and safety policy as higher-priority context.
