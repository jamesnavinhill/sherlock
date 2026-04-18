# AGENTS.md

Repository-specific operating notes for coding/documentation agents.

## 0. Local Environment

- This checkout is intended to be installed and run from Windows, not from WSL/Linux, when the repo lives under `C:\Users\...\projects\sherlock`.
- Do not run local repo dev commands from WSL against `/mnt/<drive>/...` for this repo. That includes `npm install`, `npm ci`, `npm run dev`, `npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`, and similar Node/Vite/Vitest/esbuild/Rollup commands that act on the local checkout.
- WSL is fine for read-only inspection and general shell tools such as `rg`, `sed`, `cat`, `ls`, and `git diff`, as long as they are not running the local app/toolchain.
- If dependencies need repair, run the reinstall from `cmd.exe` or PowerShell in the Windows path instead.
- Linux CI/hosted builds are allowed; this rule is specifically about local work against the Windows-mounted checkout.

## 1. Scope and Boundaries

- Primary active code is under `src/`.
- Active docs are in `README.md` and `docs/*.md`.

## 2. Architecture Anchors

When unsure, start from:

- `src/App.tsx` (app shell + launch pipeline)
- `src/store/workspaceStore.ts` (state contract + persistence orchestration)
- `src/services/runtime.ts` (app-facing runtime facade over the provider router)
- `src/services/providers/index.ts` (provider router)
- `src/components/features/Timeline/*` (chronology derivation, snapshot export, and Timeline UI)
- `src/system/theme/*` (unified theme schema, CSS vars, storage, and legacy migration helpers)
- `src/services/db/*` (SQLite + repositories)

## 3. Data and Persistence

- Core entities persist via wa-sqlite + IndexedDB.
- Do not introduce new persistence pathways without documenting them in `docs/operations/DATA_PERSISTENCE.md`.
- Keep provider key handling in `src/services/providers/keys.ts`.
- Timeline snapshot save/export should continue to reuse the existing artifact persistence path rather than introducing a dedicated timeline store.

## 4. Documentation Rules

- Keep docs in sync with actual code behavior, not intended roadmap.
- Update `README.md` when setup/validation/status changes.
- Update `docs/operations/ARCHITECTURE.md` for structural changes.
- Update `docs/operations/OPERATIONS_RUNBOOK.md` for provider error/fallback changes.
- Update `docs/operations/SCOPES.md` and `docs/operations/SOURCES.md` when scope presets change.

## 5. Validation Expectations

Before finishing non-trivial changes, run the narrowest validation that credibly covers the files and behavior touched in that session.

Default expectation:

- run `npm run lint`
- run `npm run typecheck`
- run the most relevant targeted test command(s) for the changed files or feature area
- run `npm run build` when the change affects shipped app code, bundling, routing, or shared UI/runtime behavior

Do not default to the full Vitest suite if the change is well-scoped and the user did not ask for it.

Run the full test suite (`npm run test`) when:

- the user explicitly asks for the full suite
- the change is cross-cutting or high-risk
- shared infrastructure is touched and targeted coverage would be misleading
- you are not confident the affected surface has adequate targeted coverage

Examples of acceptable targeted validation:

```bash
npm run lint
npm run typecheck
npm run test -- src/components/features/Timeline/timelineEvents.test.ts
npx eslint src/components/features/TimelineView.tsx src/components/features/Timeline/timelineEvents.ts
npm run build
```

If you do not run the full suite, say so explicitly in the handoff/final response.

If any command fails, report exact failing areas.

## 6. Change Hygiene

- Keep edits tightly scoped.
- Avoid destructive git operations.
- Preserve existing naming/style conventions unless refactoring intentionally.
- Favor incremental, auditable changes over broad rewrites.
