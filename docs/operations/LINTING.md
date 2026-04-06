# Validation, Linting, and Formatting

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

## Current Status (April 6, 2026)

Slice-7 closeout sweep on this checkout:

- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run test`: passes
- `npm run build`: passes
- route-aware tests now opt into the React Router future flags, so the prior warning noise is gone
- provider-router contract tests still emit expected `[provider-router]` debug logs during coverage
- Vite still emits one known chunk warning for `vendor-tldraw-app`

## Bundle Review Checkpoint

Use this checklist whenever `npm run build` is part of the validation gate:

1. Confirm the build completes successfully.
2. Scan the build log for Vite chunk warnings.
3. Treat any new warning as a regression until it is explained or reduced.
4. The one currently known warning is `vendor-tldraw-app` crossing the configured `500 kB` warning threshold in `vite.config.ts`.
5. If that warning changes materially or a second chunk starts warning, call it out explicitly in the handoff or PR notes.

## Suggested Lint Workflow

1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Apply safe autofixes with `npm run lint:fix`.
4. Resolve remaining errors manually.
5. Re-run `npm run lint` and `npm run typecheck` until clean.
6. Run `npm run test` and `npm run build` before merging.
7. Review the build log against the bundle checkpoint above.
8. Run `npm run check:full` when you specifically want repo-wide Prettier verification too.

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
