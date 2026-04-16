# Canon Inventory

## Purpose

Describe the actual reusable boundary inside `design-system/src/components/canon/`.

This document is about the shipped canon system:

- reusable shell
- shipped workbench
- reusable controls
- reusable surfaces
- reusable disclosure and conversation primitives

The studio page is only a reference consumer of this system.

## Public Entry Point

The public canon entry point is:

- `design-system/src/components/canon/index.ts`

Consumers should prefer importing app-facing reusable pieces from that barrel.

Internal helpers under `components/canon/utils/*` are implementation details and are not part of the top-level public canon API.

## Family Ownership

### `layout/`

Owns top-level shell structure and shell-adjacent composition.

Current public components:

- `PageShell`
- `PanelRail`
- `SidebarNav`

### `navigation/`

Owns reusable navigation and toolbar structure.

Current public components:

- `ToolbarBar`
- `ToolbarCluster`

### `controls/`

Owns reusable input, action, popup, option, search, and selection primitives.

Current public components:

- `Badge`
- `Button`
- `CopyButton`
- `DateRangePicker`
- `FieldRow`
- `IconButton`
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

Owns reusable card, panel, overlay, and dialog surfaces.

Current public components:

- `ActionCard`
- `DialogSurface`
- `EmptyStateCard`
- `MetricGrid`
- `ModalDialog`
- `OverlayPanel`
- `OverlaySection`
- `PanelNote`
- `ResponsiveGrid`
- `SurfaceCard`
- `WorkflowDialog`

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

Current public components:

- `Workbench`

## Product Assumptions

These assumptions are current and intentional:

- the workbench ships with the system
- the workbench is part of the reusable shell contract
- the demo page is a reference consumer, not the main abstraction target
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
