# Contributing

## Scope

This guide covers contributions to active docs/code under:

- `src/`
- `docs/operations/`
- root project config files

## Local Setup

```bash
npm install
npm run dev
```

## Validation Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run check:full
```

## Validation Expectations

- Prefer targeted validation during normal development work.
- Run `npm run typecheck` whenever you touch TypeScript source or shared contracts.
- Run the smallest relevant test command(s) that cover the changed files or feature area.
- Add or update focused tests when extraction creates a new route wrapper, controller seam, or pure view-model/helper seam.
- Run `npm run test` only when you need the full suite, the change is broad/high-risk, or a reviewer specifically wants it.
- Run `npm run build` for shipped app changes, routing changes, shared UI/runtime changes, or other changes that could affect production bundling.
- Use `npm run check:full` when you explicitly want the repo-wide Prettier verification pass in addition to the normal static gate.
- If you skip the full test suite, call that out clearly in PR notes or handoff notes.
- Treat bundle review as part of the build step: note any new Vite chunk warning, and explicitly mention the current `vendor-tldraw-app` warning if it changes.

## Pull Request Expectations

1. Keep changes scoped and coherent.
2. Add or update tests when behavior changes.
3. Update docs for user-visible or operational changes.
4. Include command results in PR notes (`lint/test/build`).
5. Include any bundle-warning changes in PR notes when `npm run build` output changes.
6. Avoid unrelated formatting-only churn.

## Code Conventions

- TypeScript + React function components
- Prefer explicit types for shared contracts (`src/types/index.ts`)
- Keep provider logic behind router/adapters (`src/services/providers/*`)
- Prefer the shared runtime-config helpers in `src/components/features/Runs/*` for provider/model/search-depth/thinking-budget/OpenRouter state instead of feature-local copies
- Use store/repository actions for persisted state changes
- Prefer path alias imports via `@/` where already used in a module area

## Documentation Conventions

- Treat `README.md` as onboarding and truth source for setup/runtime status.
- Keep architecture details in `docs/operations/ARCHITECTURE.md`.
- Keep operational incident procedures in `docs/operations/OPERATIONS_RUNBOOK.md`.
- Keep source catalogs in `docs/operations/SOURCES.md` and scope metadata in `docs/operations/SCOPES.md`.
- Keep `docs/operations/DATA_PERSISTENCE.md` aligned with actual backup/restore and cleanup behavior whenever workspace-data scope changes.
- Treat `README.md` plus the active operations docs as the entry points for current repo guidance, and use dated plan/report documents only as bounded execution or findings records.
- Treat `docs/_legacy/*` as historical context only.
