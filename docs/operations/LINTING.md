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

## Current Status (February 7, 2026)

`npm run lint` currently reports:

Errors:

1. `react-hooks/set-state-in-effect` in `src/App.tsx`
2. `prefer-const` in `src/services/db/client.ts`
3. `@typescript-eslint/no-unused-vars` in `src/services/db/client.ts`
4. `@typescript-eslint/no-empty-object-type` in `src/services/gemini.ts` (2 occurrences)

Warnings:

1. `react-refresh/only-export-components` in `src/components/features/NetworkGraph/EntityResolution.tsx`
2. `no-console` in `src/services/providers/shared/logging.ts`

## Suggested Lint Workflow

1. Run `npm run lint`.
2. Apply safe autofixes with `npm run lint:fix`.
3. Resolve remaining errors manually.
4. Re-run `npm run lint` until clean.
5. Run `npm run test` and `npm run build` before merging.
