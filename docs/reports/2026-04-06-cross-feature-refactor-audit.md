# Cross-Feature Refactor Audit

Date: April 6, 2026

Plan audited: `docs/plans/08-cross-feature-refactor-slice-plan.md`

## Verdict

The refactor made real progress, especially on route shells, selector seams, and feature-level extraction. I do not think the plan is actually complete, though. Several slices are only partially landed, and at least one of the advertised "pure seam" tests no longer completes in a reasonable window.

I would treat this plan as effectively still in progress, or replace the current `Completed` status with a follow-up completion plan.

## Findings

### 1. Medium: the Workspace Board "pure" view-model is still coupled to board UI utilities, and its focused test now times out

- `src/components/features/WorkspaceBoard/workspaceBoardViewModel.ts:18` imports `boardRefKey` from `src/components/features/WorkspaceBoard/workspaceBoardUtils.ts`.
- `src/components/features/WorkspaceBoard/workspaceBoardUtils.ts:1-10` is not a pure helper module. It pulls in `tldraw` types, `CompactStylePanel`, and board-placement helpers, then exports both UI/runtime helpers and `boardRefKey` from the same file.
- That means the view-model seam now depends on the board UI utility module just to build a string key, which defeats the intent of a small pure derivation module.
- Validation evidence: `timeout 60s npm run test -- src/components/features/WorkspaceBoard/workspaceBoardViewModel.test.ts` exited with code `124`, while the comparable Timeline, Chat helper, and route-view tests finished normally.

Why this matters:

- Slice 7 explicitly called for targeted controller/view-model tests and more testable extracted seams (`docs/plans/08-cross-feature-refactor-slice-plan.md:532-560`).
- README also claims the extracted pure seams are covered, including the Workspace Board view-model (`README.md:130-141`).
- Right now the board view-model seam is no longer cleanly isolated, and its dedicated test is not practically runnable.

### 2. Medium: Settings is still a monolithic feature root instead of the planned tab-level decomposition

- The plan called for `Settings/index.tsx` to stay as tab orchestration while tab-level sections were split out into `SettingsRuntimeTab`, `SettingsThemeTab`, `SettingsDataTab`, `SettingsScopesTab`, and `SettingsTemplatesTab` (`docs/plans/08-cross-feature-refactor-slice-plan.md:284-293`).
- In the current implementation, `src/components/features/Settings/index.tsx:171-534` and `src/components/features/Settings/index.tsx:542-1219` still contain large inline render helpers for theme surfaces, fonts, AI configuration, maintenance, and other sections.
- The page still switches tabs inline at `src/components/features/Settings/index.tsx:1221-1283` rather than delegating to tab modules.
- `src/components/features/Settings/useSettingsController.ts:50-360` also remains a broad controller that mixes provider-key handling, runtime-config state, backup/restore flows, and theme editing.

Why this matters:

- Slice 1 and Slice 3 are only partially complete in the feature that was supposed to be one of the main oversized roots.
- The code is better than the old 1600-line single file, but it has not reached the "tab orchestration plus section components" resting state the plan describes.

### 3. Medium: dialog normalization is incomplete because Settings still uses browser `confirm(...)` and `alert(...)`

- `src/components/features/Settings/useSettingsController.ts:299-333` still uses raw `confirm(...)` and `alert(...)` for backup restore and destructive purge flows.
- Slice 4 explicitly called for finishing UI boundary normalization after the browser-dialog cleanup and standardizing destructive confirmations and save/export flows (`docs/plans/08-cross-feature-refactor-slice-plan.md:422-455`).

Why this matters:

- These are some of the highest-risk user actions in the app, but they are still outside the shared modal/dialog pattern used elsewhere.
- The UX is inconsistent, and these flows are harder to test than feature-local dialog modules.

### 4. Medium: the shared runtime-config slice only centralized helper logic; the form/UI layer is still triplicated

- Slice 2 was supposed to stop repeating provider/model/scope/purpose logic across Settings, Task Setup, Guided Run Builder, Templates, and app-shell launch orchestration (`docs/plans/08-cross-feature-refactor-slice-plan.md:339-376`).
- The shared pieces that clearly landed are `runtimeConfigMapping.ts`, `runtimeConfigOptions.ts`, and `ThinkingBudgetControl.tsx`.
- The UI/form layer is still duplicated across:
  - `src/components/features/Settings/index.tsx:831-1079`
  - `src/components/features/Runs/TaskSetupModal.tsx:486-617`
  - `src/components/features/Chat/GuidedRunBuilder.tsx:424-547`
- State and selection logic is also still implemented separately in:
  - `src/components/features/Settings/useSettingsController.ts:147-155`
  - `src/components/features/Runs/useTaskSetupState.ts:130-145`
  - `src/components/features/Runs/useTaskSetupState.ts:224-232`
  - `src/components/features/Chat/GuidedRunBuilder.tsx:89-126`
- The planned shared outputs `ProviderModelSelector`, `RuntimeConfigSummary`, and `useRuntimeConfigForm` did not materialize.

Why this matters:

- Provider/model behavior is less likely to drift than before because the mapping helpers are shared, but the UI/config surfaces still have to stay in sync manually.
- This looks like a partial Slice 2 landing, not a finished consolidation.

### 5. Low: the plan and validation docs currently overstate how finished the refactor is

- The plan itself is marked `Status: Completed` at `docs/plans/08-cross-feature-refactor-slice-plan.md:1-6`.
- README says the Slice 7 closeout sweep is complete and that `npm run test` passes plus the extracted pure seams are covered (`README.md:130-141`).
- In practice:
  - the Settings tab decomposition from Slice 1 is still unfinished
  - the dialog normalization from Slice 4 is still unfinished in Settings
  - the runtime-config UI consolidation from Slice 2 is still unfinished
  - the Workspace Board view-model test currently times out under a 60-second standalone run
  - there are still no focused controller test files for `useChatController`, `useWorkspaceBoardController`, `useTimelineViewController`, `useNetworkGraphController`, `useOperationViewController`, or `useSettingsController`

Why this matters:

- Leaving the refactor marked "done" makes it easier to miss the remaining cleanup work and the current board-test regression.

## Validation

Commands run for this audit:

- `npm run lint` -> passed
- `npm run typecheck` -> passed
- `npm run build` -> passed
  - Build still emits the already-documented large-chunk warning for `vendor-tldraw-app`
- `npm run test -- src/components/features/Timeline/timelineViewModel.test.ts` -> passed
- `npm run test -- src/components/features/Chat/chatPageUtils.test.ts` -> passed
- `npm run test -- src/app/routeViews.test.tsx` -> passed
- `timeout 60s npm run test -- src/components/features/WorkspaceBoard/workspaceBoardViewModel.test.ts` -> timed out with exit code `124`

I did not rerun the full `npm run test` suite after the board view-model test timeout surfaced.

## Suggested Follow-Up Work

1. Move `boardRefKey` into a tiny pure helper so `workspaceBoardViewModel.ts` no longer imports `workspaceBoardUtils.ts`.
2. Finish the Settings split into tab-level components and narrow the controller responsibilities.
3. Replace the remaining Settings backup/purge `confirm(...)` and `alert(...)` flows with feature-local dialog components.
4. Extract the shared runtime-config form layer that Slice 2 originally called for.
5. Add focused tests for the new controller hooks, not just the pure view-model/helper modules.
