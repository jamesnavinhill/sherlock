**Agent Terminal Report**  
Date: April 9, 2026

This report separates confirmed repo facts from proposed design so we do not blur what already exists with what we want to build.

**Confirmed Repo Facts**

- The current chat surface is already a three-part layout: left session rail, central transcript/composer, and right context rail in [ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx).
- Chat already has durable sessions, messages, actions, follow-up launch hooks, artifact-save hooks, and workspace retrieval in [useChatController.ts](C:/Users/james/projects/sherlock/src/components/features/Chat/useChatController.ts) and [runtime.ts](C:/Users/james/projects/sherlock/src/services/chat/runtime.ts).
- Board automation already uses structured actions with approval-friendly execution in [registry.ts](C:/Users/james/projects/sherlock/src/services/workspace/agent/actions/registry.ts).
- The app is browser-first today: Vite/React UI, browser-local SQLite via wa-sqlite + IndexedDB, and browser-side key/config handling in [client.ts](C:/Users/james/projects/sherlock/src/services/db/client.ts), [systemConfig.ts](C:/Users/james/projects/sherlock/src/config/systemConfig.ts), and [keys.ts](C:/Users/james/projects/sherlock/src/services/providers/keys.ts).
- Because of that, a real shell cannot run directly inside the deployed browser app without a companion process. The browser can render a terminal UI, but the OS shell must live outside the static site.

**Recommended Product Direction**

- Reshape Chat into the home for human chat plus terminal-agent work.
- Keep the left and right rails.
- Replace the current single central chat column with a resizable, collapsible main split workspace.
- Default desktop layout: `Chat pane | Terminal pane` at 50/50, with drag-resize and one-click focus modes.
- Supported pane states: split, chat-only, terminal-only.
- The terminal is not a toy console. It should be a first-class surface that both you and Sherlock can use.
- Board control is explicitly out of scope for the first full build, but the future path is good because the board agent already has a structured action layer.

**Target User Experience**

- You open Chat and see your normal session rail on the left, context rail on the right, and a center split with transcript/composer on one side and a real terminal on the other.
- You can type manually into the terminal pane exactly as you would in PowerShell, `cmd`, or Git Bash.
- You can launch agent CLIs from that same pane, including tools like Codex, Gemini CLI, or Amp, provided they are installed and authenticated on the machine hosting the shell.
- Sherlock can hand context into the terminal side:
  - send current prompt
  - send artifact text
  - send workspace summary
  - send selected citations or notes
- Sherlock can ingest results back out of the terminal side:
  - save terminal output as a chat turn
  - save as draft artifact
  - save as workspace note or excerpt
  - extract follow-ups
  - attach raw transcript for auditability
- On narrow screens, both surfaces should remain accessible, but a full 50/50 split will likely need a responsive focus switch rather than squeezing both panes into unusable widths.

**Recommended Technical Shape**

- Frontend terminal renderer: `xterm.js` is the right fit. It gives us a real terminal surface without building one ourselves.
- Shell host: a local bridge process should own PTY creation and shell spawning.
- PTY layer: `node-pty` is the standard fit for spawning PowerShell, `cmd`, or Git Bash.
- Browser transport: websocket is the clean default for terminal streaming, resize events, keystrokes, and status.
- Shell profiles should be explicit:
  - PowerShell / `pwsh`
  - `cmd.exe`
  - Git Bash if installed
  - named agent launch commands like `codex`, `gemini`, `amp`
- Agent support should be adapter-based, not hardcoded. Some integrations will be terminal-native CLIs, while others may later be better handled through SDK/API adapters.

**Execution Model**

- The terminal pane talks to a local bridge.
- The local bridge spawns a PTY-backed shell session.
- Sherlock can either let you drive that shell directly or issue structured actions against it.
- Terminal sessions and command runs should be normalized into Sherlock-owned records so the app can reason about them consistently.
- Sherlock should not need to own the login state for Codex/Gemini/Amp if those CLIs already handle auth locally.
- The preferred trust model is: authenticate once in the CLI, then let Sherlock invoke the already-authenticated tool through the bridge.

**Deployed Site Story**

- A plain deployed static site cannot directly access the machine shell of the visitor.
- A deployed Sherlock can still support the terminal pane if the user intentionally pairs the site with a local bridge running on their own machine.
- That means the viable remote story is:
  - Sherlock UI hosted anywhere
  - your home machine running the bridge
  - your phone/browser connecting to Sherlock
  - Sherlock pairing to the bridge with explicit approval
- If your home machine is online and reachable through your chosen tunnel/VPN/reverse proxy path, then “lying in bed and using my agents from my phone” is a realistic design target.
- This should be opt-in and single-user by default. It should not silently expose a shell to arbitrary site visitors.

**Security Model**

- Sherlock should not store third-party agent subscription keys when the underlying CLIs already manage auth.
- The bridge should store as little as possible: shell profiles, connection state, maybe allowed origins, but not reusable provider secrets unless absolutely required.
- Pairing should be explicit.
- Allowed origins should be explicit.
- Bridge sessions should be scoped and auditable.
- Raw terminal execution is powerful, so “what Sherlock told the shell to do” and “what the shell returned” should be preserved as first-class history.

**Data Model Additions Worth Planning For**

- `TerminalSession`
- `TerminalCommandRun`
- `AgentBridgeProfile`
- `TerminalCapture` or attachment-like transcript records
- These should integrate with existing chat/action/artifact flows rather than becoming an isolated side system.

**Implementation Shape In This Repo**

- Chat layout refactor around [ChatPage.tsx](C:/Users/james/projects/sherlock/src/components/features/Chat/ChatPage.tsx)
- New split workspace components under `src/components/features/Chat/`
- New browser-side terminal client service under `src/services/terminal/`
- A separate local bridge package/process outside the static Vite app is the most coherent host for PTY and shell management
- Existing chat persistence and artifact-save flows should be reused instead of inventing a second ingestion model

**Decisions This Report Recommends**

- Build an embedded terminal inside Sherlock, not a separate external window.
- Use Chat as the primary surface.
- Use a real PTY-backed shell, not a fake console.
- Treat external CLIs as bridge-driven agent tools.
- Keep board control for later.
- Design for local-first, with optional remote pairing, not public multi-user shell hosting.

**Open Design Choices To Leave Flexible**

- Whether the bridge lives as a tiny Node app, desktop companion, or service package in the repo
- Exact persistence scope for terminal history
- Exact parsing heuristics for extracting “final answer” from mixed terminal output
- Whether remote pairing is LAN-only at first or tunnel-friendly by design
- Which agent CLIs get first-class adapters on day one

The strongest version of this is not “Sherlock gets a CLI.” It is “Sherlock becomes the in-app command and agent workspace,” with chat and terminal living side by side as equal surfaces. That is coherent with the current codebase, fits the way you want to work, and leaves a very clean path to richer agentic control later.
