import React, { useState } from 'react';

import type { ThemeFontRole } from '@/utils/themeFonts';
import type { SherlockTheme, SherlockThemeMode } from '@/system/theme/schema';
import { SETTINGS_SURFACE_BUTTON_CLASS } from '../settingsUtils';
import { WORKBENCH_TABS, type ThemeStructureKey, type ThemeWorkbenchTab } from './shared';
import { ThemeWorkbenchExportTab } from './ThemeWorkbenchExportTab';
import { ThemeWorkbenchShellTab } from './ThemeWorkbenchShellTab';
import { ThemeWorkbenchThemeTab } from './ThemeWorkbenchThemeTab';
import { ThemeWorkbenchTypeTab } from './ThemeWorkbenchTypeTab';

interface SettingsThemeWorkbenchPanelProps {
  activeTheme: SherlockTheme;
  activeThemeId: string;
  exportResolvedCss: string;
  exportThemeJson: string;
  forkActiveTheme: () => void;
  resetActiveThemeFactory: () => void;
  resetAllThemeFactories: () => void;
  revertActiveTheme: () => void;
  saveActiveTheme: () => void;
  savedTheme: SherlockTheme;
  selectTheme: (themeId: string) => void;
  themeMode: SherlockThemeMode;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

const SURFACE_BUTTON_CLASS = `${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2`;

export const SettingsThemeWorkbenchPanel: React.FC<SettingsThemeWorkbenchPanelProps> = ({
  activeTheme,
  activeThemeId,
  exportResolvedCss,
  exportThemeJson,
  forkActiveTheme,
  resetActiveThemeFactory,
  resetAllThemeFactories,
  revertActiveTheme,
  saveActiveTheme,
  savedTheme,
  selectTheme,
  themeMode,
  updateTheme,
}) => {
  const [activeTab, setActiveTab] = useState<ThemeWorkbenchTab>('theme');
  const [selectedStructureKey, setSelectedStructureKey] = useState<ThemeStructureKey>('panel');
  const [activeFontRole, setActiveFontRole] = useState<ThemeFontRole>('ui');
  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  const [openThemeSections, setOpenThemeSections] = useState<string[]>([]);
  const [openTypeSections, setOpenTypeSections] = useState<string[]>([]);
  const [openShellSections, setOpenShellSections] = useState<string[]>([]);
  const [openExportSections, setOpenExportSections] = useState<string[]>([]);

  return (
    <div className="space-y-3 pb-6">
      <nav aria-label="Theme workbench sections" className="grid grid-cols-4 gap-2">
        {WORKBENCH_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            data-active={activeTab === tab.id ? 'true' : undefined}
            className={`${SURFACE_BUTTON_CLASS} flex min-w-0 items-center justify-center py-2 text-center osint-meta-label`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={saveActiveTheme}
          className={`${SURFACE_BUTTON_CLASS} flex w-full items-center justify-center py-2 osint-meta-label`}
        >
          Save
        </button>
        <button
          type="button"
          onClick={revertActiveTheme}
          className={`${SURFACE_BUTTON_CLASS} flex w-full items-center justify-center py-2 osint-meta-label`}
        >
          Revert
        </button>
      </div>

      {activeTab === 'theme' ? (
        <ThemeWorkbenchThemeTab
          activeGraphIndex={activeGraphIndex}
          activeMode={themeMode}
          activeTheme={activeTheme}
          activeThemeId={activeThemeId}
          forkActiveTheme={forkActiveTheme}
          openSections={openThemeSections}
          resetActiveThemeFactory={resetActiveThemeFactory}
          resetAllThemeFactories={resetAllThemeFactories}
          savedTheme={savedTheme}
          selectTheme={selectTheme}
          selectedStructureKey={selectedStructureKey}
          setActiveGraphIndex={setActiveGraphIndex}
          setOpenSections={setOpenThemeSections}
          setSelectedStructureKey={setSelectedStructureKey}
          updateTheme={updateTheme}
        />
      ) : null}

      {activeTab === 'type' ? (
        <ThemeWorkbenchTypeTab
          activeFontRole={activeFontRole}
          activeTheme={activeTheme}
          openSections={openTypeSections}
          savedTheme={savedTheme}
          setActiveFontRole={setActiveFontRole}
          setOpenSections={setOpenTypeSections}
          updateTheme={updateTheme}
        />
      ) : null}

      {activeTab === 'shell' ? (
        <ThemeWorkbenchShellTab
          activeMode={themeMode}
          activeTheme={activeTheme}
          openSections={openShellSections}
          savedTheme={savedTheme}
          setOpenSections={setOpenShellSections}
          updateTheme={updateTheme}
        />
      ) : null}

      {activeTab === 'export' ? (
        <ThemeWorkbenchExportTab
          activeMode={themeMode}
          activeTheme={activeTheme}
          exportResolvedCss={exportResolvedCss}
          exportThemeJson={exportThemeJson}
          openSections={openExportSections}
          setOpenSections={setOpenExportSections}
        />
      ) : null}
    </div>
  );
};
