# Sherlock AI

Sherlock AI is a React + TypeScript knowledge workspace for AI-assisted investigations, research, monitoring, and structured reporting across multiple domains.

## What It Does

- Runs structured analysis through a provider router (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- Maintains a unified launch pipeline across Finder, Operation View, Live Monitor, and Network Graph
- Resolves built-in domain packs and purpose profiles into run metadata and prompt behavior
- Stores workspace/artifact/task data in browser-persistent SQLite (wa-sqlite + IndexedDB)
- Supports typed artifact sections, deep dives, headline-to-analysis launches, entity graph workflows, and export tooling (HTML/Markdown/JSON)
- Provides scope-driven domain packs, personas, and templates

## UI Areas

- `Operation View`: artifact reading, deep dives, case dossier, inspector panel
- `Network Graph`: D3 graph with manual nodes/links, flag/hide, entity resolution
- `Live Monitor`: live signal scans, filtering, and headline persistence
- `Case Files`: archive browsing, deletion, and exports
- `Finder`: anomaly scanning and analysis launch
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

## Current Validation Snapshot (April 3, 2026)

- `npm run lint`: passes
- `npm run test`: fails before test execution because Rollup's native optional package `@rollup/rollup-linux-x64-gnu` is missing from `node_modules`
- `npm run build`: fails for the same missing Rollup native dependency

## Documentation Index

- `docs/operations/architecture.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/operations/SCOPES.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/SOURCES.md`
- `docs/operations/LINTING.md`
- `docs/operations/CONTRIBUTING.md`

## License

MIT
