# Sherlock AI

Sherlock AI is a React + TypeScript knowledge workspace for AI-assisted investigations, research, monitoring, and structured reporting across multiple domains.

The active application in this checkout lives under `src/`. Current plans and reports live under `docs/plans/` and `docs/reports/`, while historical planning and report artifacts live under `docs/_legacy/`.

## What It Does

- Runs structured analysis through a provider router (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- Uses a capability-aware model registry with direct-provider defaults plus a dynamic OpenRouter catalog (bundled snapshot, local cache, live refresh, curated quick picks, and manual slug entry)
- Runs workspace-grounded chat through the same provider router with persisted sessions, message history, streaming output, and stop support
- Exposes one shared header omnibox for routes, workspaces, saved timeline views, artifacts, items, chats, runs, and signals, with durable recent destinations plus in-context board/timeline/network/files focus and chat/board/timeline/network/files handoff actions
- Provides a dedicated multi-board research workspace built on `tldraw`, with a canonical library for artifacts, entities, sources, signals, notes, links, files/media, and promoted chat excerpts
- Executes Sherlock board-agent sessions through an approval-first review sheet that previews planned actions, supports an auto-approve toggle for low-risk organization moves, and leaves auditable action receipts for completed, skipped, failed, and queued follow-up work
- Supports OpenRouter server-side web search via `openrouter:web_search` with configurable engine, result limits, context size, and domain filters
- Maintains a unified launch pipeline across Finder, Operation View, Live Monitor, Network Graph, and chat follow-up flows
- Opens new visitors on a public `/welcome` landing page, then routes into `Files` after the existing BYOK-or-browse onboarding modal
- Uses `Files` as the current in-app home surface, opening to the all-workspaces overview while the future global dashboard remains unwired
- Keeps `/workspaces/:workspaceId` as a lightweight workspace-home overview with canonical counts, recent activity, saved timeline views, and direct handoff links into artifact/chat/board/timeline/network/files workflows
- Resolves built-in domain packs and purpose profiles into run metadata and prompt behavior
- Stores workspace/artifact/workspace-run data in browser-persistent SQLite (wa-sqlite + IndexedDB)
- Supports typed artifact sections, evidence records, provenance metadata, first-class follow-up records, methodology blocks, deep dives, signal-grounded launches, entity graph workflows, workspace board composition, chat transcript export, guided run building, and artifact/workspace export tooling (HTML/Markdown/JSON)
- Provides scope-driven domain packs, purpose-aware launch setup, built-in starters, personas, and reusable templates
- Adapts launch copy, labels, and output defaults by pack and purpose while using `Workspace`, `Artifact`, and `WorkspaceRun` as the primary runtime model
- Uses canonical top-level shell nouns (`Workspace`, `Artifact`, `Run`, `Signal`, `Source`, `Item`) while keeping pack/purpose-specific copy inside artifact content and guided flows
- Separates workspace display identity from launch metadata so top-level chrome uses a clean workspace title while prompts and summaries retain `launchTopic`, `launchAngle`, and priority-source context
- Supports hybrid artifact generation modes with a global default plus per-run overrides (`SINGLE_PASS` vs `STAGED`)
- Reuses Sherlock-owned shared `RangeField` and `DateRangePicker` controls across the theme workbench, run setup, guided run building, feed filters, and live monitor settings
- Exports and restores workspace-data backups for workspaces, artifacts, runs, chat history, research boards, canonical workspace items, templates, manual graph data, and saved signals without bundling device-local app preferences or API keys

## UI Areas

- `Operation View`: document-first artifact reading with canonical key findings near the top of the body, inline evidence jump cues, section-level editing for substantive document blocks, route-backed section/evidence focus, purpose-ordered typed-section rendering, dossier, and a current-artifact/entity/signal inspector panel
- `Run Setup + Guided Run Builder`: pack/purpose-aware setup, provider/model selection, shared date-range controls, OpenRouter browser, generation mode override, starter prompts, template save/apply
- `Board`: multi-board canvas with canonical library placement, note/link/file ingestion, promoted chat excerpts, presentation mode, manual AI helpers, and a board-agent inspector that supports starter intents, approval-first plan review, low-risk auto-approve, todos, action receipts/history, cancellation, and cross-links back into artifacts, timeline, graph, and chat
- `Timeline`: workspace chronology across saved signals, runs, artifacts, canonical item creation/promotion/update/reuse events, opt-in entity milestones, chat sessions, and high-signal chat actions, with shared library/inspector panel foundations, lineage focus chips, exact-session jump-through into workspace chat, item-aware Files/source/board/chat actions, Timeline snapshot export/save actions, durable saved views that reopen through the omnibox, and a shared workbench-host tools panel for saved-view/snapshot actions
- `Chat`: dedicated chat sessions grounded in the active workspace with transcript copy/export, retrieval pinning, inline `@` mention references for canonical workspace records that reopen focused workspace surfaces, excerpt promotion into the canonical library, board handoff, save/append actions, follow-up launches, guided run mode, and launch-into-chat handoff from Operation View, Files, and Network Graph
- `Workspace Home`: lightweight workspace overview with summary counts, recent activity, saved timeline views, workspace context, and quick handoff links into artifact/chat/board/timeline/network/files; this is real and routed, but it is not yet the global app homepage/dashboard
- `Network Graph`: D3 graph with manual nodes/links, concept/source-aware graph nodes, flag/hide, entity resolution, board handoff for artifacts/entities/signals, and an overlaying dossier rail that no longer shifts graph content
- `Live Monitor`: live signal scans, shared slider/date controls for monitor settings, filtering, save/persist actions, feeder-style CTAs into synthesis, and motion reserved for active monitoring states
- `Files`: workspace browsing across artifacts and canonical workspace items, with grid-first all-workspaces landing, dense list/grid modes, direct deep-link item focus, direct chat, board, source-link, deletion, export actions, and a controller/section split that keeps the surface aligned to the shared feature extraction pattern
- `Finder`: discovery scanning and analysis launch with shared toolbar date-range filtering
- `Settings`: provider/model keys, generation defaults, OpenRouter search controls, scope/template management, workspace-data import/export, and theme controls that now register into the shared app workbench host for draft/export utility actions alongside the routed settings shell; the theme workbench implementation now lives under `src/components/features/Settings/themeWorkbench/*`

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
- At least one provider key (Gemini/OpenRouter/OpenAI/Anthropic) if you want to run AI investigations; browsing works without one

### Local Environment Rule

- For local development on this checkout, use Windows `cmd.exe` or PowerShell.
- Do not run `npm install`, `npm ci`, `npm run build`, `npm run test`, or other local repo scripts from WSL against `C:\Users\...\projects\sherlock`.
- Mixing WSL/Linux installs with the Windows checkout can swap native optional packages like Rollup to the wrong platform and break the repo until `node_modules` is repaired from Windows.
- CI and hosted Linux builds are still fine; this rule is specifically for local work on the Windows-mounted checkout.

### Install and Run

```bash
npm install
npm run dev
```

Dev server defaults to `http://localhost:3000`.

The root route opens the public welcome page first. From there, `Open Workspace` launches the existing API key modal, and users can either authenticate or skip into the Files workspace browser.

If you accidentally installed from WSL/Linux and hit a Rollup native package error, repair the local install from Windows instead of WSL:

```bash
rd /s /q node_modules
npm install
```

The repo now blocks local `npm install`/`npm ci` from WSL when the checkout lives under `/mnt/<drive>/...`. If you truly need that path, set `SHERLOCK_ALLOW_WSL_INSTALL=1` explicitly.

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
- If `public/seeds/demo-workspace.json` exists, an empty browser profile will import it once on first load for demo browsing. The seed file can be either a full workspace-data backup from `Settings -> Data` or a canonical single-workspace export JSON with `workspace` and `artifacts` keys.

Recommended flow:

1. Import the GitHub repo into Vercel.
2. Let Vercel use the repo `vercel.json` or set `npm ci`, `npm run build`, and `dist` manually.
3. Optionally place either a canonical workspace-data backup or a canonical single-workspace export JSON at `public/seeds/demo-workspace.json` if you want first-time visitors to land in a pre-seeded demo workspace.
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

## Current Validation Snapshot (April 18, 2026)

The current targeted validation for the theme-mode decoupling cleanup and theme-workbench mode-branch cutover succeeded on this checkout:

- `npm run test -- src/system/theme/storage.test.ts src/components/features/Settings/useSettingsController.test.ts`: passes
- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run build`: passes
- the app shell now owns one shared workbench host with a sidebar trigger, app-level left/right docking, and route-pluggable utility-panel registration; current live consumers are the Settings theme workspace and the Timeline tools panel
- the live display mode now persists separately from theme presets, while each preset stores mode-scoped accent, graph, background, surface, and divider families without forcing preset-driven light/dark flips
- legacy split theme keys other than the active `theme_mode` display-mode setting are now read only as bootstrap migration fallbacks when `theme_workspace` is missing, and the active compatibility helpers live under `src/system/theme/legacy/`
- all routed in-app pages mounted by `AppShellRoutes` still compose through the shared shell contract; the public `/welcome` landing page remains intentionally outside `PageShell`
- the full repo-wide `npm run test` suite was not rerun as part of this scoped validation pass
- Vite still emits chunk-size warnings for `vendor-tldraw-app` and `vendor`; these remain documented review checkpoints

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
- `docs/plans/README.md`
- `docs/plans/2026-04-18-foundation-cleanup-plan.md`
- `docs/reports/README.md`
- `docs/reports/2026-04-18-foundation-audit.md`

Historical plans and reports live under `docs/_legacy/`.

## License

MIT
