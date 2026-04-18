# tldraw 4.x Migration Plan

Date: 2026-04-08

Status: Proposed

Related inputs:

- `docs/reports/2026-04-08-tldraw-4x-migration-feasibility-report.md`
- `docs/plans/10-canonical-cleanup-roadmap.md`
- `docs/operations/DATA_PERSISTENCE.md`
- `docs/operations/DEPLOYMENT.md`

## Goal

Upgrade Sherlock's current `main` branch from `tldraw ^3.15.6` to `tldraw ^4.5.8` on top of the present codebase, without reviving the historical `tldraw-4` branch and without changing Sherlock's current persistence model.

## Decision Summary

### 1. Upgrade strategy

Use a direct dependency upgrade on current `main`.

Do not:

- merge `tldraw-4` back into `main`
- port the old `tldraw-4` board implementation forward wholesale
- replace Sherlock's board shell with a stock starter-kit structure

### 2. License-key strategy

Recommended:

- handle the tldraw hobby-license key as deployment/app config
- do not expose it through `Settings -> Runtime`

Why this is the recommended fit for Sherlock:

- Sherlock already treats `Settings -> Runtime` as user-facing BYOK configuration for provider keys and runtime behavior
- the tldraw license key is app-level platform configuration, not a per-user preference
- putting it in runtime settings would require each browser profile to re-enter the same key locally
- current docs and persistence rules intentionally keep user runtime settings and provider keys device-local; the tldraw license should not inherit that UX accidentally
- the `licenseKey` must be passed into the client app anyway, so hiding it behind browser-local settings does not materially improve secrecy

Implementation direction:

- source the key from env/app config
- pass it into the board `Tldraw` surface
- leave `Settings -> Runtime` unchanged

## Scope

In scope:

- dependency upgrade to `tldraw ^4.5.8`
- tldraw 4.x API fixes on current board code
- deployment/config plumbing for `licenseKey`
- focused regression validation for board and board-agent behavior
- docs updates reflecting the new version and license handling

Out of scope:

- tldraw sync adoption
- multiplayer/collaboration changes
- starter-kit adoption as an implementation rewrite
- changing Sherlock's board snapshot persistence away from `workspace_board_documents`
- widening `Settings -> Runtime` to become a general app-config console

## Current-State Constraints

- current `main` is 76 commits ahead of historical `tldraw-4`
- current board code is modularized and materially different from the old branch
- board snapshots already persist through Sherlock's existing artifact/board document path
- provider keys remain intentionally device-local in `src/services/providers/keys.ts`
- public deployment guidance currently prefers strict BYOK for provider APIs

## Migration Streams

## Stream 1: Dependency bump and compile fixes

Deliverable:

- Sherlock compiles cleanly on `tldraw ^4.5.8`

Tasks:

1. Update `package.json` to `tldraw ^4.5.8`.
2. Refresh `package-lock.json`.
3. Apply the confirmed 4.x arrow-label API fix in `src/services/workspace/agent/actions/registry.ts`.
4. Search for any remaining direct `arrow.props.text` assumptions and convert them if needed.
5. Run:
   - `npm run lint`
   - `npm run typecheck`
   - targeted board and board-agent tests
   - `npm run build`

Known verified code seam:

- `src/services/workspace/agent/actions/registry.ts`
- arrow labels must use `richText`, not `text`

Exit criteria:

- lint passes
- typecheck passes
- targeted tests pass
- build passes

## Stream 2: License-key plumbing

Deliverable:

- production deployments can pass a valid tldraw hobby-license key without using user runtime settings

Tasks:

1. Introduce a single app-config seam for the tldraw license key.
2. Read the key from env/build-time config.
3. Pass it into the board `Tldraw` surface.
4. Ensure local development still works when the key is absent.
5. Document the expected env var in `.env.example`.

Recommended design constraints:

- no `localStorage` path for the tldraw license
- no `Settings -> Runtime` editing surface
- no backup/restore inclusion
- no mixing with provider-key storage

Suggested config shape:

- one dedicated env var such as `VITE_TLDRAW_LICENSE_KEY`

Exit criteria:

- `Tldraw` receives `licenseKey` in production-capable builds
- local dev remains functional without extra setup
- config location is documented clearly

## Stream 3: Board regression sweep

Deliverable:

- confidence that the board still behaves correctly after the 4.x upgrade

Test focus:

- board mount and snapshot hydration
- board snapshot save path
- drag/drop from library into board
- presentation-mode read-only behavior
- compact style panel override
- board-agent action execution
- connector creation and labeling
- navigation between workspace boards
- file/media placement on board

Validation expectation:

- run only the narrowest credible tests for touched files unless broader regressions appear

Suggested minimum commands:

- `npm run lint`
- `npm run typecheck`
- `npm run test -- src/components/features/WorkspaceBoard/BoardCanvasPane.test.tsx src/services/workspace/agent/session.test.ts src/services/workspace/agent/actions/registry.test.ts`
- `npm run build`

Browser validation:

- one manual smoke pass on the active board route after the code upgrade

Exit criteria:

- no obvious runtime regressions on the board route
- targeted automated checks stay green

## Stream 4: Bundle and release review

Deliverable:

- upgrade lands with explicit awareness of bundle and deploy impact

Observed feasibility-probe delta:

- current `vendor-tldraw-app`: `521.76 kB`
- upgrade probe `vendor-tldraw-app`: `569.58 kB`

Tasks:

1. Confirm the chunk delta on the real branch after migration.
2. Decide whether the increase remains an accepted documented exception or needs further chunk work.
3. Update docs if the known warning size meaningfully changes.

Exit criteria:

- bundle impact is documented
- any warning change is explicitly acknowledged in handoff/docs

## Stream 5: Documentation closeout

Deliverable:

- active docs accurately describe the tldraw version and license/config behavior

Docs to update:

- `README.md`
- `docs/operations/DEPLOYMENT.md`
- `docs/operations/DATA_PERSISTENCE.md` if config handling needs clarification
- `docs/operations/ARCHITECTURE.md` if the board integration seam changes materially

Doc requirements:

- state that Sherlock runs on `tldraw 4.x`
- document the chosen env var for the tldraw license
- keep provider-key BYOK guidance separate from the tldraw license-key guidance
- avoid implying that users must paste the tldraw license into Settings

## Checklist

- [x] Upgrade `tldraw` to `^4.5.8`
- [x] Refresh lockfile
- [x] Replace remaining arrow `text` usage with `richText` where required
- [ ] Search for any other 4.x-sensitive board API assumptions
- [ ] Add `licenseKey` config seam
- [ ] Add `.env.example` guidance for the chosen tldraw license env var
- [ ] Pass `licenseKey` into the board `Tldraw` instance
- [ ] Confirm local dev behavior without a license key
- [ ] Run lint
- [ ] Run typecheck
- [ ] Run targeted board and board-agent tests
- [ ] Run build
- [ ] Do a browser smoke pass on the board
- [ ] Review `vendor-tldraw-app` chunk delta
- [ ] Update README/deployment/docs

## Recommended Implementation Order

1. Stream 1: dependency bump and compile fixes
2. Stream 2: license-key plumbing
3. Stream 3: regression sweep
4. Stream 4: bundle review
5. Stream 5: docs closeout

## Recommendation

Proceed with a direct upgrade on current `main`.

Preferred license handling:

- deployment/app config only

Not recommended unless product direction changes:

- exposing the tldraw license in `Settings -> Runtime`

That settings-based path would only make sense if Sherlock deliberately wanted end users or private self-hosters to supply their own tldraw license from inside the app UI. That is not how Sherlock currently models app-level platform configuration, and it would create extra UX and persistence complexity for little benefit.
