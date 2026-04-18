import { useCallback, useMemo } from 'react';

import type { SherlockTheme, SherlockThemeWorkspaceState } from '@/system/theme/schema';
import {
  exportSherlockResolvedCss,
  exportSherlockThemeJson,
  factoryResetActiveTheme,
  factoryResetAllThemes,
  forkActiveThemeToNextCustomSlot,
  getActiveSavedTheme,
  getDisplayTheme,
  isActiveThemeDirty,
  revertActiveThemeDraft,
  saveActiveThemeDraft,
  selectActiveTheme,
  setThemePreviewMode,
  updateActiveDraftTheme,
} from '@/system/theme/storage';

interface UseSettingsThemeStateInput {
  onThemeWorkspaceChange: (workspace: SherlockThemeWorkspaceState) => void;
  themeWorkspace: SherlockThemeWorkspaceState;
}

export const useSettingsThemeState = ({
  onThemeWorkspaceChange,
  themeWorkspace,
}: UseSettingsThemeStateInput) => {
  const activeTheme = useMemo(() => getDisplayTheme(themeWorkspace), [themeWorkspace]);
  const savedTheme = useMemo(() => getActiveSavedTheme(themeWorkspace), [themeWorkspace]);
  const themeDirty = useMemo(() => isActiveThemeDirty(themeWorkspace), [themeWorkspace]);
  const exportThemeJson = useMemo(() => exportSherlockThemeJson(activeTheme), [activeTheme]);
  const exportResolvedCss = useMemo(() => exportSherlockResolvedCss(activeTheme), [activeTheme]);

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
  const setPreviewMode = useCallback(
    (mode: SherlockThemeWorkspaceState['previewMode']) =>
      applyWorkspace(setThemePreviewMode(themeWorkspace, mode)),
    [applyWorkspace, themeWorkspace]
  );

  return useMemo(
    () => ({
      activeTheme,
      activeThemeId: themeWorkspace.activeThemeId,
      exportResolvedCss,
      exportThemeJson,
      forkActiveTheme,
      previewMode: themeWorkspace.previewMode,
      resetActiveThemeFactory: resetActiveThemeFactoryDraft,
      resetAllThemeFactories: resetAllThemeFactoryDrafts,
      revertActiveTheme,
      saveActiveTheme,
      savedTheme,
      selectTheme: selectThemeById,
      setPreviewMode,
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
      setPreviewMode,
      themeDirty,
      themeWorkspace,
      updateTheme,
    ]
  );
};
