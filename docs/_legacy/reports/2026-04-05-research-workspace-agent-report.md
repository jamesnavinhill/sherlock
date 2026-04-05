# Research Workspace Agent Capabilities Report

Date: April 5, 2026

## Scope

This report compares Sherlock's current research workspace agent capabilities against tldraw's official Agent Starter Kit and evaluates the best path for Sherlock's next iteration.

Version note verified in this checkout on April 5, 2026:

- current branch: `main`
- current local dependency: `tldraw ^3.15.6`
- implication: Sherlock's current production-oriented mainline is on tldraw 3.x, while the official Agent Starter Kit is part of tldraw's 4.x starter-kit era

Primary local anchors reviewed:

- `src/components/features/WorkspaceBoard/index.tsx`
- `src/services/workspace/boardAi.ts`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- `src/services/chat/runtime.ts`
- `src/services/providers/index.ts`
- `src/types/index.ts`
- `docs/operations/architecture.md`

Primary official sources reviewed:

- tldraw Agent Starter Kit docs: <https://tldraw.dev/starter-kits/agent>
- official starter repository: <https://github.com/tldraw/agent-template>
- tldraw AI integrations docs: <https://tldraw.dev/docs/ai>
- tldraw v3.15.0 release notes: <https://tldraw.dev/releases/v3.15.0>
- tldraw v4.0.0 release notes: <https://tldraw.dev/releases/v4.0.0>

## Executive Summary

Sherlock is not currently running a board-native agent in the same sense as the official tldraw agent starter.

What Sherlock has today is a board-aware, manual-first AI assist layer:

- the board persists well
- the workspace has strong canonical data models
- chat already has grounded retrieval, streaming, persistence, and auditable actions
- the board can summarize a selected set of workspace-linked items and draft a note card from that selection

What tldraw's official starter has is a real canvas agent framework:

- prompt-part based visual context assembly
- an action registry for direct canvas manipulation
- a multi-step agentic loop with scheduling
- streamed partial action execution
- todo tracking, viewport movement, and optional external API actions

So the gap is material if the target is "an agent that works the board." Sherlock is several architectural layers short of that target today.

At the same time, Sherlock is ahead of the official starter in areas that matter for this product:

- canonical workspace data and provenance
- persisted workspace/chat/action history in SQLite
- cross-surface integration across chat, timeline, graph, reports, and board
- a shared multi-provider router already used by the rest of the product
- a static-hosted, browser-local BYOK deployment model

Bottom line:

- Sherlock is behind on board-native agent mechanics
- Sherlock is ahead on product-grade research workspace foundations
- the best path is not a clean rewrite and not a pure from-scratch board-agent build
- the best path is a hybrid: adopt the official tldraw agent architecture patterns, but integrate them into Sherlock's workspace, persistence, and provider system
- because `main` is currently on `tldraw ^3.15.6`, that hybrid should be planned as a two-track effort:
  - near-term on 3.x: borrow concepts selectively and build Sherlock-native seams
  - later on 4.x: converge more directly on the official starter architecture once the production branch is ready to move

## What Sherlock Actually Has Today

### 1. The board is a canonical workspace surface, not an agent runtime

Sherlock's board is a routed `tldraw` workspace with separate persistence for board documents and canonical workspace items.

Evidence:

- `WorkspaceBoard` persists snapshots through `saveWorkspaceBoardDocument(...)` using `getSnapshot(editor.store)`.
- `WorkspaceBoard`, `WorkspaceBoardDocument`, `WorkspaceItem`, chat sessions/messages/actions, and workspace backup payloads are first-class types in `src/types/index.ts`.
- `docs/operations/architecture.md` explicitly describes the board as a manual-first board surface, not an autonomous board agent.

This is a strong foundation for product integration, but it is not yet a generalized agent execution model.

### 2. Board AI is currently selection-to-draft, not action-to-canvas

The current board AI surface is intentionally narrow.

`src/services/workspace/boardAi.ts` shows:

- `generateBoardSelectionDraft(...)` calls `chatWithProviderRouter(...)`
- the prompt is based on selected workspace entries
- output is only a text draft
- the result is either shown as a summary or converted into a canonical `WorkspaceItem` note

`src/components/features/WorkspaceBoard/index.tsx` shows two board AI entry points only:

- `Summarize Selection`
- `Draft Note Card`

The UI text makes the constraint explicit:

> AI actions stay manual-first. Sherlock only uses the items you selected and never reorganizes the board without an explicit command.

That is a deliberate product choice, not a missing wire.

### 3. Board items are stock tldraw shapes with Sherlock reference metadata

Sherlock places canonical entries on the board by creating standard `geo` shapes and attaching a serialized Sherlock reference into shape metadata.

This is important:

- it keeps board shapes linked back to canonical records
- it avoids introducing a second persistence universe
- but it also means Sherlock is not yet modeling board-native custom shapes for agent manipulation

Today the board mostly places formatted cards. It does not yet expose a schema of custom Sherlock shapes to a model the way the official starter expects.

### 4. Sherlock's strongest agentic system is currently chat, not the board

Sherlock already has a bounded, auditable agent/tool layer in chat:

- workspace retrieval
- fetch artifact summary
- fetch full artifact text
- fetch recent signals
- create artifact draft
- append note to artifact
- create follow-up run

That system is persisted and grounded:

- chat sessions, messages, attachments, and actions are stored
- `WorkspaceSearchRepository` builds a deterministic context bundle from reports, sections, evidence, entities, sources, signals, and workspace items
- the provider router already supports both non-streaming and streaming chat

This matters because Sherlock already solved many of the hard product problems that the official starter does not try to solve.

## What The Official tldraw Starter Actually Provides

## 1. It is a full board-agent framework, not just a demo button

Per the official docs and repo, the starter ships with:

- create, update, and delete shape actions
- pen drawing
- group operations like rotate, resize, align, distribute, stack, reorder
- thought/message actions
- todo list management
- viewport movement
- follow-up scheduling
- example external API actions

This is materially broader than Sherlock's two current board AI buttons.

## 2. Its core abstraction is "what the agent can see" plus "what it can do"

The official architecture is built around:

- prompt parts
- agent actions
- mode definitions

In the current starter repo this lives in `client/modes/AgentModeDefinitions.ts`, where the `working` mode explicitly declares:

- prompt parts such as screenshot, viewport bounds, selected shapes, blurry shapes, peripheral shapes, chat history, todo list, user action history, and canvas lints
- action types such as create, update, delete, move, rotate, resize, align, distribute, stack, set view, think, review, and todo updates

This is the biggest architectural difference from Sherlock today.

Sherlock currently has:

- workspace retrieval assembly
- selection-based prompt construction

Sherlock does not currently have:

- a board prompt-part registry
- a board action registry
- a board mode system

## 3. The starter runs a real multi-step agentic loop

The `TldrawAgent` class in the official starter does several things Sherlock does not currently do on the board:

- assembles prompt parts for the active mode
- sends a request
- streams partial actions
- applies action diffs to the editor
- sanitizes incoming actions
- can schedule follow-up work
- can interrupt, cancel, and reset

This is not just "call a model and place a note." It is a continuous board-operating loop.

## 4. The starter already has multi-provider model support

The official starter's `AgentService` uses Vercel AI SDK providers for:

- Anthropic
- Google
- OpenAI

The model registry is small but clean, and the worker streams structured actions rather than plain chat text.

## 5. The starter's persistence and deployment assumptions differ from Sherlock

This is where the official starter is weaker for Sherlock's product shape.

By default, the starter:

- persists agent state in `localStorage`
- uses a Cloudflare Worker and Durable Object for the `/stream` endpoint
- assumes provider keys are available to that worker via `.dev.vars`

That is a meaningful mismatch with Sherlock's current product posture:

- Sherlock is currently a static Vite app
- data persists in browser-local SQLite over IndexedDB
- provider keys are BYOK and browser-local
- the product already avoids requiring a server runtime for the main app

## Version-Specific Guidance: Sherlock On tldraw 3.x

This is the most important planning update after verifying the current dependency.

### 1. The official Agent Starter Kit is a 4.x-era path, not a 3.x drop-in

Official release notes show:

- tldraw `v3.15.0` introduced `npm create tldraw`, but only says it creates starter templates
- tldraw `v4.0.0` is the release that explicitly introduced the starter kits, including `agent`

Implication:

- on Sherlock's current `main` branch with `tldraw ^3.15.6`, we should not plan on directly dropping in the official starter kit unchanged
- we should expect some adaptation work if copying concepts or code from the current official starter

### 2. Current official tldraw AI guidance points to the Agent Starter Kit for full canvas agents

The current tldraw AI docs describe three AI approaches and point to the Agent Starter Kit for full agent control of the canvas.

Implication:

- the official long-term direction is clear
- but that long-term direction is aligned with the 4.x starter architecture, not Sherlock's present 3.x production line

### 3. What changes for Sherlock's plan on 3.x

The recommendation direction does not change, but the implementation sequencing does.

On 3.x, the safest path is:

- treat the official starter as a reference architecture
- adopt the concepts that are version-agnostic:
  - prompt-part style context assembly
  - action registries
  - action sanitization
  - multi-step request lifecycle
  - structured streaming contracts
- avoid planning a literal import of starter-kit code into `main` without a compatibility pass

### 4. Practical consequence

For Sherlock's currently deployed 3.x line, the best move is not:

- "replace our board with the official starter"

It is:

- "make Sherlock's board-agent architecture look more like the official starter while remaining Sherlock-native and 3.x-compatible"

### 5. What likely waits for the 4.x branch

The following items should be considered easier and cleaner on the existing 4.x branch than on current `main`:

- deeper direct reuse of starter-kit modules or patterns
- closer API parity with the current official agent utilities
- faster convergence with upstream examples and docs

That does not block progress on 3.x. It just means the cleanest full-autonomy implementation should be designed with the 4.x branch in mind, even if some groundwork lands earlier on `main`.

## Gap Analysis

### Area 1: Board-native agent operations

Sherlock status:

- not present as a general system
- only summary and note generation from selected canonical entries

Official starter status:

- fully present
- actions are first-class and modular

Assessment:

- this is the largest gap

### Area 2: Visual board context

Sherlock status:

- no screenshot prompt path
- no blurry/focused/peripheral board-shape representations for the model
- no board-specific context packing beyond the selected canonical entries

Official starter status:

- screenshot + viewport + shapes + peripheral clusters + selection + recent user actions + chat history + lints

Assessment:

- Sherlock is far behind here if the goal is true board reasoning

### Area 3: Multi-turn looping and scheduling

Sherlock status:

- absent on the board
- present in a limited sense in chat workflows, but not as a board execution loop

Official starter status:

- core feature
- the agent can schedule follow-up requests and continue working

Assessment:

- major gap

### Area 4: Grounded workspace knowledge

Sherlock status:

- very strong
- deterministic workspace retrieval across reports, evidence, sections, signals, entities, sources, and workspace items

Official starter status:

- generic board context only
- excellent visual grounding, minimal domain grounding

Assessment:

- Sherlock is ahead here for this product

### Area 5: Persistence, provenance, and auditability

Sherlock status:

- very strong
- SQLite-backed chat sessions, chat actions, workspace items, boards, board documents, export/import

Official starter status:

- localStorage agent state by default
- no Sherlock-style canonical object graph or audit trail

Assessment:

- Sherlock is ahead here

### Area 6: Provider and model integration

Sherlock status:

- very strong general router for the app
- supports Gemini, OpenRouter, OpenAI, Anthropic
- already handles chat streaming

Official starter status:

- strong for the starter itself
- Anthropic, Google, OpenAI via AI SDK
- built specifically for streaming board actions

Assessment:

- Sherlock is ahead on product-wide provider uniformity
- the official starter is ahead on board-agent-specific transport and structured action streaming

### Area 7: Deployment fit

Sherlock status:

- static-host-friendly
- browser-local BYOK

Official starter status:

- assumes worker/server infrastructure for the agent transport

Assessment:

- a literal rewrite onto the official deployment model would be a practical regression for this project unless you want to change the product's deployment stance

## Can Sherlock Use Its Existing Multi-Provider System?

Short answer: yes, but not unchanged.

The official starter expects a streaming action transport that emits structured agent actions over time. Sherlock's current provider router streams assistant text for chat, not board actions.

That means Sherlock can reuse the current provider system if we add a new board-agent capability layer, for example:

- a new provider operation like `BOARD_AGENT`
- a new adapter method such as `streamBoardAgent(...)`
- a board-agent response contract that emits structured action deltas instead of plain text deltas

Technically this is very feasible because Sherlock already has:

- provider selection
- key management
- model capability routing
- streaming plumbing patterns
- grounded context assembly patterns

What does not exist yet is the board-agent contract itself.

Recommendation:

- keep Sherlock's provider system as the long-term single source of truth
- do not create a second permanent provider/config subsystem just for the board agent
- if an early spike needs to borrow the official AI SDK worker path to move fast, treat that as temporary scaffolding, not the final architecture

Version-specific note for current `main`:

- this recommendation is even stronger on `tldraw ^3.15.6`
- because the official starter is not a literal 3.x fit, Sherlock's own provider router is the most stable place to standardize board-agent behavior while main remains on 3.x

## Rewrite vs Extend vs Merge

### Option A: Rewrite the current board agent around the official starter

What this means:

- replace Sherlock's board AI approach with the official tldraw agent stack as the primary implementation
- likely inherit the official prompt/action/mode architecture directly
- possibly adopt the worker/Durable Object path too

Technical upsides:

- fastest path to true board-native agent capabilities
- closest alignment with upstream tldraw agent patterns
- easiest way to inherit future tldraw agent improvements

Technical downsides:

- poor fit with Sherlock's current static/BYOK architecture
- likely duplicates provider config/key logic unless heavily adapted
- risks sidelining Sherlock's canonical workspace model in favor of generic canvas operations
- would require rebuilding bridges back to workspace items, artifacts, chat, timeline, and provenance

Practical upsides:

- clear story
- easier to explain as "we use the official tldraw agent stack"

Practical downsides:

- bigger migration
- higher disruption
- likely changes product behavior more than needed

Recommendation:

- do not choose a full rewrite as the primary plan

### Option B: Keep Sherlock's current approach and flesh it out from scratch

What this means:

- keep the current board surface and build board-agent mechanics natively inside Sherlock without borrowing much from the official starter

Technical upsides:

- best fit with Sherlock's current architecture
- easy to preserve canonical data, provenance, and BYOK deployment model

Technical downsides:

- re-implements solved design work from the official starter
- higher design risk
- slower path to parity
- easier to end up with a one-off board agent that drifts from tldraw's evolving patterns

Practical upsides:

- minimal disruption to current code

Practical downsides:

- more bespoke maintenance burden
- less leverage from upstream examples/docs/community

Recommendation:

- only choose this if the product intentionally wants to remain much more constrained than the official board-agent model

### Option C: Merge the official agent architecture into Sherlock's product architecture

What this means:

- keep Sherlock's workspace, persistence, provenance, router, and board surface
- adopt the official starter's agent concepts where they help most:
  - prompt parts
  - action utils
  - mode definitions
  - action sanitization
  - scheduling
  - visual context packing
  - structured action streaming

Technical upsides:

- best long-term fit
- preserves Sherlock's strongest product foundations
- gets Sherlock much closer to official board-agent capabilities
- avoids a second permanent provider stack if integrated carefully

Technical downsides:

- more integration design up front
- requires a translation layer between Sherlock canonical references and board actions
- still needs a board-agent provider contract to be added to Sherlock

Practical upsides:

- lets Sherlock become more uniform without throwing away working product infrastructure
- reduces risk of board-agent work living as a disconnected sidecar

Practical downsides:

- not as fast as a literal drop-in
- requires more discipline around boundaries

Recommendation:

- this is the best choice for Sherlock

## Recommended Direction For Sherlock

## Recommendation 1: Do not rewrite the board around the official starter wholesale

The official starter is the right reference architecture, but not the right literal app architecture for Sherlock.

The biggest reason is deployment and persistence fit:

- Sherlock already has a product-grade local-first system
- the official starter is optimized as a generic board-agent starter, not as a local-first research workspace product
- the current production branch is on `tldraw ^3.15.6`, so a wholesale rewrite would also create unnecessary version pressure

## Recommendation 2: Make Sherlock's board agent more official in architecture, not more official in hosting assumptions

Borrow these ideas directly:

- prompt parts for board context
- action utils for board operations
- mode definitions
- scheduling and interrupt patterns
- action sanitization helpers
- structured action streaming

Do not inherit these blindly:

- Cloudflare Worker as a permanent requirement
- localStorage as the primary durable memory model
- a separate provider config stack from Sherlock's existing router

## Recommendation 3: Keep canonical workspace data as the source of truth

Sherlock should not become "generic tldraw plus AI."

The board agent should remain grounded in:

- workspace items
- artifacts
- evidence
- signals
- provenance
- chat actions
- follow-up runs

The board should stay a projection and composition surface over canonical Sherlock records.

This strongly suggests a hybrid action model:

- some actions manipulate board layout directly
- some actions create or update canonical Sherlock records and then optionally place them on the board

## Recommendation 4: Add board-agent support to the existing provider router

If uniformity is preferred, this is the right direction.

Recommended shape:

1. Add a new provider-router operation for structured board-agent streaming.
2. Reuse existing provider/model selection and key management.
3. Keep the board agent's model choices within the same `SystemConfig` and router ecosystem.
4. Let board-agent sessions optionally persist beside existing chat/action history instead of building a disconnected memory silo.

## Recommendation 5: Build the first real board-agent release in phases

### Phase 1: Read-only board intelligence

Goal:

- give the model official-style board context without letting it mutate the board yet

Include:

- screenshot prompt part
- selected-shapes prompt part
- board-shape summaries
- viewport and bounds prompt parts
- richer Sherlock context parts for linked canonical records

Why first:

- low risk
- validates context quality before board mutation

### Phase 2: Safe board mutation actions

Goal:

- let the agent do low-risk board operations

Include:

- place reference card
- move linked card
- align/distribute selected linked cards
- create board note
- set viewport / focus area

Why second:

- gives visible board-native utility
- still stays compatible with manual-first expectations

### Phase 3: Mixed canonical-plus-board actions

Goal:

- let the agent create Sherlock-native objects, then place or link them

Include:

- create workspace note
- promote excerpt
- attach artifact summary card
- create follow-up task/run from board context

Why third:

- this is where Sherlock becomes more than a generic board agent

### Phase 4: Multi-step agentic loop

Goal:

- allow scheduling, review passes, and todo tracking

Guardrails:

- keep explicit visibility into actions
- keep cancellation easy
- consider whether some classes of actions should still require user confirmation

### Phase 0: Version-aware preparation

Goal:

- make the autonomy plan safe across the current 3.x production branch and the existing 4.x branch

Include:

- define a Sherlock-native board-agent contract independent of specific tldraw starter-kit files
- identify which current board interactions are pure editor API usage versus 4.x-specific assumptions
- keep persistence and provider contracts version-agnostic where possible
- treat 3.x `main` as the stabilization and seam-building line
- treat the 4.x branch as the likely target for closest official-agent convergence

Why first:

- it prevents us from designing the autonomy model around the wrong branch

## User Decisions Recorded

The following decisions were provided after the initial report and should now be treated as settled planning constraints unless changed later:

- autonomy target: full autonomy
- hosting/runtime posture: stay BYOK
- board intelligence target: both generic board capability and Sherlock-aware capability, with Sherlock-aware behavior preferred
- robustness target: robust in either direction, not a fragile one-path implementation
- memory/audit target: unified
- product direction: Sherlock-native experience using official tldraw capabilities where appropriate

Interpretation for planning:

- full autonomy is desired as the destination state, not a manual-first ceiling
- BYOK remains non-negotiable, so provider/backend choices should preserve that posture
- the board agent should understand generic canvas operations, but Sherlock-aware objects and workflows should be first-class
- the system should not fork into unrelated "generic board agent" and "Sherlock agent" codepaths unless there is a clear boundary
- board and chat should eventually feel like one agent system with one provenance story

## My Recommendation In One Sentence

Merge, but do it asymmetrically:

- use the official tldraw starter as the board-agent architecture reference
- keep Sherlock's workspace, provider, persistence, and provenance systems as the product backbone

## Updated Planning Answers

### 1. Full autonomy

Decision:

- yes

Planning consequence:

- the roadmap should target a real board-operating agent loop, not stop at assistant buttons
- however, it is still reasonable to stage the rollout through safer action classes first

Recommendation:

- design for full autonomy now, ship progressively

### 2. Stay BYOK

Decision:

- yes

Planning consequence:

- do not introduce a mandatory server-side provider orchestration layer as the primary architecture
- keep provider integration aligned with Sherlock's current client-side/router-centric model

Recommendation:

- board-agent support should be added to Sherlock's existing provider ecosystem

### 3. Both generic and Sherlock-aware capability, with Sherlock-aware preferred

Decision:

- both, with Sherlock-native behavior preferred

Planning consequence:

- the agent should understand ordinary board operations
- but its highest-value actions should operate on linked Sherlock records, not just anonymous shapes

Recommendation:

- implement a layered action model:
  - generic canvas actions
  - Sherlock-linked board actions
  - canonical workspace actions that can project back onto the board

### 4. Unified memory and auditability

Decision:

- yes

Planning consequence:

- board-agent work should not become an isolated memory silo
- provenance, audit trails, and continuity should line up with chat and workspace history

Recommendation:

- use a unified action/provenance model, even if the UI initially exposes board history separately

### 5. Sherlock-native, but using official tldraw capabilities where appropriate

Decision:

- yes

Planning consequence:

- the official starter should guide primitives and architecture
- Sherlock should still own product semantics, persistence, and cross-surface workflows

Recommendation:

- merge official capability patterns into Sherlock-native product architecture

## Final Judgment

Sherlock is currently much closer to a board-grounded research assistant than to the official tldraw board agent.

That is not a failure. It reflects a different product priority:

- Sherlock optimized first for grounded workspace knowledge, persistence, provenance, and cross-surface workflow
- tldraw optimized first for direct board agency

For Sherlock's next step, the smartest move is to converge those two strengths rather than replace one with the other.

## Sources

- tldraw Agent Starter Kit docs: <https://tldraw.dev/starter-kits/agent>
- tldraw AI integrations docs: <https://tldraw.dev/docs/ai>
- tldraw official agent template: <https://github.com/tldraw/agent-template>
- tldraw v3.15.0 release notes: <https://tldraw.dev/releases/v3.15.0>
- tldraw v4.0.0 release notes: <https://tldraw.dev/releases/v4.0.0>
