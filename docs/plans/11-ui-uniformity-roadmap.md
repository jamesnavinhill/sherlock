# UI Uniformity Roadmap

Date: April 8, 2026

Status: Active (Rebased Against Current Codebase)

Related inputs:

- `docs/reports/2026-04-08-ui-uniformity-report.md`
- `docs/reports/2026-04-08-canonical-cleanup-audit.md`
- `docs/plans/10-canonical-cleanup-roadmap.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/OperationView/artifactViewerPresentation.ts`
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
- `src/services/providers/shared/artifactContract.ts`
- `src/services/providers/shared/prompts.ts`
- `src/services/db/schema.ts`
- `src/services/db/repositories/WorkspaceRepository.ts`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `src/services/workspace/library.ts`
- `src/services/workspace/workspaceHandoffs.ts`
- `src/services/chat/mentions.ts`
- `src/index.css`

## Intent

This roadmap started as an execution plan for the April 8 UI uniformity report.

It is now rebased against the active codebase after the major cleanup and extraction work that landed under `docs/plans/10-canonical-cleanup-roadmap.md`.

This is still not a redesign stream.

It is a product-and-code cleanup plan to:

- make Sherlock's left rails, right rails, and panel sections behave like one system
- rebuild the Artifact viewer around a document-first reading experience
- finish the interaction-language cleanup across Board, Chat, Timeline, Network, and Artifact surfaces
- decide and implement whether `Key Findings` becomes a truly first-class reusable object across the product
- do the above with clean cutovers rather than indefinite compatibility-era UI shims

## Current Codebase Assessment

The original roadmap is now stale in two directions:

- some of the April 8 structural cleanup it depended on has since landed
- several of the UI and product-contract decisions still have not

### What has improved since the original report

- surface decomposition is materially healthier: Board, Chat, Timeline, Operation View, and Network all have more isolated rail/panel components than they did when the report was written
- shared primitives already exist for some of the desired convergence:
  - `Accordion`
  - `InspectorActionRow`
  - `chrome.ts`
- follow-ups are already canonical enough to standardize confidently:
  - `src/domain/artifacts.ts` builds canonical follow-up objects
  - `src/services/db/schema.ts` persists them in `follow_ups`
  - `src/services/db/repositories/WorkspaceRepository.ts` hydrates them
- the Artifact system already understands `KEY_FINDINGS` as a section kind:
  - `ArtifactSectionKind` includes `KEY_FINDINGS`
  - `buildArtifactSections()` can synthesize a `KEY_FINDINGS` section
  - viewer ordering logic already places `KEY_FINDINGS` intentionally
- workspace search already indexes section content, so findings can already appear as generic section-backed retrieval snippets even though they are not first-class objects

### What still does not satisfy the roadmap

#### 1. Rail vocabulary and shell behavior are still inconsistent

Examples in active code:

- `BoardLibraryRail.tsx` still uses `Canonical Library` plus an icon-heavy eyebrow
- `TimelineDossierPanel.tsx` still uses `Timeline Dossier` instead of `Library`
- `TimelineDetailRail.tsx` still uses `Event Details` instead of the simplified role vocabulary
- `ChatContextRail.tsx` has the cleanest pinned-bottom shell behavior, but its header anatomy is not yet the shared primitive for the other rails
- `InspectorPanel.tsx` and `NodeInspector.tsx` still use bespoke inspector layouts rather than one obvious right-rail contract

#### 2. Action and row styling still split by surface

Examples in active code:

- `InspectorActionRow.tsx` is icon-only and reads differently from the text-forward Board and Chat action buttons
- `ChatContextRail.tsx` still uses ad hoc inline `Summary` and `Full Text` buttons
- `BoardLibraryRail.tsx` and `BoardInspectorRail.tsx` rely on `osint-button-primary` in places where the roadmap calls for one shared light-outline action language
- `Accordion.tsx` still carries a single generic header treatment rather than a clear split between top-level section headers and meaningful selectable item rows

#### 3. The Artifact viewer is still only partially aligned with the document-first direction

Examples in active code:

- `artifactViewerPresentation.ts` still builds `readingHighlights`
- `ArtifactViewer.tsx` still renders a top reading-pattern / summary treatment
- `ArtifactViewer.tsx` still derives `visibleAnomalies` from `report.agendas` or generic section items
- `KEY_FINDINGS`, `ANOMALIES`, and related sections still render in small card-like grids instead of a stronger document section pattern

#### 4. `Key Findings` is still not first-class

The current codebase is even clearer on this point than the original roadmap:

- `Artifact` still has no canonical `keyFindings` field
- `StructuredArtifactPayload` still has no `keyFindings`
- prompt instructions still request `agendas`, `leads`, and `followUps`, not a dedicated findings array
- provider schemas still validate the old payload shape
- persistence still has tables for sections, evidence, and follow-ups, but no findings table
- workspace library, board refs, chat mentions, chat attachments, and launch handoffs still do not have finding-aware enums or builders

### Rebased stream status

1. Canonical rail shell and shared interaction contract: Partially landed foundations, not complete.
2. First-class `Key Findings` contract and persistence: Not landed.
3. Artifact viewer and report-details rebuild: Foundations only, not landed.
4. Actionable nested-item parity across Board, Chat, Timeline, and Network: Partial local improvements, not landed.
5. Typography, state, motion, and overlay closeout: Foundations only, not landed.

## Product North Star

By the end of this roadmap, Sherlock should feel like one coherent workspace:

- left rails read as `Library`
- right rails read as `Details`, `Context`, or `Inspector`
- headers are simple and contextual rather than repetitive
- action rows live in one predictable location
- top-level rail sections follow one open/scroll contract
- meaningful item rows share one neutral browse/select treatment
- action controls share one accent action treatment
- the Artifact viewer reads like a serious editable document rather than a grid of summary cards
- `Key Findings` has one deliberate product contract instead of being reconstructed from sections or anomaly lists

## Locked Decisions

These are still the baseline unless a later doc explicitly revises them.

### 1. Header vocabulary

- Eyebrow text identifies only the panel role: `Library`, `Details`, `Context`, or `Inspector`.
- Do not repeat `Workspace`, `Board`, `Timeline`, `Project`, or similar nouns in the eyebrow.
- The title carries the actual subject: workspace title, selected artifact title, selected event title, selected item title, and so on.
- Left rails standardize on `Library`.
- Right rails standardize on `Details`, `Context`, or `Inspector`.

### 2. Rail open and scroll behavior

- The Chat context rail remains the canonical shell model.
- One top-level section is open at a time by default.
- The open section flexes into the remaining rail height.
- Only the open section body scrolls when needed.
- The rail container itself should not become the awkward second scrollbar.
- The Board library may keep richer nested rows, but it does not get to keep a divergent shell contract.

Implementation clarification:

- Treat the expanded section as pinned cleanly to the bottom edge of the rail, with the collapsed sections above it.
- The open section owns the inline scroll region; the overall rail should stay visually locked and crisp.
- This pinned-bottom behavior is the standard for all rails, including Board, Chat, Timeline, Network, and viewer-side detail panels.
- The Board library keeps its richer dropdown/info anatomy, but its expanded section still needs to stop cleanly within the rail instead of pushing the top area into a second scrollbar.

### 3. Interaction-state split

- Neutral surface treatment is the default browse-and-select language.
- Accent action treatment is the default do-and-launch language.
- These two families should cover almost all routine hover, active, and selected states.
- Exceptions should stay explicit and rare.

Implementation clarification:

- Top-level section items use the neutral browse/select family.
- Action buttons, launch buttons, and mode toggles use the accent action family.
- Section item hover/active states should inherit the same accent-system treatment already used in header/toolbar controls.
- Existing approved exceptions remain: destructive actions, toasts, accent-system badges, entity colors, and other already-systematized semantic states.

### 4. Header anatomy

- Eyebrows should be plain text only and should not carry decorative icons.
- The eyebrow should identify only the panel role, not the surface or parent object.
- The title should carry the meaningful subject: the workspace name, selected artifact title, selected entity, selected event, and so on.
- For now, keep the language simple and literal:
  - left-side rails: `Library`
  - right-side rails: `Details`, `Context`, or `Inspector`
- Remove labels such as `Canonical Library`, `Timeline Dossier`, `Workspace Context`, and similar compound headers.
- Specifically remove the icon from the current canvas/canonical library eyebrow and collapse that label to `Library`.

### 5. Action-row placement

- Panel-level actions should sit directly beneath the header, above the accordion/section stack.
- These actions should use the same visual language as header/toolbar controls:
  - light outline by default
  - accent hover state
  - accent active/selected state
- Do not bury primary panel actions inside lower sections when they are panel-scoped controls.

### 6. Main report direction

- Remove the current top summary / reading-pattern block from the main report view.
- Keep panels for scanning and actions.
- Put the report's actual substance in the main document column.
- `Key Findings` belongs near the top of the document body.
- Findings should also remain visible in the details rail.

### 7. Clean cutovers over indefinite bridges

- Do not ship a viewer-only `Key Findings` feature that still depends on `agendas`, generic `SECTION` snippets, or arbitrary metadata blobs as the real source of truth.
- Do not introduce long-lived UI compatibility shims just to preserve old local panel behavior.
- If a temporary bridge is required, it needs explicit removal criteria in this roadmap.

## Panel-Specific Target Clarifications

These targets further specify the streams below and should be treated as implementation criteria, not optional design ideas.

### 1. Artifact details and `Key Findings`

- The Artifact details rail becomes the canonical pattern for report-side detail presentation.
- `Key Findings` in the details rail should follow that report-details layout rather than a separate card/grid idiom.
- Follow-up questions triggered from findings should use one shared hover and expanded-row anatomy.
- All follow-up questions should use the same nested layout as the report details panel rather than surface-specific variants.

### 2. Entities presentation

- Entities should combine:
  - the two-column density and scanning rhythm of the full workspace library
  - the dot-based row marker treatment used in the report details panel
- Do not use the older icon-heavy entity-row treatment in this converged layout.

### 3. Sources and provenance presentation

- Sources/provenance rows should use the lighter viewer-library font treatment.
- This text should read slightly lighter/subtler than the section label, not heavier.
- Preserve readability, but keep it clearly in the supporting-information role.

### 4. Board, Chat, session, and signal nested rows

- The Board library keeps its richer dropdown/info panels and add-to-board flows.
- The richer Board nested anatomy becomes the baseline reference for other actionable contextual rows.
- Chat context items should converge toward the Board library artifact-row pattern:
  - same row layout
  - same supporting text treatment
  - same nested info rhythm
  - same button styling, with product-appropriate actions such as `Summary` / `Full` instead of `Add to Board`
- Chat sessions and signal-like left/right side panels should likely follow this same actionable nested pattern where items expose actions and contextual drill-in.

### 5. Network library simplification

- The Network library should stop behaving like a special-case surface where that difference is only cosmetic.
- Remove the extra counter-row treatment when it does not add real value.
- Standardize it to the same global header model: eyebrow plus title, with the shared shell and section behavior.

### 6. Section-title and item-state behavior

- Section titles should consistently use the simple depth/shadow treatment already present on the stronger surfaces.
- Section items should adopt the same hover/active treatment family as header and toolbar buttons, expressed through the accent system.
- Any remaining selectors or buttons that sit outside the existing accent system should be brought into it unless they are a deliberate semantic exception.

## Stream 2 Decision Lock

These decisions were confirmed after the roadmap rebase review. Stream 2 should treat them as locked unless a later product doc explicitly replaces them.

### 1. Findings are full workspace objects immediately

- findings become fully addressable workspace objects on par with other canonical records
- Stream 2 should add direct search, direct chat mention and attachment support, and direct board-reference support
- do not stage this as a persistence-first / UI-later compromise

Why:

- this is the cleanest cutover
- it avoids a second refactor for downstream reuse
- it matches the product direction toward reusable workspace intelligence rather than viewer-local presentation

### 2. `agendas` narrows to anomaly-only and then exits mixed duty

- findings should stop piggybacking on `agendas`
- during migration, `agendas` may temporarily mean anomalies only
- after provider and persistence cutover, mixed finding/anomaly usage should be removed from active contracts

Why:

- findings and anomalies need distinct semantics
- keeping `agendas` as a mixed bucket would preserve the same ambiguity this stream is supposed to remove

### 3. Timeline stays artifact-centric

- do not introduce a standalone findings track by default
- findings should enrich artifact events, artifact detail rails, and drill-ins rather than becoming a parallel chronology stream

Why:

- it preserves Timeline as a chronology surface
- it avoids clutter from report-derived observations that are not always timeline-native events

### 4. Findings stay out of the default left library for now

- findings should be directly searchable, mentionable, and board-placeable
- findings should not be promoted into the default left-side library in the first cut
- revisit this only if direct finding usage proves that passive browsing is a product need

Why:

- it keeps the library rail readable
- it still gives findings strong downstream reuse without flooding the browse surface

## Delivery Model

Run this roadmap in ordered streams.

Recommended order:

1. Canonical rail shell and shared interaction primitives
2. First-class `Key Findings` contract and persistence
3. Artifact viewer and report-details rebuild
4. Actionable nested-item parity across Board, Chat, Timeline, and Network
5. Typography, motion, popup, and overlay closeout

Do not pull Stream 3 findings UI ahead of Stream 2 data-contract work.

## Validation Standard

Default expectation per stream:

- `npm run lint`
- `npm run typecheck`
- the most relevant targeted test command(s)
- `npm run build` when shared UI contracts, shipped app behavior, routing, persistence, or search behavior changes

Do not default to the full Vitest suite unless the change becomes cross-cutting enough that targeted coverage would be misleading.

## Stream 1. Canonical Rail Shell And Shared Interaction Contract

Purpose:

- finish the rail-shell convergence that the codebase now has primitives for but has not actually completed
- normalize header anatomy, action-row placement, and top-level section behavior

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

1. Extract or codify one shared rail header anatomy.
2. Standardize eyebrows to `Library`, `Details`, `Context`, or `Inspector`.
3. Remove eyebrow icons and labels such as `Canonical Library`, `Timeline Dossier`, and similar off-contract headers.
4. Place shared action rows directly beneath the header across affected rails wherever the actions are panel-scoped.
5. Make the expanded top-level section flex into remaining height, pin cleanly to the bottom of the rail, and scroll inline.
6. Eliminate top-level double-scroll behavior so the rail container itself stays visually stable.
7. Keep the Board library rich in nested content without preserving a divergent shell.
8. Split top-level section-header styling from meaningful selectable row styling.
9. Normalize browse/select rows and launch/action controls into the two canonical interaction families.

Exit criteria:

- major rails share one obvious shell contract
- left and right rail vocabulary is consistent
- headers use the same plain-text eyebrow and title anatomy
- panel-scoped actions appear in the same location
- expanded sections feel pinned and crisp instead of stretching the rail awkwardly
- the Board library no longer feels like a structurally separate subsystem

## Stream 2. First-Class `Key Findings` Contract And Persistence

Purpose:

- give findings one canonical structured contract
- remove the current ambiguity between findings, anomalies, agendas, and generic section items

Primary targets:

- `src/types/index.ts`
- `src/domain/artifacts.ts`
- `src/services/providers/types.ts`
- `src/services/providers/shared/prompts.ts`
- `src/services/providers/shared/artifactContract.ts`
- provider-specific schema files such as `src/services/providers/geminiProvider.ts`
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
- relevant Timeline types and builders if findings become directly addressable there

Execution checklist:

1. Add a canonical `KeyFinding` type and add `keyFindings` to `Artifact`.
2. Define stable ids, origin artifact linkage, ordering, and support refs.
3. Add `keyFindings` to `StructuredArtifactPayload`.
4. Update prompts and provider schemas to request findings explicitly.
5. Persist findings in a dedicated storage shape.
6. Rehydrate findings as first-class records during artifact load.
7. Define the migration rule for `agendas`.
8. Extend search, mentions, handoffs, and board/chat/timeline types according to the decision gate above.
9. Keep `KEY_FINDINGS` sections as a presentation of canonical findings, not the source of truth.

Exit criteria:

- findings have one canonical structured contract
- save/load cycles preserve findings as findings
- no critical product surface has to reconstruct findings from generic sections or anomaly arrays

Docs to update on landing:

- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/ARCHITECTURE.md`

## Stream 3. Artifact Viewer And Report Details Rebuild

Purpose:

- rebuild the Artifact viewer around the now-canonical finding contract
- finish the document-first reading experience the report originally called for

Dependency:

- Stream 2 must settle the findings contract first

Primary targets:

- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/OperationView/artifactViewerPresentation.ts`
- `src/components/features/OperationView/ArtifactViewer.test.tsx`

Execution checklist:

1. Remove the top reading-pattern / summary block.
2. Rebuild the main column around substantive document sections.
3. Render `Key Findings` from canonical finding records near the top of the document body.
4. Keep findings visible in the details rail using the report-details panel anatomy as the canonical layout.
5. Normalize follow-up question rows, hover states, and expanded nested content to one shared details-panel pattern.
6. Restyle entities as a two-column library-like layout with the details-panel dot treatment replacing the older icon-heavy row marker.
7. Use the lighter viewer-library treatment for sources and provenance rows so supporting text reads slightly lighter than the section label.
8. Prefer chips and inline links for entity/source mentions.
9. Preserve and expand editability and evidence-jump affordances.

Exit criteria:

- the main report reads like a document, not a dashboard
- findings, follow-ups, entities, and provenance read as one family
- the details rail feels like the canonical report-side nested layout rather than a collection of local patterns

## Stream 4. Actionable Nested-Item Parity Across Viewer, Board, Chat, Timeline, And Network

Purpose:

- align the actionable row anatomy across the context-rich side surfaces without flattening legitimate local differences

Primary targets:

- `src/components/features/WorkspaceBoard/BoardLibraryRail.tsx`
- `src/components/features/WorkspaceBoard/BoardInspectorRail.tsx`
- `src/components/features/Chat/ChatContextRail.tsx`
- relevant chat session/history side-panel components
- `src/components/features/Timeline/TimelineDossierPanel.tsx`
- `src/components/features/Timeline/TimelineDetailRail.tsx`
- `src/components/features/NetworkGraph/NodeInspector.tsx`
- `src/components/features/OperationView/InspectorPanel.tsx`

Execution checklist:

1. Treat the strongest Board nested-item anatomy as the baseline for actionable contextual rows.
2. Align Chat context rows to the Board artifact-row pattern, including supporting text, nested info layout, and action-button styling.
3. Replace ad hoc Chat row actions such as `Summary` and `Full Text` with the shared action family while preserving their product-specific function.
4. Apply the same actionable nested-row model to chat session/signal-style side panels where the items expose context and actions.
5. Align Timeline and Network inspector rows where they diverge from the shared item contract.
6. Simplify the Network library by removing non-essential counter-row chrome and standardizing it to the shared header/shell model.
7. Carry Stream 2 finding support into downstream rows only where the chosen finding contract requires it.
8. Keep Board library richness where it adds value, but remove purely local visual language.

Exit criteria:

- actionable context rows across Board, Chat, Timeline, and Network feel clearly related
- Chat session/context and Board nested rows read as variants of the same actionable pattern
- the Network library no longer feels like an odd cosmetic outlier
- the remaining differences are functional, not accidental

## Stream 5. Typography, State, Motion, And Overlay Closeout

Purpose:

- finish the interaction-language cleanup after shell, findings, and viewer structure are stable

Primary targets:

- `src/index.css`
- `src/components/ui/Accordion.tsx`
- `src/components/ui/InspectorActionRow.tsx`
- touched panel-heavy surfaces across Artifact, Chat, Timeline, Board, and Network

Execution checklist:

1. Normalize the neutral browse/select state family across structural and navigational items.
2. Normalize the accent action state family across launch and execution controls.
3. Normalize section-title shadow treatment and secondary-copy roles, including the lighter sources/provenance typography.
4. Ensure section items inherit the header/toolbar accent-system hover and active treatment where appropriate.
5. Reduce motion to the smallest useful set.
6. Sweep obvious popup, menu, and modal outliers only after the main panel language is stable.

Exit criteria:

- hover, active, and selected states no longer feel fragmented
- secondary copy and panel typography come from a small intentional set of roles
- section titles and actionable rows share one consistent state language
- motion feels restrained and utilitarian rather than decorative

## Completion Standard

This roadmap is complete only when:

1. left and right rails use one clear shell contract
2. panel vocabulary is simplified and consistent
3. action rows appear in one predictable place
4. top-level rail expansion and scrolling feels pinned and clean
5. the Artifact viewer reads like a professional editable document
6. `Key Findings` is implemented as a first-class structured concept
7. downstream finding behavior matches an explicit chosen contract rather than ad hoc local heuristics
8. actionable rows across Board, Chat, Timeline, Network, and Artifact details feel like one product family
9. typography, hover states, and motion across the touched surfaces are intentionally unified

## Testing Expectations For The Findings Stream

At minimum, expect targeted coverage across:

- provider contract tests for parsing and normalization
- repository tests for persistence and hydration
- workspace search tests for finding retrieval
- mention and launch-context tests if findings become directly addressable in chat
- board reference or placement tests if findings become directly placeable
- Artifact viewer tests proving the document and details rail both read from canonical findings
