# Research Workspace Agent Plan

Date: 2026-04-05
Status: In Progress

## Implementation Update

Completed on April 5, 2026 in the current codebase:

- Stream 0 groundwork is now in place through Sherlock-owned board-agent domain and context modules under `src/services/workspace/agent/*`
- Stream 1 foundations are now implemented with persisted `board_agent_sessions` and `board_agent_actions`, repository support, store integration, and workspace backup/restore coverage
- Stream 2 is now implemented for the current planning slice with:
  - board snapshot parsing independent of React editor bindings
  - bounded prompt-part context assembly for request, viewport, selection, visible shapes, peripheral clusters, linked records, and recent board-agent history
  - a reusable board-agent runtime wrapper that converts board state into provider-ready requests
  - focused tests for repository, store/backup wiring, and context packing
- Stream 3 is now implemented for planning mode with:
  - provider-router `BOARD_AGENT` request support
  - provider adapter methods for Gemini, OpenRouter, OpenAI, and Anthropic
  - explicit structured action normalization plus streaming action/message events via a Sherlock-owned tagged protocol
  - reuse of the existing BYOK config, model routing, retry, and logging paths
- Streams 4 through 6 are now implemented for the first executing/autonomous pass with:
  - a Sherlock-owned board-agent action registry plus sanitization/execution layer under `src/services/workspace/agent/actions/*`
  - safe board execution bindings for viewport changes, linked-card placement, movement, alignment, grouping, connectors, and board-note creation
  - Sherlock-aware canonical actions for workspace notes, promoted excerpts, artifact drafts, artifact append flows, and follow-up investigation launches
  - multi-step board-agent session runtime with persisted action status updates, todo lifecycle, explicit follow-up/review scheduling, and cancellation support
  - board-side inspector UX for request entry, live status/message streaming, todo display, and recent action audit history in `src/components/features/WorkspaceBoard/index.tsx`

Remaining near-term work after this checkpoint:

- richer board-agent UI polish and session browsing beyond the latest-session inspector surface
- broader action coverage and deeper repair loops beyond the initial safe/canonical set
- follow-up heuristics and recovery refinements beyond the explicit schedule/review actions now implemented

## Objective

Implement a Sherlock-native research workspace agent on `main` that:

- targets full autonomy as the end state
- stays compatible with Sherlock's current `tldraw ^3.15.6` production branch
- preserves Sherlock's BYOK posture
- keeps memory, provenance, and auditability unified across board and chat
- prefers Sherlock-aware actions and linked records over generic anonymous board automation
- borrows the official tldraw agent architecture where it helps, without depending on a wholesale 4.x starter-kit migration

This plan is the follow-on to:

- [research workspace agent report](C:\Users\james\projects\sherlock\docs\reports\2026-04-05-research-workspace-agent-report.md)
- [CURRENT_STATUS](C:\Users\james\projects\sherlock\docs\reports\CURRENT_STATUS.md)
- [architecture](C:\Users\james\projects\sherlock\docs\operations\architecture.md)

## Version Boundary

This plan is explicitly for the current `main` branch baseline.

Verified local reality on April 5, 2026:

- branch: `main`
- `package.json` dependency: `tldraw ^3.15.6`

Planning implication:

- do not treat the official tldraw Agent Starter Kit as a drop-in implementation target for this plan
- do treat the official starter as the reference architecture for:
  - prompt-part based context assembly
  - action registries
  - action sanitization
  - multi-step request lifecycle
  - scheduling and follow-up work
  - structured action streaming

This plan intentionally avoids depending on Sherlock's separate 4.x branch.

## Decisions Locked In

The following are treated as settled decisions for this plan.

### 1. Full autonomy is the target

Interpretation:

- the system should ultimately be capable of acting on the board over multiple steps without the user issuing a new manual command for every micro-action
- phased rollout is still acceptable, but the architecture should not be capped at manual-first assistant buttons

### 2. Sherlock stays BYOK

Interpretation:

- do not require a permanent server-side provider orchestration layer to use the board agent
- keep provider/model/key handling aligned with Sherlock's current client-side and browser-local posture

### 3. The agent should support both generic board work and Sherlock-aware work

Interpretation:

- the agent should understand standard board operations such as placement, movement, alignment, grouping, and viewport control
- the higher-value path remains Sherlock-aware behavior tied to canonical records, provenance, and workspace workflows

### 4. Memory and auditability should be unified

Interpretation:

- board agent actions should not live in a disconnected memory silo
- users should be able to understand what the system saw, what it did, and what records changed

### 5. The implementation should be Sherlock-native while using official tldraw capability patterns

Interpretation:

- do not build a generic tldraw demo inside Sherlock
- do not ignore the official tldraw agent architecture and reinvent the wrong primitives

## Problem Statement

Sherlock currently has board AI assistance, but not a true board-native agent.

Current board behavior on `main`:

- summarize selected linked items
- draft a note card from selected linked items
- create board cards as standard `tldraw` shapes carrying Sherlock reference metadata
- persist board documents and canonical workspace records separately

Current missing capabilities:

- board-specific prompt-part system
- board-specific action registry
- multi-step autonomous board loop
- visual board context packaging for the model
- structured board-action streaming through Sherlock's provider system
- unified board-agent action persistence and replay

## Product Goal

The finished system should make Sherlock's board feel like a real research operator, not just a note-drafting helper.

Representative outcomes:

- "organize these sources and excerpts into a working cluster"
- "review this section of the board and annotate contradictions"
- "pull the relevant workspace materials, place the key records, and build a first-pass map"
- "create a board note, tie it back to the source artifact and chat context, then queue a follow-up run"
- "scan the current canvas state and continue refining until the task is complete"

The board agent should remain meaningfully Sherlock-aware:

- canonical items remain the durable source of truth
- board manipulations should preserve or enrich provenance where possible
- cross-surface navigation should remain intact

## Guiding Principles

- Build on `main` and remain compatible with `tldraw ^3.15.6`.
- Prefer version-agnostic agent architecture over version-specific starter-kit copy/paste.
- Keep canonical Sherlock records distinct from board-document state.
- Preserve one provider ecosystem, not a second permanent agent-only provider stack.
- Keep board and chat provenance converged.
- Ship in progressive slices, but design the runtime for eventual autonomy from the start.
- Avoid magical hidden writes; even in autonomous mode, actions should be inspectable and attributable.
- Prefer explicit, narrow contracts over loose generic "AI tools" abstractions.

## Architectural Decision

### What We Are Choosing

We are choosing a Sherlock-native board-agent architecture with official-inspired primitives.

That means:

- a board-specific context assembly layer
- a board-specific action layer
- a board-agent request lifecycle with scheduling and cancellation
- structured board-action streaming through Sherlock's provider router
- persistence and provenance integrated with existing workspace/chat systems

### What We Are Not Choosing

We are not choosing:

- a literal import of the official 4.x starter kit into `main`
- a permanent Cloudflare Worker or Durable Object dependency as the product architecture
- a separate provider/key/config subsystem for board automation
- a board-only memory model disconnected from chat history and workspace actions
- a generic autonomous canvas bot that ignores Sherlock's canonical object model

## Target End State

By the end of this initiative, Sherlock should have:

- a first-class board-agent runtime on `main`
- prompt-part based board context assembly
- a registry of board actions with validation and sanitization
- board-agent streaming support in the existing provider router
- persisted board-agent sessions or actions aligned with existing chat/action auditability
- a layered action model:
  - generic canvas actions
  - Sherlock-linked board actions
  - canonical workspace actions that may project onto the board
- end-to-end flows from board context into:
  - workspace notes
  - promoted excerpts
  - artifact-linked board notes
  - follow-up runs
  - cross-surface navigation

The resulting system should support both:

- autonomous board composition and refinement
- explicit user-facing review of what the agent did

## Core Runtime To Introduce

## 1. Board Agent Request Model

Recommended new internal concepts:

- `BoardAgentSession`
- `BoardAgentRequest`
- `BoardAgentAction`
- `BoardAgentContextSnapshot`

Responsibilities:

- represent the active board-task lifecycle
- capture what the user asked
- capture what context was assembled for the model
- persist what actions were performed
- allow cancellation, resumption, and follow-up scheduling

Important design note:

- this does not need to replace current `ChatSession`
- but it should align with it closely enough that audit and provenance can unify over time

## 2. Board Prompt Parts

Recommended board prompt-part categories:

- user request
- selected board shapes
- viewport bounds
- current visible board shapes
- off-screen cluster summaries
- Sherlock-linked context for selected or visible references
- recent user board actions
- prior board-agent actions
- board todo list
- system mode and model metadata

Important local constraint on `main`:

- define these as Sherlock-owned abstractions first
- do not tightly couple them to 4.x-only starter-kit internals

## 3. Board Action Registry

Recommended action classes:

### Generic board actions

- place shape/card
- move shape/card
- align selection
- distribute selection
- resize selection
- group or frame cluster
- set viewport
- create connector

### Sherlock-linked board actions

- place canonical item on board
- create linked board note
- update linked board note
- attach artifact summary card
- attach headline/signal card
- cluster related linked items

### Canonical workspace actions

- create workspace note
- promote excerpt
- create artifact draft from board work
- create follow-up run
- append board note into artifact

### Control and planning actions

- think
- message
- update todo
- schedule follow-up
- review a region

## 4. Action Sanitization Layer

Every board action should pass through explicit sanitization before execution.

Required behavior:

- verify linked references still exist
- prevent writes to missing or incompatible objects
- normalize bounds and coordinates
- resolve selected shapes safely
- reject stale actions against a changed board when necessary
- enforce readonly and presentation constraints if those remain relevant

## 5. Unified Provenance and Audit Trail

Board-agent actions should be inspectable with the same seriousness as chat actions.

Minimum requirements:

- action type
- input payload
- normalized/sanitized payload
- result payload
- affected canonical ids
- affected board ids
- timestamps
- provider/model metadata
- source request/session linkage

## Execution Streams

This plan is intentionally split into seven streams.

- Stream 0: Main-branch-compatible groundwork
- Stream 1: Board-agent domain model and persistence
- Stream 2: Board context assembly system
- Stream 3: Provider-router board-agent streaming path
- Stream 4: Safe board action execution
- Stream 5: Sherlock-aware canonical actions
- Stream 6: Full autonomy loop, review, and polish

## Stream 0: Main-Branch-Compatible Groundwork

### Goal

Define Sherlock's board-agent seams in a way that is safe on the current `tldraw ^3.15.6` mainline.

### Success Criteria

- the board-agent architecture is defined in Sherlock-owned modules
- no core runtime contract depends on importing the 4.x official starter directly
- the plan identifies version-sensitive versus version-agnostic implementation areas

### Scope

This stream includes:

- interface design
- module boundaries
- naming and contract groundwork
- version-compatibility checks against current board behavior

This stream does not aim to:

- expose user-facing autonomy yet

### Work Breakdown

#### 1. Define Sherlock-owned board-agent types

Status: Completed on April 5, 2026.

Primary files:

- `src/types/index.ts`
- new `src/services/workspace/agent/*`

Add concepts for:

- board-agent sessions
- board-agent actions
- board-agent request states
- board-agent context parts
- board-agent result envelopes

#### 2. Separate version-agnostic logic from editor-specific bindings

Status: Initial completion on April 5, 2026.

Primary files:

- new `src/services/workspace/agent/*`
- `src/components/features/WorkspaceBoard/*`

Rules:

- context packing logic should not depend on direct UI code
- provider payload shaping should not depend on `tldraw` component files
- execution adapters can depend on the live editor

#### 3. Inventory current board operations that already work on 3.x

Status: Completed in implementation notes and local code review on April 5, 2026.

Primary local anchors:

- `src/components/features/WorkspaceBoard/index.tsx`
- `src/services/workspace/boardAi.ts`

Use this inventory to avoid solving the wrong problem first.

## Stream 1: Board-Agent Domain Model And Persistence

### Goal

Add the persisted domain needed to track autonomous board work without fragmenting the current workspace memory model.

### Success Criteria

- board-agent runs or sessions persist
- board-agent actions persist
- affected canonical and board references are recorded
- board-agent data fits into workspace backup/restore expectations

### Scope

This stream includes:

- type additions
- schema additions
- repositories
- store integration

This stream does not aim to:

- complete the context system
- complete streaming execution

### Work Breakdown

#### 1. Extend types

Status: Completed on April 5, 2026.

Primary files:

- `src/types/index.ts`

Recommended additions:

- `BoardAgentSession`
- `BoardAgentActionType`
- `BoardAgentActionStatus`
- `BoardAgentAction`
- `BoardAgentContextSnapshot`

#### 2. Extend SQLite schema

Status: Completed on April 5, 2026.

Primary files:

- `src/services/db/schema.ts`
- `src/services/db/client.ts`
- `src/services/db/migrations_sql.ts`

Recommended new tables:

- `board_agent_sessions`
- `board_agent_actions`

Potential later table:

- `board_agent_context_snapshots`

#### 3. Add repositories

Status: Completed on April 5, 2026.

Primary files:

- new `src/services/db/repositories/BoardAgentRepository.ts`

Responsibilities:

- create and update sessions
- create and list actions
- fetch action history for a session or board
- resolve recent board-agent history for prompt context

#### 4. Integrate into workspace backup model if needed

Status: Completed on April 5, 2026.

Primary files:

- `src/services/maintenance/workspaceData.ts`
- `docs/operations/DATA_PERSISTENCE.md`

Decision point:

- either include board-agent data directly in workspace backup payloads
- or document why it remains derived/reconstructible

Recommendation:

- persist it in backups if it becomes user-meaningful audit data

## Stream 2: Board Context Assembly System

### Goal

Give the model the visual and structured board context it needs to reason effectively on current `main`.

### Success Criteria

- board requests include structured context parts
- context is bounded and intentional
- the system can represent both generic board state and Sherlock-linked state

### Scope

This stream includes:

- board context part definitions
- context builders
- board snapshot summarization
- Sherlock-linked reference hydration

This stream does not aim to:

- mutate the board yet

### Work Breakdown

#### 1. Add board prompt-part definitions

Status: Completed for the current planning slice on April 5, 2026.

Primary files:

- new `src/services/workspace/agent/context/*`

Recommended parts:

- request messages
- viewport bounds
- selection summary
- visible shape summary
- peripheral cluster summary
- linked canonical record summary
- recent board-agent history
- recent user board actions
- todo list

#### 2. Add screenshot support if feasible on current 3.x stack

This needs careful local validation on `main`.

If screenshot capture is clean on 3.x:

- include it as a first-class part

If not:

- do not block the plan
- prioritize structured context and shape summaries first

#### 3. Build linked Sherlock context hydration

Status: Completed for the current planning slice on April 5, 2026.

Primary files:

- `src/services/workspace/library.ts`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`
- new board-agent context builders

The board agent should be able to see:

- canonical item title and type
- rich context text
- artifact summaries and sections
- evidence and source hints
- signal/headline context
- provenance and related links where useful

#### 4. Bound context size explicitly

Status: Completed for the current planning slice on April 5, 2026.

Rules:

- do not dump the whole board blindly
- do not dump the whole workspace blindly
- prioritize selected and visible items first
- include peripheral awareness second
- include workspace retrieval support when needed

## Stream 3: Provider-Router Board-Agent Streaming Path

### Goal

Add a board-agent operation to Sherlock's existing multi-provider system.

### Success Criteria

- the provider router exposes a board-agent streaming path
- the event model supports structured action streaming
- BYOK remains intact
- provider choice remains uniform with the rest of the app

### Scope

This stream includes:

- provider types
- router expansion
- adapter contract changes
- streaming event envelope

This stream does not aim to:

- complete every action implementation yet

### Work Breakdown

#### 1. Add a board-agent provider operation

Status: Completed on April 5, 2026.

Primary files:

- `src/services/providers/types.ts`
- `src/services/providers/index.ts`

Recommended additions:

- provider operation such as `BOARD_AGENT`
- request type such as `BoardAgentRequest`
- response stream event type for structured actions

#### 2. Add adapter methods

Status: Completed on April 5, 2026.

Primary files:

- `src/services/providers/geminiProvider.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/anthropicProvider.ts`

Recommended adapter surface:

- `streamBoardAgent(...)`

Important design point:

- this should not be implemented as plain text chat and then reparsed informally in the UI
- the contract should be explicit about structured actions

#### 3. Reuse existing configuration and key handling

Status: Completed on April 5, 2026.

Rules:

- no second settings UI for the board agent
- no separate key store
- no separate model registry unless there is a clear technical need

#### 4. Decide rollout order

Status: Completed for the initial provider-agnostic planning pass on April 5, 2026.

Recommendation:

- implement the first board-agent streaming path on the provider with the best current reliability for structured actioning in Sherlock
- but keep the public contract provider-agnostic from day one

## Stream 4: Safe Board Action Execution

### Goal

Let the board agent carry out safe and inspectable board operations.

### Success Criteria

- the system can stream and execute low-risk board actions
- actions are sanitized before execution
- board mutations are persisted through existing board document flows
- users can inspect what the agent changed

### Scope

This stream includes:

- action registry
- sanitization
- execution bindings
- board-side inspection UI

This stream does not aim to:

- complete canonical write flows

### Work Breakdown

#### 1. Add the action registry

Status: Completed on April 5, 2026.

Primary files:

- new `src/services/workspace/agent/actions/*`

Recommended first action set:

- `MESSAGE`
- `THINK`
- `UPDATE_TODO`
- `SET_VIEWPORT`
- `PLACE_LINKED_CARD`
- `MOVE_SHAPES`
- `ALIGN_SHAPES`
- `DISTRIBUTE_SHAPES`
- `GROUP_SELECTION`
- `CREATE_CONNECTOR`
- `CREATE_BOARD_NOTE`

#### 2. Add action execution bindings against current 3.x editor APIs

Status: Completed on April 5, 2026.

Primary files:

- `src/components/features/WorkspaceBoard/index.tsx`
- new execution helpers under `src/services/workspace/agent/*`

Important rule:

- keep the execution layer thin and editor-bound
- keep higher-level decision logic out of the React component

#### 3. Add board-agent inspection affordances

Status: Completed on April 5, 2026.

Possible UI:

- current task indicator
- recent action log
- todo/status panel
- cancel button
- optional "why did you do this" message surface via `THINK` or `MESSAGE`

## Stream 5: Sherlock-Aware Canonical Actions

### Goal

Make the board agent valuable as a Sherlock product feature rather than a generic board bot.

### Success Criteria

- the board agent can create or update Sherlock-native records
- board actions can preserve provenance
- canonical actions can project back onto the board cleanly

### Scope

This stream includes:

- canonical note creation
- excerpt promotion
- artifact drafting
- follow-up run creation
- provenance-aware linking

### Work Breakdown

#### 1. Add canonical write actions

Status: Completed on April 5, 2026 for the initial Sherlock-aware action set.

Recommended actions:

- `CREATE_WORKSPACE_NOTE`
- `PROMOTE_EXCERPT`
- `ATTACH_ARTIFACT_SUMMARY`
- `CREATE_ARTIFACT_DRAFT`
- `APPEND_NOTE_TO_ARTIFACT`
- `CREATE_FOLLOW_UP_RUN`

#### 2. Reuse existing chat/runtime patterns where possible

Status: Completed on April 5, 2026 for the initial workspace-note, artifact, and follow-up paths.

Primary local anchors:

- `src/services/chat/runtime.ts`
- `src/services/workspace/promotions.ts`
- `src/services/workspace/library.ts`

Recommendation:

- do not duplicate save and follow-up logic if the chat implementation already solved it cleanly
- extract shared primitives where appropriate

#### 3. Preserve provenance rigor

Status: Initial completion on April 5, 2026 through persisted board-agent sessions/actions plus board-agent metadata on created records.

Every canonical write should capture:

- source board
- source session/request
- source agent action
- linked canonical refs used as grounding

## Stream 6: Full Autonomy Loop, Review, And Product Polish

### Goal

Complete the shift from assisted board actions to a real autonomous research workspace agent.

### Success Criteria

- the agent can operate over multiple steps
- the agent can schedule more work for itself
- the agent can review, refine, and continue
- the user can interrupt, cancel, and inspect the process

### Scope

This stream includes:

- follow-up scheduling
- region review
- board todo lifecycle
- long-running task UX
- polish and reliability work

### Work Breakdown

#### 1. Add scheduling and continuation support

Status: Completed on April 5, 2026 for explicit schedule/review driven continuation loops.

Capabilities:

- continue the current task without a new manual prompt
- review a region after placement
- revisit off-screen clusters
- queue canonical follow-up work after board composition

#### 2. Add review and repair loops

Status: Initial completion on April 5, 2026 through `REVIEW_REGION` follow-up passes and board-side review messaging.

Examples:

- "review the cluster you just made for missing evidence"
- "check if any placed notes are unsupported"
- "tighten spacing and annotate contradictions"

#### 3. Add robust interruption and failure handling

Status: Completed on April 5, 2026 for cancellation, terminal action-failure stopping, and persisted partial-completion audit traces.

Required behaviors:

- cancel safely
- stop on unrecoverable action errors
- surface partial completion clearly
- preserve audit traces of completed and failed actions

## Delivery Slices

Recommended slices for actual implementation order:

### Slice A: Foundations

- Stream 0
- Stream 1
- initial Stream 2

Outcome:

- persisted board-agent groundwork exists
- context system exists in read-only form

Status: Initial implementation completed on April 5, 2026.

### Slice B: First Executing Agent

- Stream 3
- initial Stream 4

Outcome:

- board agent can stream and execute low-risk board actions on `main`

Status: Partially complete on April 5, 2026.
What landed:

- Stream 3 provider-router planning and structured streaming
- Stream 4 execution registry, sanitization, editor bindings, and inspector task log/session UX

What remains:

- additional board-agent polish beyond the first safe/canonical action set

### Slice C: Sherlock-Aware Value

- Stream 5

Outcome:

- board agent becomes product-meaningful, not just layout-capable

Status: Initial implementation completed on April 5, 2026.

### Slice D: Full Autonomy

- Stream 6
- remaining Stream 2 and Stream 4 polish

Outcome:

- multi-step autonomous board operator

Status: Initial implementation completed on April 5, 2026.

## Recommended File And Module Direction

Likely new modules:

- `src/services/workspace/agent/index.ts`
- `src/services/workspace/agent/types.ts`
- `src/services/workspace/agent/context/*`
- `src/services/workspace/agent/actions/*`
- `src/services/workspace/agent/runtime.ts`
- `src/services/db/repositories/BoardAgentRepository.ts`

Likely touched existing modules:

- `src/components/features/WorkspaceBoard/index.tsx`
- `src/services/workspace/boardAi.ts`
- `src/services/workspace/library.ts`
- `src/services/chat/runtime.ts`
- `src/services/providers/index.ts`
- `src/services/providers/types.ts`
- provider adapters under `src/services/providers/*`
- `src/store/caseStore.ts`
- `src/types/index.ts`
- `src/services/maintenance/workspaceData.ts`

## Testing Strategy

Tests should land incrementally with each slice.

Recommended coverage:

- board-agent repository tests
- board-agent context packing tests
- provider-router board-agent contract tests
- action sanitization tests
- action execution tests for low-risk board operations
- provenance tests for canonical write actions
- store tests for session/action lifecycle

Validation expectation per non-trivial implementation slice:

```bash
npm run lint
npm run typecheck
npm run build
```

Run targeted tests for touched areas, for example:

```bash
npm run test -- src/store/caseStore.test.ts
npm run test -- src/services/chat/runtime.test.ts
npx eslint src/components/features/WorkspaceBoard/index.tsx src/services/workspace/agent
```

Run the full suite when changes become cross-cutting enough that targeted coverage would mislead.

## Documentation Follow-Through

When implementation begins landing, keep these docs aligned:

- `README.md`
- `docs/operations/architecture.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/reports/CURRENT_STATUS.md`

Update the plan status when a meaningful slice is complete.

## Risks

### 1. Designing too much around 4.x ideas that do not map cleanly to current `main`

Mitigation:

- keep Sherlock-owned abstractions at the center
- validate editor-binding assumptions locally on 3.x as implementation progresses

### 2. Splitting board autonomy into a disconnected subsystem

Mitigation:

- reuse provider, persistence, and provenance systems
- align naming and contracts with existing chat/runtime surfaces

### 3. Overbuilding generic board capability at the expense of Sherlock-native value

Mitigation:

- prioritize linked records, provenance, and cross-surface actions after the first safe board-action slice

### 4. Hidden autonomous writes reducing user trust

Mitigation:

- persist action logs
- expose current task status and recent actions
- keep cancellation easy
- preserve source linkage for canonical writes

### 5. Context bloat causing poor model performance

Mitigation:

- use explicit prompt parts
- favor selection and viewport first
- keep retrieval bounded
- summarize peripheral state rather than dumping it whole

## Non-Goals

- Do not move implementation work to the 4.x branch in this plan.
- Do not rewrite the board around the official starter wholesale.
- Do not introduce a mandatory backend-only provider orchestration model.
- Do not collapse canonical workspace records into board-document state.
- Do not build a generic "AI whiteboard" detached from Sherlock product semantics.

## Final Recommendation

Proceed on `main`.

The right move is to build the board-agent runtime here using Sherlock-native abstractions that borrow official tldraw agent concepts without depending on a 4.x migration. That gives Sherlock a credible path to full autonomy now, while preserving the product qualities that already make the current workspace stronger than a generic starter kit.
