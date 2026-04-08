# Sherlock AI

Sherlock AI is a React + TypeScript knowledge workspace for AI-assisted investigations, research, monitoring, and structured reporting across multiple domains.

## What It Does

- Runs structured analysis through a provider router (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- Uses a capability-aware model registry with direct-provider defaults plus a dynamic OpenRouter catalog (bundled snapshot, local cache, live refresh, curated quick picks, and manual slug entry)
- Runs workspace-grounded chat through the same provider router with persisted sessions, message history, streaming output, and stop support
- Exposes one shared header omnibox for routes, workspaces, saved timeline views, artifacts, items, chats, runs, and signals, with durable recent destinations plus in-context board/timeline/network/files focus and chat/board/timeline/network/files handoff actions
- Provides a dedicated multi-board research workspace built on `tldraw`, with a canonical library for artifacts, entities, sources, signals, notes, links, files/media, and promoted chat excerpts
- Executes Sherlock board-agent sessions through an approval-first review sheet that previews planned actions, supports an auto-approve toggle for low-risk organization moves, and leaves auditable action receipts for completed, skipped, failed, and queued follow-up work
- Supports OpenRouter server-side web search via `openrouter:web_search` with configurable engine, result limits, context size, and domain filters
- Maintains a unified launch pipeline across Finder, Operation View, Live Monitor, Network Graph, and chat follow-up flows
- Keeps `/workspaces/:workspaceId` as a lightweight workspace-home overview with canonical counts, recent activity, saved timeline views, and direct handoff links into artifact/chat/board/timeline/network/files workflows
- Resolves built-in domain packs and purpose profiles into run metadata and prompt behavior
- Stores workspace/artifact/workspace-run data in browser-persistent SQLite (wa-sqlite + IndexedDB)
- Supports typed artifact sections, evidence records, provenance metadata, first-class follow-up records, methodology blocks, deep dives, signal-grounded launches, entity graph workflows, workspace board composition, chat transcript export, guided run building, and artifact/workspace export tooling (HTML/Markdown/JSON)
- Provides scope-driven domain packs, purpose-aware launch setup, built-in starters, personas, and reusable templates
- Adapts launch copy, labels, and output defaults by pack and purpose while using `Workspace`, `Artifact`, and `WorkspaceRun` as the primary runtime model
- Uses canonical top-level shell nouns (`Workspace`, `Artifact`, `Run`, `Signal`, `Source`, `Item`) while keeping pack/purpose-specific copy inside artifact content and guided flows
- Separates workspace display identity from launch metadata so top-level chrome uses a clean workspace title while prompts and summaries retain `launchTopic`, `launchAngle`, and priority-source context
- Supports hybrid artifact generation modes with a global default plus per-run overrides (`SINGLE_PASS` vs `STAGED`)
- Exports and restores workspace-data backups for workspaces, artifacts, runs, chat history, research boards, canonical workspace items, templates, manual graph data, and saved signals without bundling device-local app preferences or API keys

## UI Areas

- `Operation View`: artifact reading with artifact-type-aware summary highlights, provenance-at-a-glance strip, inline evidence cues, route-backed section/evidence focus, purpose-ordered typed-section rendering, dossier, and a current-artifact/entity/signal inspector panel
- `Task Setup + Guided Run Builder`: pack/purpose-aware setup, provider/model selection, OpenRouter browser, generation mode override, starter prompts, template save/apply
- `Board`: multi-board canvas with canonical library placement, note/link/file ingestion, promoted chat excerpts, presentation mode, manual AI helpers, and a board-agent inspector that supports starter intents, approval-first plan review, low-risk auto-approve, todos, action receipts/history, cancellation, and cross-links back into artifacts, timeline, graph, and chat
- `Timeline`: workspace chronology across saved signals, runs, artifacts, canonical item creation/promotion/update/reuse events, opt-in entity milestones, chat sessions, and high-signal chat actions, with lineage focus chips, exact-session jump-through into workspace chat, item-aware Files/source/board/chat actions, Timeline snapshot export/save actions, and durable saved views that reopen through the omnibox
- `Chat`: dedicated chat sessions grounded in the active workspace with transcript copy/export, retrieval pinning, inline `@` mention references for canonical workspace records that reopen focused workspace surfaces, excerpt promotion into the canonical library, board handoff, save/append actions, follow-up launches, guided run mode, and launch-into-chat handoff from Operation View, Files, and Network Graph
- `Workspace Home`: lightweight workspace overview with summary counts, recent activity, saved timeline views, workspace context, and quick handoff links into artifact/chat/board/timeline/network/files
- `Network Graph`: D3 graph with manual nodes/links, concept/source-aware graph nodes, flag/hide, entity resolution, board handoff for artifacts/entities/signals, and an overlaying dossier rail that no longer shifts graph content
- `Live Monitor`: live signal scans, filtering, save/persist actions, feeder-style CTAs into synthesis, and motion reserved for active monitoring states
- `Files`: workspace/archive browsing across artifacts and canonical workspace items, with dense list/grid modes, direct deep-link item focus, direct chat, board, source-link, deletion, export actions, and a controller/section split that keeps the surface aligned to the shared feature extraction pattern
- `Finder`: discovery scanning and analysis launch
- `Settings`: provider/model keys, generation defaults, OpenRouter search controls, scope/template management, workspace-data import/export, and a vertically stacked runtime/theme workbench aligned to the shared chrome contract

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

1. UI: `Settings -> Runtime`
2. Env file: copy `.env.example` to `.env.local`

For public or shared-hosting deployments, keep Sherlock in strict BYOK mode:

- do not set shared provider API keys in Vercel
- do not rely on `VITE_*` provider env vars for a public site
- have each user enter their own key in `Settings -> Runtime`

Supported env vars:

- `VITE_GEMINI_API_KEY`
- `VITE_OPENROUTER_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `VITE_TLDRAW_LICENSE_KEY`
- `OPENAI_API_KEY` (fallback)
- `ANTHROPIC_API_KEY` (fallback)

Notes:

- `VITE_TLDRAW_LICENSE_KEY` is app-level config for Sherlock's `tldraw` board surface on `tldraw 4.x`
- unlike provider API keys, it is not entered in `Settings -> Runtime`
- for hosted deployments such as Vercel, set it in project env vars and redeploy

## Vercel Deployment

Sherlock deploys cleanly to Vercel as a static Vite app.

- No server database is required for the current runtime model.
- Workspace and artifact data stay in the browser via SQLite over IndexedDB.
- API keys stay browser-local when users add them through `Settings -> Runtime`.
- Each origin has its own local data, so Vercel preview URLs do not share storage with production.
- If `public/seeds/demo-workspace.json` exists, an empty browser profile will import it once on first load for demo browsing. The seed file can be either a full workspace-data backup from `Settings -> Data` or a workspace export JSON produced from archive export actions.

Recommended flow:

1. Import the GitHub repo into Vercel.
2. Let Vercel use the repo `vercel.json` or set `npm ci --include=optional`, `npm run build`, and `dist` manually.
3. Optionally place either a canonical workspace-data backup or a workspace export JSON at `public/seeds/demo-workspace.json` if you want first-time visitors to land in a pre-seeded demo workspace.
4. Leave provider env vars unset in Vercel for public BYOK hosting.
5. Set `VITE_TLDRAW_LICENSE_KEY` in Vercel if the deployment uses Sherlock's `tldraw 4.x` board.
6. Deploy and have each user add their own provider key in-app under `Settings -> Runtime` if they want to run new analysis or chat.

See `docs/operations/DEPLOYMENT.md` for the full checklist.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
npm run lint:fix
npm run typecheck
npm run format
npm run format:check
npm run check
npm run check:full
```

`npm run check` now covers the fast static gate (`lint` + `typecheck`). Use `npm run check:full` when you also want the repo-wide Prettier verification pass across app code, docs, and config files.

## Current Validation Snapshot (April 8, 2026)

The current targeted validation for the completed Stream 4 search/files/timeline cleanup passed on this checkout:

- `npm run test -- src/services/workspace/workspaceHandoffs.test.ts src/services/chat/launchContext.test.ts src/components/features/Chat/chatPageUtils.test.ts src/app/appShellOpenChatHelpers.test.ts src/app/openChatRequest.test.ts src/components/features/Files.launch.test.tsx src/components/ui/omniboxModel.test.ts src/components/features/Timeline/timelineEvents.test.ts src/components/features/Timeline/useTimelineViewController.test.ts src/services/workspace/library.test.ts`: passes
- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run build`: passes
- the full repo-wide `npm run test` suite was not rerun as part of this scoped validation pass
- Vite still emits one large-chunk warning for `vendor-tldraw-app`; this remains a documented exception and review checkpoint

## Documentation Index

- `docs/operations/ARCHITECTURE.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/operations/DEPLOYMENT.md`
- `docs/operations/SCOPES.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/SOURCES.md`
- `docs/operations/LINTING.md`
- `docs/operations/CONTRIBUTING.md`
- `docs/plans/10-canonical-cleanup-roadmap.md`
- `docs/reports/2026-04-08-codebase-audit.md`

Historical plans and reports live under `docs/_legacy/`.

## License

MIT
