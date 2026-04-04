# Sherlock Domain-Pack Cutover Plan

Date: 2026-04-03
Status: Proposed

## Objective

Refactor Sherlock from an investigation-specific application into a general-purpose knowledge workspace built on a domain-pack architecture, while preserving the existing product shell, layout quality, and core user flows.

This plan is intentionally split into two execution streams:

- Stream 1: Core cutover
- Stream 2: Polish and expansion

The recommendation is to implement the architecture in the shape of Option B now, but in a practical first-party form:

- one app
- one runtime
- built-in domain packs
- no plugin marketplace or dynamic external pack loader yet

That gives the repo the right long-term architecture without wasting time on an intermediate abstraction that would need to be replaced later.

## Guiding Principles

- Keep the current app shell and visual identity.
- Generalize internals before generalizing labels everywhere.
- Treat current investigation workflows as one built-in pack, not as the base truth for all data.
- Prefer migration-safe, backward-compatible changes for persistence and UI routing.
- Land the architectural cutover first, then spend a second stream on prompts, templates, labeling, and cleanup.

## Target End State

Sherlock should evolve into:

- a generic workspace engine
- a run orchestration system
- a flexible artifact model with typed sections
- a built-in domain-pack registry
- a purpose-profile registry
- mode-aware UI labeling built on top of the same app shell

The resulting structure should support workflows like:

- investigations
- scientific research
- AI and technology tracking
- policy and regulatory monitoring
- due diligence
- briefings and synthesis work

## Architectural Decision

### What We Are Choosing

We are choosing B-style architecture now:

- domain behavior is defined through packs and profiles
- core runtime is generic
- user-facing product can still feel like one cohesive Sherlock app

### What We Are Not Choosing Yet

We are not building:

- third-party pack installation
- remote pack registries
- multi-user server coordination
- a full plugin marketplace

This is a clean core refactor, not a platform commercialization pass.

## Core Model To Introduce

### 1. Workspace

Replace the idea that every top-level container is inherently a `Case`.

Recommended direction:

- internal type: `Workspace`
- user-facing label determined by label profile

Example display labels:

- Investigation pack: Case
- Research pack: Project
- Briefing pack: Workspace or Briefing Pack

Workspace responsibilities:

- hold top-level title and description
- maintain status
- track selected pack and default purpose
- own related artifacts, runs, and signals
- provide future room for tags and metadata

### 2. Run

Generalize `InvestigationTask` into a generic run concept.

Recommended internal type:

- `WorkspaceRun`

Responsibilities:

- input request snapshot
- provider and model snapshot
- pack and purpose snapshot
- launch source
- run status
- created and completed timestamps
- output artifact linkage

### 3. Artifact

Generalize `InvestigationReport` into a generic artifact type.

Recommended internal type:

- `Artifact`

Responsibilities:

- title
- summary
- artifact type
- typed sections
- entities
- sources
- follow-up items
- metadata
- raw output text

### 4. Domain Pack

Promote current scope behavior into a broader pack model.

Recommended internal type:

- `DomainPack`

Responsibilities:

- domain context
- personas
- source suggestions
- taxonomies
- category defaults
- label profile
- visual identity hooks
- supported purposes

### 5. Purpose Profile

Separate domain from execution intent.

Recommended internal type:

- `PurposeProfile`

Examples:

- deep-dive
- latest-findings
- monitor
- compare
- synthesis
- executive-brief
- trend-scan

Purpose profile responsibilities:

- define prompt objective
- define expected output shape
- define section types
- define follow-up generation style

## Stream 1: Core Cutover

### Goal

Land the architecture that makes Sherlock domain-pack driven without requiring a full UI redesign in the same pass.

### Success Criteria

- core runtime is generic rather than investigation-specific
- built-in domain packs exist and drive execution behavior
- purpose profiles exist and shape runs
- artifacts support typed sections
- current investigation workflows still function through compatibility mappings
- persistence remains stable and migration-safe

### Scope

This stream includes:

- types and taxonomy
- runtime registries
- launch pipeline changes
- prompt and output contract changes
- persistence updates
- compatibility layer for current UI

This stream does not aim to:

- fully rename every user-facing string
- perfect every prompt
- redesign every screen
- add all future packs immediately

### Work Breakdown

#### 1. Define New Core Types

Primary files:

- `src/types/index.ts`

Introduce or prepare:

- `Workspace`
- `WorkspaceRun`
- `Artifact`
- `ArtifactSection`
- `DomainPack`
- `PurposeProfile`
- `LabelProfile`
- `Signal`

Compatibility approach:

- keep current exported investigation types temporarily
- map them onto the new generic types
- avoid a big-bang delete of old names in the first pass

Key design choice:

- new types become the architectural truth
- legacy names become compatibility aliases or transitional wrappers

#### 2. Add Pack And Purpose Registries

Primary files:

- new `src/domain/packs/*`
- new `src/domain/purposes/*`
- new `src/domain/index.ts`
- current `src/data/presets.ts`

Implementation direction:

- migrate current built-in scopes into first-party built-in packs
- preserve current preset content where possible
- add purpose profiles that can be composed with packs

Suggested built-in packs for first cut:

- investigation
- scientific-research
- ai-technology
- policy-regulation

Suggested first purpose profiles:

- deep-dive
- latest-findings
- monitor
- trend-scan
- synthesis

Important note:

The current `InvestigationScope` model can be retained as a transitional subtype under the pack system if that reduces churn.

#### 3. Generalize Launch Config And Run Requests

Primary files:

- `src/App.tsx`
- `src/types/index.ts`
- `src/services/gemini.ts`
- `src/services/providers/types.ts`
- `src/services/providers/index.ts`

Add fields such as:

- `packId`
- `purposeId`
- `artifactType`
- `labelProfileId`
- `outputProfileId`

Refactor the current `launchInvestigation` flow into a generic launch flow in structure, even if the function name is retained temporarily.

Target behavior:

- every launch resolves pack
- every launch resolves purpose
- every launch resolves output contract
- every run stores those snapshots for traceability

#### 4. Introduce Typed Artifact Sections

Primary files:

- `src/types/index.ts`
- `src/services/providers/shared/prompts.ts`
- provider normalization files under `src/services/providers/shared/*`
- `src/components/features/OperationView/ReportViewer.tsx`

New artifact structure should support section kinds such as:

- executive-summary
- key-findings
- anomalies
- leads
- evidence
- timeline
- methodology
- literature-review
- implications
- next-steps

Implementation approach:

- artifacts should render from sections when present
- if only old fields exist, derive sections at runtime
- this keeps the current UI working while moving to the new contract

#### 5. Generalize Prompt Construction

Primary files:

- `src/services/providers/shared/prompts.ts`
- provider adapter files

Refactor prompt construction around:

- pack context
- purpose objective
- output contract
- date constraints
- source suggestions
- persona selection

Target state:

- prompts are no longer hardcoded around only investigation behavior
- same provider interface can execute research, monitoring, synthesis, and brief generation

#### 6. Expand Persistence Safely

Primary files:

- `src/services/db/schema.ts`
- `src/services/db/migrations_sql.ts`
- `src/services/db/migrations/*`
- repositories under `src/services/db/repositories/*`
- `docs/operations/DATA_PERSISTENCE.md`

Recommended migration-safe additions:

- add workspace mode fields to top-level containers
- add artifact type and metadata fields to reports
- add a `report_sections` or `artifact_sections` table
- add pack and purpose snapshot fields to tasks and reports

Do not immediately delete current tables unless absolutely necessary.

Safer first cut:

- keep `cases`, `reports`, and `tasks`
- extend them so they can host the new semantics
- rename internally in code first, not necessarily at the database table level

This reduces migration risk dramatically.

#### 7. Add Transitional Compatibility Layer

Primary files:

- `src/store/caseStore.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/repositories/TaskRepository.ts`
- UI features reading case and report data

Goals:

- current workflows still open old archives
- existing reports can still render
- active investigation flows still work under the new core model
- old `Operation:` naming can be phased out without breaking historic data

Recommended strategy:

- stop auto-prefixing new workspace titles with `Operation:`
- preserve old titles as-is
- introduce computed display labels for legacy items

#### 8. Add Label Profile Resolution

Primary files:

- new `src/domain/labels/*`
- `src/components/features/*`
- `src/components/ui/Sidebar.tsx`

For stream 1 this should be functional, not exhaustive.

Goal:

- resolve mode-aware display strings from a central profile
- avoid scattering new string branching across the app

Examples:

- workspace label
- artifact label
- follow-up label
- signal label

#### 9. Update Main Store To Reflect Generic Core

Primary files:

- `src/store/caseStore.ts`

Likely work:

- retain store file name for now if helpful
- begin shifting state semantics toward workspace and artifact truth
- add selectors or helpers that expose current labels cleanly to existing UI

Important constraint:

Do not force every component to fully understand the new model in one pass. Centralize as much compatibility as possible in selectors, mapping helpers, and repositories.

### Deliverables For Stream 1

- generic core types landed
- built-in domain pack registry landed
- purpose profile registry landed
- generic artifact contract landed
- prompt system refactored around pack plus purpose
- persistence expanded for new metadata and sections
- compatibility mappings landed for existing investigation flows

### Files Likely To Change In Stream 1

- `src/types/index.ts`
- `src/App.tsx`
- `src/store/caseStore.ts`
- `src/data/presets.ts`
- `src/services/gemini.ts`
- `src/services/providers/index.ts`
- `src/services/providers/types.ts`
- `src/services/providers/shared/prompts.ts`
- `src/services/providers/shared/normalizers.ts`
- `src/services/db/schema.ts`
- `src/services/db/migrations_sql.ts`
- `src/services/db/migrations/*`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/repositories/TaskRepository.ts`
- `src/components/features/OperationView/ReportViewer.tsx`
- `src/components/ui/TaskSetupModal.tsx`
- `docs/operations/architecture.md`
- `docs/operations/DATA_PERSISTENCE.md`

### Risks In Stream 1

- over-rotating into large renames instead of compatibility
- breaking archive rendering for old reports
- coupling new packs too tightly to current scope model
- spending too much time on UI wording instead of runtime structure

### Testing Expectations For Stream 1

Critical validation areas:

- launch from Feed
- launch from Live Monitor
- launch deep dives from Operation View
- archive and reopen outputs
- render old report shape and new artifact shape
- ensure pack and purpose snapshots persist correctly

Minimum command validation:

- `npm run lint`
- `npm run test`
- `npm run build`

## Stream 2: Polish And Expansion

### Goal

Take the new core and make it feel deliberate, polished, and fully multi-domain across prompts, labels, templates, and visuals.

### Success Criteria

- the app feels intentionally broad, not investigation-only with patched wording
- new packs have quality templates and sensible defaults
- artifact rendering feels native for different purposes
- docs and prompts reflect the new model cleanly

### Scope

This stream includes:

- prompt tuning
- template and starter content creation
- label cleanup
- UI refinement
- docs updates
- testing expansion

### Work Breakdown

#### 1. Refine Pack Definitions

Primary files:

- built-in pack definitions
- purpose definitions

Tasks:

- sharpen source libraries
- improve personas
- refine category taxonomies
- align visual identity hooks

#### 2. Improve Prompt Quality By Pack And Purpose

Primary files:

- `src/services/providers/shared/prompts.ts`
- provider adapters and normalizers

Tasks:

- tune prompts for research synthesis
- tune prompts for latest findings summaries
- tune prompts for technology tracking
- tune prompts for policy monitoring
- reduce investigation-specific phrasing leakage into non-investigation outputs

#### 3. Expand Artifact Renderers

Primary files:

- `src/components/features/OperationView/ReportViewer.tsx`
- related UI section components

Tasks:

- render section types intentionally
- support artifacts that are not lead-centric
- improve section ordering by purpose profile
- add layouts for findings, comparisons, timelines, and implications

#### 4. Clean Up UI Labels Everywhere

Primary files:

- `src/components/ui/Sidebar.tsx`
- `src/components/features/Feed.tsx`
- `src/components/features/LiveMonitor/index.tsx`
- `src/components/features/OperationView/*`
- `src/components/features/Archives.tsx`
- `src/components/features/Settings/*`

Tasks:

- rename investigation-only wording where appropriate
- allow pack-aware terminology
- preserve Sherlock identity while broadening language

Examples:

- Finder may become a more general discovery surface
- Operation View may become a workspace or artifact view depending on pack
- Case Files may become mode-aware or pack-aware archives

#### 5. Upgrade Templates And Starter Flows

Primary files:

- `src/components/ui/TaskSetupModal.tsx`
- `src/components/features/Settings/TemplateGallery.tsx`
- template persistence and docs

Tasks:

- create starter templates for non-investigation workflows
- make setup steps adapt by purpose
- improve default topic prompts and guidance

#### 6. Expand Graph Semantics

Primary files:

- `src/components/features/NetworkGraph/*`
- graph-related types and utilities

Tasks:

- add concept, paper, event, and source nodes
- improve entity resolution for non-person and non-organization nodes
- let artifacts and claims participate in the graph more naturally

#### 7. Unify Signal Surfaces

Primary files:

- `src/types/index.ts`
- live monitor and feed features
- repositories if persisted

Tasks:

- converge `Headline`, `FeedItem`, and `MonitorEvent` toward a broader signal model
- allow signals for papers, product releases, policy updates, and other non-OSINT events

#### 8. Documentation Cleanup

Primary files:

- `README.md`
- `docs/operations/architecture.md`
- `docs/operations/BROAD_SCOPE.md`
- `docs/operations/SCOPES.md`
- `docs/operations/SOURCES.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- any new domain-pack docs

Tasks:

- update docs to reflect the new architecture truth
- document built-in packs and purposes
- document new persistence fields and output contracts

#### 9. Test And Stabilization Pass

Tasks:

- update tests for new contracts and label profiles
- add pack and purpose coverage
- add backward compatibility cases for legacy reports and workspaces

### Deliverables For Stream 2

- refined built-in packs
- stronger purpose-specific prompting
- polished multi-domain labels
- upgraded templates and starter workflows
- richer artifact rendering
- documentation fully aligned with the new architecture

### Risks In Stream 2

- broadening language so much that Sherlock loses character
- shipping weak pack definitions that feel shallow
- adding too many packs before the first four feel excellent

## Recommended Execution Order

### Sequence

1. Lock the taxonomy and type model.
2. Build registries for packs, purposes, and labels.
3. Expand run config and artifact schema.
4. Update prompt construction and normalization.
5. Extend persistence and repositories.
6. Add compatibility layer for old workflows.
7. Make existing UI run on the new core.
8. Begin polish stream after the architecture is stable.

## Session Strategy

### Session 1

Target this as the main architecture session.

Goal:

- complete most or all of Stream 1

Realistic outcome:

- new core is in place
- current workflows still work
- app is architecturally ready for multiple packs and purposes

### Session 2

Target this as the refinement session.

Goal:

- complete most of Stream 2

Realistic outcome:

- prompts, templates, labels, and docs catch up to the new core
- the broader product identity feels deliberate rather than transitional

## Decision Log

### Decision 1

Choose B-style internal architecture now rather than expanding investigation-specific abstractions.

Reason:

This repo already has the right engine shape. The remaining issue is taxonomy and output flexibility. Solving that directly now is more efficient than layering a temporary architecture first.

### Decision 2

Keep one cohesive app shell rather than splitting into separate products.

Reason:

The current shell, navigation, and flow system are strengths. The cutover should preserve those strengths while broadening the runtime.

### Decision 3

Use built-in domain packs first rather than a dynamic plugin system.

Reason:

This gets the core architecture right with much less complexity and makes the first cut realistic in one major implementation pass.

## Acceptance Checklist

The plan should be considered successfully executed when:

- new workspaces can be launched with pack and purpose metadata
- artifacts can render typed sections beyond the current investigation schema
- investigation mode still works end to end
- at least several non-investigation packs exist in the registry
- prompts are pack-aware and purpose-aware
- persistence stores the new metadata safely
- the app no longer depends conceptually on every top-level item being an `Operation`

## Final Recommendation

Proceed with a clean B-core cutover now.

Do not spend time on an intermediate architecture that keeps investigation-specific types as the real system of record. Use Stream 1 to land the core runtime shift, and use Stream 2 to make the broader product feel polished, coherent, and distinctly Sherlock.
