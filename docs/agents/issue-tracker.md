# Issue Tracker: GitHub

This repo uses GitHub Issues for tracking work.

## Location

`https://github.com/LessUp/meta-human/issues`

## CLI

Uses `gh` CLI for all issue operations:

- Create issue: `gh issue create`
- View issue: `gh issue view <number>`
- List issues: `gh issue list`
- Close issue: `gh issue close <number>`
- Add label: `gh issue edit <number> --add-label <label>`

## Prerequisites

- `gh` CLI must be installed and authenticated
- Run `gh auth status` to verify authentication

## Labels

Labels are managed via GitHub's web UI or `gh issue edit --add-label/--remove-label`.

See `triage-labels.md` for the label vocabulary used by triage workflows.
