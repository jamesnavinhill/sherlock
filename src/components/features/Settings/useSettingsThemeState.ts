import { useCallback, useMemo } from 'react';

import type {
  SherlockTheme,
  SherlockThemeMode,
  SherlockThemeWorkspaceState,
} from '@/system/theme/schema';
import {
  exportSherlockResolvedCss,
  exportSherlockThemeJson,
  factoryResetActiveTheme,
  factoryResetAllThemes,
  forkActiveThemeToNextCustomSlot,
  getActiveDraftTheme,
  getActiveSavedTheme,
  isActiveThemeDirty,
  revertActiveThemeDraft,
  saveActiveThemeDraft,
  selectActiveTheme,
  updateActiveDraftTheme,
} from '@/system/theme/storage';

interface UseSettingsThemeStateInput {
  onThemeWorkspaceChange: (workspace: SherlockThemeWorkspaceState) => void;
  themeMode: SherlockThemeMode;
  themeWorkspace: SherlockThemeWorkspaceState;
}

export const useSettingsThemeState = ({
  onThemeWorkspaceChange,
  themeMode,
  themeWorkspace,
}: UseSettingsThemeStateInput) => {
  const activeTheme = useMemo(() => getActiveDraftTheme(themeWorkspace), [themeWorkspace]);
  const savedTheme = useMemo(() => getActiveSavedTheme(themeWorkspace), [themeWorkspace]);
  const themeDirty = useMemo(() => isActiveThemeDirty(themeWorkspace), [themeWorkspace]);
  const exportThemeJson = useMemo(() => exportSherlockThemeJson(activeTheme), [activeTheme]);
  const exportResolvedCss = useMemo(
    () => exportSherlockResolvedCss(activeTheme, themeMode),
    [activeTheme, themeMode]
  );

  const applyWorkspace = useCallback(
    (nextWorkspace: SherlockThemeWorkspaceState) => {
      onThemeWorkspaceChange(nextWorkspace);
    },
    [onThemeWorkspaceChange]
  );

  const updateTheme = useCallback(
    (updater: (theme: SherlockTheme) => SherlockTheme) => {
      applyWorkspace(updateActiveDraftTheme(themeWorkspace, updater));
    },
    [applyWorkspace, themeWorkspace]
  );

  const forkActiveTheme = useCallback(
    () => applyWorkspace(forkActiveThemeToNextCustomSlot(themeWorkspace)),
    [applyWorkspace, themeWorkspace]
  );
  const resetActiveThemeFactoryDraft = useCallback(
    () => applyWorkspace(factoryResetActiveTheme(themeWorkspace)),
    [applyWorkspace, themeWorkspace]
  );
  const resetAllThemeFactoryDrafts = useCallback(
    () => applyWorkspace(factoryResetAllThemes(themeWorkspace)),
    [applyWorkspace, themeWorkspace]
  );
  const revertActiveTheme = useCallback(
    () => applyWorkspace(revertActiveThemeDraft(themeWorkspace)),
    [applyWorkspace, themeWorkspace]
  );
  const saveActiveTheme = useCallback(
    () => applyWorkspace(saveActiveThemeDraft(themeWorkspace)),
    [applyWorkspace, themeWorkspace]
  );
  const selectThemeById = useCallback(
    (themeId: string) => applyWorkspace(selectActiveTheme(themeWorkspace, themeId)),
    [applyWorkspace, themeWorkspace]
  );

  return useMemo(
    () => ({
      activeTheme,
      activeThemeId: themeWorkspace.activeThemeId,
      exportResolvedCss,
      exportThemeJson,
      forkActiveTheme,
      resetActiveThemeFactory: resetActiveThemeFactoryDraft,
      resetAllThemeFactories: resetAllThemeFactoryDrafts,
      revertActiveTheme,
      saveActiveTheme,
      savedTheme,
      selectTheme: selectThemeById,
      themeMode,
      themeDirty,
      themeWorkspace,
      updateTheme,
    }),
    [
      activeTheme,
      exportResolvedCss,
      exportThemeJson,
      forkActiveTheme,
      resetActiveThemeFactoryDraft,
      resetAllThemeFactoryDrafts,
      revertActiveTheme,
      saveActiveTheme,
      savedTheme,
      selectThemeById,
      themeMode,
      themeDirty,
      themeWorkspace,
      updateTheme,
    ]
  );
};
