import React from 'react';

import type { SherlockThemeMode, SherlockThemeWorkspaceState } from '@/system/theme/schema';
import { useRegisterAppWorkbenchPanel } from '@/app/workbench/useAppWorkbenchHost';
import { SettingsThemeWorkbenchPanel } from '@/components/features/Settings/SettingsThemeWorkbenchPanel';
import { useSettingsThemeState } from '@/components/features/Settings/useSettingsThemeState';

interface ThemeWorkbenchRegistrationProps {
  onThemeWorkspaceChange: (workspace: SherlockThemeWorkspaceState) => void;
  themeMode: SherlockThemeMode;
  themeWorkspace: SherlockThemeWorkspaceState;
}

export const ThemeWorkbenchRegistration: React.FC<ThemeWorkbenchRegistrationProps> = ({
  onThemeWorkspaceChange,
  themeMode,
  themeWorkspace,
}) => {
  const theme = useSettingsThemeState({
    onThemeWorkspaceChange,
    themeMode,
    themeWorkspace,
  });

  const panel = React.useMemo(
    () => ({
      id: 'theme-workbench',
      title: 'Theme Workspace',
      description:
        'Canon-aligned Sherlock theme controls for templates, surfaces, type, shell tuning, and export.',
      defaultOpen: false,
      content: (
        <SettingsThemeWorkbenchPanel
          activeTheme={theme.activeTheme}
          activeThemeId={theme.activeThemeId}
          exportResolvedCss={theme.exportResolvedCss}
          exportThemeJson={theme.exportThemeJson}
          forkActiveTheme={theme.forkActiveTheme}
          resetActiveThemeFactory={theme.resetActiveThemeFactory}
          resetAllThemeFactories={theme.resetAllThemeFactories}
          revertActiveTheme={theme.revertActiveTheme}
          saveActiveTheme={theme.saveActiveTheme}
          savedTheme={theme.savedTheme}
          selectTheme={theme.selectTheme}
          themeMode={theme.themeMode}
          updateTheme={theme.updateTheme}
        />
      ),
    }),
    [
      theme.activeTheme,
      theme.activeThemeId,
      theme.exportResolvedCss,
      theme.exportThemeJson,
      theme.forkActiveTheme,
      theme.resetActiveThemeFactory,
      theme.resetAllThemeFactories,
      theme.revertActiveTheme,
      theme.saveActiveTheme,
      theme.savedTheme,
      theme.selectTheme,
      theme.themeMode,
      theme.updateTheme,
    ]
  );

  useRegisterAppWorkbenchPanel(panel);

  return null;
};
