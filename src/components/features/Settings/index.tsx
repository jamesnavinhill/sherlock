import React from 'react';
import { Check, RefreshCw, Save, X } from 'lucide-react';

import type { InvestigationLaunchRequest } from '@/types';
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

interface SettingsProps {
  themeColor: string;
  themeMode: 'dark' | 'light';
  onAccentChange: (settings: { hue: number; lightness: number; chroma: number }) => void;
  accentSettings: { hue: number; lightness: number; chroma: number };
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
    onThemeFontSettingsChange,
    onThemeSurfaceSettingsChange,
    themeColor,
    themeFontSettings,
    themeMode,
    themeSurfaceSettings,
  });

  return (
    <div className="h-full w-full bg-black relative flex flex-col overflow-hidden">
      <header className="h-20 px-8 bg-zinc-900/45 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between relative z-20 flex-shrink-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent pointer-events-none" />
        <div className="h-full flex items-center space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-osint-label h-full px-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-osint-primary text-osint-primary'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="h-full flex items-center gap-2">
          <button
            onClick={handleSaveConfiguration}
            disabled={isSaving || !canSaveActiveTab}
            className="font-osint-label osint-button-primary flex items-center px-4 py-2 text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="osint-button-chrome p-2 text-zinc-500 hover:border-[color:var(--osint-danger-soft-border)] hover:text-[color:var(--color-osint-danger)] focus-visible:border-[color:var(--osint-danger-soft-border)] focus-visible:text-[color:var(--color-osint-danger)] focus-visible:ring-2 focus-visible:ring-osint-primary"
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
        <div className="w-full">
          {activeTab === 'DATA' ? (
            <SettingsDataTab
              autoResolve={data.autoResolve}
              quietMode={data.quietMode}
              fileInputRef={data.fileInputRef}
              onExportData={data.handleExportData}
              onImportJSON={data.handleImportJSON}
              onRequestClearData={data.requestClearData}
              onToggleAutoResolve={() => data.setAutoResolve((current) => !current)}
              onToggleQuietMode={() => data.setQuietMode((current) => !current)}
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
              handleApplySurfacePreset={theme.handleApplySurfacePreset}
              handleResetSurfaceMode={theme.handleResetSurfaceMode}
              handleMatchAccentHue={theme.handleMatchAccentHue}
              handleAdjustModeChroma={theme.handleAdjustModeChroma}
              handleAdjustModeSeparation={theme.handleAdjustModeSeparation}
              updateSelectedSurfaceField={theme.updateSelectedSurfaceField}
            />
          ) : null}
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
