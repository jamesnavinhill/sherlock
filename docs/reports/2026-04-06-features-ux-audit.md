# Sherlock Features + UX Audit

Date: April 6, 2026

Scope: product audit of the current app from a features, workflow, and UX perspective, grounded in the active codebase and a browser walkthrough of the seeded demo workspace on `2026-04-06`.

Primary references reviewed:

- `src/app/AppShell.tsx`
- `src/app/useAppShellController.ts`
- `src/app/routeViews.tsx`
- `src/components/features/Chat/*`
- `src/components/features/WorkspaceBoard/*`
- `src/components/features/Timeline/*`
- `src/components/features/NetworkGraph/*`
- `src/components/features/OperationView/*`
- `src/components/features/Feed.tsx`
- `src/components/features/LiveMonitor/*`
- `src/components/features/Archives.tsx`
- `src/components/ui/GlobalSearch.tsx`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `src/services/providers/shared/prompts.ts`
- `src/services/providers/shared/chat.ts`
- `src/services/providers/shared/boardAgent.ts`
- `src/services/workspace/agent/actions/registry.ts`
- `src/store/actions/bootstrapActions.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/client.ts`

Validation method:

- code inspection across the routed feature surfaces, runtime contracts, and persistence layer
- browser walkthrough against the seeded workspace in `public/seeds/demo-workspace.json`
- UI path checks across Files, Operation View, Chat, Guided Run, Board, Timeline, Network Graph, Global Search, and first-run bootstrap

Important limitation:

- live provider quality was not fully validated end-to-end because the browser pass used `Browse Without Key`; prompt and output systems were reviewed in code, but fresh LLM execution quality was not audited against live providers in this pass

## Executive Summary

Sherlock is no longer a “partial prototype.” The current build already feels like a real investigative workspace platform with strong architectural cohesion across artifact generation, chat, board, timeline, graph, and persistence. The app’s biggest strengths are:

- a shared canonical data model
- real cross-surface handoffs instead of siloed tools
- meaningful board/chat/timeline depth
- a good foundation for agentic workflows without introducing a separate, incoherent agent stack

The main shift I would recommend now is not another foundational refactor. It is a productization pass: make the existing power more legible, more searchable, more synthesis-oriented, and more trustworthy on first-run and high-signal workflows.

My recommended path is:

1. fix the first-run bootstrap integrity issue immediately
2. build a true omnibox and workspace synthesis layer
3. make workspace identity, naming, and terminology consistent everywhere
4. elevate canonical library items, agent actions, and artifact provenance into first-class product experiences
5. bring the older surfaces (`Discovery`, `Live Monitor`, `Archives`) up to the polish bar already set by chat, timeline, and board

## What Is Working Well

These are strengths worth preserving as you build out polish rather than replacing:

1. The routed feature model is coherent. `Operation View`, `Chat`, `WorkspaceBoard`, `Timeline`, `NetworkGraph`, `Archives`, `Settings`, and the launch pipeline all feel like parts of one product, not separate experiments.

2. The canonical data model is paying off. The `Workspace -> Artifact -> WorkspaceRun` architecture, plus chat sessions, board items, signals, follow-ups, and board-agent actions, gives you a strong base for deeper UX without needing another persistence reset.

3. Cross-surface handoffs are already meaningful. Opening chat from an artifact, placing things on the board, jumping from timeline into chat, and linking graph nodes back into workspace actions all materially increase usefulness.

4. The board surface is substantial. The multi-board model, canonical library, manual note/link/file flows, and board agent already feel like a genuine research workspace rather than a canvas pasted onto the app.

5. Timeline is strong and differentiating. It is one of the clearest signals that Sherlock has grown into a real workspace system, especially because it connects artifacts, entity milestones, and chat actions rather than only runs.

6. Prompt and output normalization are more mature than the UI currently exposes. The artifact contract, chat grounding contract, and board-agent action contract are already disciplined and productizable.

## Priority Roadmap

### 1. P0: Fix first-run bootstrap and demo-seed integrity before doing more polish

Current state:

The browser pass surfaced a real initialization error on first load:

- `SQL Error: begin [] SQLiteError: cannot start a transaction within a transaction`
- `Store initialization failed: _DrizzleQueryError: Failed query: begin`

Relevant code:

- `src/store/actions/bootstrapActions.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `src/services/db/client.ts`

Why this matters practically:

If first-run data load is noisy or partially failing, every other UX investment gets undercut. For demos, onboarding, previews, and stakeholder confidence, bootstrap trust is foundational.

Why this matters technically:

`initializeStore()` triggers `persistWorkspaceDataBackup(demoSeed)`, which flows into `CaseRepository.replaceWorkspaceDataBackup()` and `runWriteTransaction()`. Something in that path is attempting nested transactional behavior against the sqlite proxy / serialized query layer.

Options:

Option A: patch the failing nested transaction path only.
Tradeoff: fastest fix, lowest blast radius, but risks leaving the import path brittle if other nested write flows exist.

Option B: audit and standardize all write helpers so repo methods never open a new transaction when already running inside one.
Tradeoff: slightly more work now, but it gives you a durable write-path contract and reduces future “transaction within transaction” regressions.

Option C: bypass transaction use during demo-seed restore only.
Tradeoff: fastest workaround, but I would not recommend it because seed import is exactly the kind of multi-table write that should stay atomic.

Recommendation: ** Agreed

Choose Option B.

Why:

You are entering a polish-and-capabilities phase. This is the wrong time to keep “mostly works” persistence behavior in the background. A clean transactional contract will protect upcoming UX work across backup/restore, agent actions, artifact saves, and board workflows.

### 2. P1: Replace the current global search with a true omnibox

Current state:

The app already has a richer workspace search engine in `src/services/db/repositories/WorkspaceSearchRepository.ts`, but the shipped omnibox in `src/components/ui/GlobalSearch.tsx` does not use it. The current modal:

- searches only in-memory workspaces, artifacts, headlines, and extracted entities
- does not search canonical workspace items, sources, sections, evidence, chat sessions, or board content
- does not expose action-oriented results
- shows a footer count (`Indexed Nodes`) that is materially misleading

In the browser pass, searching `OpenAI` produced case/report/entity matches, but not the deeper canonical context your retrieval layer is capable of.

Why this matters practically:

Once Sherlock becomes a dense workspace tool, search stops being a convenience and becomes primary navigation. Right now the search UI undersells the system.

Why this matters technically:

You already have most of the hard part. `WorkspaceSearchRepository` can score reports, sections, evidence, sources, signals, entities, and workspace items. The gap is product wiring, result modeling, and action routing.

Options:

Option A: improve the current modal incrementally.
Tradeoff: low-cost, but risks preserving the current “quick jump” mental model instead of becoming a true command surface.

Option B: rebuild it as a workspace-aware omnibox powered by `WorkspaceSearchRepository`, with typed results and actions.
Tradeoff: more upfront design work, but it becomes one of Sherlock’s most important product primitives.

Option C: keep global quick jump separate from workspace search, with two distinct entry points.
Tradeoff: clearer implementation boundaries, but higher cognitive overhead for users.

Recommendation:

Choose Option B.

Recommended behavior: ** im imagining like an ide, vscode search, centered in the main header/toolbars of the pages that make sense. and selecting an item, it would maybe just focus it (view it, add it, select it, etc) on whatever page im on- in context. maybe add a context menu to the results for key actions but def not 12 diff icons lol . we would likely replace all searches with this? or does the library panel keep/get a search panel, or is this where we uniform it to, and not in the headers?

- one omnibox
- global results for routes/workspaces
- workspace-scoped results for artifacts, sections, evidence, sources, library items, entities, signals, chats, and actions
- action verbs on results: open artifact, open chat, open board, focus timeline, open graph, fetch summary, place on board
- recent items and saved views

This would immediately improve “search across the app,” “library/artifacts,” and “full workspace synthesis” at the same time.

### 3. P1: Establish one canonical workspace identity and clean up naming leakage

Current state:

Sherlock has a strong architectural distinction between workspace, artifact, purpose, and run config, but the user-facing naming is still leaking internal/control content in places. The seeded workspace title includes run control tags, and those leak into several experiences:

- guided chat intro
- workspace selectors
- some prompts and session metadata
- some action defaults

Relevant code patterns:

- `sanitizeDisplayTitle()` exists in `src/domain/presentation.ts`
- many surfaces already sanitize titles
- many others still use raw `workspace.title` directly

Why this matters practically:

This is a polish-phase issue with outsized product impact. A tool can be powerful and still feel messy if the primary object identity is unstable, overloaded, or inconsistent.

Why this matters technically:

Right now workspace identity is doing too many jobs:

- user-facing name
- inherited run topic
- sometimes parent context
- sometimes hidden control metadata carrier

Options:

Option A: keep current stored titles but sanitize everywhere at render time.
Tradeoff: least invasive, but the raw title remains polluted in prompts, exports, actions, and future integrations.

Option B: split workspace display name from structured launch metadata.
Tradeoff: requires some schema and migration thought, but it is the cleanest long-term model.

Option C: normalize only for new workspaces and leave legacy titles alone.
Tradeoff: lowest migration pain, but introduces dual behavior and long-tail inconsistency.

Recommendation: ** Agreed

Choose Option B.

Add explicit fields for:

- workspace display title
- original launch topic
- launch angle
- priority sources summary

Then use the clean display title everywhere user-facing, while keeping structured launch metadata where it actually belongs.

### 4. P1: Add a real workspace home / synthesis surface

Current state:

`/workspaces/:workspaceId` currently redirects to either the landing artifact or the first board route in `src/app/routeViews.tsx`. That means the app has a workspace architecture but not an actual workspace home.

Why this matters practically:

Sherlock is now rich enough that users need a “where am I, what’s here, what should I do next?” surface. Redirecting into a report or board made sense during buildout; it is now holding back cohesion.

Why this matters technically:

You already have enough canonical state to build a strong synthesis page:

- workspace summary
- latest artifacts
- timeline highlights
- open follow-ups
- board status
- graph summary
- recent chat sessions
- saved signals
- canonical library stats

Options:

Option A: keep redirect behavior and improve side panels only.
Tradeoff: less work, but still no true workspace synthesis entry point.

Option B: create a real workspace home dashboard.
Tradeoff: new surface to design, but high leverage because it can unify the whole product.

Option C: make Timeline or Board the de facto workspace home.
Tradeoff: simpler routing, but each of those surfaces biases the user toward one representation of the workspace.

Recommendation: ** Agreed but I'm not ready to build this yet. this is next round. for now lets continue to dial in the features that will coalesce here

Choose Option B.

Recommended home contents:

- top summary block
- “resume where you left off”
- latest artifacts
- open follow-ups / unresolved questions
- recent chat activity
- board summary
- timeline highlights
- graph/library counts
- quick actions

This is the best answer to the “full workspace synthesis” need.

### 5. P1: Elevate canonical library items so they are first-class outside the board

Current state:

The canonical library model is good, but its UX gravity is still concentrated inside the board rail. Workspace items are not yet first-class enough across the rest of the product.

Current gaps:

- global search does not include them
- archives do not foreground them
- timeline does not track workspace-item creation/editing
- cross-surface discovery of notes/links/files/excerpts is still weaker than for artifacts

Relevant code:

- `src/services/workspace/library.ts`
- `src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts`
- `src/components/ui/GlobalSearch.tsx`
- `src/components/features/Timeline/timelineEvents.ts`
- `src/components/features/Archives.tsx`

Why this matters practically:

If notes, links, files, and excerpts are canonical, users need to feel that canon outside the board. Otherwise the board feels like the only place where that data is truly “real.”

Options:

Option A: keep library items primarily board-scoped.
Tradeoff: simpler UX, but limits the payoff of the canonical workspace-item architecture.

Option B: promote workspace items into search, timeline, archives, and chat actions.
Tradeoff: more product plumbing, but much stronger workspace cohesion.

Recommendation:

Choose Option B.

First moves:

- include workspace items in omnibox search
- add a library tab or filter in Archives
- create timeline events for item creation, promotion, and major updates
- allow chat/context panels to surface saved notes/excerpts alongside artifacts ** my real wish would be to be able to @ in the chat inputs to get a nice clean inline display of my items so i can easily attach them to chat, like ide behavior :)

### 6. P1: Turn agent capability into an explainable, reviewable workflow rather than a hidden power feature

Current state:

The board agent is materially implemented and more advanced than many apps ever reach:

- structured action protocol
- action registry
- todo support
- canonical writes
- follow-up scheduling patterns
- board mutation support

That said, the UX still feels closer to “power user rail” than “productized assistant.”

Relevant code:

- `src/services/providers/shared/boardAgent.ts`
- `src/services/workspace/agent/runtime.ts`
- `src/services/workspace/agent/actions/registry.ts`
- `src/components/features/WorkspaceBoard/BoardAgentRail.tsx`

Why this matters practically:

This is a potential flagship differentiator. But right now many users will not understand:

- what the agent is allowed to do
- which actions are safe
- what changed after a run
- when to use it versus manual workflows

Options:

Option A: keep the current rail and add better copy/tooltips.
Tradeoff: helpful but still leaves the assistant mostly “expert mode.”

Option B: layer structured presets, previews, and approvals on top of the current engine.
Tradeoff: more work, but dramatically increases trust and usefulness.

Option C: broaden agent autonomy immediately.
Tradeoff: impressive in demos, but risky for trust, auditability, and recovery.

Recommendation:

Choose Option B.

Recommended product additions:

- starter intents: organize evidence, find contradictions, draft note, prep briefing, cluster sources * love this. should consider best way to surface.  dont love a bunch of chips and badges sitting on my surfaces. much prefer nesting them in a menu behind one icon
- per-action preview and diff summary - where would this surface? as a whole new page, or just a focused modal like?
- clearer action receipts after execution *history log?
- stronger review loop for follow-up plans and queued todos

### 7. P1: Improve prompt and output systems at the product layer, not just the adapter layer

Current state:

The prompt contracts are disciplined, but the UI does not yet fully capitalize on them.

Strengths:

- artifact prompts carry scope/pack/purpose structure
- chat prompts are grounded against retrieved workspace context
- board-agent prompts use structured action output
- normalization layers are strong

Current weakness:

The user-facing output experience still collapses many artifact types into one generalized reading pattern. The system can produce briefs, syntheses, comparisons, monitor snapshots, and reports, but the rendering and interaction model still leans generic.

Relevant code:

- `src/services/providers/shared/prompts.ts`
- `src/services/providers/shared/chat.ts`
- `src/services/providers/shared/artifactContract.ts`
- `src/domain/artifacts.ts`
- `src/components/features/OperationView/ReportViewer.tsx`

Why this matters practically:

This is the difference between “the model returned structured JSON” and “the product feels like it knows what kind of work I asked it to do.”

Options:

Option A: keep a generic renderer and let structure differences stay mostly in section order.
Tradeoff: simpler, but undersells artifact-type semantics.

Option B: introduce artifact-type-aware presentation patterns.
Tradeoff: more UI work, but much more product polish and clarity.

Recommendation:

Choose Option B.

High-value examples:

- `BRIEF`: key takeaways, implications, recommended next actions
- `COMPARISON`: side-by-side matrix and major deltas
- `MONITOR_SNAPSHOT`: changes since prior snapshot, watchlist, escalation signals
- `TIMELINE`: chronological summary plus derived patterns
- `SYNTHESIS`: consensus, disagreement, evidence quality

Also recommended:

- stronger provenance surfacing up front, not buried in an accordion *where would you envision this? I'm ok with it in the accordions tbh. do you mean just also within the reports section themselves where appropriate alongside the items,, or as a grouped collection? what's your thinking here.. "buried in the accordion" is supposed to serve as the expected uniform panels for these types of items. help me understand another strategy
- clearer evidence-to-claim linking
- explicit “what is grounded vs inferred” treatments

### 8. P1: Bring Discovery and Live Monitor up to the polish bar set by Chat, Board, and Timeline

Current state:

`Discovery` and `Live Monitor` still feel more like earlier-generation Sherlock surfaces. They are functional and integrated into the launch pipeline, but the UX reads older, more scanner-centric, and less synthesis-oriented.

Signs of lag:

- older terminology and internal-state framing
- weaker workspace-first mental model
- less rich result context
- less obvious pathways into canonical workspace synthesis after ingestion

Relevant code:

- `src/components/features/Feed.tsx`
- `src/components/features/LiveMonitor/index.tsx`

Why this matters practically:

These surfaces are top-of-funnel entry points. If they feel older than the rest of the app, the whole product feels less cohesive than it actually is.

Options:

Option A: leave them mostly alone and focus on downstream surfaces.
Tradeoff: lower effort, but persistent parity gap.

Option B: redesign them around the same product language as workspace chat, board, and timeline.
Tradeoff: moderate effort, but high cohesion payoff.

Recommendation:

Choose Option B.

Recommended direction:

- make discoveries and signals feel more obviously workspace-bound
- improve event/result cards with better context and downstream actions * we like the way the template cards are designed, in settings. would these be a good target for design
- surface “save to workspace,” “add to timeline,” “place on board,” and “open synthesis” patterns more explicitly * uniformed and clean
- reduce scanner-only vocabulary in favor of workspace workflow language

### 9. P1: Rationalize terminology across the product

Current state:

The app is much better than before, but terminology still drifts between:

- project
- workspace
- case
- artifact
- report
- file
- monitor signal
- headline

You already have label-profile infrastructure, but the lived UX still contains cross-generation vocabulary.

Why this matters practically:

Terminology drift increases onboarding cost and makes a mature system feel less intentional.

Why this matters technically:

You now have enough abstraction to enforce consistency through shared label helpers, selectors, and action copy.

Options:

Option A: continue gradual cleanup opportunistically.
Tradeoff: low overhead, but drift will persist.

Option B: do a focused copy/labeling pass with a canonical vocabulary map.
Tradeoff: some up-front discipline, but high UX payoff.

Recommendation:

Choose Option B.

I would define:

- primary product nouns
- approved alternates
- banned legacy labels in user-facing copy
- where label profiles are allowed to vary and where they should not / what is the recommended shape? it seems like we already defined this, but are just sitting with leftovers. but yes lets see a mapping of this - i prefer least amount of mismatch that makes sense

### 10. P2: Improve affordance, onboarding, and visual guidance in Graph and Board

Current state:

Both surfaces are powerful, but they still assume a fairly motivated user.

Board observations:

- library and agent rails are good
- empty-state guidance is acceptable
- the transition from “I have artifacts” to “I have a meaningful board” still needs more scaffolding

Graph observations:

- the feature is valuable and inspector flows are real
- the main canvas is visually dense and harder to parse quickly
- controls are functional but not especially self-explanatory

Why this matters practically:

These surfaces are power multipliers once users are oriented. Better onboarding here will increase perceived capability without changing the underlying engine much.

Options:

Option A: keep current controls and add small helper text.
Tradeoff: modest improvement only.

Option B: add guided empty states, legends, presets, and first-use affordances.
Tradeoff: best leverage for a polish phase.

Recommendation: * im open to it, but i dont want to add a bunch of clutter, expect a motivated user, but these items are valuable but shouldn't sit on the surface spread out and taking away from already busy pages. organized logically into nested areas, no redundancy, minimal wasted space

Choose Option B.

Examples:

- board starter layouts
- graph legend and node-type cheat sheet
- “try this next” actions
- saved view presets
- “focus contradictions / focus entities / focus sources” filters

## Recommended Sequencing

If I were sequencing this as the next buildout phase, I would do it in this order:

1. Bootstrap integrity fix
2. Terminology and workspace identity cleanup
3. Omnibox rebuild using canonical workspace search
4. Real workspace home / synthesis dashboard
5. Library-items-as-first-class-citizens pass
6. Agent workflow productization
7. Artifact/output rendering improvements
8. Discovery + Live Monitor redesign pass
9. Board/Graph onboarding polish

Why this sequence:

- it fixes trust first
- then improves legibility
- then improves discovery/navigation
- then improves the “why this tool is powerful” story
- then upgrades older surfaces once the core product spine is clearer

## High-Confidence Product Conclusions

These are the clearest conclusions from this audit:

1. Sherlock’s foundation is strong enough to stop prioritizing “uniformity/parity” as the main goal and start prioritizing product-shaping UX.

2. The next ceiling is not missing capability so much as missing synthesis, discovery, and presentation polish around capabilities you already have.

3. Search, workspace identity, and workspace home are the three highest-leverage UX opportunities.

4. The board agent is worth productizing more visibly. It is not just a side experiment anymore.

5. The canonical library model deserves promotion into the rest of the app.

6. Discovery and Live Monitor are useful, but they currently lag behind the quality level of the newer routed surfaces.

## Clarifying Questions

These are the main ambiguities I would want resolved before turning this into an implementation roadmap.

### 1. Do you want Sherlock’s primary entry point to be a workspace dashboard or one of the specialist surfaces?

Tradeoff:

A workspace dashboard strengthens synthesis and orientation. Keeping a specialist surface as the de facto home keeps the app feeling faster and more tool-like.

Recommendation:

I recommend a real workspace dashboard as the canonical home, with board/timeline/chat still one click away.

Thoughts:

I think i agree there needs a more sensible entry than current offerings provide. But im not sure how it looks and flows / i suppose a ascii diagram would help.

### 2. Should workspace titles stay “rich” and capture launch context, or should they become clean names with structured metadata stored separately? Yes for sure clear names with struct metadata

Tradeoff:

Rich titles preserve context in one field but make UI, prompts, and exports messy. Clean titles require slightly more structured persistence but produce a much better product feel.

Recommendation:

I recommend clean display titles plus structured metadata fields.

### 3. Is the board agent meant to be a high-trust semi-autonomous assistant, or an approval-first copilot?

Tradeoff:

Semi-autonomy creates a more magical product but raises trust and recovery demands. Approval-first feels slower but fits investigative work better.

Recommendation:

I recommend approval-first for material actions, with faster autonomy only for low-risk organization tasks.

Thoughts:
Ideally we have both with a toggle for auto-approve, with sensible defaults like you suggest

### 4. Do you want the canonical library to remain board-centered, or become a full workspace knowledge layer? For sure

Tradeoff:

Board-centered is simpler and more visually coherent. A full workspace knowledge layer increases product breadth and makes Sherlock feel more like a research operating system.

Recommendation:

I recommend full workspace knowledge layer. The architecture is already there.

### 5. Should Discovery and Live Monitor remain feeder surfaces, or do you want them to become flagship workflow surfaces too?

Tradeoff:

Feeder surfaces can stay lightweight and operational. Flagship treatment would make Sherlock feel stronger end-to-end, but it increases design and maintenance scope.

Recommendation:

I recommend keeping them as feeder surfaces conceptually, but raising their UX quality so they no longer feel like older subsystems.

Thoughts:

- discovery rn is our old entry point. its not necessarily coped to a workspace. its a legacy flow for finding fraud and stuff to start new investigations. so now it needs reconfigured a bit to support discovery more appropriate for the current workspace orientation.
- monitor is for creating signals - these a lot of times actually feel like noise lol. i digress. we love it though
- what exactly is a "flagship" workflow surface, "first-class", "flagship" treatment, mean precisely in this context?
-

- Uniformity with the ctas throughout for expected behaviour. right now a few fragmented approaches between button drop down in toolbar, buttons in panels, in-section/card buttons, etc.
- uniformity with headers/toolbars: spacing between items, sizes of items, outlines of items (network graph pages toggle inspector panel is model for the baseline)
- uniformity with our panels, panel sections, subsections layout and design so it can be consistent across the various contexts (we think the right side inspector panel like in the report viewer is pretty sharp, especially for entities and follow ups as that's where the others differ a bit in dossier/library panels. but one exception to this uniformity would be the canvas board library panel -- here we would keep/polish on the various subsections items to display relevant details.
- uniformity across selector and selector menu item text - removing all extra, in parentheses, after "-" text.
- uniformity across UI surface to REMOVE all unnecessary text, for helpers and tips. all these should be thoughtfully implemented behind a uniform tip/hint system.
- default every panel, and their sections and subsections collapsed as default. expand by default all left side library/dossier panels. still all sections subsections collapsed for now, this will be our starting shape for each page that has it
-  

- All the title text feels too weighty? too bold? we seemed to have made it a bit better on // needs to feel more polished
-- (surface some further configs in our font selection suite? like weight, etc?)

Viewer page,

- when the inspector opens, the view should be the current report in the viewer. right now its just showing the placeholder empty state even when i have a report in the viewer
- the edit and voice buttons should be icons only and not have the box/bordering. plain icon  with accented hover/active like others

Network graph page, left panel shifts the graph content currently, it should just slide over without shifting the graph contents like the right side panel behaves

Chat page:

- Remove the full width section that runs along the bottom of the page. not the chat input, but the full width section that surrounds chat. remove that.
- Add small thin appropriate separator line for the chat input toolbar row, add a file upload and a config icon, uniform to canvas agent

canvas:

- immediately after selecting from the palate menu, it auto closes, we don't want that.
- the highlight logic on canvas items is ass backwards, boldened and bright on rest, dimmed on hover/active - reverse that
- dragging an items from the library "looks like it works" as in there's a drag ability and ghost item, but it doesn't actually add to the canvas
- font, styling of our various items, could use some structure, proper hierarchy of fonts size weight etc. so it reads better. part of that awkward boldened text everywhere.

Timeline:

- remove? the buttons on the item sections, the lower row icons, and just keep the central and uniform in the panel?
- uniform panels

Archives/Files:

- The big blocks for the various artifact cards feels off. either need more info or smaller sections. perhaps both - with a small non boxed filter icon for switching from a grid, or list views. list being much more streamlined, table / grid being cards but with quality styling and design

Settings:

- Runtime:
- vertical stack existing sections, let the config section layout naturally.
- Theme:
- Auto detect which light/dark mode theme I'm on and default the surface systems dark/light toggle to match.
- Accent and Font sections should share the top page.
- Font section needs consolidated and the selections grouped and the display example grouped and separated from the selectors. clean
- surface workbench - the more and less chroma/and separation buttons should always logical map next to each other respectively with the match accent hue being its own line
 -- surface preview, shows the various sized cards but changing or selecting them doesn't do anything in the preview except label the top raised surface card with whatever label i have selected, i would think the appropriate panel needs lightly highlighted with a border or something instead? .. no display text on the preview.. it'll be implied by the subtler active outline

Other:

- Matrix Rain.. i think we can either remove it altogether. OR keep it in few key spots for when there is a live running action like the run/ monitor and discovery run/refreshes. but not on rest? // is it also in settings? i cant tell. what are your thoughts.. it feels outdated tbh.. although i could see us keeping it but making it somewhat customizable so its not so matrix specific always? idk this is like something not important at all so IF we did keep it and polish it its like a save for very last type item. BUT if we remove it then it goes in the normal flows.
-
