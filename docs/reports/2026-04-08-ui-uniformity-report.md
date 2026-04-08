# Sherlock UI Uniformity Roadmap

Date: 2026-04-08

Status: Proposed

Related inputs:

- `docs/reports/2026-04-08-codebase-audit.md`
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

- this roadmap should immediately surface key findings as a dedicated top-level report section in the main document body and in the details rail
- this roadmap should not silently treat key findings as first-class board or timeline objects without an explicit product decision
- if we later decide key findings need first-class promotion, pinning, retrieval, or persistence behavior, that should land as a named follow-on data-contract stream and update `docs/operations/DATA_PERSISTENCE.md`

### Recommended product assumption for this pass

For this roadmap, treat key findings as a canonical report category first, not automatic workspace-item records.

That means:

- give them their own explicit `Key Findings` section in the report reader
- keep them visible in the details rail
- leave room for explicit promote or pin actions later if needed
- avoid inventing hidden ingestion rules for Board, Timeline, or Chat until the product contract is deliberate

### Recommended longer-term direction

If key findings continue to be central to how operators read and act on reports, they should eventually become structured artifact-level records rather than only section text or agenda-style presentation inputs.

That future contract would let Sherlock:

- render a stronger `Key Findings` section in the report without brittle presentation heuristics
- support deliberate pin or promote actions into Board, Chat, or Timeline
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
6. Fix the Board library top-scroll issue so the rail feels as crisp as the Chat context panel.
7. Remove unnecessary header icons or extra label clutter where the panel role is already obvious.

Exit criteria:

- major rails share the same shell behavior
- header copy is simplified and consistent
- expanded sections feel pinned and clean instead of causing full-rail scroll drift

## Stream 2. Artifact Viewer And Report Details Overhaul

Purpose:

- turn the main report into a readable document
- align the report details rail with the rest of the panel language
- surface key findings as a real report category without overcommitting yet to a cross-workspace persistence model

Primary targets:

- `src/components/features/OperationView/ArtifactViewer.tsx`
- `src/components/features/OperationView/artifactViewerPresentation.ts`
- `src/components/features/OperationView/ArtifactViewer.test.tsx`

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

## Stream 2A. Key Findings Data Contract Decision

Purpose:

- explicitly decide whether key findings remain report-only or become first-class structured records
- avoid leaving a major product concept half-visual and half-implicit

Primary targets:

- artifact presentation and shaping modules under `src/components/features/OperationView/*`
- artifact domain and provider normalization contracts where key-finding structure would need to be introduced
- persistence and downstream consumers only if this stream is intentionally activated

Execution checklist:

1. Decide whether `Key Findings` remains a report-only structured section for now, or becomes a true artifact-level structured collection.
2. If report-only for now:
   - keep the dedicated main-report `Key Findings` section
   - keep details-rail duplication
   - do not add implicit Board, Timeline, or Chat ingestion
3. If promoted to a first-class structured collection:
   - define canonical finding shape
   - define how findings are generated and normalized from provider output
   - define whether findings are persisted separately or as structured artifact subrecords
   - define how findings appear in Chat context, Timeline, Board, and any workspace library flows
   - document the persistence contract in `docs/operations/DATA_PERSISTENCE.md`
4. Do not leave this as an accidental side effect of viewer refactoring.

Exit criteria:

- the roadmap makes an explicit product call on key findings
- implementation teams know whether they are only improving report presentation or also building a new workspace-level object

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
- the product decision on whether key findings are report-only or first-class is explicit rather than implied
- follow-ups, entities, provenance, sessions, and other actionable rows use consistent item anatomy
- Board library remains rich where it should, but no longer feels structurally off-contract
- motion, popups, and modals feel intentionally restrained and uniform

## Recommended Follow-On If Key Findings Need To Become First-Class Later

If later product work decides that key findings should be independently pinnable, searchable, or promotable into Board, Timeline, or Chat retrieval, handle that as a separate named stream with:

- explicit structured finding records
- clear promotion and retrieval rules
- explicit Timeline and Board behavior
- documentation updates in `docs/operations/DATA_PERSISTENCE.md` and `docs/operations/ARCHITECTURE.md`

That should be an intentional product expansion, not an incidental side effect of the UI cleanup.
