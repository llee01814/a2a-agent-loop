# v0.2 Provider Presets

A2A Agent Loop v0.2 introduces generated provider presets. They are deliberately safe placeholders: they create the right council/implementer shape, but they do not silently execute real coding agents with broad permissions.

## List presets

```bash
a2a-loop presets
```

## Generate config

```bash
a2a-loop init --preset mock
```

```bash
a2a-loop init --preset codex
```

```bash
a2a-loop init --preset claude-code
```

```bash
a2a-loop init --preset openclaw
```

```bash
a2a-loop init --preset hermes
```

```bash
a2a-loop init --preset mixed
```

## Replace placeholders

Each generated `command` agent uses a shell placeholder such as:

```json
["sh", "-lc", "printf '%s\\n' 'codex/architect preset placeholder...'"]
```

Replace it with your real agent command once you have reviewed the permission model.

## Recommended provider commands

These are examples only. Confirm flags against your local CLI version.

### Codex CLI

```json
["codex", "exec", "--ask-for-approval", "on-request", "Read A2A_AGENT_LOOP_INPUT and respond with a concise review."]
```

### Claude Code

```json
["claude", "-p", "Read A2A_AGENT_LOOP_INPUT and respond with a concise review."]
```

### OpenClaw

```json
["openclaw", "run", "Read A2A_AGENT_LOOP_INPUT and respond with a concise review."]
```

### Hermes

```json
["hermes", "ask", "Read A2A_AGENT_LOOP_INPUT and respond with a concise review."]
```

## Safety floor

- one small reversible step per iteration
- destructive actions require human approval
- never print or request secrets
- preserve dashboard stop path
