import React, { useMemo, useState } from 'react';

import {
  describeThemeFontSize,
  describeThemeFontWeight,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
  type ThemeFontRole,
} from '@/utils/themeFonts';
import {
  getSherlockThemeFontOptionsForRole,
  type SherlockTheme,
  type SherlockThemeMode,
} from '@/system/theme/schema';
import { SETTINGS_CARD_CLASS, SETTINGS_SURFACE_BUTTON_CLASS } from '../settingsUtils';
import { ThemeWorkbenchExportTab } from './ThemeWorkbenchExportTab';
import { ThemeWorkbenchShellTab } from './ThemeWorkbenchShellTab';
import { ThemeWorkbenchThemeTab } from './ThemeWorkbenchThemeTab';
import { ThemeWorkbenchTypeTab } from './ThemeWorkbenchTypeTab';
import {
  clamp,
  getSurfaceBounds,
  type ThemeBackgroundField,
  type ThemeFontProfileField,
  type ThemeGraphField,
  type ThemeStructureKey,
  type ThemeSurfaceField,
  type ThemeWorkbenchTab,
  WORKBENCH_TABS,
} from './shared';

export interface SettingsThemeTabProps {
  activeTheme: SherlockTheme;
  activeThemeId: string;
  exportResolvedCss: string;
  exportThemeJson: string;
  forkActiveTheme: () => void;
  previewMode: SherlockThemeMode;
  resetActiveThemeFactory: () => void;
  resetAllThemeFactories: () => void;
  revertActiveTheme: () => void;
  saveActiveTheme: () => void;
  selectTheme: (themeId: string) => void;
  setPreviewMode: (mode: SherlockThemeMode) => void;
  themeDirty: boolean;
  updateTheme: (updater: (theme: SherlockTheme) => SherlockTheme) => void;
}

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard failures in the workbench UI.
  }
};

export const SettingsThemeTab: React.FC<SettingsThemeTabProps> = ({
  activeTheme,
  activeThemeId,
  exportResolvedCss,
  exportThemeJson,
  forkActiveTheme,
  previewMode,
  resetActiveThemeFactory,
  resetAllThemeFactories,
  revertActiveTheme,
  saveActiveTheme,
  selectTheme,
  setPreviewMode,
  themeDirty,
  updateTheme,
}) => {
  const [activeTab, setActiveTab] = useState<ThemeWorkbenchTab>('theme');
  const [editingMode, setEditingMode] = useState<SherlockThemeMode>(previewMode);
  const [selectedStructureKey, setSelectedStructureKey] = useState<ThemeStructureKey>('panel');
  const [activeFontRole, setActiveFontRole] = useState<ThemeFontRole>('ui');
  const [activeGraphIndex, setActiveGraphIndex] = useState(0);

  const selectedSurface = activeTheme.surfaces[editingMode][selectedStructureKey];
  const selectedBackground = activeTheme.background[editingMode];
  const selectedGraph = activeTheme.graphs[activeGraphIndex];
  const selectedFontProfile = activeTheme.typography.profiles[activeFontRole];
  const surfaceBounds = getSurfaceBounds(editingMode, selectedStructureKey);
  const activeSizeProfile = describeThemeFontSize(activeTheme.typography.size);
  const activeWeightProfile = describeThemeFontWeight(activeTheme.typography.weight);
  const resolvedSizes = resolveThemeFontSizes(activeTheme.typography.size);
  const resolvedWeights = resolveThemeFontWeights(activeTheme.typography.weight);

  const fontRoleOptions = useMemo(
    () =>
      getSherlockThemeFontOptionsForRole(activeFontRole).map((option) => ({
        id: option.id,
        label: option.label,
      })),
    [activeFontRole]
  );

  const updateSurfaceField = (field: ThemeSurfaceField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      surfaces: {
        ...theme.surfaces,
        [editingMode]: {
          ...theme.surfaces[editingMode],
          [selectedStructureKey]: {
            ...theme.surfaces[editingMode][selectedStructureKey],
            [field]:
              field === 'hue'
                ? ((Math.round(rawValue) % 360) + 360) % 360
                : field === 'lightness'
                  ? clamp(
                      Number(rawValue.toFixed(3)),
                      surfaceBounds.lightnessMin,
                      surfaceBounds.lightnessMax
                    )
                  : field === 'opacity'
                    ? clamp(Number(rawValue.toFixed(3)), 0, 1)
                    : clamp(Number(rawValue.toFixed(3)), 0, surfaceBounds.chromaMax),
          },
        },
      },
    }));
  };

  const updateGraphField = (field: ThemeGraphField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      graphs: theme.graphs.map((graph, index) =>
        index === activeGraphIndex
          ? {
              ...graph,
              [field]:
                field === 'hue'
                  ? ((Math.round(rawValue) % 360) + 360) % 360
                  : field === 'opacity'
                    ? clamp(Number(rawValue.toFixed(3)), 0, 1)
                    : clamp(Number(rawValue.toFixed(3)), 0, field === 'lightness' ? 1 : 0.18),
            }
          : graph
      ),
    }));
  };

  const updateBackgroundField = (field: ThemeBackgroundField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      background: {
        ...theme.background,
        ...(field === 'dotColor' || field === 'gridSize'
          ? { [field]: Math.round(rawValue) }
          : field === 'dotOpacity' || field === 'glowOpacity' || field === 'scanlineOpacity'
            ? { [field]: clamp(Number(rawValue.toFixed(3)), 0, 1) }
            : {}),
        ...(field === 'hue' || field === 'lightness' || field === 'chroma' || field === 'opacity'
          ? {
              [editingMode]: {
                ...theme.background[editingMode],
                [field]:
                  field === 'hue'
                    ? ((Math.round(rawValue) % 360) + 360) % 360
                    : field === 'opacity'
                      ? clamp(Number(rawValue.toFixed(3)), 0, 1)
                      : clamp(Number(rawValue.toFixed(3)), 0, field === 'chroma' ? 0.12 : 1),
              },
            }
          : {}),
      },
    }));
  };

  const updateFontProfileField = (field: ThemeFontProfileField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      typography: {
        ...theme.typography,
        profiles: {
          ...theme.typography.profiles,
          [activeFontRole]: {
            ...theme.typography.profiles[activeFontRole],
            [field]:
              field === 'weightAdjust'
                ? Math.round(rawValue)
                : Number(rawValue.toFixed(field === 'trackingAdjust' ? 3 : 2)),
          },
        },
      },
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 pb-12">
      <div className={`${SETTINGS_CARD_CLASS} flex flex-wrap items-center justify-between gap-3`}>
        <div className="inline-flex gap-2">
          {WORKBENCH_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              data-active={activeTab === tab.id ? 'true' : undefined}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="osint-meta-label">
            {themeDirty ? 'Unsaved Draft Changes' : 'Draft Matches Saved Theme'}
          </div>
          <button
            type="button"
            onClick={themeDirty ? saveActiveTheme : revertActiveTheme}
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
          >
            {themeDirty ? 'Save Theme' : 'Revert'}
          </button>
        </div>
      </div>

      {activeTab === 'theme' ? (
        <ThemeWorkbenchThemeTab
          activeGraphIndex={activeGraphIndex}
          activeTheme={activeTheme}
          activeThemeId={activeThemeId}
          editingMode={editingMode}
          forkActiveTheme={forkActiveTheme}
          previewMode={previewMode}
          saveActiveTheme={saveActiveTheme}
          selectedBackground={selectedBackground}
          selectedGraph={selectedGraph}
          selectedStructureKey={selectedStructureKey}
          selectedSurface={selectedSurface}
          selectTheme={selectTheme}
          setActiveGraphIndex={setActiveGraphIndex}
          setEditingMode={setEditingMode}
          setPreviewMode={setPreviewMode}
          setSelectedStructureKey={setSelectedStructureKey}
          surfaceBounds={surfaceBounds}
          updateBackgroundField={updateBackgroundField}
          updateGraphField={updateGraphField}
          updateSurfaceField={updateSurfaceField}
          updateTheme={updateTheme}
        />
      ) : null}

      {activeTab === 'type' ? (
        <ThemeWorkbenchTypeTab
          activeFontRole={activeFontRole}
          activeSizeProfile={activeSizeProfile}
          activeTheme={activeTheme}
          activeWeightProfile={activeWeightProfile}
          fontRoleOptions={fontRoleOptions}
          previewMode={previewMode}
          resolvedSizes={resolvedSizes}
          resolvedWeights={resolvedWeights}
          selectedFontProfile={selectedFontProfile}
          setActiveFontRole={setActiveFontRole}
          updateFontProfileField={updateFontProfileField}
          updateTheme={updateTheme}
        />
      ) : null}

      {activeTab === 'shell' ? (
        <ThemeWorkbenchShellTab
          activeTheme={activeTheme}
          resetActiveThemeFactory={resetActiveThemeFactory}
          resetAllThemeFactories={resetAllThemeFactories}
          revertActiveTheme={revertActiveTheme}
          saveActiveTheme={saveActiveTheme}
          themeDirty={themeDirty}
          updateTheme={updateTheme}
        />
      ) : null}

      {activeTab === 'export' ? (
        <ThemeWorkbenchExportTab
          copyText={copyText}
          exportResolvedCss={exportResolvedCss}
          exportThemeJson={exportThemeJson}
        />
      ) : null}
    </div>
  );
};
