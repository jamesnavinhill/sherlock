import React, { useMemo, useState } from 'react';

import { RangeField } from '@/components/system/controls';
import { Accordion } from '@/components/ui/Accordion';
import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  describeThemeFontSize,
  describeThemeFontWeight,
  resolveThemeFontSizes,
  resolveThemeFontWeights,
  type ThemeFontRole,
} from '@/utils/themeFonts';
import { buildAccentColor } from '@/utils/accent';
import {
  createDefaultSherlockThemeGraphs,
  getSherlockThemeFontOptionsForRole,
  SHERLOCK_THEME_BACKGROUND_VARIANTS,
  SHERLOCK_THEME_CONTROL_CHROME_OPTIONS,
  SHERLOCK_THEME_LIBRARY_TEMPLATES,
  type SherlockTheme,
  type SherlockThemeMode,
  type SherlockThemeSurfaceScale,
} from '@/system/theme/schema';
import {
  SETTINGS_SELECT_TRIGGER_CLASS,
  SETTINGS_SURFACE_BUTTON_CLASS,
} from '../settingsUtils';
import {
  FONT_ROLE_LABELS,
  STRUCTURE_LABELS,
  THEME_FONT_ROLES,
  WORKBENCH_TABS,
  clamp,
  getSurfaceBounds,
  getTone,
  type ThemeBackgroundField,
  type ThemeFontProfileField,
  type ThemeGraphField,
  type ThemeStructureKey,
  type ThemeSurfaceField,
  type ThemeWorkbenchTab,
} from './shared';

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

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard failures in the workbench host panel.
  }
};

const SECTION_ACTION_BUTTON_CLASS = 'osint-workbench-header-action px-2 py-1 osint-meta-label';
const SURFACE_BUTTON_CLASS = `${SETTINGS_SURFACE_BUTTON_CLASS} px-3 py-2`;
const SECTION_WRAPPER_CLASS = 'space-y-2';

const toggleSection = (
  current: string[],
  sectionId: string
) => (current.includes(sectionId) ? current.filter((item) => item !== sectionId) : [...current, sectionId]);

const PaletteSwatch: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded border border-[color:var(--osint-border)] bg-[var(--osint-card-section-bg)] p-3">
    <div
      className="h-14 rounded border border-[color:var(--osint-raised-outline)]"
      style={{ background: value }}
    />
    <div className="mt-2 osint-meta-label">{label}</div>
    <div className="mt-1 break-all osint-body-quiet">{value}</div>
  </div>
);

const CodePreview: React.FC<{ value: string }> = ({ value }) => (
  <pre className="max-h-72 overflow-auto rounded border border-[color:var(--osint-border)] bg-[var(--osint-card-section-bg)] p-3 text-[11px] leading-5 text-[color:var(--osint-text-muted)]">
    <code>{value}</code>
  </pre>
);

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

  const activeMode = themeMode;
  const activeAccent = activeTheme.accent[activeMode];
  const savedAccent = savedTheme.accent[activeMode];
  const activeGraphs = activeTheme.graphs[activeMode];
  const savedGraphs = savedTheme.graphs[activeMode];
  const activeSurfaces = activeTheme.surfaces[activeMode];
  const selectedSurface = activeSurfaces[selectedStructureKey];
  const selectedBackground = activeTheme.background[activeMode];
  const savedBackground = savedTheme.background[activeMode];
  const selectedGraph = activeGraphs[activeGraphIndex];
  const surfaceBounds = getSurfaceBounds(activeMode, selectedStructureKey);
  const selectedFontProfile = activeTheme.typography.profiles[activeFontRole];
  const activeSizeProfile = describeThemeFontSize(activeTheme.typography.size);
  const activeWeightProfile = describeThemeFontWeight(activeTheme.typography.weight);
  const resolvedSizes = resolveThemeFontSizes(activeTheme.typography.size);
  const resolvedWeights = resolveThemeFontWeights(activeTheme.typography.weight);
  const fontRoleOptions = useMemo(
    () =>
      getSherlockThemeFontOptionsForRole(activeFontRole).map((option) => ({
        value: option.id,
        label: option.label,
      })),
    [activeFontRole]
  );

  const updateSurfaceField = (field: ThemeSurfaceField, rawValue: number) => {
    updateTheme((theme) => ({
      ...theme,
      surfaces: {
        ...theme.surfaces,
        [activeMode]: {
          ...theme.surfaces[activeMode],
          [selectedStructureKey]: {
            ...theme.surfaces[activeMode][selectedStructureKey],
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
      graphs: {
        ...theme.graphs,
        [activeMode]: theme.graphs[activeMode].map((graph, index) =>
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
      },
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
              [activeMode]: {
                ...theme.background[activeMode],
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

  const paletteSwatches = [
    { label: 'Accent', value: buildAccentColor(activeAccent) },
    { label: 'Background', value: buildAccentColor(activeTheme.background[activeMode]) },
    { label: 'Shell', value: buildAccentColor(activeSurfaces.shell) },
    { label: 'Rail', value: buildAccentColor(activeSurfaces.rail) },
    { label: 'Panel', value: buildAccentColor(activeSurfaces.panel) },
    { label: 'Surface', value: buildAccentColor(activeSurfaces.surface) },
    ...activeGraphs.map((graph, index) => ({
      label: `Graph ${index + 1}`,
      value: buildAccentColor(graph),
    })),
  ];

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
        <div className={SECTION_WRAPPER_CLASS}>
          <Accordion
            title="Themes"
            isOpen={openThemeSections.includes('themes')}
            onToggle={() => setOpenThemeSections((current) => toggleSection(current, 'themes'))}
          >
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                {SHERLOCK_THEME_LIBRARY_TEMPLATES.map((template) => (
                  (() => {
                    const tileTone = template.theme.surfaces[activeMode].panel;
                    const isActive = activeThemeId === template.id;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => selectTheme(template.id)}
                        data-active={isActive ? 'true' : undefined}
                        className={`${SURFACE_BUTTON_CLASS} flex min-h-12 items-center justify-center px-3 py-3 text-center`}
                        style={{
                          background: buildAccentColor(tileTone),
                          borderColor: isActive
                            ? 'color-mix(in oklab, var(--osint-primary) 44%, transparent)'
                            : getTone(tileTone.lightness).borderColor,
                          color: getTone(tileTone.lightness).textColor,
                          boxShadow: isActive
                            ? 'inset 0 0 0 1px color-mix(in oklab, var(--osint-primary) 28%, transparent), var(--osint-rail-interaction-shadow)'
                            : undefined,
                        }}
                      >
                        <span className="truncate osint-title-inline">{template.label}</span>
                      </button>
                    );
                  })()
                ))}
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={forkActiveTheme}
                  className={`${SURFACE_BUTTON_CLASS} text-center osint-meta-label`}
                >
                  Fork To Custom Slot
                </button>
                <button
                  type="button"
                  onClick={resetActiveThemeFactory}
                  className={`${SURFACE_BUTTON_CLASS} text-center osint-meta-label`}
                >
                  Factory Reset Active Theme
                </button>
                <button
                  type="button"
                  onClick={resetAllThemeFactories}
                  className={`${SURFACE_BUTTON_CLASS} text-center osint-meta-label`}
                >
                  Factory Reset All Themes
                </button>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="Chrome Family"
            isOpen={openThemeSections.includes('chrome')}
            onToggle={() => setOpenThemeSections((current) => toggleSection(current, 'chrome'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    controls: { ...savedTheme.controls },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-2">
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
                  className={`${SURFACE_BUTTON_CLASS} text-left`}
                >
                  <div className="osint-title-inline">{option.label}</div>
                  <div className="mt-1 osint-body-quiet">{option.description}</div>
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion
            title="Accent"
            isOpen={openThemeSections.includes('accent')}
            onToggle={() => setOpenThemeSections((current) => toggleSection(current, 'accent'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    accent: {
                      ...theme.accent,
                      [activeMode]: { ...savedAccent },
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <div className="rounded border border-[color:var(--osint-raised-outline)] p-4">
                <div className="osint-meta-label">Accent Preview</div>
                <div
                  className="mt-3 h-14 rounded border border-[color:var(--osint-raised-outline)]"
                  style={{ background: buildAccentColor(activeAccent) }}
                />
                <div className="mt-2 osint-body-quiet">{buildAccentColor(activeAccent)}</div>
              </div>
              <RangeField
                label="Hue"
                value={activeAccent.hue}
                min={0}
                max={360}
                step={1}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    accent: {
                      ...theme.accent,
                      [activeMode]: { ...theme.accent[activeMode], hue: Math.round(nextValue) },
                    },
                  }))
                }
                formatValue={(nextValue) => `${Math.round(nextValue)}`}
              />
              <RangeField
                label="Lightness"
                value={activeAccent.lightness}
                min={0.3}
                max={0.8}
                step={0.005}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    accent: {
                      ...theme.accent,
                      [activeMode]: {
                        ...theme.accent[activeMode],
                        lightness: Number(nextValue.toFixed(3)),
                      },
                    },
                  }))
                }
                formatValue={(nextValue) => nextValue.toFixed(3)}
              />
              <RangeField
                label="Chroma"
                value={activeAccent.chroma}
                min={0}
                max={0.18}
                step={0.002}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    accent: {
                      ...theme.accent,
                      [activeMode]: {
                        ...theme.accent[activeMode],
                        chroma: Number(nextValue.toFixed(3)),
                      },
                    },
                  }))
                }
                formatValue={(nextValue) => nextValue.toFixed(3)}
              />
            </div>
          </Accordion>

          <Accordion
            title="Graphs"
            isOpen={openThemeSections.includes('graphs')}
            onToggle={() => setOpenThemeSections((current) => toggleSection(current, 'graphs'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    graphs: {
                      ...theme.graphs,
                      [activeMode]: savedGraphs.map((graph) => ({ ...graph })),
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {activeGraphs.map((graph, index) => (
                  <button
                    key={`graph-${index}`}
                    type="button"
                    onClick={() => setActiveGraphIndex(index)}
                    data-active={activeGraphIndex === index ? 'true' : undefined}
                    className={`${SURFACE_BUTTON_CLASS} flex items-center justify-between text-left`}
                  >
                    <span className="osint-title-inline">Graph {index + 1}</span>
                    <span
                      className="h-5 w-5 rounded-sm border border-[color:var(--osint-raised-outline)]"
                      style={{ background: buildAccentColor(graph) }}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    graphs: {
                      ...theme.graphs,
                      [activeMode]: createDefaultSherlockThemeGraphs(theme.accent[activeMode]),
                    },
                  }))
                }
                className={`${SURFACE_BUTTON_CLASS} text-left osint-meta-label`}
              >
                Derive From Accent
              </button>

              <div
                className="rounded border border-[color:var(--osint-raised-outline)] p-4"
                style={{ background: buildAccentColor(selectedGraph) }}
              >
                <div className="osint-meta-label text-white/75">Selected Graph</div>
                <div className="mt-1 text-sm text-white/90">Graph {activeGraphIndex + 1}</div>
              </div>

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
          </Accordion>

          <Accordion
            title="Background"
            isOpen={openThemeSections.includes('background')}
            onToggle={() => setOpenThemeSections((current) => toggleSection(current, 'background'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    background: {
                      ...theme.background,
                      [activeMode]: { ...savedBackground },
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <div className="rounded border border-[color:var(--osint-raised-outline)] p-3">
                <div className="osint-meta-label">Background</div>
                <div
                  className="mt-3 h-14 rounded border border-[color:var(--osint-raised-outline)]"
                  style={{ background: buildAccentColor(selectedBackground) }}
                />
              </div>

              <OsintSelect
                ariaLabel="Theme background pattern"
                value={selectedBackground.variant}
                onChange={(variant) =>
                  updateTheme((theme) => ({
                    ...theme,
                    background: {
                      ...theme.background,
                      [activeMode]: {
                        ...theme.background[activeMode],
                        variant: variant as SherlockTheme['background'][typeof activeMode]['variant'],
                      },
                    },
                  }))
                }
                triggerClassName={SETTINGS_SELECT_TRIGGER_CLASS}
                portalledMenu
                menuStyle="legacy"
                options={SHERLOCK_THEME_BACKGROUND_VARIANTS.map((variant) => ({
                  value: variant.id,
                  label: variant.label,
                }))}
              />

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
                const value = selectedBackground[field];

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
          </Accordion>

          <Accordion
            title="Surfaces"
            isOpen={openThemeSections.includes('surfaces')}
            onToggle={() => setOpenThemeSections((current) => toggleSection(current, 'surfaces'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    surfaces: {
                      ...theme.surfaces,
                      [activeMode]: {
                        shell: { ...savedTheme.surfaces[activeMode].shell },
                        panel: { ...savedTheme.surfaces[activeMode].panel },
                        rail: { ...savedTheme.surfaces[activeMode].rail },
                        surface: { ...savedTheme.surfaces[activeMode].surface },
                      },
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(STRUCTURE_LABELS) as ThemeStructureKey[]).map((surfaceKey) => (
                  <button
                    key={surfaceKey}
                    type="button"
                    onClick={() => setSelectedStructureKey(surfaceKey)}
                    data-active={selectedStructureKey === surfaceKey ? 'true' : undefined}
                    className={`${SURFACE_BUTTON_CLASS} flex items-center justify-between text-left`}
                  >
                    <span className="osint-title-inline">{STRUCTURE_LABELS[surfaceKey]}</span>
                    <span
                      className="h-5 w-5 rounded-sm border border-[color:var(--osint-raised-outline)]"
                      style={{ background: buildAccentColor(activeSurfaces[surfaceKey]) }}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    surfaces: {
                      ...theme.surfaces,
                      [activeMode]: Object.fromEntries(
                        Object.entries(theme.surfaces[activeMode]).map(([key, surface]) => [
                          key,
                          { ...surface, hue: theme.accent[activeMode].hue },
                        ])
                      ) as SherlockThemeSurfaceScale,
                    },
                  }))
                }
                className={`${SURFACE_BUTTON_CLASS} text-left osint-meta-label`}
              >
                Match Accent Hue
              </button>

              <div
                className="grid min-h-[13rem] gap-3 rounded border p-4"
                style={{
                  background: buildAccentColor(activeSurfaces.shell),
                  borderColor: getTone(activeSurfaces.shell.lightness).borderColor,
                }}
              >
                <div
                  className="grid min-h-[9rem] gap-3 rounded border p-3"
                  style={{
                    background: buildAccentColor(activeSurfaces.rail),
                    borderColor: getTone(activeSurfaces.rail.lightness).borderColor,
                  }}
                >
                  <div
                    className="rounded border p-3"
                    style={{
                      background: buildAccentColor(activeSurfaces.panel),
                      borderColor: getTone(activeSurfaces.panel.lightness).borderColor,
                    }}
                  >
                    <div
                      className="rounded border p-5"
                      style={{
                        background: buildAccentColor(activeSurfaces.surface),
                        borderColor: getTone(activeSurfaces.surface.lightness).borderColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {(
                [
                  ['hue', 'Hue', 0, 360, 1],
                  [
                    'lightness',
                    'Lightness',
                    surfaceBounds.lightnessMin,
                    surfaceBounds.lightnessMax,
                    0.001,
                  ],
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
          </Accordion>
        </div>
      ) : null}

      {activeTab === 'type' ? (
        <div className={SECTION_WRAPPER_CLASS}>
          <Accordion
            title="Role Profiles"
            isOpen={openTypeSections.includes('roles')}
            onToggle={() => setOpenTypeSections((current) => toggleSection(current, 'roles'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    typography: {
                      ...theme.typography,
                      [activeFontRole]: savedTheme.typography[activeFontRole],
                      profiles: {
                        ...theme.typography.profiles,
                        [activeFontRole]: { ...savedTheme.typography.profiles[activeFontRole] },
                      },
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {THEME_FONT_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveFontRole(role)}
                    data-active={activeFontRole === role ? 'true' : undefined}
                    className={`${SURFACE_BUTTON_CLASS} flex items-center text-left`}
                  >
                    <span className="osint-title-inline">{FONT_ROLE_LABELS[role]}</span>
                  </button>
                ))}
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
                menuStyle="legacy"
                options={fontRoleOptions}
              />

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
          </Accordion>

          <Accordion
            title="Global Scale"
            isOpen={openTypeSections.includes('globals')}
            onToggle={() => setOpenTypeSections((current) => toggleSection(current, 'globals'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    typography: {
                      ...theme.typography,
                      size: savedTheme.typography.size,
                      weight: savedTheme.typography.weight,
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <RangeField
                label="Global Size Scale"
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
                label="Global Weight Profile"
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

              <div className="rounded border border-[color:var(--osint-border)] bg-[var(--osint-card-section-bg)] p-3">
                <div className="osint-meta-label">Typography Preview</div>
                <div
                  className="mt-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'calc(var(--font-size-2xl) * var(--font-display-scale))',
                    fontWeight: 'var(--font-display-weight)',
                    letterSpacing: 'var(--font-display-tracking)',
                    lineHeight: 'var(--font-display-leading)',
                    color: 'var(--osint-text-heading)',
                  }}
                >
                  Operational Summary
                </div>
                <p
                  className="mt-3"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'calc(var(--font-size-base) * var(--font-ui-scale))',
                    fontWeight: 'var(--font-ui-weight)',
                    letterSpacing: 'var(--font-ui-tracking)',
                    lineHeight: 'var(--font-ui-leading)',
                    color: 'var(--osint-text-strong)',
                  }}
                >
                  base={resolvedSizes.base} label={resolvedWeights.label}
                </p>
              </div>
            </div>
          </Accordion>
        </div>
      ) : null}

      {activeTab === 'shell' ? (
        <div className={SECTION_WRAPPER_CLASS}>
          <Accordion
            title="Geometry"
            isOpen={openShellSections.includes('geometry')}
            onToggle={() => setOpenShellSections((current) => toggleSection(current, 'geometry'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    shell: {
                      ...theme.shell,
                      sidebarWidth: savedTheme.shell.sidebarWidth,
                      railWidth: savedTheme.shell.railWidth,
                      utilityWidth: savedTheme.shell.utilityWidth,
                      toolbarHeight: savedTheme.shell.toolbarHeight,
                      contentWidth: savedTheme.shell.contentWidth,
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              {(
                [
                  ['sidebarWidth', 'Sidebar Width', 200, 320, 4],
                  ['railWidth', 'Rail Width', 260, 420, 4],
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
            </div>
          </Accordion>

          <Accordion
            title="Rendering"
            isOpen={openShellSections.includes('rendering')}
            onToggle={() => setOpenShellSections((current) => toggleSection(current, 'rendering'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    shell: {
                      ...theme.shell,
                      surfaceOpacity: savedTheme.shell.surfaceOpacity,
                      density: savedTheme.shell.density,
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              <RangeField
                label="Surface Solidity"
                value={activeTheme.shell.surfaceOpacity}
                min={0.4}
                max={1.4}
                step={0.05}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    shell: { ...theme.shell, surfaceOpacity: nextValue },
                  }))
                }
                formatValue={(nextValue) => `${Math.round(nextValue * 100)}%`}
              />

              <RangeField
                label="Density"
                value={activeTheme.shell.density}
                min={0.85}
                max={1.25}
                step={0.05}
                onChange={(nextValue) =>
                  updateTheme((theme) => ({
                    ...theme,
                    shell: { ...theme.shell, density: nextValue },
                  }))
                }
                formatValue={(nextValue) => `${Math.round(nextValue * 100)}%`}
              />
            </div>
          </Accordion>

          <Accordion
            title="Dividers"
            isOpen={openShellSections.includes('dividers')}
            onToggle={() => setOpenShellSections((current) => toggleSection(current, 'dividers'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    shell: {
                      ...theme.shell,
                      dividerWidth: {
                        ...theme.shell.dividerWidth,
                        [activeMode]: savedTheme.shell.dividerWidth[activeMode],
                      },
                      dividerStrength: {
                        ...theme.shell.dividerStrength,
                        [activeMode]: savedTheme.shell.dividerStrength[activeMode],
                      },
                      dividerTint: {
                        ...theme.shell.dividerTint,
                        [activeMode]: savedTheme.shell.dividerTint[activeMode],
                      },
                      dividerGlow: {
                        ...theme.shell.dividerGlow,
                        [activeMode]: savedTheme.shell.dividerGlow[activeMode],
                      },
                    },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
              {(
                [
                  ['dividerWidth', 'Divider Width', 0, 4, 1, 'px'],
                  ['dividerStrength', 'Divider Strength', 0, 1, 0.05, '%'],
                  ['dividerTint', 'Accent Tint', 0, 1, 0.05, '%'],
                  ['dividerGlow', 'Edge Glow', 0, 1, 0.05, '%'],
                ] as const
              ).map(([field, label, min, max, step, unit]) => (
                <RangeField
                  key={field}
                  label={label}
                  value={activeTheme.shell[field][activeMode]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(nextValue) =>
                    updateTheme((theme) => ({
                      ...theme,
                      shell: {
                        ...theme.shell,
                        [field]: {
                          ...theme.shell[field],
                          [activeMode]: nextValue,
                        },
                      },
                    }))
                  }
                  formatValue={(nextValue) =>
                    unit === '%' ? `${Math.round(nextValue * 100)}%` : `${Math.round(nextValue)}px`
                  }
                />
              ))}
            </div>
          </Accordion>

          <Accordion
            title="Radius System"
            isOpen={openShellSections.includes('radius')}
            onToggle={() => setOpenShellSections((current) => toggleSection(current, 'radius'))}
            actions={
              <button
                type="button"
                onClick={() =>
                  updateTheme((theme) => ({
                    ...theme,
                    radii: { ...savedTheme.radii },
                  }))
                }
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Reset
              </button>
            }
            showActionsWhenOpenOnly
          >
            <div className="grid gap-4">
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
            </div>
          </Accordion>
        </div>
      ) : null}

      {activeTab === 'export' ? (
        <div className={SECTION_WRAPPER_CLASS}>
          <Accordion
            title="Token Snapshot"
            isOpen={openExportSections.includes('tokens')}
            onToggle={() => setOpenExportSections((current) => toggleSection(current, 'tokens'))}
            actions={
              <button
                type="button"
                onClick={() => void copyText(exportThemeJson)}
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Copy
              </button>
            }
            showActionsWhenOpenOnly
          >
            <CodePreview value={exportThemeJson} />
          </Accordion>

          <Accordion
            title="Resolved Styles"
            isOpen={openExportSections.includes('css')}
            onToggle={() => setOpenExportSections((current) => toggleSection(current, 'css'))}
            actions={
              <button
                type="button"
                onClick={() => void copyText(exportResolvedCss)}
                className={SECTION_ACTION_BUTTON_CLASS}
              >
                Copy
              </button>
            }
            showActionsWhenOpenOnly
          >
            <CodePreview value={exportResolvedCss} />
          </Accordion>

          <Accordion
            title="Palette Swatches"
            isOpen={openExportSections.includes('swatches')}
            onToggle={() => setOpenExportSections((current) => toggleSection(current, 'swatches'))}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {paletteSwatches.map((swatch) => (
                <PaletteSwatch key={`${swatch.label}-${swatch.value}`} label={swatch.label} value={swatch.value} />
              ))}
            </div>
          </Accordion>
        </div>
      ) : null}
    </div>
  );
};
