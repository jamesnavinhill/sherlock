# tldraw 4.x Migration Feasibility Report

Date: 2026-04-08
Repository: `C:\Users\james\projects\sherlock`

## Question

What would actually be required to bring `tldraw` 4.x back into Sherlock's current mainline, and what official upstream benefits would that deliver, as of April 8, 2026?

## Executive Summary

Migrating Sherlock's current `main` branch from `tldraw ^3.15.6` to current stable `tldraw 4.x` is feasible.

The important finding is that this should be treated as a forward upgrade on top of current `main`, not as a branch merge from `tldraw-4`.

Why:

- the old `tldraw-4` branch is not a parallel feature branch waiting to be merged back; it is an ancestor of `main`
- `main` is 76 commits ahead of `tldraw-4`
- the current board surface has already been heavily refactored since that branch into smaller modules and Sherlock-specific board-agent flows
- an isolated upgrade probe on a clean worktree of current `main` showed one real TypeScript break, and after fixing that break, `typecheck` passed and targeted board/agent tests passed

Bottom line:

- feasible path: upgrade current `main` directly to `tldraw 4.5.8`
- not recommended: try to resurrect or merge the old `tldraw-4` branch wholesale
- main required work: add official license-key plumbing, update the remaining arrow-label API usage, run focused board regressions, and review the bundle impact

## Verified Local Findings

### 1. Current production branch is still on `tldraw ^3.15.6`

Verified in:

- `package.json:28`

### 2. The old `tldraw-4` branch is historically behind `main`, not ahead of it

Verified with:

- `git rev-list --left-right --count main...tldraw-4` -> `76 0`
- `git merge-base main tldraw-4` -> `671fda9a630a60b1858a44b853454008f638d794`

Implication:

- `tldraw-4` is not a safe "merge back in" target
- the right comparison is "upgrade current main", not "restore the old branch"

### 3. The old branch had `tldraw 4.x`, but Sherlock has changed substantially since then

Verified in:

- `git show tldraw-4:package.json` -> `tldraw ^4.5.7`
- old `src/components/features/WorkspaceBoard/index.tsx` on `tldraw-4`: `1324` lines
- current `src/components/features/WorkspaceBoard/index.tsx`: `303` lines

Current `main` has already split the board into extracted modules such as:

- `src/components/features/WorkspaceBoard/BoardCanvasPane.tsx`
- `src/components/features/WorkspaceBoard/useBoardCanvasPersistence.ts`
- `src/components/features/WorkspaceBoard/workspaceBoardUtils.ts`
- `src/services/workspace/boardShapes.ts`
- `src/services/workspace/agent/*`

Implication:

- even if the old branch once ran on 4.x, its code shape is no longer the current app shape
- the practical work now is re-upgrading current code, not porting an old monolith forward

### 4. Current `main` already contains many 4.x-aligned patterns

Verified in current code:

- `src/index.css:624` uses `--tl-font-sans`
- `src/index.css:652` uses `--tl-color-background`
- `src/index.css:696` uses `--tl-text-outline`
- `src/services/workspace/boardShapes.ts:230` writes `richText: toRichText(card.content)`
- `src/components/features/WorkspaceBoard/workspaceBoardUtils.ts:18-19` overrides `TLComponents.StylePanel`
- `src/components/features/WorkspaceBoard/BoardCanvasPane.tsx:30-35` mounts `<Tldraw />` with `components` and `snapshot`
- `src/components/features/WorkspaceBoard/useBoardCanvasPersistence.ts:73` persists `getSnapshot(editor.store)`
- `src/components/features/WorkspaceBoard/useBoardCanvasPersistence.ts:108-113` and `:176-177` use `updateInstanceState(...)` and `user.updateUserPreferences(...)`

Inference from this verified code:

- Sherlock's current board implementation already looks much closer to a 4.x-compatible codebase than a typical 3.x app
- this is likely why the isolated upgrade probe was relatively small in code breakage

### 5. Sherlock currently has no visible tldraw license-key plumbing

Verified with:

- `git grep -n "licenseKey" main -- src README.md docs`

Result:

- no matches in active app code or active docs

Implication:

- if Sherlock upgrades to `tldraw 4.x`, production license handling needs to be introduced intentionally

## Official Upstream Findings As Of 2026-04-08

### Stable version status

Verified locally against the npm registry on 2026-04-08:

- `npm view tldraw version dist-tags --json`

Result:

- latest stable: `4.5.8`
- old Sherlock `tldraw-4` branch: `4.5.7`
- current `next`: `4.6.0-next...`

Implication:

- if we migrate now, current stable target should be `4.5.8`, not `4.5.7`

### What 4.0 officially introduced

Official `v4.0.0` release notes say the major release introduced:

- starter kits
- `npm create tldraw`
- WCAG 2.2 Level AA accessibility compliance
- licensing updates
- rich text arrows
- API changes including `--tl-*` CSS variables
- API changes where arrow shapes use `richText` instead of `text`
- removal of `@tldraw/ai` in favor of the agent starter kit

Officially relevant details from `v4.0.0`:

- production deployments require a license key
- localhost and development remain exempt
- available licenses include a free trial, commercial license, and hobby license for non-commercial use

### What later 4.x releases added that could matter to Sherlock

From the official releases index and release notes:

- `v4.1`: shader starter kit, localStorage atoms, minimap filtering
- `v4.2`: TipTap v3, dynamic tools, custom socket implementations
- `v4.3`: SQLite sync storage, improved custom shape types, reactive inputs, draw shape encoding
- `v4.4`: image pipeline starter kit, performance improvements, quick zoom, canvas indicators
- `v4.5`: click-through on transparent image pixels, SVG sanitization, configurable embed definitions

The official `tldraw SDK 4.5` release post on 2026-03-18 adds concrete details:

- transparent image hit-testing now passes clicks through transparent pixels to shapes behind them
- pasted/imported SVGs are sanitized against embedded scripts and other XSS vectors
- supported embed types are now configured per editor instance rather than globally

### Starter-kit licensing and relevance

Official starter-kit docs say:

- starter kits are MIT-licensed example implementations
- they are intended as reference code or project foundations
- starter kits use the same license as the `tldraw` SDK

Implication:

- the starter kits are useful reference architecture
- they are not a drop-in migration mechanism for Sherlock's existing app

## Sherlock-Specific Benefits Of Migrating

These are the benefits that look real for Sherlock, not just generic upstream wins.

### 1. Official licensing alignment is now available

Because Sherlock now has hobby-license approval, the main non-code blocker that would have made a 4.x production deployment awkward is materially reduced.

That does not remove implementation work:

- Sherlock still needs to pass a `licenseKey` into the `Tldraw` surface for non-local environments

### 2. Rich-text arrow support directly aligns with Sherlock's board-agent connector flow

This is the one API difference that already surfaced in the upgrade probe.

Sherlock's board agent creates connector arrows in:

- `src/services/workspace/agent/actions/registry.ts`

Official `v4.0.0` moved arrow labels from `text` to `richText`, and the isolated upgrade confirmed that this exact seam needs updating.

This is a real benefit because Sherlock already uses arrows as semantic board structure, not just freehand drawing.

### 3. Upstream agent and starter-kit patterns are more relevant on 4.x than on 3.x

Official `v4.0.0` removed `@tldraw/ai` and points AI-heavy apps toward the agent starter kit instead.

That matters to Sherlock because it already has:

- a board-agent runtime
- structured board actions
- approval/review flows
- board snapshot context extraction

This does not mean Sherlock should become a stock starter kit.

It does mean:

- 4.x is the upstream era where tldraw's AI and agent guidance is actually centered

### 4. Media handling gets better in ways that fit a research board

Official `v4.5` adds:

- transparent-image click-through
- SVG sanitization

That is useful for Sherlock because the board is a research surface with file/media/link placement, and these are directly relevant to:

- cleaner interaction with layered images
- safer handling of imported SVG content

### 5. Accessibility and UI improvements are legitimate product benefits

Official `v4.0.0` says 4.0 achieved WCAG 2.2 Level AA compliance and improved keyboard and UI behavior.

Sherlock's board is a first-class routed app surface, not a hidden demo canvas, so these improvements are product-quality improvements rather than incidental SDK churn.

## Benefits That Are Probably Lower Priority For Sherlock Right Now

### 1. tldraw sync and SQLite sync storage are not immediate wins by themselves

Official `v4.3` added SQLite sync storage, and tldraw has its own sync stack.

But Sherlock currently persists board documents separately in its own persistence path:

- `workspace_board_documents`
- documented in `docs/operations/DATA_PERSISTENCE.md`

Sherlock is not currently using tldraw sync as its primary persistence model.

Implication:

- the existence of new sync/storage features upstream does not automatically reduce Sherlock migration effort
- these benefits matter more if Sherlock later wants multiplayer or sync-native board collaboration

### 2. Starter kits are reference value, not merge value

Officially, starter kits are foundations and examples.

For Sherlock, they are useful for:

- architectural comparison
- borrowing patterns
- checking upstream agent practices

They are not useful as:

- a direct replacement for Sherlock's workspace shell
- a direct replacement for Sherlock's persistence model
- a direct replacement for Sherlock's board-agent orchestration

## Isolated Upgrade Probe

To avoid interfering with in-progress work on the main working tree, I created a detached worktree at:

- `C:\Users\james\projects\sherlock-tldraw4-feasibility`

### Commands run in the isolated worktree

Baseline on current `main` commit:

- `npm install`
- `npm run typecheck`
- `npm run build`

Upgrade probe:

- `npm install tldraw@4.5.8`
- `npm run typecheck`
- `npm run build`
- `npm run test -- src/components/features/WorkspaceBoard/BoardCanvasPane.test.tsx src/services/workspace/agent/session.test.ts src/services/workspace/agent/actions/registry.test.ts`

Follow-up probe after applying the minimal API fix in the disposable worktree:

- `npm run typecheck`
- `npm run test -- src/services/workspace/agent/actions/registry.test.ts`

### Observed results

Baseline on current `main`:

- typecheck passed
- build passed
- build emitted the known `vendor-tldraw-app` chunk warning at `521.76 kB`

After upgrading only the dependency to `tldraw 4.5.8`:

- typecheck failed once
- build still passed
- targeted board/agent tests passed

The concrete type error was:

- `src/services/workspace/agent/actions/registry.ts:568`
- `Object literal may only specify known properties, and 'text' does not exist in type 'Partial<TLArrowShapeProps>'`

After replacing that arrow label with `richText: toRichText(...)` in the disposable worktree:

- typecheck passed
- targeted registry tests passed

### Bundle impact observed in the probe

Known current build warning:

- `vendor-tldraw-app`: `521.76 kB`

Upgrade-probe build warning:

- `vendor-tldraw-app`: `569.58 kB`

Observed delta:

- `+47.82 kB` minified in the main tldraw app chunk

Implication:

- migration looks code-feasible
- bundle cost likely gets somewhat worse and should be treated as part of the upgrade decision

## Required Work On Current Sherlock Mainline

This is the concrete work that appears required based on local verification and official upstream docs.

### Required for a correct migration

1. Upgrade `tldraw` in `package.json` from `^3.15.6` to current stable `^4.5.8`, then refresh `package-lock.json`.
2. Add production license-key plumbing and decide where the hobby-license key should live.
3. Update the remaining direct arrow-label API usage from `text` to `richText`.
4. Re-run focused board validation on current `main`.

### Areas that should be explicitly regression-tested

- board mount and hydration
- board snapshot persistence
- drag/drop from the Sherlock library rail
- presentation-mode read-only behavior
- custom style panel override
- board-agent action execution, especially connector creation
- file/media placement flows
- route changes between workspace boards

### Areas that should be reviewed but do not yet show verified breakage

- any remaining direct reads of `arrow.props.text`
- any custom event interception that might care about `markEventAsHandled()`
- custom CSS that depends on tldraw UI internals beyond the already-updated `--tl-*` variables
- any future plan to use starter-kit code or tldraw sync features

## What I Would Not Do

I would not:

- try to merge `tldraw-4` back into `main`
- treat the old branch as the implementation target
- adopt starter-kit code directly into Sherlock's existing shell without a separate product decision

Those paths would create more churn than value because the current app has already moved well beyond the old branch structure.

## Recommendation

Recommended path:

1. Treat the old `tldraw-4` branch as historical evidence only.
2. Upgrade current `main` directly to `tldraw 4.5.8`.
3. Add official license-key handling before any non-local deployment.
4. Apply the arrow-label `richText` fix as part of the upgrade.
5. Run `npm run lint`, `npm run typecheck`, targeted board/agent tests, and `npm run build`.
6. Do one browser smoke pass on the board after the dependency bump.

Overall assessment:

- branch-resurrection feasibility: low
- direct upgrade feasibility on current `main`: high
- code-change scope: small
- verification scope: moderate
- operational/license integration scope: moderate

## Source Links

Official sources used:

- tldraw releases index: <https://tldraw.dev/releases>
- tldraw `v3.15.0`: <https://tldraw.dev/releases/v3.15.0>
- tldraw `v4.0.0`: <https://tldraw.dev/releases/v4.0.0>
- tldraw `v4.2.0`: <https://tldraw.dev/releases/v4.2.0>
- tldraw `v4.3.0`: <https://tldraw.dev/releases/v4.3.0>
- tldraw SDK 4.5 release post: <https://tldraw.dev/blog/tldraw-sdk-4.5>
- starter kits overview: <https://tldraw.dev/starter-kits/overview>
- `TldrawBaseProps` reference including `licenseKey`: <https://tldraw.dev/reference/tldraw/TldrawBaseProps>

Local verification sources used:

- `package.json`
- `src/components/features/WorkspaceBoard/*`
- `src/services/workspace/*`
- `docs/operations/DATA_PERSISTENCE.md`
- isolated detached worktree at `C:\Users\james\projects\sherlock-tldraw4-feasibility`
