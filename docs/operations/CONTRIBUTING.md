# Contributing

## Scope

This guide covers contributions to active docs/code under:

- `src/`
- `docs/operations/`
- root project config files

## Local Setup

```bash
npm ci --include=optional
npm run dev
```

## Validation Commands

```bash
npm run lint
npm run test
npm run build
npm run check
```

## Validation Expectations

- Prefer targeted validation during normal development work.
- Run the smallest relevant test command(s) that cover the changed files or feature area.
- Run `npm run test` only when you need the full suite, the change is broad/high-risk, or a reviewer specifically wants it.
- Run `npm run build` for shipped app changes, routing changes, shared UI/runtime changes, or other changes that could affect production bundling.
- If you skip the full test suite, call that out clearly in PR notes or handoff notes.

## Pull Request Expectations

1. Keep changes scoped and coherent.
2. Add or update tests when behavior changes.
3. Update docs for user-visible or operational changes.
4. Include command results in PR notes (`lint/test/build`).
5. Avoid unrelated formatting-only churn.

## Code Conventions

- TypeScript + React function components
- Prefer explicit types for shared contracts (`src/types/index.ts`)
- Keep provider logic behind router/adapters (`src/services/providers/*`)
- Use store/repository actions for persisted state changes
- Prefer path alias imports via `@/` where already used in a module area

## Documentation Conventions

- Treat `README.md` as onboarding and truth source for setup/runtime status.
- Keep the active implementation checkpoint in `docs/operations/CURRENT_STATUS.md`.
- Keep architecture details in `docs/operations/architecture.md`.
- Keep operational incident procedures in `docs/operations/OPERATIONS_RUNBOOK.md`.
- Keep source catalogs in `docs/operations/SOURCES.md` and scope metadata in `docs/operations/SCOPES.md`.
- Keep `docs/operations/DATA_PERSISTENCE.md` aligned with actual backup/restore and cleanup behavior whenever workspace-data scope changes.
- Treat `docs/_legacy/*` as historical context only.
