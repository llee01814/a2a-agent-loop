# Contributing

Thank you for helping make multi-agent loop engineering easier.

## Development

```bash
npm test
npm run check
npm run demo
```

## Pull request expectations

- Keep default demo local-first and credential-free.
- Add tests for controller, store, or adapter changes.
- Do not add runtime dependencies unless clearly justified.
- Document new provider adapters in `docs/ARCHITECTURE.md`.
- Preserve the stop/comment control path.

## Security

Do not submit examples that require real secrets. Use placeholders and document required scopes separately.
