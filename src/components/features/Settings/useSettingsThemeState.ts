import { useMemo } from 'react';

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

  const applyWorkspace = (nextWorkspace: SherlockThemeWorkspaceState) => {
    onThemeWorkspaceChange(nextWorkspace);
  };

  const updateTheme = (updater: (theme: SherlockTheme) => SherlockTheme) => {
    applyWorkspace(updateActiveDraftTheme(themeWorkspace, updater));
  };

  return {
    activeTheme,
    activeThemeId: themeWorkspace.activeThemeId,
    exportResolvedCss,
    exportThemeJson,
    forkActiveTheme: () => applyWorkspace(forkActiveThemeToNextCustomSlot(themeWorkspace)),
    previewMode: themeWorkspace.previewMode,
    resetActiveThemeFactory: () => applyWorkspace(factoryResetActiveTheme(themeWorkspace)),
    resetAllThemeFactories: () => applyWorkspace(factoryResetAllThemes(themeWorkspace)),
    revertActiveTheme: () => applyWorkspace(revertActiveThemeDraft(themeWorkspace)),
    saveActiveTheme: () => applyWorkspace(saveActiveThemeDraft(themeWorkspace)),
    savedTheme,
    selectTheme: (themeId: string) => applyWorkspace(selectActiveTheme(themeWorkspace, themeId)),
    setPreviewMode: (mode: SherlockThemeWorkspaceState['previewMode']) =>
      applyWorkspace(setThemePreviewMode(themeWorkspace, mode)),
    themeDirty,
    themeWorkspace,
    updateTheme,
  };
};
