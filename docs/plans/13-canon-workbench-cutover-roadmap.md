# Canon Workbench Cutover Roadmap

Date audited: April 17, 2026

Status: Audit-updated roadmap derived from `docs/reports/2026-04-17-canon-workbench-upgrade-report.md`; original Stages 1-5 are landed, but follow-on parity and cleanup work remains

Related inputs:

- `docs/reports/2026-04-17-canon-workbench-upgrade-report.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `src/components/features/Settings/SettingsThemeTab.tsx`
- `src/app/useAppShellEffects.ts`
- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/Inspector/GlobalInspectorPanel.tsx`
- `src/components/ui/chrome.ts`
- `src/utils/themeSurfaces.ts`
- `src/utils/themeBackground.ts`
- `src/utils/themeFonts.ts`
- `src/index.css`

## Goal

Turn the April 17 canon workbench report into an execution roadmap that favors clean cutovers over indefinite incrementalism.

This roadmap is intentionally stage-based, but each stage is meant to land as an end-to-end contained slice:

- Sherlock-owned shell and docking primitives
- one unified theme platform
- full theme-workbench parity with canon where it materially improves Sherlock
- proper dark/light editing, save, revert, and export behavior
- shared controls and route-shell cleanup that make the new theme system real across the app

This is not a plan to import canon wholesale.

It is a plan to finish Sherlock's shell/theme cleanup with decisive adoption boundaries.

## North Star

By the end of this roadmap, Sherlock should have:

- a Sherlock-owned `PageShell` and `DockPanel` contract that can host left/right utility panels cleanly
- a single `SherlockTheme` object that owns accent, surfaces, background, graph colors, typography, shell geometry, radii, divider strength, and control chrome
- a settings workbench that is truly docked, mode-aware, and theme-library-aware rather than a stack of local settings cards
- dark and light themes edited as first-class separate modes, with save/revert/reset/export behavior that respects the split
- canon-level slider and theme parameter parity for the shared shell surfaces, plus any missing Sherlock-specific parameterized controls needed to finish the cleanup
- major routed surfaces pulling from theme tokens and shell contracts instead of hard-coded `bg-black`, `border-zinc-*`, and `text-zinc-*` classes

## Locked Decisions

### 1. Canon is reference material, not a second runtime

- Treat `canon-design/` as the design/reference source.
- Do not mount the canon app inside Sherlock.
- Do not import canon files wholesale and run two parallel design systems.

### 2. Full cutovers beat compatibility-era drift

- Each stage should remove or retire superseded paths in the same stream whenever feasible.
- Temporary bridges are acceptable only when their removal is part of the same stage's exit criteria.
- Do not ship long-lived "old theme plus new theme" or "old shell plus new shell" dual systems.

### 3. Theme-platform work lands as one real platform

- `SherlockTheme` replaces the current split theme objects.
- Dark and light editing are first-class, separate, and explicitly persisted.
- Theme slots/library behavior is part of the same cutover.
- Canon-style shipped presets should come over as full editable theme templates, not fixed read-only presets.
- Those theme templates remain separate from Sherlock's workflow/protocol template domain and should not reuse `WorkspaceTemplate`.

### 4. Theme parity means more than copying sliders

- When the new theme system lands, it should bring over the meaningful canon workbench parameter families in one pass:
  - surfaces
  - background
  - graph colors
  - typography
  - shell widths and layout geometry
  - toolbar/header sizing
  - density
  - radii
  - divider strength
  - control chrome
- If a parameter materially affects Sherlock's shared shell polish and is missing today, it should be considered part of the same theme-platform cutover rather than deferred into a vague follow-up.

### 5. Page-shell cleanup is part of the roadmap, not a "maybe later"

- The settings workbench is the first adopter, not the final destination for docked utility behavior.
- The broader `PageShell` cleanup across major routes is a required later stage, not an optional nice-to-have.

### 6. Canon conversation remains out of scope

- Do not port `canon-design/src/components/canon/conversation/*`.
- Do not port canon conversation styles.
- Chat can adopt shell/layout improvements only where those changes do not depend on canon conversation primitives.

## Delivery Model

Run this work in ordered cutover stages.

Recommended order:

1. Sherlock shell foundation cutover
2. Unified theme platform and settings workbench cutover
3. Shared controls and input-surface parity cutover
4. Routed theme adoption and shell cleanup closeout
5. App-shell workbench host and routed utility-panel adoption

Important staging rule:

- do not split Stage 2 into "theme schema now, parity later"
- do not split Stage 4 or Stage 5 into indefinite single-route experiments

The roadmap is only successful if each stage lands in a state the team would actually want to keep.

## Stage 1. Sherlock Shell Foundation Cutover

Purpose:

- create the Sherlock-owned layout and style layer that everything else can build on
- replace the current hard-coded shell assumptions with a placement-aware page-shell contract

Comes over from canon in this stage:

- the `PageShell` utility-slot concept
- the `DockPanel` left/right docking contract
- the split style-family organization for shell, controls, and workbench surfaces

Stays Sherlock-owned in this stage:

- existing feature data models and route composition
- `LibraryRail` and `GlobalInspectorPanel` domain semantics
- current theme persistence and current settings workbench behavior until Stage 2

Primary targets:

- new `src/components/system/layout/*`
- new `src/styles/system/*`
- `src/components/ui/chrome.ts`
- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/Inspector/GlobalInspectorPanel.tsx`
- `src/index.css`
- `README.md`
- `docs/operations/ARCHITECTURE.md`

Execution checklist:

1. Normalize stale `design-system` documentation references to `canon-design`.
2. Introduce Sherlock-owned `PageShell` and `DockPanel` primitives under a new system layer.
3. Split `src/index.css` into system style families such as shell, controls, surfaces, and workbench.
4. Refactor shared chrome classes and panel shells so they consume theme tokens instead of baking in `bg-black/95`, `border-zinc-800`, and similar values.
5. Rework left/right panel primitives so they are placement-aware infrastructure rather than permanently left-only or right-only assumptions.
6. Make `/settings` structurally able to host a docked utility workbench without yet changing the theme data model.

Exit criteria:

- Sherlock has a real reusable page-shell and dock contract
- shared shell chrome is token-ready rather than hard-coded around one dark palette
- `src/index.css` is no longer the long-term home for every shell/control/workbench rule
- settings can host a docked utility panel cleanly, even if the old theme UI is still present for one stage

## Stage 2. Unified Theme Platform And Settings Workbench Cutover

Purpose:

- replace the split theme model with one theme platform
- land the actual docked theme workbench with canon-level parity and proper dark/light separation
- close the remaining theme-platform parity and cleanup gaps before later routed-shell work continues

Comes over from canon in this stage:

- the unified `StudioTheme`-style schema shape, adapted as `SherlockTheme`
- one central CSS-var builder model
- canon-style theme-template behavior, where shipped presets become full editable theme templates with save/revert/reset/export flows
- workbench sectioning for accent, background, graph colors, surfaces, typography, shell, and export
- shell/control/radius/divider parameter families

Stays Sherlock-owned in this stage:

- Sherlock naming, storage integration, defaults, and migrations
- Sherlock-specific theme presets and any Sherlock-specific parameter additions
- the separation between theme templates and Sherlock's workflow/protocol templates
- the settings route and Sherlock runtime wiring

Primary targets:

- new `src/system/theme/schema.ts`
- new `src/system/theme/cssVars.ts`
- new `src/system/theme/storage.ts`
- new migration/helper files under `src/system/theme/`
- `src/app/useAppShellEffects.ts`
- `src/components/features/Settings/*`
- relevant store/config types and persistence helpers

Execution checklist:

1. Introduce `SherlockTheme` as the new source of truth for visual settings.
2. Add a typed migration from today's accent/surface/background/font settings into the new schema, including defaults for new shell/control/radius/divider fields.
3. Replace the split CSS-var builders with one `buildSherlockThemeCssVars(theme)` path.
4. Build the new settings workbench as a docked utility panel on top of Stage 1's shell primitives.
5. Land explicit dark-mode and light-mode editing with clear separation for previewing, saving, reverting, and resetting.
6. Bring the theme controls up to canon parity in one pass:
   - accent
   - background
   - graph colors
   - surfaces
   - typography
   - shell geometry
   - control chrome
   - radii
   - divider tuning
   - other missing parameterized items that materially affect Sherlock's shared shell polish
7. Add canon-style theme-template behavior:
   - shipped presets become full editable theme templates
   - duplicate or fork theme templates
   - save current
   - revert
   - factory reset active
   - factory reset all
   - export theme JSON
   - export resolved CSS vars
8. Surface the remaining missing theme controls needed to close the stage cleanly, including graph colors and any schema-backed sliders still absent from the workbench.
9. Remove the old split theme paths and compatibility-era theme state/actions from the active runtime once migration and workbench cutover are complete.

Exit criteria:

- Sherlock theme state is unified under one schema, including graph-color ownership
- the settings workbench is docked and feels like one coherent tool, not a stack of compatibility cards
- dark and light theme editing are clearly separate and persist correctly
- theme presets now behave as full editable theme templates
- graph colors and the remaining stage-owned theme sliders are surfaced in the workbench
- shell, radius, divider, and control settings visibly affect real app chrome
- old theme builders, split storage shapes, and compatibility-era theme shims are no longer the active path

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

Stage 4 closeout progress on April 17, 2026:

- `WorkspaceBoard`, `TimelineView`, `NetworkGraph`, and `OperationView` now compose through `PageShell` instead of keeping separate full-screen route wrappers.
- `Files`, `Feed`, `LiveMonitor`, `WorkspaceHome`, and `Chat` now also compose through `PageShell`, so every in-app route mounted by `AppShellRoutes` shares the same routed shell contract.
- Shared rail and inspector shells now default to theme-bound dock widths via `--osint-shell-rail-width`, `--osint-shell-utility-width`, and `--osint-shell-sidebar-width` instead of route-local width classes.
- Shared shell backdrops and several high-traffic menu/header seams now use shell tokens rather than route-local `bg-black` and `border-zinc-*` treatments.
- Route-local readers, dialogs, and feature-specific panels now use shared token-driven shell surfaces, including the artifact reader, board-agent rail, network graph overlays, and modal shell.
- Timeline relationship chips now use the Sherlock graph palette so routed shell cleanup includes visible graph-token adoption outside the settings preview.
- Remaining non-`PageShell` surfaces are intentionally outside Stage 4 scope: the public landing page plus route fallback/error states.
- `docs/operations/OPERATIONS_RUNBOOK.md`

## What's Completed

Audit note on April 17, 2026:

- The Stage 1-5 cutovers are substantially landed, but the canon workbench cutover is not fully closed.
- Sherlock's new workbench does not yet contain every canon-shipped theme template or every canon slider family.
- The shared app workbench host exists, but Settings is still its only live route consumer.
- Theme-platform cleanup is incomplete because legacy split-theme helpers and bootstrap compatibility reads still remain in active code paths.

Completed stages so far:

- Stage 1. Sherlock Shell Foundation Cutover
- Stage 2. Unified Theme Platform And Settings Workbench Cutover
- Stage 3. Shared Controls And Input-Surface Parity Cutover
- Stage 4. Routed Theme Adoption And Shell Cleanup Closeout
- Stage 5. App-Shell Workbench Host And Routed Utility-Panel Adoption

Delivered from those completed stages:

- Sherlock now has a reusable `PageShell` and `DockPanel` foundation with placement-aware left/right dock primitives under the system layout layer.
- `src/index.css` has been split into system style families, and shared shell chrome now leans on theme tokens instead of one hard-coded dark palette path.
- Theme persistence is unified under one `SherlockTheme` workspace model with saved and draft templates plus explicit dark/light preview separation.
- The active CSS-var runtime now builds from one central `SherlockTheme` path rather than the older split accent/background/surface/font builders.
- Settings has been cut over onto the unified theme workspace with template selection, save/revert/reset flows, fork-to-custom-slot behavior, and JSON/CSS export.
- Shared shell, surface, toolbar, divider, and radius styling now responds to the new theme workspace so the settings work is not only preview-deep.
- Sherlock now has a shared system control layer under `src/components/system/controls/*`, including `RangeField`, `DateRangePicker`, `FieldRow`, and `PopupSurface`.
- The settings theme workbench sliders now use the shared range-field contract instead of custom slider markup.
- Run Setup, Guided Run Builder, Feed, and Live Monitor now share one date-range control model, including toolbar-trigger and inline field variants.
- Shared runtime-behavior sliders, including thinking budget and live-monitor counts, now route through the same range-control family instead of per-surface implementations.
- WorkspaceBoard, Timeline, NetworkGraph, Operation View, and Settings now share one obvious routed page-shell contract with theme-bound shell widths and toolbar sizing.
- Files, Feed, Live Monitor, Workspace Home, and Chat now share that same routed page-shell contract, closing the leftover Stage 4 page-shell gaps.
- Route-local readers and dialogs now reuse token-driven shell surfaces instead of route-specific dark wrappers, so the Sherlock theme now reaches artifact reading, board-agent flows, and network graph overlays.
- Timeline relation chips now consume the Sherlock graph palette tokens so graph-theme changes affect the real routed shell rather than only the settings preview.
- The app shell now owns one shared workbench host with a sidebar trigger, app-level left/right dock placement, and route-pluggable utility-panel registration through `useRegisterAppWorkbenchPanel()`.
- Settings is now the first live consumer of that shared host, moving its theme draft/export utility rail out of a settings-only right-dock assumption.
- README and architecture docs have been updated to reflect the landed shell, theme-platform, and shared-control behavior.

Stage 5 closeout progress on April 17, 2026:

- `AppShell.tsx` now mounts a shared workbench host around the routed shell while `Sidebar.tsx` exposes the global workbench trigger.
- The shared host now owns app-level open/close state plus left/right dock placement instead of leaving those behaviors inside one route.
- `src/app/workbench/AppWorkbenchContext.ts`, `AppWorkbenchHostProvider.tsx`, `AppWorkbenchHost.tsx`, and `useAppWorkbenchHost.ts` define the routed utility-panel registration contract for future consumers.
- `Settings/index.tsx` now registers theme draft/export utility content into that shared host, and `SettingsThemeWorkbenchPanel.tsx` isolates the migrated utility content from the routed settings page shell.

## Audit Findings On Remaining Cutover Work

The April 17 implementation audit found these remaining gaps:

- Missing canon theme templates in Sherlock's shipped theme library:
  - `blueberry`
  - `midnight`
  - `crimson`
- Missing canon slider families in Sherlock's current `SherlockTheme` schema and workbench:
  - graph opacity
  - background opacity for dark/light background tuning
  - per-surface opacity for shell/panel/rail/surface tuning
  - selected-font-family role-profile tuning, where canon keeps the global size/weight sliders but also shows one slider set for the currently selected role/family:
    - `sizeAdjust`
    - `weightAdjust`
    - `trackingAdjust`
    - `leadingAdjust`
- Missing canon font options in Sherlock's current theme font catalog:
  - `instrument-sans`
  - `archivo`
  - `azeret-mono`
- `SettingsThemeTab.tsx` currently renders `Background Glow` and `Scanline Strength` sliders, but their change handler does not write those fields back into theme state, so those controls are currently no-op UI.
- The active workbench host contract is still effectively Settings-only because no other routed surface registers into `useRegisterAppWorkbenchPanel()`.
- Legacy split-theme helpers still leak into the active theme platform through defaults, parsing, and bootstrap migration wiring in:
  - `src/utils/themeSurfaces.ts`
  - `src/utils/themeBackground.ts`
  - `src/utils/themeFonts.ts`
  - `src/store/actions/bootstrapActions.ts`

Those gaps are small enough to close decisively, but they mean the roadmap should no longer treat the cutover as fully complete.

## Stage 3. Shared Controls And Input-Surface Parity Cutover

Purpose:

- finish the control-level adoption so the new workbench and the rest of the app use one control language
- replace the repeated raw slider and date-pair implementations with Sherlock-owned primitives

Comes over from canon in this stage:

- `RangeField`
- `DateRangePicker`
- supporting small control helpers such as `FieldRow`, `PopupSurface`, `SegmentedTabs`, and `OptionGroup` where they are genuinely needed

Stays Sherlock-owned in this stage:

- feature-specific labels, presets, and actions
- run-setup logic, live-monitor logic, and Sherlock flow orchestration
- Sherlock-owned control naming and composition

Primary targets:

- new `src/components/system/controls/*`
- `src/components/features/Settings/SettingsThemeTab.tsx`
- `src/components/features/Runs/RunSetupModal.tsx`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/LiveMonitor/SettingsPanel.tsx`
- `src/components/features/Feed.tsx`

Execution checklist:

1. Finalize Sherlock-owned range, date-range, and supporting field primitives in the system control layer.
2. Ensure the new theme workbench sliders are using the same control family rather than keeping one-off range markup.
3. Replace the duplicated native date-pair UI in Run Setup, Guided Run Builder, Live Monitor, and Feed.
4. Replace remaining raw range controls in touched surfaces with the shared range field contract.
5. Standardize toolbar-style versus field-style date-range triggers where appropriate.
6. Remove duplicated slider/date helper logic that becomes obsolete after adoption.

Exit criteria:

- the major remaining raw slider and date-pair implementations are gone from the targeted surfaces
- theme editing and non-theme configuration surfaces share one control language
- slider and date behavior are reusable and easier to evolve from one place

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

## Stage 4. Routed Theme Adoption And Shell Cleanup Closeout

Purpose:

- finish the shell cleanup by moving major routed surfaces onto the new page-shell contract
- make the theme system real across the most visible app surfaces
- finish routed shell adoption before introducing the shared app-shell workbench host behavior

Comes over from canon in this stage:

- routed page-shell organization
- final shell-width and divider/radius tuning patterns where they strengthen consistency

Stays Sherlock-owned in this stage:

- feature-local content models and route-specific behavior
- Sherlock's current chat/conversation implementation
- existing runtime, persistence, and workspace-domain boundaries outside the theme/shell system

Primary targets:

- `src/components/features/Settings/index.tsx`
- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/NetworkGraph/index.tsx`
- `src/components/features/OperationView/index.tsx`
- shared page wrappers and route-level shell adapters
- remaining shared shell CSS and token helpers

Execution checklist:

1. Adopt the new `PageShell` contract across the major panel-heavy routed surfaces, starting from the completed Settings cutover and carrying it through WorkspaceBoard, Timeline, NetworkGraph, and Operation View.
2. Bind route shell widths, utility widths, toolbar sizing, divider treatment, radii, and graph-color usage to `SherlockTheme` rather than route-local constants.
3. Sweep remaining high-visibility hard-coded `bg-black`, `border-zinc-*`, and `text-zinc-*` shell classes out of the routed page wrappers and shared chrome seams.
4. Remove obsolete compatibility helpers, dead CSS, and shell code paths left over from the old layout system.
5. Confirm that the new theme parameters materially affect the real app shell rather than only the settings preview surfaces.
6. Leave shared app-shell workbench host behavior, global shell triggers, and route-pluggable utility panels for Stage 5.

Exit criteria:

- the primary routed surfaces share one obvious page-shell contract
- the theme system reaches the real application shell, not just settings previews
- old compatibility-era shell code is removed rather than lingering beside the new system
- Sherlock feels like one cleaned-up shell family rather than a mix of old route wrappers and new workbench ideas

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

## Stage 5. App-Shell Workbench Host And Routed Utility-Panel Adoption

Purpose:

- introduce the app-level workbench host behavior after the routed shell contracts are cleaner and more consistent
- let sidebar or shell chrome open one shared utility-panel area that routed surfaces can plug into without page-specific dock logic

Comes over from canon in this stage:

- shared workbench-host behavior with shell-level open/close and left/right dock control patterns
- utility-panel slot behavior for major workspace surfaces

Stays Sherlock-owned in this stage:

- feature-local content models and route-specific behavior
- Sherlock's current chat/conversation implementation
- the exact panel registry, labels, and trigger semantics that fit Sherlock's shell

Primary targets:

- app-shell chrome and shared workbench host wiring
- routed utility-panel registration contracts
- `src/components/features/Settings/index.tsx`
- panel-heavy routed surfaces that should plug into the shared utility-panel system

Execution checklist:

1. Introduce a shared app-shell workbench host so sidebar or shell chrome can open one routed utility-panel area without hard-wiring the theme workbench to `/settings`.
2. Add a global shell trigger for the workbench and make left/right docking an app-level behavior rather than a settings-only affordance.
3. Define the route-level contract for workbench consumers so theme panels and future utility panels can register into the shared system without forking shell logic.
4. Migrate the theme workbench out of its settings-only dock assumptions where that improves the shared shell model.
5. Confirm future utility panels can plug into the same host cleanly without introducing a second docking system.

Exit criteria:

- the app shell owns a reusable workbench host with a global trigger and route-pluggable utility-panel behavior
- left/right docking for the shared workbench is an app-level behavior rather than a settings-only affordance
- Sherlock has one obvious utility-panel system for future routed work instead of page-specific dock patterns

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

## Stage 6. Canon Theme Parity Repair And Workbench Fidelity

Purpose:

- close the remaining canon-theme parity gaps uncovered by the April 17 audit
- finish the slider families that were simplified or dropped during the first Sherlock cutover
- repair theme-workbench controls that currently render but do not actually mutate theme state

Comes over from canon in this stage:

- the remaining shipped theme templates that Sherlock intends to keep
- the remaining canon opacity axes for graphs, backgrounds, and surfaces
- role-profile typography tuning for per-font family adjustment
- the missing canon font options that are part of the workbench's selectable catalog

Stays Sherlock-owned in this stage:

- the `SherlockTheme` name and persistence model
- Sherlock-specific defaults and template descriptions
- Sherlock's choice to keep any additional shell/radius controls that go beyond canon

Primary targets:

- `src/system/theme/schema.ts`
- `src/system/theme/cssVars.ts`
- `src/system/theme/storage.ts`
- `src/components/features/Settings/SettingsThemeTab.tsx`
- `src/components/features/Settings/useSettingsThemeState.ts`
- `src/utils/themeFonts.ts`
- targeted theme/workbench tests under `src/system/theme/` and `src/components/features/Settings/`

Execution checklist:

1. Add the missing canon-shipped theme templates to Sherlock's library
2. Extend `SherlockTheme` to represent the canon opacity axes that are still missing:
   - graph opacity
   - background dark/light opacity
   - surface opacity per shell/panel/rail/surface slot
3. Surface those schema-backed opacity controls in the Sherlock workbench so the new workbench truly contains the canon slider families it claims to cover.
4. Restore canon-style typography role-profile tuning for `ui`, `display`, `label`, and `mono`, keeping the current global size/weight controls but also surfacing the selected-role slider set in the type tab:
   - `sizeAdjust`
   - `weightAdjust`
   - `trackingAdjust`
   - `leadingAdjust`
5. Add the missing canon font options still absent from Sherlock's font catalog.
6. Fix the current `Background Glow` and `Scanline Strength` controls so they mutate theme state and persist correctly.
7. Add or update focused tests that prove the new sliders round-trip through schema, storage, CSS-var generation, and settings UI behavior.

Exit criteria:

- Sherlock's theme library includes the canon theme templates that are still in scope for adoption
- the workbench contains the remaining canon slider families rather than approximations or silent omissions
- the type workbench keeps the global typography controls and also exposes the selected-family slider set canon uses for per-role tuning
- no visible theme slider in Settings is a no-op
- graph, background, surface, and typography profile tuning all round-trip through the unified theme workspace cleanly

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

## Stage 7. Theme Platform Consolidation, Workbench Adoption, And File Discipline

Purpose:

- finish the cleanup work that Stage 2 and Stage 5 left behind
- keep the unified theme platform from carrying forward long-lived legacy helper paths
- make the shared workbench host a real app-shell capability instead of a Settings-only abstraction
- tighten Sherlock's file and documentation discipline around system-layer ownership

Comes over from canon in this stage:

- the expectation that shell/workbench/theme infrastructure lives in a clearly owned system layer
- the discipline that shared host infrastructure should serve more than one route before being treated as complete

Stays Sherlock-owned in this stage:

- exact route consumers for the shared workbench host
- the final folder layout and naming conventions
- Sherlock's migration and documentation strategy

Primary targets:

- `src/system/theme/*`
- `src/store/actions/bootstrapActions.ts`
- `src/app/workbench/*`
- `src/components/features/Settings/*`
- candidate routed consumers such as `Timeline`, `WorkspaceBoard`, `NetworkGraph`, or `OperationView`
- `README.md`
- `docs/operations/ARCHITECTURE.md`

Execution checklist:

1. Move split-theme compatibility parsing/default helpers out of general-purpose `src/utils/` ownership and into an explicitly legacy or migration-scoped theme location, or remove them entirely where they are no longer needed.
2. Ensure old settings keys such as `theme_mode`, `theme_surface_settings`, `theme_font_settings`, and `theme_background_settings` are treated as migration inputs rather than ongoing platform dependencies.
3. Break the large Settings theme workbench implementation into a dedicated theme-workbench subfolder so library, tab sections, shell controls, export surfaces, and shared helpers are easier to audit and evolve.
4. Adopt the shared app workbench host in at least one additional routed surface, or explicitly re-scope the host documentation if the team intends it to remain Settings-only for now.
5. Update repository-facing operational anchors and docs so they point at current files and ownership boundaries; for example, store/system references should reflect `workspaceStore` rather than stale `caseStore` naming.
6. Sweep the docs for any remaining claims that the canon cutover is complete before the parity and cleanup stages above have actually landed.

Exit criteria:

- the active theme platform no longer depends on legacy split-theme helpers living as ordinary shared utilities
- the app-shell workbench host is either genuinely multi-consumer or explicitly documented as intentionally scoped
- Settings theme-workbench code is organized as a maintained feature area rather than one oversized leaf file
- repository instructions and architecture docs point to current system anchors and ownership boundaries

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

## What Explicitly Does Not Come Over

- canon conversation/chat primitives
- mounting canon's app shell inside Sherlock
- storing visual theme templates in `TemplateRepository` or `WorkspaceTemplate`
- a second parallel component namespace that leaves Sherlock with both old and canon raw primitives indefinitely

## Completion Standard

This roadmap is complete only when:

1. Sherlock owns a reusable `PageShell` and `DockPanel` contract.
2. Shared shell chrome is token-driven rather than dark-class-driven.
3. `SherlockTheme` replaces the split theme objects as the active visual source of truth, including graph colors.
4. The settings workbench is docked, theme-template-aware, and dark/light separated.
5. Theme controls reach canon parity for the shared shell and control parameters that matter to Sherlock's cleanup, including graph colors, the remaining missing opacity sliders, and the selected-family typography role-profile sliders in addition to the global typography controls.
6. Shared range/date controls replace the major duplicated raw implementations.
7. Major routed surfaces adopt the new shell contract and visibly respond to theme shell settings.
8. The app shell owns one shared workbench host for routed utility panels instead of leaving docking behavior trapped inside Settings.
9. The shipped Sherlock theme library contains every canon theme template Sherlock has decided to keep, with any intentional omissions documented.
10. Visible theme sliders in Settings all mutate real schema-backed theme fields and persist correctly.
11. Legacy split-theme helpers are retired or isolated as migration-only code rather than continuing as active platform structure.
12. Canon conversation remains out of scope and Sherlock does not end up running two design systems in parallel.

## Validation Standard

For implementation work driven by this roadmap, default per-stage validation should remain:

- `npm run lint`
- `npm run typecheck`
- the narrowest targeted test command(s) that credibly cover the touched files
- `npm run build` when shipped app code, shell contracts, styling systems, routing, or shared runtime behavior are affected

Run the full suite with `npm run test` when the shell or theme work becomes cross-cutting enough that targeted coverage would be misleading.
