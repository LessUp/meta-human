---
name: verify
description: Run lint, typecheck, and tests to verify changes are correct. Use after making code changes to ensure quality.
---

Run the full verification suite for this project:

```bash
npm run lint && npm run typecheck && npm run test:run
```

This checks:
1. **ESLint** - Code quality and style issues
2. **TypeScript** - Type errors (note: strict mode is off in this project)
3. **Vitest** - Unit tests

If any step fails, report the errors and suggest fixes.
