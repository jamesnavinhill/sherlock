# Sherlock AI – Improvement Report

> A comprehensive analysis of opportunities for technical refinement and UX enhancement.

*Generated: January 2026*

---

## Executive Summary

The Sherlock codebase is a well-structured, feature-rich OSINT investigation platform. After thorough review, I've identified opportunities across six categories: **code organization**, **performance**, **architecture**, **UX polish**, **feature enhancements**, and **cleanup**.

---

## 1. Code Organization & Cleanup

### 1.1 Component Size Reduction

| File | Lines | Recommendation |
|------|-------|----------------|
| `NetworkGraph.tsx` | 80,304 bytes | Break into sub-components |
| `OperationView.tsx` | 74,891 bytes | Extract panels into separate components |
| `LiveMonitor.tsx` | 32,435 bytes | Extract settings panel |

**Proposed Structure:**

```
components/features/
├── OperationView/
│   ├── index.tsx           # Main orchestrator
│   ├── DossierPanel.tsx    # Left panel
│   ├── ReportViewer.tsx    # Center panel
│   ├── InspectorPanel.tsx  # Right panel
│   └── Toolbar.tsx         # Top toolbar
├── NetworkGraph/
│   ├── index.tsx           # Main graph logic
│   ├── GraphCanvas.tsx     # D3 rendering
│   ├── NodeDossier.tsx     # Info panel
│   └── GraphControls.tsx   # Filters/actions
└── LiveMonitor/
    ├── index.tsx
    ├── EventCard.tsx
    └── SettingsPanel.tsx
```

### 1.2 Shared Components Extraction

Several patterns repeat across components:

| Pattern | Occurrences | Extract To |
|---------|-------------|------------|
| Collapsible accordion sections | 4+ files | `ui/Accordion.tsx` |
| Entity badges/cards | 3+ files | `ui/EntityBadge.tsx` |
| Matrix loader animation | 3+ files | `ui/MatrixLoader.tsx` (consolidate) |
| Source list rendering | 4+ files | `ui/SourceList.tsx` |
| Sentiment badges | 3+ files | `ui/SentimentBadge.tsx` |

### 1.3 Helper Extraction

Move these inline helpers to dedicated utility files:

```typescript
// src/utils/audio.ts
export function decodeBase64(base64: string): Uint8Array
export function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer>

// src/utils/text.ts
export function cleanEntityName(raw: string): string
export function truncateText(text: string, maxLength: number): string

// src/utils/localStorage.ts
export function getItem<T>(key: string, fallback: T): T
export function setItem<T>(key: string, value: T): void
export function clearKey(key: string): void
```

### 1.4 Legacy File Cleanup

| File | Status | Action |
|------|--------|--------|
| `Investigation.tsx` | Superseded by OperationView | Mark deprecated or remove |
| `docs/_legacy/improvements.md` | Most items implemented | Archive or update as "completed" |

---

## 2. Technical Architecture Improvements

### 2.1 State Management

**Current:** React `useState` + `useReducer` in `App.tsx` with prop drilling.

**Issues:**

- Props drilled 3-4 levels deep
- Hard to track state dependencies
- Complex callback chains

**Option A: Context Providers**

```typescript
// src/context/CaseContext.tsx
const CaseContext = createContext<CaseContextValue>(null);
export const CaseProvider = ({ children }) => { ... };

// Usage in components
const { activeCase, setActiveCase, headlines } = useCase();
```

**Option B: Zustand (lightweight)**

```typescript
// src/store/caseStore.ts
export const useCaseStore = create((set) => ({
  activeCase: null,
  archives: [],
  setActiveCase: (c) => set({ activeCase: c }),
}));
```

### 2.2 Data Persistence Layer

**Current:** Direct localStorage calls scattered across components.

**Proposal:** Centralized persistence hooks

```typescript
// src/hooks/usePersistedState.ts
function usePersistedState<T>(key: string, initial: T): [T, (val: T) => void]

// src/hooks/useCases.ts
function useCases() {
  const [cases, setCases] = usePersistedState<Case[]>('sherlock_cases', []);
  // ... CRUD operations
}
```

### 2.3 API Error Handling

**Current:** Some try/catch blocks but inconsistent error surfacing.

**Add:**

- Toast notification system for errors
- Retry logic for transient failures
- Graceful degradation when API unavailable

```typescript
// src/hooks/useToast.ts
export function useToast() {
  const show = (message: string, type: 'error' | 'success' | 'info') => { ... };
  return { show };
}
```

### 2.4 Type Safety Enhancements

```typescript
// Add discriminated unions for better type narrowing
type InspectorContent =
  | { type: 'entity'; entity: Entity }
  | { type: 'headline'; headline: Headline }
  | { type: 'source'; source: Source }
  | { type: 'none' };

// Add strict modes
// tsconfig.json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

---

## 3. Performance Optimizations

### 3.1 NetworkGraph Re-renders

**Issue:** Full graph re-renders on any state change.

**Solutions:**

- Memoize node/link calculations with `useMemo`
- Use `React.memo` for individual node components
- Debounce tooltip updates
- Virtualize large node lists in panels

### 3.2 Large Archive Processing

**Issue:** Loading 100+ archived reports may become slow.

**Solutions:**

- Lazy load report content (store summaries, load full on demand)
- Add pagination to Archives view
- Index case/report titles for faster search

### 3.3 Image/Asset Loading

**Issue:** No lazy loading for any embedded content.

**Add:**

- `loading="lazy"` for images
- Intersection Observer for heavy components
- Skeleton loaders during data fetch

---

## 4. UX Improvements

### 4.1 Empty States

**Current:** Minimal or no empty state handling.

**Add engaging empty states for:**

- No cases → "Start your first investigation" CTA
- No reports in case → "Add leads to investigate"
- No entities → "Run an investigation to extract entities"
- Empty network graph → Visual prompt with sample nodes

### 4.2 Keyboard Navigation

**Add:**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New investigation |
| `Ctrl/Cmd + F` | Focus search |
| `Escape` | Close modals/panels |
| `Arrow keys` | Navigate lists |
| `Enter` | Select/confirm |

### 4.3 Loading States

**Current:** Matrix animation used inconsistently.

**Standardize:**

- Skeleton loaders for content areas
- Progress indicators for long operations
- Optimistic UI updates where possible

### 4.4 Mobile Responsiveness

**Current:** Basic mobile support via sidebar collapse.

**Enhance:**

- Stack panels vertically on mobile for OperationView
- Touch-friendly graph controls
- Bottom sheet modals instead of center modals
- Swipe gestures for navigation

### 4.5 Accessibility

**Add:**

- ARIA labels for all interactive elements
- Focus indicators (currently some missing)
- Screen reader announcements for live updates
- Reduced motion mode for animations
- Proper heading hierarchy

---

## 5. Feature Enhancements

### 5.1 Search & Filtering

| Feature | Location | Priority |
|---------|----------|----------|
| Global search across all reports | Toolbar | High |
| Entity search/jump in NetworkGraph | Graph controls | Medium |
| Date range filter for archives | Archives | Medium |
| Full-text report search | OperationView | Low |

### 5.2 Case Templates

Allow users to save investigation configurations as reusable templates:

```typescript
interface CaseTemplate {
  id: string;
  name: string;
  hypothesis: string;
  keyFigures: KeyFigure[];
  prioritySources: string;
  persona: InvestigatorPersona;
  searchDepth: 'STANDARD' | 'DEEP';
}
```

### 5.3 Collaboration Features (Future)

- Export shareable case URLs (base64 encoded JSON)
- Import cases from JSON files
- Comment/annotation system for reports

### 5.4 Analytics Dashboard

Track investigation patterns:

- Most investigated entities
- Common lead topics
- Investigation success rates
- Time spent per case

### 5.5 Notification System

- In-app notification bell
- Toast notifications for completed investigations
- Optional browser notifications (with permission)

---

## 6. Code Quality & Tooling

### 6.1 Testing

**Current:** No test files observed.

**Add:**

- Unit tests for utility functions (`vitest`)
- Component tests for UI (`@testing-library/react`)
- E2E tests for critical flows (`playwright`)

```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

### 6.2 Linting & Formatting

**Verify/add:**

- ESLint with React + TypeScript rules
- Prettier for consistent formatting
- Husky for pre-commit hooks

### 6.3 Documentation

- JSDoc comments for public utility functions
- Component prop documentation
- Storybook for UI component catalog (optional)

---

## Priority Matrix

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| 🔴 High | Extract shared components | High | Medium |
| 🔴 High | Break up large files | High | High |
| 🔴 High | Global search | High | Medium |
| 🟡 Medium | State management refactor | High | High |
| 🟡 Medium | Empty states | Medium | Low |
| 🟡 Medium | Keyboard shortcuts | Medium | Low |
| 🟡 Medium | Persistence layer abstraction | Medium | Medium |
| 🟢 Low | Testing infrastructure | High | High |
| 🟢 Low | Mobile responsiveness polish | Medium | Medium |
| 🟢 Low | Case templates | Low | Medium |
| 🟢 Low | Analytics dashboard | Low | High |

---

## Quick Wins (< 1 hour each)

1. **Add `MatrixLoader` as shared component** (already partially exists)
2. **Add keyboard shortcut for new investigation** (`Ctrl+N`)
3. **Add empty state to NetworkGraph**
4. **Mark `Investigation.tsx` as deprecated**
5. **Add loading state to voice briefing button**
6. **Consolidate accordion pattern**
7. **Add `title` attributes to icon-only buttons**

---

## Summary

The Sherlock codebase is well-designed with many planned improvements already implemented. The primary opportunities for enhancement are:

1. **Breaking up large components** for maintainability
2. **Extracting shared patterns** to reduce duplication
3. **Adding search functionality** for better discoverability
4. **Polishing empty states and loading indicators** for UX
5. **Establishing testing infrastructure** for reliability

These changes would elevate the codebase from "working well" to "production-grade maintainable."

---

## Implementation Progress (January 2026)

### ✅ Completed (Phases 1, 3, 4)

| Improvement | Status | Notes |
|-------------|--------|-------|
| Extract `text.ts` utility | ✅ | `cleanEntityName`, `truncateText`, `normalizeId` |
| Extract `audio.ts` utility | ✅ | `decodeBase64`, `decodeAudioData` |
| Extract `localStorage.ts` utility | ✅ | Typed `getItem`, `setItem`, `clearKey` + `STORAGE_KEYS` |
| Create `MatrixLoader.tsx` | ✅ | Shared loading component |
| Create `Accordion.tsx` | ✅ | Reusable collapsible sections |
| Create `EntityBadge.tsx` | ✅ | Type-colored entity display |
| Create `SentimentBadge.tsx` | ✅ | Sentiment indicator |
| Create `SourceList.tsx` | ✅ | Source link list |
| Create `EmptyState.tsx` | ✅ | Empty state CTA component |
| Create `useKeyboardShortcuts.ts` | ✅ | Global keyboard handler |
| Keyboard: `Ctrl+N` new case | ✅ | Integrated in App.tsx |
| Keyboard: `Escape` close modal | ✅ | Integrated in App.tsx |
| Mark `Investigation.tsx` deprecated | ✅ | JSDoc notice added |
| Refactor OperationView.tsx | ✅ | Uses shared utilities |
| Refactor NetworkGraph.tsx | ✅ | Uses shared utilities |

### ⏸️ Deferred (Phase 2)

- Breaking up large components into sub-directories postponed due to scope
- Foundation laid with shared components ready for adoption

---

## Hand-off for Next Agent

### Key Files Created

```
src/utils/
├── text.ts          # Text manipulation utilities
├── audio.ts         # Audio decoding for voice briefings
└── localStorage.ts  # Typed localStorage with STORAGE_KEYS

src/components/ui/
├── MatrixLoader.tsx   # Loading overlay with matrix rain
├── Accordion.tsx      # Collapsible section pattern
├── EntityBadge.tsx    # Entity type display
├── SentimentBadge.tsx # Sentiment indicator
├── SourceList.tsx     # Source links
└── EmptyState.tsx     # Empty state with CTA

src/hooks/
└── useKeyboardShortcuts.ts  # Global keyboard handler
```

### Immediate Next Steps (Phase 5+)

1. **Adopt shared components** - Replace inline accordion patterns in `OperationView.tsx`, `NetworkGraph.tsx`, `LiveMonitor.tsx` with the new `Accordion.tsx`
2. **Integrate EmptyState** - Add to Archives, NetworkGraph, and OperationView for no-data scenarios
3. **Component decomposition** - Break up the 3 large components (70-80KB each) into sub-directories as outlined in Phase 2
4. **Add global search** - High priority feature from Priority Matrix

### Important Context

- The `STORAGE_KEYS` constant in `localStorage.ts` contains all localStorage key names - use it to avoid magic strings
- `Investigation.tsx` is deprecated but kept for reference - do not add features there
- Keyboard shortcuts hook supports both `ctrl` and `meta` keys for cross-platform compatibility
- Build verified passing - no TypeScript errors
