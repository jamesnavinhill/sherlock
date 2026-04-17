import React from 'react';
import { Check, RefreshCw, Save, X } from 'lucide-react';

import { DockPanel } from '@/components/system/layout/DockPanel';
import { PageShell } from '@/components/system/layout/PageShell';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_CONTROL_HEIGHT_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS,
} from '@/components/ui/chrome';
import { MainContentDotGrid } from '@/components/ui/MainContentDotGrid';
import type { InvestigationLaunchRequest } from '@/types';
import { buildAccentColor } from '@/utils/accent';
import type { ThemeBackgroundSettings } from '@/utils/themeBackground';
import type { ThemeFontSettings } from '@/utils/themeFonts';
import type { ThemeSurfaceSettings } from '@/utils/themeSurfaces';
import {
  SETTINGS_TAB_DESCRIPTIONS,
  SURFACE_LABELS,
  TABS,
} from './settingsUtils';
import { SettingsDataTab } from './SettingsDataTab';
import { SettingsDialogs } from './SettingsDialogs';
import { SettingsRuntimeTab } from './SettingsRuntimeTab';
import { SettingsScopesTab } from './SettingsScopesTab';
import { SettingsTemplatesTab } from './SettingsTemplatesTab';
import { SettingsThemeTab } from './SettingsThemeTab';
import { useSettingsController } from './useSettingsController';

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
  const activeTabConfig = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const activeTabDescription = SETTINGS_TAB_DESCRIPTIONS[activeTab];
  const themeSurfaceKeys: Array<keyof ThemeSurfaceSettings['dark']> = [
    'background',
    'panel',
    'surface',
  ];

  const renderActiveTab = () => {
    if (activeTab === 'DATA') {
      return (
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
      );
    }

    if (activeTab === 'RUNTIME') {
      return <SettingsRuntimeTab runtime={runtime} saveError={saveError} />;
    }

    if (activeTab === 'SCOPES') {
      return <SettingsScopesTab />;
    }

    if (activeTab === 'TEMPLATES') {
      return <SettingsTemplatesTab customScopes={customScopes} onStartCase={onStartCase} />;
    }

    return (
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
    );
  };

  const themeSummaryDock =
    activeTab === 'THEME' ? (
      <div className="hidden h-full xl:block">
        <DockPanel placement="right" isOpen widthClassName="w-[min(22rem,24vw)]">
          <div className={`${CHROME_PANEL_HEADER_CLASS} ${CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS}`}>
            <div className="osint-eyebrow">Workbench</div>
            <div className="mt-1 osint-panel-title">Theme Summary</div>
            <div className="mt-2 osint-body-quiet">
              Active mode, current surface target, and the values driving the shared shell.
            </div>
          </div>
          <div className={CHROME_RAIL_BODY_CLASS}>
            <section className="osint-card-section rounded p-4">
              <div className="osint-meta-label">Active Mode</div>
              <div className="mt-2 osint-title-inline capitalize">{theme.activeSurfaceMode}</div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-sm border border-zinc-700"
                  style={{ background: buildAccentColor(accentSettings) }}
                />
                <div className="min-w-0">
                  <div className="osint-meta-label">Accent</div>
                  <div className="truncate osint-body-small">
                    {buildAccentColor(accentSettings)}
                  </div>
                </div>
              </div>
            </section>

            <section className="osint-card-section rounded p-4">
              <div className="osint-meta-label">Selected Surface</div>
              <div className="mt-2 osint-title-inline">
                {SURFACE_LABELS[theme.selectedSurfaceKey]}
              </div>
              <div className="mt-3 grid gap-2">
                {themeSurfaceKeys.map((surfaceKey) => {
                  const surface = themeSurfaceSettings[theme.activeSurfaceMode][surfaceKey];

                  return (
                    <div
                      key={surfaceKey}
                      className="osint-card-section-subtle rounded px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="osint-meta-label">{SURFACE_LABELS[surfaceKey]}</div>
                          <div className="mt-1 osint-body-quiet">
                            h {surface.hue.toFixed(0)} / l {surface.lightness.toFixed(3)} / c{' '}
                            {surface.chroma.toFixed(3)}
                          </div>
                        </div>
                        <div
                          className="h-6 w-6 shrink-0 rounded border border-zinc-700"
                          style={{ background: buildAccentColor(surface) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="osint-card-section rounded p-4">
              <div className="osint-meta-label">Background</div>
              <div className="mt-2 osint-title-inline">
                {themeBackgroundSettings.variant === 'grid' ? 'Dot Grid' : 'Plain'}
              </div>
              <div className="mt-3 osint-body-quiet">
                Dot color {themeBackgroundSettings.dotColor}% and opacity{' '}
                {Math.round(themeBackgroundSettings.dotOpacity * 100)}%.
              </div>
            </section>
          </div>
        </DockPanel>
      </div>
    ) : null;

  return (
    <PageShell
      className="osint-settings-shell h-full w-full"
      toolbar={
        <header className={`${CHROME_HEADER_CLASS} relative z-20 flex items-center justify-between px-6 lg:px-8`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent pointer-events-none" />
          <div className="min-w-0 flex flex-1 items-center gap-3">
            <div className="hidden min-w-0 lg:block">
              <div className="osint-eyebrow">Settings</div>
              <div className="mt-1 truncate osint-panel-title">{activeTabConfig.label}</div>
              <div className="mt-1 truncate osint-body-quiet">{activeTabDescription}</div>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  data-active={activeTab === tab.id ? 'true' : undefined}
                  className="osint-settings-nav-item osint-meta-label font-osint-label flex h-10 shrink-0 items-center gap-2 px-3"
                >
                  <tab.icon className="osint-settings-nav-icon h-3 w-3 shrink-0" />
                  <span className="osint-settings-nav-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ml-4 flex h-full items-center gap-2">
            <button
              onClick={handleSaveConfiguration}
              disabled={isSaving || !canSaveActiveTab}
              className={`osint-button-primary ${CHROME_HEADER_CONTROL_HEIGHT_CLASS} flex items-center px-4 osint-meta-label-strong disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isSaving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
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
      }
      leftRail={
        <div className="hidden h-full lg:block">
          <DockPanel placement="left" isOpen widthClassName="w-[min(15rem,18vw)]">
            <div className={`${CHROME_PANEL_HEADER_CLASS} ${CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS}`}>
              <div className="osint-eyebrow">Settings</div>
              <div className="mt-1 osint-panel-title">Configuration</div>
              <div className="mt-2 osint-body-quiet">
                Move between runtime, data, scope, template, and theme controls from one shell.
              </div>
            </div>
            <div className={`${CHROME_RAIL_BODY_CLASS} gap-3`}>
              <nav className="flex flex-col gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    data-active={activeTab === tab.id ? 'true' : undefined}
                    className="osint-settings-nav-item osint-meta-label font-osint-label flex items-center gap-3 rounded px-3 py-3 text-left"
                  >
                    <tab.icon className="osint-settings-nav-icon h-4 w-4 shrink-0" />
                    <span className="osint-settings-nav-label">{tab.label}</span>
                  </button>
                ))}
              </nav>
              <div className="osint-card-section-subtle rounded p-3">
                <div className="osint-meta-label">Current Tab</div>
                <div className="mt-2 osint-title-inline">{activeTabConfig.label}</div>
                <div className="mt-2 osint-body-quiet">{activeTabDescription}</div>
              </div>
            </div>
          </DockPanel>
        </div>
      }
      rightDock={themeSummaryDock}
    >
      <main className="relative flex-1 overflow-y-auto custom-scrollbar" data-app-scroll-region>
        <div className="relative min-h-full w-full">
          <MainContentDotGrid testId="settings-dot-grid-background" />
          <div className="relative z-10 min-h-full w-full p-6 lg:p-8">{renderActiveTab()}</div>
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
    </PageShell>
  );
};
