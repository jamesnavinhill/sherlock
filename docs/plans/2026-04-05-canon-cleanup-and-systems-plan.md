# Canon Cleanup And Systems Plan

Date: April 5, 2026

## Intent

This plan turns the current audit into an execution plan for a balanced cleanup pass with a heavy canon bias.

The goal is not a cosmetic rename sweep. The goal is to:

- finish the move from investigation-first terminology to a clean general-purpose research model
- keep parity across runtime, persistence, UI, and docs
- reduce transitional compatibility debt quickly rather than preserving it indefinitely
- improve safety and consistency while reorganizing the codebase into clearer systems

This plan assumes:

- there is no meaningful installed-base migration burden to preserve
- we should optimize for the clean target model wherever that is practical
- targeted validation is preferred during implementation
- docs should be updated incrementally as work lands, followed by one final cleanup sweep
- medium-to-large slices are acceptable when they improve parity and reduce drift

## Canon Decisions

These are the planned canonical runtime concepts going forward.

### Canonical nouns

- `Workspace`: primary container
- `Run`: execution/generation event
- `Artifact`: generated or saved output
- `Signal`: durable saved observation/event formerly surfaced as `Headline`
- `FollowUp`: durable actionable next step formerly surfaced as generated `leads` and `followUps`
- `Entity`: durable referenced actor/concept/place/org
- `Source`: provenance/citation origin
- `WorkspaceItem`: note, excerpt, link, file, media, or other manual/canonical workspace record

### Explicit removals from the canon

- `Lead` is no longer a canonical domain root
- `Headline` is no longer a canonical domain root
- `Case` and `Report` should continue to shrink toward persistence-edge compatibility only, then be removed where practical

### Relationship model

Recommended lineage shape:

- `Signal -> sourceRunId? / sourceArtifactId?` when relevant
- `Run -> sourceSignalId?`
- `Run -> sourceFollowUpId?`
- `Artifact -> sourceRunId`
- `Artifact -> parentArtifactId?`
- `Artifact -> sourceFollowUpId?`
- `FollowUp -> originArtifactId`
- `FollowUp -> resolvedByArtifactId?`
- optional `FollowUp -> entityRefs[]`
- optional `FollowUp -> sourceRefs[]`

### Follow-up semantics

`FollowUp` should become the single durable model for artifact-produced actionable next steps and questions.

Recommended initial kinds:

- `QUESTION`
- `TASK`
- `HYPOTHESIS`
- `GAP`
- `NEXT_STEP`

Do not keep `LEAD` as a canonical kind unless a later product need clearly justifies it.

## End State

At the end of this plan, the codebase should read as a clean research workspace platform with investigation capabilities, not as an investigation app wrapped in compatibility aliases.

That means:

- runtime language is canonical and consistent
- persistence writes are safe and parity-preserving
- follow-ups and signals are first-class durable records
- the main store and feature monoliths are decomposed into organized systems
- docs describe the real code, not the transitional story

## Workstream Shape

This work is best handled as four coordinated workstreams rather than three overloaded ones.

Why four:

- canon/model work and storage-boundary work are related but not the same
- safety/integrity work needs its own acceptance criteria
- system decomposition needs room to be treated as architecture work, not "cleanup leftovers"

The four workstreams are:

1. Canonical model and lineage refactor
2. Persistence integrity and safety
3. Storage boundary and runtime hygiene
4. System decomposition and organized refactor

## Recommended Order

Recommended execution order:

1. Workstream 1 foundations
2. Workstream 2 atomic write pattern
3. Workstream 1 cutover through active runtime/persistence/doc surfaces
4. Workstream 3 cleanup and unification pass
5. Workstream 4 decomposition/refactor pass
6. final parity sweep across docs, naming, and validation

Reasoning:

- the target domain model needs to be decided first
- atomic persistence should be established early so the canon does not land on unsafe write paths
- storage cleanup should follow once the new model is in place
- decomposition is safer after the target nouns and boundaries are stable

## Workstream 1: Canonical Model And Lineage Refactor

### Goal

Replace transitional investigation-first terminology with the settled research-workspace canon while preserving behavioral parity.

### Primary outcomes

- `Signal` replaces `Headline` as the canonical durable saved observation model
- `FollowUp` replaces generated `leads` and `followUps` as the canonical actionable model
- `Case` and `Report` stop being active mental-model terms outside compatibility edges
- runtime lineage explicitly supports follow-up-driven artifact generation

### Scope

Types, domain modeling, runtime/store surfaces, persistence contracts, and documentation.

Primary files/modules likely touched:

- `src/types/index.ts`
- `src/domain/*`
- `src/store/caseStore.ts`
- `src/App.tsx`
- `src/components/features/Timeline/*`
- `src/components/features/OperationView/*`
- `src/components/features/Chat/*`
- `src/components/features/WorkspaceBoard/*`
- `src/services/runtime.ts`
- `src/services/lineage/*`
- `src/services/db/schema.ts`
- `src/services/db/repositories/*`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/reports/CURRENT_STATUS.md`
- `README.md`

### Design decisions

#### 1. `FollowUp` must be first-class and durable

Do not leave follow-ups as compatibility arrays embedded in artifacts.

They should support:

- origin link to artifact
- actionable launch into a new run
- explicit status tracking
- resolution link to a produced artifact
- timeline/board/chat/archive visibility

#### 2. `Signal` is the durable saved incoming observation model

Do not keep `Headline` as a first-class system noun.

Possible practical approach:

- UI may still render some labels like "Saved Signal" or context-aware copy
- but code, schema, docs, and selectors should use `Signal`

#### 3. Compatibility names should collapse quickly

Because there is no real migration burden, do not preserve old names broadly.

Allowed compatibility zones:

- temporary repository/table adapters during refactor
- import/backup normalization if needed
- short-lived bridging code during the implementation sequence

### Proposed data model work

#### `Signal`

Introduce or rename toward a canonical `Signal` record with fields roughly like:

- `id`
- `workspaceId`
- `content`
- `source`
- `url?`
- `timestamp`
- `kind`
- `status`
- `linkedArtifactId?`
- `createdAt?`
- `updatedAt?`
- optional metadata/provenance

#### `FollowUp`

Introduce a first-class durable `FollowUp` record with fields roughly like:

- `id`
- `workspaceId`
- `kind`
- `title`
- `actionText` or `prompt`
- `status`
- `originArtifactId`
- `originSectionId?`
- `sourceSignalId?`
- `entityRefsJson?`
- `sourceRefsJson?`
- `resolvedByArtifactId?`
- `createdAt`
- `updatedAt`
- optional metadata

### Planned slices

#### Slice 1A: Define the canonical model

- add/rename canonical types for `Signal` and `FollowUp`
- define lineage fields and status enums
- update domain helpers and artifact contracts so generated artifact output can normalize into first-class follow-ups

Acceptance:

- type layer compiles cleanly
- one canonical noun exists for each concept
- no new code depends on `Lead` or `Headline` as domain roots

#### Slice 1B: Persistence and repository cutover for signals/follow-ups

- add schema support for durable follow-ups
- rename or adapt signal persistence surfaces
- add repositories/selectors for follow-ups and signals
- preserve artifact linkage

Acceptance:

- follow-ups can be created, read, updated, resolved, and linked to artifacts
- signals still support current monitor/discovery flows

#### Slice 1C: Runtime/UI cutover

- update Timeline, Operation View, Chat, Workspace Board, and launch flows to use follow-ups and signals
- ensure follow-up launches write lineage fields directly instead of relying on inference where possible

Acceptance:

- artifact-generated follow-ups are actionable
- launching a follow-up creates a linked run and linked artifact chain
- Timeline can show the lineage cleanly

#### Slice 1D: Remove broad compatibility names

- reduce `lead`/`headline`/`case`/`report` naming in active runtime code
- keep temporary compatibility only where still necessary at persistence boundaries

Acceptance:

- active runtime code reads in canonical terms
- old nouns no longer dominate store/component/service code

### Risks

- broad rename churn can obscure behavioral regressions
- timeline/chat/board linkage can drift if not cut over together

### Mitigation

- land the canonical model before decomposition
- keep explicit acceptance tests for follow-up lineage behavior
- avoid half-cutover where UI terms and persistence terms diverge for long

## Workstream 2: Persistence Integrity And Safety

### Goal

Make multi-table writes atomic and keep safety parity across all critical persistence flows.

### Plain-language definition

Atomic persistence means:

- save all related rows together
- if any part fails, save none of them

This prevents partial durable state like:

- report row saved without sections/evidence/entities
- session saved without expected dependent records
- follow-up resolution saved without matching artifact linkage

### Primary outcomes

- one reusable transaction/write-bundle pattern for multi-table writes
- report/artifact persistence becomes atomic first
- if the pattern works well, it is rolled through the other critical parity-sensitive write paths rather than left isolated

### Scope

- DB client transaction support or equivalent write-bundle helper
- repository write paths that span multiple tables
- failure-path testing

Primary files/modules likely touched:

- `src/services/db/client.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/repositories/ChatRepository.ts`
- `src/services/db/repositories/BoardAgentRepository.ts`
- `src/services/db/repositories/WorkspaceBoardRepository.ts`
- `src/store/caseStore.ts`

### Planned slices

#### Slice 2A: Establish atomic-write infrastructure

- determine whether wa-sqlite + drizzle can support transactions directly in this setup
- if not, introduce a lower-level SQLite write helper for `BEGIN / COMMIT / ROLLBACK`
- document the supported repository write pattern

Acceptance:

- one clear mechanism exists for atomic multi-table writes
- repository authors have one canonical pattern to follow

#### Slice 2B: Convert artifact persistence first

- convert artifact/report creation and related inserts to atomic writes
- include sections, evidence, entities, sources, and follow-ups if follow-up persistence lands in Workstream 1

Acceptance:

- artifact creation cannot leave partial dependent rows behind
- failure-path tests confirm rollback behavior

#### Slice 2C: Expand to other critical parity-sensitive write paths

If the pattern is stable, immediately extend to the other critical paths instead of leaving two persistence styles in place.

Priority candidates:

- workspace-data import/restore
- workspace purge/delete
- board-agent session/action writes where coupled state changes matter
- chat save/append actions where artifact writes and action logs must stay aligned

Acceptance:

- critical multi-table writes share one integrity pattern
- safety behavior is uniform, not accidental

### Risks

- SQLite wrapper constraints may make transaction ergonomics awkward
- medium-to-large conversion slices can hide subtle repository regressions

### Mitigation

- prove the pattern on artifacts first
- keep the repository API stable where possible
- add targeted tests for rollback and parity-sensitive writes

## Workstream 3: Storage Boundary And Runtime Hygiene

### Goal

Centralize the remaining non-canonical storage behavior and close smaller correctness/uniformity gaps while the model refactor is fresh.

### Primary outcomes

- browser storage usage is intentionally centralized
- provider capability enforcement matches the architecture claims
- validation docs are trustworthy again
- ID generation and smaller cleanup conventions are uniform

### Scope

- remaining direct `localStorage` access outside the approved boundary
- provider-router capability checks
- stale validation/status docs
- smaller hygiene inconsistencies

Primary files/modules likely touched:

- `src/config/systemConfig.ts`
- `src/config/aiModels.ts`
- `src/components/features/LiveMonitor/index.tsx`
- `src/store/caseStore.ts`
- `src/services/providers/index.ts`
- `src/utils/localStorage.ts`
- active docs under `README.md`, `docs/reports`, and `docs/operations`

### Design decisions

#### 1. Centralize storage with a strong bias toward the clean model

Recommended target:

- provider keys may remain special-cased if necessary
- everything else should flow through one typed settings/storage boundary

That includes:

- active workspace selection
- live-monitor autosave preference
- OpenRouter catalog cache
- recent model selections
- any remaining non-provider browser-persisted settings

#### 2. Router capability enforcement should become real, not documentary

`assertCapability(...)` should enforce operation support for:

- `INVESTIGATE`
- `CHAT`
- `BOARD_AGENT`
- `SCAN_ANOMALIES`
- `LIVE_INTEL`
- `TTS`

with one authoritative operation-to-capability map.

#### 3. Small hygiene items should be cleaned in the same pass

Examples:

- unused variables
- ad hoc `Date.now() + Math.random()` IDs where `createLocalId(...)` should be used
- stale docs that still claim old validation state

### Planned slices

#### Slice 3A: Storage boundary cleanup

- introduce a single typed storage/settings facade
- route remaining feature-level storage reads/writes through it
- keep docs aligned with the actual boundary

Acceptance:

- no active feature component writes directly to `localStorage` unless explicitly approved as an exception

#### Slice 3B: Router and state hygiene

- finish capability enforcement
- clean duplicated active-task state semantics if not fully resolved in Workstream 1
- fix known lint issues and similar correctness noise

Acceptance:

- router rejects unsupported models/operations before runtime adapter calls
- task selection semantics are explicit and non-duplicative

#### Slice 3C: Docs and status parity

- refresh validation/status docs
- update architecture and persistence docs to match the new canon and storage boundary

Acceptance:

- active docs reflect the actual runtime behavior at the end of the stream

## Workstream 4: System Decomposition And Organized Refactor

### Goal

Turn the current large orchestration files into organized systems with clear ownership boundaries while preserving parity with the canonical model.

### Primary outcomes

- state, orchestration, selectors, persistence actions, and feature presentation are separated more cleanly
- high-change surfaces become easier to extend without accidental cross-surface breakage
- the codebase reads as intentional architecture rather than accumulated feature mass

### Scope

Main decomposition targets:

- `src/store/caseStore.ts`
- `src/components/features/WorkspaceBoard/index.tsx`
- `src/components/features/TimelineView.tsx`
- `src/components/ui/TaskSetupModal.tsx`
- `src/App.tsx`

### Refactor posture

This is intentionally a full organized refactor, not just low-risk extraction.

But it should still preserve parity and avoid redesigning behavior casually.

Recommended principle:

- refactor structure aggressively
- refactor behavior conservatively

### Proposed target organization

#### Store decomposition

Split the monolithic store into clearer modules such as:

- store state shape/types
- selectors
- workspace actions
- artifact/run actions
- signal/follow-up actions
- chat actions
- board actions
- maintenance/import/export actions
- UI state actions

Possible pattern:

- keep one public store entry point if desired
- move action logic into feature/domain-specific modules
- keep shared selectors pure and testable

#### Feature decomposition

For `WorkspaceBoard` and `TimelineView`, separate:

- data derivation/selectors
- event handlers and command orchestration
- view state hooks
- presentation components/panels
- side-effect and persistence coordination

#### App shell decomposition

For `App.tsx`, separate:

- launch pipeline
- chat-open pipeline
- navigation/view orchestration
- theme/bootstrap concerns

### Planned slices

#### Slice 4A: Store architecture split

- introduce modular store action/selectors
- cut `caseStore` into organized units without losing one-store behavior unless intentionally changed

Acceptance:

- the store is materially smaller and easier to reason about
- feature actions live near their domain logic

#### Slice 4B: Workspace board system refactor

- split `WorkspaceBoard` into data/controller/presentation layers
- ensure board-agent, library, placement, persistence, and side-panels each have clear homes

Acceptance:

- board feature is no longer dominated by one giant file
- major subflows are independently understandable

#### Slice 4C: Timeline and task setup refactor

- split timeline derivation, filtering, selection, and panel rendering
- split task setup modal domain logic from rendering

Acceptance:

- Timeline and task setup read as systems, not long mixed files

#### Slice 4D: App shell cleanup

- isolate launch and navigation orchestration
- reduce `App.tsx` to shell-level coordination

Acceptance:

- app shell owns composition, not every detail

### Risks

- large file decomposition can accidentally change behavior
- naming and decomposition work can interfere with each other if sequenced poorly

### Mitigation

- do not start decomposition until the canonical nouns and atomic write pattern are stable
- keep targeted behavior tests around launch propagation, timeline derivation, board flows, and chat flows

## Validation Strategy

### Default validation per slice

- `npm run lint`
- `npm run typecheck`
- targeted tests for the affected area

Run `npm run build` when a slice affects:

- shipped app code
- bundling
- routing
- shared UI/runtime behavior

### Full suite policy

Do not run the full suite on every slice by default.

Run `npm run test` at:

- workstream milestones
- risky cross-cutting cutovers
- before final merge of the broader refactor

### Suggested targeted coverage by area

- canon/lineage: timeline tests, launch propagation tests, store tests, repository tests
- persistence safety: repository tests, DB client tests, workspace-data tests
- storage/runtime hygiene: provider router tests, config tests, store tests
- decomposition: targeted tests for the refactored surface plus `build` where shared app behavior changes

## Documentation Requirements

Update docs incrementally as the work lands:

- `README.md` when setup/validation/status shifts
- `docs/operations/ARCHITECTURE.md` for structural changes
- `docs/operations/DATA_PERSISTENCE.md` for follow-up/signal persistence and storage-boundary updates
- `docs/operations/OPERATIONS_RUNBOOK.md` for provider capability/fallback behavior changes
- `docs/reports/CURRENT_STATUS.md` when the active implementation state materially changes

Final pass:

- one final documentation sweep after all workstreams land to remove lingering transitional language

## Delivery Style

Recommended delivery style:

- medium-to-large slices
- each slice groups logically related parity work
- avoid overly tiny incremental steps that leave two competing systems in place for long

Good slice shape:

- one coherent concept or boundary
- full parity through runtime + persistence + tests + docs for that concept

Bad slice shape:

- name-only changes without behavior cutover
- persistence changes without lineage/UI cutover
- decomposition before the target canon is stable

## Acceptance Criteria

This plan is complete when:

- `Signal` and `FollowUp` are first-class canonical models
- artifact-produced follow-ups are durable, actionable, and explicitly linked through lineage
- old `lead` and `headline` roots are removed from active runtime thinking
- critical multi-table persistence paths are atomic
- storage behavior is centralized and documented consistently
- provider capability checks are enforced at the router boundary
- the largest orchestration files are decomposed into organized systems
- active docs match the implemented architecture
- targeted validation passes throughout, and final milestone validation includes full test coverage plus build

## Bottom Line

The best next move is a coordinated canon-and-systems refactor, not a series of isolated cleanup chores.

Sherlock has enough capability now that the main risk is not missing features. The main risk is letting transitional naming, partial boundaries, and oversized orchestration files harden into the permanent architecture. This plan is designed to finish that transition cleanly and leave the codebase ready for the next major phase of development.
