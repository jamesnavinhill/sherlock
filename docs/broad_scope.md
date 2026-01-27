# Sherlock AI: Broad Scope Refactor Analysis

> Research report analyzing the feasibility and approach for broadening Sherlock AI to support investigations across **any domain and timeframe**, while preserving the current government fraud focus as a "preset" investigation topic.

---

## Executive Summary

The current Sherlock AI implementation is deeply specialized for **government fraud, waste, and abuse** investigations with hardcoded assumptions throughout the codebase. Broadening the scope requires refactoring core AI prompts, introducing an **Investigation Scope** configuration layer, redesigning persona/source systems, and updating the UI to surface domain-agnostic configuration.

This document outlines:

1. **Current Architecture Constraints** — Where domain specificity lives
2. **Proposed Scope Model** — How to generalize investigations
3. **Investigation Preset System** — How to preserve niche focuses as templates
4. **UX Considerations** — How to surface configuration in an on-brand way
5. **Open Questions** — Decisions requiring user input before implementation

---

## 1. Current Architecture Constraints

### 1.1 Hardcoded Domain Assumptions

| Location | Constraint | Excerpt |
|----------|-----------|---------|
| [gemini.ts L332](file:///c:/Users/james/projects/sherlock-main/src/services/gemini.ts#L332) | Investigation prompt | `"investigate target for potential fraud/waste/abuse (2020-2025)"` |
| [gemini.ts L335](file:///c:/Users/james/projects/sherlock-main/src/services/gemini.ts#L335) | Source hardcoding | `"SEARCH: USASpending.gov, SAM.gov"` |
| [gemini.ts L175-176](file:///c:/Users/james/projects/sherlock-main/src/services/gemini.ts#L175-176) | Anomaly scan scope | `"government spending fraud, misuse of federal grants"` |
| [gemini.ts L177](file:///c:/Users/james/projects/sherlock-main/src/services/gemini.ts#L177) | Date range | Hardcoded `"between 2020 and 2025"` |
| [Feed.tsx L14](file:///c:/Users/james/projects/sherlock-main/src/components/features/Feed.tsx#L14) | Categories | `['Cybersecurity', 'Geopolitics', 'Finance', 'Infrastructure', 'Military', 'Social Unrest']` |
| [types/index.ts L101](file:///c:/Users/james/projects/sherlock-main/src/types/index.ts#L101) | Personas | `FORENSIC_ACCOUNTANT`, `JOURNALIST`, `INTELLIGENCE_OFFICER`, `CONSPIRACY_ANALYST` |
| [SOURCES.md](file:///c:/Users/james/projects/sherlock-main/docs/SOURCES.md) | Source directory | Federal databases, government watchdog X handles |

### 1.2 Current Flexible Configuration Points

| Element | Current State | Location |
|---------|---------------|----------|
| **Topic** | Free-text input | `TaskSetupModal` Step 1 |
| **Hypothesis** | Optional free-text | `TaskSetupModal` Step 2 |
| **Key Figures** | Seed entities (PERSON/ORG) | `TaskSetupModal` Step 3 |
| **Priority Sources** | User-specified domains/handles | `TaskSetupModal` Step 4, `SettingsPanel` |
| **Date Range** | Partial support in LiveMonitor/Feed | `SettingsPanel`, `Feed` filters |
| **Persona** | 4 predefined options | `SystemConfig.persona` |
| **Search Depth** | STANDARD / DEEP | `SystemConfig.searchDepth` |
| **Thinking Budget** | 0-16K tokens | `SystemConfig.thinkingBudget` |
| **Model Selection** | Gemini model variants | `SystemConfig.modelId` |

### 1.3 Template System Limitations

The existing `CaseTemplate` interface only stores:

```typescript
interface CaseTemplate {
  id: string;
  name: string;
  description?: string;
  topic: string;
  config: Partial<SystemConfig>;  // model, persona, depth, budget
  createdAt: number;
}
```

**Missing from templates:**

- Investigation domain/scope context
- Suggested sources for this domain
- Category lists for feed scanning  
- Custom persona definitions
- Date range defaults

---

## 2. Proposed Scope Model

### 2.1 Core Concept: `InvestigationScope`

Introduce a new configuration layer that defines the **domain context** for all investigations:

```typescript
interface InvestigationScope {
  id: string;
  name: string;                        // "Government Fraud", "Corporate Due Diligence"
  description: string;
  
  // AI Prompt Context
  domainContext: string;               // Injected into all Gemini prompts
  investigationObjective: string;      // What are we looking for?
  
  // Temporal
  defaultDateRange?: {
    strategy: 'RELATIVE' | 'ABSOLUTE' | 'NONE';
    relativeYears?: number;            // e.g., 5 = last 5 years
    absoluteStart?: string;
    absoluteEnd?: string;
  };
  
  // Sources
  suggestedSources: SourceCategory[];  // Grouped source recommendations
  defaultPrioritySources?: string;     // Pre-filled sources
  
  // Categories for anomaly scanning
  categories: string[];                // Feed scanner categories
  
  // Persona Options
  personas: PersonaDefinition[];       // Available personas for this scope
  defaultPersona?: string;
  
  // UI Theming (optional)
  accentColor?: string;
  icon?: string;
}

interface SourceCategory {
  name: string;                        // "Primary Databases", "News Sources"
  sources: { label: string; url?: string; handle?: string }[];
}

interface PersonaDefinition {
  id: string;
  label: string;
  instruction: string;                 // System prompt injection
}
```

### 2.2 Prompt Generalization Strategy

Transform hardcoded prompts to accept scope parameters:

#### Before (Current)

```typescript
// gemini.ts L332
let basePrompt = `${personaInstruction} Mission: Investigate target "${topic}" 
                  for potential fraud/waste/abuse (2020-2025).`;
basePrompt += ` SEARCH: USASpending.gov, SAM.gov...`;
```

#### After (Proposed)

```typescript
const buildInvestigationPrompt = (
  topic: string, 
  scope: InvestigationScope, 
  config: SystemConfig
) => {
  const persona = scope.personas.find(p => p.id === config.persona);
  const dateRange = resolveDateRange(scope.defaultDateRange);
  
  return `${persona?.instruction || 'You are an expert investigator.'}
    
INVESTIGATION CONTEXT: ${scope.domainContext}
OBJECTIVE: ${scope.investigationObjective}
TARGET: "${topic}"
TEMPORAL SCOPE: ${dateRange}

${scope.suggestedSources.length > 0 
  ? `SUGGESTED SOURCES: ${formatSources(scope.suggestedSources)}` 
  : ''}

Analyze and extract entities, develop hypotheses, and identify leads.`;
};
```

---

## 3. Investigation Preset System

### 3.1 Built-in Presets

Ship with curated presets for common investigation domains:

| Preset | Domain Context | Categories | Example Sources |
|--------|----------------|------------|-----------------|
| **Government Fraud** (current) | Federal spending, grants, contracts | Finance, Healthcare, Defense | USASpending.gov, SAM.gov, FEC.gov |
| **Corporate Due Diligence** | Company background, M&A, compliance | Finance, Legal, Leadership | SEC.gov, LinkedIn, PACER |
| **Geopolitical Analysis** | International relations, conflicts | Geopolitics, Military, Diplomacy | State Dept, UN, think tanks |
| **Competitive Intelligence** | Market positioning, product strategy | Tech, Finance, Marketing | TechCrunch, Crunchbase, patents |
| **Cybersecurity Research** | Threats, vulnerabilities, actors | Cybersecurity, Infrastructure | CISA, MITRE, security blogs |
| **Open Investigation** | No domain constraints | All | User-specified |

### 3.2 Custom Preset Creation

Allow users to create/save custom scopes:

```typescript
// Store extension
interface CaseState {
  // ... existing ...
  investigationScopes: InvestigationScope[];  // User-created scopes
  activeScope: string | null;                  // Currently selected scope ID
}
```

### 3.3 Template Evolution

Extend `CaseTemplate` to include scope reference:

```typescript
interface CaseTemplate {
  // ... existing fields ...
  scopeId?: string;              // Reference to InvestigationScope
  customSources?: string;        // Override default sources
  customDateRange?: {...};       // Override default dates
}
```

---

## 4. UX Design Considerations

### 4.1 Scope Selection Entry Points

#### Option A: Dashboard Scope Switcher

Add a prominent scope selector to the Feed/Dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│  [🎯 Government Fraud ▼]  [🔍 Search targets...]  [⚙️ ⟳]   │
├─────────────────────────────────────────────────────────────┤
│  • Corporate Due Diligence                                  │
│  • Geopolitical Analysis                                    │
│  • Cybersecurity Research                                   │
│  • Competitive Intelligence                                 │
│  • Open Investigation                                       │
│  ───────────────────────                                    │
│  + Create Custom Scope                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Option B: Investigation Wizard Enhancement

Add a "Step 0" to `TaskSetupModal` for scope selection:

```
STEPS: [Scope] → Target → Hypothesis → Key Figures → Sources → Config
```

#### Option C: Dedicated Scope Management View

Add a new view in Settings for managing scopes, similar to Templates.

### 4.2 Maintaining Visual Brand

The current aesthetic is:

- **Monospace typography** (JetBrains Mono, Inter)
- **Dark theme** with zinc/black palette
- **Accent color customizable** (default: zinc-300)
- **Military/intelligence aesthetic** (uppercase labels, "OPERATION:", etc.)

For broad scope:

- Keep the core visual language
- Allow scopes to optionally customize accent color
- Use scope icons in selectors (🎯 for fraud, 🏢 for corporate, 🌐 for geopolitical)
- Maintain terminology flexibility: "Investigation" instead of "OSINT", "Target" is universal

### 4.3 Feed Category Dynamics

Currently, Feed categories are hardcoded:

```typescript
const CATEGORIES = ['All', 'Cybersecurity', 'Geopolitics', 'Finance', ...];
```

After refactor:

```typescript
const CATEGORIES = useMemo(() => {
  const activeScope = scopes.find(s => s.id === activeScopeId);
  return activeScope?.categories || DEFAULT_CATEGORIES;
}, [activeScopeId]);
```

---

## 5. Implementation Complexity Assessment

### 5.1 Effort Breakdown

| Component | Complexity | Changes Required |
|-----------|------------|------------------|
| **Types** | Low | Add `InvestigationScope`, extend `CaseTemplate` |
| **gemini.ts** | High | Refactor all 3 core functions to accept scope param |
| **Store** | Medium | Add scope state, active scope, persistence |
| **TaskSetupModal** | Medium | Add scope step or scope selector |
| **Feed** | Medium | Dynamic categories, scope-aware anomaly scan |
| **LiveMonitor** | Low-Medium | Pass scope to `getLiveIntel()` |
| **Settings** | Medium | Add scope management UI (CRUD) |
| **Built-in Presets** | Medium | Define 5-6 curated scopes with sources, personas |
| **SOURCES.md** | Low | Restructure as scope-aware reference |

### 5.2 Migration Path

1. **Phase 1**: Add `InvestigationScope` type and default "Government Fraud" scope
2. **Phase 2**: Refactor `gemini.ts` to use scope context
3. **Phase 3**: Update UI components to scope-aware mode
4. **Phase 4**: Add scope management and custom scope creation
5. **Phase 5**: Ship built-in presets

---

## 6. Open Questions for User Clarification

> [!IMPORTANT]
> The following decisions require user input before implementation can proceed.

### Q1: Scope Selection UX

**Decision needed:** Where should users select their investigation scope?

| Option | Pros | Cons |
|--------|------|------|
| **A: Dashboard header** | Always visible, quick switching | Adds UI clutter, may confuse new users |
| **B: Wizard Step 0** | Natural pre-flight flow, explicit | Extra click each time, wizard becomes longer |
| **C: Settings tab** | Clean separation, power-user friendly | Hidden from main flow, less discoverable |
| **D: Hybrid** (A + C) | Best of both, switcher + management | More implementation work |

**Tradeoff if deferred:** Defaulting to Option B is safest for MVP but may require later refactor.
***User Answer: Hybrid but using option B and C - a preflight flow baked into what we have now makes sense/ and also a settings tab to set the global (with the preflight using the global as default, but would override with user input)
---

### Q2: Persona System

**Decision needed:** How should personas relate to scopes?

| Option | Description | Implication |
|--------|-------------|-------------|
| **A: Scope-specific personas** | Each scope defines its own personas | Complete flexibility, more config work |
| **B: Global personas + scope suggestions** | Keep current 4 personas, scopes suggest which to use | Simpler, less flexible |
| **C: Persona templates** | Scopes can define custom + use globals | Most flexible, complex UI |

**Current personas are:**

- `FORENSIC_ACCOUNTANT` — financial focus
- `JOURNALIST` — public interest
- `INTELLIGENCE_OFFICER` — threat assessment  
- `CONSPIRACY_ANALYST` — fringe patterns

For corporate due diligence, none of these fit perfectly. A "Corporate Researcher" or "Compliance Analyst" persona would be more appropriate.

**Tradeoff if deferred:** Using Option B limits the quality of non-fraud investigations but is faster to implement.
***User Answer: A. Wed like to make this robust and consistent across scopes. the current prsonas are agreat starting point that can be adapted for each scope
---

### Q3: Source Recommendations

**Decision needed:** How much source curation do you want for built-in presets?

| Option | Effort | Value |
|--------|--------|-------|
| **A: Minimal** | List 2-3 key sources per scope | Low effort, user must supplement |
| **B: Comprehensive** | 10+ sources per scope, categorized | High effort, great UX |
| **C: Community-sourced** | Ship minimal, let users contribute | Low initial effort, requires community |

**Tradeoff:** Comprehensive sources (B) significantly improves investigation quality but requires research for each domain.
***User Answer: B
---

### Q4: Date Range Handling

**Decision needed:** How should scopes define temporal constraints?

| Strategy | Use Case |
|----------|----------|
| **RELATIVE** | "Last 5 years" — always current |
| **ABSOLUTE** | "2020-2025" — fixed window (current behavior) |
| **NONE** | No date constraint by default |
| **USER_EVERY_TIME** | Always prompt user to specify |

**Tradeoff:** Relative dates are more evergreen but may miss historical context. Absolute dates can become stale.
***User Answer: NONE. but allow us to define in both settings (global) and in the investigation wizard flow
---

### Q5: Custom Scope Persistence

**Decision needed:** Where should custom scopes be stored?

| Option | Pros | Cons |
|--------|------|------|
| **localStorage** (current pattern) | Matches existing architecture | Lost on browser clear, no sync |
| **Export/Import** | User controls backups | Manual, no sync |
| **Future: Cloud sync** | Cross-device, collaboration | Requires backend, auth |

**Tradeoff:** localStorage is simplest for MVP; cloud sync would be a separate feature.
***User Answer: We might need to consider a local sqlite like storage as this project evolves.. please help me understand more here. localstorage does not persist across browser refresh? is that the case for our investigations now? it feels like they do persist across refreches and even shutdowns.. wed like these to persist for sure. lets discuss this a bit more before going further
---

### Q6: Backwards Compatibility

**Decision needed:** How to handle existing cases/templates created before scope system?

| Option | Behavior |
|--------|----------|
| **A: Auto-migrate to "Government Fraud"** | All existing data gets scope assignment |
| **B: "Legacy" scope** | Create a legacy scope that mimics current behavior |
| **C: "Open Investigation"** | Assign to generic scope with no constraints |

**Tradeoff:** Option A assumes existing users were using the fraud focus (likely true), Option C is more neutral.
***User Answer: Currently this is just building, we dont have any data or reports to save
---

## 7. Consolidated Decisions Summary

Based on user responses, the following decisions are finalized:

| Question | Decision | Implementation Notes |
|----------|----------|---------------------|
| **Q1: Scope Selection UX** | **Hybrid (B + C)** | Wizard Step 0 for per-investigation scope; Settings tab for global default |
| **Q2: Persona System** | **A: Scope-specific personas** | Each scope defines its own personas; current 4 serve as templates |
| **Q3: Source Recommendations** | **B: Comprehensive** | 10+ sources per preset, categorized by type |
| **Q4: Date Range Handling** | **NONE default, user-configurable** | No date constraints by default; configurable in both Settings (global) and Wizard (per-investigation) |
| **Q5: Storage** | **SQLite (long-term)** | Migrate from localStorage to SQLite for durability and future extensibility |
| **Q6: Backwards Compatibility** | **N/A** | No existing data to migrate; fresh implementation |

---

## 8. SQLite Integration Strategy

### 8.1 Current State: Zustand + localStorage

The app currently uses Zustand with the `persist` middleware. **Good news:** localStorage DOES persist across browser refreshes, restarts, and reboots. Your investigations are safe.

**Current limitations:**

- ~5-10MB total storage (shared with other sites)
- Linear scan for complex queries
- Lost if user clears browser data

### 8.2 SQLite Options for Browser/SPA

| Library | Type | Pros | Cons |
|---------|------|------|------|
| **sql.js** | WASM | Pure in-browser, no server | DB must load/save to IndexedDB |
| **absurd-sql** | WASM + IndexedDB | Real persistence, OPFS support | More complex setup |
| **Dexie.js** | IndexedDB wrapper | Simple API, native persistence | Not SQL, limited queries |
| **better-sqlite3** | Node.js | Best performance | Requires Electron/Tauri |

### 8.3 Recommended Approach: sql.js + IndexedDB

```typescript
// src/services/database.ts (future)
import initSqlJs, { Database } from 'sql.js';

export const initDatabase = async (): Promise<Database> => {
  const SQL = await initSqlJs();
  const savedData = await loadFromIndexedDB('sherlock-db');
  
  if (savedData) {
    return new SQL.Database(savedData);
  }
  
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE scopes (id TEXT PRIMARY KEY, name TEXT, config_json TEXT);
    CREATE TABLE investigations (id TEXT PRIMARY KEY, scope_id TEXT, topic TEXT, summary TEXT);
    -- etc.
  `);
  return db;
};
```

### 8.4 Migration Path

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 0** | Keep localStorage for MVP broad scope refactor | None |
| **Phase 1** | Add sql.js + IndexedDB, migrate schema | 1-2 days |
| **Phase 2** | Refactor store actions to use SQL | 2-3 days |
| **Phase 3** | Add auto-save on state change | 0.5 day |
| **Phase 4** | Export/Import as .sqlite file | 1 day |

> [!TIP]
> The `InvestigationScope` interface is already SQL-friendly with normalized structure.

---

## 9. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Investigation quality degradation** | Medium | High | Quality prompts in built-in presets |
| **UX complexity increase** | Medium | Medium | Default to "Open" for new users |
| **SQLite bundle size** | Low | Medium | sql.js adds ~1.5MB; use WASM streaming |
| **IndexedDB quota limits** | Low | Medium | Monitor usage; offer export |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Types & Store)

- Create `InvestigationScope`, `PersonaDefinition` interfaces in `types/index.ts`
- Extend `CaseTemplate` with `scopeId`
- Add scope state to Zustand store
- Create `src/data/presets.ts` with built-in presets

### Phase 2: Gemini Service Refactor

- Create `buildInvestigationPrompt()` helper
- Refactor `investigateTopic()`, `scanForAnomalies()`, `getLiveIntel()` to accept scope

### Phase 3: UI Components

- Add scope selector to `TaskSetupModal` (Step 0)
- Add date range inputs to wizard
- Add global scope settings in Settings tab
- Create `ScopeManager` component for CRUD
- Update `Feed` for dynamic categories

### Phase 4: Built-in Presets

| Preset | Key Sources | Personas |
|--------|-------------|----------|
| **Government Fraud** | USASpending, SAM, FEC, GAO | Forensic Accountant, Watchdog, Intel Analyst |
| **Corporate Due Diligence** | SEC EDGAR, PACER, LinkedIn | Compliance Analyst, M&A Researcher |
| **Geopolitical Analysis** | State Dept, UN, CFR, CSIS | Intelligence Officer, Analyst |
| **Cybersecurity Research** | CISA, MITRE ATT&CK, NVD | Threat Hunter, Researcher |
| **Competitive Intelligence** | Crunchbase, TechCrunch, PatentsView | Market Analyst |
| **Open Investigation** | User-defined | All personas |

### Phase 5: SQLite Migration (Follow-up)

- Install sql.js, configure Vite for WASM
- Create database service with IndexedDB persistence
- Migrate from localStorage → SQLite
- Add database export/import UI

---

## 11. Verification Plan

### 11.1 Existing Tests

```bash
npm test  # Run Vitest
```

### 11.2 New Tests to Add

- `scope.test.ts` — Test scope loading, persona resolution
- `gemini-scope.test.ts` — Test prompt generation with scopes

### 11.3 Manual Browser Testing

| Flow | Steps | Expected |
|------|-------|----------|
| **Scope in Wizard** | New Case → Step 0 scope selector → Select "Corporate DD" → Continue | Scope persists; prompt uses corporate context |
| **Global Scope** | Settings → Default Scope → Change to "Cybersecurity" → New Case | Default scope pre-selected |
| **Date Range** | Wizard → Set custom dates → Complete → Check AI response | Dates passed correctly |
| **Feed Categories** | Set scope to "Cybersecurity" → Feed | Categories update |

---

## 12. File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add `InvestigationScope`, `PersonaDefinition` |
| `src/data/presets.ts` | NEW | Built-in scope presets |
| `src/store/caseStore.ts` | MODIFY | Add scope state and actions |
| `src/services/gemini.ts` | MODIFY | Refactor to accept scope context |
| `src/components/ui/TaskSetupModal.tsx` | MODIFY | Add Step 0, date range inputs |
| `src/components/features/Settings/index.tsx` | MODIFY | Global scope selector |
| `src/components/features/Settings/ScopeManager.tsx` | NEW | Scope CRUD UI |
| `src/components/features/Feed.tsx` | MODIFY | Dynamic categories |
| `docs/SOURCES.md` | MODIFY | Reorganize by scope |

---

*Report updated: January 27, 2026*  
*Ready for final review and implementation approval*
