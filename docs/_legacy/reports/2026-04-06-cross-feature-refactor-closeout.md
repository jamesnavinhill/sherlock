# Cross-Feature Refactor Closeout Report

Date: April 6, 2026

Plan closed: `docs/plans/08-cross-feature-refactor-slice-plan.md`

## Summary

Slices 5 through 7 are now landed in this checkout, and the final validation gate passed.

## Slice 5 Closeout

Completed outcomes:

- app-shell selectors were split by responsibility in `src/store/selectors/featureSelectors.ts`:
  - `useAppShellLaunchTaskState`
  - `useAppShellRouteState`
  - `useAppShellThemeUiState`
  - `useAppShellLookupState`
  - `useAppShellBootstrapState`
- Settings selectors were narrowed:
  - `useSettingsDataMaintenanceState`
  - `useSettingsScopeState`
- app-shell controller helper seams were extracted:
  - `src/app/appShellLaunchHelpers.ts`
  - `src/app/appShellOpenChatHelpers.ts`
  - `src/app/appShellNavigationHelpers.ts`
- controller store escape hatches were reduced by routing required state/actions through selectors in app-shell and Operation View controller paths.

## Slice 6 Closeout

Completed outcomes:

- bootstrap read handling is now explicit via `src/store/actions/bootstrapResourceLoader.ts`:
  - `[bootstrap][skip]` for recoverable reads with fallbacks
  - `[bootstrap][fail]` for fail-fast reads when configured
- `bootstrapActions` now uses the shared loader helper and shared JSON parse helper (`parseStoredJson`) for legacy config parsing.
- repository mapping patterns were normalized further with explicit row/domain mappers:
  - `TaskRepository`
  - `TemplateRepository`
- malformed persisted-data coverage was extended in repository/bootstrap tests.

## Slice 7 Closeout

Completed outcomes:

- focused tests were added for the requested controller/helper seams:
  - `useChatController.test.ts`
  - `useWorkspaceBoardController.test.ts`
  - `useTimelineViewController.test.ts`
  - `useNetworkGraphController.test.ts`
  - `useOperationViewController.test.ts`
  - `useSettingsController.test.ts`
  - app-shell helper seam tests
- existing pure seam tests remain passing (`workspaceBoardViewModel`, `timelineViewModel`, `chatPageUtils`).
- route coverage (`src/app/routeViews.test.tsx`) remains passing.
- docs were updated across README, architecture, persistence operations, and plan status.

## Final Validation Gate

Passed on April 6, 2026:

- `npm run lint`
- `npm run typecheck`
- targeted slice tests for touched seams
- `npm run test`
- `npm run build`

Build note:

- Vite still reports a single large chunk warning for `vendor-tldraw-app` (`521.76 kB` minified). This remains a documented exception.
