# Sherlock AI

Sherlock AI is a React + TypeScript OSINT investigation workspace for running AI-assisted investigations, tracking leads, and organizing reports into case files.

## What It Does

- Runs investigations through a provider router (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- Maintains a unified launch pipeline across Finder, Operation View, Live Monitor, and Network Graph
- Stores case/report/task data in browser-persistent SQLite (wa-sqlite + IndexedDB)
- Supports deep dives, headline-to-investigation launches, entity graph workflows, and export tooling (HTML/Markdown/JSON)
- Provides scope-driven investigation presets and persona templates

## UI Areas

- `Operation View`: report reading, lead deep dives, case dossier, inspector panel
- `Network Graph`: D3 graph with manual nodes/links, flag/hide, entity resolution
- `Live Monitor`: live intel scans, filtering, and headline persistence
- `Case Files`: archive browsing, deletion, and exports
- `Finder`: anomaly scanning and investigation wizard launch
- `System Config`: provider/model keys, scope/template management, data import/export

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Zustand for app state orchestration
- Drizzle ORM + wa-sqlite (SQLite in browser via IndexedDB VFS)
- Tailwind CSS v4 (PostCSS pipeline)
- D3.js v7 for graph rendering
- Vitest + Testing Library

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- At least one provider key (Gemini/OpenRouter/OpenAI/Anthropic)

### Install and Run

```bash
npm install
npm run dev
```

Dev server defaults to `http://localhost:3000`.

### Provider Configuration

Configure keys in either:

1. UI: `System Config -> AI`
2. Env file: copy `.env.example` to `.env.local`

Supported env vars:

- `VITE_GEMINI_API_KEY`
- `VITE_OPENROUTER_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (fallback)
- `ANTHROPIC_API_KEY` (fallback)

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run check
```

## Current Validation Snapshot (February 7, 2026)

- `npm run build`: passes
- `npm run test`: test files pass, but Vitest reports an unhandled worker-start timeout for `src/services/providers/router.test.ts`
- `npm run lint`: fails on existing repo issues (not docs-related), including:
  - `react-hooks/set-state-in-effect` in `src/App.tsx`
  - `prefer-const` and unused args in `src/services/db/client.ts`
  - `@typescript-eslint/no-empty-object-type` in `src/services/gemini.ts`

## Documentation Index

- `docs/ARCHITECTURE.md`
- `docs/BROAD_SCOPE.md`
- `docs/SCOPES.md`
- `docs/DATA_PERSISTENCE.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/SOURCES.md`
- `docs/LINTING.md`
- `docs/CONTRIBUTING.md`

## License

MIT
