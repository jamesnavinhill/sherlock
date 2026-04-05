# Linting and Formatting

## Tooling

- ESLint 9 (flat config): `eslint.config.js`
- Prettier 3: `.prettierrc`

## Commands

```bash
npm run lint
npm run lint:fix
npm run typecheck
npm run format
npm run format:check
npm run check
npm run check:full
```

## Scope

Current scripts are repo-wide:

- `lint`: `eslint src/`
- `typecheck`: `tsc --noEmit`
- `format`: `prettier --write .`
- `check`: static validation (`lint` + `typecheck`)
- `check:full`: static validation plus `format:check`

## Rule Highlights

From `eslint.config.js`:

- `@typescript-eslint/no-unused-vars`: error (`^_` allowed)
- `@typescript-eslint/no-explicit-any`: warning
- `@typescript-eslint/consistent-type-imports`: error
- `react-refresh/only-export-components`: warning
- `no-console`: warning (`warn` + `error` allowed)
- `prefer-const`, `no-var`, `eqeqeq`, `curly`: error

## Current Status (April 5, 2026)

- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run build`: passes
- targeted Vitest coverage for provider router dispatch: passes
- `npm run test`: not run as a full suite in this validation pass

## Suggested Lint Workflow

1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Apply safe autofixes with `npm run lint:fix`.
4. Resolve remaining errors manually.
5. Re-run `npm run lint` and `npm run typecheck` until clean.
6. Run `npm run test` and `npm run build` before merging.
7. Run `npm run check:full` when you specifically want repo-wide Prettier verification too.

## Install Troubleshooting

If `npm run test` or `npm run build` fails with a Rollup native dependency error such as missing `@rollup/rollup-linux-x64-gnu`, the issue is usually an inconsistent local `node_modules` tree rather than an application regression.

Preferred recovery:

```bash
rm -rf node_modules
npm ci --include=optional
```

Notes:

- prefer `npm ci --include=optional` over `npm install` for clean local restores
- keep installs and command execution in one environment per clone
- for this repo, avoid mixing Windows-side installs with WSL-side execution
