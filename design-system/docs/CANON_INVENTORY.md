# Canon Inventory

## Purpose

Describe the actual reusable boundary inside `design-system/src/components/canon/`.

This document is about the shipped canon system:

- reusable shell
- shipped workbench
- reusable typography primitives
- reusable controls
- reusable surfaces
- reusable disclosure and conversation primitives

The studio page is only a reference consumer of this system.

## Public Entry Point

The public canon entry point is:

- `design-system/src/components/canon/index.ts`

Consumers should prefer importing app-facing reusable pieces from that barrel.

Internal helpers under `components/canon/utils/*` are implementation details and are not part of the top-level public canon API.

Canon family barrels and the top-level canon barrel should prefer explicit named exports over wildcard re-exports so the shipped surface stays easy to scan.

The same preference applies to internal helper barrels such as `utils/`: even internal surfaces are easier to maintain when their exports stay explicit.

Where canon components expose reusable item/value shapes or prop contracts, those types should be exported intentionally rather than hidden behind private file-local interfaces.

Shared interaction treatments such as accent glows, control halos, motion, blur, and backdrop conventions should also resolve through named system variables when they are reused across canon families.

The same rule applies to shared surface-fill treatments: if a panel, raised card, workbench, or control track style is reused across families, it should prefer a named system variable over repeated `color-mix(...)` literals.

The same preference also applies to shared overlay sizing and feedback tones: dialog widths and modal rhythm should live as system tokens, with modal and workflow families owning their width classes instead of one-off page styling, and toast tones should derive from the existing `--ds-graph-*` palette rather than new notification colors.

The same rule now applies to typography hierarchy: shared headings, body copy, meta labels, metric values, and monospace blocks should prefer exported canon typography primitives instead of making consumers know raw `ds-*` type class names.

## Family Ownership

### `layout/`

Owns top-level shell structure and shell-adjacent composition.

Current public components:

- `PageShell`
- `PanelRail`
- `RailSectionTree`
- `SidebarAction`
- `SidebarNav`

`PageShell` is the main reusable shell contract. It owns the sidebar, toolbar, rails, content region, overlay backdrop, and the attached `workbench` slot used by the shipped system workbench.

### `navigation/`

Owns reusable navigation and toolbar structure.

Current public components:

- `ToolbarBar`
- `ToolbarCluster`

### `typography/`

Owns shared text hierarchy and canon-facing type presentation primitives.

Current public components:

- `CodeBlock`
- `Eyebrow`
- `Heading`
- `MetaValue`
- `Text`

This family is the public bridge between the theme typography roles and app-facing component composition. Consumers should prefer these primitives over direct title/body/meta class markup so the type hierarchy remains explicit, typed, and easier to evolve.

### `controls/`

Owns reusable input, action, popup, option, search, and selection primitives.

Current public components:

- `Badge`
- `Button`
- `CopyButton`
- `DateRangePicker`
- `FieldRow`
- `IconButton`
- `ListAction`
- `ListActionGroup`
- `MenuButton`
- `NavTabs`
- `OptionGroup`
- `PopoverButton`
- `PopupSurface`
- `RangeField`
- `SearchField`
- `SegmentedTabs`
- `SelectField`
- `TokenSwatch`

### `surfaces/`

Owns reusable card, panel, overlay, dialog, and feedback surfaces.

Current public components:

- `ActionCard`
- `ContentSection`
- `DialogSurface`
- `EmptyStateCard`
- `MetricGrid`
- `ModalDialog`
- `OverlayPanel`
- `OverlaySection`
- `PanelNote`
- `ResponsiveGrid`
- `SurfaceCard`
- `Toast`
- `ToastStack`
- `WorkflowDialog`

Dialog presentation/size contracts are part of the public reusable surface. `ContentSection` is the default natural-flow section for modal, workflow, and config-panel bodies, while `OverlaySection` remains the boxed inset option for intentionally nested sub-surfaces. Toast tones now resolve through the shared graph palette rather than a separate notification color set.

### `disclosure/`

Owns reusable disclosure behavior and accordion primitives.

Current public components/hooks:

- `AccordionSection`
- `useDisclosureSet`
- `useExclusiveDisclosure`

### `conversation/`

Owns reusable conversation primitives.

Current public components/types:

- `ChatComposer`
- `ChatTranscript`
- `types`

### `workbench/`

Owns the shipped global system workbench that attaches to the reusable shell.

The intended attachment point is `PageShell`'s explicit `workbench` slot rather than a generic page-level floating content escape hatch.

Current public components:

- `ConfigPanel`
- `ConfigPanelSection`
- `Workbench`

## Product Assumptions

These assumptions are current and intentional:

- the workbench ships with the system
- the workbench is part of the reusable shell contract
- the type hierarchy is part of the reusable canon API, not just a studio styling detail
- the studio page is a reference consumer, not the main abstraction target
- the canon file tree is the real reusable boundary

## Internal Helpers

`components/canon/utils/*` currently contains implementation helpers such as:

- `cx`
- `useDismissableLayer`

These are useful for canon internals, but they should not be treated as top-level public product primitives by default.

If a helper becomes broadly reusable enough to deserve public status, we should promote it intentionally rather than exporting all helpers implicitly.

## Notes For Future Work

The most important next cleanup steps for the reusable boundary are:

- keep family ownership obvious
- keep the top-level export surface intentional
- avoid leaking implementation helpers into the public API
- keep docs updated in parallel as the canon surface evolves
