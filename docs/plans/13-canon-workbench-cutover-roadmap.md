# Canon Workbench Cutover Roadmap

Date audited: April 17, 2026

Status: Active roadmap derived from `docs/reports/2026-04-17-canon-workbench-upgrade-report.md`

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
- a single `SherlockTheme` object that owns accent, surfaces, background, typography, shell geometry, radii, divider strength, and control chrome
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
4. Routed page-shell adoption and cleanup closeout

Important staging rule:

- do not split Stage 2 into "theme schema now, parity later"
- do not split Stage 4 into indefinite single-route experiments

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

Comes over from canon in this stage:

- the unified `StudioTheme`-style schema shape, adapted as `SherlockTheme`
- one central CSS-var builder model
- canon-style theme-template behavior, where shipped presets become full editable theme templates with save/revert/reset/export flows
- workbench sectioning for accent, background, surfaces, typography, shell, and export
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
8. Remove the old split theme paths from the active runtime once migration and workbench cutover are complete.

Exit criteria:

- Sherlock theme state is unified under one schema
- the settings workbench is docked and feels like one coherent tool, not a stack of compatibility cards
- dark and light theme editing are clearly separate and persist correctly
- theme presets now behave as full editable theme templates
- shell, radius, divider, and control settings visibly affect real app chrome
- old theme builders and split storage shapes are no longer the active path

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

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

## Stage 4. Routed Page-Shell Adoption And Cleanup Closeout

Purpose:

- finish the shell cleanup by moving major routed surfaces onto the new page-shell contract
- make the theme system real across the most visible app surfaces
- introduce the app-level workbench host behavior so routed surfaces can plug into one shared utility-panel system rather than each page inventing its own dock rules

Comes over from canon in this stage:

- routed page-shell organization
- utility-panel slot behavior for major workspace surfaces
- shared workbench-host behavior with shell-level open/close and left/right dock control patterns
- final shell-width and divider/radius tuning patterns where they strengthen consistency

Stays Sherlock-owned in this stage:

- feature-local content models and route-specific behavior
- Sherlock's current chat/conversation implementation
- existing runtime, persistence, and workspace-domain boundaries outside the theme/shell system

Primary targets:

- app-shell chrome and shared workbench host wiring
- `src/components/features/Settings/index.tsx`
- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/NetworkGraph/index.tsx`
- `src/components/features/OperationView/index.tsx`
- shared page wrappers and route-level shell adapters
- remaining shared shell CSS and token helpers

Execution checklist:

1. Adopt the new `PageShell` contract across the major panel-heavy routed surfaces, starting from the completed Settings cutover and carrying it through WorkspaceBoard, Timeline, NetworkGraph, and Operation View.
2. Introduce a shared app-shell workbench host so sidebar or shell chrome can open one routed utility panel area without hard-wiring the theme workbench to `/settings`.
3. Add a global shell trigger for the workbench and make left/right docking an app-level behavior rather than a settings-only affordance.
4. Define the route-level contract for workbench consumers so theme panels and future utility panels can register into the shared system without forking shell logic.
5. Bind route shell widths, utility widths, toolbar sizing, divider treatment, and radii to `SherlockTheme` rather than route-local constants.
6. Sweep remaining high-visibility hard-coded `bg-black`, `border-zinc-*`, and `text-zinc-*` shell classes out of the routed page wrappers and shared chrome seams.
7. Remove obsolete compatibility helpers, dead CSS, and shell code paths left over from the old layout system.
8. Confirm that the new theme parameters materially affect the real app shell rather than only the settings preview surfaces.

Exit criteria:

- the primary routed surfaces share one obvious page-shell contract
- the app shell owns a reusable workbench host with a global trigger and route-pluggable utility panel behavior
- the theme system reaches the real application shell, not just settings previews
- old compatibility-era shell code is removed rather than lingering beside the new system
- Sherlock feels like one cleaned-up shell family rather than a mix of old route wrappers and new workbench ideas

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

## What Explicitly Does Not Come Over

- canon conversation/chat primitives
- mounting canon's app shell inside Sherlock
- storing visual theme templates in `TemplateRepository` or `WorkspaceTemplate`
- a second parallel component namespace that leaves Sherlock with both old and canon raw primitives indefinitely

## Completion Standard

This roadmap is complete only when:

1. Sherlock owns a reusable `PageShell` and `DockPanel` contract.
2. Shared shell chrome is token-driven rather than dark-class-driven.
3. `SherlockTheme` replaces the split theme objects as the active visual source of truth.
4. The settings workbench is docked, theme-template-aware, and dark/light separated.
5. Theme controls reach canon parity for the shared shell and control parameters that matter to Sherlock's cleanup.
6. Shared range/date controls replace the major duplicated raw implementations.
7. Major routed surfaces adopt the new shell contract and visibly respond to theme shell settings.
8. Canon conversation remains out of scope and Sherlock does not end up running two design systems in parallel.

## Validation Standard

For implementation work driven by this roadmap, default per-stage validation should remain:

- `npm run lint`
- `npm run typecheck`
- the narrowest targeted test command(s) that credibly cover the touched files
- `npm run build` when shipped app code, shell contracts, styling systems, routing, or shared runtime behavior are affected

Run the full suite with `npm run test` when the shell or theme work becomes cross-cutting enough that targeted coverage would be misleading.
