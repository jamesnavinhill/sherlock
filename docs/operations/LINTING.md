# Linting and Formatting

## Tooling

- ESLint 9 (flat config): `eslint.config.js`
- Prettier 3: `.prettierrc`

## Commands

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run check
```

## Scope

Current scripts target `src/`:

- `lint`: `eslint src/`
- `format`: `prettier --write src/`

If you need repo-wide lint/format behavior, update scripts intentionally in `package.json`.

## Rule Highlights

From `eslint.config.js`:

- `@typescript-eslint/no-unused-vars`: error (`^_` allowed)
- `@typescript-eslint/no-explicit-any`: warning
- `@typescript-eslint/consistent-type-imports`: error
- `react-refresh/only-export-components`: warning
- `no-console`: warning (`warn` + `error` allowed)
- `prefer-const`, `no-var`, `eqeqeq`, `curly`: error

## Current Status (April 3, 2026)

`npm run lint` currently reports:

Errors:

1. `react-hooks/preserve-manual-memoization` in `src/components/ui/TaskSetupModal.tsx`
2. `react-hooks/set-state-in-effect` in `src/components/ui/TaskSetupModal.tsx` (3 occurrences)

Warnings:

1. `@typescript-eslint/no-non-null-assertion` in `src/components/features/OperationView/ReportViewer.tsx`

## Suggested Lint Workflow

1. Run `npm run lint`.
2. Apply safe autofixes with `npm run lint:fix`.
3. Resolve remaining errors manually.
4. Re-run `npm run lint` until clean.
5. Run `npm run test` and `npm run build` before merging.
