# Sherlock UI Uniformity Roadmap

Date: 2026-04-08

Status: Historical Input Folded Into Active Plan

Active plan:

- `docs/plans/11-ui-uniformity-roadmap.md`

Current note:

- treat this report as historical input from the original April 8 review
- use `docs/plans/11-ui-uniformity-roadmap.md` as the rebased execution document after the canonical cleanup work landed

Related inputs:

- `docs/_legacy/reports/2026-04-08-codebase-audit.md`
- `docs/plans/10-canonical-cleanup-roadmap.md`
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

This document replaces the earlier audit framing for this file and turns the April 8 UI review into an execution-ready roadmap.

The goal is not a redesign pass. The goal is to make Sherlock read as one product family by:

- codifying the panel and rail patterns that already feel right
- applying those patterns consistently across Artifact, Chat, Timeline, Board, and Network surfaces
- improving the main report reading experience so reports feel like documents instead of fragmented snippets
- explicitly calling out where current data structures already support the desired UI and where they do not

## Product North Star

Sherlock should feel like one coherent workspace with one obvious panel language:

- left rails read as `Library`
- right rails read as `Details`, `Context`, or `Inspector`
- headers are simple and contextual, not repetitive
- action buttons sit in one predictable place
- only one expandable section is open at a time
- expanded sections pin cleanly to the bottom and scroll inline
- selectable items share one hover and active treatment
- the main report view reads like a serious editable document, not a dashboard of small cards

## Locked Product Decisions

These decisions are in scope for this roadmap and should be treated as the default contract unless a stream explicitly carves out an exception.

### 1. Header vocabulary and panel naming

- Eyebrow text should only identify the panel role: `Library`, `Details`, `Context`, or `Inspector`.
- Do not repeat `Project`, `Workspace`, `Timeline`, or similar nouns in the eyebrow.
- The title should carry the actual context: the workspace title, selected artifact title, selected event title, selected item title, and so on.
- Left-side rails standardize on `Library`.
- Right-side rails standardize on `Details`, `Context`, or `Inspector`, depending on the surface.
- Remove the icon from the Board library eyebrow and rename `Canonical Library` to `Library`.
- Network-side library/dossier surfaces should use the same eyebrow and title pattern and drop extra counter-row ceremony unless it adds real value.

### 2. Rail opening and scrolling behavior

- The default rail behavior is the current Chat context rail model.
- Only one top-level section should be open at a time.
- The open section should flex into the remaining vertical space.
- The bottom of the rail should stay pinned cleanly to the viewport.
- Only the open section body should scroll when content exceeds the available height.
- The rail itself should not create a second awkward scrollbar because an expanded section pushes past the page.
- The Board library rail is the main exception for nested content richness, but it still needs the same pinned-bottom behavior.

### 3. Action row placement and button language

- Cross-panel action buttons belong directly under the header, before the section stack.
- Those buttons should use the same light-outline, accent-on-hover language already used in toolbar-style controls and `InspectorActionRow`.
- Action rows should not drift into ad hoc placements inside individual sections unless the action is truly section-local.

### 4. Canonical item hover and active states

- The hover and active treatment used by the Artifact viewer details panel entity rows is the canonical pattern for selectable panel items.
- That treatment is a subtle shadow plus a very thin outline.
- Apply it to findings, follow-up questions, entities, context rows, history rows, and other meaningful panel items.
- Keep top-level section headers simpler; the more pronounced outlined treatment belongs to the items inside sections.

### 5. Typography rules

- Section titles should use the same simple shadow treatment everywhere it makes sense.
- Sources and provenance rows should use the lighter viewer-library style rather than a stronger section-label weight.
- Existing good system-specific exceptions stay in place: destructive states, toasts, accent badges, entity colors, and other already-orderly system cues.

### 6. Main report view direction

- Remove the current top summary or reading-pattern block from the main report view.
- Do not fill the main report page with small cards and small summary boxes.
- Keep the panels for compact summaries and quick jumps.
- The main report page should prioritize clear, readable, editable document sections with strong hierarchy and sensible spacing.
- Key findings should be treated as their own canonical report category.
- The main report should include a dedicated `Key Findings` section near the top of the document body.
- Key findings should remain available in the details rail as well, but the rail is secondary to the document.
- Key findings should be planned as first-class structured records, not just presentation-only section text.
- Follow-up questions should use one shared layout pattern.
- Entities should use a mixed pattern:
  - two-column library-style layout
  - dot marker treatment from the details panel instead of icon-heavy rows
- Use chips for internal item links where helpful and inline hyperlinks for sources where relevant.

### 7. Motion and overlays

- Motion should stay minimal and utilitarian.
- Prefer little or no text entrance motion.
- Use animation only where it helps opening, closing, cursor tracking, or orientation.
- Popups and modals are mostly in a good place already. This roadmap includes only a light consistency sweep there, not a redesign.

## Current Data-Flow Reality

The roadmap needs to distinguish between surfaces that are only visual cleanup and surfaces that imply a deeper product or persistence choice.

### Entities are already first-class

Entities already have meaningful downstream use:

- persisted as structured artifact data
- derived into workspace library entries in `src/services/workspace/library.ts`
- used by timeline event derivation in `src/components/features/Timeline/timelineEventBuilders.ts`
- used by graph and inspector flows across Operation View and Network Graph
- used in chat launch-context grounding in `src/services/chat/launchContext.ts`

Implication:

- entity UI work in this roadmap is mostly a presentation and interaction cleanup, not a data-model invention

### Follow-up questions are already first-class enough to standardize confidently

Follow-ups already have real product meaning:

- canonicalized in `src/domain/artifacts.ts`
- persisted through repository flows
- used for launch and follow-up run behavior
- surfaced in Artifact viewer flows as actionable items

Implication:

- follow-up questions should get one shared visual pattern across panels without waiting on new storage work

### Key findings are not first-class workspace objects today

Key findings and anomalies are currently much less structured as independent product objects:

- `ArtifactViewer.tsx` derives `visibleAnomalies` from `report.agendas` or section content
- `artifactViewerPresentation.ts` derives summary stats and reading highlights from sections, evidence, and provenance metadata
- key findings are not currently represented as standalone workspace library entries
- key findings are not independently promoted into board references, timeline milestone derivation, or chat context snippets

Implication:

- this is a real product gap, not just a viewer-layout issue
- the roadmap should close that gap by making key findings first-class structured records instead of leaving them as presentation-derived content
- implementation should update `docs/operations/DATA_PERSISTENCE.md` and `docs/operations/ARCHITECTURE.md` when the contract lands

### Accepted product decision for this roadmap

For this roadmap, key findings should become first-class structured records.

That means:

- give them their own explicit `Key Findings` section in the report reader
- keep them visible in the details rail
- define a canonical finding shape in active types and normalization code
- make them available to downstream product surfaces such as Board, Chat, Timeline, and workspace-level discovery flows through explicit rules
- avoid a stopgap presentation-only implementation that would need to be redone immediately after

### Product intent for first-class key findings

Key findings are important enough to deserve the same seriousness as other reusable workspace intelligence.

This contract should let Sherlock:

- render a stronger `Key Findings` section in the report without brittle presentation heuristics
- support deliberate use in Board, Chat, Timeline, and workspace discovery surfaces
- distinguish key findings from follow-up questions and from evidence rows cleanly
- keep report reading, retrieval, and action flows aligned around the same meaningful unit

## Roadmap Rules

1. Reuse and extend existing primitives before inventing new ones.
   Prefer building on `Accordion`, `InspectorActionRow`, `chrome.ts`, and existing typography helpers.

2. One rail contract unless explicitly exempted.
   Left and right rails can have different jobs, but they should share the same structural rules.

3. Report body is document-first.
   Panels can summarize. The main report page should carry the actual substance.

4. No accidental persistence changes.
   UI cleanup should not create new storage behavior implicitly.

5. Board Library keeps its richer nested content.
   It is an exception in interaction richness, not an excuse to diverge from the shell and scroll contract.

6. Motion is not a feature stream.
   Reduce inconsistency; do not add visual flourish.

7. First-class findings must be truly first-class.
   Do not ship a version where findings have a dedicated UI but still piggyback on `agendas`, generic `SECTION` snippets, or ad hoc metadata without a canonical contract.

## Codebase Reality And Implementation Constraints

The roadmap is viable against the current codebase, but the first-class findings work needs to respect a few real implementation seams.

### Existing strengths we can build on

- `ArtifactSectionKind` already includes `KEY_FINDINGS`.
- `buildArtifactSections()` in `src/domain/artifacts.ts` already has a dormant `findings?: string[]` input.
- the report viewer and section-ordering logic already understand `KEY_FINDINGS`
- workspace search already indexes artifact sections, so findings stored as sections can become discoverable snippets immediately
- evidence, follow-ups, entities, and artifact sections already have established normalization and persistence patterns we can mirror

### Current gaps that make findings non-first-class today

- `Artifact` in `src/types/index.ts` has no canonical `keyFindings` field
- `StructuredArtifactPayload` in `src/services/providers/types.ts` has no `keyFindings`
- prompt instructions in `src/services/providers/shared/prompts.ts` do not request a dedicated `keyFindings` array
- structured provider schemas such as the Gemini schema do not define `keyFindings`
- persistence in `src/services/db/schema.ts` has tables for follow-ups, sections, evidence, entities, and sources, but nothing dedicated to findings
- workspace library entries, board references, chat mention kinds, and chat attachment kinds have closed enums that do not include findings
- workspace handoff helpers only know how to route artifact, entity, signal, source, and workspace-item references
- timeline types do not currently have a finding-specific track or event type

### Consequence for the implementation plan

Because these enums and contracts are closed, first-class findings are not a one-file enhancement.

The work has to cut through:

- active types
- provider output contract
- domain shaping
- repository read and write behavior
- workspace discovery and search
- chat mentions and attachments
- board reference and placement types
- timeline modeling

That is still the right plan. It just means the roadmap should sequence the work as a real cross-system stream rather than a report-viewer enhancement.

## Stream 1. Canonical Rail Shell Contract

Purpose:

- define the shared left-rail and right-rail shell contract
- unify header vocabulary and action placement
- standardize the pinned-bottom single-open-section behavior

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

Execution checklist:

1. Define canonical left-rail and right-rail header anatomy.
2. Standardize eyebrow copy to `Library`, `Details`, `Context`, or `Inspector`.
3. Move shared action rows directly beneath the header across affected rails.
4. Make one-open-at-a-time section behavior the default for rail stacks.
5. Make the expanded section flex into remaining height and scroll inline.
6. Fix the top-scroll issues so the rails feels as crisp as the Chat context panel.
7. Remove unnecessary header icons or extra label clutter where the panel role is already obvious.

Exit criteria:

- major rails share the same shell behavior
- header copy is simplified and consistent
- expanded sections feel pinned and clean instead of causing full-rail scroll drift

## Stream 2. Artifact Viewer And Report Details Overhaul

Purpose:

- turn the main report into a readable document
- align the report details rail with the rest of the panel language
- surface key findings as a real report category backed by the new first-class finding contract

Primary targets:

- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/OperationView/artifactViewerPresentation.ts`
- `src/components/features/OperationView/ArtifactViewer.test.tsx`

Dependency note:

- Final viewer wiring for `Key Findings` should land after the canonical findings contract from Stream 2A is in place.
- Temporary viewer-only shaping should be avoided.

Execution checklist:

1. Remove the current top summary or reading-pattern block from the main report view.
2. Rebuild the main column around substantive document sections and editing affordances.
3. Add a dedicated `Key Findings` section near the top of the main report body.
4. Keep key findings in the details rail and give them the canonical item hover treatment.
5. Normalize all follow-up question rows to one shared card or row pattern.
6. Restyle entities as a two-column layout that borrows the library structure while keeping the dot marker from the details rail.
7. Restyle sources and provenance rows to use the lighter viewer-library font treatment.
8. Prefer chips and inline links over miniature summary cards in the main document body.
9. Preserve section-level editability and evidence jump affordances.

Exit criteria:

- the report page reads like a clear, professional, editable document
- key findings are visible as a distinct report section in the main document and in the details rail
- follow-ups, entities, and provenance feel like one family instead of three different local patterns

## Stream 2A. Key Findings First-Class Implementation

Purpose:

- implement key findings as first-class structured records end to end
- avoid redundant viewer-only work that would need to be replaced immediately after
- use the existing artifact, workspace, board, chat, and timeline systems rather than inventing a temporary halfway layer

Primary targets:

- `src/types/*`
- artifact domain and provider normalization contracts
- persistence and repository layers for the dedicated finding storage shape
- workspace library and discovery flows
- chat launch and retrieval context shaping
- timeline derivation
- board placement and inspector flows
- artifact presentation modules under `src/components/features/OperationView/*`

Recommended sequencing:

1. contract and types
2. provider payload and normalization
3. persistence and repository hydration
4. workspace discovery and handoff integration
5. report viewer and panel rendering
6. board, chat, and timeline integration
7. docs and focused regression coverage

Detailed workstreams:

### Workstream A. Canonical Finding Contract

Goal:

- define one finding shape that the rest of the system can share

Primary files:

- `src/types/index.ts`
- `src/domain/artifacts.ts`
- any artifact helper modules that derive or reconcile sections and summary fields

Tasks:

1. Add a canonical `KeyFinding` type with stable ids and structured fields.
2. Decide the minimum required fields:
   - `id`
   - `artifactId` or origin reference
   - `title`
   - `summary` or body
   - optional evidence refs
   - optional source refs
   - optional tags or tone metadata
   - sort order
3. Add `keyFindings` to `Artifact`.
4. Define how `keyFindings` and `KEY_FINDINGS` sections relate:
   - `keyFindings` is the source of truth
   - `KEY_FINDINGS` section becomes a presentation of that source
5. Define whether legacy `agendas` remains anomaly-only after this stream or continues as a fallback bridge during migration.

Acceptance criteria:

- there is one source-of-truth finding shape
- report rendering no longer has to infer findings from anomaly-oriented fields

### Workstream B. Provider Output And Normalization

Goal:

- make findings part of the active AI output contract instead of a viewer-side reconstruction

Primary files:

- `src/services/providers/types.ts`
- `src/services/providers/shared/prompts.ts`
- `src/services/providers/shared/artifactContract.ts`
- provider-specific schema implementations such as `src/services/providers/geminiProvider.ts`
- provider contract tests

Tasks:

1. Add `keyFindings` to `StructuredArtifactPayload`.
2. Update the structured JSON prompt contract to request dedicated findings separately from anomalies and follow-ups.
3. Update provider-specific structured schemas so findings are accepted and validated.
4. Normalize `keyFindings` alongside `entities`, `followUps`, `evidence`, and `sections`.
5. Update adapter and contract tests so findings are no longer implicit in `agendas` or section-only output.

Acceptance criteria:

- provider output can produce dedicated findings directly
- normalization produces canonical structured findings even when provider section output varies

### Workstream C. Persistence And Repository Hydration

Goal:

- make findings survive save/load cycles without collapsing back into generic section items

Primary files:

- `src/services/db/schema.ts`
- `src/services/db/migrations.ts`
- `src/services/db/migrations_sql.ts`
- `src/services/db/repositories/WorkspaceRepository.ts`
- repository tests

Tasks:

1. Choose the persistence model:
   - dedicated findings table
   - or structured JSON persisted as artifact subrecords
2. Prefer a dedicated table if findings need stable ids, refs, ordering, and cross-surface retrieval hooks.
3. Persist findings with origin artifact linkage and any evidence/source refs needed for downstream use.
4. Rehydrate findings as first-class records when loading artifacts.
5. Keep `KEY_FINDINGS` report section generation in sync with persisted findings.
6. Add migrations and repository tests for create, load, update, and fallback behavior.

Acceptance criteria:

- saving and reloading an artifact preserves findings as findings
- viewer code is not the place where findings become structured

### Workstream D. Workspace Discovery, Search, And Mentions

Goal:

- let findings participate in workspace discovery as real records rather than only generic section snippets

Primary files:

- `src/services/workspace/library.ts`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `src/components/ui/omniboxMentions.ts`
- `src/services/chat/mentions.ts`
- any search-result or mention rendering helpers

Tasks:

1. Decide whether findings appear as library entries, mention candidates, or both.
2. Extend the relevant enums and result builders if findings should be directly addressable.
3. Index finding title and body separately from generic section content in workspace search.
4. Ensure finding search results preserve origin artifact linkage and section context.
5. If mentionable, add findings to omnibox mention candidates and mention-to-context mapping.

Acceptance criteria:

- findings are discoverable through explicit finding-aware paths
- search and mentions no longer treat them as anonymous section text

### Workstream E. Board, Chat, And Timeline Integration

Goal:

- make findings genuinely reusable across the product surfaces that matter most

Primary files:

- `src/services/workspace/workspaceHandoffs.ts`
- `src/services/workspace/boardShapes.ts`
- `src/components/features/WorkspaceBoard/*`
- `src/services/chat/launchContext.ts`
- `src/services/chat/runtime.ts`
- `src/components/features/Chat/*`
- `src/components/features/Timeline/*`
- any affected types for attachment kinds, mention kinds, ref kinds, tracks, or event types

Tasks:

1. Decide whether findings get their own canonical ref kind or travel as artifact-linked child refs.
2. Extend board placement and rendering if findings can be placed directly.
3. Extend chat attachment or context-snippet typing if findings can be pinned directly.
4. Extend launch-context behavior if a chat can start from a finding rather than only an artifact, entity, signal, or workspace item.
5. Decide timeline treatment:
   - finding-specific events
   - or artifact events enriched with finding summaries and drill-ins
6. Keep provenance back to the origin artifact and any supporting evidence explicit.

Acceptance criteria:

- Board, Chat, and Timeline all consume findings through the same contract
- findings do not become three different pseudo-objects depending on surface

### Workstream F. Report Viewer, Panels, And Editing

Goal:

- make the viewer consume the new contract cleanly instead of deriving findings locally

Primary files:

- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/OperationView/artifactViewerPresentation.ts`
- related tests

Tasks:

1. Render the main `Key Findings` section from canonical finding records.
2. Render the details-rail findings list from the same source.
3. Preserve the dedicated top-of-report placement and panel-level quick scanning.
4. Decide whether findings are directly editable in the viewer and how that maps back to persistence.
5. Keep evidence jumps and inline source links coherent with the new finding structure.

Acceptance criteria:

- viewer logic reads from the finding contract rather than reconstructing it
- the document view and details rail stay in parity

Execution checklist:

1. Define a canonical `KeyFinding` shape and naming contract in active types and domain helpers.
2. Define how key findings are generated and normalized from provider output and report sections.
3. Decide the persistence shape:
   - structured artifact subrecords
   - or separate persisted finding records linked to artifacts
4. Make key findings render as a dedicated report section and details-rail section from the same structured source.
5. Define how key findings appear in workspace discovery flows such as library, mentions, or pinned context, where appropriate.
6. Define Board behavior for findings:
   - whether they can be placed directly
   - what the displayed card shape is
   - what provenance and back-links they carry
7. Define Timeline behavior for findings:
   - whether they create finding-focused events
   - or whether they enrich artifact events and drill-in context
8. Define Chat behavior for findings:
   - whether they can be pinned directly
   - how they appear in launch context and retrieval summaries
9. Update `docs/operations/DATA_PERSISTENCE.md` and `docs/operations/ARCHITECTURE.md` when the contract lands.
10. Do not implement a temporary viewer-only approximation in parallel.

Testing expectations:

- provider contract tests for parsing and normalization
- repository tests for persistence and hydration
- workspace search tests for finding retrieval
- mention and launch-context tests if findings become addressable in chat
- board handoff or placement tests if findings become placeable
- artifact viewer tests proving the report and rail both read from canonical findings

Exit criteria:

- key findings have one canonical structured contract
- report, details rail, Board, Chat, Timeline, and workspace discovery flows all read from that contract where relevant
- implementation teams are not doing redundant temporary work for a viewer-only version

## Stream 3. Actionable Nested Item Pattern Across Board, Chat, Sessions, And Signals

Purpose:

- reuse the strongest actionable nested item pattern across surfaces that need context plus actions
- bring Chat context and history closer to the Board library interaction model

Primary targets:

- `src/components/features/WorkspaceBoard/BoardLibraryRail.tsx`
- `src/components/features/Chat/ChatContextRail.tsx`
- Chat history and session-side panel components touched by `src/components/features/Chat/*`
- any signal or session panel rows that currently use thinner one-off item anatomy

Execution checklist:

1. Treat the Board library nested artifact rows as the canonical pattern for actionable contextual items.
2. Update Chat context items so they share the same layout, spacing, fonts, and button language.
3. Replace ad hoc `Summary` and `Full Text` button styling with the same visual family as `Add To Board`, while keeping action labels specific to the surface.
4. Apply the same nested info pattern to sessions and signals where those rows are actionable and context-rich.
5. Keep the Board library's richer details and add-to-board flow intact rather than flattening it into the simpler rail style.

Exit criteria:

- actionable context rows in Board and Chat feel clearly related
- sessions and signals no longer look like a separate micro-system
- nested item actions are visually consistent without losing surface-specific meaning

## Stream 4. Cross-Surface State, Typography, And Control Sweep

Purpose:

- make similar controls feel equally interactive
- finish the typography and hover-state cleanup across panels

Primary targets:

- `src/index.css`
- `src/components/ui/Accordion.tsx`
- `src/components/ui/InspectorActionRow.tsx`
- panel-heavy surfaces across Operation View, Timeline, Chat, Board, and Network

Execution checklist:

1. Apply the report-details entity hover treatment to selectable panel items across the app.
2. Normalize section-title shadow treatment where appropriate.
3. Normalize sublabels, helper text, and provenance copy weight.
4. Bring remaining buttons, selectors, and panel-local controls into the existing subtle accent system.
5. Preserve intentional exceptions such as destructive actions, toasts, system badges, and entity-color semantics.

Exit criteria:

- hover, active, and selected states no longer feel fragmented
- secondary copy reads from one small set of weights and roles
- panel controls feel like one product family

## Stream 5. Motion, Popup, And Modal Consistency Sweep

Purpose:

- reduce visual noise from inconsistent motion and overlay behavior
- keep the current polished feel without adding flourish

Primary targets:

- overlay, menu, popup, and modal surfaces touched by `src/components/ui/*` and relevant feature menus

Execution checklist:

1. Reduce entrance and close motion to the minimal set needed for orientation.
2. Remove overly fancy text or panel motion where it distracts from reading.
3. Sweep obvious popup or menu outliers in border, radius, or hover behavior.
4. Leave already-good modal and popup surfaces mostly intact.

Exit criteria:

- motion feels clean and polished rather than theatrical
- menus and popups align without forcing a redesign of already-good overlays

## Validation Standard

For implementation work on this roadmap, use the narrowest credible validation for the touched slice:

- `npm run lint`
- `npm run typecheck`
- the most relevant targeted test command(s)
- `npm run build` when shipped UI behavior, routing, shared UI primitives, or layout contracts change

Do not default to the full Vitest suite unless the work becomes cross-cutting enough that targeted validation would be misleading.

## Completion Standard

This roadmap is complete when:

- left and right rails use one clear shell contract
- headers use the simplified panel-role eyebrow convention
- action rows appear in one predictable place
- top-level panel expansion behavior is pinned, clean, and single-open by default
- Artifact viewer reads like a document rather than a dashboard of small summaries
- key findings are meaningfully surfaced in both the main report and the report details rail
- key findings are implemented as a first-class structured concept rather than a presentation-only section
- follow-ups, entities, provenance, sessions, and other actionable rows use consistent item anatomy
- Board library remains rich where it should, but no longer feels structurally off-contract
- motion, popups, and modals feel intentionally restrained and uniform

## Tradeoff We Are Accepting

This roadmap deliberately chooses the larger, cleaner implementation over a smaller presentation-only shortcut.

That means:

- more up-front scope now
- clearer reusable behavior later
- less redundant refactoring
- lower risk of the report reader, Board, Chat, and Timeline drifting into incompatible interpretations of what a key finding is

## Additional Structured-But-Underused Data To Track

While reviewing the active codebase for first-class findings, a few other data shapes stood out as being persisted or carried structurally, but not yet fully utilized across the product.

These are not in the same priority tier as `Key Findings`, but they should stay visible as likely follow-on candidates.

### 1. Follow-up link metadata is stronger than the current UI suggests

Follow-ups already persist richer structure than the product currently exposes:

- `entityRefs`
- `sourceRefs`
- `originSectionId`
- `sourceSignalId`
- `resolvedByArtifactId`
- follow-up-level `metadata`

Current reality:

- `sourceSignalId` and `resolvedByArtifactId` have meaningful lineage usage today
- `entityRefs`, `sourceRefs`, and most follow-up metadata appear to be stored more faithfully than they are consumed

Potential follow-on value:

- entity-linked follow-up drill-ins
- source-aware follow-up queues
- richer follow-up resolution and provenance UI
- better Board and Chat context for follow-up actions

### 2. Evidence metadata is preserved but lightly exploited

Artifact evidence already has a good first-class shell:

- stable ids
- kind
- section linkage
- source title and URL
- tags
- generic `metadata`

Current reality:

- the product meaningfully uses evidence title, summary, source attribution, and section linkage
- generic evidence metadata is mostly preserved rather than actively driving UI or workflow behavior

Potential follow-on value:

- richer evidence filtering
- stronger citation grouping and claim support views
- better Board or Chat evidence pinning with typed metadata

### 3. Provenance metadata is only partially surfaced

Artifact provenance already stores more than the current UI consistently uses:

- warnings
- citations
- request id
- usage
- search metadata
- provenance metadata such as grounded versus inferred claim counts

Current reality:

- warnings and web-search count are surfaced in the viewer
- grounded versus inferred counts are used in the viewer summary logic
- request ids, usage details, and search-config specifics are mostly stored rather than operationalized in product flows

Potential follow-on value:

- stronger auditability and run-inspection UX
- better debugging of provider behavior and search configuration
- more explicit operator trust signals around evidence quality and search posture

### 4. Artifact metadata contains useful snapshot context, but much of it is not a product primitive

Artifact metadata currently carries fields such as:

- `packName`
- `purposeName`
- `workspaceMode`
- warnings and provider-side extras

Current reality:

- some of this is lightly consumed
- much of it behaves more like preserved run snapshot context than a first-class reusable product object

Recommendation:

- do not automatically promote generic artifact metadata into product features
- prefer promoting specific fields into typed contracts when a clear workflow depends on them

### Prioritization note

After `Key Findings`, the most promising structured follow-on candidates appear to be:

1. richer follow-up linkage via `entityRefs` and `sourceRefs`
2. typed evidence metadata usage
3. more deliberate provenance inspection and audit surfaces

These should be treated as explicit future streams if they become product priorities, not as incidental spillover during the findings implementation.
