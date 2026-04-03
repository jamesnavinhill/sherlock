# Sherlock Chat and Agent Interface Feasibility Report

Date: 2026-04-03

## Purpose

This report assesses the feasibility of adding a focused chat and agent experience to Sherlock so users can:

- chat naturally to kick off and guide work
- run a more guided, report-wizard-style flow interactively
- keep the agent grounded in the current case or project context
- stream model output into the UI
- search across the active project workspace while chatting
- save, copy, attach, and reuse chat outputs inside current reports and projects

Short answer: yes, this is feasible, and the current post-cutover architecture is a good time to do it.

## Executive Summary

Sherlock is already close to supporting this well.

The app has the right foundations:

- a single launch pipeline in `src/App.tsx`
- centralized persisted state in `src/store/caseStore.ts`
- a provider router in `src/services/providers/index.ts`
- local-first SQLite persistence in `src/services/db/*`
- reusable report, case, task, and template flows
- an existing guided launch modal in `src/components/ui/TaskSetupModal.tsx`

The main missing pieces are not UI polish. They are system primitives:

- a conversation data model
- a chat-specific provider execution path
- streaming support
- agent/tool orchestration for workspace search and save actions
- persistence for chat history and agent actions

Recommendation:

- build this as a first-class chat page, not just a panel
- also design the underlying session engine so it can later power a side panel in other views
- preserve the current manual flows and `TaskSetupModal` as-is for users who want the existing setup path
- use the current `TaskSetupModal` as a reference model for what the conversational agent must gather, not as something to replace

## Bottom-Line Feasibility

Assessment: high feasibility, medium implementation complexity, strong architectural fit.

Why this is feasible now:

1. The domain-pack cutover already moved Sherlock toward a generic workspace runtime instead of a narrow investigation-only flow.
2. The app already persists artifacts, tasks, templates, entities, and cases locally, which is the hard part many chat-first products do not have.
3. Multiple entry points already converge on one execution path, so chat can become another orchestrated entry point instead of a parallel subsystem.

Why this is not "free":

1. The current provider layer is built for one-shot structured runs, not conversations.
2. The current prompt contract forces JSON artifact responses, which is right for reports but wrong for a live transcript.
3. There is no persisted chat/session schema yet.
4. There is no streaming transport or partial-response state model in the store.

## Current Strengths To Reuse

### 1. App shell and navigation are ready for one more first-class workspace view

`src/App.tsx` already owns the view shell and central launch pipeline, and `AppView` is a simple enum-based router. Adding a dedicated `CHAT` view is straightforward from a structural perspective.

Relevant anchors:

- `src/App.tsx`
- `src/types/index.ts`
- `src/components/ui/Sidebar.tsx`

### 2. The store already carries the right top-level workspace context

`src/store/caseStore.ts` already persists and rehydrates:

- cases/projects
- archived reports/artifacts
- tasks
- headlines
- scopes
- templates
- active case selection

That means a chat session can be attached to an active workspace without inventing a new global state strategy.

### 3. The report wizard pieces already exist in partial form

The current guided flow in `src/components/ui/TaskSetupModal.tsx` already captures:

- pack and purpose selection
- target/topic
- angle
- seed entities
- priority sources
- config overrides
- save-as-template behavior

That is an excellent reference for a guided agent mode where the agent asks questions interactively.

Important constraint:

- this should not replace or weaken the current manual flow
- the existing `TaskSetupModal` should remain available alongside chat and agent flows
- the conversational flow should gather the same kinds of inputs, then hand off into the same runtime model

### 4. Persistence is already local-first and auditable

The SQLite schema and repository layer are a major advantage here. Sherlock can support persistent chat history, replay, save-to-report flows, and workspace-grounded agent memory without adding a server just to get started.

Relevant anchors:

- `src/services/db/schema.ts`
- `src/services/db/repositories/CaseRepository.ts`
- `docs/operations/DATA_PERSISTENCE.md`

### 5. Output-saving flows already exist

Sherlock already knows how to save artifacts, export them, and reopen them later. That makes "save this answer as a report", "append to current project", and "copy/export this chat result" very achievable.

Relevant anchors:

- `src/store/caseStore.ts`
- `src/components/features/OperationView/Toolbar.tsx`
- `src/utils/exportUtils.ts`

## Core Gaps

### 1. The provider layer is one-shot, not conversational

Today the provider router exposes investigation, anomaly scan, live intel, and TTS operations. That is useful, but it is not yet a generic chat runtime.

The current adapters mostly send a single user prompt and wait for one full response. They do not manage:

- message history
- assistant turns
- tool calls
- incremental tokens
- cancellation
- resume/retry from partial state

This is the biggest technical gap.

Relevant anchors:

- `src/services/providers/index.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/anthropicProvider.ts`
- `src/services/providers/geminiProvider.ts`

### 2. The prompt contract is report-shaped

`src/services/providers/shared/prompts.ts` currently pushes the model toward structured artifact JSON with fields like:

- `summary`
- `entities`
- `agendas`
- `leads`
- `sources`
- `sections`

That is exactly right for artifact generation, but not for an interactive chat loop. Chat needs a separate prompt contract and output handling path.

### 3. No conversation persistence model exists yet

Current persistence covers cases, reports, sections, entities, leads, tasks, settings, templates, and manual graph data. There is nothing yet for:

- chat sessions
- chat turns
- turn attachments
- saved prompts
- agent actions/tool traces

### 4. Search exists, but not as retrievable agent context

`src/components/ui/GlobalSearch.tsx` provides a useful in-memory UI search across cases, reports, headlines, and entities, but it is not yet a retrieval layer the model can call during a session.

It also does not currently support:

- ranked workspace context bundles
- citation packing for the model
- scoped search limited to the active case/project
- semantic or hybrid retrieval

### 5. The current task model does not cover chat sessions

`InvestigationTask` is a good fit for discrete runs. Chat sessions need a sibling runtime concept, not just a stretched version of the current task shape.

## Product Recommendation

### Recommended shape

Build a dedicated chat page first, then optionally add a reusable side panel later.

### Non-goal: replacing current manual setup

This feature should be additive.

Sherlock should keep the current manual setup and launch flows intact, including `TaskSetupModal` and the existing entry points that already launch runs from Feed, Operation View, Archives, Live Monitor, and Network Graph.

The chat and agent layer should sit alongside those flows and on top of the same run configuration model.

The right framing is:

- manual setup remains available
- chat adds a faster natural-language entry point
- guided agent mode is a conversational counterpart to the wizard, not a replacement for it

Why the dedicated page should come first:

- the current `OperationView` is already dense
- a panel-only approach would likely feel bolted on
- a full page gives room for transcript, context drawer, agent actions, citations, and save controls
- a first-class page aligns with the broader research-tool direction after the domain-pack cutover

Why still design for a later panel:

- the same session engine should be reusable from Operation View, Archives, and Network Graph
- users will eventually want "ask this workspace" from anywhere

Recommended UX model:

- primary experience: dedicated `Chat` workspace view
- secondary access: "Ask this project" side panel powered by the same session backend

## Proposed UX

### Mode 1: Open chat

The user starts with a normal conversational transcript:

- ask a question
- request a summary
- ask for follow-up research
- compare sources
- ask the system to draft a new artifact

The agent starts with workspace context such as:

- active case/project title
- short case summary
- current pack and purpose
- recent artifacts
- recent headlines
- selected entity or report when launched from context

### Mode 2: Guided agent flow

This is the conversational counterpart to the current report wizard.

Instead of a modal with fixed steps, the agent asks a short sequence such as:

1. What are we trying to produce?
2. What topic or question should we focus on?
3. Should this stay within the current project or start a new one?
4. Are there specific entities, dates, or sources to prioritize?
5. Should I save the result as a report, note, digest, or comparison?

Internally, this should still resolve to the same pack, purpose, artifact-type, and config model already introduced by the cutover.

This mode should not retire the current wizard. Both paths should coexist:

- manual wizard for deliberate explicit setup
- guided conversation for users who prefer to define the run interactively

### Recommended layout

Center column:

- transcript
- streaming assistant output
- inline citations
- action cards

Right drawer:

- current workspace context
- retrieved project materials
- selected artifact/entity/source context
- save destinations

Top controls:

- new chat
- guided mode
- provider/model indicator
- stop generation
- save/copy/export

Message actions:

- copy response
- save as artifact
- append to existing artifact
- pin to project
- turn into follow-up run

## Recommended Architecture

### 1. Add a conversation domain model

Recommended new internal types:

- `ChatSession`
- `ChatMessage`
- `ChatAttachment`
- `AgentAction`
- `ChatDraftArtifact`

Recommended relationships:

- a session belongs to one case/project workspace
- a session can optionally be linked to a source report/artifact
- a message can reference retrieved workspace context
- an agent action can produce a saved artifact or a queued run

### 2. Add chat persistence tables

Recommended new SQLite tables:

- `chat_sessions`
- `chat_messages`
- `chat_message_attachments`
- `chat_actions`

Optional later:

- `chat_saved_prompts`
- `chat_context_snapshots`

This is additive and fits the existing repository pattern well.

### 3. Add a chat service separate from investigation runs

Do not force chat through `investigateTopic`.

Instead, add a sibling service path, for example:

- `chatWithProviderRouter`
- `streamChatWithProviderRouter`

This path should support:

- message arrays
- system context assembly
- workspace retrieval injection
- streaming callbacks
- cancellation
- optional tool/action loop

Recommended provider rollout:

- implement the first provider-path changes on Google/Gemini
- keep the router and event model provider-agnostic from day one
- close the implementation phase with parity across Gemini, OpenRouter, OpenAI, and Anthropic rather than leaving chat as a Gemini-only feature

### 4. Add a lightweight agent tool layer

For the first version, the agent does not need open-ended autonomous tool use. A bounded tool set is enough:

- search current workspace
- fetch report summary
- fetch full artifact text
- fetch recent headlines
- create artifact draft
- append note to artifact
- create follow-up run

This keeps the system useful without turning the first release into a full planner/executor platform.

### 5. Separate chat output from artifact output

There should be two different model contracts:

- conversational response contract
- artifact generation contract

The chat experience can still invoke artifact generation, but that should be an explicit action or submode.

## Workspace Context Strategy

The agent should not receive the entire project on every turn.

Recommended context packing:

1. Always include a compact workspace summary.
2. Include session-local recent turns.
3. Include selected artifact/entity context when the user launched from a specific place.
4. Use retrieval to pull the most relevant reports, headlines, entities, and notes for the current turn.

Good initial context sources:

- active case/project title and description
- latest report summaries in the case/project
- report section summaries
- saved headlines/leads
- manual graph entities and links
- current pack and purpose metadata

First-pass retrieval can be deterministic, not semantic:

- keyword matching over titles, summaries, sections, entities, and headlines
- case/project scoping first
- recency plus exact-match ranking

That is enough for an MVP. Semantic retrieval can come later.

## Search Over The Current Project

This is very feasible.

Sherlock already has the raw materials:

- reports and sections
- headlines
- entities
- sources
- manual graph nodes

Recommended first implementation:

- add a repository-level workspace search API
- return compact context cards with title, type, snippet, ids, and source location
- allow both UI search and agent retrieval to use the same backend

This would be a strong improvement over the current `GlobalSearch` modal because it would unify:

- user search
- agent retrieval
- save/attach flows

## Streaming Feasibility

Streaming is feasible, but it requires new plumbing.

Current state:

- the provider layer waits for full responses
- the store has no concept of partial assistant output
- the UI has no transcript streaming state

Needed changes:

- provider-specific streaming support
- a store shape for partial messages and generation status
- cancellation state
- transcript UI rendering for partial content

Recommended approach:

1. Implement streaming first on the Google/Gemini path.
2. Define a provider-agnostic event shape for the UI.
3. Use the Gemini implementation to validate the UI and store model quickly.
4. Bring OpenRouter, OpenAI, and Anthropic to parity by the end of the same implementation phase.

That gives a strong user experience without blocking the initial architecture work on all providers at once, while still keeping provider parity as an explicit phase goal rather than a vague future enhancement.

## Pre-Implementation Cleanup

The broad research cutover and doc cleanup are now effectively complete, which is a good point to begin this work.

That said, Sherlock should still continue targeted cleanup from that effort in preparation for chat and agent implementation.

Recommended cleanup to continue before and alongside chat work:

- finish investigation-first naming cleanup where it still creates conceptual friction between cases/projects and reports/artifacts
- keep architecture and operations docs aligned with the final post-cutover runtime shape
- tighten provider-layer contracts so new chat capabilities are added onto a cleaner abstraction surface
- reduce leftover compatibility quirks that could complicate context packing and save flows
- clean up UI labels where chat would otherwise expose old investigation-only wording in a broad research workflow

This is not a request to reopen the cutover. It is a recommendation to keep doing narrow follow-through cleanup so the chat layer lands on a cleaner foundation.

## Save, Copy, and History Flows

These are all feasible and should be part of the initial design, not postponed.

Recommended actions on assistant messages:

- copy message
- copy with citations
- save as note
- save as artifact draft
- append to existing artifact
- create follow-up run from this message
- pin to project history

Recommended session actions:

- rename session
- duplicate session
- export session as Markdown or JSON
- reopen past session attached to a workspace

The current export utilities provide a good pattern to extend.

## Recommended Implementation Phases

### Phase 1: Foundation

- add chat types
- add chat tables and repositories
- add `AppView.CHAT`
- add chat store slice
- add workspace search repository methods
- continue targeted post-cutover cleanup that improves naming, docs, and abstraction consistency for chat work

### Phase 2: Basic chat UI

- dedicated chat page
- session list
- transcript
- composer
- save/copy actions
- launch chat from active project
- keep all existing manual launch flows intact

### Phase 3: Streaming and bounded agent actions

- stream assistant output on Gemini first
- stop generation
- retrieve workspace context
- save response to artifact
- create follow-up run from chat
- reach provider parity across the supported providers by the end of the phase

### Phase 4: Guided report-wizard mode

- interactive question flow
- map answers into pack, purpose, artifact type, angle, entities, and sources
- allow one-click conversion from chat plan to saved artifact/run
- keep the current `TaskSetupModal` and manual setup flows available in parallel

### Phase 5: Reusable side panel

- expose the same session engine inside Operation View, Archives, and Network Graph

## Suggested Initial Scope

Do not start with a full autonomous agent.

Start with:

- dedicated chat page
- current-project grounding
- persisted history
- workspace retrieval
- streaming
- save to project/report
- guided mode that sits alongside the existing static wizard behavior
- Gemini-first provider rollout with explicit parity completion inside the same implementation phase

Avoid in V1:

- unlimited autonomous multi-step planning
- semantic vector infrastructure
- cross-project agent memory

Do not avoid:

- preserving the current manual flows
- planning for provider parity by the end of the chat implementation phase

## Risks and Constraints

### 1. Current terminology is still partly investigation-first

If chat launches before the naming cleanup from the broad research cutover settles, the experience may feel conceptually split between:

- cases vs projects
- reports vs artifacts
- operation view vs research workspace

### 2. Provider abstraction will widen

The current adapter contract is tidy because it only covers a few operations. Adding chat, streaming, tool loops, and structured save actions will make the provider contract more complex.

### 3. Transcript quality can degrade without retrieval discipline

If the agent gets too much workspace text every turn, quality and latency will both suffer. Context packing needs to be explicit and bounded.

### 4. Persistence design matters early

If chat history lands first in local component state or ad hoc settings blobs, it will be painful to upgrade later. It should go into SQLite from the start.

## Estimated Delivery Shape

Rough effort estimate for a solid first release, assuming the domain-pack cutover is stabilized first:

- MVP chat page with persisted history and non-streaming chat: small-to-medium project
- streaming plus workspace retrieval and save actions: medium project
- guided interactive agent flow polished enough to complement the wizard in common cases: medium-to-large project

In practical terms, this looks like a staged effort rather than a spike:

- one focused iteration for foundation and basic chat
- one follow-up iteration for streaming and save flows
- one more iteration for guided agent mode and panel reuse

## Final Recommendation

Proceed.

This should be treated as a first-class product capability, not a bolt-on widget.

The recommended path is:

1. add a dedicated chat page backed by persisted sessions
2. ground the agent in active workspace context and retrieval over current project materials
3. continue targeted post-cutover cleanup that makes naming, docs, and runtime contracts cleaner for chat
4. support streaming and bounded save/search actions, starting with Gemini and reaching provider parity by the end of the phase
5. add an interactive guided agent mode that mirrors the information gathered by `TaskSetupModal` without replacing the manual flow
6. later expose the same engine as a side panel in other views

If implemented this way, the feature will support both directions you want:

- natural chat for exploratory work
- a more guided, wizard-like agent flow for deliberate report creation

Most importantly, it fits the intended post-cutover future of Sherlock as a broader research workspace rather than pulling the app back toward a narrow one-off investigation UI.
