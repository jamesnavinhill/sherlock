# Sherlock Chat and Agent Implementation Plan

Date: 2026-04-03
Status: Proposed

## Objective

Add a first-class chat and guided agent experience to Sherlock that lets users:

- chat naturally against the active workspace
- ask the system to retrieve and summarize current workspace materials
- stream model output into the UI
- save chat output into artifacts or follow-up runs
- use a conversational guided mode that gathers the same inputs as `TaskSetupModal`

This should be implemented as a proper product surface and runtime extension, not as a bolt-on panel or a second disconnected execution stack.

## Relationship To Current Architecture

This plan assumes the domain-pack cutover is now stabilized enough to support chat work on top of the current runtime shape.

Important current strengths to build on:

- one app shell and launch orchestrator in `src/App.tsx`
- one persisted state layer in `src/store/caseStore.ts`
- one provider router in `src/services/providers/index.ts`
- local-first SQLite persistence in `src/services/db/*`
- existing workspace, artifact, task, and template flows
- existing guided setup flow in `src/components/ui/TaskSetupModal.tsx`

Important constraint:

- manual launch flows stay intact
- `TaskSetupModal` stays available
- chat must sit alongside the current flows and reuse the same run model where appropriate

## Guiding Principles

- Build a dedicated chat page first, then reuse the same engine in side panels later.
- Keep chat additive to current launch flows rather than replacing them.
- Separate conversational runtime contracts from artifact-generation contracts.
- Attach chat to a workspace first; do not introduce cross-workspace memory in the initial release.
- Keep the first agent tool surface narrow, explicit, and auditable.
- Persist chat history to SQLite from the start.
- Reach provider parity within the chat implementation phase rather than leaving chat permanently Gemini-only.

## Target End State

Sherlock should gain:

- a dedicated `Chat` workspace view
- persisted chat sessions attached to a workspace
- persisted message history and bounded agent actions
- workspace-grounded retrieval for current chat turns
- streaming assistant output with cancel support
- save/copy/export flows for chat content
- a guided conversational mode that can resolve into artifact drafts and follow-up runs
- a reusable session engine that can later power side panels in other views

The resulting system should support workflows like:

- ask this workspace what changed
- summarize recent artifacts and signals
- compare current findings across saved materials
- draft an artifact from conversation
- turn a conversation into a follow-up run
- run a conversational equivalent of the current setup wizard

## Architectural Decision

### What We Are Choosing

We are choosing a first-class chat architecture now:

- dedicated chat page first
- persisted conversation model in SQLite
- provider-router chat path separate from one-shot artifact runs
- bounded tool/action model for retrieval and save flows
- guided agent mode built on the same pack, purpose, and artifact model already used elsewhere

### What We Are Not Choosing Yet

We are not building in this plan:

- unrestricted autonomous multi-step agents
- semantic/vector infrastructure
- cross-workspace persistent memory
- multi-user/server coordination
- a provider-specific one-off chat implementation that bypasses the router

## Core Model To Introduce

### 1. Chat Session

Recommended internal type:

- `ChatSession`

Responsibilities:

- belong to one workspace
- store current title and status
- optionally reference a source artifact or launch context
- track selected pack, purpose, and model snapshots where useful
- hold the transcript root for replay and resume

### 2. Chat Message

Recommended internal type:

- `ChatMessage`

Responsibilities:

- track role (`system`, `user`, `assistant`, `tool`)
- store message text and structured metadata
- support streaming/partial states
- support citations and retrieval references
- support save/copy/export actions

### 3. Chat Attachment

Recommended internal type:

- `ChatAttachment`

Responsibilities:

- reference attached workspace context
- reference artifacts, entities, sources, or headlines
- allow messages to keep explicit grounding metadata

### 4. Agent Action

Recommended internal type:

- `AgentAction`

Responsibilities:

- record bounded tool/action calls
- persist save/search/follow-up operations
- keep actions auditable and replayable

### 5. Draft Artifact

Recommended internal type:

- `ChatDraftArtifact`

Responsibilities:

- represent draft output before it becomes a saved artifact
- support save-as-artifact and append-to-artifact flows
- bridge conversational output to the current artifact model

## Execution Streams

This plan is intentionally split into five implementation streams:

- Stream 1: Conversation foundation
- Stream 2: Chat page and transcript MVP
- Stream 3: Streaming and bounded agent actions
- Stream 4: Guided conversational run builder
- Stream 5: Reuse and integration polish

The recommendation is to land Streams 1 and 2 first as a usable product slice, then complete streaming and bounded actions before guided mode and side-panel reuse.

## Stream 1: Conversation Foundation

### Goal

Add the data model, persistence, routing, and provider contracts needed for chat to exist as a first-class runtime concept.

### Success Criteria

- chat sessions persist in SQLite
- messages persist and reload correctly
- `AppView.CHAT` exists and routes through the main app shell
- chat has a dedicated provider-router execution path
- workspace search/retrieval has a repository-level API the chat runtime can call
- the implementation does not weaken or duplicate the existing run pipeline

### Scope

This stream includes:

- types
- schema and migrations
- repositories
- app routing
- store shape
- provider-router contract expansion
- retrieval primitives

This stream does not aim to:

- ship final chat UX polish
- ship streaming
- ship guided conversational mode
- expose side panels across the app

### Work Breakdown

#### 1. Define Chat Domain Types

Primary files:

- `src/types/index.ts`

Add:

- `ChatSession`
- `ChatMessage`
- `ChatAttachment`
- `AgentAction`
- `ChatDraftArtifact`
- chat-specific status enums
- streaming state enums where useful

#### 2. Extend Persistence Schema

Primary files:

- `src/services/db/schema.ts`
- `src/services/db/client.ts`
- `src/services/db/migrations_sql.ts`

Add tables:

- `chat_sessions`
- `chat_messages`
- `chat_message_attachments`
- `chat_actions`

Required properties:

- workspace linkage
- message role
- timestamps
- content text
- metadata JSON
- attachment references
- action result metadata

Compatibility note:

- this must be additive and migration-safe, like the domain-pack cutover

#### 3. Add Chat Repositories

Primary files:

- new `src/services/db/repositories/ChatRepository.ts`
- new `src/services/db/repositories/WorkspaceSearchRepository.ts`

Repository responsibilities:

- create/list/update sessions
- create/list/update messages
- store action traces
- fetch compact workspace context bundles
- search titles, summaries, sections, entities, headlines, and sources within the active workspace

#### 4. Add App Routing

Primary files:

- `src/types/index.ts`
- `src/App.tsx`
- `src/components/ui/Sidebar.tsx`

Add:

- `AppView.CHAT`
- sidebar navigation to chat
- root view wiring for a new chat page

#### 5. Add Chat Store Slice

Primary files:

- `src/store/caseStore.ts`

Add state for:

- sessions
- active session id
- messages by session
- generation status
- partial assistant output
- selected chat launch context

Important design choice:

- keep this in the main store rather than spinning up an isolated chat-only state system

#### 6. Add Chat Provider Path

Primary files:

- `src/services/providers/index.ts`
- `src/services/providers/types.ts`
- provider adapters under `src/services/providers/*`

Add new router entry points, for example:

- `chatWithProviderRouter`
- `streamChatWithProviderRouter`

Capabilities needed:

- message arrays
- system context assembly
- workspace retrieval injection
- non-streaming first
- event-shape design that can later support streaming

#### 7. Add Retrieval Primitives

Primary files:

- new `src/services/chat/*`
- `src/services/db/repositories/WorkspaceSearchRepository.ts`

First-pass retrieval should be deterministic:

- workspace-scoped keyword matching
- exact match and title weighting
- recency weighting
- compact snippets rather than full workspace dumps

## Stream 2: Chat Page And Transcript MVP

### Goal

Ship a usable dedicated chat page with persisted sessions, basic transcript UX, and current-workspace grounding.

### Success Criteria

- users can open a dedicated chat page
- users can create and switch sessions
- chat history persists across reloads
- the assistant can answer within current workspace context
- users can copy and export transcript content
- existing manual run flows continue to work unchanged

### Scope

This stream includes:

- chat page UI
- session list
- transcript rendering
- composer
- grounded non-streaming responses
- copy/export actions

This stream does not aim to:

- ship streaming
- ship save-to-artifact actions
- ship the full guided conversational flow

### Work Breakdown

#### 1. Add Chat Page

Primary files:

- new `src/components/features/Chat/index.tsx`
- supporting files under `src/components/features/Chat/*`

Recommended layout:

- left: session list
- center: transcript and composer
- right: workspace context drawer

#### 2. Add Session UX

Required actions:

- create session
- rename session
- reopen prior session
- delete session

Optional in this stream:

- duplicate session

#### 3. Add Transcript Rendering

Support:

- user messages
- assistant messages
- message timestamps
- citations/context chips
- lightweight action affordances

#### 4. Add Workspace Context Drawer

Drawer contents:

- active workspace title and summary
- selected pack/purpose metadata
- recent artifacts
- recent signals/headlines
- launch context when opened from a specific artifact or entity

#### 5. Add Copy And Export Actions

Recommended message/session actions:

- copy message
- copy with citations
- export session as Markdown
- export session as JSON

Implementation note:

- extend the current export utility patterns rather than inventing a separate export style

## Stream 3: Streaming And Bounded Agent Actions

### Goal

Add streaming chat output, cancellation, retrieval actions, and save/follow-up actions that make the chat surface meaningfully useful as a workspace tool.

### Success Criteria

- assistant output streams into the transcript
- generation can be stopped cleanly
- the assistant can retrieve relevant workspace materials for the current turn
- users can save responses into artifacts or draft artifacts
- users can create a follow-up run from chat output
- provider parity is reached by the end of the stream

### Scope

This stream includes:

- streaming transport
- provider event model
- cancellation
- retrieval action layer
- save/append/follow-up actions
- provider parity work

This stream does not aim to:

- ship fully autonomous planning agents
- ship semantic retrieval
- ship side-panel reuse

### Work Breakdown

#### 1. Add Streaming State Model

Primary files:

- `src/store/caseStore.ts`
- chat UI files under `src/components/features/Chat/*`

Add:

- partial assistant message state
- in-flight generation status
- stop/cancel state
- completion/failure transition handling

#### 2. Implement Streaming On Gemini First

Primary files:

- `src/services/providers/geminiProvider.ts`
- `src/services/providers/index.ts`

Add:

- Gemini-first chat streaming path
- provider-agnostic event envelope for the UI

#### 3. Reach Provider Parity

Primary files:

- `src/services/providers/openRouterProvider.ts`
- `src/services/providers/openAIProvider.ts`
- `src/services/providers/anthropicProvider.ts`

Close the stream only when:

- Gemini
- OpenRouter
- OpenAI
- Anthropic

all support the agreed chat contract at parity for the initial feature set

#### 4. Add Bounded Tool/Action Layer

Recommended first actions:

- search current workspace
- fetch artifact summary
- fetch full artifact text
- fetch recent signals/headlines
- create artifact draft
- append note to artifact
- create follow-up run

Important constraint:

- actions stay explicit and bounded
- each action is persisted as an `AgentAction`
- the user can see what happened

#### 5. Add Save Flows

Recommended save actions:

- save as artifact draft
- append to existing artifact
- create follow-up run from message
- pin to workspace history

## Stream 4: Guided Conversational Run Builder

### Goal

Add a conversational guided mode that gathers the same core run inputs as `TaskSetupModal`, then resolves into the existing run and artifact model.

### Success Criteria

- guided mode can gather pack, purpose, topic, angle, entities, sources, and output shape
- guided mode can resolve into a run config compatible with the current launch pipeline
- users can save a guided result as an artifact or launch a follow-up run
- `TaskSetupModal` remains available in parallel

### Scope

This stream includes:

- guided conversation mode
- conversational intake steps
- pack/purpose/artifact mapping
- one-click conversion to artifact draft or run

This stream does not aim to:

- remove the manual wizard
- move all setup into chat

### Work Breakdown

#### 1. Define Guided Intake Model

Primary files:

- new `src/services/chat/guidedMode.ts`
- chat UI files under `src/components/features/Chat/*`

Model should gather:

- what to produce
- topic/question
- current workspace vs new workspace intent
- entities and dates
- source priorities
- desired output type

#### 2. Map Guided Inputs To Existing Runtime Model

Primary files:

- `src/App.tsx`
- `src/components/ui/TaskSetupModal.tsx`
- `src/domain/*`

Map to:

- pack
- purpose
- artifact type
- topic
- angle
- entities
- source priorities
- provider/model overrides where appropriate

#### 3. Add Guided Output Actions

Allow:

- save guided result as draft artifact
- launch the resulting run
- continue editing manually through current flows where useful

## Stream 5: Reuse And Integration Polish

### Goal

Reuse the same conversation engine from other high-value views and tighten the final integration details needed for durable product quality.

### Success Criteria

- the session engine can be opened from Operation View, Archives, and Network Graph
- context launches into chat carry the correct workspace/artifact/entity grounding
- final naming, docs, and runtime contracts are stable enough for future agent iteration

### Scope

This stream includes:

- side-panel or contextual launch integration
- launch-into-chat actions from other views
- final cleanup for naming and contract consistency

This stream does not aim to:

- build a fully generalized plugin/tool platform

### Work Breakdown

#### 1. Add Launch-Into-Chat Entry Points

Likely surfaces:

- Operation View
- Archives
- Network Graph
- later Live Monitor where useful

#### 2. Reuse Session Backend

Important design check:

- no separate panel-specific session store
- no duplicate chat runtime path

#### 3. Final Integration Cleanup

Close any remaining issues in:

- naming consistency
- retrieval context packaging
- save flow clarity
- provider contract documentation

## Cross-Cutting Technical Decisions

### 1. Chat Must Not Go Through `investigateTopic`

Chat should use a sibling runtime path rather than stretching the one-shot artifact pipeline into a conversational system.

### 2. Chat And Artifact Outputs Need Separate Contracts

Keep:

- conversational response contract
- artifact generation contract

Chat can invoke artifact generation, but those should remain separate runtime modes.

### 3. Retrieval Must Be Bounded

Do not inject the entire workspace into every turn.

Always prefer:

- compact workspace summary
- recent turns
- scoped selected-context bundle
- retrieved snippets with identifiers

### 4. Tooling Must Stay Auditable

Every retrieval/save/follow-up action should be explicit and persisted.

## Validation Expectations

Before finishing any non-trivial stream work, run:

```bash
npm run lint
npm run test
npm run build
```

Add or extend tests in the areas touched by each stream, especially:

- provider router contract tests
- chat repository tests
- store tests
- launch propagation tests for launch-into-chat actions
- guided mode mapping tests

## Risks

### 1. Provider Abstraction Complexity Will Increase

The current router is tidy because it handles a small set of one-shot operations. Chat, streaming, and action loops will widen that abstraction significantly.

Mitigation:

- define the chat contract once in `src/services/providers/types.ts`
- keep feature-specific logic out of individual UI components

### 2. Retrieval Quality Can Regress Quickly

If context packing becomes too broad, transcript quality and latency will degrade.

Mitigation:

- deterministic workspace-scoped retrieval first
- compact snippets and identifiers
- explicit retrieval ranking

### 3. Guided Mode Can Drift From The Existing Run Model

If guided chat gathers one shape while manual flows launch another, the product will split conceptually.

Mitigation:

- treat `TaskSetupModal` as the reference model
- keep guided mapping aligned with the same pack/purpose/artifact runtime fields

### 4. Save Flows Can Become Opaque

If chat saves or appends content without clear visibility, users will lose trust quickly.

Mitigation:

- explicit save actions
- auditable `AgentAction` records
- clear UI copy for destination and result

## Recommended Delivery Order

Proceed in this order:

1. Stream 1: foundation
2. Stream 2: dedicated chat page MVP
3. Stream 3: streaming and bounded actions
4. Stream 4: guided conversational builder
5. Stream 5: side-panel reuse and integration polish

## Deliverables By End Of MVP Slice

The minimum meaningful first release should include:

- dedicated chat page
- persisted sessions and messages
- workspace-grounded non-streaming chat
- session switching and history
- copy/export actions
- provider-router chat path

The first release should not be considered complete until Stream 3 closes with:

- streaming
- bounded retrieval/save actions
- provider parity across supported providers

## Final Recommendation

Proceed now.

This is the right next major implementation after the domain-pack cutover stabilization work.

The recommended product shape is:

- first-class chat page first
- additive to manual flows
- bounded agent actions
- guided conversational mode later in the same initiative
- reusable session engine underneath for future panels

If executed in this order, Sherlock can gain a strong natural-language workspace experience without compromising the current artifact and run model that the broader architecture now depends on.
