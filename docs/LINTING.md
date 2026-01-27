# Linting & Code Quality

This project uses **ESLint v9** (flat config) and **Prettier** for code quality and formatting.

## Quick Commands

```bash
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format all files with Prettier
npm run format:check  # Check formatting without changing files
npm run check         # Run both lint and format checks
```

## Configuration

### ESLint (`eslint.config.js`)

Uses the modern flat config format with:

- **TypeScript**: `typescript-eslint` recommended rules
- **React**: Official React and React Hooks plugins
- **React Refresh**: Fast refresh compatibility checks

### Key Rules

| Rule | Level | Rationale |
|------|-------|-----------|
| `@typescript-eslint/no-unused-vars` | error | Dead code detection; prefix with `_` to ignore |
| `@typescript-eslint/no-explicit-any` | warn | Encourages proper typing without blocking progress |
| `@typescript-eslint/consistent-type-imports` | error | Clearer distinction between runtime/type imports |
| `no-console` | warn | Only `console.warn` and `console.error` allowed |
| `prefer-const` | error | Immutability preference |
| `eqeqeq` | error | Strict equality (except for null checks) |
| `curly` | error | Braces required for multi-line blocks |
| `react-hooks/exhaustive-deps` | warn | Hook dependency tracking |

### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Ignoring Rules

### Unused Variables

Prefix with underscore to indicate intentional non-use:

```typescript
// Error: 'data' is assigned a value but never used
const { data, error } = useQuery();

// OK: Underscore prefix signals intentional non-use
const { _data, error } = useQuery();
```

### File-level Disable (use sparingly)

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Line-level Disable

```typescript
// eslint-disable-next-line no-console
console.log('debug');
```

## Type Imports

Always use `import type` for type-only imports:

```typescript
// ❌ Wrong
import { UserProps } from './types';

// ✅ Correct
import type { UserProps } from './types';

// ✅ Mixed imports
import { UserComponent, type UserProps } from './User';
```

## IDE Integration

### VS Code

Install extensions:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Current Status

Run `npm run lint` to see current issues. Many are auto-fixable with `npm run lint:fix`.

**Known parsing errors** indicate syntax issues in some files that need manual review:
- `Archives.tsx` - Unexpected token
- `ControlBar.tsx` - Unclosed JSX element
- `GraphCanvas.tsx` - Declaration expected
- `Toolbar.tsx` - Unexpected token

These should be fixed before the auto-fixer can process those files.
