# Sherlock – Agent Instructions

> Reference for AI agents working on this codebase.

---

## Project Overview

**Sherlock** is a client-side OSINT investigation platform built with React 19, TypeScript, and Vite. It uses Gemini AI for investigations and D3.js for network visualization. All data persists to localStorage.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Orchestrator: view routing, task queue, auto-archive |
| `src/types/index.ts` | All TypeScript interfaces |
| `src/services/gemini.ts` | AI service: `investigateTopic`, `scanForAnomalies`, `getLiveIntel` |
| `src/components/features/Investigation.tsx` | Report display, entity cards, leads |
| `src/components/features/NetworkGraph.tsx` | D3 force graph, dossier panel |
| `src/components/features/Feed.tsx` | Dashboard with anomaly scanner |
| `src/components/features/LiveMonitor.tsx` | Real-time intel stream |
| `src/components/ui/TaskSetupModal.tsx` | Pre-investigation config modal |

---

## Core Types

```typescript
InvestigationReport  // Primary output: summary, entities, leads, sources
Entity               // Person/Org with sentiment
Case                 // Container grouping reports
InvestigationTask    // Async task with status
MonitorEvent         // Live intel item
Headline             // (PLANNED) Persisted monitor items
```

---

## Storage Keys

All localStorage keys prefixed with `sherlock_`:

- `archives`, `cases`, `config`, `api_key`
- `manual_links`, `manual_nodes`, `entity_aliases`, `hidden_nodes`

---

## Active Buildout: Improvements

See: [`docs/improvements.md`](./improvements.md)

**High Priority**:

1. Operation View 3-panel redesign (dossier / report / info)
2. Breadcrumb navigation system
3. Pre-task modal expansion (multi-step wizard)

**Key Concepts**:

- Headlines: Monitor items become case data like entities/leads
- Lead tracking: Mark leads as investigated with badge linking to report
- "Of Interest" flagging on entity nodes

---

## Patterns to Follow

1. **Never auto-start investigations** — always show pre-task modal
2. **Collapsible sections** — use pattern from NetworkGraph dossier
3. **Breadcrumbs** — hierarchical navigation for reports and info panels
4. **localStorage persistence** — all case data persists client-side
5. **Gemini 2.5 compatibility** — use `isModel25()` check for JSON fallback

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

---

*Last Updated: January 2026*
