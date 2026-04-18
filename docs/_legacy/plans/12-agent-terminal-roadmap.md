# Agent Terminal Roadmap

Date audited: April 10, 2026

Status: Refreshed roadmap against the live codebase; terminal work is still not started in `src/`

Related inputs:

- `docs/reports/2026-04-09-AGENT-TERMINAL-REPORT.MD`
- `docs/plans/15-ui-panel-unification-epic.md`
- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`
- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Chat/useChatController.ts`
- `src/components/features/Chat/useChatViewState.ts`
- `src/components/features/Chat/ChatLibraryRail.tsx`
- `src/components/features/Chat/ChatInspectorPanel.tsx`
- `src/components/features/Chat/ChatTranscript.tsx`
- `src/components/features/Chat/chatTranscriptActions.ts`
- `src/services/chat/runtime.ts`
- `src/services/db/schema.ts`
- `src/services/db/repositories/ChatRepository.ts`
- `src/components/features/Timeline/timelineEventBuilders.ts`
- `src/services/workspace/home.ts`
- `src/components/ui/omniboxResultBuilders.ts`

## Goal

Turn Chat into Sherlock's in-app command-and-agent workspace by adding a real embedded terminal, a local shell bridge, first-class agent adapters, and durable ingest paths that fit the current workspace model.

This refresh replaces the earlier April 9 version's "decision-locked" framing with a codebase-aware execution plan.

The product direction is still the same.

The starting point is not.

## Audit Snapshot

### Current read

- There is still no terminal subsystem in the app.
- There is no bridge package in the repo.
- There are no `xterm.js`, `@xterm/*`, or `node-pty` dependencies in the current package.
- The app is still a browser-first Vite app with browser-local SQLite via wa-sqlite + IndexedDB.
- A real shell still cannot run inside the deployed browser app without a companion process.

### What is already true in the code now

- Chat is a route-backed workspace surface at `/workspaces/:workspaceId/chat` and `/workspaces/:workspaceId/chat/:sessionId`.
- Chat already has durable sessions, messages, attachments, actions, guided flows, artifact-save flows, follow-up launch flows, and workspace-item promotion hooks.
- Chat now sits on the shared panel foundations:
  - `ChatLibraryRail.tsx` renders through `LibraryRailShell.tsx`
  - `ChatInspectorPanel.tsx` renders through `GlobalInspectorPanel.tsx`
  - `useChatViewState.ts` uses `useExclusivePanelSections.ts`
- Timeline, Workspace Home, and the omnibox already surface chat sessions, workspace runs, items, and recent activity as first-class workspace records.
- Board automation already has an approval-first action layer, which is useful precedent for future agent workflows, but terminal-driven board mutation is still out of scope for this roadmap.

### What changed since the April 9 plan

- The Chat surface no longer needs a panel-foundation migration before terminal work can begin.
- The current app has stronger controller/view-state seams than the earlier roadmap assumed.
- Cross-surface integration matters more now because Timeline, Workspace Home, and omnibox are already live and should understand terminal activity once it exists.
- The repository is still a single-package app, so landing a repo-local bridge now also requires explicit package/script/tooling decisions rather than assuming a package layout already exists.

### Important non-blocker

The cleanup work referenced in `docs/plans/15-ui-panel-unification-epic.md` may rename or trim thin adapters, but it does not materially change the terminal findings in this roadmap.

## North Star

By the end of this roadmap, the Chat route should feel like Sherlock's command workspace:

- the left rail still manages workspace chat/session history
- the right rail still manages workspace context and related records
- the center becomes a split workspace
- one side is the existing Sherlock transcript/composer flow
- one side is a real embedded terminal backed by a local shell
- either side can be focused, collapsed, or used alone
- Sherlock can send context into the terminal
- Sherlock can ingest useful terminal output back into canonical Sherlock records
- terminal activity can surface back out through Timeline, Workspace Home, and omnibox without becoming a separate disconnected subsystem

Board control remains explicitly deferred.

## Locked Decisions

### 1. Surface decision

- The terminal belongs inside the Chat route.
- The existing left and right rails stay.
- The center of `ChatPage.tsx` becomes a split chat-and-terminal workspace.
- Default desktop mode is a 50/50 split.
- Supported main-pane modes are:
  - split
  - chat-only
  - terminal-only

### 2. Terminal renderer decision

- Use `xterm.js`.
- Do not build a terminal renderer from scratch.
- Do not ship a fake command box.

### 3. Shell host decision

- Use a repo-local companion service.
- The bridge owns PTY creation and shell lifecycle.
- The browser app talks to that bridge over an explicit transport.
- The first implementation is still local-first and companion-process based, not desktop-wrapper first.

### 4. Repo packaging decision

- The bridge should live in this repository as a dedicated package or package-like directory at the repo root.
- When that lands, the repo should gain the minimal workspace/script wiring needed so install, lint, typecheck, and dev flows stop assuming `src/` is the only code surface.
- Browser-only code and Node-only bridge code must stay on opposite sides of a small shared contract layer.

### 5. Adapter scope decision

Day-one first-class adapters:

- Codex
- Gemini CLI

Conditional bonus adapter:

- Amp

Amp should not delay the rest of the delivery.

### 6. Persistence decision

Terminal activity should become first-class Sherlock data.

Sherlock should persist:

- terminal sessions
- explicit tracked terminal runs
- terminal captures/transcripts
- terminal profiles

Sherlock should not treat the shell's own history file or a tool's local history command as the canonical system of record.

### 7. Ingest decision

- Terminal output should reuse the existing Sherlock ingest destinations rather than inventing a second artifact/note/follow-up system.
- The existing Chat and workspace-item flows are a strength to build on, not something to bypass.

### 8. Cross-surface integration decision

- Terminal should not become a new top-level app noun or route in the first pass.
- Explicit tracked terminal runs should feed the existing workspace chronology and search surfaces.
- First pass should prefer extending the existing `RUN` and Chat-adjacent surfaces over inventing a brand-new top-level `TERMINAL` track everywhere.

### 9. URL/state ownership decision

- Workspace id and chat session id stay URL-owned, as they are today.
- Split ratio, focused pane, bridge connection state, selected profile, and live terminal attachment state should remain component/store-owned in the first pass.
- Do not put terminal split mechanics into the URL before the contract is stable.

### 10. Remote-connect posture

- Same-machine support is required.
- LAN pairing is required.
- Tunnel-friendly design is required.
- Public multi-user bridge hosting is not required.

### 11. Board boundary decision

Included:

- embedded terminal surface
- local shell execution
- Codex and Gemini CLI adapters
- durable terminal records
- ingest into chat, artifact, workspace item, and follow-up flows

Deferred:

- terminal-driven board mutation
- public hosted bridge infrastructure
- storing third-party CLI credentials in Sherlock
- replacing Sherlock chat with terminal agents as the only interaction model

## Current Architecture Fit

### Chat is ready to host the terminal

The current Chat route already has the right high-level shape:

- route-backed session selection
- a dedicated controller in `useChatController.ts`
- a feature-local view-state seam in `useChatViewState.ts`
- shared left and right rails
- durable transcript/actions/attachments

Terminal work should layer onto that structure instead of reworking it.

### Sherlock already has strong ingest destinations

Useful terminal output should be able to land in the same destinations Chat already supports today:

- save as artifact draft
- append to an existing artifact
- promote excerpts into workspace items
- launch follow-up runs

The existing logic in `chatTranscriptActions.ts` and `src/services/chat/runtime.ts` is strong evidence that ingest can be consistent across chat and terminal flows.

### Sherlock already has places to surface terminal history

Once terminal records exist, they should feed:

- Timeline via the existing event builders
- Workspace Home recent activity and counts
- omnibox search/results

That is now a real requirement because those surfaces already exist in active code.

### Repo structure needs to be part of the implementation

The current repo is still one `package.json` with scripts that assume front-end-only code:

- `lint` only targets `src/`
- `typecheck` only covers the current TS app
- there is no workspace package wiring yet

The bridge stream therefore has to include repo-tooling work, not just runtime code.

## Additional Design Clarifications

### Host-local shell profiles, not Windows-only assumptions

The old report correctly emphasized PowerShell, `cmd.exe`, and Git Bash for Windows-hosted usage.

The refreshed plan adds one important constraint:

- the bridge must treat shell profiles as host-local
- if the bridge is running under WSL/Linux/macOS, a POSIX shell profile such as `bash` should be a valid first-class profile
- adapter invocation must not assume the bridge always runs as a Windows-native process

That keeps the architecture honest for both local development and future non-Windows use.

### Explicit tracked runs versus ambient shell noise

The terminal pane should support a persistent shell session.

It should not persist every byte of ambient scrollback as a first-class run.

Recommended rule:

- Sherlock-triggered launches always create tracked terminal runs
- user-invoked "tracked command" actions create tracked runs
- ambient manual shell output can remain session-local unless the user saves or promotes it

### Simpler terminal record naming

Use simple product nouns in the new terminal model:

- `TerminalSession`
- `TerminalRun`
- `TerminalCapture`
- `TerminalProfile`

The old `TerminalCommandRun` and `AgentBridgeProfile` wording is workable, but the simpler names fit the current codebase better and cover both manual shell runs and agent launches cleanly.

## Phase Status

### Phase 0: Foundations Already Landed

Status: Complete

What this phase means in today's code:

- Chat already has durable sessions/messages/actions and good controller seams.
- Chat already uses the shared library-rail and shared inspector foundations.
- Chat already has promotion, artifact-save, append, and follow-up launch actions.
- Timeline, Workspace Home, and omnibox already expose adjacent workspace record types.

This phase is the reason the roadmap can now focus on terminal-specific work.

### Phase 1: Terminal Domain Model And Persistence

Status: Not started

Purpose:

- add a canonical terminal data model before any browser or bridge code depends on it

Primary targets:

- `src/types/index.ts`
- `src/services/db/schema.ts`
- `src/services/db/migrations_sql.ts`
- new terminal repositories under `src/services/db/repositories/`
- `docs/operations/DATA_PERSISTENCE.md`

Recommended additions:

- `TerminalSession`
- `TerminalRun`
- `TerminalCapture`
- `TerminalProfile`

Recommended modeling rules:

- keep terminal records separate from `WorkspaceRun`
- link terminal records back to `workspaceId` when applicable
- distinguish `runKind` such as `COMMAND` or `AGENT`
- distinguish `initiatedBy` such as `USER` or `SHERLOCK`
- preserve normalized result data and raw capture references together

Exit criteria:

- terminal records have a stable persisted contract
- raw transcript storage rules are defined
- browser and bridge work can share one clear model

### Phase 2: Repo-Local Bridge Package And Tooling

Status: Not started

Purpose:

- add the real local companion process and the repo shape needed to support it

Primary targets:

- new root bridge package or equivalent root service directory
- shared contract module between app and bridge
- root script/tooling updates

Execution notes:

- add websocket transport for streaming, status, and control events
- add PTY support through `node-pty`
- support host-local shell profiles
- add explicit origin allowlists
- add explicit pairing token or equivalent session-auth mechanism
- update repo scripts so validation covers both browser and bridge code once the bridge lands

Exit criteria:

- Sherlock can connect to a real local bridge
- the bridge can host PTY-backed shell sessions
- the repo has a coherent install/dev/validation story for both sides

Docs to update when this lands:

- `README.md`
- `docs/operations/ARCHITECTURE.md`
- `docs/operations/OPERATIONS_RUNBOOK.md`

### Phase 3: Browser Terminal Client And Chat Split Workspace

Status: Not started

Purpose:

- embed the terminal into the current Chat route without undoing the now-landed shared panel architecture

Primary targets:

- `src/components/features/Chat/ChatPage.tsx`
- `src/components/features/Chat/useChatViewState.ts` or a new sibling terminal-view-state hook
- new chat terminal/split components under `src/components/features/Chat/`
- new browser-side terminal client code under `src/services/terminal/`

Execution notes:

- preserve `ChatLibraryRail.tsx` and `ChatInspectorPanel.tsx`
- replace the center single-column layout with a split workspace
- add pane resize, collapse, and focus modes
- add bridge connection state and profile controls
- keep responsive behavior usable on narrow screens
- keep terminal pane state out of the URL in the first pass

Exit criteria:

- Chat can render transcript/composer and terminal side by side
- the terminal feels native to Sherlock chrome
- the existing rails continue to behave correctly

### Phase 4: Manual Shell Workflow And Run Tracking

Status: Not started

Purpose:

- make the terminal useful before adapter-specific intelligence is layered on top

Primary targets:

- browser terminal client state
- bridge session manager
- terminal repositories

Execution notes:

- support persistent shell attachment
- allow attach/detach/reconnect behavior
- distinguish ambient shell output from explicit tracked runs
- surface run status and capture affordances in the terminal pane
- support saving or promoting useful output even before adapter-specific parsing exists

Exit criteria:

- the embedded terminal is useful even without agent adapters
- explicit runs can be persisted and reopened cleanly
- reconnect and disconnect behavior is clear to the user

### Phase 5: Agent Adapters And Parsing

Status: Not started

Purpose:

- make the terminal a first-class agent workspace rather than only a manual shell pane

Primary targets:

- bridge adapter modules for Codex and Gemini CLI
- optional Amp adapter
- parsing and normalization helpers
- shared normalized run-result contract

Execution notes:

- adapters must declare prompt/input strategy
- adapters must declare whether they support machine-readable or quiet output
- Sherlock owns the normalized result contract
- raw transcript remains available for auditability
- fallback parsing should degrade to transcript capture when confidence is low

Exit criteria:

- Codex and Gemini work through one normalized Sherlock contract
- final-answer extraction is adapter-aware but not overconfident
- manual shell and adapter-driven runs can coexist cleanly

### Phase 6: Ingest And Cross-Surface Integration

Status: Not started

Purpose:

- connect terminal output back into Sherlock's existing workspace flows

Primary targets:

- terminal ingest actions in Chat
- Timeline event builders
- Workspace Home recent-activity/count derivation
- omnibox result builders and open actions

Execution notes:

- reuse existing artifact-draft, append, workspace-item, and follow-up pathways
- route terminal open actions back through the Chat route rather than inventing a terminal route
- first pass should surface tracked terminal runs through existing run-oriented chronology/search surfaces
- add detail affordances for transcript/capture access where useful

Exit criteria:

- a useful terminal result can become a chat turn, artifact draft, workspace item, or follow-up
- terminal activity is discoverable in Timeline, Workspace Home, and omnibox
- the feature feels integrated with Sherlock rather than bolted beside it

### Phase 7: Hardening, Remote-Friendly Pairing, Docs, And Validation

Status: Not started

Purpose:

- finish the bridge and terminal feature in a supportable, documented shape

Primary targets:

- pairing/auth hardening
- reconnect/error handling
- docs and validation scripts

Execution notes:

- confirm LAN pairing behavior
- confirm tunnel-friendly origin/session assumptions
- document local-bridge setup and troubleshooting
- expand validation so bridge code is no longer outside the normal repo gate

Exit criteria:

- same-machine and LAN pairing are solid
- the remote-pairing posture is explicit and auditable
- docs describe the real install/run/troubleshooting flow

## Implementation Order

Recommended order:

1. Phase 1: terminal domain model and persistence
2. Phase 2: bridge package and repo tooling
3. Phase 3: browser terminal client and Chat split workspace
4. Phase 4: manual shell workflow and tracked runs
5. Phase 5: Codex and Gemini adapters plus parsing
6. Phase 6: ingest and cross-surface integration
7. Phase 7: hardening, docs, and closeout

This ordering still holds because the current app already has strong product surfaces to integrate into, and those surfaces will be cleaner to wire once the terminal contract exists first.

## Acceptance Criteria For The Full Roadmap

The roadmap is done when all of these are true:

- Chat hosts a real embedded terminal backed by a local bridge
- Sherlock can run both manual shells and first-class agent adapters from that surface
- terminal sessions and explicit runs persist as canonical Sherlock records
- useful terminal output can be promoted into existing workspace flows
- Timeline, Workspace Home, and omnibox can discover meaningful terminal activity
- pairing is explicit, origin-aware, and tunnel-friendly by design
- board control is still deferred rather than leaking in as accidental scope creep

## Summary

The main update is simple:

- the product direction from April 9 still holds
- the codebase is better prepared than that first roadmap assumed
- the next work should focus on terminal contracts, bridge boundaries, and integrated workspace behavior rather than on pre-terminal Chat cleanup

Sherlock no longer needs a terminal plan that starts from "refactor Chat until it is ready."

It needs a terminal plan that starts from "Chat is ready enough, so now design the terminal to fit the real workspace architecture we already have."
