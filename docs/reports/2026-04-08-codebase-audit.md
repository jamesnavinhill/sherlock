# Sherlock Codebase Audit

Date: 2026-04-08
Repository: `/mnt/c/Users/james/projects/sherlock`

## Scope and Method

This audit focused on:

- active application code under `src/`
- active docs under `README.md` and `docs/operations/*`
- the architecture anchors called out in `AGENTS.md`

I reviewed the app shell, store/actions, provider runtime, SQLite layer, Timeline, Workspace Board, Files, omnibox/search, and current docs structure. I also checked file-size hotspots, searched for explicit debt markers, and ran the standard validation commands.

## Validation Snapshot

Commands run on 2026-04-08:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`

Result:

- lint passed
- typecheck passed
- build passed
- full Vitest suite passed

Notable validation notes:

- the build still emits the expected large-chunk warning for `vendor-tldraw-app`
- active `src/` code does not show broad `TODO` / `FIXME` / `HACK` marker sprawl

## Executive Summary

Sherlock is in solid working shape. Validation is green, the route shell is materially cleaner than earlier audits, browser-native dialog debt appears to be gone from active `src/`, and there is meaningful test coverage across routing, persistence, providers, Timeline, chat, and board-agent paths.

The main issues are now structural rather than basic breakage:

1. active documentation drifted away from the actual docs layout
2. the controller/view-model extraction contract is only partially applied
3. persistence still carries a lot of old vocabulary and compatibility translation
4. storage migration logic is split across multiple mechanisms
5. the provider/model subsystem is still too concentrated and repetitive

## Findings

### 1. Medium: the active documentation index no longer matches the repo layout

Evidence:

- `README.md:146-160` points readers to active files such as `docs/plans/08-cross-feature-refactor-slice-plan.md`, `docs/reports/2026-04-06-cross-feature-refactor-audit.md`, `docs/reports/2026-04-06-cross-feature-refactor-closeout.md`, and `docs/plans/2026-04-05-post-refactor-completion-plan.md`
- at audit start, `docs/plans/` and `docs/reports/` contained no active files, while the actual historical material lived under `docs/_legacy/`

Why this matters:

- the README currently advertises a canonical active-doc set that does not exist on disk
- contributors have to guess whether `_legacy` is actually legacy or just where the real history moved
- once docs stop matching the tree, architecture notes lose authority even when the code is healthy

Recommendation:

- either repoint `README.md` to the actual `_legacy` locations or repopulate active `docs/plans` and `docs/reports` intentionally
- keep one obvious rule for “current” vs “historical” documents

### 2. Medium: the stated extraction contract is real, but several big surfaces still break it

Evidence:

- `docs/operations/ARCHITECTURE.md:121-139` says route/page files should handle wiring, controller hooks should own orchestration, and view-model/util modules should stay pure
- `src/components/features/Archives.tsx:57-220` is still a very large root component that directly reads the global store, manages route state, localStorage syncing, board/chat handoffs, pagination, export, and destructive state in one file
- `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts:62-95` and `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts:228-520` show a controller that still owns broad UI state, navigation, drag/drop, persistence, AI flows, and board-agent review in one 1000+ line hook
- `src/components/features/Timeline/useTimelineViewController.ts:55-257` and `src/components/features/Timeline/timelineEvents.ts:19-221` are better factored than before, but the feature still relies on two very large owner modules for query state, event heuristics, exports, board handoffs, and detail behavior
- `src/components/ui/omniboxModel.ts:17-64` and `src/components/ui/omniboxModel.ts:369-894` keep route results, workspace search, snippet mapping, recents, mentions, and draft-mention resolution in one 900+ line “model” file

Why this matters:

- Sherlock now has a clear architecture contract, which is good
- the remaining exceptions are obvious enough that they become maintenance gravity wells
- these files are where new behavior is most likely to become “just one more branch” instead of a clean seam

Recommendation:

- treat Files, Omnibox, and the remaining heavy controller hooks as the next cleanup targets
- extract pure ranking/filtering helpers before moving more UI out of those modules
- keep using the controller/view-model split already established in Timeline, Workspace Home, and other newer surfaces

### 3. Medium: persistence still pays a large “old names plus new names” tax

Evidence:

- the app now speaks in `Workspace`, `Artifact`, `Run`, and `Signal`, but the database schema still centers `cases`, `reports`, `leads`, and `tasks` in `src/services/db/schema.ts:14-160`
- backup normalization still accepts legacy shapes like `cases`, `archives`, `reports`, and `tasks` in `src/services/maintenance/workspaceData.ts:23-27` and `src/services/maintenance/workspaceData.ts:192-214`
- the one-time migration path still reads legacy `sherlock-storage` and migrates `cases`, `archives`, and `headlines` in `src/services/db/migrate.ts:39-77`
- `src/services/db/repositories/CaseRepository.ts:239-320` still reconstructs modern artifact state from a mix of current rows, legacy raw payloads, and fallback arrays

Why this matters:

- this compatibility work is no longer isolated to one migration boundary
- the old vocabulary still leaks into storage, import/export, repository code, and mental models
- every contributor has to remember which layer means “workspace” and which still means “case”

Recommendation:

- decide which legacy formats are still needed for real users and version that support explicitly
- keep the compatibility boundary near import/migration edges instead of spreading it through normal reads
- document any intentionally permanent storage-name mismatches so they stop feeling accidental

### 4. Medium: database evolution is fragmented across generated SQL, runtime ALTER logic, and repair helpers

Evidence:

- `src/services/db/client.ts:328-345` boots from generated `SCHEMA_SQL`
- `src/services/db/client.ts:97-307` also runs a hand-maintained `alterStatements` list plus `ensureArtifactSectionsCompositeKey(...)`
- `src/services/db/migrate.ts:24-107` adds a separate localStorage-to-SQLite migration path on top
- `src/services/db/repositories/CaseRepository.ts:241-248` still contains “keep it simple for now” and “okay for MVP” comments in the hot report-hydration path

Why this matters:

- there are effectively three migration systems in play
- future schema changes have more than one “correct” place to land
- runtime patching is sometimes necessary, but it should stay temporary and heavily bounded

Recommendation:

- converge on one primary migration story
- treat `runSchemaUpgrades(...)`, composite-key repair, and the localStorage migration as explicit transitional shims
- add retirement criteria for each shim so they do not silently become permanent architecture

### 5. Medium: the provider/model subsystem is still too concentrated and still duplicates transport logic

Evidence:

- `src/config/aiModels.ts:1-81` mixes capability types, provider metadata, OpenRouter cache/storage concerns, remote catalog normalization, recent-model persistence, and selection helpers in one module
- the same file also embeds a large static catalog before switching into fetch/cache logic, making it both data registry and runtime service
- direct-provider adapters such as `src/services/providers/openAIProvider.ts:42-258` and `src/services/providers/anthropicProvider.ts:38-240` repeat very similar fetch, error parse, SSE handling, investigation, chat, and board-agent scaffolding
- `src/services/providers/openRouterProvider.ts:193-260` carries a provider-specific superset of the same responsibilities, plus search-tool shaping and citation extraction
- `src/services/providers/index.ts:179-260` repeats pack/purpose/config/capability resolution per operation

Why this matters:

- the provider system works, but feature growth still implies multi-file synchronized edits
- capability changes, response-envelope changes, or streaming changes are easy to drift across adapters
- the model catalog file is becoming a policy, cache, network, and data-definition module all at once

Recommendation:

- split model catalog data from catalog IO/cache behavior
- extract a shared direct-provider request/streaming transport for the common OpenAI/Anthropic/Gemini patterns
- keep the router focused on dispatch and capability policy rather than repeating operation shaping

### 6. Low/Medium: test coverage is good overall, but still not proportionate to the biggest UI roots

Evidence:

- the repo currently has 68 `*.test.ts(x)` files across 304 `*.ts(x)` source files
- the full suite passes, which is a strong signal
- some of the largest active files still do not have matching focused tests around their own full behavior surface, for example `src/components/features/Archives.tsx`, `src/components/features/Runs/TaskSetupModal.tsx`, `src/components/features/Settings/TemplateGallery.tsx`, and several heavy UI subsections
- in practice, coverage around those areas is often indirect, launch-focused, or exercised through broader feature tests rather than narrow behavioral tests

Why this matters:

- green validation today does not mean the largest UI roots are easy to refactor safely
- the highest-maintenance files should ideally have the sharpest local tests, not just surrounding integration coverage

Recommendation:

- add focused tests for Files filtering/export/selection behavior
- add focused tests for omnibox ranking and mention resolution edge cases
- add migration/schema-upgrade tests that exercise malformed or legacy payloads more directly

## Smaller One-Offs Worth Tracking

- `src/components/ui/TaskSetupModal.tsx:1-5` is now a pure re-export shim over `src/components/features/Runs/TaskSetupModal.tsx`. It is harmless, but it is a sign that import cleanup is not fully finished.
- `src/services/db/migrate.ts:39-77` is still a live runtime bridge from the old `sherlock-storage` blob. If that bridge is still needed, it should be treated as an intentional compatibility feature; if not, it is removable complexity.

## Positive Observations

- the route shell is in much better shape than earlier audits: heavy workspace surfaces are now lazy-loaded in `src/app/routeViews.tsx`
- the repo no longer appears to rely on browser-native `confirm(...)`, `prompt(...)`, or `alert(...)` inside active `src/`
- Timeline, Workspace Home, Settings tabs, and several runtime/config seams show real progress toward a more legible architecture
- explicit debt markers are low, and the code generally reads like active product work rather than abandoned scaffolding

## Recommended Next Steps

1. Fix the active-doc index so `README.md` points to real current files.
2. Pick one large surface to finish the architecture contract on, preferably Files or Omnibox.
3. Define a concrete compatibility policy for legacy storage names and old backup shapes.
4. Collapse the migration story so generated migrations are primary and runtime repair code is temporary.
5. Split the provider/model subsystem into smaller policy, transport, and catalog modules before the next major capability round lands.
