# 2026-04-18 Foundation Cleanup Plan

Status: In Progress (`Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `Phase 5`, `Phase 6`, and `Phase 6B` completed on April 18, 2026)

Related inputs:

- `docs/reports/2026-04-18-foundation-audit.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `AGENTS.md`

## Intent

This plan turns the April 18 foundation audit into an ordered cleanup tranche focused on canon, consistency, and safe future development.

The goal is not to pause the product forever for abstract refactoring. The goal is to remove the specific drift and structural debt that now threaten clarity:

- docs that do not match the actual repo
- concrete correctness risk in the theme workbench
- legacy naming still leaking through active feature code
- oversized hotspot files that are slowing safe iteration
- persistence and board/agent seams that still carry too much responsibility in one place

This is a foundation pass. It should leave Sherlock easier to reason about, easier to change, and more obviously canonical before the next feature wave.

## Product North Star

By the end of this cleanup, Sherlock should feel like one coherent active system:

- one trustworthy active docs set
- one clear canonical vocabulary in active code
- one explicit boundary for legacy compatibility
- one safer theme/workbench state contract
- one smaller, more navigable set of feature and persistence hotspots
- one explicit distinction between foundation cleanup work and later UI expansion streams

## Planning Rules

1. Current truth wins.
   Active docs must describe what exists in the checkout now, not what existed previously or might exist later.

2. Canonical vocabulary wins in active runtime code.
   `Workspace`, `Artifact`, `Run`, `Signal`, `Source`, and `Item` remain the settled active nouns unless a bounded compatibility seam truly requires otherwise.

3. Compatibility must stay bounded.
   Legacy naming and shape support should live in migration, import, restore, and hydration seams rather than leaking into everyday feature code.

4. Fix correctness before beautification.
   Concrete state-shape or persistence risks land before cosmetic or optional structural cleanup.

5. Extract by responsibility.
   Large files should be split along clean seams, not arbitrarily chopped for line count alone.

6. Agent UI redesign is out of scope for this cleanup.
   We can improve board/agent logic, orchestration, and module boundaries now, but any UI redesign for the agent surface must wait for the later second dockable panel stream.

7. Docs land with code.
   Any phase that changes active contracts must update the active docs in the same phase closeout.

8. Validation must follow repo rules.
   For local validation on this checkout, use Windows `cmd.exe` or PowerShell, not WSL, for `npm`/Vite/Vitest/build/lint/typecheck commands.

## Explicit Deferral

The current board agent is not staying permanently inside the existing rail UI. A later product stream will move agent UI into a second dockable panel.

Implication for this cleanup:

- in scope now:
  - board-agent execution logic
  - review-flow logic
  - action registry decomposition
  - board/agent orchestration cleanup
  - state ownership cleanup
  - test coverage for board/agent logic
- out of scope now:
  - redesigning the current agent rail into its future permanent UI
  - building the second dockable panel
  - polishing temporary rail UX beyond what is necessary to keep the current feature stable

Any agent UI issue found during this cleanup should be triaged as one of:

- fix now if it is a correctness or blocking usability issue in the current UI
- defer if it is layout, composition, or interaction work better solved by the future dockable panel stream

## Completion Standard

This cleanup is complete only when:

1. active docs describe real directories, real files, and real runtime behavior
2. `docs/plans` and `docs/reports` are active working directories rather than empty shells
3. the theme workbench background controls write the correct state shape and are covered by focused tests
4. Operation View internals use canonical workspace/artifact naming instead of carrying `case/report` drift
5. `WorkspaceRepository`, board controller, and board-agent action execution have clearer seams with reduced responsibility concentration
6. `src/types/index.ts` begins shrinking through real contract extraction rather than continued accumulation
7. all deferments are explicit, especially agent UI work for the future dockable panel stream

## Validation Standard

Default expectation for implementation phases:

- run `npm run lint`
- run `npm run typecheck`
- run the smallest relevant targeted test commands for the touched files
- run `npm run build` when the phase touches shipped app code, routing, shared UI, runtime behavior, or bundling-sensitive code

Notes:

- do not default to `npm run test` unless a phase becomes broad or risky enough to justify it
- run these commands from Windows shell for this checkout, not WSL
- if a phase intentionally stops short of the full suite, say so in the closeout

## Delivery Order

Recommended phase order:

1. Active docs canon and repo-truth reset
2. Theme workbench correctness and theme contract hardening
3. Operation View naming canon
4. Persistence and repository seam extraction
5. Board and board-agent logic decomposition, with UI freeze
6. Shared contract extraction and hotspot reduction
7. Large-file hotspot refactor tranche
8. Final docs reconciliation and cleanup closeout

## Phase 1. Active Docs Canon And Repo-Truth Reset

Purpose:

- make active docs trustworthy again
- remove dead references and stale structural claims
- establish active `docs/plans` and `docs/reports` as real current-working directories

### Scope

Primary targets:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/CONTRIBUTING.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/plans/*`
- `docs/reports/*`

### Tasks

1. Remove or correct references to missing `canon-design/` paths if that app is no longer present in this checkout.
2. Fix `README.md` documentation index entries that currently point to absent active plan/report files.
3. Add a small active docs index or README for `docs/plans` and `docs/reports` explaining:
   - what belongs in active docs
   - what belongs in `_legacy`
   - how active plans/reports are expected to be used
4. Review `docs/operations/ARCHITECTURE.md` for any present-tense claims about extracted packages, folders, or ownership boundaries that are no longer true in the current repo.
5. Keep `_legacy` explicitly marked as historical context, not runtime truth.

### Exit Criteria

- active docs do not point to missing files or directories
- the repo has a clear active-docs path for plans and reports
- new contributors can tell current truth from historical context immediately

### Validation

- docs-only review
- optional `npm run lint` / `npm run typecheck` not required unless code is touched in the same session

### Progress

Completed on April 18, 2026.

Landed in this phase:

- removed the stale active `canon-design/` claims from `README.md` and `docs/operations/ARCHITECTURE.md`
- updated the active documentation index in `README.md` so it points at real current plan/report files
- added active index docs at `docs/plans/README.md` and `docs/reports/README.md`
- updated `docs/operations/CONTRIBUTING.md` and `docs/operations/BROAD_SCOPE.md` so active planning/report directories are part of the current guidance

Validation note:

- this phase was docs-only and was not run through local `npm` validation from WSL

## Phase 2. Theme Workbench Correctness And Theme Contract Hardening

Purpose:

- fix the concrete theme background state bug
- harden the theme workbench so it behaves like a reliable foundation instead of a fragile control lab

### Scope

Primary targets:

- `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx`
- `src/components/features/Settings/useSettingsThemeState.ts`
- `src/system/theme/schema.ts`
- `src/system/theme/storage.ts`
- theme-related tests

### Tasks

1. Fix the background mutation path so `dotColor`, `gridSize`, `dotOpacity`, `glowOpacity`, and `scanlineOpacity` write under `background[activeMode]`.
2. Add focused tests that cover:
   - background slider updates
   - mode-specific persistence
   - JSON export
   - resolved CSS export where applicable
3. Audit adjacent update helpers in the same panel for other state-shape mistakes.
4. Review whether small utility extraction is warranted immediately for the background update logic to reduce repeat bug risk.
5. Update active docs only if the actual persisted theme contract changes materially.

### Exit Criteria

- background controls update the correct mode-scoped theme state
- the bug is covered by focused tests
- there are no known malformed writes in neighboring workbench update paths

### Validation

- `npm run lint`
- `npm run typecheck`
- targeted tests for touched theme/workbench files
- `npm run build`

### Progress

Completed on April 18, 2026.

Landed in this phase:

- extracted the background slider mutation logic into `src/components/features/Settings/themeWorkbench/backgroundState.ts`
- fixed the mode-scoped background write bug so `dotColor`, `gridSize`, `dotOpacity`, `glowOpacity`, and `scanlineOpacity` update `background[activeMode]`
- updated `SettingsThemeWorkbenchPanel.tsx` to use the extracted helper instead of the malformed inline background updater
- added focused coverage in `src/components/features/Settings/themeWorkbench/backgroundState.test.ts` for mode isolation, numeric clamping, and JSON export persistence

Validation note:

- targeted tests were added but not executed here because this checkout should not run local repo Node/Vite/Vitest commands from WSL; run the Phase 2 validation commands from Windows shell

## Phase 3. Operation View Naming Canon

Purpose:

- remove the most visible remaining `case/report` drift from an active core surface
- align the feature’s internal language with the actual canonical runtime model

### Scope

Primary targets:

- `src/components/features/OperationView/*`
- `src/app/routeViews.tsx`
- `src/app/AppShellRoutes.tsx`
- adjacent tests and route helpers

### Tasks

1. Rename internal variables, props, and local state from `case/report` language to `workspace/artifact` language where they represent active canonical entities.
2. Keep user-facing pack/purpose copy intact where intentional, but remove legacy naming from the feature’s structural code.
3. Audit route prop names such as `reportOverride`, `onStartNewCase`, `selectedCaseId`, and similar seams for canonical replacements.
4. Update tests so they reinforce the new active naming instead of preserving stale vocabulary.
5. Document any intentionally retained legacy terms that remain for compatibility, import, or historical data reasons.

### Exit Criteria

- Operation View internals read canonically
- route wiring into Operation View no longer reinforces `case/report` drift
- tests and code review language become easier and more consistent

### Validation

- `npm run lint`
- `npm run typecheck`
- targeted Operation View and route tests
- `npm run build`

### Progress

Completed on April 18, 2026.

Landed in this phase:

- renamed the active Operation View contracts from mixed `task` / `report` seams to canonical `run` / `artifact` seams across:
  - `src/components/features/OperationView/*`
  - `src/app/routeViews.tsx`
  - `src/app/useAppShellNavigation.ts`
  - `src/app/useAppShellController.ts`
  - `src/app/AppShellRoutes.tsx`
- renamed active Files, Timeline, WorkspaceBoard, and routed shell callbacks to canonical workspace/artifact terms such as `onViewArtifact`, `onSelectArtifact`, `onOpenArtifact`, and `onStartWorkspace`
- updated `WorkspaceRun` and its active consumers to use `artifact` instead of `report`, removing the remaining run-to-artifact drift from route helpers, workspace actions, timeline derivation, omnibox actions, and maintenance helpers
- normalized Operation View's reader, inspector, and detail-rail internals so canonical artifact language now carries through the viewer, inspector actions, follow-up jumps, and artifact body editing paths
- updated the active architecture doc to record that route and feature seams now use canonical runtime naming and that legacy `case` / `report` wording is intentionally bounded to compatibility seams and user-facing copy
- refreshed focused tests across app routes, Files, Timeline, WorkspaceBoard, NetworkGraph, Operation View, and workspace-run persistence so the new names are reinforced by active test fixtures instead of legacy vocabulary

Validation note:

- `npm run lint` passed
- `npm run typecheck` passed
- `npm run test -- src/app/routeViews.test.tsx src/app/AppShellRoutes.test.tsx src/app/AppShell.test.tsx src/app/appShellNavigationHelpers.test.ts src/components/features/Files.launch.test.tsx src/components/features/Files/useFilesController.test.ts src/components/features/TimelineView.test.tsx src/components/features/Timeline/useTimelineViewController.test.ts src/components/features/WorkspaceBoard/boardInspectorActions.test.ts src/components/features/WorkspaceBoard/useWorkspaceBoardInspectorState.test.ts src/components/features/WorkspaceBoard/useWorkspaceBoardController.test.ts src/components/features/OperationView/ArtifactViewer.test.tsx src/components/features/OperationView/artifactViewerText.test.ts src/components/features/OperationView/OperationInspectorPanel.test.tsx src/components/features/OperationView/useOperationViewInspectorState.test.ts src/components/features/OperationView/useOperationViewController.test.ts src/components/features/OperationView/launchPropagation.test.tsx src/components/features/NetworkGraph/launchPropagation.test.tsx src/components/features/NetworkGraph/NetworkGraphInspectorPanel.test.tsx src/store/workspaceStore.test.ts` passed
- `npm run build` passed
- build still reports the pre-existing Vite chunk-size warning for `vendor-tldraw-app`; no new chunk warning was introduced in this phase

## Phase 4. Persistence And Repository Seam Extraction

Purpose:

- reduce blast radius around the app’s most important persistence boundary
- separate canonical artifact mapping from legacy compatibility work

### Scope

Primary targets:

- `src/services/db/repositories/WorkspaceRepository.ts`
- `src/services/maintenance/workspaceData.ts`
- related repository helpers/tests

### Tasks

1. Extract artifact hydration and persistence mapping out of `WorkspaceRepository` into dedicated helper modules.
2. Separate canonical domain mapping from bounded legacy compatibility helpers.
3. Preserve repository behavior while making the seams more explicit:
   - raw row to domain artifact
   - domain artifact to persistence rows
   - compatibility reconstruction for legacy `agendas`/`leads` and similar legacy fields
4. Review whether backup/import normalization can lean on the same extracted compatibility helpers rather than re-encoding similar translation logic elsewhere.
5. Update `docs/operations/DATA_PERSISTENCE.md` if file boundaries or responsibility ownership become materially clearer.

### Exit Criteria

- `WorkspaceRepository` no longer owns every layer of artifact translation directly
- legacy compatibility logic is more obviously bounded
- persistence changes become safer to review and test

### Validation

- `npm run lint`
- `npm run typecheck`
- targeted repository / persistence tests
- `npm run build`

### Progress

Completed on April 18, 2026.

Landed in this phase:

- extracted repository-side artifact compatibility parsing into `src/services/db/repositories/artifactCompatibility.ts`
- extracted raw-row artifact hydration into `src/services/db/repositories/artifactHydration.ts`
- extracted artifact-to-row write planning and execution into `src/services/db/repositories/artifactPersistence.ts`
- reduced `WorkspaceRepository.ts` to orchestration over those helpers instead of owning the full hydration and persistence stack inline
- extracted backup/import legacy-shape normalization into `src/services/maintenance/workspaceDataCompatibility.ts` so `workspaceData.ts` can stay focused on canonical backup assembly
- added focused coverage in `src/services/db/repositories/artifactHydration.test.ts` for legacy-payload hydration fallback behavior
- updated `docs/operations/DATA_PERSISTENCE.md` to describe the new helper boundaries and explicitly bound compatibility seams

Validation note:

- `npm run typecheck` passed
- `npm run test -- src/services/db/repositories/WorkspaceRepository.test.ts src/services/db/repositories/artifactHydration.test.ts src/services/maintenance/workspaceData.test.ts src/store/workspaceStore.test.ts` passed
- `npm run build` passed
- `npm run lint` still fails in unrelated pre-existing files: `src/components/features/Runs/RunSetupModal.tsx` and `src/components/ui/GlobalSearch.tsx`

## Phase 5. Board And Board-Agent Logic Decomposition

Purpose:

- reduce coordination overload in the board feature
- improve maintainability of board-agent logic without prematurely redesigning its UI

### Scope

Primary targets:

- `src/components/features/WorkspaceBoard/useWorkspaceBoardController.ts`
- `src/services/workspace/agent/actions/registry.ts`
- board-agent context/session/review helpers
- board and board-agent tests

### Tasks

1. Split `useWorkspaceBoardController.ts` by responsibility, aiming for clearer ownership around:
   - route/page orchestration
   - board-agent session flow
   - upload/import flows
   - panel/dialog state
   - board placement coordination
2. Split board-agent action execution into more focused modules by action family or concern.
3. Keep current UI behavior stable enough for ongoing use, but do not redesign the agent surface around the existing rail.
4. Prefer logic and ownership cleanup over visual polish in this phase.
5. Add or update focused tests for the newly extracted logic seams.

### Agent UI Freeze Rule

For this phase:

- allowed:
  - bug fixes necessary to keep the current agent rail working
  - internal prop cleanup
  - state ownership cleanup
  - extraction that reduces coupling between logic and UI
- deferred:
  - new agent-panel composition work
  - dock behavior redesign
  - layout and affordance work that should belong to the future second dockable panel stream

### Exit Criteria

- board logic is less centralized
- board-agent execution is easier to reason about and test
- no cleanup work accidentally hardens the temporary rail UI into a permanent design direction

### Validation

- `npm run lint`
- `npm run typecheck`
- targeted board / board-agent tests
- `npm run build`

### Progress

Completed on April 18, 2026.

Landed in this phase:

- extracted board placement and queued-placement coordination into `src/components/features/WorkspaceBoard/useWorkspaceBoardPlacement.ts`
- extracted board-agent local session/review state into `src/components/features/WorkspaceBoard/useWorkspaceBoardAgentState.ts`
- reduced `useWorkspaceBoardController.ts` to page-level orchestration over the placement, board-agent, library, inspector, upload, and canvas-persistence seams
- split board-agent structured action execution into focused family modules:
  - `src/services/workspace/agent/actions/metaActions.ts`
  - `src/services/workspace/agent/actions/boardMutationActions.ts`
  - `src/services/workspace/agent/actions/workspaceWriteActions.ts`
  - shared helpers bounded in `src/services/workspace/agent/actions/shared.ts`
- added focused coverage in `src/components/features/WorkspaceBoard/useWorkspaceBoardAgentState.test.ts` and `src/services/workspace/agent/actions/metaActions.test.ts`
- kept the current board-agent rail behavior and approval-first review flow intact without redesigning the temporary rail UI

Validation note:

- `npm run typecheck` passed
- `npm run test -- src/components/features/WorkspaceBoard/useWorkspaceBoardController.test.ts src/components/features/WorkspaceBoard/useWorkspaceBoardAgentState.test.ts src/services/workspace/agent/actions/registry.test.ts src/services/workspace/agent/actions/metaActions.test.ts src/services/workspace/agent/session.test.ts` passed
- `npm run lint` passed
- `npm run build` passed
- build still reports the pre-existing Vite chunk-size warning for `vendor-tldraw-app`; no new chunk warning was introduced in this phase

## Phase 6. Shared Contract Extraction And Hotspot Reduction

Purpose:

- keep hotspot reduction moving after the most urgent surfaces are stabilized
- begin shrinking shared contract sprawl in `src/types/index.ts`

### Scope

Primary targets:

- `src/types/index.ts`
- any newly extracted shared contracts from prior phases
- secondary hotspots that remain too concentrated after earlier phases

### Tasks

1. Extract stable domain-specific types out of `src/types/index.ts` into narrower modules where it improves ownership and navigation.
2. Preserve import ergonomics where useful, but stop letting one global file absorb every new contract.
3. Review other large but lower-priority files for safe opportunistic extraction if they were touched in earlier phases.
4. Avoid broad churn for its own sake; only extract where it clarifies responsibility and makes future changes safer.

### Exit Criteria

- `src/types/index.ts` has a reduced responsibility footprint
- shared contracts are easier to find by subsystem
- hotspot reduction is tangible, not just aspirational

### Validation

- `npm run lint`
- `npm run typecheck`
- targeted tests for touched modules
- `npm run build` if shipped app code changes

### Progress

Completed on April 18, 2026.

Landed in this phase:

- extracted the former `src/types/index.ts` gravity well into subsystem modules:
  - `src/types/core.ts`
  - `src/types/workspaceSurface.ts`
  - `src/types/boardAgent.ts`
  - `src/types/chat.ts`
  - `src/types/timeline.ts`
  - `src/types/workspaceData.ts`
- reduced `src/types/index.ts` to a compatibility barrel that re-exports those subsystem contracts instead of remaining the primary authoring surface
- updated active contract-heavy consumers in board-agent context building, chat runtime context, provider request types, workspace-data normalization, and repository backup handling to import from the narrower subsystem modules
- updated `docs/operations/ARCHITECTURE.md` and `docs/operations/CONTRIBUTING.md` so the active docs describe the new shared-contract layout and the intended `src/types/*` ownership model

Validation note:

- `npm run lint` passed
- `npm run typecheck` passed
- `npm run test -- src/services/maintenance/workspaceData.test.ts src/services/chat/runtimeContext.test.ts src/services/workspace/agent/session.test.ts` passed
- `npm run build` passed
- build still reports the pre-existing Vite chunk-size warning for `vendor-tldraw-app`; no new chunk warning was introduced in this phase

## Phase 6B. Large-File Hotspot Refactor Tranche

Purpose:

- turn the audit's remaining "fat file" concern into one explicit execution phase instead of leaving it as opportunistic cleanup
- prioritize active code hotspots that are genuinely impeding safe iteration after Phases 1-6

### Scope

Primary targets, ranked by current LOC on April 18, 2026:

- `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx` - 1218
- `src/components/features/OperationView/ArtifactViewer.tsx` - 965
- `src/system/theme/schema.ts` - 848
- `src/components/features/NetworkGraph/GraphCanvas.tsx` - 710
- `src/components/ui/GlobalSearch.tsx` - 700
- `src/services/chat/runtime.ts` - 676
- `src/services/providers/openRouterProvider.ts` - 643
- `src/components/features/Chat/useChatController.ts` - 638
- `src/components/features/Timeline/timelineEventBuilders.ts` - 623
- `src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx` - 614
- `src/components/ui/omniboxActions.ts` - 612
- `src/services/providers/geminiProvider.ts` - 604
- `src/components/features/Settings/TemplateGallery.tsx` - 598
- `src/components/features/OperationView/artifactViewerDetailRail.tsx` - 596
- `src/components/features/Settings/themeWorkbench/SettingsThemeTab.tsx` - 550
- `src/services/db/repositories/WorkspaceRepository.ts` - 522

Explicit deferments for this phase:

- `src/components/features/WorkspaceBoard/BoardAgentRail.tsx` - 725
  - defer because the board-agent surface is already expected to move into the future dockable panel stream, so a large extraction pass here would likely harden a temporary UI seam

Large files noted but not first-line refactor targets for this phase:

- `src/lib/tablerIconSvgMap.ts` - 2784
  - generated/static registry, not an immediate architecture refactor target
- `src/index.css` - 1445
  - large stylesheet, but this cleanup tranche is focused on code-module responsibility seams first
- `src/lib/appIcons.tsx` - 936
  - icon catalog / registry surface, likely better handled only if icon-system work is already underway
- `src/data/presets.ts` - 685
  - large data/config payload rather than a logic hotspot
- `src/utils/themeFonts.ts` - 562
  - large token/config surface; only extract if theme-workbench work naturally forces it

### Tasks

1. Start with `SettingsThemeWorkbenchPanel.tsx` as the anchor extraction target and split it by clear responsibility seams such as:
   - theme draft state mutation helpers
   - import/export/template actions
   - mode/background/accent/surface/typography subsection composition
   - shared workbench action wiring
2. Follow immediately with the Operation View reader pair:
   - `ArtifactViewer.tsx`
   - `artifactViewerDetailRail.tsx`
     Keep the reader contract stable while extracting rendering blocks, edit controls, and evidence/finding/follow-up detail helpers into smaller feature-owned modules.
3. Evaluate whether `SettingsThemeTab.tsx` and `TemplateGallery.tsx` should be reduced in the same pass so the whole workbench surface ends with cleaner boundaries instead of one smaller file calling several still-bloated neighbors. \*do the right thing. clean fully implemented.
4. Treat `schema.ts`, `GraphCanvas.tsx`, `GlobalSearch.tsx`, `runtime.ts`, provider adapters, timeline event builders, inspector panels, and omnibox actions as the next candidate queue, but only pull them into the tranche if the earlier extractions land cleanly and time remains.
5. Keep `BoardAgentRail.tsx` explicitly deferred unless a correctness bug forces a targeted change.
6. Record any files that remain above roughly 550-600 LOC after the tranche so Phase 7 closeout can describe what was intentionally left for later.

### Exit Criteria

- the theme workbench no longer depends on one dominant panel file for most editing behavior
- the Operation View reader no longer concentrates most document rendering and reading interactions in one oversized component pair
- the phase leaves a ranked, reality-based carry-over list rather than vague "more refactoring later" language

### Validation

- `npm run lint`
- `npm run typecheck`
- targeted tests for the extracted feature surfaces
- `npm run build`

### Planning Note

This phase was added on April 18, 2026 after a code-first LOC sweep so the final docs closeout would not swallow the remaining large-file refactor work.

Current largest non-test TypeScript/TSX implementation files informing this phase:

- `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx` - 1218
- `src/components/features/OperationView/ArtifactViewer.tsx` - 965
- `src/system/theme/schema.ts` - 848
- `src/components/features/WorkspaceBoard/BoardAgentRail.tsx` - 725, intentionally deferred
- `src/components/features/NetworkGraph/GraphCanvas.tsx` - 710
- `src/components/ui/GlobalSearch.tsx` - 700
- `src/services/chat/runtime.ts` - 676
- `src/services/providers/openRouterProvider.ts` - 643
- `src/components/features/Chat/useChatController.ts` - 638
- `src/components/features/Timeline/timelineEventBuilders.ts` - 623
- `src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx` - 614
- `src/components/ui/omniboxActions.ts` - 612
- `src/services/providers/geminiProvider.ts` - 604
- `src/components/features/Settings/TemplateGallery.tsx` - 598
- `src/components/features/OperationView/artifactViewerDetailRail.tsx` - 596
- `src/components/features/Settings/themeWorkbench/SettingsThemeTab.tsx` - 550
- `src/services/db/repositories/WorkspaceRepository.ts` - 522

### Progress

Completed on April 18, 2026.

Landed in this phase:

- split `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx` into a small orchestration panel plus feature-owned workbench tab modules for theme editing, type editing, shell controls, background controls, exports, and shared panel helpers
- reduced `src/components/features/Settings/TemplateGallery.tsx` by extracting the protocol creation wizard and runtime-config save flow into `src/components/features/Settings/TemplateCreateModal.tsx`
- split `src/components/features/OperationView/ArtifactViewer.tsx` into focused reader modules for summary/key-finding/follow-up rendering, document-section editing, evidence log rendering, and shared reference/follow-up helpers
- extracted the Operation View detail rail finding list into `src/components/features/OperationView/artifactViewerDetailFindingList.tsx` and reused the shared reference/follow-up helpers from the main viewer
- kept `src/components/features/WorkspaceBoard/BoardAgentRail.tsx` deferred for the future dockable-panel stream

Post-tranche LOC snapshot for the main touched files:

- `src/components/features/Settings/themeWorkbench/SettingsThemeWorkbenchPanel.tsx` - 142
- `src/components/features/OperationView/ArtifactViewer.tsx` - 468
- `src/components/features/OperationView/artifactViewerDetailRail.tsx` - 481
- `src/components/features/Settings/TemplateGallery.tsx` - 199
- largest new extracted modules remain bounded: `ThemeWorkbenchThemeTab.tsx` - 560, `ArtifactViewerSections.tsx` - 454, `TemplateCreateModal.tsx` - 414

Reality-based carry-over list for Phase 7 closeout:

- `src/system/theme/schema.ts` - 936
- `src/components/features/NetworkGraph/GraphCanvas.tsx` - 783
- `src/components/ui/GlobalSearch.tsx` - 747
- `src/components/features/WorkspaceBoard/BoardAgentRail.tsx` - 745, intentionally deferred
- `src/services/chat/runtime.ts` - 719
- `src/services/providers/openRouterProvider.ts` - 698
- `src/components/features/Chat/useChatController.ts` - 689
- `src/components/features/Timeline/timelineEventBuilders.ts` - 654
- `src/components/features/NetworkGraph/NetworkGraphInspectorPanel.tsx` - 643
- `src/services/providers/geminiProvider.ts` - 649
- `src/utils/themeFonts.ts` - 620
- `src/domain/artifacts.ts` - 605
- `src/components/features/Runs/RunSetupModal.tsx` - 592
- `src/components/features/Settings/themeWorkbench/SettingsThemeTab.tsx` - 579
- `src/services/workspace/agent/session.ts` - 567
- `src/services/db/repositories/WorkspaceRepository.ts` - 561

Validation note:

- `npm run lint` passed
- `npm run typecheck` passed
- `npm run test -- src/components/features/Settings/themeWorkbench/backgroundState.test.ts src/components/features/Settings/useSettingsController.test.ts src/components/features/OperationView/ArtifactViewer.test.tsx src/components/features/OperationView/artifactViewerText.test.ts src/components/features/OperationView/OperationInspectorPanel.test.tsx` passed
- `npm run build` passed
- build still reports the pre-existing Vite chunk-size warning for `vendor-tldraw-app`; no new chunk warning was introduced in this phase

## Phase 7. Final Docs Reconciliation And Cleanup Closeout

Purpose:

- make the code and docs land together as one settled cleanup tranche
- capture deferred work clearly so the next stream starts from a clean handoff

### Scope

Primary targets:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- closeout report in `docs/reports`

### Tasks

1. Reconcile active docs to the final landed structure after Phases 2-6B.
2. Add a closeout report summarizing what actually landed, what was deferred, and what remains.
3. Explicitly record the deferred future stream for the second dockable agent panel.
4. Note any remaining hotspots that were intentionally left for later rather than discovered too late.

### Exit Criteria

- active docs reflect the cleaned-up codebase
- the next development stream inherits a clear, truthful starting point
- the deferred dockable agent-panel work is documented as a separate future stream, not left as chat-only context

### Validation

- docs review
- `npm run lint`
- `npm run typecheck`
- targeted tests or `npm run build` if the closeout includes final code adjustments

## Carry-Over After Phase 6B Execution

The remaining work is now concentrated in the final closeout phase and a few explicitly deferred follow-ups:

- complete `Phase 7` final docs reconciliation and add the cleanup closeout report in `docs/reports`
- decide whether broader non-Operation-View `report` naming in domain/presentation, chat artifact-building, and network-graph-local helper code should be normalized in a later cleanup tranche or left as bounded internal vocabulary where it still maps cleanly to artifact generation behavior
- keep `src/components/features/WorkspaceBoard/BoardAgentRail.tsx` deferred to the future dockable-panel stream unless a targeted bug fix requires touching it first

## Recommended Working Sequence Inside The Cleanup

The best execution order inside implementation sessions is:

1. docs canon first, so active truth stops drifting immediately
2. theme correctness next, because it is a concrete bug risk
3. Operation View naming canon, because it clarifies the vocabulary for the rest of the cleanup
4. persistence extraction, because it is high-value and high-risk if left too late
5. board and board-agent logic cleanup, while keeping the UI freeze in place
6. shared contract extraction only after the most important feature seams are already clearer
7. large-file hotspot refactors, starting with theme workbench and Operation View reader surfaces
8. final docs and closeout report last

## Out-Of-Scope For This Plan

- building the future second dockable agent panel
- major redesign of the current board-agent UI
- unrelated product expansion not required to land the cleanup
- broad visual refresh work not tied to correctness or canonical structure
- full-suite test reruns by default unless a phase becomes broad enough to require them

## Definition Of Done

This plan is done when:

- the active docs set is trustworthy
- the theme workbench bug is fixed and tested
- Operation View no longer speaks in legacy internals
- persistence and board logic have clearer seams
- shared type sprawl has begun shrinking in a real way
- the future dockable agent panel stream is explicitly deferred, not accidentally mixed into foundation cleanup
- Sherlock feels more unified, more navigable, and safer to keep building on
