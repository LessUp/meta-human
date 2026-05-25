# CLAUDE.md

Use `AGENTS.md` as the canonical repository guide.

## Quick commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test:run
npm run build:pages
```

## Working rules

1. Stay on `master`.
2. Use `@/` imports.
3. Keep `core/` free of React imports.
4. Services should interact with Zustand via `useXStore.getState()`.
5. Every external dependency path needs a fallback.
6. Update only the root `CHANGELOG.md` for project history.
7. Keep GitHub Pages and docs free of changelog-specific navigation.
