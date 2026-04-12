import React from 'react';
import { Check, RefreshCw, Save, X } from 'lucide-react';

import type { InvestigationLaunchRequest } from '@/types';
import type { ThemeBackgroundSettings } from '@/utils/themeBackground';
import type { ThemeSurfaceSettings } from '@/utils/themeSurfaces';
import type { ThemeFontSettings } from '@/utils/themeFonts';
import { TABS } from './settingsUtils';
import { useSettingsController } from './useSettingsController';
import { SettingsDataTab } from './SettingsDataTab';
import { SettingsRuntimeTab } from './SettingsRuntimeTab';
import { SettingsScopesTab } from './SettingsScopesTab';
import { SettingsTemplatesTab } from './SettingsTemplatesTab';
import { SettingsThemeTab } from './SettingsThemeTab';
import { SettingsDialogs } from './SettingsDialogs';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_CONTROL_HEIGHT_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
} from '@/components/ui/chrome';
import { MainContentDotGrid } from '@/components/ui/MainContentDotGrid';

interface SettingsProps {
  themeColor: string;
  themeMode: 'dark' | 'light';
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  accentSettings: { hue: number; lightness: number; chroma: number };
  themeBackgroundSettings: ThemeBackgroundSettings;
  onThemeBackgroundSettingsChange: (settings: ThemeBackgroundSettings) => void;
  themeSurfaceSettings: ThemeSurfaceSettings;
  onThemeSurfaceSettingsChange: (settings: ThemeSurfaceSettings) => void;
  themeFontSettings: ThemeFontSettings;
  onThemeFontSettingsChange: (settings: ThemeFontSettings) => void;
  onStartCase: (request: InvestigationLaunchRequest) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  themeColor,
  themeMode,
  onAccentChange,
  accentSettings,
  themeBackgroundSettings,
  onThemeBackgroundSettingsChange,
  themeSurfaceSettings,
  onThemeSurfaceSettingsChange,
  themeFontSettings,
  onThemeFontSettingsChange,
  onStartCase,
  onClose,
}) => {
  const {
    activeTab,
    canSaveActiveTab,
    customScopes,
    data,
    handleSaveConfiguration,
    isSaving,
    runtime,
    saveError,
    saveSuccess,
    setActiveTab,
    theme,
  } = useSettingsController({
    accentSettings,
    onAccentChange,
    onThemeBackgroundSettingsChange,
    onThemeFontSettingsChange,
    onThemeSurfaceSettingsChange,
    themeBackgroundSettings,
    themeColor,
    themeFontSettings,
    themeMode,
    themeSurfaceSettings,
  });

  return (
    <div className="osint-settings-shell h-full w-full bg-black relative flex flex-col overflow-hidden">
      <header className={`${CHROME_HEADER_CLASS} relative z-20 flex items-center justify-between px-8`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent pointer-events-none" />
        <div className="h-full flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-active={activeTab === tab.id ? 'true' : undefined}
              className="osint-settings-nav-item osint-meta-label font-osint-label flex h-full items-center gap-2 px-4"
            >
              <tab.icon className="osint-settings-nav-icon h-3 w-3 shrink-0" />
              <span className="osint-settings-nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="h-full flex items-center gap-2">
          <button
            onClick={handleSaveConfiguration}
            disabled={isSaving || !canSaveActiveTab}
            className={`osint-button-primary ${CHROME_HEADER_CONTROL_HEIGHT_CLASS} flex items-center px-4 osint-meta-label-strong disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Configuration'}
          </button>
          <button
            onClick={onClose}
            className={`osint-button-chrome ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} flex items-center justify-center text-zinc-500 hover:border-[color:var(--osint-danger-soft-border)] hover:text-[color:var(--color-osint-danger)] focus-visible:border-[color:var(--osint-danger-soft-border)] focus-visible:text-[color:var(--color-osint-danger)] focus-visible:ring-2 focus-visible:ring-osint-primary`}
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-y-auto custom-scrollbar" data-app-scroll-region>
        <div className="relative min-h-full w-full">
          <MainContentDotGrid testId="settings-dot-grid-background" />
          <div className="relative z-10 min-h-full w-full p-8">
          {activeTab === 'DATA' ? (
            <SettingsDataTab
              autoResolve={data.autoResolve}
              dataSections={data.dataSections}
              quietMode={data.quietMode}
              fileInputRef={data.fileInputRef}
              onExportData={data.handleExportData}
              onImportJSON={data.handleImportJSON}
              onRequestClearData={data.requestClearData}
              onToggleAutoResolve={() => data.setAutoResolve((current) => !current)}
              onToggleQuietMode={() => data.setQuietMode((current) => !current)}
              toggleDataSection={data.toggleDataSection}
            />
          ) : null}

          {activeTab === 'RUNTIME' ? (
            <SettingsRuntimeTab runtime={runtime} saveError={saveError} />
          ) : null}

          {activeTab === 'SCOPES' ? <SettingsScopesTab /> : null}

          {activeTab === 'TEMPLATES' ? (
            <SettingsTemplatesTab customScopes={customScopes} onStartCase={onStartCase} />
          ) : null}

          {activeTab === 'THEME' ? (
            <SettingsThemeTab
              accentSettings={accentSettings}
              onAccentChange={onAccentChange}
              themeBackgroundSettings={themeBackgroundSettings}
              themeSurfaceSettings={themeSurfaceSettings}
              themeFontSettings={themeFontSettings}
              onThemeFontSettingsChange={onThemeFontSettingsChange}
              activeSurfaceMode={theme.activeSurfaceMode}
              selectedSurfaceKey={theme.selectedSurfaceKey}
              themeSections={theme.themeSections}
              getSurfaceBounds={theme.getSurfaceBounds}
              setActiveSurfaceMode={theme.setActiveSurfaceMode}
              setSelectedSurfaceKey={theme.setSelectedSurfaceKey}
              toggleThemeSection={theme.toggleThemeSection}
              handleResetThemeSettings={theme.handleResetThemeSettings}
              handleResetFonts={theme.handleResetFonts}
              handleResetSelectedSurface={theme.handleResetSelectedSurface}
              handleApplySurfacePreset={theme.handleApplySurfacePreset}
              handleResetSurfaceMode={theme.handleResetSurfaceMode}
              handleMatchAccentHue={theme.handleMatchAccentHue}
              handleAdjustModeChroma={theme.handleAdjustModeChroma}
              handleAdjustModeSeparation={theme.handleAdjustModeSeparation}
              updateThemeBackgroundField={theme.updateThemeBackgroundField}
              handleThemeBackgroundVariantChange={theme.handleThemeBackgroundVariantChange}
              updateSelectedSurfaceField={theme.updateSelectedSurfaceField}
            />
          ) : null}
          </div>
        </div>
      </main>

      <SettingsDialogs
        feedbackDialog={data.feedbackDialog}
        pendingImportName={data.pendingImportName}
        showImportDialog={!!data.pendingImportData}
        showPurgeDialog={data.showPurgeDialog}
        onCloseFeedbackDialog={data.closeFeedbackDialog}
        onCloseImportDialog={data.closeImportDialog}
        onClosePurgeDialog={data.closePurgeDialog}
        onConfirmImport={data.confirmImportData}
        onConfirmPurge={data.confirmClearData}
      />
    </div>
  );
};
