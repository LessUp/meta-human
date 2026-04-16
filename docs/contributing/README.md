# Contributing Guide

Thank you for your interest in contributing to MetaHuman Engine!

---

## Ways to Contribute

### 🐛 Bug Reports

Found a bug? Please create an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Screenshots/recordings if applicable

### 💡 Feature Requests

Have an idea? Open an issue with:

- Use case description
- Proposed solution
- Alternatives considered

### 📝 Code Contributions

Want to fix a bug or add a feature? Follow the workflow below.

### 📚 Documentation

Improvements to docs, README, or code comments are always welcome.

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/your-username/meta-human.git
cd meta-human
git remote add upstream https://github.com/LessUp/meta-human.git
```

### 2. Install Dependencies

```bash
# Frontend
npm install

# Backend (optional)
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 3. Create Branch

```bash
git checkout -b feat/your-feature-name
# or: git checkout -b fix/bug-description
```

---

## Code Standards

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

**Examples:**

```bash
feat(avatar): add wave animation trigger
docs(api): update WebSocket documentation
fix(dialogue): resolve memory leak in stream
```

### TypeScript Standards

**Naming:**
- `PascalCase` for components, types, interfaces
- `camelCase` for functions, variables
- `SCREAMING_SNAKE_CASE` for constants

**Imports:**
```typescript
// 1. External imports
import React from 'react';

// 2. Internal absolute imports
import { Button } from '@/components/ui/Button';

// 3. Internal relative imports
import { helper } from './utils';
```

**Comments:**
```typescript
// Good: Explains why, not what
// Retry with exponential backoff for network resilience
await retry(operation, { delay: 1000 * attempts });

// Bad: Restates the code
// Multiply delay by attempts
delay = 1000 * attempts;
```

### Code Style

The project uses automated formatting:

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint
npm run lint

# Fix lint issues
npm run lint:fix
```

---

## Testing

### Run Tests

```bash
# Watch mode
npm run test

# Single run
npm run test:run

# With coverage
npm run test:coverage
```

### Writing Tests

**Component Example:**

```typescript
import { render, screen } from '@testing-library/react';
import { ChatDock } from './ChatDock';

describe('ChatDock', () => {
  it('renders input field', () => {
    render(<ChatDock />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });
});
```

**Hook Example:**

```typescript
import { renderHook } from '@testing-library/react';
import { useChatStream } from './useChatStream';

describe('useChatStream', () => {
  it('sends message successfully', async () => {
    const { result } = renderHook(() => useChatStream());
    await result.current.sendMessage('Hello');
    expect(result.current.messages).toHaveLength(1);
  });
});
```

---

## Pull Request Process

### 1. Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass: `npm run test:run`
- [ ] Linting passes: `npm run lint`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Commits follow conventional format
- [ ] Documentation updated if needed

### 2. Create PR

1. Push branch to your fork
2. Open PR against `main` branch
3. Fill out PR template
4. Link related issues

### 3. PR Review

- Maintainers will review within 48 hours
- Address review comments
- Keep PR focused on single concern

### 4. Merge

Once approved, a maintainer will merge your PR.

---

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Primitive UI components
│   ├── forms/          # Form-specific components
│   └── panels/         # Panel/layout components
├── core/               # Business logic
│   ├── avatar/         # 3D avatar engine
│   ├── audio/          # TTS/ASR
│   ├── dialogue/       # Chat services
│   └── vision/         # Face tracking
├── store/              # State management
├── hooks/              # Custom React hooks
├── lib/                # Utilities
├── types/              # TypeScript types
└── __tests__/          # Tests
```

---

## Adding New Features

### New Component

1. Create file: `components/ComponentName.tsx`
2. Add styles (Tailwind classes)
3. Add types if complex props
4. Write tests
5. Export from `components/index.ts`

### New Hook

1. Create file: `hooks/useHookName.ts`
2. Follow existing hook patterns
3. Add JSDoc comments
4. Write tests
5. Export from `hooks/index.ts`

### New Store

1. Create file: `store/storeName.ts`
2. Use Zustand pattern
3. Define TypeScript interfaces
4. Add persistence if needed
5. Document public API

---

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Send a chat message and receive streaming response
 * @param message - User's message text
 * @param options - Streaming callbacks
 * @returns Promise that resolves when stream completes
 * @throws {ChatError} When transport fails
 */
async function streamMessage(
  message: string,
  options: StreamOptions
): Promise<void>
```

### README Updates

When adding features:
- Update main README.md if user-facing
- Add to docs/ if API changes
- Update CHANGELOG.md

---

## Community

### Communication Channels

- **Issues:** Bug reports, feature requests
- **Discussions:** Questions, ideas, show-and-tell
- **Pull Requests:** Code contributions

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect differing viewpoints

---

## Questions?

- Check existing [issues](https://github.com/LessUp/meta-human/issues)
- Start a [discussion](https://github.com/LessUp/meta-human/discussions)
- Ask in your PR/issue

---

<p align="center">
  Thank you for contributing to MetaHuman Engine! 🎉
</p>
