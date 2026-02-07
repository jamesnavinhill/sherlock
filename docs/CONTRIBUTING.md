# Contributing

## Scope

This guide covers contributions to active docs/code under:

- `src/`
- `docs/` (excluding `docs/_legacy/`)
- root project config files

Do not rewrite or delete `docs/_legacy/*` unless explicitly requested.

## Local Setup

```bash
npm install
npm run dev
```

## Validation Commands

```bash
npm run lint
npm run test
npm run build
npm run check
```

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
- Keep architecture details in `docs/architecture.md`.
- Keep operational incident procedures in `docs/OPERATIONS_RUNBOOK.md`.
- Keep source catalogs in `docs/SOURCES.md` and scope metadata in `docs/SCOPES.md`.

## Known Baseline Issues (As of February 7, 2026)

Current repository baseline includes existing lint/test friction not caused by docs:

- Lint: 5 errors + 2 warnings
- Tests: suite passes, but Vitest reports an unhandled worker timeout for `src/services/providers/router.test.ts`

If you resolve these, include exact changes and updated command output in the PR.
