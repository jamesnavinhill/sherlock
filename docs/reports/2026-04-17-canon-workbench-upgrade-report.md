# Canon Workbench Upgrade Report

Status: This report now serves as the audit input for
`docs/plans/13-canon-workbench-cutover-roadmap.md`.

Use the roadmap for execution sequencing and stage boundaries.

## Goal

Assess which `canon-design` improvements are worth porting into Sherlock now, with emphasis on:

- left/right docking for the workbench panel
- the newer slider and theme-system wiring
- useful template and control standardization
- a better date picker / date-range surface
- broader UI organization and cleanup

Explicit non-goal:

- do not bring canon conversation/chat components into Sherlock

## Executive Summary

Sherlock is already closer to canon than it may look at first glance. It has:

- a shared panel family for left rails and right inspectors
- a live theme system with accent, surfaces, fonts, and background settings
- reusable run/template plumbing shared across Settings, Run Setup, and guided flows

The main gap is not raw capability. It is packaging and wiring.

Canon turns those ideas into:

- one reusable docked utility panel contract
- one unified theme schema and CSS-var builder
- reusable field primitives like `RangeField` and `DateRangePicker`
- split style families instead of one large stylesheet

Sherlock still spreads the same concerns across:

- route-local full-screen layouts
- raw `input[type="range"]` and `input[type="date"]` usage
- separate theme builders and settings-only UI
- many hard-coded `bg-black`, `border-zinc-800`, and `text-zinc-*` classes

My recommendation is:

1. do a selective canon extraction, not a wholesale port
2. start with a settings-first docked workbench and shared controls
3. unify theme state into one schema before trying to push more theme sliders into the app
4. keep canon conversation/chat out of scope entirely

## What Sherlock Already Has

Good existing foundations worth preserving:

- Shared rail and inspector shells already landed through `src/components/features/LibraryRail/LibraryRailShell.tsx` and `src/components/features/Inspector/GlobalInspectorPanel.tsx`.
- Settings is already split into focused surfaces through `src/components/features/Settings/index.tsx`, `SettingsThemeTab.tsx`, `SettingsRuntimeTab.tsx`, `SettingsTemplatesTab.tsx`, and `useSettingsController.ts`.
- Theme CSS vars are already applied centrally in `src/app/useAppShellEffects.ts`.
- Theme data already exists in structured form through:
  - `src/utils/themeSurfaces.ts`
  - `src/utils/themeBackground.ts`
  - `src/utils/themeFonts.ts`
- Protocol templates are already real persisted data through `TemplateGallery.tsx`, `TemplateRepository.ts`, and `WorkspaceTemplate`.

This matters because we are not starting from zero. The upgrade path is mostly consolidation plus a better shell contract.

## What Canon Adds That Sherlock Does Not Yet Have

| Area | Canon | Sherlock Today | Read |
| --- | --- | --- | --- |
| Docked workbench utility panel | `DockPanel` plus `PageShell` utility slots | no reusable utility-dock slot | Biggest structural gap |
| Unified theme schema | `StudioTheme` in `canon-design/src/system/schema.ts` | split accent/surface/background/font objects | Functional but fragmented |
| Unified CSS-var builder | `buildThemeCssVars` and `buildThemeCssText` | multiple builders in separate utils | Harder to scale |
| Theme library / theme slots | `THEME_TEMPLATES`, save/revert/factory reset | single current theme saved in config | No theme workspace/library |
| Shell tuning | shell widths, radii, divider strength, control chrome | not represented in theme state | Missing canon polish |
| Reusable slider field | `RangeField` + `FieldRow` | raw range inputs in several places | Easy win |
| Reusable date-range picker | `DateRangePicker` | duplicated native date pairs | Easy win |
| Split style families | `styles/base.css`, `shell.css`, `controls.css`, `workbench.css`, etc. | `src/index.css` is 2211 lines | Strong cleanup opportunity |
| Conversation/chat primitives | yes | yes, but Sherlock has its own chat | Out of scope by request |

## Key Findings

### 1. Sherlock does not currently have a real workbench panel

The closest equivalent is the `/settings` route, especially `SettingsThemeTab.tsx`.

Canon's workbench is different in two important ways:

- it is a docked utility panel, not a full-screen page
- it can move left or right through `DockPanel` and `PageShell`

Relevant canon references:

- `canon-design/src/components/canon/layout/DockPanel.tsx`
- `canon-design/src/components/canon/layout/PageShell.tsx`
- `canon-design/src/components/canon/workbench/Workbench.tsx`

Relevant Sherlock references:

- `src/components/features/Settings/index.tsx`
- `src/components/features/Settings/SettingsThemeTab.tsx`
- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/Inspector/GlobalInspectorPanel.tsx`

Important current limitation:

- `LibraryRailShell` is permanently left-anchored.
- `GlobalInspectorPanel` is permanently right-anchored.
- neither is a neutral utility panel primitive

That means left/right workbench docking cannot be added cleanly without either:

- a new `DockPanel`-style primitive, or
- a refactor of the existing panel shells into a placement-aware base component

### 2. Sherlock's theme model is good, but only partially wired

Sherlock already has:

- surface presets in `src/utils/themeSurfaces.ts`
- background settings in `src/utils/themeBackground.ts`
- font settings in `src/utils/themeFonts.ts`
- central application in `src/app/useAppShellEffects.ts`

But canon's schema is meaningfully broader:

- `SurfaceScale` has `shell`, `panel`, `rail`, and `surface`
- `ShellSettings` includes sidebar width, rail width, utility width, toolbar height, content width, density, surface opacity, and divider settings
- `RadiusSettings` and `ControlSettings` are also first-class
- theme templates live beside the schema rather than as ad hoc settings state

This is the main reason canon can support:

- shell geometry sliders
- control chrome switches
- divider/radius tuning
- theme slot save/revert/factory behavior

Sherlock cannot get those gains by only copying more sliders. It first needs a broader theme object.

### 3. Some of Sherlock's live theme state does not reach the biggest surfaces cleanly

This is the most important wiring issue I found.

Sherlock's theme vars are applied centrally in `useAppShellEffects.ts`, but many high-visibility shells still hard-code dark utility classes:

- `LibraryRailShell.tsx` uses `bg-black/95` and `border-zinc-800`
- `GlobalInspectorPanel.tsx` uses `bg-black/95`, `border-zinc-800`, and `bg-zinc-900/30`
- `chrome.ts` still bakes `bg-black/95` and `border-zinc-800` into shared chrome constants
- most routed surfaces still rely heavily on `bg-black`, `bg-zinc-*`, and `text-zinc-*`

So today:

- Sherlock can change parts of the theme system
- but the deepest shell surfaces are still partly driven by hard-coded utility classes

That means canon-style workbench expansion should be paired with token cleanup, otherwise the new controls will feel only half real.

### 4. Sherlock has duplicated date-range UI in multiple places

Current duplicated native date pairs:

- `src/components/features/Runs/RunSetupModal.tsx`
- `src/components/features/Chat/GuidedRunBuilder.tsx`
- `src/components/features/LiveMonitor/SettingsPanel.tsx`
- `src/components/features/Feed.tsx`

Canon already has a reusable `DateRangePicker` with:

- presets
- inline or field layout
- popover behavior
- a two-month calendar view
- clear/apply actions

Relevant reference:

- `canon-design/src/components/canon/controls/DateRangePicker.tsx`

This is one of the lowest-risk, highest-clarity ports available.

### 5. Sherlock has duplicated slider UI too

Current raw range inputs appear at least in:

- `src/components/features/Settings/SettingsThemeTab.tsx`
- `src/components/features/LiveMonitor/SettingsPanel.tsx`

Canon's `RangeField` gives:

- a standardized label/value row
- a styled progress track
- a reusable formatting hook
- less repeated markup around every slider

Relevant reference:

- `canon-design/src/components/canon/controls/RangeField.tsx`

This is another clear quick win.

### 6. Theme templates and protocol templates should stay separate

Sherlock already uses `templates` for reusable launch protocols:

- `TemplateGallery.tsx`
- `TemplateRepository.ts`
- `WorkspaceTemplate`

Canon uses "templates" for theme slots/library.

If we port canon's theme-library behavior, we should not overload Sherlock's existing `templates` domain object. That would create real naming confusion and persistence ambiguity.

Recommended distinction:

- keep `WorkspaceTemplate` for launch protocols
- add a separate `ThemeWorkspace` or `ThemePreset` concept for visual themes

### 7. Sherlock's route layouts already hint at a future canon-style shell

These routed surfaces all repeat a similar pattern:

- toolbar/top bar
- left rail
- main content
- right panel

Relevant files:

- `src/components/features/OperationView/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/features/NetworkGraph/index.tsx`
- `src/components/features/WorkspaceBoard/index.tsx`

That means a future `PageShell`-style abstraction is feasible.

I would not start there, though. It is the right long-term direction, but it is a higher-risk cross-route refactor than a settings-first docked workbench.

### 8. There is a repo naming/documentation cleanup to do first

Sherlock docs still reference `design-system/`:

- `README.md`
- `docs/operations/ARCHITECTURE.md`

But the current local reference folder is `canon-design/`.

That rename drift is worth fixing before implementation work starts, otherwise every planning and onboarding thread will be ambiguous about which reference tree is canonical.

## Recommended Implementation Path

### Phase 0: Stabilize the reference boundary

Goals:

- treat `canon-design/` as the reference source of truth
- update stale `design-system` references in docs
- explicitly define the import boundary for Sherlock

Recommended outcome:

- canon shell, control, disclosure, and theme-system files are eligible reference material
- canon conversation files are explicitly excluded

Do not port:

- `canon-design/src/components/canon/conversation/*`
- `canon-design/src/styles/conversation.css`

### Phase 1: Add Sherlock-side reusable primitives, not a second app

Recommended new Sherlock layer:

- `src/components/system/layout/`
- `src/components/system/controls/`
- `src/system/theme/`
- `src/styles/system/`

Recommended first components to derive from canon:

- `DockPanel`
- `RangeField`
- `DateRangePicker`
- supporting small helpers only as needed:
  - `FieldRow`
  - `PopupSurface`
  - `IconButton`
  - `NavTabs`
  - `SegmentedTabs`
  - `OptionGroup`
  - `useDismissableLayer`

Important note:

- do not mount `canon-design/src/App.tsx`
- do not import the whole canon namespace into Sherlock unchanged
- build a Sherlock-owned surface layer informed by canon

That avoids ending up with two parallel systems:

- `ds-*`
- `osint-*`

### Phase 2: Unify theme state into one object

Recommended new type:

- `SherlockTheme` derived from canon's `StudioTheme`

Suggested migration mapping from today's saved settings:

```ts
themeMode -> theme.mode
accentSettings -> theme.accent
themeSurfaceSettings.dark.background -> theme.surfaces.dark.shell
themeSurfaceSettings.dark.background -> theme.surfaces.dark.rail
themeSurfaceSettings.dark.panel -> theme.surfaces.dark.panel
themeSurfaceSettings.dark.surface -> theme.surfaces.dark.surface
themeSurfaceSettings.light.background -> theme.surfaces.light.shell
themeSurfaceSettings.light.background -> theme.surfaces.light.rail
themeSurfaceSettings.light.panel -> theme.surfaces.light.panel
themeSurfaceSettings.light.surface -> theme.surfaces.light.surface
themeBackgroundSettings.variant:grid -> theme.background.variant:dot-grid
themeBackgroundSettings.variant:plain -> theme.background.variant:plain
themeFontSettings -> theme.typography
canon defaults fill shell/radii/controls/graphs until Sherlock exposes them
```

Recommended new theme-system files:

- `src/system/theme/schema.ts`
- `src/system/theme/cssVars.ts`
- `src/system/theme/storage.ts`

Then have existing app code read from the unified theme object, even before every slider is exposed.

### Phase 3: Rewire theme application before adding more controls

Replace the current split model:

- `buildThemeSurfaceCssVars`
- `buildThemeBackgroundCssVars`
- `buildThemeFontCssVars`

with one central builder:

- `buildSherlockThemeCssVars(theme)`

Keep thin compatibility wrappers only if needed during migration.

Then update shared shells first:

- `src/components/ui/chrome.ts`
- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/Inspector/GlobalInspectorPanel.tsx`
- key page wrappers using hard-coded `bg-black`, `bg-black/95`, and `border-zinc-800`

This is the phase that makes future workbench sliders feel true instead of cosmetic.

### Phase 4: Build a settings-first docked workbench

Recommended first shipping target:

- keep `/settings` as the place where the full theme workbench lives
- replace the current theme tab body with a docked workbench panel that can move left or right

Why this first:

- lower blast radius than shell-wide utility slots
- gives immediate parity with the canon workbench behavior users asked for
- lets us validate the new theme schema and controls before touching every routed surface

Suggested layout:

- `/settings` stays routed
- center area keeps tab content
- theme workbench becomes a `DockPanel`-style utility panel
- the panel can dock left or right inside the settings surface

Recommended workbench sections:

- Theme library / slots
- Accent
- Background
- Surfaces
- Typography
- Shell
- Export

### Phase 5: Add theme library behavior

Recommended capabilities:

- multiple theme slots
- save current draft
- revert to saved
- factory reset active theme
- factory reset all
- export resolved CSS vars
- export theme JSON

Persistence recommendation:

- keep theme-library persistence app-level, not workspace-template-level
- most likely via `systemConfig` companion storage or a dedicated local-storage helper
- do not store theme presets in `TemplateRepository`

### Phase 6: Port the shared controls

#### Date range

Replace duplicated date pairs in:

- `RunSetupModal.tsx`
- `GuidedRunBuilder.tsx`
- `LiveMonitor/SettingsPanel.tsx`
- `Feed.tsx`

Use the canon picker behavior as the reference:

- presets where useful
- inline trigger for toolbars
- field trigger for form flows

#### Range controls

Replace raw sliders in:

- `SettingsThemeTab.tsx`
- `LiveMonitor/SettingsPanel.tsx`

This will immediately improve consistency and reduce repeated slider markup.

### Phase 7: CSS cleanup and standardization

Sherlock should not keep growing `src/index.css` while adopting canon ideas.

Recommended split:

- `src/styles/system/base.css`
- `src/styles/system/chrome.css`
- `src/styles/system/controls.css`
- `src/styles/system/surfaces.css`
- `src/styles/system/workbench.css`

Then make `src/index.css` an import hub plus truly global exceptions only.

This is also the right moment to move away from repeated one-off color utilities in shared shells.

### Phase 8: Optional later shell-wide utility slots

Only do this after the settings-first workbench succeeds.

Longer-term goal:

- introduce a `PageShell`-style routed shell contract
- let selected routes host left/right utility panels in addition to existing rails

Best candidate routes after `/settings`:

- `WorkspaceBoard`
- `Timeline`
- `NetworkGraph`
- `OperationView`

This is the path to full canon-like shell uniformity, but it is not required for the first upgrade pass.

## Suggested Scope for the First Real Build

Recommended first implementation slice:

1. normalize `design-system` -> `canon-design` references
2. add Sherlock-owned `RangeField`
3. add Sherlock-owned `DateRangePicker`
4. replace duplicated sliders and date pairs
5. introduce unified `SherlockTheme`
6. ship a dockable workbench inside `/settings`
7. add theme save/revert/export slots

Why this slice:

- it lands visible value quickly
- it avoids a risky whole-app shell rewrite
- it improves both the user-facing polish and the internal architecture

## What I Would Not Do

- do not copy canon conversation components
- do not import canon wholesale and run two design systems in parallel
- do not put theme presets into `WorkspaceTemplate`
- do not add more theme sliders before shell surfaces are token-driven
- do not start with a global route-shell rewrite unless the team explicitly wants a larger refactor

## Risks To Watch

### Theme migration risk

Moving from split theme objects to one schema can break persisted settings if migration is loose. Handle this with:

- a typed migration helper
- fallback defaults for new shell/radius/control fields
- tests for old saved settings

### Partial adoption risk

If sliders land before shell tokens are wired, the UI will feel inconsistent:

- workbench says the theme changed
- big panels still look fixed

### Dual-system risk

If Sherlock keeps `osint-*` and also adopts raw `ds-*` components/styles without a bridge layer, the repo will become less uniform, not more.

## Validation Path For The Eventual Implementation

For the first implementation slice, I would expect:

- `npm run lint`
- `npm run typecheck`
- targeted tests around changed surfaces
- `npm run build`

Likely targeted tests:

- settings controller/theme tests
- run setup / guided builder tests
- any new `DateRangePicker` and `RangeField` tests
- panel shell tests if a new dock panel is introduced

If the work expands into a shared routed shell refactor, that becomes cross-cutting enough that I would also run:

- `npm run test`

## Bottom Line

The best Sherlock upgrade path is:

- canon-inspired, not canon-wholesale
- settings-first, not shell-rewrite-first
- schema-first for theme wiring
- shared-controls-first for quick wins
- explicitly no canon chat/conversation adoption

If we follow that order, we get the visible wins the team wants now:

- dockable workbench
- better sliders
- better date controls
- cleaner theme/template organization

without taking on unnecessary risk from a full application shell migration in the first pass.
