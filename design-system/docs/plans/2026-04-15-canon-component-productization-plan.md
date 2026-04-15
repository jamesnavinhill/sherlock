# Canon Component Productization Plan

## Purpose

Capture where the standalone design-system studio is right now, how the extracted component layer is organized, and the next steps required to keep turning it into a cleaner package-style design system.

This is a design-system plan for `design-system/`, not a Sherlock runtime plan.

## Current State

The studio is no longer one large hand-built demo page.

The main page in `design-system/src/App.tsx` now consumes a reusable canon component layer under:

- `design-system/src/components/canon/controls/*`
- `design-system/src/components/canon/conversation/*`
- `design-system/src/components/canon/disclosure/*`
- `design-system/src/components/canon/layout/*`
- `design-system/src/components/canon/navigation/*`
- `design-system/src/components/canon/surfaces/*`
- `design-system/src/components/canon/utils/*`
- `design-system/src/components/canon/workbench/*`
- `design-system/src/components/canon/index.ts`

That canon layer currently covers:

- page shell composition
- left and right rail composition
- sidebar navigation
- toolbar grouping
- buttons and icon buttons
- badges
- select/menu/popover/search controls
- disclosure and accordion behavior
- card and empty-state surfaces
- modal shell plus structured config/workflow overlay surfaces
- chat composer
- transcript rendering
- workbench controls and token export

The design-system studio now proves these primitives in a real page instead of keeping the shell behavior inside `App.tsx`.

## What Landed Already

### 1. Real shell extraction

These are now standalone reusable components:

- `PageShell`
- `SidebarNav`
- `PanelRail`
- `ToolbarBar`
- `ToolbarCluster`

This means the studio has a real reusable shell contract instead of a one-off layout.

### 2. Real control extraction

These are now standalone reusable controls:

- `Button`
- `IconButton`
- `Badge`
- `SegmentedTabs`
- `SelectField`
- `MenuButton`
- `PopoverButton`
- `SearchField`
- `CopyButton`

This means buttons, menus, selectors, and search are no longer implicit page markup.

### 3. Real surface extraction

These are now reusable surfaces:

- `SurfaceCard`
- `ActionCard`
- `EmptyStateCard`
- `PanelNote`
- `MetricGrid`
- `ResponsiveGrid`
- `ModalDialog`

This means card-like patterns are now canonized instead of embedded in showcase JSX.

### 4. Real conversation extraction

These are now reusable conversation pieces:

- `ChatComposer`
- `ChatTranscript`

This means the studio can act as a reference for conversation-oriented product surfaces too.

### 5. Working interaction and mobile behavior

The studio now has:

- functioning collapsibles
- a collapsible desktop sidebar with icon-first navigation mode
- toolbar actions that compact to icon-first controls as space tightens
- mobile overlay sheets for sidebar and rails
- more resilient responsive card fitting
- a non-blocking docked workbench

## Productization Status Update

The grouped-file intermediate stage has now been replaced by a package-style canon tree.

The canon layer currently ships as:

- per-component files under `controls/`, `conversation/`, `disclosure/`, `layout/`, `navigation/`, `surfaces/`, and `workbench/`
- family-based styles under `src/styles/`, re-exported through `src/index.css`
- shared helpers under `utils/`
- a single top-level `canon/index.ts` export surface

The remaining productization work is now:

- direct canon component tests
- extraction-oriented inventory and package documentation

## Historical Context: Why The Files Did Not Yet Look Like A Final Package

The extracted canon layer is grouped by responsibility, not yet split into one file per component.

Current grouping:

- `controls.tsx` groups related form/control primitives
- `shell.tsx` groups layout and navigation shell primitives
- `surfaces.tsx` groups card/modal/empty-state surface primitives
- `disclosure.tsx` groups accordion components and disclosure hooks
- `chat.tsx` groups conversation primitives

This was intentional.

The first extraction goal was:

- prove the component seams are real
- make `App.tsx` consume those seams
- stabilize the API families
- fix shell/mobile/disclosure behavior

The goal was not yet:

- perfect package-style file granularity
- final naming taxonomy
- final folder tree
- final testing strategy

In other words:

- the component concepts are now real
- the file structure is still in the “organized extraction” stage, not the “publication-ready package” stage

## Architectural Read

The current design-system state is acceptable as an intermediate step because the highest-value work has landed:

- shell boundaries are real
- shared component vocabulary exists
- mobile shell behavior is no longer ad hoc
- disclosure behavior is no longer broken
- the studio is exercising reusable pieces instead of bypassing them

The main thing still missing is productization polish:

- explicit tests around the canon components
- extraction-oriented docs for the public inventory and package boundary

## Target Outcome

Move from the current grouped canon layer to a more package-like component tree while preserving the now-working APIs and behaviors.

The end state should:

- keep the design system self-contained
- preserve the current shell and interaction behavior
- expose a clearer component inventory
- make extraction into a separate repository or package much easier

## Proposed Target Structure

Recommended next file tree:

```text
design-system/
  src/
    components/
      canon/
        layout/
          PageShell.tsx
          PanelRail.tsx
          SidebarNav.tsx
        navigation/
          Toolbar.tsx
          ToolbarCluster.tsx
        controls/
          Button.tsx
          IconButton.tsx
          Badge.tsx
          SegmentedTabs.tsx
          SelectField.tsx
          MenuButton.tsx
          PopoverButton.tsx
          SearchField.tsx
          CopyButton.tsx
        disclosure/
          AccordionSection.tsx
          useExclusiveDisclosure.ts
          useDisclosureSet.ts
        surfaces/
          SurfaceCard.tsx
          ActionCard.tsx
          EmptyStateCard.tsx
          PanelNote.tsx
          MetricGrid.tsx
          ResponsiveGrid.tsx
          ModalDialog.tsx
        conversation/
          ChatComposer.tsx
          ChatTranscript.tsx
          types.ts
        workbench/
          Workbench.tsx
        utils/
          cx.ts
        index.ts
```

This is the structure the canon layer now follows, which preserves the family boundaries while making the exported component inventory feel obvious and conventional.

## Phase Plan

### Phase 1: Stabilize The Current Canon API

Goal:

- keep behavior stable while treating the current grouped files as the source of truth

Tasks:

- avoid changing component behavior unless there is a real defect
- continue using the studio as the reference consumer
- verify the current props are good enough before splitting files further

Exit criteria:

- no major API churn needed after another round of use

### Phase 2: Split Grouped Files Into Per-Component Files

Goal:

- make the system easier to browse and more obviously reusable

Status:

- completed on `2026-04-15`

Tasks:

- move `Button`, `IconButton`, `Badge`, and related controls into individual files
- move shell pieces into `layout/` and `navigation/`
- move `SurfaceCard`, `ModalDialog`, `EmptyStateCard`, and friends into `surfaces/`
- move transcript/composer pieces into `conversation/`
- keep a single top-level `canon/index.ts` as the export surface

Constraints:

- do not rewrite behavior during the file split
- keep class names and API shapes unchanged wherever possible

Exit criteria:

- expected file names like `Button.tsx`, `PanelRail.tsx`, and `SurfaceCard.tsx` exist

### Phase 3: Tighten CSS Organization

Goal:

- reduce the monolithic feel of `src/index.css`

Status:

- completed on `2026-04-15`

Tasks:

- keep token and document-level base styles centralized
- separate shell/layout styles from component styles
- separate conversation-specific styling from general surface styling
- only split CSS after component file boundaries settle

Recommended direction:

- `styles/base.css`
- `styles/shell.css`
- `styles/controls.css`
- `styles/surfaces.css`
- `styles/conversation.css`
- `styles/workbench.css`

Exit criteria:

- developers can find a component’s markup and styling without scanning the entire stylesheet

### Phase 4: Add Canon Component Tests

Goal:

- validate the extracted design-system pieces directly

Recommended coverage:

- `AccordionSection` open/close behavior
- `ModalDialog` open/close and Escape handling
- `PanelRail` open state and mobile state behavior
- `SearchField` result filtering
- `SelectField` selection behavior
- `ChatComposer` submit/disabled states
- `ChatTranscript` empty state and disclosure rendering

Exit criteria:

- component-level regressions are caught without relying only on manual studio inspection

### Phase 5: Prepare For Extraction Out Of Sherlock

Goal:

- make the design system easier to move to its own repository or package

Tasks:

- audit remaining assumptions tied to the current studio app
- ensure component names and exports are clean
- document the public component inventory
- document token and CSS-var expectations
- decide whether the workbench ships with the package or remains studio-only

Exit criteria:

- the canon layer can be moved with minimal path churn and minimal restructuring

## Naming And Structure Recommendations

### Keep “canon” for now

`src/components/canon/` is a good intermediate name while the system is still being extracted and shaped.

Possible later rename:

- `src/components/system/`
- `src/components/ui/`
- `src/canon/`

Recommendation:

- do not rename the root folder yet
- finish CSS and test productization first

### Keep `PanelRail` general

Current behavior suggests `PanelRail` should remain the general rail primitive used for both:

- library/browse rail
- inspector/detail rail

That appears to be the right canon abstraction.

### Keep `PageShell` as the top-level layout contract

`PageShell` is the correct anchor component for:

- sidebar
- toolbar
- left rail
- content
- right rail
- overlay/backdrop behavior
- floating workbench or docked secondary surfaces

That should remain the shell anchor rather than being broken into less meaningful top-level pieces.

## Open Questions

These do not block the next phase, but they should be answered before extraction out of Sherlock:

1. Should `ToolbarBar` and `ToolbarCluster` stay separate, or should they become one `Toolbar` file with sub-exports?
2. Should the canon workbench remain one app-facing component, or split into smaller subcomponents and tab files?
3. Should conversation components stay inside the same canon package, or eventually move into an optional “ai/conversation” layer?
4. How much styling should remain class-based in one stylesheet versus moving to more local CSS organization?

## Validation Expectations For The Next Pass

For non-trivial design-system refactors, run:

```bash
cd design-system
npm run typecheck
npm run build
```

For structural component work, also verify:

- desktop layout
- mobile drawer behavior
- accordion open/close behavior
- modal visibility/dismissal
- transcript and composer layout

When the next split touches the main Sherlock repo again, continue running the narrowest credible repo validation rather than defaulting to the full test suite.

## Recommended Immediate Next Step

The next best step is:

1. add direct canon component tests around accordion, modal, rail, search, select, composer, and transcript behavior
2. document the public component inventory and CSS-var expectations before any extraction work starts
3. audit the remaining studio-specific assumptions before extraction work begins

That keeps momentum high and builds on the finished file split and CSS split without reopening the behavior work that already landed.

## Summary

The design-system extraction is past the “mock page” stage and into the “real reusable layer” stage.

What is true now:

- the component concepts are real
- the studio uses them
- shell, rail, modal, disclosure, and conversation seams are extracted
- mobile behavior is canonized

What is not done yet:

- direct component tests
- extraction-ready packaging polish

That means the system is in a strong intermediate state, and the next pass should focus on CSS organization, tests, and extraction polish rather than re-deriving the component model again.
