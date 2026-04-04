# Sherlock AI

Sherlock AI is a React + TypeScript knowledge workspace for AI-assisted investigations, research, monitoring, and structured reporting across multiple domains.

## What It Does

- Runs structured analysis through a provider router (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- Runs workspace-grounded chat through the same provider router with persisted sessions, message history, streaming output, and stop support
- Maintains a unified launch pipeline across Finder, Operation View, Live Monitor, Network Graph, and chat follow-up flows
- Resolves built-in domain packs and purpose profiles into run metadata and prompt behavior
- Stores workspace/artifact/workspace-run data in browser-persistent SQLite (wa-sqlite + IndexedDB)
- Supports typed artifact sections, deep dives, headline-to-analysis launches, entity graph workflows, chat transcript export, guided run building, and artifact/workspace export tooling (HTML/Markdown/JSON)
- Provides scope-driven domain packs, purpose-aware launch setup, built-in starters, personas, and reusable templates
- Adapts launch copy, labels, and output defaults by pack and purpose while using `Workspace`, `Artifact`, and `WorkspaceRun` as the primary runtime model
- Exports and restores workspace-data backups for workspaces, artifacts, runs, chat history, templates, manual graph data, and saved signals without bundling device-local app preferences or API keys

## UI Areas

- `Operation View`: artifact reading, purpose-ordered typed-section rendering, dossier, inspector panel
- `Timeline`: workspace chronology across saved signals, runs, artifacts, opt-in entity milestones, chat sessions, and high-signal chat actions, with lineage focus chips, exact-session jump-through into workspace chat, and Timeline snapshot export/save actions
- `Workspace Chat`: dedicated chat sessions grounded in the active workspace with transcript copy/export, retrieval pinning, save/append actions, follow-up launches, guided run mode, and launch-into-chat handoff from Operation View, Archives, and Network Graph
- `Network Graph`: D3 graph with manual nodes/links, concept/source-aware graph nodes, flag/hide, entity resolution
- `Live Monitor`: live signal scans, filtering, and headline persistence
- `Case Files`: workspace/archive browsing, deletion, and exports
- `Finder`: discovery scanning and analysis launch
- `System Config`: provider/model keys, scope/template management, workspace-data import/export

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
npm ci --include=optional
npm run dev
```

Dev server defaults to `http://localhost:3000`.

If you hit a Rollup native package error because an optional native package was skipped, delete `node_modules` and repair the local install with:

```bash
npm ci --include=optional
```

For this checkout, keep installs and script runs in the same environment. If you work in WSL, install and run from WSL rather than mixing Windows-side and WSL-side `node_modules`.

### Provider Configuration

Configure keys in either:

1. UI: `System Config -> AI`
2. Env file: copy `.env.example` to `.env.local`

For public or shared-hosting deployments, keep Sherlock in strict BYOK mode:

- do not set shared provider API keys in Vercel
- do not rely on `VITE_*` provider env vars for a public site
- have each user enter their own key in `System Config -> AI`

Supported env vars:

- `VITE_GEMINI_API_KEY`
- `VITE_OPENROUTER_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (fallback)
- `ANTHROPIC_API_KEY` (fallback)

## Vercel Deployment

Sherlock deploys cleanly to Vercel as a static Vite app.

- No server database is required for the current runtime model.
- Workspace and artifact data stay in the browser via SQLite over IndexedDB.
- API keys stay browser-local when users add them through `System Config -> AI`.
- Each origin has its own local data, so Vercel preview URLs do not share storage with production.
- If `public/seeds/demo-workspace.json` exists, an empty browser profile will import it once on first load for demo browsing. The seed file can be either a full workspace-data backup from `Settings -> Data` or a workspace export JSON produced from archive export actions.

Recommended flow:

1. Import the GitHub repo into Vercel.
2. Let Vercel use the repo `vercel.json` or set `npm ci --include=optional`, `npm run build`, and `dist` manually.
3. Optionally place either a canonical workspace-data backup or a workspace export JSON at `public/seeds/demo-workspace.json` if you want first-time visitors to land in a pre-seeded demo workspace.
4. Leave provider env vars unset in Vercel for public BYOK hosting.
5. Deploy and have each user add their own provider key in-app if they want to run new analysis or chat.

See `docs/operations/DEPLOYMENT.md` for the full checklist.

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
- targeted Vitest coverage passes for Timeline derivation/snapshot behavior, workspace-data maintenance helpers, `caseStore`, `ChatRepository`, and `WorkspaceSearchRepository`
- `npm run build`: passes
- `npm run test`: attempted for the full suite, but timed out in this environment after partial progress

## Documentation Index

- `docs/reports/CURRENT_STATUS.md`
- `docs/plans/01-canonical-runtime-cutover-plan.md`
- `docs/operations/architecture.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/operations/DEPLOYMENT.md`
- `docs/operations/SCOPES.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/SOURCES.md`
- `docs/operations/LINTING.md`
- `docs/operations/CONTRIBUTING.md`

Historical plans and reports live under `docs/_legacy/`.

## License

MIT
