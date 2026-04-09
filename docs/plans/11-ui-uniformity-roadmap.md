# UI Uniformity Roadmap

Date: April 8, 2026

Status: Proposed

Related inputs:

- `docs/reports/2026-04-08-ui-uniformity-report.md`
- `docs/reports/2026-04-08-codebase-audit.md`
- `docs/plans/10-canonical-cleanup-roadmap.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/Chat/ChatContextRail.tsx`
- `src/components/features/Timeline/TimelineDossierPanel.tsx`
- `src/components/features/Timeline/TimelineDetailRail.tsx`
- `src/components/features/WorkspaceBoard/BoardLibraryRail.tsx`
- `src/components/features/WorkspaceBoard/BoardInspectorRail.tsx`
- `src/components/features/NetworkGraph/NodeInspector.tsx`
- `src/components/features/OperationView/InspectorPanel.tsx`
- `src/components/ui/Accordion.tsx`
- `src/components/ui/InspectorActionRow.tsx`
- `src/components/ui/chrome.ts`
- `src/index.css`

## Intent

This plan turns the April 8 UI uniformity report into an active implementation roadmap under `docs/plans/`.

This is not a redesign plan and not a "touch up whatever looks off" checklist.

This is a deliberate product-and-code cleanup plan to:

- make Sherlock’s panels and rails behave like one system
- make the Artifact viewer read like a document instead of a fragment board
- turn `Key Findings` into a first-class structured concept rather than leaving it as presentation-derived content
- bring Board, Chat, Timeline, Network, and Artifact surfaces into one interaction family
- preserve the strongest existing local patterns instead of flattening everything into generic UI

## Relationship To The Main Cleanup Roadmap

This plan is a companion roadmap to `docs/plans/10-canonical-cleanup-roadmap.md`.

It fits most naturally under the remaining workflow-surface parity work in Stream 5, but it is specific enough to stand as its own execution document because:

- the UI contract decisions are now explicit
- the `Key Findings` work crosses types, providers, persistence, search, chat, board, and timeline
- the implementation is larger than a normal "visual cleanup" pass

## Product North Star

By the end of this plan, Sherlock should feel like one coherent workspace:

- left rails read as `Library`
- right rails read as `Details`, `Context`, or `Inspector`
- rail headers are simple, contextual, and not repetitive
- action rows appear in one predictable place
- expandable rail sections behave the same way everywhere
- meaningful panel items share one hover and active treatment
- the Artifact viewer reads like a serious, editable document
- `Key Findings` is a real product object with clear downstream behavior

## Locked Product Decisions

These are not open questions anymore. Stream work should treat them as the baseline unless a later doc explicitly revises them.

### 1. Header vocabulary

- Eyebrow text identifies only the panel role: `Library`, `Details`, `Context`, or `Inspector`.
- Do not repeat `Project`, `Workspace`, `Timeline`, or similar context words in the eyebrow.
- The title carries the specific contextual subject: workspace title, selected artifact title, selected event title, selected item title, and so on.
- Left-side rails standardize on `Library`.
- Right-side rails standardize on `Details`, `Context`, or `Inspector`.
- The Board library eyebrow should no longer say `Canonical Library`.
- The Board library eyebrow should not include the current icon.

### 2. Rail open and scroll behavior

- The Chat context rail is the canonical shell behavior.
- Only one top-level section should be open at a time by default.
- The open section should flex into remaining vertical space.
- The bottom of the rail should pin cleanly to the viewport.
- Only the open section body should scroll when needed.
- The rail itself should not become the main scroll surface because one section expanded awkwardly.
- The Board library rail keeps its richer nested item model, but it still adopts the same pinned-bottom shell behavior.

### 3. Action row placement

- Cross-panel action buttons belong directly under the rail header and above the section stack.
- Those buttons should use the same light-outline, accent-on-hover language as toolbar and `InspectorActionRow` controls.
- Section-local actions can still live inside sections when they are truly local.

### 4. Canonical item interaction styling

- The Artifact viewer details-panel entity-row hover state is the canonical item hover and active treatment.
- Apply that pattern to findings, follow-ups, entities, context rows, history rows, and other meaningful panel items.
- Keep top-level section headers simpler; do not give every row the same visual weight as the item rows inside it.

### 5. Canonical interaction-state split

- Sherlock should use two primary hover and active languages for almost all routine UI states.
- The neutral surface treatment is the default browse-and-select language.
- Use the neutral surface treatment for sidebar items, list rows, section rows, cards, filter options, selectable panels, and other non-destructive navigational or structural items.
- This treatment should read like a raised surface or shaded surface shift, not like an accent glow.
- The accent action treatment is the default do-and-launch language.
- Use the accent action treatment for toolbar controls, action buttons, follow-up prompts, board actions, inspector actions, and other controls that imply execution rather than browsing.
- This treatment should keep the current subtle accent tint and border emphasis rather than introducing a separate hover vocabulary.
- These two families should cover the vast majority of hover, active, and selected states; exceptions should be intentional and rare.

### 6. Main report direction

- Remove the current top summary or reading-pattern block from the main report view.
- Do not fill the main report with small summary cards.
- The main report should read like a document with meaningful, editable sections.
- `Key Findings` is its own canonical category and should appear as a dedicated section near the top of the document.
- `Key Findings` should also remain visible in the details rail.
- Follow-up questions should share one layout pattern across the viewer and relevant panels.
- Entities should use a two-column layout inspired by the library, but with the dot treatment from the details panel instead of icon-heavy rows.
- Sources and provenance rows should use the lighter viewer-library text treatment.

### 7. Motion and overlay direction

- Motion should stay minimal, utilitarian, and restrained.
- Avoid text-heavy entrance animation.
- Keep already-good modals and popups mostly intact and sweep only obvious inconsistencies.

### 8. First-class findings are required

- Do not ship a viewer-only `Key Findings` implementation that still piggybacks on `agendas`, generic `SECTION` snippets, or arbitrary metadata blobs.
- The product should have one canonical structured finding contract.

## Scope And Boundaries

In scope:

- rails, panels, headers, section stacks, item rows, action rows, hover and active states
- Artifact viewer main-column structure
- details/context/inspector parity across Artifact, Chat, Timeline, Board, and Network surfaces
- `Key Findings` data contract, persistence shape, search behavior, and downstream integrations
- typography and motion cleanup for the affected surfaces

Out of scope unless discovered as a direct dependency:

- broad visual redesign
- replacing the theme system
- unrelated route or store cleanup
- replacing already-good modal flows just for stylistic purity

## Codebase Reality And Constraints

This plan is viable against the active codebase, but several implementation constraints matter.

### Existing strengths

- `ArtifactSectionKind` already includes `KEY_FINDINGS`.
- `buildArtifactSections()` in `src/domain/artifacts.ts` already has a dormant `findings?: string[]` input.
- Artifact viewer section ordering already understands `KEY_FINDINGS`.
- workspace search already indexes artifact sections, so section-backed findings can already surface as generic retrieval snippets
- evidence, follow-ups, entities, and artifact sections already have established normalization and persistence patterns that findings can mirror

### Current gaps

- `Artifact` has no canonical `keyFindings` field
- `StructuredArtifactPayload` has no `keyFindings`
- prompt instructions and provider schemas do not request or validate dedicated findings
- persistence has tables for follow-ups, sections, evidence, entities, and sources, but no finding-specific storage
- workspace library entries, board refs, chat mention kinds, and chat attachment kinds are closed enums that do not know about findings
- workspace handoff helpers do not route findings
- timeline tracks and event types do not model findings

### Important implication

First-class findings are not a one-file enhancement.

The work must cut through:

- active types
- provider output contract
- domain shaping
- persistence and repository hydration
- workspace search and discovery
- chat mentions and attachments
- board refs and placement
- timeline modeling

That is intentional. It avoids a temporary viewer-only implementation that would have to be replaced immediately.

## Delivery Model

Run this roadmap in ordered streams.

Recommended order:

1. Canonical rail shell and shared interaction contract
2. First-class `Key Findings` contract and persistence
3. Artifact viewer and report details rebuild
4. Actionable nested-item parity across Board, Chat, Timeline, and Network
5. Typography, state, motion, and overlay closeout

Parallel lanes are fine only where write scopes are clearly disjoint.

## Validation Standard

Default expectation per stream:

- `npm run lint`
- `npm run typecheck`
- the most relevant targeted test command(s)
- `npm run build` when shared UI contracts, shipped app behavior, or persistence/search contracts change

Do not default to the full Vitest suite unless the work becomes cross-cutting enough that targeted coverage would be misleading.

## Stream 1. Canonical Rail Shell And Shared Interaction Contract

Purpose:

- define one rail-shell contract for left and right panels
- normalize header anatomy, action placement, and section behavior
- make the pinned-bottom single-open-section interaction the default

### Scope

Primary targets:

- `src/components/ui/Accordion.tsx`
- `src/components/ui/InspectorActionRow.tsx`
- `src/components/ui/chrome.ts`
- `src/components/features/Chat/ChatContextRail.tsx`
- `src/components/features/Timeline/TimelineDossierPanel.tsx`
- `src/components/features/Timeline/TimelineDetailRail.tsx`
- `src/components/features/WorkspaceBoard/BoardLibraryRail.tsx`
- `src/components/features/WorkspaceBoard/BoardInspectorRail.tsx`
- `src/components/features/OperationView/InspectorPanel.tsx`
- `src/components/features/NetworkGraph/NodeInspector.tsx`

Execution shape:

- extract the canonical rail anatomy from the strongest existing surfaces rather than inventing a new shell in isolation
- make one-open top-level behavior the default rail rule
- keep the Board library richer in nested behavior, but not structurally divergent

### Execution Checklist

1. Define canonical left-rail and right-rail header anatomy.
2. Standardize eyebrow copy to `Library`, `Details`, `Context`, or `Inspector`.
3. Move shared action rows directly beneath the header across affected rails.
4. Make the expanded section flex into the remaining vertical space and scroll inline.
5. Fix the Board library top-scroll issue so the rail feels as crisp as the Chat context panel.
6. Remove unnecessary header icons and repeated context nouns where the title already carries context.
7. Apply the canonical item hover and active treatment to meaningful panel items where the shell work already touches them.
8. Keep neutral surface states and accent action states distinct while landing shared rail and panel primitives.

Exit criteria:

- major rails share the same shell behavior
- headers use the simplified vocabulary consistently
- expanded sections feel pinned and clean instead of causing full-rail scroll drift

Docs to update on landing if primitives change materially:

- `docs/operations/ARCHITECTURE.md`

## Stream 2. First-Class Key Findings Contract And Persistence

Purpose:

- implement `Key Findings` as a first-class structured concept end to end
- avoid redundant report-viewer work built on temporary data
- use the existing Artifact, Board, Chat, Timeline, and workspace-discovery systems rather than inventing a temporary side path

### Scope

Primary targets:

- `src/types/index.ts`
- `src/domain/artifacts.ts`
- `src/services/providers/types.ts`
- `src/services/providers/shared/prompts.ts`
- `src/services/providers/shared/artifactContract.ts`
- provider-specific structured schemas such as `src/services/providers/geminiProvider.ts`
- `src/services/db/schema.ts`
- `src/services/db/migrations.ts`
- `src/services/db/migrations_sql.ts`
- `src/services/db/repositories/WorkspaceRepository.ts`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `src/services/workspace/library.ts`
- `src/services/workspace/workspaceHandoffs.ts`
- `src/services/chat/mentions.ts`
- `src/components/ui/omniboxMentions.ts`
- `src/services/chat/launchContext.ts`
- `src/services/chat/runtime.ts`
- `src/services/workspace/boardShapes.ts`
- relevant Board and Timeline types if new ref kinds or event types are introduced

Recommended implementation assumption:

- use a dedicated findings table or equivalent dedicated storage shape rather than hiding findings inside generic section JSON
- keep `KEY_FINDINGS` sections as a presentation of canonical finding records, not the source of truth

### Workstream A. Canonical Finding Type

Goal:

- define one finding shape that all product surfaces can share

Tasks:

1. Add a canonical `KeyFinding` type with stable ids and structured fields.
2. Define the minimum contract:
   - `id`
   - origin artifact linkage
   - `title`
   - `summary` or body
   - optional evidence refs
   - optional source refs
   - optional metadata or tags
   - sort order
3. Add `keyFindings` to `Artifact`.
4. Define the relationship between canonical findings and `KEY_FINDINGS` sections.
5. Decide whether `agendas` becomes anomaly-only after the cutover or remains a migration bridge temporarily.

### Workstream B. Provider Output And Normalization

Goal:

- request and normalize dedicated findings from model output

Tasks:

1. Add `keyFindings` to `StructuredArtifactPayload`.
2. Update prompt instructions so findings are requested separately from anomalies and follow-ups.
3. Update provider-specific structured schemas to validate findings.
4. Normalize findings alongside entities, follow-ups, evidence, and sections.
5. Update provider contract tests so findings are no longer only implied by `KEY_FINDINGS` sections or `agendas`.

### Workstream C. Persistence And Repository Hydration

Goal:

- preserve findings as findings across save and load cycles

Tasks:

1. Add a dedicated finding persistence shape.
2. Persist findings with origin artifact linkage and supporting refs.
3. Rehydrate findings as first-class records when loading artifacts.
4. Keep report section generation in sync with canonical finding records.
5. Land migrations and repository tests for create, load, update, and fallback behavior.

### Workstream D. Workspace Discovery, Search, And Mentions

Goal:

- make findings addressable in discovery flows rather than only generic section search

Tasks:

1. Decide whether findings become library entries, mention candidates, or both.
2. Extend the relevant enums and result builders if findings are directly addressable.
3. Index finding title and body separately from generic section content.
4. Preserve origin artifact linkage and section context in search results.
5. If findings are mentionable, add mention mapping into chat context snippets.

### Workstream E. Board, Chat, And Timeline Integration

Goal:

- make findings genuinely reusable across the main product surfaces

Tasks:

1. Decide whether findings get their own canonical ref kind or travel as artifact-linked child refs.
2. Extend board placement and rendering if findings can be placed directly.
3. Extend chat attachment or context typing if findings can be pinned directly.
4. Extend launch-context behavior if chat can open from a finding.
5. Define timeline treatment:
   - finding-specific events
   - or artifact events enriched with finding summaries and drill-ins
6. Keep provenance back to the origin artifact and supporting evidence explicit.

### Execution Checklist

1. Land the canonical `KeyFinding` type and artifact contract.
2. Update provider payloads, prompts, and schemas.
3. Implement dedicated finding persistence and hydration.
4. Update search, mentions, and workspace discovery behavior.
5. Integrate findings into Board, Chat, and Timeline behavior.
6. Update docs and targeted tests.

Exit criteria:

- findings have one canonical structured contract
- save/load cycles preserve findings as findings
- report, search, Board, Chat, and Timeline all read from the same contract where relevant
- no viewer-only approximation remains

Docs to update on landing:

- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/ARCHITECTURE.md`

## Stream 3. Artifact Viewer And Report Details Rebuild

Purpose:

- rebuild the Artifact viewer around a document-first reading experience
- use the new first-class findings contract rather than local reconstruction
- align the report details rail with the shared rail language

Dependency:

- final `Key Findings` viewer wiring should land after Stream 2 establishes the canonical findings contract

### Scope

Primary targets:

- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/OperationView/artifactViewerPresentation.ts`
- `src/components/features/OperationView/ArtifactViewer.test.tsx`

Execution shape:

- remove summary-card clutter from the main report body
- render document sections from canonical artifact data
- keep panels for scanning and actions, not for carrying the report’s main substance

### Execution Checklist

1. Remove the current reading-pattern/top-summary block.
2. Rebuild the main column around substantive document sections and editing affordances.
3. Render a dedicated `Key Findings` section near the top from canonical finding records.
4. Keep findings in the details rail and give them the canonical item hover treatment.
5. Normalize follow-up question rows to one shared pattern.
6. Restyle entities as a two-column layout using library-like structure plus the details-panel dot treatment.
7. Restyle sources and provenance rows to use the lighter viewer-library text treatment.
8. Prefer chips and inline links over miniature summary cards in the main document body.
9. Preserve section-level editability and evidence jump affordances.

Exit criteria:

- the report reads like a clear, professional, editable document
- findings are visible as a distinct report section in the document and in the details rail
- follow-ups, entities, and provenance feel like one family instead of separate local patterns

## Stream 4. Actionable Nested-Item Parity Across Board, Chat, Timeline, And Network

Purpose:

- reuse the strongest actionable nested-item patterns across context-rich surfaces
- bring Board, Chat, Timeline, and Network closer together without flattening legitimate differences

### Scope

Primary targets:

- `src/components/features/WorkspaceBoard/BoardLibraryRail.tsx`
- `src/components/features/WorkspaceBoard/BoardInspectorRail.tsx`
- `src/components/features/Chat/ChatContextRail.tsx`
- relevant session and history-side panel components under `src/components/features/Chat/*`
- `src/components/features/Timeline/TimelineDossierPanel.tsx`
- `src/components/features/Timeline/TimelineDetailRail.tsx`
- `src/components/features/NetworkGraph/NodeInspector.tsx`
- `src/components/features/OperationView/InspectorPanel.tsx`

Execution shape:

- use Board library nested item anatomy as the canonical pattern for context-rich actionable rows
- keep Board library richer where it needs to be
- align Chat context/history and other actionable side panels to that same family

### Execution Checklist

1. Treat Board library nested item rows as the canonical pattern for actionable contextual items.
2. Update Chat context items so they share the same layout, spacing, fonts, and button language.
3. Replace ad hoc action-button styling such as `Summary` and `Full Text` controls with the same family as `Add To Board` while keeping surface-specific labels.
4. Apply the same nested info pattern to session and signal surfaces where those rows are actionable and context-rich.
5. Align Timeline and Network inspector rows with the shared item contract where they currently diverge.
6. Integrate first-class findings into the relevant Board/Chat/Timeline panel patterns if Stream 2 made them directly addressable there.

Exit criteria:

- actionable context rows in Board, Chat, Timeline, and Network feel clearly related
- nested item actions are visually consistent without losing surface-specific meaning
- Board library remains rich, but not structurally off-contract

## Stream 5. Typography, State, Motion, And Overlay Closeout

Purpose:

- finish the interaction-language cleanup across the touched surfaces
- reduce inconsistency in typography, states, and motion without turning this into a redesign stream

### Scope

Primary targets:

- `src/index.css`
- `src/components/ui/Accordion.tsx`
- `src/components/ui/InspectorActionRow.tsx`
- touched panel-heavy surfaces across Artifact, Chat, Timeline, Board, and Network
- menu, popup, and modal surfaces where obvious inconsistencies remain

### Execution Checklist

1. Apply the canonical panel-item hover treatment wherever meaningful item rows still diverge.
2. Normalize the neutral surface hover treatment across navigational, structural, and selectable surfaces.
3. Normalize the accent action hover treatment across toolbar controls, launch actions, and panel-local execution controls.
4. Normalize section-title shadow treatment where appropriate.
5. Normalize sublabels, helper text, and provenance copy weight.
6. Reduce entrance and close motion to the smallest useful set.
7. Sweep obvious popup or menu outliers in border, radius, and hover behavior.
8. Preserve intentional exceptions such as destructive actions, toasts, badges, and entity-color semantics.

Exit criteria:

- hover, active, and selected states no longer feel fragmented
- neutral surface states and accent action states cover nearly all routine interaction feedback
- secondary copy reads from a small, intentional set of roles
- motion feels polished and restrained rather than decorative
- menus and popups align without unnecessary redesign

## Additional Structured-But-Underused Data To Track

While reviewing the active codebase for first-class findings, a few other structured data shapes stood out as being persisted or carried more richly than the product currently exploits.

These are follow-on candidates, not reasons to dilute the current findings stream.

### 1. Follow-up linkage metadata

Follow-ups already persist richer structure than the current UI exposes:

- `entityRefs`
- `sourceRefs`
- `originSectionId`
- `sourceSignalId`
- `resolvedByArtifactId`
- follow-up-level `metadata`

Most promising follow-on value:

- entity-linked follow-up drill-ins
- source-aware follow-up queues
- richer follow-up provenance and resolution UI

### 2. Evidence metadata

Evidence already has stable ids, kind, section linkage, tags, source attribution, and generic metadata.

Most promising follow-on value:

- richer evidence filtering
- stronger citation grouping and claim-support views
- better Board or Chat evidence pinning with typed metadata

### 3. Provenance metadata

Provenance already stores more than the current UI consistently uses:

- warnings
- citations
- request ids
- usage
- search metadata
- grounded versus inferred claim counts

Most promising follow-on value:

- stronger auditability
- better provider/search debugging flows
- clearer operator trust signals around evidence quality

### 4. Generic artifact metadata

Artifact metadata carries useful snapshot context such as pack and purpose names, workspace mode, and provider extras.

Recommendation:

- do not automatically promote generic artifact metadata into product features
- promote specific fields into typed contracts only when a concrete workflow depends on them

## Completion Standard

This roadmap is complete only when:

1. left and right rails use one clear shell contract
2. headers use the simplified panel-role eyebrow convention
3. action rows appear in one predictable place
4. top-level panel expansion behavior is pinned, clean, and single-open by default
5. the Artifact viewer reads like a document rather than a dashboard of small summaries
6. `Key Findings` is implemented as a first-class structured concept rather than presentation-only section text
7. findings are meaningfully surfaced in the report, details rail, and any downstream surfaces explicitly chosen by the finding contract
8. follow-ups, entities, provenance, sessions, and other actionable rows use consistent item anatomy
9. Board library remains rich where it should but no longer feels structurally off-contract
10. motion, popups, and overlays feel intentionally restrained and uniform

## Testing Expectations For The Findings Stream

At minimum, expect targeted coverage across:

- provider contract tests for parsing and normalization
- repository tests for persistence and hydration
- workspace search tests for finding retrieval
- mention and launch-context tests if findings become addressable in chat
- board handoff or placement tests if findings become placeable
- Artifact viewer tests proving the main report and the details rail both read from canonical findings
