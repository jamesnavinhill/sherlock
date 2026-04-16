# Canon Component Productization Plan

## Purpose

Define the next productization pass for `design-system/` around the real reusable asset:

- a reusable shell
- a reusable shipped workbench
- a canon component tree with obvious, simple file boundaries
- a stable systems layer that can be turned into multiple apps later

This is a design-system plan for `design-system/`, not an application runtime plan.

## Current Direction

The important thing is no longer the reference page itself.

The important thing is:

- the actual components
- the actual files
- the actual tokens and systems
- the actual reusable shell contract
- the actual shipped workbench attached to that shell

The studio page in `design-system/src/App.tsx` is now just:

- a reference consumer
- a tuning surface
- a way to dial in the real component code

It is not the product boundary we are optimizing for.

## Updated Product Assumptions

These assumptions should now be treated as settled unless we explicitly change them later.

### 1. The workbench ships with the system

The workbench is not studio-only.

It is part of the reusable shell and part of the shipped app-facing system.

That means:

- `components/canon/workbench/*` is real reusable product code
- the shell should continue to support an attached workbench
- workbench controls should remain focused on global system tuning, not page-local configuration

### 2. The reference page is not the end state

The reference page is useful for:

- exercising the canon components
- dialing in tokens and behavior
- providing a live reference while the system matures

The reference page is not something we need to over-optimize structurally.

We can move on from it later.

### 3. The main goal is obvious canon structure

The reusable parts should feel:

- simple
- clean
- canon
- obvious to browse
- obvious to reuse

That means file layout, exports, naming, and styling boundaries matter more than polishing the reference page.

### 4. Documentation moves in parallel with implementation

We should not leave docs as a cleanup phase at the end.

As we land each structural/system change, we should update the relevant design-system docs in the same pass.

### 5. Testing comes last

Testing is still required, but it is intentionally the last major phase in this plan.

The right order is:

1. settle structure
2. settle systems
3. settle docs and inventory in parallel
4. add direct component tests after the canon surface is stable enough to be worth locking down

## Current Canon Surface

The reusable canon tree currently lives under:

- `design-system/src/components/canon/controls/*`
- `design-system/src/components/canon/conversation/*`
- `design-system/src/components/canon/disclosure/*`
- `design-system/src/components/canon/layout/*`
- `design-system/src/components/canon/navigation/*`
- `design-system/src/components/canon/surfaces/*`
- `design-system/src/components/canon/typography/*`
- `design-system/src/components/canon/utils/*`
- `design-system/src/components/canon/workbench/*`
- `design-system/src/components/canon/index.ts`

That canon layer now materially covers:

- page shell composition
- sidebar and rail composition
- toolbar structure
- reusable typography primitives
- buttons and badges
- popup, menu, search, and select controls
- option groups
- date-range picking
- dialog, workflow, and toast surfaces
- disclosure behavior
- conversation primitives
- shipped workbench controls
- token export

This is already a real reusable layer, not just a mockup.

## Progress Update

### 2026-04-16: First boundary-cleanup pass started

Completed in this pass:

- tightened the top-level `components/canon/index.ts` public boundary by stopping implicit re-export of `utils`
- clarified `components/canon/utils/*` as implementation helpers rather than top-level public canon API
- added `design-system/docs/CANON_INVENTORY.md` to document family ownership and current public reusable inventory
- updated `design-system/README.md` to reflect the shipped workbench and the intended public canon entry point

Why this matters:

- the public reusable boundary is now more intentional
- the shipped workbench is documented as part of the real product surface
- canon family ownership is easier to understand without reading the entire codebase

### 2026-04-16: System token cleanup pass started

Completed in this pass:

- centralized canon motion timing values into shared CSS variables
- centralized shared backdrop blur and saturation values into shared CSS variables
- centralized the remaining accent preview ring into a named shared shadow variable
- updated shell, controls, surfaces, workbench, and base styles to consume those shared vars
- updated `design-system/README.md` to reflect that these interaction conventions are now systemized

Why this matters:

- shell, workbench, controls, and surfaces now share a more explicit global interaction language
- repeated hard-coded timing and backdrop values have been materially reduced
- exported theme CSS now includes more of the real canon interaction system, not just colors and radii

### 2026-04-16: Shell rail motion normalization started

Completed in this pass:

- removed the abrupt desktop rail child hide/show behavior that made opening feel uneven
- added explicit opacity and transform motion to the left rail so it uses the same kind of panel-level movement language as the right rail
- removed the dead right-rail/workbench offset path so both rails now rely on one shared shell motion model
- kept rail open/close behavior inside the shared shell CSS instead of patching a page-level workaround

Why this matters:

- left and right rails now feel more canon and less like separate interaction paths
- shell behavior is more uniform at the reusable system layer

### 2026-04-16: Reusable shell contract cleanup started

Completed in this pass:

- renamed `PageShell`'s generic `floatingContent` slot to an explicit `workbench` slot so the shipped shell contract is clearer in code
- tightened `SidebarNav` brand handling so the reusable shell no longer relies on a broad container click path for brand actions
- updated the inventory and README to document `PageShell` plus attached `Workbench` as the intended reusable shell composition

Why this matters:

- the main reusable shell contract is now easier to discover directly from the canon files
- the shipped workbench relationship is expressed in code instead of only in docs
- sidebar brand behavior is more product-ready and less page-local

### 2026-04-16: Public canon API typing cleanup started

Completed in this pass:

- exported the reusable item/prop/value types that were implicitly part of the canon public surface
- made `SidebarNav` item typing explicit as part of the layout family API
- made `NavTabs`, `SegmentedTabs`, `FieldRow`, and `IconButton` expose importable public contract types
- updated canon docs to describe this as an intentional API-boundary rule

Why this matters:

- consumers can import canon component contract types directly instead of reconstructing them ad hoc
- the reusable surface is clearer for future extraction or packaging work
- family barrels now communicate both components and their important public shapes more honestly

### 2026-04-16: Interaction token cleanup continued

Completed in this pass:

- promoted the remaining sidebar accent glow treatment into a named system variable
- promoted range-thumb halo and hover halo treatments into named system variables
- replaced the last matching one-off accent-soft literal in shell styling with the shared accent token
- updated docs to reflect that these interaction treatments are part of the canon variable system

Why this matters:

- shared shell and control polish now depends less on file-local CSS literals
- the canon interaction language is more explicit for future reuse and extraction
- remaining styling cleanup work is easier to spot because these common treatments are now named

### 2026-04-16: Control contract and surface token cleanup continued

Completed in this pass:

- finished the remaining public control-contract cleanup for `MenuButton` and `OptionGroup`
- made canon control collections readonly where those item lists are part of the reusable API
- promoted repeated raised/subtle/workbench surface fills into named system variables
- promoted repeated range-track fill and border treatments into named system variables
- updated docs to describe both the control-contract rule and the shared surface-fill rule

Why this matters:

- the remaining control-heavy canon primitives now communicate their reusable contracts more directly
- shared fills used across controls, conversation, surfaces, typography, and workbench styling are easier to reason about as system assets
- future package extraction work has fewer implicit shapes and fewer repeated CSS literals to unwind

### 2026-04-16: Export surface and shell/overlay token cleanup continued

Completed in this pass:

- replaced wildcard canon barrel exports with explicit named exports across the family barrels and top-level canon entry point
- promoted the remaining shared shell chrome backgrounds into named system variables
- promoted shared overlay backdrop, muted/emphasis border, modal fill, overlay section, and button emphasis treatments into named system variables
- updated canon docs to describe explicit named exports as part of the intended public boundary

Why this matters:

- the public canon surface is now easier to scan directly from the barrel files without following transitive wildcard exports
- the remaining shell and overlay styling conventions now read more like a system and less like family-local exceptions
- the canon boundary is closer to package-ready because both exports and shared styling language are more explicit

### 2026-04-16: Final boundary and conversation token cleanup continued

Completed in this pass:

- removed the last wildcard export from the internal `canon/utils` barrel so helper exports follow the same explicit rule as the public canon surface
- promoted conversation user/system role fills into named system variables instead of keeping them as file-local literals
- tightened README and inventory wording so `utils/` reads as internal helper space rather than another reusable component family

Why this matters:

- the canon tree now communicates public families versus internal helpers more honestly
- the remaining obvious conversation-specific surface literals are now part of the shared token language
- boundary and token cleanup are both closer to a natural stopping point for a later test-locking phase

### 2026-04-16: Modal shaping and toast surface cleanup continued

Completed in this pass:

- exported explicit dialog presentation and size contract types as part of the canon surface API
- promoted dialog widths, modal section rhythm, and graph-based toast chroming into named system variables
- added `Toast` and `ToastStack` as reusable canon surfaces under `components/canon/surfaces/*`
- narrowed standard modal presentation so focused review dialogs read more vertically while `WorkflowDialog` keeps the wider structured layout
- updated the studio reference consumer and docs to describe toasts as part of the real reusable surface

Why this matters:

- standard modals now feel more intentional and less like generic wide overlays
- workflow dialogs keep their wider shape without forcing that width onto every dialog
- non-blocking feedback now exists as an actual canon primitive using the existing graph palette
- the public canon surface is clearer because overlay sizing and presentation contracts are now importable instead of hidden as inline unions

### 2026-04-16: Config and rail composition extraction continued

Completed in this pass:

- promoted the global config-panel shell into the `workbench/` family as `ConfigPanel` and `ConfigPanelSection`
- promoted reusable list-row and sidebar-footer button anatomy into canon components instead of leaving raw class-based buttons in `App.tsx`
- promoted the reusable rail accordion composition into the `layout/` family as `RailSectionTree`
- refactored the studio page to consume those canon components instead of owning the config panel and rail disclosure structure inline

Why this matters:

- the config panel is now a real reusable product component rather than a page-local overlay assembly
- the left and right rail disclosure structure now lives in canon code instead of page-local JSX
- `App.tsx` is closer to being a reference consumer of canon components rather than the owner of their layout and styling
- future app pages now have named canon building blocks for config panels, rail disclosure trees, list rows, and sidebar footer actions

### 2026-04-16: Global motion and backdrop token cleanup continued

Completed in this pass:

- promoted repeated transition stacks for layout shifts, control chrome, emphasis states, panel motion, label collapse, and range-thumb motion into named base tokens
- promoted shell, workbench, and dialog backdrop filters into named base tokens instead of repeating blur formulas in family stylesheets
- moved the toast icon and divider chroming behind toast-level variables so tone-driven feedback styling no longer depends on inline `color-mix(...)` literals in the component rules
- updated README wording to describe transition-stack tokens as part of the canon styling system

Why this matters:

- shell, controls, surfaces, and workbench now share a more explicit motion language instead of carrying repeated transition lists
- backdrop blur behavior now reads as a system convention rather than a set of family-local blur calls
- toast styling stays graph-palette-driven while keeping the remaining tone math easier to audit and reuse

### 2026-04-16: Canon typography family productization started

Completed in this pass:

- promoted shared heading, body, meta-label, meta-value, and code-block presentation into a real `components/canon/typography/*` family
- added explicit exported typography primitives and contract types through the canon family barrels and top-level public entry point
- moved shared type hierarchy styling into `src/styles/typography.css` instead of leaving it buried in general base styling
- refactored canon surfaces, layout, controls, conversation, disclosure, workbench, and the studio reference page to consume the new typography primitives instead of raw type class markup

Why this matters:

- the type hierarchy is now part of the public reusable canon API rather than an implicit styling convention
- consumers no longer need to know raw class names to get canon headings, body copy, meta labels, metric values, or monospace blocks right
- typography is now closer to the same productized standard as the other canon families, which makes future extraction and testing more straightforward

## Main Problems Still Left

The remaining work is not “invent the system.”

The remaining work is:

### 1. Canon boundaries are good, but not fully explicit yet

The tree is much better now, but we still need to make sure the reusable pieces are unmistakably clean and obvious:

- no confusing export surface
- no ambiguous ownership between shell, workbench, controls, and surfaces
- no “is this demo code or real code?” ambiguity in the actual canon directories

### 2. System-level styling is not fully tokenized yet

Color, radius, and chrome mode have become more systemized.

What still needs tightening:

- motion timing tokens
- blur/backdrop conventions
- shadow usage consistency
- any repeated hard-coded style values that should become system-level variables

### 3. The design-system docs lag the actual code

The current plan and inventory language still reflect an older intermediate state in places.

We need docs that describe the system we actually have now:

- workbench ships
- new popup/dialog foundations exist
- new controls exist
- reference page is not the product boundary

### 4. The public reusable inventory is not documented crisply enough

We need a straightforward answer to:

- what files are the canon primitives
- what each family owns
- what consumers are supposed to import
- what belongs to the system versus what belongs to the reference page

### 5. Direct component tests do not exist yet

This is still a real gap, but it is intentionally last in the sequence.

## Non-Goals

This pass is not about:

- turning the reference page into a polished long-term product
- spending time over-abstracting reference-only composition
- treating the workbench as optional or studio-only
- reopening the basic shell/component vocabulary unless we find a real defect
- prematurely extracting the design system into another repository before the reusable layer is cleaner

## Target Outcome

At the end of this pass:

- the reusable shell is clearly the anchor product surface
- the workbench is clearly part of that shipped reusable shell
- the canon component files are easy to browse and easy to trust
- the export surface is obvious
- the system-level tokens are more complete and more uniform
- docs accurately describe the actual reusable system
- direct component tests can then be added against a stabilized canon surface

## Canon Product Principles

These principles should guide every change in this pass.

### 1. Reusable code first

Prefer improving the canon component files over improving page-specific reference composition.

### 2. One obvious home

Each reusable concern should have one obvious family and one obvious file home.

Examples:

- shell composition belongs in `layout/`
- toolbar structure belongs in `navigation/`
- reusable controls belong in `controls/`
- reusable overlay/dialog surfaces belong in `surfaces/`
- shipped global tuning belongs in `workbench/`

### 3. System before variants

Prefer global system modes and shared primitives over one-off per-component variants.

### 4. Docs stay current with code

If a reusable family changes meaningfully, update the docs in the same pass.

### 5. Testing locks the settled surface, not the evolving sketch

Do not rush tests onto unstable APIs.

Use tests to lock the canon once the structure and behavior are intentionally settled.

## Workstreams

The remaining work should be executed through these parallel-aware workstreams.

### Workstream A: Canon Boundary Cleanup

Goal:

- make the reusable file tree feel unmistakably clean and obvious

Tasks:

- review each `canon/` family for ownership clarity
- remove any ambiguity between app-facing reusable code and reference-page composition
- keep `workbench/` as an explicit shipped family, not a studio-only afterthought
- keep the top-level export surface intentional and easy to scan

Deliverables:

- clearer family ownership
- cleaner exports
- fewer “transitional” assumptions left in docs or code comments

### Workstream B: System Token Completion

Goal:

- finish the most important missing system-level styling decisions

Tasks:

- define canon motion timing tokens or variables
- normalize transition timing usage across `base.css`, `shell.css`, `controls.css`, `surfaces.css`, and `workbench.css`
- audit repeated blur/backdrop/shadow treatments and pull the important ones into clearer system conventions
- keep chrome-family behavior global and system-level

Deliverables:

- fewer hard-coded repeated values
- more predictable interaction feel across shell, workbench, controls, and surfaces

### Workstream C: Canon Inventory And Documentation

Goal:

- document the actual reusable system we are building now

Tasks:

- update this plan as the direction tightens
- add or update inventory-style documentation describing the canon families
- document what ships as part of the reusable shell
- explicitly document that the workbench ships with the app
- document the reference page as reference-only, not the main abstraction target
- keep docs current in parallel with each structural/system change

Deliverables:

- a truthful productization plan
- a clearer reusable component inventory
- less mismatch between docs and code

### Workstream D: Final Test Pass

Goal:

- add direct component tests only after the reusable surface is stable enough to lock

Recommended coverage:

- `AccordionSection` open/close behavior
- `PanelRail` pinned/mobile behavior
- `PopoverButton` open/close and dismissal behavior
- `MenuButton` item selection and keyboard behavior
- `SearchField` result filtering and keyboard navigation
- `SelectField` selection behavior and keyboard navigation
- `OptionGroup` single and multiple selection behavior
- `DateRangePicker` selection, clear, and apply behavior
- `ModalDialog` dismissal and presentation behavior
- `WorkflowDialog` dismissal and layout behavior
- `ChatComposer` submit and disabled states
- `ChatTranscript` disclosure and empty-state behavior
- `Workbench` tab and control behavior for core shipped settings

Deliverables:

- direct canon tests
- less reliance on manual visual verification

## Recommended Phase Order

### Phase 1: Lock The Reusable Product Boundary

Goal:

- settle what the reusable system actually is

Tasks:

- treat `PageShell` plus attached workbench as the primary reusable shell contract
- keep the workbench as part of the shipped system
- clean up any remaining ambiguity between canon code and reference composition
- make sure imports and file locations communicate the intended system clearly

Exit criteria:

- a new reader can find the reusable shell and its attached workbench immediately
- the canon tree feels intentional rather than transitional

### Phase 2: Tighten Canon Family Ownership

Goal:

- make the file tree and exports feel obvious

Tasks:

- verify each canon family has a clear responsibility
- tighten any exports that feel noisy or accidental
- keep app-facing reusable code simple to browse
- avoid unnecessary sub-abstractions unless they improve clarity

Exit criteria:

- the reusable component files are easy to scan
- family ownership is obvious
- the codebase feels more canon and less “reference extracted”

### Phase 3: Finish System-Level Styling Conventions

Goal:

- make the system visually uniform in a truly global way

Tasks:

- normalize timing and motion values
- normalize backdrop and shadow conventions
- keep button/popup/dialog/workbench chrome aligned through system variables
- continue preferring global system controls over local style forks

Exit criteria:

- the main reusable families share one obvious interaction language
- repeated style values are materially reduced

### Phase 4: Keep Docs In Parallel With The Work

Goal:

- prevent the docs from drifting behind the system again

Tasks:

- update plan and inventory docs during each structural/system pass
- keep the component inventory aligned with the actual canon tree
- document shipped workbench behavior as part of the shell system
- document what is reference-only versus truly reusable

Exit criteria:

- docs describe the system as it really exists
- the reusable inventory is easy to understand without reading the entire codebase

### Phase 5: Add Direct Component Tests Last

Goal:

- lock the settled canon surface with focused tests

Tasks:

- add direct tests for the most important reusable primitives
- prioritize interaction-heavy and dismissal-heavy components first
- avoid snapshot-heavy low-signal coverage

Exit criteria:

- key reusable behavior is protected by direct tests
- manual studio inspection is no longer the only safety net

## Documentation Expectations During This Plan

Documentation should update in parallel with implementation.

Minimum expectation for each meaningful structural or system change:

- update this plan if the direction changes
- update any canon inventory/reference doc that describes the component families
- keep terminology aligned with the actual code

Docs should reflect:

- workbench ships
- reference page is not the product boundary
- canon families are the real reusable boundary

## Validation Expectations

For non-trivial design-system work, run:

```bash
cd design-system
npm run typecheck
npm run build
```

When component tests land later, extend validation with the narrowest credible test command for the changed canon family.

Testing is last in this plan, but typecheck/build should continue during the intermediate phases.

## Immediate Next Step

The next best step is:

1. run the direct component test pass against the now-settled canon surface, starting with dialogs, popovers, and selection-heavy controls
2. keep the inventory and plan language aligned as the remaining public-boundary cleanup lands
3. use the focused test additions to confirm the canon surface is actually stable enough for later extraction

## Summary

The design system is no longer trying to prove whether reusable components are possible.

That part is already real.

The remaining job is to make the reusable code feel fully canon:

- simple
- clean
- obvious
- systemized
- documented as it evolves

The workbench is part of that shipped reusable system.

The reference page is not.

Testing still matters, but it should land after the reusable surface is structurally settled enough to deserve being locked down.
