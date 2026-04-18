# 2026-04-10 Panel Architecture Follow-Up Report

## Purpose

Capture the current architectural state of the shared panel work after retiring the UI panel unification epic, with emphasis on:

- how closely the implementation matched the original plans
- what value landed even though the deeper abstraction was not fully realized
- where the remaining awkwardness still lives

This is a retrospective note, not a re-opened implementation plan.

## Bottom Line

The shared panel work landed the most valuable half of the original intent:

- shared shell and chrome
- shared section rendering
- shared tab treatment
- shared section-state behavior
- broad route adoption

The part that did not fully land was the deeper shared data-model layer:

- no full shared subject-driven inspector pipeline
- no full shared builder-file system for every route
- some heavy routes still hand-build a lot of their sections and behaviors

From a first-principles perspective, this means the codebase is meaningfully more consistent and maintainable than it was before, even though it is not as elegant as the original abstract design hoped.

That tradeoff is acceptable for now because behavior and feel are calm across the migrated routes.

## What Landed

### Shared panel system

These shared foundations are real and actively used:

- `src/components/features/Inspector/GlobalInspectorPanel.tsx`
- `src/components/features/Inspector/GlobalInspectorHeader.tsx`
- `src/components/features/Inspector/GlobalInspectorSections.tsx`
- `src/components/features/Inspector/GlobalInspectorTabs.tsx`
- `src/components/features/Inspector/sharedInspectorSectionBuilders.tsx`
- `src/components/features/LibraryRail/LibraryRailShell.tsx`
- `src/components/features/LibraryRail/LibraryRailHeader.tsx`
- `src/components/features/LibraryRail/LibraryRailSections.tsx`
- `src/components/features/LibraryRail/LibraryRailEntry.tsx`
- `src/components/features/LibraryRail/LibraryRailSearch.tsx`
- `src/components/features/shared/useExclusivePanelSections.ts`
- shared panel chrome and action-row support in `src/components/ui/chrome.ts`

### Real adoption across routes

The panel family is not theoretical. It is powering the current route adapters:

- Operation View
- Network Graph
- Timeline
- Chat
- WorkspaceBoard
- ArtifactViewer detail sidebar as a specialized shared consumer

### What value that created

This work removed a large amount of duplication in:

- outer panel shell geometry
- headers
- accordion section treatment
- panel spacing and density
- tabs
- many common list/card entry patterns
- section open/close state logic

That is the part of the refactor that most directly affects user experience consistency and future UI maintenance cost.

## What Did Not Fully Land

The original plans described a more abstract second layer above the shared panel chrome.

### Inspector plan gap

The original inspector plan imagined:

- `globalInspectorUtils.ts`
- a shared subject-driven model
- more shared route adaptation into common subject shapes

What actually landed:

- `globalInspectorTypes.ts` contains the subject-kind enum and the section/tab contracts
- some reusable section builders landed in `sharedInspectorSectionBuilders.tsx`
- route adapters still build many inspector sections directly

This means the system became a shared inspector shell, not a fully shared inspector data pipeline.

### Library rail plan gap

The original library plan imagined:

- `libraryRailUtils.ts`
- dedicated per-route builder files
- broader normalization of section and entry shaping before rendering

What actually landed:

- the shared library shell/header/sections/entry/search components
- route-level use of shared `entries` config in the simpler rails
- but no fully standardized builder-file layer across every route

This means the system became a shared rail presentation contract, not a complete route-builder architecture.

## Why This Still Matters

Not landing the deeper abstraction does not mean the work failed.

The highest-value problems were:

- too many bespoke shells
- too much visual drift
- repeated accordion and panel behavior
- repeated section-state logic

Those problems were materially improved.

The main things we did not get are architectural elegance benefits such as:

- tiny route adapters driven almost entirely by shared subject/builders
- uniformly low-complexity route panel files
- near-zero friction for adding a new panelized route in the future

In other words:

- we got strong UX and medium maintainability wins
- we did not get the most elegant long-term abstraction

## Route-by-Route Read

### Chat

This is the cleanest-feeling adopter.

Why it feels better:

- simpler information architecture
- fewer subject types
- shared shells fit the surface naturally
- route-specific logic is straightforward

Chat is the best proof that the shared panel system is useful even without the deeper abstraction layer.

### Timeline

Timeline is also in a pretty good place.

Why:

- the left rail maps naturally to shared section and entry rendering
- the right panel is contextual but not overly mutation-heavy
- route-specific focus and handoff logic still staying local is reasonable

### WorkspaceBoard

Board is mixed.

What is good:

- shared outer shells landed
- shared tab shell for `Inspector` and `Agent` landed
- shared action-row treatment is visibly helping

What still feels bespoke:

- nested library disclosures still use route-local `Accordion` composition
- the board surface has more special-case actions and richer interaction than the shared entry model comfortably expresses

Board is unified at the shell level, but not especially elegant internally.

### Operation View

Operation View is improved, but still fairly dense.

Why:

- it has several inspection modes
- it still owns meaningful route-specific derivation and actions
- the shared shell helps, but does not remove much conceptual complexity

This is a route where the deeper subject/builder architecture would have reduced more weight if we had followed through.

### Network Graph

Network Graph is the clearest example of "shared shell, still heavy route adapter."

Why:

- it still owns a lot of subject derivation
- it still owns graph-specific behavior and action shaping
- it still hand-builds substantial inspector content

This is not wrong. It just means the route remains complex even after the shared inspector cutover.

### ArtifactViewer detail sidebar

This ended in the right place.

It should be treated as a specialized shared consumer, not forced onto `LibraryRailShell`.

That decision preserves the artifact reader layout while still reusing:

- `LibraryRailHeader.tsx`
- `LibraryRailSections.tsx`
- shared section-state behavior

## Practical Read On Current Quality

If the question is "did the shared panel work land anything meaningful?", the answer is yes.

If the question is "did it land the elegant final architecture originally imagined?", the answer is no.

Current rough read:

- shared chrome/shell extraction: strong
- shared section-state extraction: strong
- shared route adoption: strong
- deep shared subject/builder architecture: partial
- overall elegance: mixed

That is why the system feels calmer than before without feeling especially beautiful in every route.

## Recommended Stance

Do not reopen panel architecture work just to chase theoretical elegance.

The current system is acceptable if:

- route behavior is stable
- the visual feel is calm
- future edits can continue to reuse the shared panel shell and chrome

If this area is revisited later, the best targets would be:

- reduce the heaviest route adapters, especially Network Graph and Operation View
- decide whether Board needs a richer shared disclosure-entry model
- only introduce deeper subject/builder abstractions where they clearly remove real route weight

## Related Note

At the time this report was written, the remaining known unrelated verification issue was still:

- `src/services/workspace/agent/actions/registry.test.ts` failing because `editor.createAssets` is not available in the current test seam

That issue is not a reason to reopen the panel architecture itself.
