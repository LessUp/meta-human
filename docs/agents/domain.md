# Domain Docs

This repo uses a **single-context** layout for domain documentation.

## Location

| Doc            | Path                     | Purpose                                        |
| -------------- | ------------------------ | ---------------------------------------------- |
| Domain context | `CONTEXT.md` (repo root) | Project domain language, terminology, concepts |
| ADRs           | `docs/adr/`              | Architectural Decision Records                 |

## Consumer Rules

Skills that read domain docs should:

1. **Read `CONTEXT.md` first** — if it exists, use it to understand domain language before making changes
2. **Check `docs/adr/`** — read relevant ADRs before making architectural decisions
3. **Update as needed** — if domain concepts crystallize during work, update `CONTEXT.md`; if an architectural decision is made, create an ADR

## If Missing

If `CONTEXT.md` doesn't exist, skills will proceed without domain context. Consider creating one to capture:

- Core domain concepts and terminology
- Bounded contexts and their relationships
- Ubiquitous language used by the team

If `docs/adr/` doesn't exist, skills will proceed without historical context. Consider creating it for significant decisions.
