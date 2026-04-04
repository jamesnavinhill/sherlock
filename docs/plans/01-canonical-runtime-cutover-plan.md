# Canonical Runtime Cutover Plan

Date: 2026-04-03
Status: Active

## Objective

Complete the next cleanup phase by:

- making `Workspace`, `Artifact`, and `WorkspaceRun` the dominant runtime vocabulary
- removing broad compatibility aliases and helpers from active runtime code where they are no longer needed
- pruning persistence leftovers that do not match the real product model, including the unused `feed_items` table path

## Decisions Locked In

### 1. Runtime naming cutover should be aggressive

Preferred direction:

- active app/runtime/store code should use `Workspace`, `Artifact`, and `WorkspaceRun`
- `useWorkspaceStore` should be the active store hook
- `workspaces`, `artifacts`, and `workspaceRuns` should be the active state collections

This is a real cutover, not another compatibility-first pass.

### 2. Compatibility pruning should be aggressive in active runtime code

Preferred direction:

- remove broad runtime aliases once touched code is migrated
- keep compatibility only where it still materially serves persistence/import boundaries or current data safety
- do not keep investigation-era aliases in the active app shell just because they existed earlier

### 3. Feed results remain transient; saved signals remain canonical

Settled product model:

- Finder/Feed discovery results are transient scan output
- Live Monitor events are transient until promoted into persisted `Headline` records
- saved `Headline` records are the canonical durable signal path

Therefore:

- `feed_items` should not remain as an unused persistence pathway

## Execution Streams

### Stream 1: Active Runtime Naming Cutover

Primary targets:

- `src/App.tsx`
- `src/store/caseStore.ts`
- active feature modules under `src/components/features/*`
- active UI modules under `src/components/ui/*`
- shared runtime-facing utility/types files

Required work:

1. Replace runtime type aliases with canonical names in active code.
2. Use `useWorkspaceStore` everywhere in active runtime code.
3. Make `workspaces`, `artifacts`, `workspaceRuns`, and `activeWorkspaceId` the standard state surface.
4. Remove deprecated runtime collection aliases once callsites are migrated.

### Stream 2: Compatibility Pruning

Primary targets:

- `src/types/index.ts`
- `src/store/caseStore.ts`
- runtime-facing helper modules
- schema/bootstrap files where obviously unused compatibility fields remain

Required work:

1. Remove `Case`, `InvestigationReport`, and `InvestigationTask` type aliases from active runtime code.
2. Remove the `useCaseStore` export alias once imports are migrated.
3. Remove no-longer-used compatibility fields/helpers such as `parent_topic` where the runtime no longer depends on them.
4. Leave persistence-edge compatibility only where it still serves real import or database safety.

### Stream 3: Persistence Leftover Cleanup

Primary targets:

- `src/services/db/schema.ts`
- `src/services/db/migrations_sql.ts`
- `src/services/db/migrations/*`
- `src/services/db/migrations/meta/*`

Required work:

1. Remove the unused `feed_items` schema/bootstrap path.
2. Keep Feed discovery results transient in store/runtime only.
3. Keep saved `Headline` records as the durable signal layer.

## Validation Expectations

- `npm run lint`
- targeted tests covering store/runtime cleanup and timeline/workspace-data behavior
- `npm run build`

Run the full test suite later if this cutover expands beyond a well-bounded runtime slice.
