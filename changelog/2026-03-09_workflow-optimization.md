# 2026-03-09 Workflow optimization

## Summary

Added a standardized GitHub Pages deployment workflow for this repository.

## Changes

- Added `.github/workflows/pages.yml`
- Standardized triggers for `push` and `workflow_dispatch`
- Added Node.js build + GitHub Pages artifact upload
- Added Pages deploy job using `actions/deploy-pages@v4`
