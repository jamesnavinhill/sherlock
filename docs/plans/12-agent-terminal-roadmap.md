# Agent Terminal Roadmap

Date: April 9, 2026

Status: Active (Decision-Locked Roadmap)

Related inputs:

- `docs/reports/2026-04-09-AGENT-TERMINAL-REPORT.MD`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Chat/useChatController.ts`
- `src/components/features/Chat/ChatTranscript.tsx`
- `src/components/features/Chat/ChatComposer.tsx`
- `src/components/features/Chat/ChatLibraryRail.tsx`
- `src/components/features/Chat/ChatInspectorPanel.tsx`
- `src/services/chat/runtime.ts`
- `src/services/workspace/agent/actions/registry.ts`
- `src/services/db/client.ts`
- `src/services/db/schema.ts`
- `src/services/db/repositories/WorkspaceRepository.ts`

## Intent

This roadmap turns the April 9, 2026 agent terminal report into an execution plan with the major product and architecture decisions folded in.

The target is not a toy console and not a generic CLI bolt-on.

The target is:

- a real embedded terminal inside Sherlock
- a Chat surface that treats human chat and terminal-agent work as equal first-class modes
- a local-first bridge that can run real shells and installed agent CLIs
- a durable ingest path that turns useful terminal output into canonical Sherlock records

This roadmap is intentionally decision-forward.

It does not optimize for the smallest possible MVP if that would force immediate refactors.
It optimizes for a solid first implementation that can remain the long-term foundation.

## Product North Star

By the end of this roadmap, the Chat route should feel like Sherlock's command-and-agent workspace:

- the left rail still manages workspace/session history
- the right rail still manages context and related records
- the center becomes a resizable split workspace
- one side is the normal Sherlock transcript/composer surface
- one side is a real terminal surface backed by a local shell
- either side can be expanded, collapsed, or used alone
- Sherlock can send context into the terminal
- Sherlock can ingest useful terminal output back into the workspace
- the same terminal subsystem supports both manual usage and agent-driven usage

Board control is explicitly deferred.
The terminal foundation should make future board-agent integration easier, but the first full build stops at shell, agent, and ingest workflows.

## Locked Decisions

### 1. Surface decision

- The terminal lives inside the Chat route.
- The existing left and right rails remain.
- The central column in `ChatPage.tsx` becomes a split workspace.
- Default desktop layout is a 50/50 split between chat and terminal.
- The split is draggable, resizable, and collapsible.
- Supported desktop modes are:
  - split
  - chat-only
  - terminal-only

### 2. Terminal implementation decision

- Use `xterm.js` for the browser terminal surface.
- Do not build a terminal renderer from scratch.
- Use a real PTY-backed shell host rather than a fake command box.

### 3. Bridge packaging decision

Chosen direction:

- build the bridge as a service package inside this repository
- run it as a local companion process on the user's machine
- keep the package independently runnable
- do not require a desktop wrapper for the first full implementation

This means the bridge is not embedded into the static Vite app itself, but it is also not a disconnected external project.

Recommended shape:

- add a dedicated bridge package directory in the repo
- give it its own `package.json`
- keep shared types/contracts in the Sherlock codebase or in a small shared contract module

### 4. Agent adapter decision

Day-one adapters:

- Codex
- Gemini CLI

Bonus adapter in the same stream if its contract is stable enough:

- Amp

The adapter layer must be generic enough that other CLI or SDK-backed agents can be added later without reworking the terminal foundation.

### 5. Pairing and remote-access decision

- LAN support is sufficient for the first full build.
- The design must be tunnel-friendly by construction.
- Do not hardcode assumptions that only `localhost` can ever be used.
- Do not make public multi-user hosting a requirement.

Practical meaning:

- the bridge should support explicit origin allowlists
- the connection protocol should use an explicit pairing token
- the transport and auth model should still make sense if the user later exposes the bridge through a tunnel, VPN, or reverse proxy

### 6. Persistence decision

Terminal and agent runs are first-class records.

Sherlock should persist:

- terminal sessions
- command runs
- normalized agent runs
- saved terminal captures
- extracted outputs that become chat turns, artifact drafts, workspace notes, or follow-ups

Sherlock should not rely on the CLI tool's own shell history as the canonical record.

Tool-native history commands may be useful as supplemental import or debugging helpers, but Sherlock-owned run history is the source of truth.

### 7. Output parsing decision

- extraction of useful output is owned by Sherlock
- parsing should be adapter-aware
- raw output should remain available for auditability
- final-answer extraction must degrade gracefully to transcript capture rather than pretending certainty where there is none

### 8. Initial repository-shape decision

- the bridge should live as a repo-local package at the root, not under `src/`
- browser-only code and Node-only bridge code must not import each other directly
- shared runtime contracts should live in a small shared module or contract package that both sides can consume
- the existing browser app remains a Vite app; the bridge is a separate local process with its own lifecycle

### 9. Scope boundary decision

Included in this roadmap:

- embedded terminal surface
- local shell execution
- Codex and Gemini first-class adapters
- optional Amp adapter
- canonical run/session persistence
- ingest into chat, artifact, note, and follow-up flows
- explicit pairing and LAN-friendly connectivity

Explicitly out of scope for this roadmap:

- board mutation or board-agent execution from terminal output
- general public multi-user bridge hosting
- server-side storage of third-party terminal agent credentials
- replacing Sherlock chat with terminal agents as the only interaction model

## Remaining Ambiguity Resolved

This section closes the main ambiguities from the report so implementation can start from one coherent plan.

### Bridge host shape

Resolved:

- use a repo-local service package, not a separate ad hoc app and not a desktop wrapper first

Reason:

- it gives Sherlock one coherent codebase and test surface while preserving the option to bundle the bridge later in Electron, Tauri, or another wrapper if the local workflow proves valuable

### Canonical history source

Resolved:

- Sherlock-owned terminal/session/run persistence is canonical
- shell history and tool-native history remain optional supporting inputs only

Reason:

- the product needs one stable audit and ingest model that does not depend on which shell or CLI happened to be used

### Parsing ownership

Resolved:

- Sherlock owns final-answer extraction and confidence scoring
- adapters can expose tool-specific signals, but the product contract remains Sherlock-owned

Reason:

- the UI and persistence model need one normalized result contract across manual shells, Codex, Gemini, and future tools

### Remote-connect posture

Resolved:

- LAN-first is the required support level
- tunnel-friendly is a design constraint, not a launch requirement

Reason:

- this preserves the "use Sherlock from the phone while the home machine is online" path without expanding the first release into public bridge hosting

### First-class adapter scope

Resolved:

- Codex and Gemini are mandatory
- Amp is conditional on CLI stability during implementation and must not delay the rest of the roadmap

Reason:

- this keeps the first build focused while still leaving a clear slot for Amp

## Bridge Packaging Options

This section explains the main packaging choices and why the roadmap selects the repo-local service package.

### Option A. Tiny Node app outside the repo

What it is:

- a small separate local service, likely in another repo or folder, that the browser app connects to

Technical advantages:

- fastest path to a proof of concept
- minimal coupling to the main build
- can evolve independently of the front-end release cadence

Technical costs:

- duplicated contracts or awkward cross-repo syncing
- easier for the browser app and bridge to drift
- shared types, data contracts, and ingest logic become harder to keep aligned
- more friction for tests and docs

Practical advantages:

- simple mental model for hacking locally
- easy to restart and debug independently

Practical costs:

- feels like "another thing" the project depends on
- worse onboarding
- higher chance the bridge becomes a personal sidecar rather than a supported product feature

Verdict:

- good for a spike
- not the best choice for the intended productized implementation

### Option B. Desktop companion app first

What it is:

- an Electron, Tauri, or similar desktop shell that hosts or bundles the bridge

Technical advantages:

- easier access to local OS features
- clearer installer/autostart/tray/system integration story
- smoother future path for deep local integrations

Technical costs:

- packaging complexity
- code-signing and update complexity
- larger build and release surface
- distracts the project into desktop-app concerns before the terminal contract itself is stable

Practical advantages:

- polished local-user experience
- one obvious install target

Practical costs:

- much heavier build commitment
- more maintenance overhead
- slower iteration on the actual agent-terminal workflows

Verdict:

- a viable later wrapper if the bridge proves valuable
- not the right first implementation shape

### Option C. Service package in the repo

What it is:

- a dedicated local bridge package that lives in this repository, runs independently, and shares contracts cleanly with the app

Technical advantages:

- one codebase
- shared contracts and types stay close to the feature
- docs, persistence, parsing, and ingest logic can evolve together
- easier to test end to end
- still flexible enough to be wrapped later in a desktop shell if desired

Technical costs:

- introduces a multi-process local development story
- requires a little more repo structure than the current single-app setup
- needs careful contract boundaries so the browser app does not accidentally depend on Node-only code

Practical advantages:

- feels like part of Sherlock, not a bolt-on
- easier install and onboarding story
- can remain local-first without committing to desktop packaging yet

Practical costs:

- users still need to run one extra local process
- local bridge lifecycle and status need to be visible in the app

Verdict:

- best fit for this project now
- chosen direction for this roadmap

## History, Persistence, And Auditability

The right persistence model is not "save whatever scrollback happens to exist."
It is "persist meaningful terminal and agent activity as structured Sherlock records, while preserving the raw transcript when useful."

### Canonical persistence scope

Persist these as first-class entities:

- `TerminalSession`
- `TerminalCommandRun`
- `AgentBridgeProfile`
- `TerminalCapture`

Recommended semantic split:

- `TerminalSession`: the long-lived shell session or logical connection
- `TerminalCommandRun`: one explicit command invocation or tracked agent launch
- `TerminalCapture`: the persisted transcript bundle for a run or selected terminal range
- `AgentBridgeProfile`: shell profile or agent profile metadata

### What should always be stored

- session id
- run id
- command or launch request metadata
- shell or adapter profile used
- start time and end time
- completion status
- normalized extracted output when available
- raw output reference or raw transcript payload
- user-vs-agent initiation metadata

### What should be optional or bounded

- full continuous scrollback for long manual shell sessions
- noisy background output that never becomes a deliberate run
- extremely large raw outputs that should be capped or chunked

Recommended storage rule:

- explicit command runs and explicit agent launches get durable transcript capture
- ambient manual terminal noise can remain session-local unless the user saves or promotes it

### Recommended initial persistence shape

The exact column names can change during implementation, but the first schema cut should plan for these record boundaries:

- `terminal_sessions`
- `terminal_command_runs`
- `terminal_captures`
- `agent_bridge_profiles`

Recommended minimum fields:

- `terminal_sessions`
  - `id`
  - `workspace_id` nullable
  - `profile_id`
  - `session_kind` such as `SHELL` or `AGENT`
  - `title`
  - `status`
  - `created_at`
  - `updated_at`
- `terminal_command_runs`
  - `id`
  - `session_id`
  - `adapter_kind` nullable
  - `initiated_by` such as `USER` or `SHERLOCK`
  - `command_text`
  - `prompt_text` nullable
  - `status`
  - `started_at`
  - `completed_at` nullable
  - `exit_code` nullable
  - `final_answer_text` nullable
  - `normalized_output_text` nullable
  - `parser_confidence` nullable
  - `metadata_json`
- `terminal_captures`
  - `id`
  - `run_id`
  - `stream_kind` such as `STDOUT`, `STDERR`, or `MERGED`
  - `content_text`
  - `sequence_number`
  - `created_at`
- `agent_bridge_profiles`
  - `id`
  - `kind` such as `POWERSHELL`, `CMD`, `GIT_BASH`, `CODEX`, `GEMINI`, `AMP`
  - `label`
  - `command`
  - `args_json`
  - `cwd_strategy`
  - `env_policy`
  - `metadata_json`

Design rule:

- transcript payloads can be chunked for storage, but the product should present them as one coherent capture per run

### Tool-native history

Each CLI tool may have its own history or local state commands.
Those can help with support or secondary import workflows, but they should not define Sherlock's primary history model.

Why:

- tool-native history formats vary
- some tools do not expose clean structured history
- some sessions are interactive rather than run-oriented
- Sherlock needs one unified record model across shells and agents

## Output Normalization And Final-Answer Extraction

The parsing system should favor clarity, auditability, and adapter-specific confidence.

### Parsing principles

- keep the raw stream
- normalize the run
- extract the best answer only when the signal is strong enough
- never discard the raw transcript in favor of an overconfident summary

### Parsing model

For every tracked run, store:

- raw stdout stream
- raw stderr stream
- structured lifecycle events where available
- normalized `content`
- optional `finalAnswer`
- optional `warnings`
- parser confidence metadata

### Extraction priority order

1. Adapter-provided structured output
2. Explicit final-answer markers or machine-readable blocks
3. Recognized tool-specific response conventions
4. Clean tail-section extraction from the transcript
5. Fallback to full normalized transcript with no special final-answer claim

### Adapter-specific behavior

Codex adapter should support:

- machine-readable mode if available
- explicit prompt framing from Sherlock
- capture of the final assistant answer separately from progress chatter when possible

Gemini adapter should support:

- machine-readable or quiet/plain modes if available
- adapter-level extraction rules for known Gemini CLI output patterns

Amp adapter should support:

- the same contract as the others
- ship only if its local CLI behavior is stable enough to normalize without hacks

### Seamless product behavior

When the parser has high confidence:

- show the extracted answer as the primary result
- keep a "view transcript" affordance

When confidence is moderate or low:

- show the normalized transcript result
- avoid pretending there is a clean final answer if the tool did not really provide one

### Normalized run result contract

The implementation should converge on one shared result shape equivalent to:

```ts
type NormalizedTerminalRunResult = {
  runId: string;
  sessionId: string;
  adapterKind?: 'CODEX' | 'GEMINI' | 'AMP';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  finalAnswer?: string;
  normalizedContent: string;
  warnings?: string[];
  parser: {
    strategy:
      | 'STRUCTURED_OUTPUT'
      | 'MARKER_BLOCK'
      | 'TOOL_PATTERN'
      | 'TAIL_EXTRACTION'
      | 'FULL_TRANSCRIPT';
    confidence: number;
  };
  metadata?: Record<string, unknown>;
};
```

The exact type location can change, but the browser app, persistence layer, and bridge should all align on one equivalent contract.

## Local, LAN, And Tunnel-Friendly Pairing

The first implementation only needs to work well on the same machine or LAN.
However, the protocol should not be painted into a corner.

### First-class supported modes

- same-machine local connection
- LAN pairing on a trusted network

### Tunnel-friendly by design means

- no assumption that the browser origin must equal the bridge origin
- explicit origin allowlist support
- explicit pairing token or session token
- no hardcoded localhost-only URL logic in the app
- transport abstractions that still make sense behind a tunnel or reverse proxy

### What is not required initially

- public internet exposure by default
- multi-user bridge hosting
- hosted bridge infrastructure
- automatic NAT traversal

### Pairing model recommendation

The initial bridge should use:

- explicit bridge enablement by the local user
- one-time pairing token generation
- origin allowlist checks
- short-lived authenticated browser sessions on successful pair

Do not rely on "it is on localhost so it is safe" as the only trust boundary.

## Shell Profiles And Session Model

The terminal subsystem should support both generic shells and named agent launch profiles.

### Day-one shell profiles

- PowerShell / `pwsh` when available
- `cmd.exe`
- Git Bash if installed and configured

### Session model

There are two valid session styles:

- persistent shell sessions for manual usage
- tracked run sessions for agent-oriented invocations

Recommended rule:

- the UI can expose a persistent shell pane for normal use
- explicit Sherlock-triggered command launches should still create tracked run records inside that session context

### Working-directory behavior

Default working-directory rule:

- use the current Sherlock project root when the user is working inside this repository
- allow future workspace-specific cwd behavior through profile config

### Environment policy

Profiles should define whether they:

- inherit the parent process environment
- add or override specific env vars
- require preflight checks for executable discovery

## Browser And Bridge Protocol Model

The bridge protocol should not be left implicit.

### Browser-to-bridge event families

- connection and pairing
- terminal session create/attach/detach
- terminal input
- terminal resize
- tracked run launch
- tracked run cancel
- transcript fetch
- profile discovery

### Bridge-to-browser event families

- connection status
- pairing required / pairing accepted
- terminal output chunk
- run status update
- normalized result available
- session closed
- bridge error

Design rule:

- manual terminal streaming and tracked agent runs may share transport, but they must remain distinct at the event-model level

## Agent Adapter Strategy

The bridge needs two related but separate layers:

- terminal shell execution
- agent adapter execution

The terminal must still work even if no agent adapters are installed.

### Day-one first-class adapters

#### Codex

Requirements:

- launch installed CLI
- pass prompt/context reliably
- capture stdout/stderr cleanly
- normalize final answer and transcript
- support Sherlock-owned ingest actions

#### Gemini CLI

Requirements:

- same contract as Codex
- support installed local auth flow
- adapter-specific extraction rules where needed

### Bonus adapter

#### Amp

Requirements:

- only ship as first-class if local CLI behavior and invocation contract are stable enough during implementation
- otherwise leave the generic terminal surface ready for it and add the adapter immediately after the core contract lands

### Adapter implementation rules

- adapters must declare how they accept prompts
- adapters must declare whether they support machine-readable or quiet output modes
- adapters must expose their parser strategy
- adapters must not leak tool-specific noise into the normalized Sherlock contract when a cleaner extraction is available
- adapters may still preserve full raw output for audit and debugging

## Architecture Shape In This Repo

Recommended repository additions:

- a new bridge package directory at repo root, for example `agent-bridge/`
- a shared contract module or package for browser/bridge types
- shared browser-side terminal service code under `src/services/terminal/`
- new Chat layout and terminal components under `src/components/features/Chat/`
- persistence types and repository support under existing `src/services/db/` and `src/types/`

Recommended bridge package internals:

- transport server
- PTY session manager
- shell profile registry
- agent adapter registry
- parsing/normalization helpers
- pairing/auth helpers
- platform detection helpers

### Browser-side responsibilities

- render terminal UI with `xterm.js`
- maintain split-pane state and panel focus state
- connect to the bridge over websocket
- send keystrokes, resize events, and run requests
- show run state, session state, and adapter state
- ingest saved outputs into canonical Sherlock records

### Bridge responsibilities

- own PTY creation and shell lifecycle
- spawn PowerShell, `cmd`, Git Bash, and agent CLIs
- manage pairing, origins, and connection auth
- emit terminal stream events
- emit normalized run lifecycle events
- expose agent adapter actions on top of raw terminal execution

### Shared-contract responsibilities

- define terminal session and run types
- define normalized adapter result shapes
- define ingest request and response shapes
- define parser confidence and extraction metadata

## Delivery Model

This is a full-build roadmap, not a throwaway prototype ladder.

Streams are still useful for sequencing, but each stream should land in a durable shape that the final product keeps.

Recommended order:

1. contracts and persistence
2. bridge package and pairing
3. Chat surface refactor and terminal UI
4. manual terminal workflow and tracked run model
5. adapter layer and parsing
6. ingest workflows
7. polish, remote-friendly hardening, and docs closeout

## Stream 1. Contracts And Persistence Foundation

Purpose:

- introduce the canonical record model for terminal and agent activity
- create the contracts that both the browser app and bridge will share

Primary targets:

- `src/types/index.ts`
- `src/services/db/schema.ts`
- `src/services/db/migrations.ts`
- `src/services/db/migrations_sql.ts`
- `src/services/db/repositories/*`
- `src/services/chat/runtime.ts`
- any new `src/services/terminal/*` contract modules

Execution checklist:

1. Add the terminal and agent record types.
2. Define run status, session status, initiation source, and adapter metadata.
3. Add persistence support for sessions, runs, captures, and profile metadata.
4. Define transcript storage rules and any chunking or size-limit rules.
5. Define the normalized extracted-output shape.
6. Add repository helpers for create, update, attach capture, and ingest flows.
7. Keep the persistence model aligned with existing chat, artifact, and workspace patterns.

Exit criteria:

- terminal and agent runs have a stable persisted contract
- Sherlock can store both normalized results and raw capture references
- the data model is ready before the UI and bridge bind to it

Docs to update on landing:

- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/ARCHITECTURE.md`

## Stream 2. Local Bridge Package And Pairing

Purpose:

- build the real local companion process that owns the shell and agent execution environment

Primary targets:

- new repo-local bridge package
- shared contracts used by both app and bridge
- run scripts and local-dev wiring

Execution checklist:

1. Create the repo-local bridge package.
2. Add websocket transport for terminal streams and run lifecycle events.
3. Add PTY support through `node-pty`.
4. Support PowerShell, `cmd`, and Git Bash shell profiles.
5. Add explicit bridge status and pairing state.
6. Add origin allowlist support.
7. Add pairing-token or equivalent session-auth mechanism.
8. Keep the protocol LAN-friendly and tunnel-safe by design.

Exit criteria:

- Sherlock can connect to a local bridge reliably
- the bridge can host real PTY-backed shell sessions
- pairing is explicit and not implicitly trusted

Docs to update on landing:

- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `README.md`

## Stream 3. Chat Surface Refactor And Embedded Terminal UI

Purpose:

- reshape Chat into the dual-surface command workspace without bolting the terminal on as a side modal

Primary targets:

- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Chat/useChatController.ts`
- new split layout components under `src/components/features/Chat/`
- new browser-side terminal client service under `src/services/terminal/`

Execution checklist:

1. Preserve the left and right rails.
2. Replace the center chat column with a split workspace layout.
3. Add drag-resize behavior for desktop split panes.
4. Add chat-only and terminal-only focus modes.
5. Add responsive behavior for smaller screens without destroying access to either surface.
6. Add bridge connection state and shell/profile controls.
7. Add visible terminal session and run state in the UI.
8. Keep the surface visually aligned with Sherlock chrome rather than dropping in a generic developer-console look.

Exit criteria:

- Chat works as a split command workspace
- the terminal feels native to Sherlock
- the layout remains usable on desktop and mobile

## Stream 4. Manual Terminal Workflow And Tracked Run Model

Purpose:

- make the embedded terminal useful even before adapter-specific intelligence is layered on top
- ensure manual shell usage and Sherlock-tracked runs can coexist cleanly

Primary targets:

- browser-side terminal client state
- bridge-side session manager
- persistence integration for sessions and tracked runs

Execution checklist:

1. Support persistent shell attachment in the UI.
2. Distinguish ambient shell streaming from explicit tracked runs.
3. Persist tracked commands and their transcript captures.
4. Add run status surfaces to the Chat terminal pane.
5. Add session restart, reconnect, and disconnect behavior.
6. Make manual terminal use feel first-class rather than a hidden support feature.

Exit criteria:

- the embedded terminal is valuable even with no agent-specific adapter selected
- the product can distinguish a passive shell session from a deliberate tracked run
- the persistence model is exercised by real terminal usage before adapter-specific work lands

## Stream 5. Agent Adapters And Parsing

Purpose:

- make the terminal useful as an agent workspace with first-class adapter semantics

Primary targets:

- bridge adapter modules for Codex and Gemini
- optional Amp adapter
- parsing and normalization helpers
- normalized run result contract

Execution checklist:

1. Add the Codex adapter.
2. Add the Gemini CLI adapter.
3. Add Amp if the local invocation contract is stable enough.
4. Implement normalized result objects across adapters.
5. Implement final-answer extraction with confidence metadata.
6. Preserve raw transcript access for every tracked run.
7. Keep Sherlock-owned history canonical instead of depending on tool-native history.

Exit criteria:

- Codex and Gemini feel first-class inside Sherlock
- parsing behavior is adapter-aware and predictable
- raw and normalized results both remain available

## Stream 6. Ingest Workflows And Workspace Integration

Purpose:

- connect terminal and adapter results back into Sherlock's existing product model

Primary targets:

- browser-side ingest actions
- chat/artifact/workspace integration helpers
- persistence links between runs and promoted records

Execution checklist:

1. Add save-as-chat flow.
2. Add save-as-artifact-draft flow.
3. Add save-as-workspace-note or excerpt flow.
4. Add follow-up extraction flow.
5. Preserve linkage from saved record back to the originating terminal run.
6. Make transcript review available wherever a normalized result is surfaced.

Exit criteria:

- outputs can be ingested into the existing workspace system cleanly
- users can move from terminal result to Sherlock record without copy-paste glue work
- raw and normalized results both remain available

## Stream 7. Remote-Friendly Hardening, Quality Sweep, And Documentation Closeout

Purpose:

- finish the system in a durable state without turning the first implementation into a one-off local hack

Primary targets:

- bridge security and pairing hardening
- connection UX
- docs and operational guidance

Execution checklist:

1. Harden origin allowlist behavior and pairing lifecycle.
2. Confirm the design remains compatible with LAN and optional tunnel use.
3. Normalize connection, reconnect, and bridge-offline states in the UI.
4. Add operational guidance for local bridge usage.
5. Add architecture documentation for app-to-bridge boundaries.
6. Add persistence documentation for terminal and agent records.
7. Document any platform-specific shell profile setup behavior for Windows.

Exit criteria:

- the feature is clearly documented
- local use is reliable
- remote use is not blocked by brittle localhost-only assumptions
- the user can understand what is running where

## Validation Standard

Default expectation per stream:

- `npm run lint`
- `npm run typecheck`
- the most relevant targeted test command(s)
- `npm run build` when shipped app code or shared runtime behavior changes

Additional validation expectations for this roadmap:

- browser-side component tests for the Chat split layout
- terminal client state tests
- repository tests for terminal and agent persistence
- bridge protocol tests where feasible
- adapter-level parsing tests for Codex and Gemini
- ingest-flow tests linking terminal runs to chat/artifact/note/follow-up actions

Do not rely on manual smoke testing alone for parsing or persistence correctness.

## Completion Standard

This roadmap is complete only when:

1. Chat is a real split workspace with embedded terminal support
2. the terminal is PTY-backed and supports real local shells
3. Codex and Gemini are first-class adapters
4. Amp is either shipped or intentionally deferred behind an explicit post-roadmap note
5. terminal and agent runs persist as canonical Sherlock records
6. normalized extracted results and raw transcripts are both available
7. the bridge is local-first, explicitly paired, and LAN-friendly
8. the architecture is tunnel-friendly by design even if public remote use is not the default
9. the new runtime boundary is documented clearly in Sherlock's operational docs
