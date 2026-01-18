# Sherlock – Proposed Improvements

> A detailed specification for upcoming enhancements to the OSINT investigation platform.

---

## Table of Contents

1. [Investigation Workflow Overhaul](#1-investigation-workflow-overhaul)
2. [Operation View Redesign](#2-operation-view-redesign)
3. [Navigation & Breadcrumbs](#3-navigation--breadcrumbs)
4. [Entity & Node Enhancements](#4-entity--node-enhancements)
5. [Dashboard & Search Improvements](#5-dashboard--search-improvements)
6. [Live Monitor Enhancements](#6-live-monitor-enhancements)
7. [Default Settings & Configuration](#7-default-settings--configuration)

---

## 1. Investigation Workflow Overhaul

### 1.1 Pre-Task Modal Expansion

**Current State**: `TaskSetupModal.tsx` allows selection of topic, persona, and scan depth before investigation.

**Proposed Enhancement**: Expand the pre-task modal into a multi-step guided flow:

| Step | Name | Fields |
|------|------|--------|
| 1 | **Focus Items** | Define primary investigation target/query |
| 2 | **Area of Concern** | Select category (Defense, Healthcare, etc.) or custom |
| 3 | **Hypothesis** | Optional field for investigator's working theory |
| 4 | **Key Figures** | Pre-seed entity names → creates initial graph nodes |
| 5 | **Sources** | Specify preferred sources/domains to prioritize |
| 6 | **Settings** | Persona, scan depth, model selection |

**Implementation Notes**:

- Never auto-start an investigation without this confirmation screen
- Pre-seeded entities should be added to `ManualNode[]` with type `ENTITY`
- Associate all generated leads with the case via `caseId` linking

### 1.2 Report Archival & Lead Tracking

**Current State**: Reports are auto-archived via `autoArchiveReport()` in `App.tsx`. Leads are displayed but not tracked after investigation.

**Proposed Enhancement**:

- When a lead is investigated, mark it with a visual badge linking to the resulting report
- Add a `LeadStatus` type: `'UNINVESTIGATED' | 'INVESTIGATED' | 'FLAGGED'`
- Store lead → report mappings in localStorage for persistence

---

## 2. Operation View Redesign

### 2.1 New Three-Panel Layout

**Reference**: The operation view should mirror the graph layout style with left/center/right panels.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dossier / Case Selection / Search / Filters / Views                        │
├──────────────┬────────────────────────────────────────────┬─────────────────┤
│              │        Breadcrumbs                         │                 │
│              ├────────────────────────────────────────────┤                 │
│              │                                            │                 │
│   Dossier    │                                            │   Info Panel    │
│   Panel      │          Report Viewer                     │                 │
│   (Left)     │          (Center)                          │   (Right)       │
│              │                                            │                 │
│              │                                            │                 │
│              │                                            │                 │
└──────────────┴────────────────────────────────────────────┴─────────────────┘
```

### 2.2 Panel Specifications

#### Top Bar

- **Dossier Toggle**: Collapse/expand left dossier panel
- **Case Selection**: Dropdown to switch between active cases
- **Search**: Quick search within current case reports
- **Filters**: Filter by entity, date range, report type
- **Views**: Toggle between report view, timeline view, source list

#### Left Panel: Dossier

- Similar to `NetworkGraph.tsx` dossier panel (collapsible sections)
- Shows: Active case info, investigation count, key entities, timeline summary
- Collapsible via toggle or hover

#### Center Panel: Report Viewer

- Full investigation report display (from `Investigation.tsx`)
- Breadcrumb navigation at top for report hierarchy
- All sub-reports linked and navigable
- Lead cards with investigation status badges

#### Right Panel: Info Panel

- Context-sensitive information display
- Click entity name → shows entity dossier with summary, connections, mentions
- Click source → shows source metadata and other reports citing it
- Styled like `NetworkGraph.tsx` entity panel (breadcrumb nav within panel)

### 2.3 Relation to Current Views

**Current**: `Investigation.tsx` is rendered when `AppView.INVESTIGATION` is active, triggered by clicking a task in TaskManager.

**Proposed**:

- Rename `INVESTIGATION` view to `OPERATION` view
- Make Operation View the **primary workflow page** (main working area)
- Keep Network Graph as a supplementary visualization tool

---

## 3. Navigation & Breadcrumbs

### 3.1 Report Breadcrumb Navigation

**Current State**: Navigation exists via `onBack`, `onJumpToParent` in `Investigation.tsx`, but lacks visual breadcrumb trail.

**Proposed Enhancement**:

```
Case: Government Contracting Fraud > Report: Pentagon Audits > Sub-Report: Lockheed Martin
```

- Clickable breadcrumb trail showing: Case → Parent Report → Current Report
- Stored in a navigation stack for proper back/forward behavior
- Breadcrumb items truncate on mobile with ellipsis menu

### 3.2 Info Panel Breadcrumbs

When navigating within the right info panel:

```
Entity: John Smith > Connections > Org: XYZ Corp
```

- Track drill-down path within the panel itself
- Back button returns to previous context
- Mirror the collapsible section pattern from `NetworkGraph.tsx` dossier

### 3.3 Site-Wide Navigation History

- Maintain a navigation history stack separate from browser history
- Custom back event handler (already partially implemented in `App.tsx` line 122)
- Persist recent navigation to allow "Recent Reports" quick access

---

## 4. Entity & Node Enhancements

### 4.1 "Of Interest" Marking

**Current State**: Nodes can be hidden via `sherlock_hidden_nodes`. No flagging system.

**Proposed Enhancement**:

- Add "Mark as Flagged" / "Mark of Interest" toggle on entity nodes info panel
- Persist to `sherlock_flagged_nodes` in localStorage
- Visual indicator: Star icon or colored ring on affected nodes info panel
- Filterable in graph view: "Show only flagged entities"

### 4.2 Entity Report Card Improvements

**Current State**: Entity cards in `Investigation.tsx` show name, type, role, and sentiment badge.

**Proposed Changes**:

- **Hide sentiment badge** by default (optional toggle in settings)
- Add connection count indicator
- Add "investigated" badge if entity has been deep-scanned

### 4.3 Info Panel Section Grouping

**Current State**: `NetworkGraph.tsx` dossier uses collapsible sections for Summary, Connections, Mentions.

**Proposed Enhancement**:

- Apply same collapsible section pattern to entity info panels in Operation View
- Group by: Overview, Connections, Investigation History, Sources

---

## 5. Dashboard & Search Improvements

### 5.1 Manual Search Trigger Only

**Current State**: `Feed.tsx` auto-scans on mount via `useEffect` calling `scanForAnomalies()`.

**Proposed Change**:

- Remove automatic scan on dashboard page load
- Require explicit "Scan for Leads" button press to initiate
- Add loading state with matrix animation (already exists: `MatrixCardLoader`)

### 5.2 Search & Filter Enhancements

**Current State**: Dashboard has category filter, date range, and keyword filter.

**Proposed Additions**:

- Search within all archived reports (full-text search)
- Filter by risk level, entity involvement
- Save search presets for recurring queries

---

## 6. Live Monitor Enhancements

### 6.1 Item Preview Flow (Not Auto-Investigate)

**Current State**: Clicking a monitor item in `LiveMonitor.tsx` immediately triggers `onInvestigate()` and starts a full report.

**Proposed Change**:

1. **Click item** → Expands inline or opens modal with:
   - Full text content (not truncated)
   - Source link (opens in new tab)
   - Timestamp and sentiment
   - **"Investigate This"** button to optionally trigger report flow
2. Only when user clicks "Investigate This" does the pre-task modal appear
3. This prevents accidental investigations and allows quick scanning

### 6.2 Headlines as Case Data

**Current State**: Monitor events are ephemeral — stored in React state (`events: MonitorEvent[]`) but not persisted to the case.

**Proposed Enhancement**:

- Introduce new type: `Headline` (or reuse `MonitorEvent` with persistence)
- When a Live Monitor runs, surfaced items get **saved to the case** as "Headlines"
- Headlines are treated as first-class case items alongside:
  - `InvestigationReport[]` (reports)
  - `Entity[]` (extracted people/orgs)
  - `Lead[]` (suggested follow-ups)
  - **`Headline[]`** (surfaced intel items) ← NEW

**Storage**: Add `sherlock_headlines` or nest within case data structure.

**UI Integration**:

- Headlines appear in Case Dossier panel
- Headlines can be promoted to Leads or directly investigated
- Filter by: investigated vs. pending, source type, date

### 6.3 Media Player Integration

**Proposed Enhancement**:

- Embed media player for video/audio content linked to case
- Support for: YouTube embeds, podcast audio streams, document previews
- "Related Media" section aggregating assets from all case sources

---

## 7. Default Settings & Configuration

### 7.1 Model Defaults

**Current State**: Model defaults to first option in dropdown (varies).

**Proposed Change**:

- Default model: `gemini-2.5-flash` (best balance of speed/quality)
- Store user's preferred default in `sherlock_config`

### 7.2 Investigation Status Tracking

**Current State**: `InvestigationTask` has status field but leads don't track investigation state.

**Proposed Enhancement**:

- Leads track whether they've been investigated
- Visual badge on lead cards: ✓ Investigated (linked) or ○ Pending
- Filter leads by status in Operation View

---

## Priority Matrix

| Priority | Item | Complexity |
|----------|------|------------|
| 🔴 High | Operation View Redesign (3-panel layout) | High |
| 🔴 High | Breadcrumb Navigation System | Medium |
| 🟡 Medium | Pre-Task Modal Expansion | Medium |
| 🟡 Medium | Lead Investigation Tracking | Low |
| 🟡 Medium | "Of Interest" Flagging | Low |
| 🟢 Low | Hide Sentiment Badge | Trivial |
| 🟢 Low | Manual Search Trigger | Trivial |
| 🟢 Low | Default to Gemini 2.5 | Trivial |
| 🟢 Low | Media Player Integration | Medium |

---

## Files Affected

Based on the current architecture, these files would require modification:

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `LeadStatus`, `FlaggedNode`, extended modal types |
| `src/App.tsx` | Navigation stack, new Operation view routing |
| `src/components/features/Investigation.tsx` | Three-panel layout, breadcrumbs, entity panels |
| `src/components/features/Feed.tsx` | Remove auto-scan, manual trigger only |
| `src/components/ui/TaskSetupModal.tsx` | Multi-step wizard flow |
| `src/components/ui/Sidebar.tsx` | Rename Investigation → Operation |
| `src/components/features/NetworkGraph.tsx` | Flagging system, extraction of dossier panel |
| `src/services/gemini.ts` | Default model configuration |

---

*Last Updated: January 2026*
