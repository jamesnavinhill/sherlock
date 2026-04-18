import React, { useMemo, useState } from 'react';

import { RangeField } from '@/components/system/controls';
import { AccentPicker } from '@/components/ui/AccentPicker';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { buildAccentColor } from '@/utils/accent';
import {
  describeThemeFontSize,
  describeThemeFontWeight,
  getThemeFontOption,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
  type ThemeFontFamilyProfile,
  type ThemeFontRole,
} from '@/utils/themeFonts';
import {
  createDefaultSherlockThemeGraphs,
  SHERLOCK_THEME_BACKGROUND_VARIANTS,
  SHERLOCK_THEME_CONTROL_CHROME_OPTIONS,
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  getSherlockThemeFontOptionsForRole,
  type SherlockTheme,
  type SherlockThemeMode,
  type SherlockThemeSurfaceScale,
} from '@/system/theme/schema';
import {
  SETTINGS_CARD_ACTIVE_CLASS,
  SETTINGS_CARD_CLASS,
  SETTINGS_CARD_INTERACTIVE_CLASS,
  SETTINGS_CARD_SECTION_SUBTLE_CLASS,
  SETTINGS_SECTION_BODY_CLASS,
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from './settingsUtils';

type ThemeWorkbenchTab = 'theme' | 'type' | 'shell' | 'export';
type ThemeStructureKey = keyof SherlockThemeSurfaceScale;

const WORKBENCH_TABS: Array<{ id: ThemeWorkbenchTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'type', label: 'Type' },
  { id: 'shell', label: 'Shell' },
  { id: 'export', label: 'Export' },
];

const STRUCTURE_LABELS: Record<ThemeStructureKey, string> = {
  shell: 'Shell',
  panel: 'Panel',
  rail: 'Rail',
  surface: 'Surface',
};

const FONT_ROLE_LABELS: Record<ThemeFontRole, string> = {
  ui: 'UI Text',
  display: 'Display',
  label: 'Labels',
  mono: 'Data Text',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getSurfaceBounds = (mode: SherlockThemeMode, surfaceKey: ThemeStructureKey) => {
  if (mode === 'dark') {
    const lightnessRanges: Record<ThemeStructureKey, { max: number; min: number }> = {
      shell: { min: 0, max: 0.16 },
      panel: { min: 0, max: 0.24 },
      rail: { min: 0, max: 0.2 },
      surface: { min: 0, max: 0.34 },
    };

    return {
      lightnessMin: lightnessRanges[surfaceKey].min,
      lightnessMax: lightnessRanges[surfaceKey].max,
      chromaMax: 0.08,
    };
  }

  const lightnessRanges: Record<ThemeStructureKey, { max: number; min: number }> = {
    shell: { min: 0.88, max: 1 },
    panel: { min: 0.9, max: 1 },
    rail: { min: 0.88, max: 1 },
    surface: { min: 0.84, max: 0.98 },
  };

  return {
    lightnessMin: lightnessRanges[surfaceKey].min,
    lightnessMax: lightnessRanges[surfaceKey].max,
    chromaMax: 0.1,
  };
};

const getTone = (lightness: number) =>
  lightness >= 0.72
    ? {
        borderColor: 'rgba(82, 63, 40, 0.24)',
        textColor: 'rgba(26, 22, 18, 0.84)',
      }
    : {
        borderColor: 'rgba(255, 255, 255, 0.12)',
        textColor: 'rgba(255, 255, 255, 0.84)',
      };

interface SettingsThemeTabProps {
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
    () => getSherlockThemeFontOptionsForRole(activeFontRole),
    [activeFontRole]
  );

  const updateSurfaceField = (
    field: keyof SherlockThemeSurfaceScale[ThemeStructureKey],
    rawValue: number
  ) => {
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
                  ? clamp(Number(rawValue.toFixed(3)), surfaceBounds.lightnessMin, surfaceBounds.lightnessMax)
                  : field === 'opacity'
                    ? clamp(Number(rawValue.toFixed(3)), 0, 1)
                    : clamp(Number(rawValue.toFixed(3)), 0, surfaceBounds.chromaMax),
          },
        },
      },
    }));
  };

  const updateGraphField = (
    field: keyof SherlockTheme['graphs'][number],
    rawValue: number
  ) => {
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

  const updateBackgroundField = (
    field:
      | keyof SherlockTheme['background'][SherlockThemeMode]
      | 'dotColor'
      | 'dotOpacity'
      | 'gridSize'
      | 'glowOpacity'
      | 'scanlineOpacity',
    rawValue: number
  ) => {
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

  const updateFontProfileField = (field: keyof ThemeFontFamilyProfile, rawValue: number) => {
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

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Ignore clipboard failures in the workbench UI.
    }
  };

  const previewShell = activeTheme.surfaces[previewMode].shell;
  const previewRail = activeTheme.surfaces[previewMode].rail;
  const previewPanel = activeTheme.surfaces[previewMode].panel;
  const previewSurface = activeTheme.surfaces[previewMode].surface;

  const renderThemeTab = () => (
    <div className={SETTINGS_SECTION_BODY_CLASS}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Preview Mode</div>
              <div className="mt-1 osint-title-inline capitalize">{previewMode}</div>
            </div>
            <div className="inline-flex gap-2">
              {(['dark', 'light'] as SherlockThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  data-active={previewMode === mode ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div
            className="grid min-h-[18rem] gap-4 rounded border p-5"
            style={{
              background: buildAccentColor(previewShell),
              borderColor: getTone(previewShell.lightness).borderColor,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="osint-meta-label" style={{ color: getTone(previewShell.lightness).textColor }}>
                  Sherlock Shell Preview
                </div>
                <div className="mt-2 text-2xl" style={{ color: getTone(previewShell.lightness).textColor, fontFamily: 'var(--font-display)', fontWeight: 'var(--font-weight-display)' }}>
                  Theme Workbench
                </div>
              </div>
              <div className="rounded border px-3 py-2" style={{ borderColor: getTone(previewShell.lightness).borderColor, color: getTone(previewShell.lightness).textColor }}>
                {activeTheme.controls.chrome}
              </div>
            </div>

            <div
              className="grid min-h-[11rem] gap-4 rounded border p-4"
              style={{
                background: buildAccentColor(previewRail),
                borderColor: getTone(previewRail.lightness).borderColor,
              }}
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div
                  className="rounded border p-4"
                  style={{
                    background: buildAccentColor(previewPanel),
                    borderColor: getTone(previewPanel.lightness).borderColor,
                    color: getTone(previewPanel.lightness).textColor,
                  }}
                >
                  <div className="osint-meta-label">Utility Rail</div>
                  <div className="mt-3 space-y-2">
                    <div className="rounded border px-3 py-2" style={{ borderColor: getTone(previewPanel.lightness).borderColor }}>
                      Runtime
                    </div>
                    <div className="rounded border px-3 py-2" style={{ borderColor: getTone(previewPanel.lightness).borderColor }}>
                      Templates
                    </div>
                  </div>
                </div>

                <div
                  className="rounded border p-4"
                  style={{
                    background: buildAccentColor(previewSurface),
                    borderColor: getTone(previewSurface.lightness).borderColor,
                    color: getTone(previewSurface.lightness).textColor,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="osint-meta-label">Content Surface</div>
                    <div className="rounded border px-2 py-1" style={{ borderColor: getTone(previewSurface.lightness).borderColor }}>
                      {activeTheme.shell.toolbarHeight}px toolbar
                    </div>
                  </div>
                  <div className="mt-4 text-lg" style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-weight-display)' }}>
                    Operational Summary
                  </div>
                  <p className="mt-3" style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-base)' }}>
                    The shell preview responds to the active theme’s surfaces, typography, chrome,
                    radii, and divider tuning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Active Theme</div>
              <div className="mt-1 osint-title-inline">
                {SHERLOCK_THEME_LIBRARY_TEMPLATES.find((template) => template.id === activeThemeId)?.label ??
                  'Theme'}
              </div>
            </div>
            <div className="inline-flex gap-2">
              {(['dark', 'light'] as SherlockThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditingMode(mode)}
                  data-active={editingMode === mode ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
                >
                  Edit {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SHERLOCK_THEME_LIBRARY_TEMPLATES.map((template) => {
              const isActive = template.id === activeThemeId;
              const darkPanel = template.theme.surfaces.dark.panel;
              const lightPanel = template.theme.surfaces.light.panel;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTheme(template.id)}
                  data-active={isActive ? 'true' : undefined}
                  className={`${SETTINGS_CARD_INTERACTIVE_CLASS} text-left ${isActive ? SETTINGS_CARD_ACTIVE_CLASS : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="osint-meta-label">{template.label}</div>
                      <div className="mt-1 osint-body-quiet">{template.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm border border-zinc-700" style={{ background: buildAccentColor(darkPanel) }} />
                      <div className="h-4 w-4 rounded-sm border border-zinc-700" style={{ background: buildAccentColor(lightPanel) }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Accent</div>
              <div className="mt-1 osint-title-inline">{buildAccentColor(activeTheme.accent)}</div>
            </div>
            <div
              className="h-5 w-5 rounded-sm border border-zinc-700"
              style={{ background: buildAccentColor(activeTheme.accent) }}
            />
          </div>

          <AccentPicker
            hue={activeTheme.accent.hue}
            lightness={activeTheme.accent.lightness}
            chroma={activeTheme.accent.chroma}
            containerClassName="flex flex-col gap-8"
            showPreview={false}
            onChange={(accent) =>
              updateTheme((theme) => ({
                ...theme,
                accent,
              }))
            }
          />
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Background</div>
              <div className="mt-1 osint-title-inline capitalize">
                {activeTheme.background.variant.replace('-', ' ')}
              </div>
            </div>
            <div
              className="h-5 w-5 rounded-sm border border-zinc-700"
              style={{ background: buildAccentColor(selectedBackground) }}
            />
          </div>

          <div className="grid gap-4">
            <div>
              <div className="osint-meta-label mb-2 block">Pattern</div>
              <OsintSelect
                ariaLabel="Theme background pattern"
                value={activeTheme.background.variant}
                onChange={(variant) =>
                  updateTheme((theme) => ({
                    ...theme,
                    background: {
                      ...theme.background,
                      variant: variant as SherlockTheme['background']['variant'],
                    },
                  }))
                }
                triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
                options={SHERLOCK_THEME_BACKGROUND_VARIANTS.map((variant) => ({
                  value: variant.id,
                  label: variant.label,
                }))}
              />
            </div>

            {(
              [
                ['hue', 'Background Hue', 0, 360, 1],
                ['lightness', 'Background Lightness', 0, 1, 0.001],
                ['chroma', 'Background Chroma', 0, 0.12, 0.001],
                ['opacity', 'Background Opacity', 0, 1, 0.01],
                ['dotColor', 'Grid Ink', 0, 100, 1],
                ['dotOpacity', 'Pattern Opacity', 0, 1, 0.01],
                ['gridSize', 'Grid Size', 8, 40, 1],
                ['glowOpacity', 'Background Glow', 0, 1, 0.01],
                ['scanlineOpacity', 'Scanline Strength', 0, 1, 0.01],
              ] as const
            ).map(([field, label, min, max, step]) => {
              const value =
                field in selectedBackground
                  ? selectedBackground[field as keyof typeof selectedBackground]
                  : activeTheme.background[field as keyof SherlockTheme['background']];

              return (
                <RangeField
                  key={field}
                  label={label}
                  value={Number(value)}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(nextValue) => updateBackgroundField(field, nextValue)}
                  formatValue={(nextValue) =>
                    field === 'opacity' ||
                    field === 'dotOpacity' ||
                    field === 'glowOpacity' ||
                    field === 'scanlineOpacity'
                      ? `${Math.round(nextValue * 100)}%`
                      : nextValue.toFixed(
                          field === 'hue' || field === 'dotColor' || field === 'gridSize' ? 0 : 3
                        )
                  }
                />
              );
            })}
          </div>
        </section>
      </div>

      <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="osint-meta-label">Graph Colors</div>
            <div className="mt-1 osint-title-inline">Graph {activeGraphIndex + 1}</div>
          </div>
          <button
            type="button"
            onClick={() =>
              updateTheme((theme) => ({
                ...theme,
                graphs: createDefaultSherlockThemeGraphs(theme.accent),
              }))
            }
            className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-4 py-2 osint-meta-label`}
          >
            Derive From Accent
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {activeTheme.graphs.map((graph, index) => (
                <button
                  key={`graph-${index}`}
                  type="button"
                  onClick={() => setActiveGraphIndex(index)}
                  data-active={activeGraphIndex === index ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-3 text-left`}
                >
                  <span className="osint-title-inline">Graph {index + 1}</span>
                  <span
                    className="h-5 w-5 rounded-sm border border-zinc-700"
                    style={{ background: buildAccentColor(graph) }}
                  />
                </button>
              ))}
            </div>

            <div
              className="min-h-[8rem] rounded border p-5"
              style={{
                background: `linear-gradient(135deg, ${buildAccentColor(selectedGraph)} 0%, color-mix(in oklab, ${buildAccentColor(selectedGraph)} 42%, var(--osint-panel)) 100%)`,
                borderColor: 'color-mix(in oklab, var(--osint-graph-4, var(--osint-border)) 32%, var(--osint-border))',
              }}
            >
              <div className="osint-meta-label text-white/70">Graph Palette Preview</div>
              <div className="mt-2 text-lg text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Graph {activeGraphIndex + 1}
              </div>
              <div className="mt-3 text-sm text-white/80">
                This palette now drives shared graph-theme tokens and graph-linked UI accents.
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {(
              [
                ['hue', 'Hue', 0, 360, 1],
                ['lightness', 'Lightness', 0.3, 0.8, 0.001],
                ['chroma', 'Chroma', 0, 0.18, 0.001],
                ['opacity', 'Opacity', 0, 1, 0.01],
              ] as const
            ).map(([field, label, min, max, step]) => (
              <RangeField
                key={field}
                label={label}
                value={selectedGraph[field]}
                min={min}
                max={max}
                step={step}
                onChange={(nextValue) => updateGraphField(field, nextValue)}
                formatValue={(nextValue) =>
                  field === 'opacity'
                    ? `${Math.round(nextValue * 100)}%`
                    : nextValue.toFixed(field === 'hue' ? 0 : 3)
                }
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,2.05fr)]">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="osint-meta-label">Shell Surfaces</div>
          <div className="grid gap-2">
            {(Object.keys(STRUCTURE_LABELS) as ThemeStructureKey[]).map((surfaceKey) => {
              const surface = activeTheme.surfaces[editingMode][surfaceKey];

              return (
                <button
                  key={surfaceKey}
                  type="button"
                  onClick={() => setSelectedStructureKey(surfaceKey)}
                  data-active={selectedStructureKey === surfaceKey ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-3 text-left`}
                >
                  <div>
                    <div className="osint-title-inline">{STRUCTURE_LABELS[surfaceKey]}</div>
                    <div className="mt-1 osint-meta-label">
                      h {surface.hue.toFixed(0)} / l {surface.lightness.toFixed(3)} / c {surface.chroma.toFixed(3)} / o {Math.round(surface.opacity * 100)}%
                    </div>
                  </div>
                  <div className="h-6 w-6 rounded-sm border border-zinc-700" style={{ background: buildAccentColor(surface) }} />
                </button>
              );
            })}
          </div>

          <div className={SETTINGS_CARD_SECTION_SUBTLE_CLASS}>
            <div className="osint-meta-label">Workbench Actions</div>
            <div className="mt-3 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    surfaces: {
                      ...theme.surfaces,
                      [editingMode]: Object.fromEntries(
                        Object.entries(theme.surfaces[editingMode]).map(([key, surface]) => [
                          key,
                          { ...surface, hue: theme.accent.hue },
                        ])
                      ) as SherlockThemeSurfaceScale,
                    },
                  }))
                }
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
              >
                Match Accent Hue
              </button>
              <button
                type="button"
                onClick={forkActiveTheme}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
              >
                Fork To Custom Slot
              </button>
              <button
                type="button"
                onClick={saveActiveTheme}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
              >
                Save Current Theme
              </button>
            </div>
          </div>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Selected Surface</div>
              <div className="mt-1 osint-title-inline">{STRUCTURE_LABELS[selectedStructureKey]}</div>
            </div>
            <div className="osint-meta-label capitalize">Editing {editingMode}</div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div
              className="grid min-h-[16rem] gap-4 rounded border p-5"
              style={{
                background: buildAccentColor(activeTheme.surfaces[editingMode].shell),
                borderColor: getTone(activeTheme.surfaces[editingMode].shell.lightness).borderColor,
              }}
            >
              <div
                className="grid min-h-[11rem] gap-4 rounded border p-4"
                style={{
                  background: buildAccentColor(activeTheme.surfaces[editingMode].rail),
                  borderColor: getTone(activeTheme.surfaces[editingMode].rail.lightness).borderColor,
                }}
              >
                <div
                  className="rounded border p-4"
                  style={{
                    background: buildAccentColor(activeTheme.surfaces[editingMode].panel),
                    borderColor: getTone(activeTheme.surfaces[editingMode].panel.lightness).borderColor,
                  }}
                >
                  <div
                    className="rounded border p-4"
                    style={{
                      background: buildAccentColor(activeTheme.surfaces[editingMode].surface),
                      borderColor: getTone(activeTheme.surfaces[editingMode].surface.lightness).borderColor,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {(
                [
                  ['hue', 'Hue', 0, 360, 1],
                  ['lightness', 'Lightness', surfaceBounds.lightnessMin, surfaceBounds.lightnessMax, 0.001],
                  ['chroma', 'Chroma', 0, surfaceBounds.chromaMax, 0.001],
                  ['opacity', 'Opacity', 0, 1, 0.01],
                ] as const
              ).map(([field, label, min, max, step]) => (
                <RangeField
                  key={field}
                  label={label}
                  value={selectedSurface[field]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(nextValue) => updateSurfaceField(field, nextValue)}
                  formatValue={(nextValue) =>
                    field === 'opacity'
                      ? `${Math.round(nextValue * 100)}%`
                      : nextValue.toFixed(field === 'hue' ? 0 : 3)
                  }
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderTypeTab = () => (
    <div className={SETTINGS_SECTION_BODY_CLASS}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="osint-meta-label">Font Roles</div>
          <div className="grid gap-2">
            {(['ui', 'display', 'label', 'mono'] as ThemeFontRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveFontRole(role)}
                data-active={activeFontRole === role ? 'true' : undefined}
                className={`${SETTINGS_SURFACE_BUTTON_CLASS} flex items-center justify-between px-3 py-3 text-left`}
              >
                <span className="osint-title-inline">{FONT_ROLE_LABELS[role]}</span>
                <span className="osint-meta-label">{getThemeFontOption(activeTheme.typography[role]).label}</span>
              </button>
            ))}
          </div>

          <div className={SETTINGS_CARD_SECTION_SUBTLE_CLASS}>
            <div className="osint-meta-label">Global Scale</div>
            <div className="mt-3 grid gap-4">
              <RangeField
                label="Size Profile"
                value={activeTheme.typography.size}
                min={-1}
                max={1}
                step={0.05}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    typography: { ...theme.typography, size: nextValue },
                  }))
                }
                formatValue={() => activeSizeProfile.label}
              />

              <RangeField
                label="Weight Profile"
                value={activeTheme.typography.weight}
                min={-1}
                max={1}
                step={0.05}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    typography: { ...theme.typography, weight: nextValue },
                  }))
                }
                formatValue={() => activeWeightProfile.label}
              />
            </div>
          </div>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Active Role</div>
              <div className="mt-1 osint-title-inline">{FONT_ROLE_LABELS[activeFontRole]}</div>
            </div>
            <div className="osint-meta-label">{getThemeFontOption(activeTheme.typography[activeFontRole]).label}</div>
          </div>

          <OsintSelect
            ariaLabel={`${FONT_ROLE_LABELS[activeFontRole]} family`}
            value={activeTheme.typography[activeFontRole]}
            onChange={(value) =>
              updateTheme((theme) => ({
                ...theme,
                typography: {
                  ...theme.typography,
                  [activeFontRole]: value,
                },
              }))
            }
            triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
            portalledMenu
            options={fontRoleOptions.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
          />

          <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} space-y-4`}>
            <div className="osint-meta-label">Selected Role Tuning</div>
            <div className="grid gap-4">
              {(
                [
                  ['sizeAdjust', 'Size Adjust', -0.2, 0.2, 0.01],
                  ['weightAdjust', 'Weight Adjust', -140, 140, 5],
                  ['trackingAdjust', 'Tracking Adjust', -0.1, 0.2, 0.005],
                  ['leadingAdjust', 'Leading Adjust', -0.2, 0.2, 0.01],
                ] as const
              ).map(([field, label, min, max, step]) => (
                <RangeField
                  key={field}
                  label={label}
                  value={selectedFontProfile[field]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(nextValue) => updateFontProfileField(field, nextValue)}
                  formatValue={(nextValue) =>
                    field === 'weightAdjust'
                      ? `${Math.round(nextValue)}`
                      : field === 'trackingAdjust'
                        ? `${nextValue.toFixed(3)}em`
                        : nextValue.toFixed(2)
                  }
                />
              ))}
            </div>
          </div>

          <div className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} space-y-4`}>
            <div className="osint-meta-label">Typography Preview</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'calc(var(--font-size-3xl) * var(--font-display-scale))', fontWeight: 'var(--font-display-weight)', letterSpacing: 'var(--font-display-tracking)', lineHeight: 'var(--font-display-leading)', color: 'var(--osint-text-heading)' }}>
              Operational Summary
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'calc(var(--font-size-base) * var(--font-ui-scale))', fontWeight: 'var(--font-ui-weight)', letterSpacing: 'var(--font-ui-tracking)', lineHeight: 'var(--font-ui-leading)', color: 'var(--osint-text-strong)' }}>
              Theme typography now travels through one source of truth, so shell labels,
              workspace copy, and dense evidence text stay aligned.
            </p>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 'calc(var(--font-size-xs) * var(--font-label-scale))', fontWeight: 'var(--font-label-weight)', letterSpacing: 'var(--font-label-tracking)', lineHeight: 'var(--font-label-leading)', color: 'var(--osint-text-meta)' }}>
              THEME WORKSPACE
            </div>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 'calc(var(--font-size-sm) * var(--font-mono-scale))', fontWeight: 'var(--font-mono-weight)', letterSpacing: 'var(--font-mono-tracking)', lineHeight: 'var(--font-mono-leading)', color: 'var(--osint-text-muted)' }}>
              <code>{`mode=${previewMode}\nbase=${resolvedSizes.base}\nlabel=${resolvedWeights.label}\nroleScale=${(1 + selectedFontProfile.sizeAdjust).toFixed(2)}`}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );

  const renderShellTab = () => (
    <div className={SETTINGS_SECTION_BODY_CLASS}>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
          <div className="osint-meta-label">Geometry</div>
          {(
            [
              ['sidebarWidth', 'Settings Rail Width', 200, 320, 4],
              ['railWidth', 'Shell Rail Width', 260, 420, 4],
              ['utilityWidth', 'Utility Dock Width', 300, 520, 4],
              ['toolbarHeight', 'Toolbar Height', 64, 104, 2],
              ['contentWidth', 'Content Measure', 920, 1360, 20],
            ] as const
          ).map(([field, label, min, max, step]) => (
            <RangeField
              key={field}
              label={label}
              value={activeTheme.shell[field]}
              min={min}
              max={max}
              step={step}
              onChange={(nextValue) =>
                updateTheme((theme) => ({
                  ...theme,
                  shell: {
                    ...theme.shell,
                    [field]: nextValue,
                  },
                }))
              }
              formatValue={(nextValue) => `${Math.round(nextValue)}px`}
            />
          ))}
        </section>

        <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
          <div className="osint-meta-label">Rendering And Chrome</div>

          <div>
            <div className="osint-meta-label mb-2 block">Control Chrome</div>
            <div className="grid gap-2 md:grid-cols-3">
              {SHERLOCK_THEME_CONTROL_CHROME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    updateTheme((theme) => ({
                      ...theme,
                      controls: { chrome: option.id },
                    }))
                  }
                  data-active={activeTheme.controls.chrome === option.id ? 'true' : undefined}
                  className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 text-left`}
                >
                  <div className="osint-title-inline">{option.label}</div>
                  <div className="mt-1 osint-body-quiet">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {(
            [
              ['surfaceOpacity', 'Surface Solidity', 0.4, 1.4, 0.05, '%'],
              ['density', 'Density', 0.85, 1.25, 0.05, '%'],
              ['dividerWidth', 'Divider Width', 0, 4, 1, 'px'],
              ['dividerStrength', 'Divider Strength', 0, 1, 0.05, '%'],
              ['dividerTint', 'Accent Tint', 0, 1, 0.05, '%'],
              ['dividerGlow', 'Divider Glow', 0, 1, 0.05, '%'],
            ] as const
          ).map(([field, label, min, max, step, unit]) => (
            <RangeField
              key={field}
              label={label}
              value={activeTheme.shell[field]}
              min={min}
              max={max}
              step={step}
              onChange={(nextValue) =>
                updateTheme((theme) => ({
                  ...theme,
                  shell: {
                    ...theme.shell,
                    [field]: nextValue,
                  },
                }))
              }
              formatValue={(nextValue) =>
                unit === '%' ? `${Math.round(nextValue * 100)}%` : `${Math.round(nextValue)}${unit}`
              }
            />
          ))}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${SETTINGS_CARD_CLASS} grid gap-5`}>
          <div className="osint-meta-label">Radius System</div>
          {(
            [
              ['shell', 'Shell Radius'],
              ['panel', 'Panel Radius'],
              ['control', 'Control Radius'],
              ['pill', 'Pill Radius'],
            ] as const
          ).map(([field, label]) => (
            <RangeField
              key={field}
              label={label}
              value={activeTheme.radii[field]}
              min={0}
              max={28}
              step={1}
              onChange={(nextValue) =>
                updateTheme((theme) => ({
                  ...theme,
                  radii: {
                    ...theme.radii,
                    [field]: nextValue,
                  },
                }))
              }
              formatValue={(nextValue) => `${Math.round(nextValue)}px`}
            />
          ))}
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-5`}>
          <div className="osint-meta-label">Theme Lifecycle</div>
          <div className="grid gap-3">
            <button type="button" onClick={saveActiveTheme} className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label`}>
              Save Active Theme
            </button>
            <button type="button" onClick={revertActiveTheme} disabled={!themeDirty} className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label disabled:opacity-50`}>
              Revert Unsaved Draft
            </button>
            <button type="button" onClick={resetActiveThemeFactory} className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label`}>
              Factory Reset Active Theme
            </button>
            <button type="button" onClick={resetAllThemeFactories} className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-3 osint-meta-label`}>
              Factory Reset All Themes
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  const renderExportTab = () => (
    <div className={SETTINGS_SECTION_BODY_CLASS}>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Theme JSON</div>
              <div className="mt-1 osint-body-quiet">Saved theme object for import/export.</div>
            </div>
            <button
              type="button"
              onClick={() => void copyText(exportThemeJson)}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
            >
              Copy JSON
            </button>
          </div>
          <pre className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} overflow-x-auto text-xs leading-6 text-zinc-300`}>
            <code>{exportThemeJson}</code>
          </pre>
        </section>

        <section className={`${SETTINGS_CARD_CLASS} flex flex-col gap-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="osint-meta-label">Resolved CSS Vars</div>
              <div className="mt-1 osint-body-quiet">Computed tokens driving the live shell.</div>
            </div>
            <button
              type="button"
              onClick={() => void copyText(exportResolvedCss)}
              className={`${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2 osint-meta-label`}
            >
              Copy CSS
            </button>
          </div>
          <pre className={`${SETTINGS_CARD_SECTION_SUBTLE_CLASS} overflow-x-auto text-xs leading-6 text-zinc-300`}>
            <code>{exportResolvedCss}</code>
          </pre>
        </section>
      </div>
    </div>
  );

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

      {activeTab === 'theme' ? renderThemeTab() : null}
      {activeTab === 'type' ? renderTypeTab() : null}
      {activeTab === 'shell' ? renderShellTab() : null}
      {activeTab === 'export' ? renderExportTab() : null}
    </div>
  );
};
