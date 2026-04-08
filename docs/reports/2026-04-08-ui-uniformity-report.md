# Sherlock UI Uniformity Report

Date: 2026-04-08
Repository: `/mnt/c/Users/james/projects/sherlock`

## Scope and Intent

This report surveys the current UI surface for consistency issues that should be folded into a dedicated cleanup plan after the current Stream 3 work lands.

The focus here is not to lock final design choices yet. The immediate goal is to:

- identify the shared UI patterns that already exist
- identify where those patterns are not being applied consistently
- call out the most obvious outliers and odd-duck surfaces
- make the transition from report to implementation plan straightforward

This review concentrated on panels, rails, headers, labels, helper text, hover and active states, motion and transitions, modals, menus, popups, and nested action surfaces across active `src/` UI code.

## Executive Summary

Sherlock already has the beginnings of a canonical UI language, but it is scattered. The most important shared pieces are already present in [`src/components/ui/chrome.ts`](/mnt/c/Users/james/projects/sherlock/src/components/ui/chrome.ts), [`src/components/ui/ModalShell.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/ModalShell.tsx), [`src/components/ui/Accordion.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/Accordion.tsx), [`src/components/ui/OsintSelect.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/OsintSelect.tsx), and [`src/index.css`](/mnt/c/Users/james/projects/sherlock/src/index.css).

The main issue is not lack of taste or direction. The issue is partial adoption. Some surfaces already feel like they belong to the same product family, while others still use bespoke panel shells, one-off typography, custom hover logic, or custom overlay structures.

The best next step is not a broad redesign. It is a consolidation pass:

- inventory the preferred patterns that already exist
- turn those patterns into an explicit canonical contract
- migrate high-traffic and high-visibility outliers first

## Current Canonical Pieces Already In Place

These are the strongest existing building blocks and should likely serve as the baseline for the eventual uniformity plan.

### Panel and Header Chrome

[`src/components/ui/chrome.ts`](/mnt/c/Users/james/projects/sherlock/src/components/ui/chrome.ts) already contains a meaningful shared vocabulary for panel shells, headers, toggle buttons, segment buttons, and menu-style controls.

Good examples of that vocabulary in use:

- [`src/components/features/Chat/ChatHeader.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Chat/ChatHeader.tsx)
- [`src/components/features/Timeline/TimelineToolbar.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Timeline/TimelineToolbar.tsx)
- [`src/components/features/WorkspaceHome/index.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/WorkspaceHome/index.tsx)
- [`src/components/features/OperationView/DossierPanel.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx)

### Modal Shell

[`src/components/ui/ModalShell.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/ModalShell.tsx) is already a credible canonical modal structure with a shared overlay, header, title/description treatment, close affordance, and footer slot.

This is a strong base for normalizing dialogs and should likely remain the default shell unless a surface has a clear reason to diverge.

### Section and Rail Behavior

[`src/components/ui/Accordion.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/Accordion.tsx) is a good candidate for the default collapsible section treatment. It already appears in some of the newer or more structured surfaces.

### Menu and Selection Language

[`src/components/ui/OsintSelect.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/OsintSelect.tsx) and the menu classes in [`src/index.css`](/mnt/c/Users/james/projects/sherlock/src/index.css) show an emerging menu/popup language that should be expanded rather than replaced.

### Shared Text Utilities

[`src/index.css`](/mnt/c/Users/james/projects/sherlock/src/index.css) already defines `osint-eyebrow`, `osint-meta-label`, `osint-meta-label-strong`, `osint-meta-value`, `osint-panel-title`, and muted body helpers. That means the cleanup is more about consolidation and adoption than inventing a system from scratch.

## Findings

### 1. Panels, Rails, Headers, and Action Placement Are Only Partially Unified

The app has a recognizable panel/header treatment, but many feature surfaces still implement their own shell structure, spacing rules, and action placement.

Representative stronger examples:

- [`src/components/features/WorkspaceHome/index.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/WorkspaceHome/index.tsx)
- [`src/components/features/Timeline/TimelineToolbar.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Timeline/TimelineToolbar.tsx)
- [`src/components/features/OperationView/DossierPanel.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/OperationView/DossierPanel.tsx)

Representative outliers:

- [`src/components/features/OperationView/InspectorPanel.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/OperationView/InspectorPanel.tsx)
- [`src/components/features/NetworkGraph/NodeInspector.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/NetworkGraph/NodeInspector.tsx)
- [`src/components/features/Timeline/TimelineFiltersPanel.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Timeline/TimelineFiltersPanel.tsx)
- [`src/components/features/WorkspaceBoard/BoardAgentRail.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardAgentRail.tsx)

Patterns that need standardization:

- panel header anatomy
- title, subtext, and metadata placement
- right-side action grouping
- section spacing and divider behavior
- default rail shell widths and padding
- when to use `Accordion` versus a static section stack

Important note for the follow-up plan:

The preferred panel and header patterns already exist, but they are scattered across feature implementations and helper modules. The report-to-plan transition should include a short inventory step to identify the preferred variants before migration work begins.

### 2. Eyebrows, Labels, Helper Text, and Secondary Copy Need a Single Contract

This is one of the clearest consistency gaps in the codebase.

The app already has shared typography utilities, but surfaces still mix:

- `osint-eyebrow`
- `osint-meta-label`
- raw uppercase mono utility strings
- one-off muted subtext styles
- feature-local helper text treatments

Representative mixed usage appears in:

- [`src/components/ui/HelpModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/HelpModal.tsx)
- [`src/components/ui/ApiKeyModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/ApiKeyModal.tsx)
- [`src/components/ui/GlobalSearch.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/GlobalSearch.tsx)
- [`src/components/features/Runs/RunSetupModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Runs/RunSetupModal.tsx)

The product direction for the final eyebrow/label shapes does not need to be settled in this report. What should be captured now is that:

- the team already has preferred shapes in mind
- those shapes are not yet codified
- a canonical text hierarchy should be part of the next uniformity plan

At minimum, the plan should define default treatments for:

- eyebrow text
- section labels
- field labels
- helper text
- muted explanatory copy
- empty-state and inline status subtext

### 3. Hover, Active, Selected, and Focused States Are Still Fragmented

[`src/components/ui/chrome.ts`](/mnt/c/Users/james/projects/sherlock/src/components/ui/chrome.ts) already provides useful button and toggle state helpers, but many higher-level surfaces still implement state styling ad hoc.

Representative areas with bespoke or repeated state logic:

- [`src/components/ui/GlobalSearch.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/GlobalSearch.tsx)
- [`src/components/features/WorkspaceBoard/BoardAgentRail.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/WorkspaceBoard/BoardAgentRail.tsx)
- [`src/components/features/OperationView/InspectorPanel.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/OperationView/InspectorPanel.tsx)
- [`src/components/features/NetworkGraph/NodeInspector.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/NetworkGraph/NodeInspector.tsx)
- [`src/components/features/NetworkGraph/EntityResolution.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/NetworkGraph/EntityResolution.tsx)
- [`src/components/features/Runs/RunSetupModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Runs/RunSetupModal.tsx)

The visible result is that controls with similar jobs do not always feel equally interactive or equally related.

The follow-up plan should define shared treatments for:

- hover states on row items and cards
- selected states on list items, chips, and segmented controls
- active button emphasis
- focus-visible behavior
- destructive and caution variants

### 4. Motion, Animation, and Transition Timing Do Not Yet Read as One System

[`src/index.css`](/mnt/c/Users/james/projects/sherlock/src/index.css) contains some shared animation utilities, but the overall motion language is still inconsistent in both timing and effect choice.

Across the codebase there is a mix of:

- local fade and slide utilities
- multiple duration values
- one-off scale or zoom transitions
- different entrance behaviors for menus, overlays, result lists, and transient UI

Motion consistency is especially important for:

- overlays and dialogs
- popups and menus
- rail open/close behavior
- hover reveals
- toasts and transient feedback

Representative surfaces worth reviewing together:

- [`src/components/ui/GlobalSearch.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/GlobalSearch.tsx)
- [`src/components/features/Files.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Files.tsx)
- [`src/components/features/Feed.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Feed.tsx)
- [`src/components/features/LiveMonitor/EventCard.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/LiveMonitor/EventCard.tsx)
- [`src/components/ui/Toast.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/Toast.tsx)

The immediate need is not more animation. It is fewer, clearer motion primitives with a shared duration and easing vocabulary.

### 5. Modals, Popups, Menus, and Nested Action Surfaces Have the Most Noticeable Outliers

This is the area where inconsistency is easiest for users to feel.

There is already a good default modal shell, but not all overlays use it. Some still bring their own header structure, spacing, close affordances, action rows, and typography.

Representative modal and overlay outliers:

- [`src/components/ui/ApiKeyModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/ApiKeyModal.tsx)
- [`src/components/ui/HelpModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/HelpModal.tsx)
- [`src/components/features/Runs/RunSetupModal.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Runs/RunSetupModal.tsx)
- [`src/components/features/NetworkGraph/EntityResolution.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/NetworkGraph/EntityResolution.tsx)
- [`src/components/features/Settings/TemplateGallery.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Settings/TemplateGallery.tsx)

Representative popup and menu surfaces that should be reviewed as a set:

- [`src/components/features/Chat/ChatHeader.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Chat/ChatHeader.tsx)
- [`src/components/features/Timeline/TimelineExportMenu.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Timeline/TimelineExportMenu.tsx)
- [`src/components/features/Timeline/TimelineFiltersPanel.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/features/Timeline/TimelineFiltersPanel.tsx)
- [`src/components/ui/GlobalSearch.tsx`](/mnt/c/Users/james/projects/sherlock/src/components/ui/GlobalSearch.tsx)

Specific items to normalize:

- close button style
- footer button placement
- title and description spacing
- menu item row anatomy
- nested item indentation and hover behavior
- destructive action presentation
- popup border, radius, and shadow treatment

### 6. Additional Outliers and Odd Ducks Worth Tracking

These do not need their own design system category, but they should be part of the plan inventory:

- rail shells across Chat, Timeline, Board, Operation View, and Network Graph are very similar but not yet extracted into a shared contract
- chip, badge, and pill treatments vary more than they should across inspectors, board review UI, search, and setup flows
- roundedness is inconsistent across surfaces that otherwise want the same visual family
- icon-only action rows have some promising local patterns, but they are not consistently reused
- empty states and inline status callouts use multiple different hierarchies and visual weights

## Recommended Transition From Report to Plan

The next document should be a focused cleanup plan, not another broad audit.

Recommended first step:

1. inventory the preferred existing patterns already in production
2. pick the canonical defaults for panels, text hierarchy, states, and overlays
3. list the migration targets by feature and impact

That inventory should explicitly answer:

- which header layout is the default panel header
- which text style is the default eyebrow
- which secondary-copy style is the default helper text
- which button and row-state helpers are the default interaction language
- which shell is the default modal, popup, and menu baseline
- which motion durations and transitions are officially supported

## Suggested Implementation Order

This work is best done as a structured cleanup pass rather than many tiny opportunistic edits.

Recommended order:

1. define and document the canonical UI primitives to reuse
2. normalize panel headers, rail shells, and action placement
3. normalize text hierarchy for eyebrows, labels, helper text, and subtext
4. normalize hover, active, selected, and focus-visible states
5. normalize modal, popup, and menu shells
6. normalize motion timing and transition primitives
7. sweep remaining outliers and nested-item odd ducks

## Candidate Acceptance Criteria

The eventual plan should be considered complete when:

- major panels and rails share the same header anatomy and section behavior
- helper text, labels, and eyebrow styles come from a small documented set
- similar controls share similar hover, active, selected, and focus behavior
- modal and popup surfaces use one default shell unless intentionally exempted
- motion primitives are limited to a small documented set of durations and effects
- the main outlier surfaces have either been migrated or explicitly exempted with a reason

## Closing Note

This report points to consolidation, not reinvention. Sherlock already contains the beginnings of a strong UI system. The next step is to gather the preferred pieces that are currently scattered across the app, make them explicit, and use them to bring the remaining outliers into the same visual and interaction family.
