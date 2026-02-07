# AGENTS.md

Repository-specific operating notes for coding/documentation agents.

## 1. Scope and Boundaries

- Primary active code is under `src/`.
- Active docs are in `README.md` and `docs/*.md`.
- Treat `docs/_legacy/` as historical; do not modify unless explicitly asked.

## 2. Architecture Anchors

When unsure, start from:

- `src/App.tsx` (app shell + launch pipeline)
- `src/store/caseStore.ts` (state + persistence orchestration)
- `src/services/providers/index.ts` (provider router)
- `src/services/db/*` (SQLite + repositories)

## 3. Data and Persistence

- Core entities persist via wa-sqlite + IndexedDB.
- Do not introduce new persistence pathways without documenting them in `docs/DATA_PERSISTENCE.md`.
- Keep provider key handling in `src/services/providers/keys.ts`.

## 4. Documentation Rules

- Keep docs in sync with actual code behavior, not intended roadmap.
- Update `README.md` when setup/validation/status changes.
- Update `docs/architecture.md` for structural changes.
- Update `docs/OPERATIONS_RUNBOOK.md` for provider error/fallback changes.
- Update `docs/SCOPES.md` and `docs/SOURCES.md` when scope presets change.

## 5. Validation Expectations

Before finishing non-trivial changes, run:

```bash
npm run lint
npm run test
npm run build
```

If any command fails, report exact failing areas.

## 6. Change Hygiene

- Keep edits tightly scoped.
- Avoid destructive git operations.
- Preserve existing naming/style conventions unless refactoring intentionally.
- Favor incremental, auditable changes over broad rewrites.
