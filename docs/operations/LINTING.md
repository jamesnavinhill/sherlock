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

- `npm run lint`: passes
- targeted Vitest coverage for Timeline/store/maintenance/repository changes: passes
- `npm run build`: passes
- `npm run test`: attempted for the full suite, but timed out in this environment after partial progress

## Suggested Lint Workflow

1. Run `npm run lint`.
2. Apply safe autofixes with `npm run lint:fix`.
3. Resolve remaining errors manually.
4. Re-run `npm run lint` until clean.
5. Run `npm run test` and `npm run build` before merging.

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
