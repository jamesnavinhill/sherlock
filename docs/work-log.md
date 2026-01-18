# Sherlock Work Log & Legacy Plans

> Consolidated archive of implementation plans and task lists up to January 6, 2026.

---

## 1. Initial Improvements Plan (Phases 1-4)

*Source: 13089373-9bd0-4c3e-b0f6-997820966b7d/implementation_plan.md*

# Sherlock Improvements - Implementation Plan (Phases 1-4)

> Technical plan for the first 4 phases from [improvement_report.md](file:///d:/sherlock/docs/improvement_report.md)

---

## Phase 1: Extract Shared Components & Utilities

### Utility Extraction

#### [NEW] [text.ts](file:///d:/sherlock/src/utils/text.ts)

Extract duplicated text helpers from `NetworkGraph.tsx` and `OperationView.tsx`:

- `cleanEntityName(raw: string): string` - Normalizes entity names
- `truncateText(text: string, maxLength: number): string` - Truncates with ellipsis

#### [NEW] [audio.ts](file:///d:/sherlock/src/utils/audio.ts)

Extract audio helpers from `OperationView.tsx`:

- `decodeBase64(base64: string): Uint8Array`
- `decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer>`

#### [NEW] [localStorage.ts](file:///d:/sherlock/src/utils/localStorage.ts)

Centralize localStorage access pattern:

- `getItem<T>(key: string, fallback: T): T`
- `setItem<T>(key: string, value: T): void`
- `clearKey(key: string): void`

#### [MODIFY] [NetworkGraph.tsx](file:///d:/sherlock/src/components/features/NetworkGraph.tsx)

- Remove inline `cleanEntityName` function
- Import from `@/utils/text`
- Replace local `safelyParse` with `getItem` from localStorage utils

#### [MODIFY] [OperationView.tsx](file:///d:/sherlock/src/components/features/OperationView.tsx)

- Remove inline `cleanEntityName`, `decode`, `decodeAudioData`, `MatrixLoader`
- Import utilities from respective files

---

### Shared Component Extraction

#### [NEW] [MatrixLoader.tsx](file:///d:/sherlock/src/components/ui/MatrixLoader.tsx)

Extract from `OperationView.tsx` - the animated loading indicator with status text.

#### [NEW] [Accordion.tsx](file:///d:/sherlock/src/components/ui/Accordion.tsx)

Create reusable accordion component with:

- Props: `title`, `isOpen`, `onToggle`, `icon`, `children`
- Consistent styling matching existing accordion patterns

#### [NEW] [EntityBadge.tsx](file:///d:/sherlock/src/components/ui/EntityBadge.tsx)

Reusable entity display component:

- Shows entity name with type icon
- Color-coded by entity type (PERSON, ORGANIZATION, UNKNOWN)

#### [NEW] [SentimentBadge.tsx](file:///d:/sherlock/src/components/ui/SentimentBadge.tsx)

Sentiment indicator with consistent styling:

- POSITIVE → green
- NEGATIVE → red
- NEUTRAL → gray/muted

#### [NEW] [SourceList.tsx](file:///d:/sherlock/src/components/ui/SourceList.tsx)

Reusable source list rendering with icons and links.

---

## Phase 2: Break Up Large Components

### OperationView (~75KB → ~15KB + 4 sub-components)

#### [NEW] [OperationView/index.tsx](file:///d:/sherlock/src/components/features/OperationView/index.tsx)

Main orchestrator handling:

- State management
- Data loading
- Component composition

#### [NEW] [OperationView/DossierPanel.tsx](file:///d:/sherlock/src/components/features/OperationView/DossierPanel.tsx)

Left panel with case dossier:

- Case info display
- Report list
- Entity summary

#### [NEW] [OperationView/ReportViewer.tsx](file:///d:/sherlock/src/components/features/OperationView/ReportViewer.tsx)

Center panel with:

- Report content
- Markdown rendering
- Leads section

#### [NEW] [OperationView/InspectorPanel.tsx](file:///d:/sherlock/src/components/features/OperationView/InspectorPanel.tsx)

Right panel with:

- Entity details
- Headline details
- Lead details

#### [NEW] [OperationView/Toolbar.tsx](file:///d:/sherlock/src/components/features/OperationView/Toolbar.tsx)

Top toolbar with navigation and actions.

---

### NetworkGraph (~80KB → ~20KB + 3 sub-components)

#### [NEW] [NetworkGraph/index.tsx](file:///d:/sherlock/src/components/features/NetworkGraph/index.tsx)

Main orchestrator with state management.

#### [NEW] [NetworkGraph/GraphCanvas.tsx](file:///d:/sherlock/src/components/features/NetworkGraph/GraphCanvas.tsx)

D3 rendering logic including:

- Node/link rendering
- Zoom/pan controls
- Force simulation

#### [NEW] [NetworkGraph/NodeDossier.tsx](file:///d:/sherlock/src/components/features/NetworkGraph/NodeDossier.tsx)

Info panel for selected nodes.

#### [NEW] [NetworkGraph/GraphControls.tsx](file:///d:/sherlock/src/components/features/NetworkGraph/GraphControls.tsx)

Filter and action controls.

---

### LiveMonitor (~32KB → ~10KB + 2 sub-components)

#### [NEW] [LiveMonitor/index.tsx](file:///d:/sherlock/src/components/features/LiveMonitor/index.tsx)

Main component with core logic.

#### [NEW] [LiveMonitor/EventCard.tsx](file:///d:/sherlock/src/components/features/LiveMonitor/EventCard.tsx)

Event display card component.

#### [NEW] [LiveMonitor/SettingsPanel.tsx](file:///d:/sherlock/src/components/features/LiveMonitor/SettingsPanel.tsx)

Configuration panel (currently `renderSettingsPanel` function).

---

## Phase 3: Quick Wins

#### [MODIFY] [Investigation.tsx](file:///d:/sherlock/src/components/features/Investigation.tsx)

Add deprecation notice at top of file:

```tsx
/**
 * @deprecated This component is superseded by OperationView.
 * Kept for reference. Use OperationView for new development.
 */
```

#### [MODIFY] [Sidebar.tsx](file:///d:/sherlock/src/components/ui/Sidebar.tsx)

- Add `title` attributes to all icon-only buttons for accessibility

#### [MODIFY] [OperationView.tsx](file:///d:/sherlock/src/components/features/OperationView.tsx)

- Add loading state to voice briefing button (spinner while generating audio)

---

## Phase 4: UX Improvements

### Empty States

#### [NEW] [EmptyState.tsx](file:///d:/sherlock/src/components/ui/EmptyState.tsx)

Reusable empty state component:

```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

Apply to:

- Archives (no cases)
- OperationView (no reports)
- NetworkGraph (no entities)

### Keyboard Navigation

#### [NEW] [useKeyboardShortcuts.ts](file:///d:/sherlock/src/hooks/useKeyboardShortcuts.ts)

Global keyboard shortcut handler:

- `Ctrl/Cmd + N` → New investigation
- `Ctrl/Cmd + F` → Focus search (where applicable)
- `Escape` → Close modals/panels

#### [MODIFY] [App.tsx](file:///d:/sherlock/src/App.tsx)

Register global keyboard shortcuts hook.

---

## 2. Feature Implementation Plan

*Source: 549d7034-5e5b-4a76-91e1-addab8b84580/implementation_plan.md*

# Sherlock Feature Implementation Plan

Continuing from the previous session. **Phase 1 and Phase 7 are complete.** This plan covers Phases 2–6.

---

## Phase 2: Operation View Redesign

Transform the Investigation view into a professional 3-panel "Command Center" layout.

### [NEW] [OperationView.tsx](file:///d:/sherlock/src/components/features/OperationView.tsx)

New component with three resizable panels:

| Panel | Purpose |
|-------|---------|
| **Left (Dossier)** | Case info, entity list, headlines |
| **Center (Report)** | Main report viewer with breadcrumbs |
| **Right (Inspector)** | Context-sensitive entity/lead details |

---

## Phase 3: Breadcrumbs Component

### [NEW] [Breadcrumbs.tsx](file:///d:/sherlock/src/components/ui/Breadcrumbs.tsx)

Reusable breadcrumb navigation: `Case: Name > Report: Topic > Sub-Report: Topic`

---

## Phase 4: Task Setup Wizard

### [MODIFY] [TaskSetupModal.tsx](file:///d:/sherlock/src/components/ui/TaskSetupModal.tsx)

Convert single-page modal to multi-step wizard with progress indicator:
Target → Hypothesis → Key Figures → Sources → Config

---

## Phase 5: Live Monitor Expansion

### [MODIFY] [LiveMonitor.tsx](file:///d:/sherlock/src/components/features/LiveMonitor.tsx)

- Click behavior expands card inline
- "Investigate This" opens TaskSetupModal
- Persist expanded items as `Headline` to active case

---

## Phase 6: Entity & Lead Tracking

### [MODIFY] [NetworkGraph.tsx](file:///d:/sherlock/src/components/features/NetworkGraph.tsx)

- "Of Interest" flag on nodes (star icon)
- Persist to `sherlock_flagged_nodes`

### [MODIFY] [Investigation.tsx](file:///d:/sherlock/src/components/features/Investigation.tsx)

- Lead cards show badge if investigated

---

## 3. Phase 2 Decomposition Task List

*Source: 9b01b864-fba9-4728-8379-ef43dcf5b14d/task.md*

# Sherlock Phase 2 - Component Decomposition

## Phase 2a: OperationView Decomposition

- [x] Create `OperationView/` directory structure
- [x] Extract `Toolbar.tsx`
- [x] Extract `DossierPanel.tsx`
- [x] Extract `ReportViewer.tsx`
- [x] Extract `InspectorPanel.tsx`
- [x] Refactor `index.tsx` as state orchestrator
- [x] Update imports in `App.tsx`

## Phase 2b: NetworkGraph Decomposition

- [x] Create `NetworkGraph/` directory structure
- [x] Extract `GraphCanvas.tsx`
- [x] Extract `NodeDossier.tsx` (Reused DossierPanel)
- [x] Extract `GraphControls.tsx` (Renamed to ControlBar)
- [x] Extract `InspectorPanel.tsx` (Renamed to NodeInspector)
- [x] Refactor `index.tsx` as state orchestrator
- [x] Update imports in `App.tsx`

## Phase 2c: LiveMonitor Decomposition

- [x] Create `LiveMonitor/` directory structure
- [x] Extract `SettingsPanel.tsx`
- [x] Extract `EventCard.tsx`
- [x] Refactor `index.tsx` as orchestrator
- [x] Update imports in `App.tsx`

## Phase 1 Remaining: Adopt Shared Components

- [x] Replace inline accordions in `OperationView`, `NetworkGraph`, `LiveMonitor` with shared `Accordion.tsx`
- [x] Add `EmptyState` to `Archives.tsx`, `OperationView`, `NetworkGraph`

---

## 4. Phase 2 Detailed Plan

*Source: 9b01b864-fba9-4728-8379-ef43dcf5b14d/implementation_plan.md*

# Phase 2 Implementation Plan: Component Decomposition

## Phase 2a: LiveMonitor Decomposition

Target: ~200 line orchestrator + 2 sub-components (`EventCard`, `SettingsPanel`)

## Phase 2b: OperationView Decomposition

Target: ~250 line orchestrator + 4 sub-components (`Toolbar`, `DossierPanel`, `ReportViewer`, `InspectorPanel`)

## Phase 2c: NetworkGraph Decomposition

Target: ~300 line orchestrator + 4 sub-components (`GraphCanvas`, `DossierPanel`, `InspectorPanel`, `GraphControls`)

---

## 5. Future Phases

*Source: 9b01b864-fba9-4728-8379-ef43dcf5b14d/future_phases.md*

## Phase 5: Global Search Feature (High)

- Command Palette / Search Bar
- Full-text report search

## Phase 6: State Management Refactor (Medium)

- Move from prop drilling to Context or Zustand

## Phase 7: Persistence Layer Abstraction (Medium)

- Centralized persistence hooks (`usePersistedState`, `useCases`)

## Phase 8: Testing Infrastructure (Low)

- Setup Vitest, Testing Library, and E2E tests

## Phase 9: Mobile Responsiveness Polish (Low)

- Stacked panels, touch targets, swipe gestures

## Phase 10: Case Templates (Low)

- Save investigation configurations

## Phase 11: Analytics Dashboard (Low)

- Track investigation patterns and stats

---

## 6. Missing Items Summary (Gap Analysis)

**Status as of January 6, 2026:**

The Codebase has successfully completed **Phases 1 through 4**, including the major **Phase 2 Component Decomposition** of `OperationView`, `NetworkGraph`, and `LiveMonitor`.

**Pending Items (Backlog):**

1. **Global Search (Phase 5)**: This is the highest priority missing feature. Users currently cannot search across cases or reports easily.
2. **State Management (Phase 6)**: The app still relies on prop drilling. As components shrink, this becomes manageable, but a Context or Store solution would be cleaner.
3. **Persistence Layer (Phase 7)**: `localStorage.ts` exists, but a hook-based abstraction for collections (`useCases`) is not yet implemented.
4. **Testing (Phase 8)**: There is zero test coverage. This is a critical technical debt item.
5. **Mobile Polish (Phase 9)**: The app is usable on desktop but likely rough on mobile devices due to complex 3-panel layouts.

**Recommendation:** Proceed with **Phase 5 (Global Search)** next, as it adds the most immediate user value.
